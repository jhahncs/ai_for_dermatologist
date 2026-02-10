/**
 * Main App Component
 * Atopic Dermatitis Prediction Application
 */

import React, { useState } from 'react';
import './App.css';
import ModelSelector from './components/ModelSelector';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import ErrorMessage from './components/ErrorMessage';
import { submitPrediction } from './services/api';

function App() {
  const [selectedModel, setSelectedModel] = useState('svm');
  const [file, setFile] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const result = await submitPrediction(file, selectedModel);
      setPredictions(result);
    } catch (err) {
      setError(err.message || 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPredictions(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Atopic Dermatitis Prediction</h1>
          <p className="header-subtitle">
            Upload gene expression data to predict atopic dermatitis using machine learning
          </p>
        </div>
      </header>

      <main className="App-main">
        <div className="container">
          {error && (
            <ErrorMessage
              error={error}
              onDismiss={() => setError(null)}
            />
          )}

          <div className="input-section">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={loading}
            />

            <FileUpload
              onFileSelect={setFile}
              disabled={loading}
              selectedFile={file}
              onPredict={handlePredict}
              onReset={handleReset}
            />
          </div>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Processing predictions...</p>
            </div>
          )}

          {predictions && !loading && (
            <ResultsDisplay
              predictions={predictions.predictions}
              modelType={predictions.model_type}
              patientCount={predictions.patient_count}
              processingTime={predictions.processing_time_ms}
            />
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>RNA gene expression analysis for atopic dermatitis research</p>
      </footer>
    </div>
  );
}

export default App;
