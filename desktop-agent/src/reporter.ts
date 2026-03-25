/**
 * reporter.ts
 * Batches activity events and sends them to the backend.
 * Retries on failure and queues events locally if offline.
 */

import axios from 'axios';

interface ActivityEvent {
  eventType: string;
  page: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export class Reporter {
  private queue: ActivityEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private token: string;
  private serverUrl: string;

  constructor(token: string, serverUrl: string) {
    this.token = token;
    this.serverUrl = serverUrl;
    // Flush every 30 seconds
    this.flushTimer = setInterval(() => this.flush(), 30_000);
  }

  log(event: ActivityEvent) {
    this.queue.push(event);
    // Flush immediately for all events (don't wait 30s)
    this.flush();
  }

  async flush() {
    if (this.queue.length === 0) return;
    const batch = [...this.queue];
    this.queue = [];

    for (const event of batch) {
      try {
        await axios.post(`${this.serverUrl}/api/activity`, event, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 5000,
        });
      } catch {
        // Re-queue on failure (up to 100 events to avoid memory leak)
        if (this.queue.length < 100) this.queue.unshift(event);
      }
    }
  }

  async stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush(); // await so process doesn't exit before data is sent
  }
}
