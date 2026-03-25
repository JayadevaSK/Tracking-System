import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeSummary } from '../types';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import EmployeeDetailView from './EmployeeDetailView';

const toDateString = (d: Date) => d.toISOString().split('T')[0];

const Sidebar: React.FC<{ onBack?: () => void; onLogout: () => void }> = ({ onBack, onLogout }) => (
  <aside style={{ width: '240px', minHeight: '100vh', background: 'linear-gradient(180deg, rgba(8,10,28,0.94) 0%, rgba(4,6,18,0.97) 100%)', borderRight: '1px solid rgba(124,111,255,0.1)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0, backdropFilter: 'blur(48px)', boxShadow: '4px 0 40px rgba(0,0,0,0.4), inset -1px 0 0 rgba(124,111,255,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', padding: '0 8px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c6fff, #00e5b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 20px rgba(124,111,255,0.4)', animation: 'float 3.5s ease-in-out infinite' }}>📊</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px' }}>Work Tracker</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Manager Portal</div>
      </div>
    </div>
    <nav style={{ flex: 1 }}>
      {onBack ? (
        <button onClick={onBack} className="btn-secondary" style={{ width: '100%', marginBottom: '8px', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Team Overview
        </button>
      ) : (
        <div style={{ padding: '11px 14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(124,111,255,0.18), rgba(0,229,184,0.08))', color: 'var(--text)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(124,111,255,0.28)', boxShadow: '0 0 24px rgba(124,111,255,0.1)' }}>
          <span>👥</span> Team Overview
        </div>
      )}
    </nav>
    <button onClick={onLogout} className="btn-secondary" style={{ width: '100%', marginTop: 'auto', fontSize: '13px' }}>Sign Out</button>
  </aside>
);

const ManagerDashboard: React.FC = () => {
  const { userId, logout } = useAuth();
  const [date, setDate] = useState(toDateString(new Date()));
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mainRef = React.useRef<HTMLElement>(null);

  const fetchTeam = useCallback(async () => {
    if (!userId) return;
    setLoading(true); setError('');
    try {
      const overview = await dashboardService.getTeamOverview(userId, date);
      setEmployees(overview.employees);
    } catch { setError('Failed to load team overview'); }
    finally { setLoading(false); }
  }, [userId, date]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const totalCompleted = employees.reduce((s, e) => s + e.completedItems, 0);
  const totalItems = employees.reduce((s, e) => s + e.totalItems, 0);
  const teamPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const activeCount = employees.filter(e => e.totalItems > 0).length;

  const selectEmployee = (emp: { id: string; name: string }) => {
    setSelectedEmployee(emp);
    // Scroll to top when navigating to employee detail
    setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'auto' }), 0);
  };

  const goBack = () => {
    setSelectedEmployee(null);
    setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'auto' }), 0);
  };

  if (selectedEmployee) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex' }}>
        <Sidebar onBack={goBack} onLogout={logout} />
        <main ref={mainRef} style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <EmployeeDetailView employeeId={selectedEmployee.id} employeeName={selectedEmployee.name} onBack={goBack} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex' }}>
      <Sidebar onLogout={logout} />
      <main ref={mainRef} style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>

        {/* Header */}
        <div className="page-header animate-in">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: '6px' }}>Manager Dashboard</div>
            <h1 style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Team Overview</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>Monitor your team's daily progress</p>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto', padding: '9px 14px', borderRadius: '12px' }} />
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }} className="animate-in" >
          {[
            { icon: '👥', value: employees.length, label: 'Team Members', cls: '' },
            { icon: '⚡', value: activeCount, label: 'Active Today', cls: 'teal' },
            { icon: '📋', value: totalItems, label: 'Total Tasks', cls: '' },
            { icon: '✅', value: totalCompleted, label: 'Completed', cls: 'green' },
            { icon: '🎯', value: `${teamPct}%`, label: 'Team Progress', cls: 'pink' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {/* Employee list */}
        <div className="card animate-in">
          <div className="section-title">Team Members</div>
          {loading ? (
            <div className="loading-spinner" />
          ) : employees.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👥</div><p>No employees found for this date.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {employees.map((emp, i) => {
                const pct = emp.totalItems > 0 ? Math.round((emp.completedItems / emp.totalItems) * 100) : 0;
                const initials = emp.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const gradients = [
                  'linear-gradient(135deg, #7c6fff, #00e5b8)',
                  'linear-gradient(135deg, #f472b6, #fb923c)',
                  'linear-gradient(135deg, #34d399, #06b6d4)',
                  'linear-gradient(135deg, #a78bfa, #f472b6)',
                  'linear-gradient(135deg, #fbbf24, #f97316)',
                ];
                const grad = gradients[i % gradients.length];
                return (
                  <div key={emp.employeeId} className="employee-card" onClick={() => selectEmployee({ id: emp.employeeId, name: emp.employeeName })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Avatar */}
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                        {initials}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text)' }}>{emp.employeeName}</div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : undefined }} />
                        </div>
                      </div>
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text)' }}>{emp.totalItems}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Tasks</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '18px', color: '#34d399' }}>{emp.completedItems}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Done</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '18px', color: pct === 100 ? '#34d399' : 'var(--accent)' }}>{pct}%</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Done</div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '20px', marginLeft: '8px' }}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
