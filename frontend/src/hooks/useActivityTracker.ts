import { useEffect, useRef, useCallback } from 'react';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes of no input = idle
const API = 'http://localhost:3001/api/activity';

function getToken() { return localStorage.getItem('authToken'); }

async function postEvent(eventType: string, page: string, durationSeconds?: number, metadata?: object) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ eventType, page, durationSeconds, metadata }),
    });
  } catch { /* backend offline — silently ignore */ }
}

/**
 * useActivityTracker
 * Tracks in-app activity: page visits, idle detection, tab visibility.
 * Call this once at the top level of the employee dashboard.
 *
 * @param currentPage  - label for the current section (e.g. "My Work", "Settings")
 * @param employeeId   - used to gate tracking (only runs when truthy)
 */
export function useActivityTracker(currentPage: string, employeeId: string | null) {
  const pageRef = useRef(currentPage);
  const pageEnteredAtRef = useRef<Date>(new Date());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);
  const idleStartRef = useRef<Date | null>(null);
  const hasStartedRef = useRef(false);

  // Keep page ref in sync and log page transitions
  useEffect(() => {
    if (!employeeId) return;

    const prevPage = pageRef.current;
    const now = new Date();

    if (prevPage !== currentPage && hasStartedRef.current) {
      // Log time spent on previous page
      const durationSeconds = Math.round((now.getTime() - pageEnteredAtRef.current.getTime()) / 1000);
      postEvent('page_visit', prevPage, durationSeconds);
    }

    pageRef.current = currentPage;
    pageEnteredAtRef.current = now;
  }, [currentPage, employeeId]);

  const resetIdleTimer = useCallback(() => {
    if (!employeeId) return;

    // If was idle, log the idle duration and resume active
    if (isIdleRef.current && idleStartRef.current) {
      const idleSecs = Math.round((Date.now() - idleStartRef.current.getTime()) / 1000);
      postEvent('active', pageRef.current, idleSecs, { resumedAfterIdleSecs: idleSecs });
      isIdleRef.current = false;
      idleStartRef.current = null;
      // Reset page timer so we don't count idle time as active page time
      pageEnteredAtRef.current = new Date();
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!isIdleRef.current) {
        isIdleRef.current = true;
        idleStartRef.current = new Date();
        postEvent('idle', pageRef.current, undefined, { page: pageRef.current });
      }
    }, IDLE_THRESHOLD_MS);
  }, [employeeId]);

  // Session start + idle detection setup
  useEffect(() => {
    if (!employeeId) return;

    postEvent('session_start', currentPage);
    hasStartedRef.current = true;
    resetIdleTimer();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // Log final page visit on unmount
      const durationSeconds = Math.round((Date.now() - pageEnteredAtRef.current.getTime()) / 1000);
      postEvent('session_end', pageRef.current, durationSeconds);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Tab visibility tracking
  useEffect(() => {
    if (!employeeId) return;

    const handleVisibility = () => {
      if (document.hidden) {
        postEvent('tab_hidden', pageRef.current);
        // Pause page timer
        const durationSeconds = Math.round((Date.now() - pageEnteredAtRef.current.getTime()) / 1000);
        if (durationSeconds > 0) postEvent('page_visit', pageRef.current, durationSeconds);
      } else {
        postEvent('tab_visible', pageRef.current);
        pageEnteredAtRef.current = new Date(); // reset timer when tab comes back
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [employeeId]);
}
