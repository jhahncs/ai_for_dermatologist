/**
 * ResultsDisplay Component
 * Displays prediction results in a table
 */

import React, { useState } from 'react';
import './ResultsDisplay.css';

function ResultsDisplay({ predictions, modelType, patientCount, processingTime }) {
  const [sortColumn, setSortColumn] = useState('patient_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterPrediction, setFilterPrediction] = useState('all');

  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Calculate summary statistics
  const yesCount = predictions.filter(p => p.prediction === 'yes').length;
  const noCount = predictions.filter(p => p.prediction === 'no').length;
  const avgConfidence = (predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(2);

  // Filter predictions
  let filteredPredictions = predictions;
  if (filterPrediction !== 'all') {
    filteredPredictions = predictions.filter(p => p.prediction === filterPrediction);
  }

  // Sort predictions
  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (sortColumn === 'confidence') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Patient ID', 'Prediction', 'Confidence'];
    const rows = predictions.map(p => [
      p.patient_id,
      p.prediction,
      p.confidence
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${modelType}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="results-display">
      <div className="results-header">
        <h2>Prediction Results</h2>
        <button className="export-button" onClick={exportToCSV}>
          Export CSV
        </button>
      </div>

      <div className="results-summary">
        <div className="summary-item">
          <div className="summary-label">Model</div>
          <div className="summary-value">{modelType.replace('_', ' ').toUpperCase()}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Total Patients</div>
          <div className="summary-value">{patientCount}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Positive (Yes)</div>
          <div className="summary-value positive">{yesCount}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Negative (No)</div>
          <div className="summary-value negative">{noCount}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Avg Confidence</div>
          <div className="summary-value">{avgConfidence}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Processing Time</div>
          <div className="summary-value">{processingTime.toFixed(0)}ms</div>
        </div>
      </div>

      <div className="results-controls">
        <label>
          Filter:
          <select value={filterPrediction} onChange={(e) => setFilterPrediction(e.target.value)}>
            <option value="all">All Predictions</option>
            <option value="yes">Positive Only</option>
            <option value="no">Negative Only</option>
          </select>
        </label>
        <div className="results-count">
          Showing {sortedPredictions.length} of {predictions.length} predictions
        </div>
      </div>

      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('patient_id')} className="sortable">
                Patient ID
                {sortColumn === 'patient_id' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
              <th onClick={() => handleSort('prediction')} className="sortable">
                Prediction
                {sortColumn === 'prediction' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
              <th onClick={() => handleSort('confidence')} className="sortable">
                Confidence
                {sortColumn === 'confidence' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPredictions.map((prediction, index) => (
              <tr key={index}>
                <td>{prediction.patient_id}</td>
                <td>
                  <span className={`prediction-badge ${prediction.prediction}`}>
                    {prediction.prediction === 'yes' ? 'Positive' : 'Negative'}
                  </span>
                </td>
                <td>{(prediction.confidence * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsDisplay;
