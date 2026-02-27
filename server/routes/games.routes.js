import { Router } from 'express';
import { z } from 'zod';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/games.controller.js';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  difficulty:  z.enum(['easy', 'medium', 'hard']),
  puzzle:      z.string().length(81),
  solution:    z.string().length(81),
  userGrid:    z.string().length(81),
  hintsUsed:   z.number().int().min(0),
  timeSeconds: z.number().int().min(1),
});

router.post('/', validate(createSchema), ctrl.createGame);
router.get('/',    ctrl.getGames);
router.get('/:id', ctrl.getGame);

export default router;
