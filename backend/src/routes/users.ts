import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/users — list citizens (admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role = 'Citizen', limit = '20', page = '1' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * take;
    const [total, users] = await Promise.all([
      prisma.user.count({ where: { role: role as 'Citizen' | 'Moderator' | 'Authority' | 'Admin' } }),
      prisma.user.findMany({
        where: { role: role as 'Citizen' | 'Moderator' | 'Authority' | 'Admin' },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true, name: true, role: true, ward: true, xp: true,
          level: true, reportStreak: true, createdAt: true,
          _count: { select: { issues: true } },
        },
      }),
    ]);
    return res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pageSize: take } });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, citizenId: true, name: true, role: true, ward: true, xp: true,
        level: true, badges: true, reportStreak: true, createdAt: true,
        pet: { select: { name: true, stage: true, mood: true } },
        _count: { select: { issues: true, comments: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (req.userId !== req.params.id && req.userRole !== 'Admin')
    return res.status(403).json({ success: false, error: 'Forbidden' });
  try {
    const { name, ward } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { name, ward },
    });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Update failed' });
  }
});

export default router;
