import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getFeed } from '../controllers/feed.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getFeed);

export default router;
