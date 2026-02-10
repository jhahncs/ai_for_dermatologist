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
 * Submit a prediction request
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
