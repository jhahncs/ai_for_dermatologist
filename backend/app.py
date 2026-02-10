"""Flask application for atopic dermatitis prediction."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile

from models.svm_model import SVMModel
from models.neural_network_model import NeuralNetworkModel
from models.random_forest_model import RandomForestModel
from models.logistic_regression_model import LogisticRegressionModel
from utils.csv_processor import CSVProcessor
from config import Config

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGINS)

# Configure app
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE

# Initialize models
MODELS = {
    "svm": SVMModel(),
    "neural_network": NeuralNetworkModel(),
    "random_forest": RandomForestModel(),
    "logistic_regression": LogisticRegressionModel()
}


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200


@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available models."""
    return jsonify({"models": list(MODELS.keys())}), 200


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Prediction endpoint.

    Expects multipart/form-data with:
        - file: CSV file with gene expression data
        - model_type: one of the available model types

    Returns:
        JSON with predictions for each patient
    """
    try:
        # Validate request has file
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file provided",
                "error_type": "validation_error"
            }), 400

        # Validate request has model_type
        if 'model_type' not in request.form:
            return jsonify({
                "success": False,
                "error": "No model type specified",
                "error_type": "validation_error"
            }), 400

        file = request.files['file']
        model_type = request.form['model_type']

        # Validate model type
        if model_type not in MODELS:
            return jsonify({
                "success": False,
                "error": f"Invalid model type '{model_type}'. Must be one of: {', '.join(MODELS.keys())}",
                "error_type": "validation_error"
            }), 400

        # Validate file exists
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No file selected",
                "error_type": "validation_error"
            }), 400

        # Validate file extension
        if not file.filename.lower().endswith('.csv'):
            return jsonify({
                "success": False,
                "error": "File must be a CSV (.csv extension required)",
                "error_type": "validation_error"
            }), 400

        # Save file temporarily
        with tempfile.NamedTemporaryFile(mode='w+b', suffix='.csv', delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            # Process CSV
            df, patient_ids = CSVProcessor.process_csv(tmp_path)

            # Get model and predict
            model = MODELS[model_type]
            results = model.predict(df, patient_ids)

            return jsonify(results), 200

        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception as e:
                    app.logger.warning(f"Failed to delete temp file {tmp_path}: {str(e)}")

    except ValueError as e:
        # Validation errors from CSV processing
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": "validation_error"
        }), 400

    except Exception as e:
        # Unexpected server errors
        app.logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "An internal error occurred during prediction. Please try again.",
            "error_type": "server_error"
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors."""
    return jsonify({
        "success": False,
        "error": f"File is too large. Maximum size is {Config.MAX_FILE_SIZE // (1024*1024)}MB",
        "error_type": "validation_error"
    }), 413


@app.errorhandler(500)
def internal_server_error(error):
    """Handle internal server errors."""
    app.logger.error(f"Internal server error: {str(error)}", exc_info=True)
    return jsonify({
        "success": False,
        "error": "An internal server error occurred",
        "error_type": "server_error"
    }), 500


if __name__ == '__main__':
    print(f"Starting Flask server on http://localhost:{Config.PORT}")
    print(f"Available models: {', '.join(MODELS.keys())}")
    print(f"CORS enabled for: {', '.join(Config.CORS_ORIGINS)}")
    app.run(debug=Config.DEBUG, port=Config.PORT, host='0.0.0.0')
