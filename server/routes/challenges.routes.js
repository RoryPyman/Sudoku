import { Router } from 'express';
import { z } from 'zod';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/challenges.controller.js';

const router = Router();

const sendSchema = z.object({
  toUserId:   z.string().length(24),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const submitSchema = z.object({
  timeElapsed:   z.number().int().min(1),
  hintsUsed:     z.number().int().min(0),
  completedGrid: z.string().length(81).regex(/^[1-9]{81}$/),
});

router.post('/send',              authenticate, validate(sendSchema),   ctrl.sendChallenge);
router.get('/',                   authenticate,                         ctrl.getChallenges);
router.get('/h2h/:userId',        authenticate,                         ctrl.getH2H);          // must come before /:id
router.get('/:id',                authenticate,                         ctrl.getChallenge);
router.post('/:id/accept',        authenticate,                         ctrl.acceptChallenge);
router.post('/:id/decline',       authenticate,                         ctrl.declineChallenge);
router.delete('/:id',             authenticate,                         ctrl.cancelChallenge);
router.post('/:id/submit',        authenticate, validate(submitSchema), ctrl.submitChallenge);
router.post('/:id/nudge',         authenticate,                         ctrl.nudgeOpponent);

export default router;
