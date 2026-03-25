import React, { useState, useEffect, useCallback } from 'react';
import { WorkEntry, WorkEntryInput } from '../types';
import { workEntryService } from '../services/workEntryService';
import { screenshotService } from '../services/screenshotService';
import { useAuth } from '../contexts/AuthContext';
import WorkEntryForm from './WorkEntryForm';
import WorkEntryList from './WorkEntryList';
import { useAutoTracker } from '../hooks/useAutoTracker';
import { useActivityTracker } from '../hooks/useActivityTracker';

const toDateString = (d: Date) => d.toISOString().split('T')[0];

const EmployeeDashboard: React.FC = () => {
  const { userId, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskEditMode, setTaskEditMode] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    setLoading(true); setError('');
    try {
      const data = await workEntryService.getWorkEntriesByDate(userId, selectedDate);
      setEntries(data);
    } catch { setError('Failed to load work entries'); }
    finally { setLoading(false); }
  }, [userId, selectedDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleCreate = async (data: WorkEntryInput, screenshots?: File[]) => {
    const created = await workEntryService.createWorkEntry(data);
    if (screenshots && screenshots.length > 0 && created?.id) {
      await screenshotService.uploadScreenshots(created.id, screenshots).catch(() => {});
    }
    setShowForm(false);
    fetchEntries();
  };

  const handleUpdate = async (data: WorkEntryInput) => {
    if (!editingEntry) return;
    await workEntryService.updateWorkEntry(editingEntry.id, data);
    setEditingEntry(null);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this work entry?')) return;
    try { await workEntryService.deleteWorkEntry(id); fetchEntries(); }
    catch { setError('Failed to delete work entry'); }
  };

  const completedCount = entries.filter((e) => e.status === 'completed').length;
  const inProgressCount = entries.filter((e) => e.status === 'in-progress').length;
  const completionPct = entries.length > 0 ? Math.round((completedCount / entries.length) * 100) : 0;
  const totalDuration = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const autoTrackedDuration = entries.filter((e) => e.isAutoTracked).reduce((sum, e) => sum + (e.duration ?? 0), 0);

  const { isTracking, sessionTime, currentTask, updateTask, stop, resume, loading: trackingLoading } = useAutoTracker(userId, fetchEntries);

  // Track in-app activity automatically
  useActivityTracker('My Work', userId);

  const handleTaskEdit = () => {
    setTaskDraft(currentTask);
    setTaskEditMode(true);
  };

  const handleTaskSave = () => {
    if (taskDraft.trim()) updateTask(taskDraft);
    setTaskEditMode(false);
  };

  const handleLogout = async () => {
    if (isTracking) await stop();
    logout();
  };


  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', minHeight: '100vh', background: 'linear-gradient(180deg, rgba(8,10,28,0.94) 0%, rgba(4,6,18,0.97) 100%)', borderRight: '1px solid rgba(124,111,255,0.1)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0, backdropFilter: 'blur(48px)', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c6fff, #00e5b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 20px rgba(124,111,255,0.4)', animation: 'float 3.5s ease-in-out infinite' }}>📊</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px' }}>Work Tracker</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Employee Portal</div>
          </div>
        </div>

        <nav style={{ marginBottom: '20px' }}>
          <div style={{ padding: '11px 14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(124,111,255,0.18), rgba(0,229,184,0.08))', color: 'var(--text)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(124,111,255,0.28)' }}>
            <span>📋</span> My Work
          </div>
        </nav>

        {/* Live Tracker Panel */}
        <div style={{ padding: '16px', background: isTracking ? 'rgba(0,229,184,0.06)' : 'rgba(255,77,109,0.06)', borderRadius: '14px', border: `1px solid ${isTracking ? 'rgba(0,229,184,0.2)' : 'rgba(255,77,109,0.2)'}`, marginBottom: '14px', transition: 'all 0.3s' }}>
          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isTracking ? '#00e5b8' : '#ff4d6d', boxShadow: isTracking ? '0 0 8px #00e5b8' : '0 0 8px #ff4d6d', animation: isTracking ? 'pulse-glow 2s infinite' : 'none' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isTracking ? '#00e5b8' : '#ff4d6d' }}>
                {isTracking ? 'Live' : 'Paused'}
              </span>
            </div>
            {/* Session timer */}
            <div style={{ fontSize: '18px', fontWeight: 900, background: 'linear-gradient(135deg, #00e5b8, #7c6fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {sessionTime}
            </div>
          </div>

          {/* Current task — editable */}
          {taskEditMode ? (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <input
                autoFocus
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTaskSave(); if (e.key === 'Escape') setTaskEditMode(false); }}
                style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(124,111,255,0.3)', color: 'var(--text)', outline: 'none' }}
              />
              <button onClick={handleTaskSave} style={{ padding: '6px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: '#00e5b8', color: '#000' }}>✓</button>
            </div>
          ) : (
            <div
              onClick={handleTaskEdit}
              title="Click to change task"
              style={{ fontSize: '12px', color: isTracking ? '#a5f3e8' : 'var(--text-muted)', fontWeight: 600, marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              ✏️ {currentTask}
            </div>
          )}

          {/* Stop / Resume button */}
          {isTracking ? (
            <button
              onClick={stop}
              disabled={trackingLoading}
              style={{ width: '100%', padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: trackingLoading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #ff4d6d, #c026d3)', color: '#fff', opacity: trackingLoading ? 0.6 : 1, transition: 'all 0.3s' }}
            >
              {trackingLoading ? '...' : '⏸ Pause Tracking'}
            </button>
          ) : (
            <button
              onClick={resume}
              disabled={trackingLoading}
              style={{ width: '100%', padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: trackingLoading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #00e5b8, #7c6fff)', color: '#fff', opacity: trackingLoading ? 0.6 : 1, transition: 'all 0.3s' }}
            >
              ▶ Resume Tracking
            </button>
          )}
        </div>

        {/* Today's Summary */}
        <div style={{ padding: '14px', background: 'rgba(124,111,255,0.06)', borderRadius: '12px', border: '1px solid rgba(124,111,255,0.1)', marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>Today's Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total logged</span>
              <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{totalDuration > 0 ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Auto-tracked</span>
              <span style={{ fontWeight: 700, color: '#7c6fff' }}>{autoTrackedDuration > 0 ? `${autoTrackedDuration} min` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Entries</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{entries.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Completed</span>
              <span style={{ fontWeight: 700, color: '#34d399' }}>{completedCount}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Completion</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)' }}>{completionPct}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: 'auto', fontSize: '13px' }}>
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        {/* Header */}
        <div className="page-header animate-in">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: '6px' }}>Employee Dashboard</div>
            <h1 style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>My Work</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>Tracking is automatic — your session is recorded in real time</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: 'auto', padding: '9px 14px', borderRadius: '12px' }} />
            {!showForm && !editingEntry && (
              <button onClick={() => setShowForm(true)} className="btn-primary" style={{ whiteSpace: 'nowrap', borderRadius: '12px' }}>
                + New Entry
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }} className="animate-in">
          {[
            { icon: '📝', value: entries.length, label: 'Total Entries', cls: '' },
            { icon: '✅', value: completedCount, label: 'Completed', cls: 'green' },
            { icon: '⏳', value: inProgressCount, label: 'In Progress', cls: 'yellow' },
            { icon: '🎯', value: `${completionPct}%`, label: 'Done Today', cls: 'pink' },
            ...(totalDuration > 0 ? [{ icon: '⏱', value: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`, label: 'Time Logged', cls: 'teal' }] : []),
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {/* Form */}
        {(showForm || editingEntry) && (
          <div className="card animate-in" style={{ marginBottom: '24px' }}>
            <div className="section-title">{editingEntry ? 'Edit Entry' : 'New Work Entry'}</div>
            <WorkEntryForm
              employeeId={userId!}
              entry={editingEntry ?? undefined}
              onSubmit={editingEntry ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingEntry(null); }}
            />
          </div>
        )}

        {/* Entry list */}
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Work Entries</div>
            {entries.some((e) => e.isAutoTracked) && (
              <span style={{ fontSize: '11px', color: 'var(--accent2)', background: 'rgba(0,229,184,0.08)', border: '1px solid rgba(0,229,184,0.2)', borderRadius: '20px', padding: '3px 10px', fontWeight: 600 }}>
                ⚡ {entries.filter((e) => e.isAutoTracked).length} auto-tracked
              </span>
            )}
          </div>
          {loading ? (
            <div className="loading-spinner" />
          ) : (
            <WorkEntryList
              entries={entries}
              onEdit={(entry) => { setEditingEntry(entry); setShowForm(false); }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
