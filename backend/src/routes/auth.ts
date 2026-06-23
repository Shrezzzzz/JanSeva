import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',        authMiddleware, getMe);

export default router;
