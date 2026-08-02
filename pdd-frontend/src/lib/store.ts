import { useState, useEffect } from "react";
import { getRecommendations, RecommendationOutput, SurveyAnswers, UserProfile } from "./recommender";
import { recommendationsApi, surveyApi } from "./api";
import { supabase } from "./supabase";
import { 
  fetchDBProfile, 
  saveDBProfile, 
  fetchDBCourses, 
  fetchDBResources, 
  fetchDBMilestones 
} from "./supabase-db";

export interface DashboardState {
  user: UserProfile | null;
  surveyCompleted: boolean;
  surveyAnswers: SurveyAnswers | null;
  lastSurveyDate: number | null; // Timestamp
  skippedResurveyAt: number | null; // Timestamp of skipped resurvey
  forceResurveyTriggered: boolean; // secret testing override flag
  submittedAssessmentId: string | null; // Tracks dynamic test submits
  token: string | null;
  recommendations: RecommendationOutput | null;
  isLoadingRecommendations: boolean;
  isLoadingProfile: boolean;
  lowDataMode: boolean;
  cachedMaterials: Array<{ title: string; url: string; cachedAt: number }>;
}

// Default initial state
const DEFAULT_STATE: DashboardState = {
  user: null, // Start unauthenticated by default
  surveyCompleted: false,
  surveyAnswers: null,
  lastSurveyDate: null,
  skippedResurveyAt: null,
  forceResurveyTriggered: false,
  submittedAssessmentId: null,
  token: null,
  recommendations: null,
  isLoadingRecommendations: false,
  isLoadingProfile: true,
  lowDataMode: false,
  cachedMaterials: [],
};

// Internal store variables
let state: DashboardState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

// Centralized state updater
function updateState(updater: Partial<DashboardState> | ((prev: DashboardState) => Partial<DashboardState>)) {
  const next = typeof updater === "function" ? updater(state) : updater;
  state = { ...state, ...next };

  // Notify all listeners to trigger React updates
  listeners.forEach((l) => l());
}

// Reactive store hook
export function useDashboardStore() {
  const [current, setCurrent] = useState<DashboardState>(state);

  useEffect(() => {
    // Hydrate local cache and low data settings on mount
    if (typeof window !== "undefined" && window.localStorage) {
      const cached = window.localStorage.getItem("cached_materials");
      const mode = window.localStorage.getItem("low_data_mode");
      updateState({
        lowDataMode: mode === "true",
        cachedMaterials: cached ? JSON.parse(cached) : []
      });
    }

    const listener = () => setCurrent(state);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isResurveyDue =
    current.surveyCompleted &&
    (current.forceResurveyTriggered ||
      (current.lastSurveyDate !== null &&
        Date.now() - current.lastSurveyDate >= SEVEN_DAYS_MS &&
        (current.skippedResurveyAt === null ||
          Date.now() - current.skippedResurveyAt >= SEVEN_DAYS_MS)));

  return {
    ...current,
    isResurveyDue,
    
    // Action methods
    setAuth: (user: any, token: string) => {
      updateState({
        user: {
          name: user.name || user.email?.split("@")[0],
          email: user.email,
          registeredAt: Date.now(),
          streak: user.streak ?? 0,
          coursesCompleted: user.coursesCompleted ?? 0,
          careerFitScore: user.careerFitScore ?? 0,
          xp: user.xp ?? 0
        },
        token
      });
    },

    fetchRecommendations: async () => {
      const answers = state.surveyAnswers;
      if (answers) {
        updateState({ isLoadingRecommendations: true });
        try {
          const [courses, resources, milestones] = await Promise.all([
            fetchDBCourses(answers.focusDomain, answers.proficiency),
            fetchDBResources(answers.focusDomain, answers.proficiency),
            fetchDBMilestones(answers.focusDomain, answers.proficiency)
          ]);
          
          updateState({
            recommendations: {
              courses,
              resources: resources.map(r => ({ title: r.title, type: r.type, duration: "15 min" })),
              milestones,
              weeklyHoursTarget: answers.learningHours,
              nextAssessment: answers.focusDomain === "Frontend" ? "React State & Styling Quiz"
                : answers.focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
                  : answers.focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
                    : "PyTorch Data Loading & Gradient descent"
            },
            isLoadingRecommendations: false
          });
          return;
        } catch (e) {
          console.warn("Supabase fetch recommendations failed, trying backend/local:", e);
        }
      }

      if (!current.token) return;
      updateState({ isLoadingRecommendations: true });
      try {
        const { data, error } = await recommendationsApi.getRecommendations(current.token);
        let recData = data?.data || data;
        
        if (recData?.recommendations === null || recData?.message) {
          recData = null;
        }

        if (recData && !error) {
          updateState({ recommendations: recData, isLoadingRecommendations: false });
          return;
        }
      } catch (e) {
        console.warn("Backend recommendations fetch failed, falling back to local:", e);
      }

      // Local fallback
      if (state.surveyCompleted && state.surveyAnswers) {
        const localRecs = getRecommendations(
          state.surveyAnswers.focusDomain,
          state.surveyAnswers.proficiency,
          state.surveyAnswers.learningHours,
          [],
          state.surveyAnswers.targetLearningGoal
        );
        updateState({ recommendations: localRecs, isLoadingRecommendations: false });
      } else {
        updateState({ recommendations: null, isLoadingRecommendations: false });
      }
    },

    submitSurvey: async (answers: SurveyAnswers) => {
      updateState({
        surveyCompleted: true,
        surveyAnswers: answers,
        lastSurveyDate: Date.now(),
        forceResurveyTriggered: false
      });
      
      // Persist survey details to Supabase if authenticated
      const sessionData = await supabase.auth.getSession();
      const session = sessionData.data.session;
      if (session && session.user) {
        await saveDBProfile(session.user.id, {
          name: state.user?.name || session.user.email?.split("@")[0],
          email: session.user.email || "",
          focusDomain: answers.focusDomain,
          proficiency: answers.proficiency,
          learningHours: answers.learningHours,
          streak: state.user?.streak ?? 0,
          coursesCompleted: state.user?.coursesCompleted ?? 0,
          careerFitScore: state.user?.careerFitScore ?? 0,
          xp: state.user?.xp ?? 0,
          lastSurveyDate: Date.now()
        });
      }

      // Attempt to load recommendations dynamically from database
      updateState({ isLoadingRecommendations: true });
      try {
        const [courses, resources, milestones] = await Promise.all([
          fetchDBCourses(answers.focusDomain, answers.proficiency),
          fetchDBResources(answers.focusDomain, answers.proficiency),
          fetchDBMilestones(answers.focusDomain, answers.proficiency)
        ]);
        
        updateState({
          recommendations: {
            courses,
            resources: resources.map(r => ({ title: r.title, type: r.type, duration: "15 min" })),
            milestones,
            weeklyHoursTarget: answers.learningHours,
            nextAssessment: answers.focusDomain === "Frontend" ? "React State & Styling Quiz"
              : answers.focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
                : answers.focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
                  : "PyTorch Data Loading & Gradient descent"
          },
          isLoadingRecommendations: false
        });
      } catch (e) {
        console.warn("Supabase fetch recommendations failed after survey, using local:", e);
        const localRecs = getRecommendations(
          answers.focusDomain,
          answers.proficiency,
          answers.learningHours
        );
        updateState({ recommendations: localRecs, isLoadingRecommendations: false });
      }
    },

    skipResurvey: () => {
      updateState({
        skippedResurveyAt: Date.now(),
        forceResurveyTriggered: false
      });
    },

    triggerInstantResurvey: () => {
      updateState({
        forceResurveyTriggered: true
      });
    },

    addXp: async (amount: number) => {
      const prevUser = state.user;
      if (!prevUser) return;
      const nextUser = {
        ...prevUser,
        xp: (prevUser.xp || 0) + amount
      };
      updateState({ user: nextUser });
      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session && session.user) {
          await saveDBProfile(session.user.id, {
            name: nextUser.name,
            email: nextUser.email,
            focusDomain: state.surveyAnswers?.focusDomain || "Mobile",
            proficiency: state.surveyAnswers?.proficiency || "Beginner",
            learningHours: state.surveyAnswers?.learningHours || 5,
            streak: nextUser.streak,
            coursesCompleted: nextUser.coursesCompleted,
            careerFitScore: nextUser.careerFitScore,
            xp: nextUser.xp
          });
        }
      } catch (e) {
        console.warn("Failed to save XP profile update:", e);
      }
    },

    submitAssessment: async (id: string) => {
      const prevUser = state.user;
      const nextUser = prevUser ? {
        ...prevUser,
        streak: prevUser.streak || 0,
        coursesCompleted: (prevUser.coursesCompleted || 0) + 1,
        careerFitScore: Math.min((prevUser.careerFitScore || 0) + 12, 100),
        xp: (prevUser.xp || 0) + 800
      } : null;

      updateState({
        submittedAssessmentId: id,
        user: nextUser
      });

      if (nextUser) {
        try {
          const sessionData = await supabase.auth.getSession();
          const session = sessionData.data.session;
          if (session && session.user) {
            await saveDBProfile(session.user.id, {
              name: nextUser.name,
              email: nextUser.email,
              focusDomain: state.surveyAnswers?.focusDomain || "Mobile",
              proficiency: state.surveyAnswers?.proficiency || "Beginner",
              learningHours: state.surveyAnswers?.learningHours || 5,
              streak: nextUser.streak,
              coursesCompleted: nextUser.coursesCompleted,
              careerFitScore: nextUser.careerFitScore,
              xp: nextUser.xp
            });
          }
        } catch (e) {
          console.warn("Failed to save profile progress on assessment submission:", e);
        }
      }
    },

    toggleLowDataMode: () => {
      const nextMode = !state.lowDataMode;
      updateState({ lowDataMode: nextMode });
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("low_data_mode", String(nextMode));
      }
    },

    cacheMaterial: (title: string, url: string) => {
      const alreadyCached = state.cachedMaterials.some(m => m.title === title);
      if (alreadyCached) return;
      const nextCache = [...state.cachedMaterials, { title, url, cachedAt: Date.now() }];
      updateState({ cachedMaterials: nextCache });
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("cached_materials", JSON.stringify(nextCache));
      }
    },

    clearOfflineCache: () => {
      updateState({ cachedMaterials: [] });
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("cached_materials", "[]");
      }
    },

    resetSurvey: async () => {
      updateState({
        surveyCompleted: false,
        surveyAnswers: null,
        lastSurveyDate: null,
        recommendations: null
      });

      // Clear survey state in localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session && session.user) {
          window.localStorage.removeItem(`assessments_${session.user.id}_Mobile`);
          window.localStorage.removeItem(`assessments_${session.user.id}_Frontend`);
          window.localStorage.removeItem(`assessments_${session.user.id}_Backend`);
          window.localStorage.removeItem(`assessments_${session.user.id}_AI`);
        }
      }

      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session && session.user) {
          const { error } = await supabase
            .from("profiles")
            .update({
              last_survey_date: null,
              focus_domain: "Mobile",
              proficiency: "Beginner",
              learning_hours: 5
            })
            .eq("id", session.user.id);
          if (error) throw error;
        }
      } catch (err) {
        console.warn("Failed to clear survey state in database:", err);
      }
    },

    resetStore: () => {
      updateState({
        ...DEFAULT_STATE,
        lastSurveyDate: null,
        surveyCompleted: false,
        surveyAnswers: null,
        submittedAssessmentId: null,
        token: null,
        recommendations: null,
        isLoadingRecommendations: false
      });
    }
  };
}

// Keep store session synced with Supabase Auth state changes
supabase.auth.onAuthStateChange((event: any, session: any) => {
  if (!session || !session.user) {
    updateState({
      user: null,
      surveyCompleted: false,
      surveyAnswers: null,
      token: null,
      recommendations: null,
      isLoadingProfile: false
    });
    return;
  }

  // Optimization: If already authenticated with the same access token, DO NOT reset state
  if (state.token === session.access_token && state.user !== null) {
    return;
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";
  const userName = session.user.user_metadata?.full_name || userEmail.split("@")[0] || "Student";
  const userCreatedAt = new Date(session.user.created_at || Date.now()).getTime();

  // Set user state immediately so login completes instantly
  updateState({
    isLoadingProfile: true,
    user: {
      name: userName,
      email: userEmail,
      registeredAt: userCreatedAt,
      streak: 0,
      coursesCompleted: 0,
      careerFitScore: 0,
      xp: 0
    },
    surveyCompleted: false,
    surveyAnswers: null,
    token: session.access_token
  });

    // Fetch DB Profile asynchronously in the background
    fetchDBProfile(userId).then(async (dbProfile) => {
      // Confirm the user is still logged in with the same session token before updating state
      if (state.token !== session.access_token) return;

      const now = new Date();
      const todayStr = now.toDateString();
      const registrationDateObj = new Date(session.user.created_at || now);

      let finalStreak = 1;
      let finalLastActive = now.toISOString();

      if (!dbProfile) {
        // Create new user profile in database immediately upon registration
        await saveDBProfile(userId, {
          name: userName,
          email: userEmail,
          streak: 1,
          createdAt: registrationDateObj.toISOString(),
          lastActiveDate: finalLastActive,
          coursesCompleted: 0,
          careerFitScore: 0,
          xp: 0
        });
      } else {
        const lastActiveStr = dbProfile.last_active_date ? new Date(dbProfile.last_active_date).toDateString() : "";
        
        if (!lastActiveStr) {
          // If no last active date, initialize streak to 1
          finalStreak = 1;
          await saveDBProfile(userId, {
            streak: 1,
            lastActiveDate: finalLastActive
          });
        } else if (lastActiveStr === todayStr) {
          // Already logged in today, keep the same streak
          finalStreak = dbProfile.streak ?? 1;
        } else {
          // Calculate calendar difference
          const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const lastActiveDateObj = new Date(dbProfile.last_active_date);
          const localLastActive = new Date(lastActiveDateObj.getFullYear(), lastActiveDateObj.getMonth(), lastActiveDateObj.getDate());
          
          const diffTime = Math.abs(localToday.getTime() - localLastActive.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day: increment streak
            finalStreak = (dbProfile.streak || 0) + 1;
          } else {
            // Missed a day: reset streak to 1 for today's activity
            finalStreak = 1;
          }

          await saveDBProfile(userId, {
            streak: finalStreak,
            lastActiveDate: finalLastActive
          });
        }
      }

      updateState({
        isLoadingProfile: false,
        user: {
          name: dbProfile?.name || userName,
          email: userEmail,
          registeredAt: new Date(dbProfile?.created_at || registrationDateObj).getTime(),
          streak: finalStreak,
          coursesCompleted: dbProfile?.courses_completed ?? 0,
          careerFitScore: dbProfile?.career_fit_score ?? 0,
          xp: dbProfile?.xp ?? 0
        },
        surveyCompleted: dbProfile ? !!dbProfile.last_survey_date : false,
        surveyAnswers: dbProfile ? {
          focusDomain: dbProfile.focus_domain || "Mobile",
          proficiency: dbProfile.proficiency || "Beginner",
          learningHours: dbProfile.learning_hours || 5
        } : null
      });
    }).catch(err => {
      console.warn("Background fetch profile failed:", err);
      updateState({ isLoadingProfile: false });
    });
});

export type { SurveyAnswers, UserProfile };
