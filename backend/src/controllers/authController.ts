import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { isValidEmail } from '../utils/validators';
import type { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const JWT_SECRET  = process.env.JWT_SECRET  ?? 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '7d';

function makeToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
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
        user: { id: user.id, citizenId: user.citizenId, name: user.name, email: user.email, role: user.role, ward: user.ward, xp: user.xp, level: user.level },
      },
    });
  } catch (e) {
    const msg = 'Registration failed. Please try again.';
    return res.status(500).json({ success: false, error: msg, message: msg });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'email and password are required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Auto-create pet on first login
    await prisma.pet.upsert({
      where:  { userId: user.id },
      update: {},
      create: { id: `pet_${user.id}`, userId: user.id, name: 'Nagar', stage: 0, mood: 'happy' },
    });

    const token = makeToken(user.id, user.role);
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, citizenId: user.citizenId, name: user.name, email: user.email, role: user.role, ward: user.ward, xp: user.xp, level: user.level },
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, citizenId: true, name: true, email: true, role: true, ward: true,
        xp: true, level: true, badges: true, reportStreak: true, createdAt: true,
        pet: { select: { name: true, stage: true, mood: true } },
        _count: { select: { issues: true, comments: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
}
