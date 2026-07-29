import dotenv from "dotenv";

dotenv.config();

const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // External APIs
  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
  githubToken: process.env.GITHUB_TOKEN || "",

  // Cache
  cacheTtl: parseInt(process.env.API_CACHE_TTL || "3600", 10), // 1 hour
  maxRecommendations: parseInt(process.env.MAX_RECOMMENDATIONS || "12", 10),

  // CORS
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),

  // Features
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

export default config;
