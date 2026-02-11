import React, { useState, useEffect } from 'react';
import './PatientSelectionTable.css';

/**
 * PatientSelectionTable Component
 *
 * Displays preprocessed patient data in a table with checkboxes for selection.
 * Allows users to select specific patients for prediction.
 */
const PatientSelectionTable = ({ data, cacheKey, modelType, onRunPrediction, onBack }) => {
  const [selectedPatients, setSelectedPatients] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { preview_data, gene_columns, patient_count, total_genes } = data;

  // Reset selection when data changes
  useEffect(() => {
    setSelectedPatients(new Set());
    setSelectAll(false);
  }, [data]);

  // Toggle individual patient selection
  const togglePatient = (patientId) => {
    setSelectedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPatients(new Set());
    } else {
      const allPatientIds = preview_data.map(p => p.patient_id);
      setSelectedPatients(new Set(allPatientIds));
    }
    setSelectAll(!selectAll);
  };

  // Update selectAll state when individual selections change
  useEffect(() => {
    setSelectAll(selectedPatients.size === preview_data.length && preview_data.length > 0);
  }, [selectedPatients, preview_data.length]);

  // Handle run prediction button click
  const handleRunPrediction = () => {
    const selectedIds = Array.from(selectedPatients);
    onRunPrediction(selectedIds);
  };

  return (
    <div className="patient-selection-container">
      <div className="selection-header">
        <h2>Select Patients for Prediction</h2>
        <div className="selection-info">
          <div className="info-item">
            <span className="info-label">Total Patients:</span>
            <span className="info-value">{patient_count}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Genes:</span>
            <span className="info-value">{total_genes}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Selected:</span>
            <span className="info-value selected-count">
              {selectedPatients.size} of {patient_count}
            </span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  title="Select All"
                />
              </th>
              <th>Patient ID</th>
              {gene_columns.map((gene, idx) => (
                <th key={idx}>{gene}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview_data.map((patient) => (
              <tr key={patient.patient_id} className={selectedPatients.has(patient.patient_id) ? 'selected-row' : ''}>
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedPatients.has(patient.patient_id)}
                    onChange={() => togglePatient(patient.patient_id)}
                  />
                </td>
                <td className="patient-id">{patient.patient_id}</td>
                {patient.gene_data.map((value, idx) => (
                  <td key={idx} className="gene-value">{value.toFixed(4)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <button
          className="back-button"
          onClick={onBack}
        >
          Back to Upload
        </button>
        <button
          className="predict-button"
          onClick={handleRunPrediction}
          disabled={selectedPatients.size === 0}
        >
          {selectedPatients.size === 0
            ? 'Select Patients to Predict'
            : `Run Prediction (${selectedPatients.size} ${selectedPatients.size === 1 ? 'patient' : 'patients'})`
          }
        </button>
      </div>
    </div>
  );
};

export default PatientSelectionTable;
