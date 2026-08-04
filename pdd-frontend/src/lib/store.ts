import { useState, useEffect } from "react";
import { getRecommendations, RecommendationOutput, SurveyAnswers, UserProfile } from "./recommender";
import { recommendationsApi, surveyApi } from "./api";
import { supabase } from "./supabase";
import { 
  fetchDBProfile, 
  saveDBProfile, 
  fetchDBCourses, 
  fetchDBResources, 
  fetchDBMilestones,
  fetchDBAssessments,
  fetchDBRecommendations,
  saveDBCourseProgress
} from "./supabase-db";

async function getNextAssessmentTitle(userId: string, focusDomain: string, proficiency: string): Promise<string> {
  try {
    const assessments = await fetchDBAssessments(userId, focusDomain, proficiency);
    const nextAss = assessments.find((a) => a.status !== "submitted");
    if (nextAss) {
      return nextAss.title;
    }
  } catch (err) {
    console.warn("Failed to get dynamic next assessment title:", err);
  }
  return focusDomain === "Frontend" ? "React State & Styling Quiz"
    : focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
      : focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
        : "PyTorch Data Loading & Gradient descent";
}

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

// Synchronously hydrate state if localStorage is available
if (typeof window !== "undefined" && window.localStorage) {
  const lastUserId = window.localStorage.getItem("last_logged_in_user_id");
  const savedToken = window.localStorage.getItem("supabase_session_token");
  if (lastUserId && savedToken) {
    const savedProfile = window.localStorage.getItem(`user_profile_${lastUserId}`);
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        state.user = {
          name: parsedProfile.name || "Student",
          email: parsedProfile.email || "",
          registeredAt: parsedProfile.created_at ? new Date(parsedProfile.created_at).getTime() : Date.now(),
          streak: parsedProfile.streak ?? 1,
          coursesCompleted: parsedProfile.courses_completed ?? 0,
          careerFitScore: parsedProfile.career_fit_score ?? 0,
          xp: parsedProfile.xp ?? 0
        };
        state.token = savedToken;
        state.surveyCompleted = window.localStorage.getItem(`survey_completed_${parsedProfile.email}`) === "true";
        state.isLoadingProfile = false;
        
        const savedAnswers = window.localStorage.getItem(`survey_answers_${parsedProfile.email}`);
        if (savedAnswers) {
          state.surveyAnswers = JSON.parse(savedAnswers);
        }
      } catch (e) {}
    }
  }
}

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
      
      let hydratedUser = null;
      let hydratedToken = null;
      let hydratedSurveyCompleted = false;
      let hydratedSurveyAnswers = null;
      
      const lastUserId = window.localStorage.getItem("last_logged_in_user_id");
      const savedToken = window.localStorage.getItem("supabase_session_token");
      if (lastUserId && savedToken) {
        const savedProfile = window.localStorage.getItem(`user_profile_${lastUserId}`);
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile);
            hydratedUser = {
              name: parsedProfile.name || "Student",
              email: parsedProfile.email || "",
              registeredAt: parsedProfile.created_at ? new Date(parsedProfile.created_at).getTime() : Date.now(),
              streak: parsedProfile.streak ?? 1,
              coursesCompleted: parsedProfile.courses_completed ?? 0,
              careerFitScore: parsedProfile.career_fit_score ?? 0,
              xp: parsedProfile.xp ?? 0
            };
            hydratedToken = savedToken;
            hydratedSurveyCompleted = window.localStorage.getItem(`survey_completed_${parsedProfile.email}`) === "true";
            
            const savedAnswers = window.localStorage.getItem(`survey_answers_${parsedProfile.email}`);
            if (savedAnswers) {
              hydratedSurveyAnswers = JSON.parse(savedAnswers);
            }
          } catch (e) {}
        }
      }

      updateState({
        lowDataMode: mode === "true",
        cachedMaterials: cached ? JSON.parse(cached) : [],
        ...(hydratedUser ? {
          user: hydratedUser,
          token: hydratedToken,
          surveyCompleted: hydratedSurveyCompleted,
          surveyAnswers: hydratedSurveyAnswers,
          isLoadingProfile: false
        } : {})
      });
    }

    const listener = () => setCurrent(state);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const recommendedCourses = current.recommendations?.courses || [];
  const allCoursesCompleted = recommendedCourses.length > 0 && recommendedCourses.every(c => c.progress === 100);

  const isResurveyDue =
    current.surveyCompleted &&
    (current.forceResurveyTriggered || allCoursesCompleted);

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
      updateState({ isLoadingRecommendations: true });

      const overlayProgress = (coursesList: any[]) => {
        if (typeof window !== "undefined" && window.localStorage) {
          const email = state.user?.email || "guest";
          const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
          if (savedProgress) {
            try {
              const progressMap = JSON.parse(savedProgress);
              return coursesList.map(c => ({
                ...c,
                progress: progressMap[c.title] !== undefined ? progressMap[c.title] : c.progress
              }));
            } catch (e) {}
          }
        }
        return coursesList;
      };

      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session && session.user) {
          const dbRec = await fetchDBRecommendations(session.user.id);
          if (dbRec && dbRec.courses && dbRec.courses.length > 0) {
            const coursesWithProgress = overlayProgress(dbRec.courses);
            updateState({
              recommendations: {
                courses: coursesWithProgress,
                resources: dbRec.resources,
                milestones: dbRec.milestones,
                weeklyHoursTarget: dbRec.weeklyHoursTarget || (answers ? answers.learningHours : 5),
                nextAssessment: dbRec.nextAssessment
              },
              isLoadingRecommendations: false
            });
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user-specific recommendations from DB:", e);
      }

      if (answers) {
        updateState({ isLoadingRecommendations: true });
        try {
          const sessionData = await supabase.auth.getSession();
          const session = sessionData.data.session;
          
          const [courses, resources, milestones, nextAssessment] = await Promise.all([
            fetchDBCourses(answers.focusDomain, answers.proficiency),
            fetchDBResources(answers.focusDomain, answers.proficiency),
            fetchDBMilestones(answers.focusDomain, answers.proficiency),
            session?.user
              ? getNextAssessmentTitle(session.user.id, answers.focusDomain, answers.proficiency)
              : Promise.resolve(
                  answers.focusDomain === "Frontend" ? "React State & Styling Quiz"
                    : answers.focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
                      : answers.focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
                        : "PyTorch Data Loading & Gradient descent"
                )
          ]);
          
          const coursesWithProgress = overlayProgress(courses);
          updateState({
            recommendations: {
              courses: coursesWithProgress,
              resources: resources.map(r => ({ title: r.title, type: r.type, duration: "15 min" })),
              milestones,
              weeklyHoursTarget: answers.learningHours,
              nextAssessment
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
          if (recData.courses) {
            recData.courses = overlayProgress(recData.courses);
          }
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
        localRecs.courses = overlayProgress(localRecs.courses);
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
      
      if (typeof window !== "undefined" && window.localStorage) {
        const email = state.user?.email || "guest";
        window.localStorage.setItem(`survey_completed_${email}`, "true");
        window.localStorage.setItem(`survey_answers_${email}`, JSON.stringify(answers));
      }

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

        // Save local cache backup as well
        if (typeof window !== "undefined" && window.localStorage) {
          const profileKey = `user_profile_${session.user.id}`;
          const saved = window.localStorage.getItem(profileKey);
          const cached = saved ? JSON.parse(saved) : {};
          window.localStorage.setItem(profileKey, JSON.stringify({
            ...cached,
            name: state.user?.name || session.user.email?.split("@")[0],
            email: session.user.email || "",
            focus_domain: answers.focusDomain,
            proficiency: answers.proficiency,
            learning_hours: answers.learningHours,
            last_survey_date: new Date(Date.now()).toISOString()
          }));
        }
      }

      // Attempt to load recommendations dynamically from database
      updateState({ isLoadingRecommendations: true });
      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;

        const [courses, resources, milestones, nextAssessment] = await Promise.all([
          fetchDBCourses(answers.focusDomain, answers.proficiency),
          fetchDBResources(answers.focusDomain, answers.proficiency),
          fetchDBMilestones(answers.focusDomain, answers.proficiency),
          session?.user
            ? getNextAssessmentTitle(session.user.id, answers.focusDomain, answers.proficiency)
            : Promise.resolve(
                answers.focusDomain === "Frontend" ? "React State & Styling Quiz"
                  : answers.focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
                    : answers.focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
                      : "PyTorch Data Loading & Gradient descent"
              )
        ]);
        
        const overlayProgress = (coursesList: any[]) => {
          if (typeof window !== "undefined" && window.localStorage) {
            const email = state.user?.email || "guest";
            const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
            if (savedProgress) {
              try {
                const progressMap = JSON.parse(savedProgress);
                return coursesList.map(c => ({
                  ...c,
                  progress: progressMap[c.title] !== undefined ? progressMap[c.title] : c.progress
                }));
              } catch (e) {}
            }
          }
          return coursesList;
        };

        const coursesWithProgress = overlayProgress(courses);
        updateState({
          recommendations: {
            courses: coursesWithProgress,
            resources: resources.map(r => ({ title: r.title, type: r.type, duration: "15 min" })),
            milestones,
            weeklyHoursTarget: answers.learningHours,
            nextAssessment
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
        if (typeof window !== "undefined" && window.localStorage) {
          const email = state.user?.email || "guest";
          const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
          if (savedProgress) {
            try {
              const progressMap = JSON.parse(savedProgress);
              localRecs.courses = localRecs.courses.map(c => ({
                ...c,
                progress: progressMap[c.title] !== undefined ? progressMap[c.title] : c.progress
              }));
            } catch (e) {}
          }
        }
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
          const userId = session.user.id;
          if (typeof window !== "undefined" && window.localStorage) {
            const saved = window.localStorage.getItem(`user_profile_${userId}`);
            const profile = saved ? JSON.parse(saved) : {};
            profile.xp = nextUser.xp;
            window.localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profile));
          }

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

    completeCourse: async (courseTitle: string) => {
      const prevUser = state.user;
      if (!prevUser) return;
      const nextUser = {
        ...prevUser,
        coursesCompleted: (prevUser.coursesCompleted || 0) + 1,
        xp: (prevUser.xp || 0) + 100
      };
      
      let nextRecs = state.recommendations;
      if (nextRecs && nextRecs.courses) {
        nextRecs = {
          ...nextRecs,
          courses: nextRecs.courses.map(c => 
            c.title === courseTitle ? { ...c, progress: 100 } : c
          )
        };
      }
      
      updateState({
        user: nextUser,
        recommendations: nextRecs
      });

      if (typeof window !== "undefined" && window.localStorage) {
        const email = state.user?.email || "guest";
        const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
        const progressMap = savedProgress ? JSON.parse(savedProgress) : {};
        progressMap[courseTitle] = 100;
        window.localStorage.setItem(`courses_progress_${email}`, JSON.stringify(progressMap));
      }

      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session && session.user) {
          const userId = session.user.id;
          if (typeof window !== "undefined" && window.localStorage) {
            const saved = window.localStorage.getItem(`user_profile_${userId}`);
            const profile = saved ? JSON.parse(saved) : {};
            profile.courses_completed = nextUser.coursesCompleted;
            profile.xp = nextUser.xp;
            window.localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profile));
          }

          await saveDBProfile(session.user.id, {
            name: nextUser.name,
            email: nextUser.email,
            focusDomain: state.surveyAnswers?.focusDomain || "Mobile",
            proficiency: state.surveyAnswers?.proficiency || "Beginner",
            learningHours: state.surveyAnswers?.learningHours || 5,
            streak: nextUser.streak ?? 0,
            coursesCompleted: nextUser.coursesCompleted,
            careerFitScore: nextUser.careerFitScore ?? 0,
            xp: nextUser.xp
          });

          if (nextRecs && nextRecs.courses) {
            await saveDBCourseProgress(session.user.id, nextRecs.courses);
          }
        }
      } catch (e) {
        console.warn("Failed to save completed course profile in Supabase:", e);
      }
    },

    updateCourseProgress: async (courseTitle: string, progress: number) => {
      let nextRecs = state.recommendations;
      if (nextRecs && nextRecs.courses) {
        nextRecs = {
          ...nextRecs,
          courses: nextRecs.courses.map(c => 
            c.title === courseTitle ? { ...c, progress: Math.max(c.progress || 0, progress) } : c
          )
        };
      }
      updateState({ recommendations: nextRecs });

      if (typeof window !== "undefined" && window.localStorage) {
        const email = state.user?.email || "guest";
        const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
        const progressMap = savedProgress ? JSON.parse(savedProgress) : {};
        progressMap[courseTitle] = Math.max(progressMap[courseTitle] || 0, progress);
        window.localStorage.setItem(`courses_progress_${email}`, JSON.stringify(progressMap));
      }

      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session && session.user && nextRecs && nextRecs.courses) {
          await saveDBCourseProgress(session.user.id, nextRecs.courses);
        }
      } catch (e) {
        console.warn("Failed to update course progress in Supabase:", e);
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
            const userId = session.user.id;
            if (typeof window !== "undefined" && window.localStorage) {
              const saved = window.localStorage.getItem(`user_profile_${userId}`);
              const profile = saved ? JSON.parse(saved) : {};
              profile.courses_completed = nextUser.coursesCompleted;
              profile.career_fit_score = nextUser.careerFitScore;
              profile.xp = nextUser.xp;
              window.localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profile));
            }

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

            // Update next assessment in store recommendations directly
            const focusDomain = state.surveyAnswers?.focusDomain || "Mobile";
            const proficiency = state.surveyAnswers?.proficiency || "Beginner";
            const nextAssessmentTitle = await getNextAssessmentTitle(session.user.id, focusDomain, proficiency);
            if (state.recommendations) {
              updateState({
                recommendations: {
                  ...state.recommendations,
                  nextAssessment: nextAssessmentTitle
                }
              });
            }
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
          const email = session.user.email || "guest";
          window.localStorage.removeItem(`survey_completed_${email}`);
          window.localStorage.removeItem(`survey_answers_${email}`);
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
    },

    triggerManualSurvey: () => {
      updateState({
        surveyCompleted: false
      });
    }
  };
}

// Keep store session synced with Supabase Auth state changes
supabase.auth.onAuthStateChange((event: any, session: any) => {
  if (!session || !session.user) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("last_logged_in_user_id");
      window.localStorage.removeItem("supabase_session_token");
    }
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

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("last_logged_in_user_id", userId);
    window.localStorage.setItem("supabase_session_token", session.access_token);
  }

  const cachedSurveyCompleted = typeof window !== "undefined" && window.localStorage 
    ? window.localStorage.getItem(`survey_completed_${userEmail}`) === "true"
    : false;

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
    surveyCompleted: cachedSurveyCompleted,
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

    // Read cached profile from localStorage if dbProfile is null/missing
    let cachedProfile: any = null;
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(`user_profile_${userId}`);
      if (saved) {
        try {
          cachedProfile = JSON.parse(saved);
        } catch (e) {}
      }
    }

    const profile = dbProfile || cachedProfile;

    let finalStreak = 1;
    let finalLastActive = now.toISOString();
    let finalCoursesCompleted = 0;
    let finalCareerFitScore = 0;
    let finalXp = 0;

    if (!profile) {
      // Create new user profile in database immediately upon registration
      finalStreak = 1;
      finalCoursesCompleted = 0;
      finalCareerFitScore = 0;
      finalXp = 0;

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

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(`user_profile_${userId}`, JSON.stringify({
          name: userName,
          email: userEmail,
          streak: 1,
          created_at: registrationDateObj.toISOString(),
          last_active_date: finalLastActive,
          courses_completed: 0,
          career_fit_score: 0,
          xp: 0
        }));
      }
    } else {
      const lastActiveStr = profile.last_active_date || profile.lastActiveDate ? new Date(profile.last_active_date || profile.lastActiveDate).toDateString() : "";
      finalCoursesCompleted = profile.courses_completed ?? profile.coursesCompleted ?? 0;
      finalCareerFitScore = profile.career_fit_score ?? profile.careerFitScore ?? 0;
      finalXp = profile.xp ?? 0;

      if (!lastActiveStr) {
        // If no last active date, initialize streak to 1
        finalStreak = 1;
      } else if (lastActiveStr === todayStr) {
        // Already logged in today, keep the same streak
        finalStreak = profile.streak ?? 1;
      } else {
        // Calculate calendar difference
        const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastActiveDateObj = new Date(profile.last_active_date || profile.lastActiveDate);
        const localLastActive = new Date(lastActiveDateObj.getFullYear(), lastActiveDateObj.getMonth(), lastActiveDateObj.getDate());
        
        const diffTime = Math.abs(localToday.getTime() - localLastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day: increment streak
          finalStreak = (profile.streak || 0) + 1;
        } else {
          // Missed a day: reset streak to 1 for today's activity
          finalStreak = 1;
        }
      }

      await saveDBProfile(userId, {
        streak: finalStreak,
        lastActiveDate: finalLastActive
      });

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(`user_profile_${userId}`, JSON.stringify({
          name: profile.name || userName,
          email: userEmail,
          streak: finalStreak,
          created_at: profile.created_at || profile.createdAt || registrationDateObj.toISOString(),
          last_active_date: finalLastActive,
          courses_completed: finalCoursesCompleted,
          career_fit_score: finalCareerFitScore,
          xp: finalXp
        }));
      }
    }

    let localSurveyDone = false;
    let localAnswers = null;
    if (typeof window !== "undefined" && window.localStorage) {
      localSurveyDone = window.localStorage.getItem(`survey_completed_${userEmail}`) === "true";
      const saved = window.localStorage.getItem(`survey_answers_${userEmail}`);
      if (saved) {
        try {
          localAnswers = JSON.parse(saved);
        } catch (e) {}
      }
    }

    updateState({
      isLoadingProfile: false,
      user: {
        name: profile?.name || userName,
        email: userEmail,
        registeredAt: new Date(profile?.created_at || profile?.createdAt || registrationDateObj).getTime(),
        streak: finalStreak,
        coursesCompleted: finalCoursesCompleted,
        careerFitScore: finalCareerFitScore,
        xp: finalXp
      },
      surveyCompleted: localSurveyDone || (profile ? (!!profile.last_survey_date || !!profile.lastSurveyDate || !!profile.focus_domain || !!profile.focusDomain) : false),
      lastSurveyDate: profile?.last_survey_date || profile?.lastSurveyDate ? new Date(profile.last_survey_date || profile.lastSurveyDate).getTime() : (localSurveyDone ? Date.now() : null),
      surveyAnswers: profile && (profile.focus_domain || profile.focusDomain) ? {
        focusDomain: profile.focus_domain || profile.focusDomain,
        proficiency: profile.proficiency || "Beginner",
        learningHours: profile.learning_hours || profile.learningHours || 5
      } : (localAnswers || null)
    });
  }).catch(err => {
    console.warn("Background fetch profile failed:", err);
    updateState({ isLoadingProfile: false });
  });
});

export type { SurveyAnswers, UserProfile };
