import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { isValidEmail } from '../utils/validators';
import type { AuthRequest } from '../middleware/auth';
import { getJwtSecret } from '../utils/jwt';

const prisma = new PrismaClient();
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '7d';

function makeToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, ward } = req.body;

    if (!name || !email || !password) {
      const msg = 'Name, email and password are required';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }
    if (!isValidEmail(email)) {
      const msg = 'Enter a valid email address';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      const msg = 'Password must be at least 8 characters with 1 uppercase letter and 1 number';
      return res.status(400).json({ success: false, error: msg, message: msg });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      const msg = 'An account with this email already exists';
      return res.status(409).json({ success: false, error: msg, message: msg });
    }

    const hashed  = await bcrypt.hash(password, 10);
    const count   = await prisma.user.count();
    const citizenId = `JAN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: hashed, ward, citizenId },
    });

    const token = makeToken(user.id, user.role);
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, citizenId: user.citizenId, name: user.name, email: user.email, role: user.role, ward: user.ward, xp: user.xp, level: user.level, activeCharacter: user.activeCharacter },
      },
    });
  } catch {
    const msg = 'Registration failed. Please try again.';
    return res.status(500).json({ success: false, error: msg, message: msg });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const invalidLoginMessage = 'Invalid email or password.';
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user)
      return res.status(401).json({ success: false, error: invalidLoginMessage });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ success: false, error: invalidLoginMessage });

    const token = makeToken(user.id, user.role);
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, citizenId: user.citizenId, name: user.name, email: user.email, role: user.role, ward: user.ward, xp: user.xp, level: user.level, activeCharacter: user.activeCharacter },
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, citizenId: true, name: true, email: true, role: true, ward: true, avatarUrl: true,
        xp: true, level: true, badges: true, reportStreak: true, createdAt: true,
        activeCharacter: true,
        _count: { select: { issues: true, comments: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
}
