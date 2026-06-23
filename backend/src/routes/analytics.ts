import { Router } from 'express';
import { getSummary, getAIInsights, getLeaderboard } from '../controllers/analyticsController';

const router = Router();

router.get('/summary',     getSummary);
router.get('/insights',    getAIInsights);
router.get('/leaderboard', getLeaderboard);

export default router;
