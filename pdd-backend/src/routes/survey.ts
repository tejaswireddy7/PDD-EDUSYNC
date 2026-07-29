import { Router } from "express";
import * as surveyController from "../controllers/surveyController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// All survey routes require authentication
router.post("/submit", authMiddleware, surveyController.submitSurvey);
router.post("/skip", authMiddleware, surveyController.skipSurvey);
router.get("/status", authMiddleware, surveyController.getSurveyStatus);

export default router;
