import { Router } from 'express';
import { categorize, getInsights, sentiment } from '../controllers/aiController';
import { generalLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/categorize', generalLimiter, categorize);
router.post('/insights',   generalLimiter, getInsights);
router.post('/sentiment',  generalLimiter, sentiment);

export default router;
