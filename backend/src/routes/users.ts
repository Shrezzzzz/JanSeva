import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import {
  DEPARTMENT_ASSIGNMENTS,
  getDepartmentAssignmentForUser,
  isClosedStatus,
  isDuplicateMunicipalAuthority,
  issueBelongsToAuthority,
} from '../services/authorityAssignmentService';

const prisma = new PrismaClient();
const router = Router();

const AVATAR_TIERS = [
  { id: 'male-0-explorer', xp: 0 },
  { id: 'male-100-observer', xp: 100 },
  { id: 'male-300-reporter', xp: 300 },
  { id: 'male-600-guardian', xp: 600 },
  { id: 'male-1000-detective', xp: 1000 },
  { id: 'male-2000-hero', xp: 2000 },
  { id: 'female-0-explorer', xp: 0 },
  { id: 'female-100-observer', xp: 100 },
  { id: 'female-300-reporter', xp: 300 },
  { id: 'female-600-guardian', xp: 600 },
  { id: 'female-1000-detective', xp: 1000 },
  { id: 'female-2000-hero', xp: 2000 },
] as const;

const VALID_AVATAR_IDS = new Set<string>(AVATAR_TIERS.map((avatar) => avatar.id));

// GET /api/authority/team — all Authority + Admin users with active case counts
router.get('/authority-team', authMiddleware, requireRole(['Authority', 'Admin']), async (_req: Request, res: Response) => {
  try {
    const authorityUsers = await prisma.user.findMany({
      where: { role: { in: ['Authority', 'Admin'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, name: true, email: true, role: true, ward: true,
      },
    });
    const hasAdmin = authorityUsers.some((user) => user.role === 'Admin');
    const members = authorityUsers.filter((user) => !isDuplicateMunicipalAuthority(user, hasAdmin));

    const issues = await prisma.issue.findMany({
      select: {
        assignedTo: true,
        department: true,
        zone: true,
        status: true,
        category: true,
      },
    });

    const data = members.map((m) => ({
      id:           m.id,
      name:         m.name,
      email:        m.email,
      role:         m.role,
      ward:         m.ward,
      assignedDepartments: getDepartmentAssignmentForUser(m)
        ? [getDepartmentAssignmentForUser(m)!.name]
        : m.role === 'Admin'
          ? DEPARTMENT_ASSIGNMENTS.map((dept) => dept.name)
          : [],
      assignedWard: m.ward && m.ward !== 'All' && m.ward !== 'City-Wide' ? m.ward : null,
      activeCases: issues.filter((issue) =>
        !isClosedStatus(issue.status) && issueBelongsToAuthority(issue, m)
      ).length,
      resolvedCases: issues.filter((issue) =>
        isClosedStatus(issue.status) && issueBelongsToAuthority(issue, m)
      ).length,
    }));

    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch team' });
  }
});

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

// GET /api/users/online — users active in last 24h with their last known coords
router.get('/online', async (_req: Request, res: Response) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
    // Find users who reported in last 24h, with their latest issue location
    const recentIssues = await prisma.issue.findMany({
      where:   { createdAt: { gte: cutoff }, reporterId: { not: null }, isAnonymous: false },
      orderBy: { createdAt: 'desc' },
      distinct: ['reporterId'],
      select: {
        reporterId: true,
        latitude: true,
        longitude: true,
        reporter: { select: { id: true, name: true, citizenId: true, xp: true, level: true } },
      },
    });

    const online = recentIssues
      .filter((i) => i.reporter)
      .map((i) => ({
        id:        i.reporter!.id,
        name:      i.reporter!.name,
        citizenId: i.reporter!.citizenId,
        xp:        i.reporter!.xp,
        level:     i.reporter!.level,
        lat:       i.latitude,
        lng:       i.longitude,
      }));

    return res.json({ success: true, data: online });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch online users' });
  }
});

router.patch('/character', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { characterId } = req.body as { characterId?: string };
  if (!characterId || !VALID_AVATAR_IDS.has(characterId)) {
    return res.status(400).json({ success: false, error: 'Invalid avatar' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { xp: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const avatar = AVATAR_TIERS.find((item) => item.id === characterId);
    if (!avatar || user.xp < avatar.xp) {
      return res.status(403).json({ success: false, error: 'Avatar is locked' });
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data:  { activeCharacter: characterId },
    });
    return res.json({ success: true, data: { activeCharacter: updated.activeCharacter } });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to update avatar' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, citizenId: true, name: true, role: true, ward: true, avatarUrl: true, xp: true,
        level: true, badges: true, reportStreak: true, createdAt: true,
        activeCharacter: true,
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
