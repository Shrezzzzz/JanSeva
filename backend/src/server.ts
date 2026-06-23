import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import authRoutes      from './routes/auth';
import issueRoutes     from './routes/issues';
import uploadRoutes    from './routes/upload';
import analyticsRoutes from './routes/analytics';
import aiRoutes        from './routes/ai';
import userRoutes      from './routes/users';

import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001');

// ── Security & utilities ──────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

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
app.use('/api/auth',      authRoutes);
app.use('/api/issues',    issueRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/users',     userRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`JanSeva API running on http://localhost:${PORT}`);
});

export default app;
