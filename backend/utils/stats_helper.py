"""Statistical helper functions for gene expression analysis."""

import numpy as np
import pandas as pd


def calculate_top_variant_genes(df, n=10):
    """
    Calculate genes with highest variance across patients.

    Args:
        df: pandas DataFrame with gene expression values (rows=patients, columns=genes)
        n: number of top genes to return

    Returns:
        List of gene names sorted by variance (descending)
    """
    # Calculate variance for each gene (column)
    variances = df.var(axis=0)

    # Get top n genes with highest variance
    top_genes = variances.nlargest(n).index.tolist()

    return top_genes


def get_gene_statistics(df):
    """
    Calculate basic statistics for each gene.

    Args:
        df: pandas DataFrame with gene expression values

    Returns:
        Dictionary with gene names as keys and statistics as values
    """
    stats = {}

    for gene in df.columns:
        values = df[gene].dropna()  # Remove NaN values
        stats[gene] = {
            'mean': float(values.mean()),
            'median': float(values.median()),
            'std': float(values.std()),
            'variance': float(values.var()),
            'min': float(values.min()),
            'max': float(values.max()),
            'count': len(values)
        }

    return stats
