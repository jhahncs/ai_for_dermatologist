/**
 * API service for communicating with the Flask backend.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Check if the backend server is healthy
 */
export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};

/**
 * Get list of available prediction models
 */
export const getAvailableModels = async () => {
  const response = await fetch(`${API_BASE_URL}/models`);
  return response.json();
};

/**
 * Preprocess CSV file without running prediction
 * @param {File} file - CSV file with gene expression data
 * @returns {Promise} Preprocessed data with cache key
 */
export const preprocessData = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/preprocess`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Preprocessing failed');
  }

  return data;
};

/**
 * Submit a prediction request (legacy mode with direct file upload)
 * @param {File} file - CSV file with gene expression data
 * @param {string} modelType - Type of model to use for prediction
 * @returns {Promise} Prediction results
 */
export const submitPrediction = async (file, modelType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_type', modelType);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Prediction failed');
  }

  return data;
};

/**
 * Submit prediction request with patient selection (using cached data)
 * @param {string} cacheKey - Cache key from preprocess endpoint
 * @param {string} modelType - Type of model to use for prediction
 * @param {Array<string>} patientIds - Array of selected patient IDs
 * @returns {Promise} Prediction results
 */
export const submitPredictionWithSelection = async (cacheKey, modelType, patientIds) => {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cache_key: cacheKey,
      model_type: modelType,
      patient_ids: patientIds,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Prediction failed');
  }

  return data;
};

/**
 * Get baseline/normal gene expression data for comparison
 * @returns {Promise} Baseline data with gene expression values
 */
export const getBaselineData = async () => {
  const response = await fetch(`${API_BASE_URL}/baseline`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch baseline data');
  }

  return data;
};
