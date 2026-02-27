import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile } from '../controllers/profile.controller.js';

const router = Router();

router.use(authenticate);

router.get('/:username/profile', getProfile);

export default router;
