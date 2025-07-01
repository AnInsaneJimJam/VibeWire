import express from 'express';
import { createHangout } from '../database/controllers/hangoutController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createHangout);

export default router;
