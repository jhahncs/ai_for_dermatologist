/**
 * ModelSelector Component
 * Allows users to select a prediction model
 */

import React from 'react';
import './ModelSelector.css';

const MODEL_INFO = {
  svm: {
    name: 'Support Vector Machine (SVM)',
    description: 'Uses kernel methods to find optimal decision boundaries between classes'
  },
  neural_network: {
    name: 'Neural Network',
    description: 'Deep learning model that learns complex patterns through multiple layers'
  },
  random_forest: {
    name: 'Random Forest',
    description: 'Ensemble model combining multiple decision trees for robust predictions'
  },
  logistic_regression: {
    name: 'Logistic Regression',
    description: 'Linear model that predicts probability of class membership'
  }
};

function ModelSelector({ selectedModel, onModelChange, disabled }) {
  return (
    <div className="model-selector">
      <h2>Select Prediction Model</h2>
      <div className="model-options">
        {Object.keys(MODEL_INFO).map((modelKey) => (
          <label
            key={modelKey}
            className={`model-option ${selectedModel === modelKey ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
          >
            <input
              type="radio"
              name="model"
              value={modelKey}
              checked={selectedModel === modelKey}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={disabled}
            />
            <div className="model-info">
              <div className="model-name">{MODEL_INFO[modelKey].name}</div>
              <div className="model-description">{MODEL_INFO[modelKey].description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default ModelSelector;
