import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export interface MLSurveyInput {
  user_id?: string;
  domain: string;
  level: string;
  goal?: string;
  pace?: string;
  skills?: string[];
  completed_courses?: string[];
}

export interface MLCourseRecommendation {
  course_id: string;
  title: string;
  domain: string;
  difficulty: string;
  time_weeks: number;
  skills: string[];
  video_url?: string;
  new_skills_acquired: string[];
  match_score: number;
  ai_reason: string;
}

export interface MLJobMatch {
  job_id: string;
  title: string;
  domain: string;
  experience_level: string;
  salary_range: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  recommended_bridge_courses: Array<{
    course_id: string;
    title: string;
    teaches: string[];
  }>;
}

export interface MLAdaptiveQuestion {
  id: string;
  domain: string;
  skill: string;
  question: string;
  options: string[];
  difficulty_label: string;
  current_estimated_ability: number;
}

/**
 * Get AI-recommended courses from the ML microservice
 */
export const getMLCourseRecommendations = async (
  input: MLSurveyInput
): Promise<MLCourseRecommendation[] | null> => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/recommend/courses`,
      input,
      { timeout: 3500 }
    );
    return response.data.recommendations || [];
  } catch (error: any) {
    console.warn("[ML Service] Course recommendations unavailable, falling back:", error.message);
    return null;
  }
};

/**
 * Get AI career/job matching and skill-gap bridging
 */
export const getMLJobMatches = async (
  input: MLSurveyInput
): Promise<MLJobMatch[] | null> => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/recommend/jobs`,
      input,
      { timeout: 3500 }
    );
    return response.data.career_matches || [];
  } catch (error: any) {
    console.warn("[ML Service] Job suggestions unavailable, falling back:", error.message);
    return null;
  }
};

/**
 * Get next adaptive assessment question (IRT 2PL model)
 */
export const getMLNextAdaptiveQuestion = async (
  domain: string,
  currentTheta: number,
  answeredQuestionIds: string[]
): Promise<MLAdaptiveQuestion | null> => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/adaptive/next-question`,
      {
        domain,
        current_theta: currentTheta,
        answered_question_ids: answeredQuestionIds,
      },
      { timeout: 3500 }
    );
    return response.data.question || null;
  } catch (error: any) {
    console.warn("[ML Service] Adaptive question selection unavailable:", error.message);
    return null;
  }
};

/**
 * Calculate Bayesian EAP ability score and mastery percentile
 */
export const evaluateMLAbility = async (
  domain: string,
  responses: Array<{ question_id: string; is_correct: boolean }>
) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/adaptive/evaluate-ability`,
      {
        domain,
        responses,
      },
      { timeout: 3500 }
    );
    return response.data;
  } catch (error: any) {
    console.warn("[ML Service] Ability evaluation unavailable:", error.message);
    return null;
  }
};

/**
 * Curate dynamic AI educational web resources
 */
export const curateMLResources = async (params: {
  domain?: string;
  level?: string;
  resource_type?: string;
  query?: string;
  sort_by?: string;
}) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/v1/resources/curate`, {
      params,
      timeout: 3500,
    });
    return response.data.resources || [];
  } catch (error: any) {
    console.warn("[ML Service] Resource curation unavailable:", error.message);
    return null;
  }
};

/**
 * Log student telemetry event for continuous self-improving training loop
 */
export const logMLTelemetryEvent = async (event: {
  user_id: string;
  event_type: string;
  course_id?: string;
  domain?: string;
  progress?: number;
  rating?: number;
  completed?: boolean;
  time_spent_mins?: number;
}) => {
  try {
    await axios.post(`${ML_SERVICE_URL}/api/v1/telemetry/event`, event, {
      timeout: 2000,
    });
  } catch (error: any) {
    // Non-blocking telemetry log
  }
};

