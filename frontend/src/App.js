/**
 * Main App Component
 * Atopic Dermatitis Prediction Application
 */

import React, { useState } from 'react';
import './App.css';
import ModelSelector from './components/ModelSelector';
import FileUpload from './components/FileUpload';
import PatientSelectionTable from './components/PatientSelectionTable';
import ResultsDisplay from './components/ResultsDisplay';
import ErrorMessage from './components/ErrorMessage';
import { preprocessData, submitPredictionWithSelection } from './services/api';

function App() {
  const [selectedModel, setSelectedModel] = useState('svm');
  const [file, setFile] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for 2-step workflow
  const [preprocessedData, setPreprocessedData] = useState(null);
  const [cacheKey, setCacheKey] = useState(null);
  const [viewMode, setViewMode] = useState('upload'); // 'upload' | 'selection' | 'results'

  // Handle preview data button click
  const handlePredict = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await preprocessData(file);
      setPreprocessedData(result);
      setCacheKey(result.cache_key);
      setViewMode('selection');
    } catch (err) {
      setError(err.message || 'An error occurred during preprocessing');
    } finally {
      setLoading(false);
    }
  };

  // Handle run prediction with selected patients
  const handleRunPrediction = async (selectedPatientIds) => {
    if (!cacheKey) {
      setError('Cache expired. Please re-upload the file.');
      return;
    }

    if (selectedPatientIds.length === 0) {
      setError('Please select at least one patient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitPredictionWithSelection(cacheKey, selectedModel, selectedPatientIds);
      setPredictions(result);
      setViewMode('results');
    } catch (err) {
      setError(err.message || 'An error occurred during prediction');
      // If cache expired, go back to upload view
      if (err.message.includes('Cache expired') || err.message.includes('cache')) {
        setViewMode('upload');
        setPreprocessedData(null);
        setCacheKey(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle back to upload view
  const handleBack = () => {
    setViewMode('upload');
    setPreprocessedData(null);
    setCacheKey(null);
    setPredictions(null);
    setError(null);
  };

  const handleReset = () => {
    setFile(null);
    setPredictions(null);
    setPreprocessedData(null);
    setCacheKey(null);
    setViewMode('upload');
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

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>
                {viewMode === 'upload' ? 'Loading data...' : 'Running prediction...'}
              </p>
            </div>
          )}

          {viewMode === 'upload' && !loading && (
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
          )}

          {viewMode === 'selection' && !loading && preprocessedData && (
            <PatientSelectionTable
              data={preprocessedData}
              cacheKey={cacheKey}
              modelType={selectedModel}
              onRunPrediction={handleRunPrediction}
              onBack={handleBack}
            />
          )}

          {viewMode === 'results' && !loading && predictions && (
            <>
              <ResultsDisplay
                predictions={predictions.predictions}
                modelType={predictions.model_type}
                patientCount={predictions.patient_count}
                processingTime={predictions.processing_time_ms}
                topGenes={predictions.top_variant_genes}
              />
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  className="back-button"
                  onClick={handleBack}
                  style={{
                    padding: '12px 30px',
                    fontSize: '1em',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                  }}
                >
                  New Prediction
                </button>
              </div>
            </>
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
