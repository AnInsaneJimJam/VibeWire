import express from "express";
import { signup, login } from "../database/controllers/authController.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/signup", upload.single('profileImage'), signup);
router.post("/login", login);

export default router;
