"""Mock Neural Network model implementation."""

import numpy as np
from .base_model import BaseModel


class NeuralNetworkModel(BaseModel):
    """Mock Neural Network model using weighted sum of features."""

    def __init__(self):
        super().__init__("neural_network")

    def _predict_logic(self, data: np.ndarray):
        """
        Use weighted sum of first N gene values with threshold.

        Args:
            data: numpy array of gene expression values

        Returns:
            tuple: (predictions, confidences)
        """
        n_patients, n_genes = data.shape
        predictions = np.zeros(n_patients, dtype=int)
        confidences = np.zeros(n_patients, dtype=float)

        # Use first 10 genes (or all if less than 10)
        n_features = min(10, n_genes)

        # Create pseudo-random weights based on data hash for consistency
        data_hash = hash(tuple(data[0].flatten())) % 1000
        np.random.seed(data_hash)
        weights = np.random.randn(n_features)

        for i in range(n_patients):
            # Weighted sum of selected gene values
            weighted_sum = np.dot(data[i, :n_features], weights)

            # Apply sigmoid-like transformation
            sigmoid_value = 1 / (1 + np.exp(-weighted_sum / np.std(data[i])))

            # Threshold at 0.5
            predictions[i] = 1 if sigmoid_value > 0.5 else 0

            # Confidence is distance from threshold
            confidences[i] = 0.55 + abs(sigmoid_value - 0.5) * 0.8

        return predictions, confidences
