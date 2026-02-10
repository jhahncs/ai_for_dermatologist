"""Configuration settings for the Flask application."""

import os


class Config:
    """Application configuration."""

    # File upload settings
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    ALLOWED_EXTENSIONS = {'.csv'}
    UPLOAD_FOLDER = '/tmp'

    # CORS settings
    CORS_ORIGINS = ['http://localhost:3000']

    # Flask settings
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    PORT = int(os.getenv('PORT', 5000))

    # Model settings
    AVAILABLE_MODELS = ['svm', 'neural_network', 'random_forest', 'logistic_regression']
