"""Mock SVM model implementation."""

import numpy as np
from .base_model import BaseModel


class SVMModel(BaseModel):
    """Mock SVM model using deterministic hash-based predictions."""

    def __init__(self):
        super().__init__("svm")

    def _predict_logic(self, data: np.ndarray):
        """
        Use hash of patient data to generate deterministic predictions.

        Args:
            data: numpy array of gene expression values

        Returns:
            tuple: (predictions, confidences)
        """
        n_patients = data.shape[0]
        predictions = np.zeros(n_patients, dtype=int)
        confidences = np.zeros(n_patients, dtype=float)

        for i in range(n_patients):
            # Create hash from patient data for deterministic results
            patient_hash = hash(tuple(data[i].flatten())) % 100

            # Deterministic prediction based on hash
            predictions[i] = 1 if patient_hash > 50 else 0

            # Confidence between 0.6 and 0.95
            confidences[i] = 0.6 + (patient_hash / 100) * 0.35

        return predictions, confidences
