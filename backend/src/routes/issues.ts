import { Router } from 'express';
import {
  getIssues, getIssueById, createIssue, updateIssueStatus,
  upvoteIssue, addComment, getIssuesForMap, getNearbyIssues,
  updateIssue, deleteIssue,
} from '../controllers/issueController';
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public
router.get('/',        getIssues);
router.get('/map',     getIssuesForMap);
router.get('/nearby',  getNearbyIssues);
router.get('/:id',     getIssueById);

// Authenticated citizens (optional auth — anonymous submissions allowed)
router.post('/',               optionalAuth,  createIssue);
router.post('/:id/upvote',     authMiddleware, upvoteIssue);
router.post('/:id/comments',   authMiddleware, addComment);

// Authority / Admin only
router.patch('/:id/status',    authMiddleware, requireRole('Authority', 'Admin', 'Moderator'), updateIssueStatus);

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
