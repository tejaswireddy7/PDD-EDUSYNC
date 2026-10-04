import { Router } from "express";
import * as adaptiveController from "../controllers/adaptiveController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Adaptive assessments
router.post("/next-question", authMiddleware, adaptiveController.getNextAdaptiveQuestion);
router.post("/evaluate-ability", authMiddleware, adaptiveController.evaluateAdaptiveAbility);

// Learning Telemetry for ML self-improving loop
router.post("/telemetry", authMiddleware, adaptiveController.logLearningTelemetry);

export default router;
