import React, { useState, useEffect, useRef } from 'react';
import { WorkEntry, WorkEntryInput, CompletionStatus } from '../types';

interface WorkEntryFormProps {
  employeeId: string;
  entry?: WorkEntry;
  onSubmit: (data: WorkEntryInput, screenshots?: File[]) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = ['Development', 'Design', 'Testing', 'Meetings', 'Documentation', 'Other'];

const WorkEntryForm: React.FC<WorkEntryFormProps> = ({ employeeId, entry, onSubmit, onCancel }) => {
  const [description, setDescription] = useState(entry?.description ?? '');
  const [status, setStatus] = useState<CompletionStatus>(entry?.status ?? CompletionStatus.NOT_STARTED);
  const [category, setCategory] = useState(entry?.category ?? '');
  const [duration, setDuration] = useState(entry?.duration?.toString() ?? '');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry) {
      setDescription(entry.description);
      setStatus(entry.status);
      setCategory(entry.category ?? '');
      setDuration(entry.duration?.toString() ?? '');
    }
  }, [entry]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const combined = [...screenshots, ...newFiles].slice(0, 5);
    setScreenshots(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (index: number) => {
    const updated = screenshots.filter((_, i) => i !== index);
    setScreenshots(updated);
    setPreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) { setError('Description must be at least 10 characters'); return; }
    if (!status) { setError('Status is required'); return; }
    if (duration && (isNaN(Number(duration)) || Number(duration) <= 0)) {
      setError('Duration must be a positive number'); return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        employeeId,
        description: description.trim(),
        status,
        category: category || undefined,
        duration: duration ? Number(duration) : undefined,
      }, screenshots.length > 0 ? screenshots : undefined);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to save work entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>
        {entry ? 'Edit Work Entry' : 'New Work Entry'}
      </h3>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={loading}
          placeholder="Describe the work done (min 10 characters)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as CompletionStatus)} disabled={loading}>
            <option value={CompletionStatus.NOT_STARTED}>Not Started</option>
            <option value={CompletionStatus.IN_PROGRESS}>In Progress</option>
            <option value={CompletionStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
            <option value="">-- Select category --</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="duration">Duration (minutes)</label>
        <input
          id="duration"
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={loading}
          placeholder="Optional"
        />
      </div>

      {/* Screenshots */}
      <div className="form-group">
        <label>Screenshots (optional, max 5)</label>
        {previews.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={src}
                  alt={`preview ${i + 1}`}
                  style={{
                    width: '80px', height: '60px', objectFit: 'cover',
                    borderRadius: '6px', border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: 'var(--danger)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: '18px', height: '18px',
                    fontSize: '11px', cursor: 'pointer', lineHeight: '18px',
                    padding: 0, textAlign: 'center',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        {previews.length < 5 && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn-secondary btn-sm"
            >
              📎 Attach Screenshot
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : entry ? 'Update Entry' : 'Add Entry'}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default WorkEntryForm;
