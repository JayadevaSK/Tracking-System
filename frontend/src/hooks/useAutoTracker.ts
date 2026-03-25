import { useState, useEffect, useRef, useCallback } from 'react';

const TICK_MS = 1000;
const RECORD_INTERVAL_MS = 30 * 60 * 1000; // auto-log every 30 min

function storageKey(employeeId: string) { return `autotracker_${employeeId}`; }

export function useAutoTracker(employeeId: string | null, onNewEntry?: () => void) {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [currentTask, setCurrentTask] = useState('Work Session');
  const [loading, setLoading] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecordRef = useRef<Date>(new Date());
  const taskRef = useRef('Work Session');
  const sessionStartRef = useRef<Date>(new Date());

  useEffect(() => { taskRef.current = currentTask; }, [currentTask]);

  const postEntry = useCallback(async (description: string, mins: number, status: 'in-progress' | 'completed' = 'in-progress') => {
    if (!employeeId || mins < 1) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:3001/api/work-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          employeeId,
          description,
          status,
          duration: mins,
          isAutoTracked: true,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      onNewEntry?.();
    } catch { /* backend may be offline */ }
  }, [employeeId, onNewEntry]);

  const recordBlock = useCallback(async (isFinal = false) => {
    const now = new Date();
    const mins = Math.round((now.getTime() - lastRecordRef.current.getTime()) / 60000);
    lastRecordRef.current = now;
    if (mins < 1) return;
    const task = taskRef.current || 'Work Session';
    const startLabel = lastRecordRef.current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const desc = isFinal
      ? `${task} — session ended at ${endLabel} (${mins} min total)`
      : `${task} — ${mins} min block (${startLabel} → ${endLabel})`;
    await postEntry(desc, mins, isFinal ? 'completed' : 'in-progress');
  }, [postEntry]);

  const startIntervals = useCallback(() => {
    lastRecordRef.current = new Date();
    sessionStartRef.current = new Date();
    tickRef.current = setInterval(() => setSessionSeconds((s) => s + 1), TICK_MS);
    recordRef.current = setInterval(() => recordBlock(false), RECORD_INTERVAL_MS);
  }, [recordBlock]);

  const stopIntervals = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (recordRef.current) { clearInterval(recordRef.current); recordRef.current = null; }
  }, []);

  // Auto-start when employee logs in
  useEffect(() => {
    if (!employeeId) return;

    // Check for existing persisted session
    try {
      const stored = localStorage.getItem(storageKey(employeeId));
      if (stored) {
        const { startedAt, task } = JSON.parse(stored);
        if (startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
          setSessionSeconds(elapsed > 0 ? elapsed : 0);
          const label = task || 'Work Session';
          setCurrentTask(label);
          taskRef.current = label;
          setIsTracking(true);
          return; // intervals will start via the isTracking effect
        }
      }
    } catch { /* ignore */ }

    // No existing session — auto-start a new one
    const label = 'Work Session';
    setCurrentTask(label);
    taskRef.current = label;
    localStorage.setItem(storageKey(employeeId), JSON.stringify({
      startedAt: new Date().toISOString(),
      task: label,
    }));
    setIsTracking(true);
  }, [employeeId]);

  useEffect(() => {
    if (isTracking) startIntervals();
    else stopIntervals();
    return stopIntervals;
  }, [isTracking, startIntervals, stopIntervals]);

  // Update task label without stopping the session
  const updateTask = useCallback((task: string) => {
    const label = task.trim() || 'Work Session';
    setCurrentTask(label);
    taskRef.current = label;
    if (employeeId) {
      try {
        const stored = localStorage.getItem(storageKey(employeeId));
        const parsed = stored ? JSON.parse(stored) : {};
        localStorage.setItem(storageKey(employeeId), JSON.stringify({ ...parsed, task: label }));
      } catch { /* ignore */ }
    }
  }, [employeeId]);

  const stop = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    stopIntervals();
    await recordBlock(true);
    setIsTracking(false);
    setSessionSeconds(0);
    setCurrentTask('Work Session');
    localStorage.removeItem(storageKey(employeeId));
    setLoading(false);
  }, [employeeId, stopIntervals, recordBlock]);

  // Resume tracking (after manual stop)
  const resume = useCallback(() => {
    if (!employeeId || isTracking) return;
    const label = 'Work Session';
    setCurrentTask(label);
    taskRef.current = label;
    setSessionSeconds(0);
    localStorage.setItem(storageKey(employeeId), JSON.stringify({
      startedAt: new Date().toISOString(),
      task: label,
    }));
    setIsTracking(true);
  }, [employeeId, isTracking]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  };

  return {
    isTracking,
    sessionSeconds,
    sessionTime: formatTime(sessionSeconds),
    currentTask,
    updateTask,
    stop,
    resume,
    loading,
  };
}
