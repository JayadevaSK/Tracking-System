import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface TrackingConfig {
  isEnabled: boolean;
  trackingInterval: number;
}

interface TrackingToggleProps {
  employeeId: string;
}

const TrackingToggle: React.FC<TrackingToggleProps> = ({ employeeId }) => {
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<TrackingConfig>(`/tracking/${employeeId}/status`)
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ isEnabled: false, trackingInterval: 30 }));
  }, [employeeId]);

  const toggle = async () => {
    if (!config) return;
    setLoading(true);
    setError('');
    try {
      const action = config.isEnabled ? 'disable' : 'enable';
      const res = await api.post<TrackingConfig>(`/tracking/${employeeId}/${action}`);
      setConfig(res.data);
    } catch {
      setError('Failed to update tracking status');
    } finally {
      setLoading(false);
    }
  };

  if (!config) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>Auto-tracking:</span>
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={config.isEnabled}
        style={{
          padding: '6px 16px',
          background: config.isEnabled ? '#28a745' : '#6c757d',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {config.isEnabled ? 'Enabled' : 'Disabled'}
      </button>
      {error && <span style={{ color: 'red', fontSize: '13px' }}>{error}</span>}
    </div>
  );
};

export default TrackingToggle;
