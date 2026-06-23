import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth';
import { getIssuesNearby, getIssuesInBounds } from '../services/geoService';
import { checkDuplicate } from '../services/groqService';
import { awardXP } from '../services/xpService';
import { notifyStatusUpdate } from '../services/notificationService';
import { isValidCoords } from '../utils/validators';
import { broadcastNewIssue } from '../server';

const prisma = new PrismaClient();

// --- GET /api/issues ---
export async function getIssues(req: Request, res: Response) {
  try {
    const { categories, statuses, severities, dateRange, zone, q, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const p = parseInt(page);
    const ps = Math.min(parseInt(pageSize), 100);
    const skip = (p - 1) * ps;

    const cutoff = dateRange
      ? { '7d': 7, '30d': 30, '90d': 90 }[dateRange] ?? undefined
      : undefined;

    const where: Record<string, unknown> = {};
    if (categories) where.category = { in: categories.split(',') };
    if (statuses)   where.status   = { in: statuses.split(',') };
    if (severities) where.severity = { in: severities.split(',') };
    if (zone)       where.zone     = zone;
    if (cutoff)     where.createdAt = { gte: new Date(Date.now() - cutoff * 86400000) };
    if (q)          where.title    = { contains: q, mode: 'insensitive' };

    const [total, data] = await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.findMany({
        where, skip, take: ps,
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { id: true, name: true } } },
      }),
    ]);

    return res.json({
      success: true,
      data,
      pagination: {
        page: p, pageSize: ps, total,
        totalPages: Math.ceil(total / ps),
        hasNext: p * ps < total,
        hasPrev: p > 1,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch issues' });
  }
}

// --- GET /api/issues/map ---
export async function getIssuesForMap(req: Request, res: Response) {
  try {
    const { north, south, east, west } = req.query as Record<string, string>;
    const data = await getIssuesInBounds(+north, +south, +east, +west);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch map issues' });
  }
}

// --- GET /api/issues/nearby ---
export async function getNearbyIssues(req: Request, res: Response) {
  try {
    const { lat, lng, radius = '200' } = req.query as Record<string, string>;
    const data = await getIssuesNearby(+lat, +lng, +radius);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch nearby issues' });
  }
}

// --- GET /api/issues/:id ---
export async function getIssueById(req: Request, res: Response) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    return res.json({ success: true, data: issue });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch issue' });
  }
}

// --- POST /api/issues ---
export async function createIssue(req: AuthRequest, res: Response) {
  try {
    const {
      title, description, category, severity = 'Medium', latitude, longitude,
      address, zone, mediaUrls = [], isAnonymous = false,
      aiCategory, aiConfidence, aiSeverity, estimatedResolutionDays, department,
    } = req.body;

    if (!title || !category)
      return res.status(400).json({ success: false, error: 'title and category are required' });
    if (!isValidCoords(latitude, longitude))
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });

    // Duplicate check — skip if Groq API key is not configured
    const nearby = await getIssuesNearby(latitude, longitude, 200);
    let dupResult = null;
    if (nearby.length && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
      dupResult = await checkDuplicate(
        { title, description, category },
        nearby.map((i) => ({ id: i.id, title: i.title, category: i.category })),
      ).catch(() => null);
    }

    const issue = await prisma.issue.create({
      data: {
        title, description, category, severity, latitude, longitude,
        address, zone, mediaUrls, isAnonymous,
        reporterId: req.userId ?? null,
        aiCategory, aiConfidence, aiSeverity, estimatedResolutionDays, department,
        duplicateOf: (dupResult as { isDuplicate?: boolean; duplicateId?: string | null } | null)?.isDuplicate && (dupResult as { confidence: number } | null)?.confidence as number > 0.8
          ? (dupResult as { duplicateId?: string | null })?.duplicateId ?? null
          : null,
      },
    });

    // Timeline entry
    await prisma.timeline.create({
      data: {
        issueId: issue.id, event: 'Issue Reported',
        actor: isAnonymous ? 'Anonymous' : 'Citizen',
        actorRole: 'Citizen',
        note: 'Submitted via JanSeva',
      },
    });

    // Award XP
    if (req.userId) await awardXP(req.userId, 20);

    // Broadcast to SSE clients
    broadcastNewIssue(issue);

    return res.status(201).json({ success: true, data: issue });
  } catch (e) {
    const msg = (e instanceof Error) ? e.message : 'Failed to create issue';
    console.error('createIssue error:', e);
    return res.status(500).json({ success: false, error: msg, message: msg });
  }
}

// --- PATCH /api/issues/:id/status ---
export async function updateIssueStatus(req: AuthRequest, res: Response) {
  try {
    const { status, note } = req.body;
    const issue = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status },
      include: { reporter: { select: { email: true, name: true } } },
    });

    await prisma.timeline.create({
      data: {
        issueId: issue.id, event: `Status updated to ${status}`,
        actor: 'Authority', actorRole: 'Authority', note,
      },
    });

    if (issue.reporter) {
      await notifyStatusUpdate({
        reporterEmail: issue.reporter.email,
        issueTitle:    issue.title,
        newStatus:     status,
        issueId:       issue.id,
      });
    }

    if (status === 'Resolved' && issue.reporterId) {
      await awardXP(issue.reporterId, 50);
    }

    return res.json({ success: true, data: issue });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to update status' });
  }
}

// --- POST /api/issues/:id/upvote ---
export async function upvoteIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, error: 'Login required' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.verifiedBy.includes(req.userId))
      return res.status(409).json({ success: false, error: 'Already verified' });

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        upvotes:    { increment: 1 },
        verifiedBy: { push: req.userId },
        status: issue.upvotes + 1 >= 10 && issue.status === 'Reported' ? 'Verified' : undefined,
      },
    });

    await awardXP(req.userId, 5);
    if (issue.reporterId) await awardXP(issue.reporterId, 10);

    return res.json({ success: true, data: { upvotes: updated.upvotes } });
  } catch {
    return res.status(500).json({ success: false, error: 'Upvote failed' });
  }
}

// --- POST /api/issues/:id/comments ---
export async function addComment(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, error: 'Login required' });
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content required' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), issueId: req.params.id, authorId: req.userId },
      include: { author: { select: { id: true, name: true } } },
    });

    await awardXP(req.userId, 5);
    return res.status(201).json({ success: true, data: comment });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
}

// --- PATCH /api/issues/:id (reporter edits own issue) ---
export async function updateIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, error: 'Login required' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.reporterId !== req.userId)
      return res.status(403).json({ success: false, error: 'You can only edit your own reports' });

    const LOCKED_STATUSES = ['Verified', 'Assigned', 'InProgress', 'Resolved', 'Closed'];
    if (LOCKED_STATUSES.includes(issue.status))
      return res.status(409).json({ success: false, error: 'This report has been picked up and can no longer be edited' });

    const { description, severity, mediaUrls } = req.body;
    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(severity    !== undefined && { severity }),
        ...(mediaUrls   !== undefined && { mediaUrls }),
      },
    });

    return res.json({ success: true, data: updated });
  } catch (e) {
    const msg = (e instanceof Error) ? e.message : 'Failed to update issue';
    return res.status(500).json({ success: false, error: msg, message: msg });
  }
}

// --- DELETE /api/issues/:id (reporter deletes own issue) ---
export async function deleteIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, error: 'Login required' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.reporterId !== req.userId)
      return res.status(403).json({ success: false, error: 'You can only delete your own reports' });

    await prisma.issue.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    const msg = (e instanceof Error) ? e.message : 'Failed to delete issue';
    return res.status(500).json({ success: false, error: msg, message: msg });
  }
}
