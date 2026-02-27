import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/stats.controller.js';

const router = Router();

router.use(authenticate);

router.get('/summary', ctrl.getSummary);
router.get('/records', ctrl.getRecords);

export default router;
