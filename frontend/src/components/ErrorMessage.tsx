import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <p role="alert" style={{ color: '#dc3545', margin: '8px 0', fontSize: '14px' }}>
    {message}
  </p>
);

export default ErrorMessage;
