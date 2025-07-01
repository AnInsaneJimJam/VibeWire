import express from 'express';
import { getInvites, respondToInvite, respondToApproval } from '../database/controllers/inviteController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getInvites);
router.post('/:inviteId/respond', protect, respondToInvite);
router.post('/:inviteId/approve', protect, respondToApproval);

export default router;
