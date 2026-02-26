import { Router } from 'express';
import { z } from 'zod';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/games.controller.js';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  puzzle:     z.string().length(81),
  solution:   z.string().length(81),
});

const updateSchema = z.object({
  userGrid:    z.string().length(81).optional(),
  hintsUsed:   z.number().int().min(0).optional(),
  timeSeconds: z.number().int().min(0).optional(),
  status:      z.enum(['in_progress', 'completed', 'abandoned']).optional(),
}).strict();

router.post('/',    validate(createSchema), ctrl.createGame);
router.patch('/:id', validate(updateSchema), ctrl.updateGame);
router.get('/',    ctrl.getGames);
router.get('/:id', ctrl.getGame);

export default router;
