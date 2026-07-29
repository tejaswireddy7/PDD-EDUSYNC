import { Router, Request, Response } from "express";

const router = Router();

// Health check endpoint
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "EduSync Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API version endpoint
router.get("/version", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    version: "1.0.0",
    api: "EduSync Adaptive Learning Platform API",
  });
});

export default router;
