import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getJwtSecret } from '../utils/jwt';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userName?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Please sign in to continue.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      role: string;
    };
    req.userId   = payload.userId;
    req.userRole = payload.role;

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } });
    req.userName = user?.name || undefined;

    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }
}

export function requireRole(roles: string[] | string, ...moreRoles: string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles, ...moreRoles];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this page.' });
    }
    next();
  };
}

/** Attaches userId/userRole if a valid Bearer token is present, but never rejects. */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), getJwtSecret()) as {
        userId: string;
        role: string;
      };
      req.userId   = payload.userId;
      req.userRole = payload.role;
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } });
      req.userName = user?.name || undefined;
    } catch {
      // Token invalid — treat as anonymous, do not reject
    }
  }
  next();
}
