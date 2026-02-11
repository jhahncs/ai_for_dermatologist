"""Flask application for atopic dermatitis prediction."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
import time
import uuid

from models.svm_model import SVMModel
from models.neural_network_model import NeuralNetworkModel
from models.random_forest_model import RandomForestModel
from models.logistic_regression_model import LogisticRegressionModel
from utils.csv_processor import CSVProcessor
from utils.stats_helper import calculate_top_variant_genes
from config import Config
import pandas as pd

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

# In-memory cache for preprocessed data
PREPROCESSED_CACHE = {}
CACHE_EXPIRATION_SECONDS = 3600  # 1 hour


def cleanup_old_cache():
    """Remove cache entries older than CACHE_EXPIRATION_SECONDS."""
    current_time = time.time()
    keys_to_delete = [
        key for key, value in PREPROCESSED_CACHE.items()
        if current_time - value['timestamp'] > CACHE_EXPIRATION_SECONDS
    ]
    for key in keys_to_delete:
        del PREPROCESSED_CACHE[key]
    if keys_to_delete:
        app.logger.info(f"Cleaned up {len(keys_to_delete)} expired cache entries")


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200


@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available models."""
    return jsonify({"models": list(MODELS.keys())}), 200


@app.route('/api/baseline', methods=['GET'])
def get_baseline():
    """
    Return baseline/normal gene expression data for comparison in visualizations.

    Returns:
        JSON with baseline patient count and gene expression data
    """
    try:
        # Path to baseline data file
        baseline_path = os.path.join(os.path.dirname(__file__), 'data', 'baseline_normal.csv')

        if not os.path.exists(baseline_path):
            return jsonify({
                "success": False,
                "error": "Baseline data file not found",
                "error_type": "server_error"
            }), 500

        # Read baseline CSV
        df = pd.read_csv(baseline_path)

        # First column is patient IDs
        patient_ids = df.iloc[:, 0].tolist()

        # Remaining columns are gene expression values
        gene_df = df.iloc[:, 1:]
        gene_columns = gene_df.columns.tolist()

        # Prepare gene_data dictionary: {gene_name: [values...]}
        gene_data = {}
        for gene in gene_columns:
            gene_data[gene] = gene_df[gene].tolist()

        return jsonify({
            "success": True,
            "baseline_patients": len(patient_ids),
            "gene_columns": gene_columns,
            "gene_data": gene_data
        }), 200

    except Exception as e:
        app.logger.error(f"Baseline data error: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Failed to load baseline data",
            "error_type": "server_error"
        }), 500


@app.route('/api/preprocess', methods=['POST'])
def preprocess():
    """
    Preprocess endpoint - validates and preprocesses CSV without prediction.

    Expects multipart/form-data with:
        - file: CSV file with gene expression data

    Returns:
        JSON with preprocessed data preview and cache key for later prediction
    """
    try:
        # Clean up old cache entries
        cleanup_old_cache()

        # Validate request has file
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file provided",
                "error_type": "validation_error"
            }), 400

        file = request.files['file']

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

            # Generate cache key
            cache_key = str(uuid.uuid4())

            # Store in cache
            PREPROCESSED_CACHE[cache_key] = {
                'df': df,
                'patient_ids': patient_ids,
                'timestamp': time.time()
            }

            # Get gene column names (all columns except patient ID)
            gene_columns = df.columns.tolist()

            # Prepare preview data with first 5 genes
            preview_data = []
            num_genes_to_show = min(5, len(gene_columns))

            for idx, patient_id in enumerate(patient_ids):
                gene_data = df.iloc[idx, :num_genes_to_show].tolist()
                preview_data.append({
                    'patient_id': patient_id,
                    'gene_data': [round(float(val), 4) for val in gene_data]
                })

            return jsonify({
                "success": True,
                "cache_key": cache_key,
                "patient_count": len(patient_ids),
                "gene_columns": gene_columns[:num_genes_to_show],
                "total_genes": len(gene_columns),
                "preview_data": preview_data
            }), 200

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
        app.logger.error(f"Preprocess error: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "An internal error occurred during preprocessing. Please try again.",
            "error_type": "server_error"
        }), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Prediction endpoint.

    Accepts either:
    1. Multipart/form-data with file (legacy mode):
        - file: CSV file with gene expression data
        - model_type: one of the available model types

    2. JSON with cache_key (new mode):
        - cache_key: key from /api/preprocess
        - model_type: one of the available model types
        - patient_ids: (optional) list of patient IDs to predict

    Returns:
        JSON with predictions for each patient
    """
    try:
        # Check if this is a cached request (JSON) or file upload (form-data)
        is_cached = request.is_json

        if is_cached:
            # New mode: using cached data
            data = request.get_json()
            cache_key = data.get('cache_key')
            model_type = data.get('model_type')
            selected_patient_ids = data.get('patient_ids')

            # Validate cache_key
            if not cache_key:
                return jsonify({
                    "success": False,
                    "error": "No cache key provided",
                    "error_type": "validation_error"
                }), 400

            # Validate model_type
            if not model_type:
                return jsonify({
                    "success": False,
                    "error": "No model type specified",
                    "error_type": "validation_error"
                }), 400

            # Validate model type
            if model_type not in MODELS:
                return jsonify({
                    "success": False,
                    "error": f"Invalid model type '{model_type}'. Must be one of: {', '.join(MODELS.keys())}",
                    "error_type": "validation_error"
                }), 400

            # Clean up old cache entries
            cleanup_old_cache()

            # Retrieve from cache
            if cache_key not in PREPROCESSED_CACHE:
                return jsonify({
                    "success": False,
                    "error": "Cache expired or invalid. Please re-upload the file.",
                    "error_type": "cache_error"
                }), 400

            cached_data = PREPROCESSED_CACHE[cache_key]
            df = cached_data['df']
            patient_ids = cached_data['patient_ids']

            # Filter by selected patient IDs if provided
            if selected_patient_ids:
                # Find indices of selected patients
                selected_indices = [i for i, pid in enumerate(patient_ids) if pid in selected_patient_ids]

                if not selected_indices:
                    return jsonify({
                        "success": False,
                        "error": "No valid patient IDs found in selection",
                        "error_type": "validation_error"
                    }), 400

                # Filter dataframe and patient_ids
                df = df.iloc[selected_indices].reset_index(drop=True)
                patient_ids = [patient_ids[i] for i in selected_indices]

        else:
            # Legacy mode: direct file upload
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

            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception as e:
                        app.logger.warning(f"Failed to delete temp file {tmp_path}: {str(e)}")

        # Get model and predict
        model = MODELS[model_type]
        results = model.predict(df, patient_ids)

        # Enrich results with gene expression data for visualization
        gene_columns = df.columns.tolist()

        # Add gene expression data to each prediction
        for idx, prediction in enumerate(results['predictions']):
            gene_expression = {}
            for gene_idx, gene_name in enumerate(gene_columns):
                gene_expression[gene_name] = float(df.iloc[idx, gene_idx])
            prediction['gene_expression'] = gene_expression

        # Calculate top variant genes
        top_variant_genes = calculate_top_variant_genes(df, n=10)

        # Add additional data to results
        results['gene_columns'] = gene_columns
        results['top_variant_genes'] = top_variant_genes

        return jsonify(results), 200

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
