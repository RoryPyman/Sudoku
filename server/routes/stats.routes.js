import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/stats.controller.js';

const router = Router();

router.use(authenticate);

router.get('/summary',    ctrl.getSummary);
router.get('/records',    ctrl.getRecords);
router.get('/badges',     ctrl.getBadges);
router.get('/badges/all', ctrl.getAllBadges);

export default router;
