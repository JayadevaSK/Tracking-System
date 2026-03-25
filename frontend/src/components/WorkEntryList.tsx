import React from 'react';
import { WorkEntry, CompletionStatus } from '../types';
import ScreenshotUploader from './ScreenshotUploader';

interface WorkEntryListProps {
  entries: WorkEntry[];
  onEdit: (entry: WorkEntry) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const statusConfig: Record<CompletionStatus, { label: string; cls: string; dot: string }> = {
  [CompletionStatus.COMPLETED]:   { label: 'Completed',   cls: 'badge-completed',   dot: '#34d399' },
  [CompletionStatus.IN_PROGRESS]: { label: 'In Progress', cls: 'badge-in-progress', dot: '#fcd34d' },
  [CompletionStatus.NOT_STARTED]: { label: 'Not Started', cls: 'badge-not-started', dot: '#94a3b8' },
};

const WorkEntryList: React.FC<WorkEntryListProps> = ({ entries, onEdit, onDelete, readOnly = false }) => {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <p style={{ fontWeight: 600, marginBottom: '6px' }}>No entries yet</p>
        <p style={{ fontSize: '12px' }}>Add your first work entry for this date.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {entries.map((entry, i) => {
        const sc = statusConfig[entry.status] ?? statusConfig[CompletionStatus.NOT_STARTED];
        return (
          <div
            key={entry.id}
            className="entry-card animate-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Status dot + description */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.dot, flexShrink: 0, marginTop: '5px', boxShadow: `0 0 8px ${sc.dot}` }} />
                  <p style={{ fontWeight: 600, fontSize: '14px', lineHeight: '1.5', color: 'var(--text)' }}>
                    {entry.description}
                  </p>
                </div>
                {/* Meta chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', paddingLeft: '18px' }}>
                  <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  {entry.category && (
                    <span className="chip">🏷 {entry.category}</span>
                  )}
                  {entry.duration && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2px 9px', fontWeight: 600 }}>
                      ⏱ {entry.duration} min
                    </span>
                  )}
                  {entry.date && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {entry.isAutoTracked && (
                    <span style={{ fontSize: '11px', color: 'var(--accent2)', background: 'rgba(0,229,184,0.08)', border: '1px solid rgba(0,229,184,0.2)', borderRadius: '20px', padding: '2px 9px', fontWeight: 600 }}>⚡ Auto</span>
                  )}
                </div>
              </div>

              {!readOnly && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => onEdit(entry)} className="btn-secondary btn-sm" aria-label={`Edit: ${entry.description}`} style={{ borderRadius: '8px' }}>
                    Edit
                  </button>
                  <button onClick={() => onDelete(entry.id)} className="btn-danger btn-sm" aria-label={`Delete: ${entry.description}`} style={{ borderRadius: '8px' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>

            <ScreenshotUploader workEntryId={entry.id} readOnly={readOnly} />
          </div>
        );
      })}
    </div>
  );
};

export default WorkEntryList;
