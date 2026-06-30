import { Router } from 'express';
import { getSummary, getAIInsights, getLeaderboard } from '../controllers/analyticsController';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/summary',     optionalAuth,   getSummary);
router.get('/insights',    authMiddleware, getAIInsights);
router.get('/leaderboard', optionalAuth,   getLeaderboard);

export default router;
