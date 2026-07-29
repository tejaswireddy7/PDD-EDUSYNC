// Frontend interface types - MUST MATCH EXACTLY with React Native/Web frontend
export interface UserProfile {
  name: string;
  email: string;
  registeredAt: number; // timestamp
}

export interface SurveyAnswers {
  focusDomain: "Frontend" | "Backend" | "Mobile" | "AI";
  proficiency: "Beginner" | "Intermediate" | "Advanced";
  learningHours: number;
}

export interface RecommendedCourse {
  title: string;
  subject: string;
  progress: number;
  time: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  ai: boolean;
  colors: string[];
}

export interface RecommendedResource {
  title: string;
  type: string;
  duration: string;
}

export interface CareerMilestone {
  title: string;
  description: string;
  status: "completed" | "active" | "locked";
}

export interface RecommendationOutput {
  courses: RecommendedCourse[];
  resources: RecommendedResource[];
  milestones: CareerMilestone[];
  weeklyHoursTarget: number;
  nextAssessment: string;
}

// API Request/Response types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface SurveyRequest extends SurveyAnswers {}

export interface SurveyResponse {
  surveyId: string;
  nextResuveyAt: string;
  recommendations: RecommendationOutput;
}

// Internal types
export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}
