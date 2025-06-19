import { Router } from "express";
const router = Router();
import { getAllUsers, getUserById } from "../controllers/userController";
import protect from "../middleware/authMiddleware";

router.get("/",protect, getAllUsers);
router.get("/:id",protect, getUserById);

export default router;
