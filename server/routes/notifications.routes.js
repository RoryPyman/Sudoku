import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',           ctrl.getNotifications);
router.get('/count',      ctrl.getUnseenCount);
router.post('/:id/seen',  ctrl.markSeen);
router.delete('/:id',     ctrl.dismissNotification);

export default router;
