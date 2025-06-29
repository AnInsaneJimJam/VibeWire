import express from "express";
import protect from "../middleware/authMiddleware.js";
import { createHangout, getMyInvites, respondToInvite, approveInvite } from "../database/controllers/hangoutController.js";

const router = express.Router();

// Main route to create a hangout and send initial invites
router.post("/", protect, createHangout);

// Route for a user to see their pending invites and approval requests
router.get("/invites", protect, getMyInvites);

// Route for a guest to accept/decline an invite
router.post("/invites/:inviteId/respond", protect, respondToInvite);

// Route for a mutual friend to approve/deny a 2nd-degree invite
router.post("/invites/:inviteId/approve", protect, approveInvite);

export default router;