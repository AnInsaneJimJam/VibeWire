import express from "express";
import { addConnections } from "../database/controllers/connectionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addConnections);
router.get("/graph", protect, getConnectionsGraph);

export default router;