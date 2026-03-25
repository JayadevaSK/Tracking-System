import React, { useState, useEffect, useCallback } from 'react';
import { DailySummary, WorkMetrics } from '../types';
import { dashboardService } from '../services/dashboardService';
import { activityService, ActivityTimeline } from '../services/activityService';
import WorkEntryList from './WorkEntryList';

interface EmployeeDetailViewProps {
  employeeId: string;
  employeeName: string;
  onBack: () => void;
}

const toDateString = (d: Date) => d.toISOString().split('T')[0];

const EmployeeDetailView: React.FC<EmployeeDetailViewProps> = ({ employeeId, employeeName, onBack }) => {
  const today = toDateString(new Date());
  const thirtyDaysAgo = toDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [selectedDate, setSelectedDate] = useState(today);
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [metrics, setMetrics] = useState<WorkMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'activity'>('daily');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, m] = await Promise.all([
        dashboardService.getDailySummary(employeeId, selectedDate),
        dashboardService.getWorkMetrics(employeeId, startDate, endDate),
      ]);
      setSummary(s);
      setMetrics(m);
    } catch {
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedDate, startDate, endDate]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    activityService.getTimeline(employeeId, selectedDate)
      .then(setActivity)
      .catch(() => setActivity({ events: [], summary: { totalActiveSeconds: 0, totalIdleSeconds: 0, pageBreakdown: {}, sessionCount: 0 } }))
      .finally(() => setActivityLoading(false));
  }, [employeeId, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const initials = employeeName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      {/* Employee header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '20px', color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ marginBottom: '2px' }}>{employeeName}</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Employee</span>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--surface2)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {(['daily', 'history', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {tab === 'daily' ? '📅 Daily' : tab === 'history' ? '📈 History' : '🕐 Activity'}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daily Summary
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
            />
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>Loading...</p>
          ) : summary ? (
            <>
              {/* Summary banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, rgba(124,111,255,0.08), rgba(0,229,184,0.05))', borderRadius: '16px', border: '1px solid rgba(124,111,255,0.15)' }}>
                {[
                  { icon: '📝', label: 'Total Tasks', value: summary.totalItems, color: 'var(--text)' },
                  { icon: '✅', label: 'Completed', value: summary.completedItems, color: '#34d399' },
                  { icon: '⏳', label: 'In Progress', value: summary.inProgressItems, color: '#fcd34d' },
                  { icon: '⏱', label: 'Time Logged', value: summary.totalDuration > 0 ? `${Math.floor(summary.totalDuration / 60)}h ${summary.totalDuration % 60}m` : '0m', color: '#a78bfa' },
                  { icon: '🎯', label: 'Completion', value: `${summary.completionPercentage}%`, color: summary.completionPercentage === 100 ? '#34d399' : '#7c6fff' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: s.color, marginBottom: '2px' }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <WorkEntryList entries={summary.workEntries ?? []} onEdit={() => {}} onDelete={() => {}} readOnly />
            </>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📭</div><p>No entries for this date.</p></div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date Range
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} />
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} />
            </div>
          </div>

          {metrics && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div className="stat-card"><div className="stat-value">{metrics.totalItems}</div><div className="stat-label">Total</div></div>
                <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{metrics.completedItems}</div><div className="stat-label">Done</div></div>
                <div className="stat-card"><div className="stat-value" style={{ color: '#a78bfa' }}>{metrics.totalDuration}</div><div className="stat-label">Minutes</div></div>
              </div>
              <WorkEntryList entries={(metrics as any).workEntries ?? []} onEdit={() => {}} onDelete={() => {}} readOnly />
            </>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Timeline</h3>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }} />
          </div>

          {activityLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : activity ? (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Active Time', value: fmtSecs(activity.summary.totalActiveSeconds), color: '#00e5b8' },
                  { label: 'Idle Time', value: fmtSecs(activity.summary.totalIdleSeconds), color: '#fcd34d' },
                  { label: 'Sessions', value: String(activity.summary.sessionCount || 1), color: '#a78bfa' },
                ].map((s) => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {Object.keys(activity.summary.pageBreakdown).length > 0 && (
                <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>Time per Section</div>
                  {Object.entries(activity.summary.pageBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([page, secs]) => {
                      const total = activity.summary.totalActiveSeconds || 1;
                      const pct = Math.round((secs / total) * 100);
                      return (
                        <div key={page} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600 }}>{page}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{fmtSecs(secs)} ({pct}%)</span>
                          </div>
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {activity.events.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">🕐</div><p>No activity recorded for this date.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activity.events.map((ev) => {
                    const cfg = eventConfig(ev.event_type);
                    const time = new Date(ev.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.border}` }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{cfg.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: cfg.color }}>
                            {ev.metadata?.description || cfg.label}
                          </div>
                          {ev.event_type === 'page_visit' && ev.metadata?.category && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              🏷 {ev.metadata.category}
                              {ev.metadata.appName && ev.metadata.appName !== 'unknown' && ` · ${ev.metadata.appName}`}
                            </div>
                          )}
                          {ev.event_type !== 'page_visit' && ev.page && ev.page !== 'Desktop Agent Started' && ev.page !== 'Desktop Agent Stopped' && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {ev.page}</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{time}</div>
                          {ev.duration_seconds != null && ev.duration_seconds > 0 && (
                            <div style={{ fontSize: '11px', fontWeight: 600, color: cfg.color }}>{fmtSecs(ev.duration_seconds)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">🕐</div><p>No activity data available.</p></div>
          )}
        </div>
      )}
    </div>
  );
};

function fmtSecs(secs: number): string {
  if (!secs || secs < 60) return `${secs || 0}s`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function eventConfig(type: string): { icon: string; label: string; color: string; border: string } {
  switch (type) {
    case 'session_start':  return { icon: '🟢', label: 'Session Started',   color: '#00e5b8', border: 'rgba(0,229,184,0.15)' };
    case 'session_end':    return { icon: '🔴', label: 'Session Ended',     color: '#ff4d6d', border: 'rgba(255,77,109,0.15)' };
    case 'page_visit':     return { icon: '📄', label: 'Page Visit',        color: '#a5b4fc', border: 'rgba(165,180,252,0.12)' };
    case 'idle':           return { icon: '💤', label: 'Went Idle',         color: '#fcd34d', border: 'rgba(252,211,77,0.15)' };
    case 'active':         return { icon: '⚡', label: 'Resumed Activity',  color: '#34d399', border: 'rgba(52,211,153,0.15)' };
    case 'tab_hidden':     return { icon: '👁️', label: 'Switched Away',     color: '#f97316', border: 'rgba(249,115,22,0.15)' };
    case 'tab_visible':    return { icon: '👁️', label: 'Returned to App',   color: '#06b6d4', border: 'rgba(6,182,212,0.15)' };
    default:               return { icon: '•',  label: type,                color: 'var(--text-muted)', border: 'rgba(255,255,255,0.06)' };
  }
}

export default EmployeeDetailView;
