import React, { useState, useEffect, useRef } from 'react';
import { screenshotService, Screenshot } from '../services/screenshotService';

interface ScreenshotUploaderProps {
  workEntryId: string;
  readOnly?: boolean;
}

const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({ workEntryId, readOnly = false }) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Screenshot | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    screenshotService.getScreenshots(workEntryId).then(setScreenshots).catch(() => {});
  }, [workEntryId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArr.length === 0) {
      setError('Only image files are allowed');
      return;
    }
    if (screenshots.length + fileArr.length > 5) {
      setError('Maximum 5 screenshots per entry');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const uploaded = await screenshotService.uploadScreenshots(workEntryId, fileArr);
      setScreenshots((prev) => [...prev, ...uploaded]);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await screenshotService.deleteScreenshot(id);
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete screenshot');
    }
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <strong style={{ fontSize: '14px' }}>Screenshots</strong>
        {!readOnly && screenshots.length < 5 && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding: '3px 10px', fontSize: '12px' }}
            >
              {uploading ? 'Uploading...' : '+ Add'}
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
        <span style={{ fontSize: '12px', color: '#6c757d' }}>{screenshots.length}/5</span>
      </div>

      {error && <p style={{ color: 'red', fontSize: '12px', margin: '4px 0' }}>{error}</p>}

      {screenshots.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {screenshots.map((s) => (
            <div key={s.id} style={{ position: 'relative' }}>
              <img
                src={`data:${s.mimeType};base64,${s.data}`}
                alt={s.filename}
                title={s.filename}
                onClick={() => setPreview(s)}
                style={{
                  width: '80px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  cursor: 'pointer',
                }}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  title="Remove"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    lineHeight: '18px',
                    padding: 0,
                    textAlign: 'center',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox preview */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={`data:${preview.mimeType};base64,${preview.data}`}
            alt={preview.filename}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '4px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ScreenshotUploader;
