// ============================================================
// EduSync API Configuration (Native)
// ============================================================

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" && (window as any).env?.VITE_API_BASE_URL) ||
  "https://pdd-edusync.onrender.com/api";

// ---- Generic fetch wrapper ------------------------------------

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        json?.message || json?.error?.message || json?.error || `Error ${res.status}`;
      console.warn(`[EduSync API] ${res.status} from ${endpoint}: ${errorMessage}`);
      return {
        data: null,
        error:
          typeof errorMessage === "object"
            ? errorMessage.message || JSON.stringify(errorMessage)
            : errorMessage,
      };
    }

    return { data: json as T, error: null };
  } catch (err: any) {
    console.error(`[EduSync API] Network error fetching ${endpoint}:`, err);
    return { data: null, error: "Network error. Please try again." };
  }
}

// ---- Recommendations Endpoints -------------------------------

export const recommendationsApi = {
  getRecommendations: async (token: string) => {
    return apiFetch<any>("/recommendations", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  getCourses: async (token: string) => {
    return apiFetch<any>("/recommendations/courses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// ---- Survey Endpoints ----------------------------------------

export const surveyApi = {
  submitSurvey: async (
    token: string,
    focusDomain: string,
    proficiency: string,
    learningHours: number,
  ) => {
    return apiFetch<any>("/survey/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ focusDomain, proficiency, learningHours }),
    });
  },
};

// ---- Adaptive AI & Telemetry Endpoints -----------------------

export const adaptiveApi = {
  getNextQuestion: async (
    token: string,
    domain: string,
    currentTheta: number,
    answeredQuestionIds: string[]
  ) => {
    return apiFetch<{ success: boolean; data: { status: string; question: any } }>(
      "/adaptive/next-question",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain, currentTheta, answeredQuestionIds }),
      }
    );
  },

  evaluateAbility: async (
    token: string,
    domain: string,
    responses: Array<{ question_id: string; is_correct: boolean }>
  ) => {
    return apiFetch<{
      success: boolean;
      data: {
        theta_score: number;
        standard_error: number;
        mastery_percentile: number;
        grade: string;
        recommended_difficulty: string;
      };
    }>("/adaptive/evaluate-ability", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ domain, responses }),
    });
  },

  logTelemetry: async (token: string, event: Record<string, any>) => {
    return apiFetch<any>("/adaptive/telemetry", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });
  },
};

