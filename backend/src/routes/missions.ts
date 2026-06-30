import { Router, type Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { getTodayMissions, completeMission } from '../services/missionService';

const router = Router();

// GET /api/missions/today
router.get('/today', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const missions = await getTodayMissions(req.userId!);
    return res.json({ success: true, data: missions });
  } catch (e) {
    return res.status(500).json({ success: false, error: (e as Error).message });
  }
});

// POST /api/missions/:id/complete
router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const mission = await completeMission(req.userId!, req.params.id);
    return res.json({ success: true, data: mission });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'Already completed' ? 409 : msg === 'Mission not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: msg });
  }
});

export default router;
