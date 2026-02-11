/**
 * ResultsDisplay Component
 * Displays prediction results in a table and gene expression visualization
 */

import React, { useState, useEffect } from 'react';
import './ResultsDisplay.css';
import GeneBoxPlot from './GeneBoxPlot';
import { getBaselineData } from '../services/api';

function ResultsDisplay({ predictions, modelType, patientCount, processingTime, topGenes }) {
  const [sortColumn, setSortColumn] = useState('patient_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterPrediction, setFilterPrediction] = useState('all');
  const [baselineData, setBaselineData] = useState(null);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState(null);

  // Fetch baseline data when component mounts
  useEffect(() => {
    const fetchBaseline = async () => {
      // Only fetch if we have top genes for visualization
      if (!topGenes || topGenes.length === 0) {
        return;
      }

      setBaselineLoading(true);
      setBaselineError(null);

      try {
        const data = await getBaselineData();
        setBaselineData(data);
      } catch (err) {
        console.error('Failed to fetch baseline data:', err);
        setBaselineError(err.message);
      } finally {
        setBaselineLoading(false);
      }
    };

    fetchBaseline();
  }, [topGenes]);

  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Calculate summary statistics
  const yesCount = predictions.filter(p => p.prediction === 'yes').length;
  const noCount = predictions.filter(p => p.prediction === 'no').length;
  const endotype1Count = predictions.filter(p => p.endotype === 'endotype_1').length;
  const endotype2Count = predictions.filter(p => p.endotype === 'endotype_2').length;
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
          <div className="summary-label">Endotype 1</div>
          <div className="summary-value" style={{ color: '#e74c3c' }}>{endotype1Count}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Endotype 2</div>
          <div className="summary-value" style={{ color: '#f39c12' }}>{endotype2Count}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Negative</div>
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
              <th onClick={() => handleSort('endotype')} className="sortable">
                Classification
                {sortColumn === 'endotype' && (
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
                  <span className={`prediction-badge ${
                    prediction.endotype === 'endotype_1' ? 'endotype1' :
                    prediction.endotype === 'endotype_2' ? 'endotype2' :
                    'negative'
                  }`}>
                    {prediction.endotype === 'endotype_1' ? 'Endotype 1' :
                     prediction.endotype === 'endotype_2' ? 'Endotype 2' :
                     'Negative'}
                  </span>
                </td>
                <td>{(prediction.confidence * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gene Expression Visualization Section */}
      {topGenes && topGenes.length > 0 && (
        <div className="visualization-section">
          <h2 className="visualization-header">Gene Expression Comparison</h2>
          <p className="visualization-subtitle">
            Comparing top {topGenes.length} variant genes between selected patients and normal baseline
          </p>

          {baselineLoading && (
            <div className="baseline-loading">
              <div className="spinner"></div>
              <p>Loading baseline data...</p>
            </div>
          )}

          {baselineError && (
            <div className="baseline-error">
              <p>⚠️ Unable to load baseline data: {baselineError}</p>
              <p>Visualization is unavailable.</p>
            </div>
          )}

          {!baselineLoading && !baselineError && baselineData && (
            <GeneBoxPlot
              selectedPatientsData={predictions}
              baselineData={baselineData}
              topGenes={topGenes}
              title={`Top ${topGenes.length} Variant Genes: Selected Patients vs Normal Baseline`}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default ResultsDisplay;
