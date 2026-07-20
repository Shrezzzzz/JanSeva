import { Router, type Request, type Response } from 'express';
import {
  getIssues, getIssueById, createIssue, updateIssueStatus,
  upvoteIssue, followIssue, addComment, getIssuesForMap, getNearbyIssues,
  updateIssue, deleteIssue, joinDuplicateIssue,
} from '../controllers/issueController';
import { authMiddleware, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';
import { Category, Prisma, PrismaClient, Severity, Status } from '@prisma/client';
import {
  getCanonicalDepartment,
  getDepartmentAssignmentForUser,
  isCityAdmin,
  resolveAuthorityAssignment,
  getAuthorityWhereClause,
} from '../services/authorityAssignmentService';

const prisma = new PrismaClient();
const router = Router();

// Public
router.get('/',        getIssues);
router.get('/map',     getIssuesForMap);
router.get('/nearby',  getNearbyIssues);
router.get('/:id',     optionalAuth, getIssueById);

// Authenticated citizens (optional auth — anonymous submissions allowed)
router.post('/',               optionalAuth,  createIssue);
router.post('/:id/upvote',     authMiddleware, upvoteIssue);
router.post('/:id/follow',     authMiddleware, followIssue);
router.post('/:id/join-duplicate', optionalAuth, joinDuplicateIssue);
router.post('/:id/comments',   authMiddleware, addComment);

// Authority / Admin only
router.patch('/:id/status',    authMiddleware, requireRole('Authority', 'Admin', 'Moderator'), updateIssueStatus);

// PATCH /api/issues/:id/assign — Authority only
router.patch('/:id/assign', authMiddleware, requireRole(['Authority','Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  const { department, assignedTo, note } = req.body;
  const [issueBeforeAssign, authorityUsers] = await Promise.all([
    prisma.issue.findUnique({ where: { id: req.params.id }, select: { category: true, zone: true } }),
    prisma.user.findMany({
      where: { role: { in: ['Authority', 'Admin'] } },
      select: { id: true, name: true, email: true, role: true, ward: true },
    }),
  ]);
  if (!issueBeforeAssign) return res.status(404).json({ success: false, error: 'Issue not found' });

  const normalizedDepartment = getCanonicalDepartment(issueBeforeAssign.category, department);
  const selectedUser = authorityUsers.find((user) => user.email === assignedTo || user.name === assignedTo);
  const fallbackAssignment = resolveAuthorityAssignment({
    category: issueBeforeAssign.category,
    department: normalizedDepartment,
    zone: issueBeforeAssign.zone,
  }, authorityUsers);
  const issue = await prisma.issue.update({
    where: { id: req.params.id },
    data: {
      department: normalizedDepartment,
      assignedTo: selectedUser?.email ?? assignedTo ?? fallbackAssignment.assignedTo,
      status: 'Assigned',
    },
  });
  await prisma.timeline.create({
    data: { issueId: issue.id, event: `Assigned to ${normalizedDepartment}`, actor: authReq.userName!, actorRole: 'Authority', note }
  });
  res.json({ success: true, data: issue });
});

// POST /api/issues/:id/notes — Authority only, not visible to citizens
router.post('/:id/notes', authMiddleware, requireRole(['Authority','Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  const note = await prisma.internalNote.create({
    data: { issueId: req.params.id, authorId: authReq.userId!, authorName: authReq.userName!, content: req.body.content }
  });
  res.json({ success: true, data: note });
});

// GET /api/authority/issues — registered directly on app in server.ts
// Handler is exported below for reuse there.
export async function getAuthorityIssuesHandler(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const getQueryValue = (key: string, fallback = '') => {
    const value = req.query[key];
    return typeof value === 'string' ? value : fallback;
  };
  const ward = getQueryValue('ward');
  const category = getQueryValue('category');
  const status = getQueryValue('status');
  const severity = getQueryValue('severity');
  const page = getQueryValue('page', '1');
  const pageSize = getQueryValue('pageSize', '20');
  const scope = getQueryValue('scope');
  const user = authReq.userId
    ? await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { email: true, role: true, ward: true },
      })
    : null;
  if (!user) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });

  const where: Prisma.IssueWhereInput = {};
  if (ward && ward !== 'All' && ward !== 'City-Wide') where.zone = { contains: ward };
  if (Object.values(Category).includes(category as Category)) where.category = category as Category;
  if (Object.values(Status).includes(status as Status)) where.status = status as Status;
  if (Object.values(Severity).includes(severity as Severity)) where.severity = severity as Severity;

  // For the shared Ward Officer account (no DB ward), use the ?ward= query param
  // passed from the frontend session picker to scope the authority where-clause correctly.
  const effectiveUser = (ward && ward !== 'All' && ward !== 'City-Wide' && !user.ward)
    ? { ...user, ward }
    : user;

  const authorityWhere = getAuthorityWhereClause(effectiveUser);

  // Ward officers are always scoped to NeedsVerification — never apply inbox/my_cases scope overrides for them.
  // The ward officer where-clause already hard-codes status: 'NeedsVerification' in getAuthorityWhereClause.
  const { isWardOfficer: _isWardOfficerCheck } = await import('../services/authorityAssignmentService');
  if (!_isWardOfficerCheck(user)) {
    if (scope === 'my_cases') {
      authorityWhere.status = { notIn: ['Reported', 'Verified'] as any };
    } else if (scope === 'inbox') {
      authorityWhere.status = { in: ['Reported', 'Verified'] as any };
    }
  }

  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
    authorityWhere,
  ];
  
  const p = parseInt(page);
  const ps = parseInt(pageSize);
  
  const issues = await prisma.issue.findMany({
    where, 
    orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
    take: ps, 
    skip: (p - 1) * ps,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,
      latitude: true,
      longitude: true,
      address: true,
      zone: true,
      mediaUrls: true,
      isAnonymous: true,
      reporterId: true,
      upvotes: true,
      verifiedBy: true,
      duplicateOf: true,
      duplicateConfidence: true,
      aiCategory: true,
      aiConfidence: true,
      aiSeverity: true,
      estimatedResolutionDays: true,
      resolutionConfidence: true,
      resolutionReason: true,
      department: true,
      departmentConfidence: true,
      departmentReason: true,
      priorityScore: true,
      priorityLabel: true,
      priorityReason: true,
      authoritySummary: true,
      workflowRecommendation: true,
      aiModelUsed: true,
      aiAnalyzedAt: true,
      aiFailureReason: true,
      assignedTo: true,
      completionNotes: true,
      completionPhotos: true,
      createdAt: true,
      updatedAt: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          issueId: true,
          event: true,
          actor: true,
          actorRole: true,
          note: true,
          mediaUrl: true,
          createdAt: true,
        },
      },
    }
  });
  const withSLA = issues.map(i => ({
    ...i,
    slaHours: Math.floor((Date.now() - new Date(i.createdAt).getTime()) / 3600000),
    slaBreached: (Date.now() - new Date(i.createdAt).getTime()) > 72 * 3600000,
  }));
  res.json({ success: true, data: withSLA });
}

export async function getAuthorityStatsHandler(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const user = authReq.userId
    ? await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { email: true, role: true, ward: true },
      })
    : null;
  if (!user) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });

  // Honour an explicit ?ward= param (used when ward officer selects their ward
  // via the session picker rather than a DB-persisted ward value).
  const wardParam = typeof req.query.ward === 'string' && req.query.ward !== 'All' && req.query.ward !== 'City-Wide'
    ? req.query.ward
    : null;

  // Build the base where-clause scoped to this user's role.
  // For a ward officer whose ward is being passed as a query param, inject it.
  const effectiveUser = wardParam ? { ...user, ward: wardParam } : user;
  const baseWhere = getAuthorityWhereClause(effectiveUser);

  const SLA_BREACH_HOURS = 72;
  const slaBreachCutoff = new Date(Date.now() - SLA_BREACH_HOURS * 3_600_000);

  const [openIssues, activeWork, needsVerification, slaBreached] = await Promise.all([
    // Open: every status except Resolved + Closed
    prisma.issue.count({
      where: { ...baseWhere, status: { notIn: ['Resolved', 'Closed'] } },
    }),
    // Active work: Accepted or InProgress
    prisma.issue.count({
      where: { ...baseWhere, status: { in: ['Accepted', 'InProgress'] } },
    }),
    // Pending field verification
    prisma.issue.count({
      where: { ...baseWhere, status: 'NeedsVerification' },
    }),
    // SLA breached: open issues older than 72 h
    prisma.issue.count({
      where: {
        ...baseWhere,
        status: { notIn: ['Resolved', 'Closed'] },
        createdAt: { lt: slaBreachCutoff },
      },
    }),
  ]);

  return res.json({
    success: true,
    data: { openIssues, activeWork, needsVerification, slaBreached },
  });
}

export async function getAuthorityActivityHandler(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const getQueryValue = (key: string, fallback = '') => {
    const value = req.query[key];
    return typeof value === 'string' ? value : fallback;
  };
  const ward = getQueryValue('ward');
  const limit = Math.min(Math.max(parseInt(getQueryValue('limit', '10')) || 10, 1), 50);
  
  const user = authReq.userId
    ? await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { email: true, role: true, ward: true },
      })
    : null;

  const where: Prisma.TimelineWhereInput = {};
  if (ward && ward !== 'All' && ward !== 'City-Wide') {
    where.issue = { zone: { contains: ward } };
  }
  
  if (user) {
    const effectiveUser = ward && ward !== 'All' && ward !== 'City-Wide' && !user.ward
      ? { ...user, ward }
      : user;
    const authorityWhere = getAuthorityWhereClause(effectiveUser);
    if (Object.keys(authorityWhere).length > 0) {
      where.issue = { ...((where.issue as any) || {}), ...authorityWhere };
    }
  }

  const activity = await prisma.timeline.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      issueId: true,
      event: true,
      actor: true,
      actorRole: true,
      note: true,
      mediaUrl: true,
      createdAt: true,
      issue: {
        select: {
          title: true,
          category: true,
          zone: true,
          status: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: activity.map((item) => ({
      id: item.id,
      issueId: item.issueId,
      event: item.event,
      actor: item.actor,
      actorRole: item.actorRole,
      note: item.note,
      mediaUrl: item.mediaUrl,
      createdAt: item.createdAt,
      issueTitle: item.issue.title,
      category: item.issue.category,
      zone: item.issue.zone,
      status: item.issue.status,
    })),
  });
}

// ── Workflow action routes ────────────────────────────────────────────────────

/**
 * POST /api/issues/:id/accept
 * Department Officer accepts the assignment.
 * Allowed status: Assigned → Accepted
 */
router.post('/:id/accept', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'Assigned') {
      return res.status(409).json({ success: false, error: `Cannot accept an issue in status: ${issue.status}` });
    }
    
    // Only the assigned department officer (or city admin) may accept
    const { 
      isCityAdmin: _isCityAdmin, 
      isDepartmentOfficer: _isDeptOfficer,
      getDepartmentAssignmentForUser,
      getDepartmentAssignmentForName,
      getDepartmentAssignmentForCategory
    } = await import('../services/authorityAssignmentService');
    
    const isAdmin = _isCityAdmin(user);
    const isDept  = _isDeptOfficer(user);
    
    // Check if this department officer can accept this issue
    let canAccept = isAdmin || (issue.assignedTo === user.email);
    
    if (!canAccept && isDept) {
      // Check if issue is assigned to this officer's department
      const userDept = getDepartmentAssignmentForUser(user);
      const issueDept = getDepartmentAssignmentForName(issue.department) ?? 
                       getDepartmentAssignmentForCategory(issue.category);
      
      canAccept = Boolean(userDept && issueDept && userDept.name === issueDept.name);
    }
    
    if (!canAccept) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the assigned department officer can accept this issue' 
      });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status: 'Accepted' },
    });
    await prisma.timeline.create({
      data: {
        issueId: issue.id,
        event:   'Assignment Accepted',
        actor:   authReq.userName!,
        actorRole: 'Authority',
        note:    'Department officer accepted the assigned issue',
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('accept error:', e);
    return res.status(500).json({ success: false, error: 'Failed to accept issue' });
  }
});

/**
 * POST /api/issues/:id/start-work
 * Department Officer starts active work.
 * Allowed status: Accepted → InProgress
 */
router.post('/:id/start-work', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'Accepted') {
      return res.status(409).json({ success: false, error: `Cannot start work on an issue in status: ${issue.status}` });
    }
    
    // Verify permission
    const { 
      isCityAdmin: _isCityAdmin, 
      isDepartmentOfficer: _isDeptOfficer,
      getDepartmentAssignmentForUser,
      getDepartmentAssignmentForName,
      getDepartmentAssignmentForCategory
    } = await import('../services/authorityAssignmentService');
    
    const isAdmin = _isCityAdmin(user);
    const isDept  = _isDeptOfficer(user);
    
    let canStart = isAdmin || (issue.assignedTo === user.email);
    
    if (!canStart && isDept) {
      const userDept = getDepartmentAssignmentForUser(user);
      const issueDept = getDepartmentAssignmentForName(issue.department) ?? 
                       getDepartmentAssignmentForCategory(issue.category);
      canStart = Boolean(userDept && issueDept && userDept.name === issueDept.name);
    }
    
    if (!canStart) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the assigned department officer can start work on this issue' 
      });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status: 'InProgress' },
    });
    await prisma.timeline.create({
      data: {
        issueId:  issue.id,
        event:    'Work Started',
        actor:    authReq.userName!,
        actorRole: 'Authority',
        note:     req.body.note ?? null,
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('start-work error:', e);
    return res.status(500).json({ success: false, error: 'Failed to start work' });
  }
});

/**
 * POST /api/issues/:id/complete
 * Department Officer marks work complete and submits for ward verification.
 * Allowed status: InProgress → NeedsVerification
 * Body: { completionNotes: string, completionPhotos?: string[] }
 */
router.post('/:id/complete', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { completionNotes, completionPhotos = [] } = req.body;
    if (!completionNotes?.trim()) {
      return res.status(400).json({ success: false, error: 'completionNotes is required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'InProgress') {
      return res.status(409).json({ success: false, error: `Cannot complete an issue in status: ${issue.status}` });
    }
    
    // Verify permission
    const { 
      isCityAdmin: _isCityAdmin, 
      isDepartmentOfficer: _isDeptOfficer,
      getDepartmentAssignmentForUser,
      getDepartmentAssignmentForName,
      getDepartmentAssignmentForCategory
    } = await import('../services/authorityAssignmentService');
    
    const isAdmin = _isCityAdmin(user);
    const isDept  = _isDeptOfficer(user);
    
    let canComplete = isAdmin || (issue.assignedTo === user.email);
    
    if (!canComplete && isDept) {
      const userDept = getDepartmentAssignmentForUser(user);
      const issueDept = getDepartmentAssignmentForName(issue.department) ?? 
                       getDepartmentAssignmentForCategory(issue.category);
      canComplete = Boolean(userDept && issueDept && userDept.name === issueDept.name);
    }
    
    if (!canComplete) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the assigned department officer can complete this issue' 
      });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        status:          'NeedsVerification',
        completionNotes,
        completionPhotos,
      },
    });
    await prisma.timeline.create({
      data: {
        issueId:  issue.id,
        event:    'Work Completed — Submitted for Ward Verification',
        actor:    authReq.userName!,
        actorRole: 'Authority',
        note:     completionNotes,
        mediaUrl: completionPhotos[0] ?? null,
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('complete error:', e);
    return res.status(500).json({ success: false, error: 'Failed to complete issue' });
  }
});

/**
 * POST /api/issues/:id/verify-approve
 * Ward Officer approves the completed work → Resolved.
 * Allowed status: NeedsVerification → Resolved
 * Body: { verificationNote?: string }
 */
router.post('/:id/verify-approve', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const { isWardOfficer: _isWardOfficer, isCityAdmin: _isCityAdmin } = await import('../services/authorityAssignmentService');
    // For the shared Ward Officer account (no DB ward), accept the session-selected
    // ward from the ?ward= query param — same pattern as other authority handlers.
    const wardParam = typeof req.query.ward === 'string' && req.query.ward.trim()
      ? req.query.ward.trim()
      : null;
    const effectiveUser = wardParam && !user.ward ? { ...user, ward: wardParam } : user;

    if (!_isWardOfficer(effectiveUser) && !_isCityAdmin(effectiveUser)) {
      return res.status(403).json({ success: false, error: 'Only Ward Officers can approve resolutions' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include: { reporter: { select: { email: true, name: true } } },
    });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'NeedsVerification') {
      return res.status(409).json({ success: false, error: `Cannot approve an issue in status: ${issue.status}` });
    }
    // Ward officer can only approve issues in their ward
    if (_isWardOfficer(effectiveUser) && issue.zone !== effectiveUser.ward) {
      return res.status(403).json({ success: false, error: 'This issue is not in your ward' });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status: 'Resolved' },
    });
    await prisma.timeline.create({
      data: {
        issueId:  issue.id,
        event:    'Resolution Approved by Ward Officer',
        actor:    authReq.userName!,
        actorRole: 'Authority',
        note:     req.body.verificationNote ?? 'Ward officer verified and approved the resolution',
      },
    });

    // Notify citizen + award XP
    if (issue.reporter) {
      const { notifyStatusUpdate } = await import('../services/notificationService');
      await notifyStatusUpdate({
        reporterEmail: issue.reporter.email,
        issueTitle:    issue.title,
        newStatus:     'Resolved',
        issueId:       issue.id,
      });
    }
    if (issue.reporterId) {
      const { awardXP } = await import('../services/xpService');
      await awardXP(issue.reporterId, 50);
    }

    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('verify-approve error:', e);
    return res.status(500).json({ success: false, error: 'Failed to approve resolution' });
  }
});

/**
 * POST /api/issues/:id/verify-reject
 * Ward Officer rejects the completion — sends back to InProgress.
 * Allowed status: NeedsVerification → Rejected → InProgress (two-step write)
 * Body: { rejectionNote: string }
 */
router.post('/:id/verify-reject', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { rejectionNote } = req.body;
    if (!rejectionNote?.trim()) {
      return res.status(400).json({ success: false, error: 'rejectionNote is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const { isWardOfficer: _isWardOfficer, isCityAdmin: _isCityAdmin } = await import('../services/authorityAssignmentService');
    // For the shared Ward Officer account (no DB ward), accept the session-selected
    // ward from the ?ward= query param — same pattern as other authority handlers.
    const wardParam = typeof req.query.ward === 'string' && req.query.ward.trim()
      ? req.query.ward.trim()
      : null;
    const effectiveUser = wardParam && !user.ward ? { ...user, ward: wardParam } : user;

    if (!_isWardOfficer(effectiveUser) && !_isCityAdmin(effectiveUser)) {
      return res.status(403).json({ success: false, error: 'Only Ward Officers can reject resolutions' });
    }

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'NeedsVerification') {
      return res.status(409).json({ success: false, error: `Cannot reject an issue in status: ${issue.status}` });
    }
    if (_isWardOfficer(effectiveUser) && issue.zone !== effectiveUser.ward) {
      return res.status(403).json({ success: false, error: 'This issue is not in your ward' });
    }

    // Rejected → back to InProgress so dept officer can redo the work
    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        status:          'InProgress',
        completionNotes: null,
        completionPhotos: [],
      },
    });
    await prisma.timeline.create({
      data: {
        issueId:  issue.id,
        event:    'Resolution Rejected — Returned for Rework',
        actor:    authReq.userName!,
        actorRole: 'Authority',
        note:     rejectionNote,
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('verify-reject error:', e);
    return res.status(500).json({ success: false, error: 'Failed to reject resolution' });
  }
});

/**
 * POST /api/issues/:id/ward-verify-true
 * Ward Officer confirms the report is legitimate.
 * Reported → AwaitingAssignment
 */
router.post('/:id/ward-verify-true', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where:  { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const { isWardOfficer: _isWO, isCityAdmin: _isAdmin } = await import('../services/authorityAssignmentService');
    const wardParam = typeof req.query.ward === 'string' && req.query.ward.trim() ? req.query.ward.trim() : null;
    const effectiveUser = wardParam && !user.ward ? { ...user, ward: wardParam } : user;

    if (!_isWO(effectiveUser) && !_isAdmin(effectiveUser)) {
      return res.status(403).json({ success: false, error: 'Only Ward Officers can verify reports' });
    }

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'Reported') {
      return res.status(409).json({ success: false, error: `Can only verify a Reported issue (current: ${issue.status})` });
    }
    if (_isWO(effectiveUser) && issue.zone !== effectiveUser.ward) {
      return res.status(403).json({ success: false, error: 'This issue is not in your ward' });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status: 'AwaitingAssignment' },
    });
    await prisma.timeline.create({
      data: {
        issueId:   issue.id,
        event:     'Report Verified by Ward Officer',
        actor:     authReq.userName!,
        actorRole: 'Authority',
        note:      'Ward Officer confirmed this is a legitimate civic issue',
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('ward-verify-true error:', e);
    return res.status(500).json({ success: false, error: 'Failed to verify report' });
  }
});

/**
 * POST /api/issues/:id/ward-verify-false
 * Ward Officer flags the report as false/invalid.
 * Reported → FlaggedFalse
 * Body: { flagNote: string }
 */
router.post('/:id/ward-verify-false', authMiddleware, requireRole(['Authority', 'Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { flagNote } = req.body;
    if (!flagNote?.trim()) {
      return res.status(400).json({ success: false, error: 'flagNote is required when flagging a false report' });
    }

    const user = await prisma.user.findUnique({
      where:  { id: authReq.userId! },
      select: { email: true, role: true, ward: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorised' });

    const { isWardOfficer: _isWO, isCityAdmin: _isAdmin } = await import('../services/authorityAssignmentService');
    const wardParam = typeof req.query.ward === 'string' && req.query.ward.trim() ? req.query.ward.trim() : null;
    const effectiveUser = wardParam && !user.ward ? { ...user, ward: wardParam } : user;

    if (!_isWO(effectiveUser) && !_isAdmin(effectiveUser)) {
      return res.status(403).json({ success: false, error: 'Only Ward Officers can flag false reports' });
    }

    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'Reported') {
      return res.status(409).json({ success: false, error: `Can only flag a Reported issue (current: ${issue.status})` });
    }
    if (_isWO(effectiveUser) && issue.zone !== effectiveUser.ward) {
      return res.status(403).json({ success: false, error: 'This issue is not in your ward' });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status: 'FlaggedFalse', wardFlagNote: flagNote.trim() },
    });
    await prisma.timeline.create({
      data: {
        issueId:   issue.id,
        event:     'Report Flagged as False by Ward Officer',
        actor:     authReq.userName!,
        actorRole: 'Authority',
        note:      flagNote.trim(),
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('ward-verify-false error:', e);
    return res.status(500).json({ success: false, error: 'Failed to flag report' });
  }
});

/**
 * POST /api/issues/:id/restore-flagged
 * City Admin restores a FlaggedFalse issue → AwaitingAssignment. No citizen penalty.
 */
router.post('/:id/restore-flagged', authMiddleware, requireRole(['Admin']), async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
    if (issue.status !== 'FlaggedFalse') {
      return res.status(409).json({ success: false, error: `Can only restore a FlaggedFalse issue (current: ${issue.status})` });
    }

    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data:  { status: 'AwaitingAssignment', wardFlagNote: null },
    });
    await prisma.timeline.create({
      data: {
        issueId:   issue.id,
        event:     'Flag Removed — Restored by City Admin',
        actor:     authReq.userName!,
        actorRole: 'Admin',
        note:      req.body.note ?? 'City Admin reviewed and restored this report',
      },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('restore-flagged error:', e);
    return res.status(500).json({ success: false, error: 'Failed to restore issue' });
  }
});

// Reporter only — edit description/severity/media or delete their own issue
router.patch('/:id',           authMiddleware, updateIssue);
router.delete('/:id',          authMiddleware, deleteIssue);
// SSE stream for live updates on a single issue
router.get('/:id/events', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();
  // Keep alive ping
  const iv = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => clearInterval(iv));
});

export default router;

// ── Ward Officer stats endpoint ───────────────────────────────────────────────
// Exported so server.ts can register it at /api/authority/ward-stats
export async function getWardStatsHandler(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const user = authReq.userId
    ? await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { email: true, role: true, ward: true },
      })
    : null;
  if (!user) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });

  const { isWardOfficer: _isWO, isCityAdmin: _isCityAdmin } = await import('../services/authorityAssignmentService');

  // For the shared Ward Officer account (no DB ward), accept ?ward= from the session picker.
  const wardParam = typeof req.query.ward === 'string' && req.query.ward !== 'All' && req.query.ward !== 'City-Wide'
    ? req.query.ward
    : null;
  const effectiveUser = wardParam ? { ...user, ward: wardParam } : user;

  if (!_isWO(effectiveUser) && !_isCityAdmin(effectiveUser)) {
    return res.status(403).json({ success: false, error: 'Access restricted to Ward Officers' });
  }

  const ward = effectiveUser.ward && effectiveUser.ward !== 'All' && effectiveUser.ward !== 'City-Wide'
    ? effectiveUser.ward
    : undefined;
  const wardFilter: Prisma.IssueWhereInput = ward ? { zone: ward } : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const [pendingVerif, verifiedToday, returnedForRework, completedThisWeek, recentActivity] = await Promise.all([
    // Pending verification — awaiting ward officer decision
    prisma.issue.count({ where: { ...wardFilter, status: 'NeedsVerification' } }),

    // Verified today — approved by ward officer today
    prisma.issue.count({
      where: {
        ...wardFilter,
        status: 'Resolved',
        updatedAt: { gte: today },
      },
    }),

    // Returned for rework this month — issues ward officer rejected (check timeline for rejection events)
    prisma.timeline.count({
      where: {
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        event: { contains: 'Rejected' },
        ...(ward ? { issue: { zone: ward } } : {}),
      },
    }),

    // Completed this week — issues resolved in the current week
    prisma.issue.count({
      where: {
        ...wardFilter,
        status: { in: ['Resolved', 'Closed'] },
        updatedAt: { gte: weekStart },
      },
    }),

    // Last 8 timeline events in the ward for the activity feed
    prisma.timeline.findMany({
      where: {
        ...(ward ? { issue: { zone: ward } } : {}),
        event: {
          in: [
            'Resolution Approved by Ward Officer',
            'Resolution Rejected — Returned for Rework',
            'Work Completed — Submitted for Ward Verification',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        event: true,
        actor: true,
        actorRole: true,
        note: true,
        createdAt: true,
        issue: {
          select: {
            id: true,
            title: true,
            category: true,
            zone: true,
            status: true,
            department: true,
          },
        },
      },
    }),
  ]);

  return res.json({
    success: true,
    data: {
      pendingVerif,
      verifiedToday,
      returnedForRework,
      completedThisWeek,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        event: a.event,
        actor: a.actor,
        actorRole: a.actorRole,
        note: a.note,
        createdAt: a.createdAt,
        issueId: a.issue.id,
        issueTitle: a.issue.title,
        category: a.issue.category,
        zone: a.issue.zone,
        status: a.issue.status,
        department: a.issue.department,
      })),
    },
  });
}

export async function getReportReviewQueueHandler(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const user = authReq.userId
    ? await prisma.user.findUnique({
        where:  { id: authReq.userId },
        select: { email: true, role: true, ward: true },
      })
    : null;
  if (!user) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });

  const wardParam = typeof req.query.ward === 'string'
    && req.query.ward !== 'All'
    && req.query.ward !== 'City-Wide'
      ? req.query.ward
      : null;
  const effectiveUser = wardParam && !user.ward ? { ...user, ward: wardParam } : user;

  const { getReportReviewWhereClause } = await import('../services/authorityAssignmentService');
  const where = getReportReviewWhereClause(effectiveUser);

  const page = parseInt(typeof req.query.page     === 'string' ? req.query.page     : '1');
  const ps   = Math.min(parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20'), 100);

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: ps,
    skip: (page - 1) * ps,
    select: {
      id: true, title: true, description: true, category: true, severity: true,
      status: true, latitude: true, longitude: true, address: true, zone: true,
      mediaUrls: true, isAnonymous: true, reporterId: true, upvotes: true,
      createdAt: true, updatedAt: true,
      reporter: { select: { id: true, name: true, citizenId: true } },
    },
  });
  return res.json({ success: true, data: issues });
}

export async function getFlaggedIssuesHandler(req: Request, res: Response) {
  const page = parseInt(typeof req.query.page     === 'string' ? req.query.page     : '1');
  const ps   = Math.min(parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20'), 100);

  const issues = await prisma.issue.findMany({
    where:   { status: 'FlaggedFalse' },
    orderBy: { updatedAt: 'desc' },
    take: ps,
    skip: (page - 1) * ps,
    select: {
      id: true, title: true, category: true, severity: true,
      zone: true, address: true, wardFlagNote: true,
      isAnonymous: true, reporterId: true,
      createdAt: true, updatedAt: true,
      reporter: {
        select: {
          id: true, name: true, email: true,
          citizenId: true, xp: true, suspendedUntil: true,
        },
      },
    },
  });
  return res.json({ success: true, data: issues });
}
