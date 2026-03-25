import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => (
  <div
    role="status"
    aria-live="polite"
    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c757d', padding: '16px 0' }}
  >
    <span
      style={{
        display: 'inline-block',
        width: '18px',
        height: '18px',
        border: '2px solid #dee2e6',
        borderTopColor: '#007bff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
    <span>{message}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingSpinner;
