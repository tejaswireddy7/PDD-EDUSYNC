import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config/config";

import { errorHandler } from "./middleware/errorHandler";

// Import routes
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import surveyRoutes from "./routes/survey";
import recommendationRoutes from "./routes/recommendations";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Request logging middleware (development only)
if (config.isDevelopment) {
  app.use((req: Request, res: Response, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/recommendations", recommendationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Endpoint not found",
      code: "NOT_FOUND",
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  process.exit(0);
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 EduSync Backend running on port ${PORT}`);
  console.log(`📚 Environment: ${config.nodeEnv}`);
  console.log(`🔌 API Base URL: http://localhost:${PORT}/api`);
});

export default app;
