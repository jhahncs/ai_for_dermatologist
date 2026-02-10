# Atopic Dermatitis Prediction Web Application

A web application for predicting atopic dermatitis from RNA gene expression data using machine learning models.

## Features

- **Multiple ML Models**: Choose from 4 different prediction models:
  - Support Vector Machine (SVM)
  - Neural Network
  - Random Forest
  - Logistic Regression

- **Easy CSV Upload**: Drag-and-drop or browse to upload gene expression data
- **Real-time Predictions**: Get instant predictions with confidence scores
- **Results Export**: Download prediction results as CSV
- **Responsive UI**: Works on desktop and mobile devices

## Project Structure

```
ai_for_dermatologist/
├── backend/               # Flask REST API
│   ├── app.py            # Main Flask application
│   ├── config.py         # Configuration settings
│   ├── requirements.txt  # Python dependencies
│   ├── models/           # ML model implementations
│   │   ├── base_model.py
│   │   ├── svm_model.py
│   │   ├── neural_network_model.py
│   │   ├── random_forest_model.py
│   │   └── logistic_regression_model.py
│   └── utils/            # Utility functions
│       └── csv_processor.py
├── frontend/             # React application
│   ├── src/
│   │   ├── App.js       # Main component
│   │   ├── components/  # UI components
│   │   └── services/    # API client
│   └── package.json
└── test_sample.csv      # Sample test data
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the Flask server:
```bash
python app.py
```

The backend server will start at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The React app will open at `http://localhost:3000`

## Usage

1. **Select a Model**: Choose one of the 4 available prediction models from the first section

2. **Upload CSV File**:
   - Drag and drop a CSV file or click to browse
   - CSV format: Rows = patients, Columns = genes
   - First column can be patient IDs (optional)
   - Max file size: 10MB

3. **Get Predictions**: Click "Predict Atopic Dermatitis" to submit

4. **View Results**:
   - Summary statistics (positive/negative counts, confidence)
   - Detailed table with patient IDs and predictions
   - Sort and filter results
   - Export results as CSV

## CSV File Format

Your CSV file should have the following format:

```csv
patient_id,GENE1,GENE2,GENE3,GENE4,GENE5
P001,5.2,3.1,7.8,2.4,9.1
P002,4.8,6.3,5.5,8.2,3.7
P003,7.1,2.9,6.4,4.5,5.8
```

- **First column**: Patient IDs (optional, will be auto-generated if not provided)
- **Other columns**: Gene expression values (must be numeric)
- Missing values are automatically filled with column means

A sample test file is provided: `test_sample.csv`

## API Endpoints

### GET /api/health
Health check endpoint
- **Response**: `{"status": "ok"}`

### GET /api/models
Get list of available models
- **Response**: `{"models": ["svm", "neural_network", "random_forest", "logistic_regression"]}`

### POST /api/predict
Submit prediction request
- **Request**:
  - Content-Type: `multipart/form-data`
  - Parameters:
    - `file`: CSV file
    - `model_type`: Model name (string)
- **Response**:
```json
{
  "success": true,
  "model_type": "svm",
  "patient_count": 5,
  "predictions": [
    {
      "patient_id": "P001",
      "prediction": "yes",
      "confidence": 0.85
    }
  ],
  "processing_time_ms": 245
}
```

## Development

### Running Tests

Backend tests (to be added):
```bash
cd backend
pytest
```

Frontend tests:
```bash
cd frontend
npm test
```

### Building for Production

Frontend build:
```bash
cd frontend
npm run build
```

## Technology Stack

**Backend:**
- Flask - Web framework
- Flask-CORS - Cross-origin resource sharing
- pandas - Data processing
- numpy - Numerical computations

**Frontend:**
- React - UI framework
- Axios - HTTP client
- CSS3 - Styling

## Notes

- Current models are mock implementations for demonstration purposes
- For production use, replace with trained ML models
- Predictions are deterministic (same input = same output)

## License

This project is for educational and research purposes.

## Contributors

Developed for atopic dermatitis prediction research.
