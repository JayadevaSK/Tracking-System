import express, { Application } from 'express';
import cors from 'cors';
import { config } from './utils/config';
import { db } from './utils/db';
import authRoutes from './routes/auth';
import workEntryRoutes from './routes/workEntries';
import dashboardRoutes from './routes/dashboard';
import trackingRoutes from './routes/tracking';
import notificationRoutes from './routes/notifications';
import screenshotRoutes from './routes/screenshots';
import activityRoutes from './routes/activity';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = config.corsOrigin;
    if (allowed === '*' || !origin || allowed.split(',').map(s => s.trim()).includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database
db.initialize();

// Test database connection on startup and auto-create missing tables
db.testConnection().then(async (success) => {
  if (success) {
    console.log('Database connection verified');
    // Auto-create activity_logs table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_type VARCHAR(50) NOT NULL,
          page VARCHAR(200),
          duration_seconds INTEGER,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_id ON activity_logs(employee_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_date ON activity_logs(employee_id, DATE(created_at))`);
      console.log('activity_logs table ready');
    } catch (e) {
      console.warn('Could not auto-create activity_logs table:', e instanceof Error ? e.message : e);
    }
  } else {
    console.error('Database connection failed - check your configuration');
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Employee Work Tracker API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/work-entries', workEntryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await db.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await db.close();
    process.exit(0);
  });
});

export default app;
