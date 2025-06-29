import { Router } from "express";
const router = Router();
import { getAllUsers, getUserById } from "../database/controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

router.get("/",protect, getAllUsers);
router.get("/:id",protect, getUserById);

export default router;
