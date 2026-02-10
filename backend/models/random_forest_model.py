"""Mock Random Forest model implementation."""

import numpy as np
from .base_model import BaseModel


class RandomForestModel(BaseModel):
    """Mock Random Forest model using majority voting on feature subsets."""

    def __init__(self):
        super().__init__("random_forest")

    def _predict_logic(self, data: np.ndarray):
        """
        Use majority voting on random subsets of features (trees).

        Args:
            data: numpy array of gene expression values

        Returns:
            tuple: (predictions, confidences)
        """
        n_patients, n_genes = data.shape
        predictions = np.zeros(n_patients, dtype=int)
        confidences = np.zeros(n_patients, dtype=float)

        # Number of trees
        n_trees = 10

        # Create pseudo-random seed from data for consistency
        data_hash = hash(tuple(data.flatten()[:100])) % 1000

        for i in range(n_patients):
            # Seed for this patient
            np.random.seed(data_hash + i)

            tree_predictions = []

            # Simulate trees
            for tree_idx in range(n_trees):
                # Randomly select subset of genes for this tree
                n_features = max(1, n_genes // 3)
                selected_genes = np.random.choice(n_genes, n_features, replace=False)

                # Simple threshold-based decision for this tree
                tree_mean = np.mean(data[i, selected_genes])
                overall_mean = np.mean(data[i])

                tree_pred = 1 if tree_mean > overall_mean else 0
                tree_predictions.append(tree_pred)

            # Majority vote
            predictions[i] = 1 if sum(tree_predictions) > n_trees / 2 else 0

            # Confidence based on vote agreement
            vote_ratio = sum(tree_predictions) / n_trees
            confidences[i] = 0.55 + abs(vote_ratio - 0.5) * 0.8

        return predictions, confidences
