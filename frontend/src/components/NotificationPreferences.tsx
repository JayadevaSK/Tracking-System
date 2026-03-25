import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Prefs {
  emailEnabled: boolean;
  notifyOnWorkEntry: boolean;
  notifyOnDailySummary: boolean;
  email?: string;
}

interface NotificationPreferencesProps {
  userId: string;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ userId }) => {
  const [prefs, setPrefs] = useState<Prefs>({
    emailEnabled: true,
    notifyOnWorkEntry: true,
    notifyOnDailySummary: false,
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Prefs>(`/notifications/preferences/${userId}`)
      .then((res) => setPrefs(res.data))
      .catch(() => {}); // use defaults if not found
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.put<Prefs>('/notifications/preferences', prefs);
      setPrefs(res.data);
      setSaved(true);
    } catch {
      setError('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <h3>Notification Preferences</h3>

      <div style={{ marginBottom: '12px' }}>
        <label>
          <input
            type="checkbox"
            checked={prefs.emailEnabled}
            onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
            style={{ marginRight: '8px' }}
          />
          Enable email notifications
        </label>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>
          <input
            type="checkbox"
            checked={prefs.notifyOnWorkEntry}
            onChange={(e) => setPrefs({ ...prefs, notifyOnWorkEntry: e.target.checked })}
            disabled={!prefs.emailEnabled}
            style={{ marginRight: '8px' }}
          />
          Notify on new work entry
        </label>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>
          <input
            type="checkbox"
            checked={prefs.notifyOnDailySummary}
            onChange={(e) => setPrefs({ ...prefs, notifyOnDailySummary: e.target.checked })}
            disabled={!prefs.emailEnabled}
            style={{ marginRight: '8px' }}
          />
          Daily summary reminder
        </label>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="notif-email">Email address</label>
        <input
          id="notif-email"
          type="email"
          value={prefs.email ?? ''}
          onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
          disabled={!prefs.emailEnabled}
          style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px' }}
          placeholder="your@email.com"
        />
      </div>

      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      {saved && <p style={{ color: '#28a745' }}>Preferences saved.</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
};

export default NotificationPreferences;
