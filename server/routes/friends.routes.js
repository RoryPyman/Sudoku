import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/friends.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',          ctrl.getFriends);
router.get('/requests',  ctrl.getRequests);
router.get('/search',    ctrl.searchUsers);

router.post('/request/:userId', ctrl.sendRequest);
router.post('/accept/:userId',  ctrl.acceptRequest);
router.post('/decline/:userId', ctrl.declineRequest);

router.delete('/remove/:userId', ctrl.removeFriend);
router.delete('/cancel/:userId', ctrl.cancelRequest);

export default router;
