import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

import authRoutes      from './routes/auth';
import issueRoutes     from './routes/issues';
import uploadRoutes    from './routes/upload';
import analyticsRoutes from './routes/analytics';
import aiRoutes        from './routes/ai';
import userRoutes      from './routes/users';
import missionRoutes   from './routes/missions';

import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { generateDailyMissionsForAllUsers } from './services/missionService';

const app  = express();
const PORT = Number(process.env.PORT) || 3001;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

// ── Security & utilities ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      connectSrc: ["'self'", 'https:'],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests and, when configured, enforce a frontend allowlist.
    if (!origin || !process.env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    const allowed = process.env.FRONTEND_URL
      .split(',')
      .map((u) => u.trim());
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    uptime: process.uptime(),
  })
);

// Root endpoint (for Render health checks)
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'JanSeva Backend',
    message: 'API is running',
  });
});

app.head('/', (_req, res) => {
  res.sendStatus(200);
});

// ── Global SSE stream for new issues ─────────────────────────────────────────
const sseClients = new Set<express.Response>();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();
  sseClients.add(res);
  const iv = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { sseClients.delete(res); clearInterval(iv); });
});

// Expose broadcaster (used in issue controller after creation)
export function broadcastNewIssue(issue: unknown) {
  const payload = `event: new_issue\ndata: ${JSON.stringify(issue)}\n\n`;
  sseClients.forEach((client) => client.write(payload));
}

// ── API routes ────────────────────────────────────────────────────────────────
import { getAuthorityActivityHandler, getAuthorityIssuesHandler, getWardStatsHandler } from './routes/issues';
import { authMiddleware, requireRole } from './middleware/auth';

app.get('/api/authority/issues',     authMiddleware, requireRole(['Authority', 'Admin']), getAuthorityIssuesHandler);
app.get('/api/authority/activity',   authMiddleware, requireRole(['Authority', 'Admin']), getAuthorityActivityHandler);
app.get('/api/authority/ward-stats', authMiddleware, requireRole(['Authority', 'Admin']), getWardStatsHandler);

app.use('/api/auth',      authRoutes);
app.use('/api/issues',    issueRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/missions',  missionRoutes);

// ── Serve frontend static files (production: dist copied to ./public) ─────────
const STATIC_DIR = path.join(__dirname, '..', 'public');
if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  // SPA fallback — any unmatched GET that is not an /api/* route returns index.html
  app.get(/^(?!\/api\/|\/health).*$/, (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Cron jobs ─────────────────────────────────────────────────────────────────
// Every day at midnight — generate daily missions
cron.schedule('0 0 * * *', async () => {
  logger.info('Running daily cron: missions');
  await generateDailyMissionsForAllUsers().catch((e) => logger.error('Mission cron failed', e));
});

// ── Start ─────────────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so Cloud Run (and any container runtime) can reach the server.
// Binding to 'localhost' only would cause connection refused inside a container.
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`JanSeva API running on port ${PORT}`);
});

export default app;
