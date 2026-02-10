"""Mock Logistic Regression model implementation."""

import numpy as np
from .base_model import BaseModel


class LogisticRegressionModel(BaseModel):
    """Mock Logistic Regression model using linear combination of genes."""

    def __init__(self):
        super().__init__("logistic_regression")

    def _predict_logic(self, data: np.ndarray):
        """
        Use simple linear combination of select genes.

        Args:
            data: numpy array of gene expression values

        Returns:
            tuple: (predictions, confidences)
        """
        n_patients, n_genes = data.shape
        predictions = np.zeros(n_patients, dtype=int)
        confidences = np.zeros(n_patients, dtype=float)

        # Create consistent coefficients based on data
        data_hash = hash(tuple(data[0].flatten()[:50])) % 1000
        np.random.seed(data_hash)

        # Use all genes but with random coefficients
        coefficients = np.random.randn(n_genes) * 0.1
        intercept = np.random.randn() * 0.5

        for i in range(n_patients):
            # Linear combination
            linear_combination = np.dot(data[i], coefficients) + intercept

            # Apply logistic function
            logit_value = 1 / (1 + np.exp(-linear_combination))

            # Threshold at 0.5
            predictions[i] = 1 if logit_value > 0.5 else 0

            # Confidence based on logit value
            # Values close to 0 or 1 have higher confidence
            confidence_raw = abs(logit_value - 0.5) * 2  # Scale to 0-1
            confidences[i] = 0.55 + confidence_raw * 0.40

        return predictions, confidences
