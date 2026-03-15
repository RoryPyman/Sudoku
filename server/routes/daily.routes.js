import { Router } from 'express';
import { z } from 'zod';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { verifyAccessToken } from '../utils/jwt.js';
import * as ctrl from '../controllers/daily.controller.js';

const router = Router();

/** Try to auth but never reject — used for GET /api/daily so anon users can see the puzzle */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.user = { id: payload.sub };
    } catch { /* ignore invalid token */ }
  }
  next();
}

const submitSchema = z.object({
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeElapsed:   z.number().int().min(1),
  hintsUsed:     z.number().int().min(0),
  completedGrid: z.string().length(81).regex(/^[1-9]{81}$/),
});

const shareSchema = z.object({
  toUserId: z.string().length(24),
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/',                      optionalAuth,                         ctrl.getDaily);
router.post('/submit',               authenticate, validate(submitSchema), ctrl.submitDaily);
router.get('/leaderboard/global',    authenticate,                         ctrl.getGlobalLeaderboard);
router.get('/leaderboard/friends',   authenticate,                         ctrl.getFriendsLeaderboard);
router.get('/leaderboard/me',        authenticate,                         ctrl.getMyRank);
router.post('/share',                authenticate, validate(shareSchema),  ctrl.shareScore);

export default router;
