import { Router } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Protected routes
router.get("/profile", authMiddleware, authController.getProfile);

export default router;
