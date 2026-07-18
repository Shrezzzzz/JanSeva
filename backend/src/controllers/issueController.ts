import type { Request, Response } from 'express';
import { Category, PrismaClient, Role } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth';
import { getIssuesNearby, getIssuesInBounds } from '../services/geoService';
import { awardXP } from '../services/xpService';
import { checkMissionCompletion } from '../services/missionService';
import { notifyStatusUpdate } from '../services/notificationService';
import { isValidCoords } from '../utils/validators';
import { broadcastNewIssue } from '../server';
import { analyzeIssue } from '../ai/decisionEngine';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// --- GET /api/issues ---
export async function getIssues(req: Request, res: Response) {
  try {
    const { categories, statuses, severities, dateRange, zone, q, reporterId, page = '1', pageSize = '20' } = req.query as Record<string, string>;
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
    if (reporterId) where.reporterId = reporterId;
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
export async function getIssueById(req: AuthRequest, res: Response) {
  try {
    const includeNotes = req.userRole === 'Authority' || req.userRole === 'Admin';
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        timeline: { orderBy: { createdAt: 'asc' } },
        ...(includeNotes ? { internalNotes: { orderBy: { createdAt: 'asc' } } } : {}),
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
    } = req.body;

    if (!title || !category)
      return res.status(400).json({ success: false, error: 'title and category are required' });
    if (!isValidCoords(latitude, longitude))
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });

    const issue = await prisma.issue.create({
      data: {
        title, description, category, severity, latitude, longitude,
        address, zone, mediaUrls, isAnonymous,
        reporterId: req.userId ?? null,
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

    // Award XP + check missions
    if (req.userId) {
      await awardXP(req.userId, 20);
      await checkMissionCompletion(req.userId, category as Category).catch(() => null);
    }

    // Broadcast to SSE clients
    broadcastNewIssue(issue);

    // Respond to the citizen immediately — AI enrichment runs in the background.
    // department/category will be null on the initial response and populated
    // within seconds as the background task completes. The ReportForm polls
    // fetchIssueById every 2.5s to pick up the enriched fields.
    res.status(201).json({ success: true, data: issue });

    // Background: AI enrichment + n8n webhook.
    // analyzeIssue() is an async function — any synchronous throw inside it becomes
    // a rejected promise. Both resolve(null) and reject(...) are explicitly handled:
    //   resolve(analysis) → fire n8n webhook with enriched department field
    //   resolve(null)     → early return, no webhook (issue not found — shouldn't happen)
    //   reject(err)       → .catch() logs + writes aiFailureReason to DB, never crashes
    analyzeIssue(issue.id)
      .then((analysis) => {
        if (!analysis) return;
        // n8n alert fires after enrichment so department is populated in the payload.
        const webhookUrl = process.env.N8N_ALERT_WEBHOOK_URL;
        if (!webhookUrl) return;
        // Re-fetch the fully-written issue row so all AI fields are present.
        prisma.issue.findUnique({ where: { id: issue.id } })
          .then((enriched) => {
            const payload = enriched ?? issue;
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id:         payload.id,
                title:      payload.title,
                category:   payload.category,
                severity:   payload.severity,
                address:    payload.address,
                zone:       payload.zone,
                createdAt:  payload.createdAt,
                department: payload.department,
              }),
            }).catch((err) => logger.error('n8n webhook dispatch failed', err));
          })
          .catch((err) => logger.error('Post-enrichment issue re-fetch failed', err));
      })
      .catch(async (err) => {
        logger.error(`Background AI enrichment failed for issue ${issue.id}`, err);
        await prisma.issue.update({
          where: { id: issue.id },
          data: { aiFailureReason: err instanceof Error ? err.message : 'AI enrichment failed' },
        }).catch(() => null);
      });
  } catch (e) {
    console.error('createIssue error:', e);
    const msg = 'Something went wrong while submitting your report. Please try again.';
    return res.status(500).json({ success: false, error: msg, message: msg });
  }
}

// --- POST /api/issues/:id/join-duplicate ---
export async function joinDuplicateIssue(req: AuthRequest, res: Response) {
  try {
    const duplicate = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!duplicate) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (!duplicate.duplicateOf) {
      return res.status(409).json({ success: false, error: 'No linked duplicate report found' });
    }

    const original = await prisma.issue.findUnique({ where: { id: duplicate.duplicateOf } });
    if (!original) return res.status(404).json({ success: false, error: 'Original issue not found' });

    const alreadyVerified = req.userId ? original.verifiedBy.includes(req.userId) : false;
    const updatedOriginal = await prisma.issue.update({
      where: { id: original.id },
      data: {
        upvotes: alreadyVerified ? undefined : { increment: 1 },
        verifiedBy: req.userId && !alreadyVerified ? { push: req.userId } : undefined,
      },
    });

    await prisma.issue.update({
      where: { id: duplicate.id },
      data: { status: 'Closed' },
    });

    await prisma.timeline.create({
      data: {
        issueId: duplicate.id,
        event: 'Joined existing report',
        actor: req.userName ?? 'Citizen',
        actorRole: Object.values(Role).includes(req.userRole as Role) ? req.userRole as Role : 'Citizen',
        note: `Linked to existing report ${original.id}`,
      },
    });

    return res.json({ success: true, data: updatedOriginal });
  } catch (e) {
    const msg = (e instanceof Error) ? e.message : 'Failed to join duplicate report';
    return res.status(500).json({ success: false, error: msg });
  }
}

// --- PATCH /api/issues/:id/status ---
export async function updateIssueStatus(req: AuthRequest, res: Response) {
  try {
    const { status, note } = req.body;

    // Transitions that have dedicated routes must not come through here
    const DEDICATED_ROUTE_STATUSES = ['Accepted', 'InProgress', 'Completed', 'NeedsVerification', 'Resolved'];
    if (DEDICATED_ROUTE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Use the dedicated /${status.toLowerCase()} endpoint for this transition`,
      });
    }

    const actorName = req.userName ?? 'Authority';

    const issue = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status },
      include: { reporter: { select: { email: true, name: true } } },
    });

    await prisma.timeline.create({
      data: {
        issueId: issue.id,
        event: `Status updated to ${status}`,
        actor: actorName,
        actorRole: 'Authority',
        note,
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

// --- POST /api/issues/:id/follow (toggle) ---
export async function followIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, error: 'Login required' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

    const alreadyFollowing = (issue.followedBy as string[]).includes(req.userId);

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        followedBy: alreadyFollowing
          ? { set: (issue.followedBy as string[]).filter((id) => id !== req.userId) }
          : { push: req.userId },
      },
    });

    return res.json({
      success: true,
      data: {
        following: !alreadyFollowing,
        followers: (updated.followedBy as string[]).length,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update follow status';
    return res.status(500).json({ success: false, error: msg });
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
