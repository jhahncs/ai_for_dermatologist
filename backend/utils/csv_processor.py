"""CSV file processing and validation utilities."""

import pandas as pd
import numpy as np


class CSVProcessor:
    """Handle CSV file parsing and validation."""

    @staticmethod
    def process_csv(file_path):
        """
        Process uploaded CSV file.

        Args:
            file_path: Path to CSV file

        Returns:
            tuple: (DataFrame, patient_ids)
                  DataFrame contains only numeric gene expression data
                  patient_ids is a list of patient identifiers

        Raises:
            ValueError: If CSV is invalid or cannot be processed
        """
        try:
            # Read CSV
            df = pd.read_csv(file_path)

            if df.empty:
                raise ValueError("CSV file is empty")

            # Check if first column is patient IDs (non-numeric)
            first_col = df.iloc[:, 0]
            has_patient_ids = not pd.api.types.is_numeric_dtype(first_col)

            if has_patient_ids:
                # First column contains patient IDs
                patient_ids = first_col.astype(str).tolist()
                df = df.iloc[:, 1:]  # Remove ID column from data
            else:
                # No patient IDs, generate them
                patient_ids = None

            # Validate that remaining columns are numeric
            non_numeric_cols = []
            for col in df.columns:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    # Try converting to numeric
                    try:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    except Exception:
                        non_numeric_cols.append(col)

            if non_numeric_cols:
                raise ValueError(
                    f"Non-numeric data found in gene columns: {', '.join(non_numeric_cols)}. "
                    "All gene expression values must be numeric."
                )

            # Handle missing values (fill with column mean)
            if df.isnull().any().any():
                # Fill NaN with column mean
                df = df.fillna(df.mean())

                # If any column is all NaN, fill with 0
                df = df.fillna(0)

            # Validate dimensions
            if df.shape[0] < 1:
                raise ValueError("CSV must have at least 1 patient row")

            if df.shape[1] < 1:
                raise ValueError("CSV must have at least 1 gene column")

            return df, patient_ids

        except pd.errors.EmptyDataError:
            raise ValueError("CSV file is empty or invalid")
        except pd.errors.ParserError as e:
            raise ValueError(f"Error parsing CSV file: {str(e)}")
        except FileNotFoundError:
            raise ValueError("CSV file not found")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Error processing CSV: {str(e)}")
