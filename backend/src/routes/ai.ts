import { Router } from 'express';
import { authorityBrief, categorize, communityInsights, getInsights, heatmapInsights, sentiment } from '../controllers/aiController';
import { generalLimiter } from '../middleware/rateLimit';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.post('/categorize', generalLimiter, categorize);
router.post('/insights',   generalLimiter, getInsights);
router.post('/sentiment',  generalLimiter, sentiment);
router.get('/authority-brief', authMiddleware, requireRole(['Authority', 'Admin']), authorityBrief);
router.get('/community-insights', authMiddleware, requireRole(['Authority', 'Admin']), communityInsights);
router.get('/heatmap-insights', authMiddleware, requireRole(['Authority', 'Admin']), heatmapInsights);

export default router;
