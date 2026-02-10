"""Abstract base class for all prediction models."""

from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
import time


class BaseModel(ABC):
    """Abstract base class for all prediction models."""

    def __init__(self, model_name):
        """
        Initialize the model.

        Args:
            model_name: Name of the model
        """
        self.model_name = model_name

    @abstractmethod
    def _predict_logic(self, data: np.ndarray) -> tuple:
        """
        Implement model-specific prediction logic.

        Args:
            data: numpy array of gene expression values (n_patients x n_genes)

        Returns:
            tuple: (predictions, confidences) where both are numpy arrays
                  predictions: binary array (0 or 1)
                  confidences: float array (0.5 to 0.99)
        """
        pass

    def predict(self, df: pd.DataFrame, patient_ids: list = None):
        """
        Generate predictions for patients.

        Args:
            df: DataFrame with gene expression data
            patient_ids: List of patient IDs (optional)

        Returns:
            dict: Prediction results with patient IDs, predictions, and confidences
        """
        start_time = time.time()

        # Convert to numpy array
        data = df.to_numpy()

        # Generate predictions
        predictions, confidences = self._predict_logic(data)

        # Create patient IDs if not provided
        if patient_ids is None:
            patient_ids = [f"patient_{i+1}" for i in range(len(predictions))]

        # Format results
        results = []
        for pid, pred, conf in zip(patient_ids, predictions, confidences):
            results.append({
                "patient_id": pid,
                "prediction": "yes" if pred == 1 else "no",
                "confidence": round(float(conf), 2)
            })

        processing_time = (time.time() - start_time) * 1000

        return {
            "success": True,
            "model_type": self.model_name,
            "patient_count": len(results),
            "predictions": results,
            "processing_time_ms": round(processing_time, 2)
        }
