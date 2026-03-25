/**
 * Work Tracker Desktop Agent
 * Runs in the background, polls the active window every 3 seconds,
 * and reports activity to the backend.
 *
 * Usage:
 *   node dist/index.js [--server http://localhost:3001] [--logout]
 */

import { loadConfig, promptLogin, clearConfig } from './auth';
import { getActiveWindow, WindowInfo, clearPsScriptCache } from './windowTracker';
import { Reporter } from './reporter';

const POLL_INTERVAL_MS = 3000;       // check active window every 3s
const MIN_DWELL_MS = 5000;           // ignore windows open for less than 5s
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 min no change = idle
const SERVER_URL = process.argv.includes('--server')
  ? process.argv[process.argv.indexOf('--server') + 1]
  : 'http://localhost:3001';

async function main() {
  // Handle --logout flag
  if (process.argv.includes('--logout')) {
    clearConfig();
    console.log('Logged out. Config cleared.');
    process.exit(0);
  }

  // Load or prompt for credentials
  let config = loadConfig();
  if (!config) {
    config = await promptLogin(SERVER_URL);
  } else {
    console.log(`Work Tracker Agent running as ${config.employeeName}`);
    console.log(`Reporting to: ${config.serverUrl}`);
    console.log('Press Ctrl+C to stop.\n');
  }

  // Clear cached PS script so it gets regenerated with correct formatting
  clearPsScriptCache();

  const reporter = new Reporter(config.token, config.serverUrl);
  reporter.log({ eventType: 'session_start', page: 'Desktop Agent Started', metadata: { agent: 'desktop', version: '1.0.0' } });

  let lastWindow: WindowInfo | null = null;
  let windowSince: number = Date.now();
  let lastActivityTime: number = Date.now();
  let isIdle = false;

  console.log('Tracking started. Active window will be logged every 3 seconds.\n');

  const poll = setInterval(() => {
    const current = getActiveWindow();
    const now = Date.now();

    // Idle detection — if same window for > IDLE_THRESHOLD_MS with no change
    const timeSinceActivity = now - lastActivityTime;
    if (!isIdle && timeSinceActivity > IDLE_THRESHOLD_MS) {
      isIdle = true;
      reporter.log({
        eventType: 'idle',
        page: lastWindow?.title || 'Unknown',
        metadata: { appName: lastWindow?.appName, category: lastWindow?.category },
      });
      console.log(`[IDLE] No activity for ${Math.round(timeSinceActivity / 60000)} min`);
    }

    // Window changed
    const windowChanged = !lastWindow ||
      current.title !== lastWindow.title ||
      current.appName !== lastWindow.appName;

    if (windowChanged) {
      lastActivityTime = now;

      if (isIdle) {
        isIdle = false;
        reporter.log({ eventType: 'active', page: current.title, metadata: { appName: current.appName } });
      }

      // Log the previous window's dwell time if it was open long enough
      if (lastWindow) {
        const dwellMs = now - windowSince;
        if (dwellMs >= MIN_DWELL_MS) {
          const durationSeconds = Math.round(dwellMs / 1000);
          reporter.log({
            eventType: 'page_visit',
            page: lastWindow.title,
            durationSeconds,
            metadata: {
              appName: lastWindow.appName,
              category: lastWindow.category,
              description: lastWindow.description,
            },
          });
          console.log(`[${lastWindow.category}] ${lastWindow.appName}: "${lastWindow.title.slice(0, 60)}" — ${durationSeconds}s`);
        }
      }

      lastWindow = current;
      windowSince = now;
    }
  }, POLL_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async () => {
    clearInterval(poll);
    if (lastWindow) {
      const durationSeconds = Math.round((Date.now() - windowSince) / 1000);
      reporter.log({
        eventType: 'page_visit',
        page: lastWindow.title,
        durationSeconds,
        metadata: { appName: lastWindow.appName, category: lastWindow.category, description: lastWindow.description },
      });
    }
    reporter.log({ eventType: 'session_end', page: 'Desktop Agent Stopped' });
    await reporter.flush();
    console.log('\nAgent stopped. Goodbye.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('\nAgent failed to start:', err.message);
  if (err.message.includes('connect')) {
    console.error('Make sure the backend server is running: npm run dev (in the project root)');
  }
  process.exit(1);
});
