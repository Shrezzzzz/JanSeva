import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path}`, { message: err.message });

  if (res.headersSent) return;

  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Something went wrong. Please try again.' : err.message,
  });
}

export function notFound(req: Request, res: Response) {
  logger.error(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: 'The requested resource was not found.' });
}
