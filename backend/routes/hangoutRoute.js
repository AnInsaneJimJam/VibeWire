import express from 'express';
import { createHangout, getHangouts } from '../database/controllers/hangoutController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createHangout);
router.get('/', protect, getHangouts);

export default router;
