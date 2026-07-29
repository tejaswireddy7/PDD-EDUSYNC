import { Router } from "express";
import * as recommendationController from "../controllers/recommendationController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// All recommendation routes require authentication
router.get("/", authMiddleware, recommendationController.getRecommendations);
router.get(
	"/courses",
	authMiddleware,
	recommendationController.getExternalCourses
);

export default router;
