import { Router } from 'express';
import { register, login, getMe, selectWard } from '../controllers/authController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { PrismaClient } from '@prisma/client';
import { deductXP } from '../services/xpService';

const prisma = new PrismaClient();
const router = Router();

router.post('/register',     authLimiter, register);
router.post('/login',        authLimiter, login);
router.get('/me',            authMiddleware, getMe);
router.post('/select-ward',  authMiddleware, selectWard);

// ── Admin: citizen penalty actions ───────────────────────────────────────────

/** POST /api/auth/admin/citizens/:id/deduct-xp
 *  Admin only. Body: { amount: number } */
router.post('/admin/citizens/:id/deduct-xp', authMiddleware, requireRole(['Admin']), async (req, res) => {
  const { amount } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'amount must be a positive number' });
  }
  try {
    await deductXP(req.params.id, amount);
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: { id: true, name: true, email: true, xp: true, level: true },
    });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to deduct XP' });
  }
});

/** POST /api/auth/admin/citizens/:id/suspend
 *  Admin only. Body: { until: string (ISO date, e.g. "2026-08-01") } */
router.post('/admin/citizens/:id/suspend', authMiddleware, requireRole(['Admin']), async (req, res) => {
  const { until } = req.body;
  const date = until ? new Date(until) : null;
  if (!date || isNaN(date.getTime()) || date <= new Date()) {
    return res.status(400).json({ success: false, error: 'until must be a valid future date (ISO string)' });
  }
  try {
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { suspendedUntil: date },
      select: { id: true, name: true, email: true, suspendedUntil: true },
    });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to suspend citizen' });
  }
});

export default router;
