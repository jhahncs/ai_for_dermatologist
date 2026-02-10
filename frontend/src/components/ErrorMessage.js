/**
 * ErrorMessage Component
 * Displays error messages to the user
 */

import React from 'react';
import './ErrorMessage.css';

function ErrorMessage({ error, onDismiss }) {
  if (!error) {
    return null;
  }

  return (
    <div className="error-message">
      <div className="error-content">
        <svg className="error-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <div className="error-text">
          <div className="error-title">Error</div>
          <div className="error-description">{error}</div>
        </div>
        <button className="error-dismiss" onClick={onDismiss}>
          ×
        </button>
      </div>
    </div>
  );
}

export default ErrorMessage;
