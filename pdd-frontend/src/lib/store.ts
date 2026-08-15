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
  updateDBAssessment,
  fetchDBRecommendations,
  saveDBCourseProgress,
  fetchDBUserEnrollments,
  enrollInDBCourse,
  saveDBRecommendations
} from "./supabase-db";

function parseDeadline(deadline: string): Date | null {
  try {
    const cleaned = deadline.replace("·", "").replace(/\s+/g, " ").trim();
    const parts = cleaned.split(" ");
    const monthStr = parts[1];
    const dayStr = parts[2];
    
    if (monthStr && dayStr) {
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const cleanMonth = monthStr.replace(/[^a-zA-Z]/g, "").toLowerCase().substring(0, 3);
      const monthIdx = monthNames.indexOf(cleanMonth);
      const cleanDay = parseInt(dayStr.replace(/[^0-9]/g, ""));
      
      if (monthIdx !== -1 && !isNaN(cleanDay)) {
        const timePart = parts[3] || "12:00";
        const ampmPart = parts[4] || "AM";
        
        let hours = 12;
        let minutes = 0;
        const timeMatch = timePart.match(/(\d+):(\d+)/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
        }
        
        if (ampmPart.toLowerCase().includes("pm") && hours < 12) {
          hours += 12;
        } else if (ampmPart.toLowerCase().includes("am") && hours === 12) {
          hours = 0;
        }
        
        return new Date(2026, monthIdx, cleanDay, hours, minutes);
      }
    }
  } catch (e) {}
  return null;
}

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
  suggestedCourses: any[];
  enrolledCourses: any[];
  isLoadingRecommendations: boolean;
  isLoadingProfile: boolean;
  lowDataMode: boolean;
  cachedMaterials: Array<{ title: string; url: string; cachedAt: number }>;
  appTheme: "light" | "indigo" | "dark";
  isRecoveringPassword: boolean;
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
  suggestedCourses: [],
  enrolledCourses: [],
  isLoadingRecommendations: false,
  isLoadingProfile: true,
  lowDataMode: false,
  cachedMaterials: [],
  appTheme: "indigo",
  isRecoveringPassword: false,
};

// Internal store variables
let state: DashboardState = { ...DEFAULT_STATE };

// Synchronously hydrate state if localStorage is available
if (typeof window !== "undefined" && window.localStorage) {
  const lastUserId = window.localStorage.getItem("last_logged_in_user_id");
  const savedToken = window.localStorage.getItem("supabase_session_token");
  const savedTheme = (window.localStorage.getItem("app-theme") || "indigo") as "light" | "indigo" | "dark";
  state.appTheme = savedTheme;
  
  // Apply theme immediately
  const root = document.documentElement;
  if (savedTheme === "light") {
    root.style.setProperty("--primary", "oklch(0.60 0.05 252)");
    root.style.setProperty("--ring", "oklch(0.60 0.05 252)");
  } else if (savedTheme === "indigo") {
    root.style.setProperty("--primary", "oklch(0.62 0.2 255)");
    root.style.setProperty("--ring", "oklch(0.62 0.2 255)");
  } else if (savedTheme === "dark") {
    root.style.setProperty("--primary", "oklch(0.72 0.15 165)");
    root.style.setProperty("--ring", "oklch(0.72 0.15 165)");
  }

  if (lastUserId && savedToken) {
    const savedProfile = window.localStorage.getItem(`user_profile_${lastUserId}`);
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        state.user = {
          id: lastUserId,
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

        const savedEnrolled = window.localStorage.getItem(`enrolled_courses_${lastUserId}`);
        if (savedEnrolled) {
          state.enrolledCourses = JSON.parse(savedEnrolled);
        }

        const savedSuggested = window.localStorage.getItem(`suggested_courses_${lastUserId}`);
        if (savedSuggested) {
          state.suggestedCourses = JSON.parse(savedSuggested);
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
      let hydratedEnrolled = [];
      let hydratedSuggested = [];
      
      const lastUserId = window.localStorage.getItem("last_logged_in_user_id");
      const savedToken = window.localStorage.getItem("supabase_session_token");
      if (lastUserId && savedToken) {
        const savedProfile = window.localStorage.getItem(`user_profile_${lastUserId}`);
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile);
            hydratedUser = {
              id: lastUserId,
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

        const savedEnrolled = window.localStorage.getItem(`enrolled_courses_${lastUserId}`);
        if (savedEnrolled) {
          try { hydratedEnrolled = JSON.parse(savedEnrolled); } catch (e) {}
        }

        const savedSuggested = window.localStorage.getItem(`suggested_courses_${lastUserId}`);
        if (savedSuggested) {
          try { hydratedSuggested = JSON.parse(savedSuggested); } catch (e) {}
        }
      }

      updateState({
        lowDataMode: mode === "true",
        cachedMaterials: cached ? JSON.parse(cached) : [],
        appTheme: (window.localStorage.getItem("app-theme") || "indigo") as any,
        enrolledCourses: hydratedEnrolled.length > 0 ? hydratedEnrolled : state.enrolledCourses,
        suggestedCourses: hydratedSuggested.length > 0 ? hydratedSuggested : state.suggestedCourses,
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

  const applyLateAssessmentXPCheck = async () => {
    const prevUser = state.user;
    if (!prevUser) return;
    
    const sessionData = await supabase.auth.getSession();
    const session = sessionData.data.session;
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      const assessments = await fetchDBAssessments(userId, state.surveyAnswers?.focusDomain || "Mobile", state.surveyAnswers?.proficiency || "Beginner");
      const now = new Date();
      let xpDeducted = 0;
      
      const updatedAssessments = await Promise.all(assessments.map(async (ass) => {
        const dueDateStr = ass.due_date || (ass.deadline ? parseDeadline(ass.deadline)?.toISOString() : null);
        if (ass.status !== "submitted" && dueDateStr) {
          const dueDate = new Date(dueDateStr);
          if (now > dueDate) {
            const lastPenalized = ass.last_penalized_at ? new Date(ass.last_penalized_at) : dueDate;
            const msLate = now.getTime() - lastPenalized.getTime();
            const daysLate = Math.floor(msLate / (24 * 60 * 60 * 1000));
            
            if (daysLate >= 1) {
              const penalty = daysLate * 50;
              xpDeducted += penalty;
              const nextPenalizedDate = new Date(lastPenalized.getTime() + daysLate * 24 * 60 * 60 * 1000).toISOString();
              
              await updateDBAssessment(userId, ass.id, { 
                start_date: ass.start_date || new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                due_date: dueDateStr,
                last_penalized_at: nextPenalizedDate 
              });
              
              return { ...ass, start_date: ass.start_date || new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), due_date: dueDateStr, last_penalized_at: nextPenalizedDate };
            } else if (!ass.due_date) {
              await updateDBAssessment(userId, ass.id, {
                start_date: ass.start_date || new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                due_date: dueDateStr,
                last_penalized_at: ass.last_penalized_at || dueDateStr
              });
            }
          } else if (!ass.due_date) {
            await updateDBAssessment(userId, ass.id, {
              start_date: ass.start_date || new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              due_date: dueDateStr,
              last_penalized_at: ass.last_penalized_at || dueDateStr
            });
          }
        }
        return ass;
      }));

      if (xpDeducted > 0) {
        const nextXp = Math.max(0, (prevUser.xp || 0) - xpDeducted);
        const nextUser = { ...prevUser, xp: nextXp };
        
        updateState({ user: nextUser });
        
        if (typeof window !== "undefined" && window.localStorage) {
          const saved = window.localStorage.getItem(`user_profile_${userId}`);
          const profile = saved ? JSON.parse(saved) : {};
          profile.xp = nextXp;
          window.localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profile));
        }

        await saveDBProfile(userId, {
          name: nextUser.name,
          email: nextUser.email,
          focusDomain: state.surveyAnswers?.focusDomain || "Mobile",
          proficiency: state.surveyAnswers?.proficiency || "Beginner",
          learningHours: state.surveyAnswers?.learningHours || 5,
          streak: nextUser.streak ?? 0,
          coursesCompleted: nextUser.coursesCompleted ?? 0,
          careerFitScore: nextUser.careerFitScore ?? 0,
          xp: nextXp
        });

        if (typeof window !== "undefined") {
          alert(`Oops! You have late assessments. Deducted ${xpDeducted} XP! Complete them to stop further deductions.`);
        }
      }
    } catch (err) {
      console.warn("Failed to check late assessments XP penalty:", err);
    }
  };

  return {
    ...current,
    isResurveyDue,
    applyLateAssessmentXPCheck,
    
    // Action methods
    setAuth: (user: any, token: string) => {
      const userId = user.id || user.uid;
      const userEmail = user.email;
      const userName = user.name || userEmail?.split("@")[0];

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("last_logged_in_user_id", userId);
        window.localStorage.setItem("supabase_session_token", token);
      }

      updateState({
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          registeredAt: Date.now(),
          streak: user.streak ?? 0,
          coursesCompleted: user.coursesCompleted ?? 0,
          careerFitScore: user.careerFitScore ?? 0,
          xp: user.xp ?? 0
        },
        token,
        isRecoveringPassword: false
      });

      // Hydrate profile details asynchronously
      supabase.auth.getSession().then(({ data }) => {
        const session = data.session || {
          access_token: token,
          user: {
            id: userId,
            email: userEmail,
            created_at: new Date().toISOString()
          }
        };
        syncProfile(userId, userEmail, userName, session);
      });
    },

    setRecoveringPassword: (val: boolean) => {
      updateState({ isRecoveringPassword: val });
    },

    enrollInCourse: async (courseIdOrTitle: number | string) => {
      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session?.user) {
          let targetId: number | null = null;
          if (typeof courseIdOrTitle === "number") {
            targetId = courseIdOrTitle;
          } else {
            // Find course ID by title
            const { data } = await supabase
              .from("courses")
              .select("id")
              .eq("title", courseIdOrTitle)
              .maybeSingle();
            if (data) {
              targetId = data.id;
            }
          }

          if (targetId) {
            await enrollInDBCourse(session.user.id, targetId);
          }

          const answers = state.surveyAnswers;
          if (answers) {
            const courses = await fetchDBCourses(answers.focusDomain, answers.proficiency);
            
            let coursesWithProgress = courses;
            if (typeof window !== "undefined" && window.localStorage) {
              const email = state.user?.email || "guest";
              const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
              if (savedProgress) {
                try {
                  const progressMap = JSON.parse(savedProgress);
                  coursesWithProgress = courses.map(c => ({
                    ...c,
                    progress: progressMap[c.title] !== undefined ? progressMap[c.title] : c.progress
                  }));
                } catch (e) {}
              }
            }

            const enrollments = await fetchDBUserEnrollments(session.user.id);
            const enrolledTitles = new Set<string>();
            const progressMap: Record<number, number> = {};

            enrollments.forEach(e => {
              if (e.courses && e.courses.title) {
                enrolledTitles.add(e.courses.title.toLowerCase());
              }
              progressMap[e.course_id] = e.progress;
            });

            const enrolled: any[] = [];
            const suggested: any[] = [];

            coursesWithProgress.forEach(c => {
              const isEnrolled = enrolledTitles.has(c.title.toLowerCase()) || 
                (c.id !== undefined ? (progressMap[c.id] !== undefined) : false);

              if (isEnrolled) {
                enrolled.push({
                  ...c,
                  progress: c.id !== undefined && progressMap[c.id] !== undefined ? progressMap[c.id] : (c.progress || 0)
                });
              } else {
                suggested.push(c);
              }
            });

            const completedCount = enrolled.filter(c => c.progress === 100).length;
            if (state.user) {
              updateState({ 
                enrolledCourses: enrolled, 
                suggestedCourses: suggested,
                user: {
                  ...state.user,
                  coursesCompleted: completedCount
                }
              });
            } else {
              updateState({ enrolledCourses: enrolled, suggestedCourses: suggested });
            }

            if (typeof window !== "undefined" && window.localStorage && session.user.id) {
              window.localStorage.setItem(`enrolled_courses_${session.user.id}`, JSON.stringify(enrolled));
              window.localStorage.setItem(`suggested_courses_${session.user.id}`, JSON.stringify(suggested));
            }
          }
        } else {
          const target = state.suggestedCourses.find(c => 
            typeof courseIdOrTitle === "number" ? c.id === courseIdOrTitle : c.title.toLowerCase() === courseIdOrTitle.toLowerCase()
          );
          if (target) {
            const updatedSuggested = state.suggestedCourses.filter(c => 
              typeof courseIdOrTitle === "number" ? c.id !== courseIdOrTitle : c.title.toLowerCase() !== courseIdOrTitle.toLowerCase()
            );
            const updatedEnrolled = [...state.enrolledCourses, { ...target, progress: 0 }];
            updateState({ enrolledCourses: updatedEnrolled, suggestedCourses: updatedSuggested });
          }
        }
      } catch (err) {
        console.warn("Failed to enroll in course:", err);
      }
    },

    unenrollFromCourse: async (courseIdOrTitle: number | string) => {
      try {
        const sessionData = await supabase.auth.getSession();
        const session = sessionData.data.session;
        if (session?.user) {
          let targetId: number | null = null;
          if (typeof courseIdOrTitle === "number") {
            targetId = courseIdOrTitle;
          } else {
            // Find course ID by title
            const { data } = await supabase
              .from("courses")
              .select("id")
              .eq("title", courseIdOrTitle)
              .maybeSingle();
            if (data) {
              targetId = data.id;
            }
          }

          if (targetId) {
            await supabase
              .from("user_enrollments")
              .delete()
              .eq("user_id", session.user.id)
              .eq("course_id", targetId);
          }

          const answers = state.surveyAnswers;
          if (answers) {
            const courses = await fetchDBCourses(answers.focusDomain, answers.proficiency);
            
            let coursesWithProgress = courses;
            if (typeof window !== "undefined" && window.localStorage) {
              const email = state.user?.email || "guest";
              const savedProgress = window.localStorage.getItem(`courses_progress_${email}`);
              if (savedProgress) {
                try {
                  const progressMap = JSON.parse(savedProgress);
                  coursesWithProgress = courses.map(c => ({
                    ...c,
                    progress: progressMap[c.title] !== undefined ? progressMap[c.title] : c.progress
                  }));
                } catch (e) {}
              }
            }

            const enrollments = await fetchDBUserEnrollments(session.user.id);
            const enrolledTitles = new Set<string>();
            const progressMap: Record<number, number> = {};

            enrollments.forEach(e => {
              if (e.courses && e.courses.title) {
                enrolledTitles.add(e.courses.title.toLowerCase());
              }
              progressMap[e.course_id] = e.progress;
            });

            const enrolled: any[] = [];
            const suggested: any[] = [];

            coursesWithProgress.forEach(c => {
              const isEnrolled = enrolledTitles.has(c.title.toLowerCase()) || 
                (c.id !== undefined ? (progressMap[c.id] !== undefined) : false);

              if (isEnrolled) {
                enrolled.push({
                  ...c,
                  progress: c.id !== undefined && progressMap[c.id] !== undefined ? progressMap[c.id] : (c.progress || 0)
                });
              } else {
                suggested.push(c);
              }
            });

            const completedCount = enrolled.filter(c => c.progress === 100).length;
            if (state.user) {
              updateState({ 
                enrolledCourses: enrolled, 
                suggestedCourses: suggested,
                user: {
                  ...state.user,
                  coursesCompleted: completedCount
                }
              });
            } else {
              updateState({ enrolledCourses: enrolled, suggestedCourses: suggested });
            }

            if (typeof window !== "undefined" && window.localStorage && session.user.id) {
              window.localStorage.setItem(`enrolled_courses_${session.user.id}`, JSON.stringify(enrolled));
              window.localStorage.setItem(`suggested_courses_${session.user.id}`, JSON.stringify(suggested));
            }
          }
        } else {
          const target = state.enrolledCourses.find(c => 
            typeof courseIdOrTitle === "number" ? c.id === courseIdOrTitle : c.title.toLowerCase() === courseIdOrTitle.toLowerCase()
          );
          if (target) {
            const updatedEnrolled = state.enrolledCourses.filter(c => 
              typeof courseIdOrTitle === "number" ? c.id !== courseIdOrTitle : c.title.toLowerCase() !== courseIdOrTitle.toLowerCase()
            );
            const updatedSuggested = [...state.suggestedCourses, target];
            updateState({ enrolledCourses: updatedEnrolled, suggestedCourses: updatedSuggested });
          }
        }
      } catch (err) {
        console.warn("Failed to unenroll from course:", err);
      }
    },

    fetchRecommendations: async () => {
      await applyLateAssessmentXPCheck();
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

      const sessionData = await supabase.auth.getSession();
      const session = sessionData.data.session;
      const userId = session?.user?.id;

      const partitionAndSetCourses = async (allCourses: any[], currentUserId?: string) => {
        let enrolled: any[] = [];
        let suggested: any[] = [];

        if (!currentUserId) {
          // Guest mode: all suggested
          enrolled = [];
          suggested = allCourses;
        } else {
          try {
            const enrollments = await fetchDBUserEnrollments(currentUserId);
            const enrolledTitles = new Set<string>();
            const progressMap: Record<number, number> = {};

            enrollments.forEach(e => {
              if (e.courses && e.courses.title) {
                enrolledTitles.add(e.courses.title.toLowerCase());
              }
              progressMap[e.course_id] = e.progress;
            });

            allCourses.forEach(c => {
              const isEnrolled = enrolledTitles.has(c.title.toLowerCase()) || 
                (c.id !== undefined ? (progressMap[c.id] !== undefined) : false);

              if (isEnrolled) {
                enrolled.push({
                  ...c,
                  progress: c.id !== undefined && progressMap[c.id] !== undefined ? progressMap[c.id] : (c.progress || 0)
                });
              } else {
                suggested.push(c);
              }
            });
          } catch (e) {
            console.warn("Error partitioning courses:", e);
            enrolled = [];
            suggested = allCourses;
          }
        }

        const completedCount = enrolled.filter(c => c.progress === 100).length;
        if (state.user) {
          updateState({
            enrolledCourses: enrolled,
            suggestedCourses: suggested,
            user: {
              ...state.user,
              coursesCompleted: completedCount
            }
          });
        } else {
          updateState({ enrolledCourses: enrolled, suggestedCourses: suggested });
        }

        if (currentUserId && typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(`enrolled_courses_${currentUserId}`, JSON.stringify(enrolled));
          window.localStorage.setItem(`suggested_courses_${currentUserId}`, JSON.stringify(suggested));
        }
      };

      try {
        if (userId) {
          const dbRec = await fetchDBRecommendations(userId);
          if (dbRec && dbRec.courses && dbRec.courses.length > 0) {
            const firstCourse = dbRec.courses[0];
            const isMatching = !answers || !firstCourse || firstCourse.subject.toLowerCase() === answers.focusDomain.toLowerCase();
            
            if (isMatching) {
              const coursesWithProgress = overlayProgress(dbRec.courses);
              await partitionAndSetCourses(coursesWithProgress, userId);
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
        }
      } catch (e) {
        console.warn("Failed to fetch user-specific recommendations from DB:", e);
      }

      if (answers) {
        updateState({ isLoadingRecommendations: true });
        try {
          const [courses, resources, milestones, nextAssessment] = await Promise.all([
            fetchDBCourses(answers.focusDomain, answers.proficiency),
            fetchDBResources(answers.focusDomain, answers.proficiency),
            fetchDBMilestones(answers.focusDomain, answers.proficiency),
            userId
              ? getNextAssessmentTitle(userId, answers.focusDomain, answers.proficiency)
              : Promise.resolve(
                  answers.focusDomain === "Frontend" ? "React State & Styling Quiz"
                    : answers.focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
                      : answers.focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
                        : "PyTorch Data Loading & Gradient descent"
                )
          ]);
          
          const coursesWithProgress = overlayProgress(courses);
          await partitionAndSetCourses(coursesWithProgress, userId);
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
            await partitionAndSetCourses(recData.courses, userId);
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
        const coursesWithProgress = overlayProgress(localRecs.courses);
        await partitionAndSetCourses(coursesWithProgress, userId);
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
        
        let enrolled: any[] = [];
        let suggested: any[] = [];
        if (session?.user?.id) {
          try {
            const enrollments = await fetchDBUserEnrollments(session.user.id);
            const enrolledTitles = new Set<string>();
            const progressMap: Record<number, number> = {};

            enrollments.forEach(e => {
              if (e.courses && e.courses.title) {
                enrolledTitles.add(e.courses.title.toLowerCase());
              }
              progressMap[e.course_id] = e.progress;
            });

            coursesWithProgress.forEach(c => {
              const isEnrolled = enrolledTitles.has(c.title.toLowerCase()) || 
                (c.id !== undefined ? (progressMap[c.id] !== undefined) : false);

              if (isEnrolled) {
                enrolled.push({
                  ...c,
                  progress: c.id !== undefined && progressMap[c.id] !== undefined ? progressMap[c.id] : (c.progress || 0)
                });
              } else {
                suggested.push(c);
              }
            });
          } catch (e) {
            console.warn("Error partitioning on submitSurvey:", e);
            enrolled = [];
            suggested = coursesWithProgress;
          }
        } else {
          enrolled = [];
          suggested = coursesWithProgress;
        }

        const newRecs = {
          courses: coursesWithProgress,
          resources: resources.map(r => ({ title: r.title, type: r.type, duration: "15 min" })),
          milestones,
          weeklyHoursTarget: answers.learningHours,
          nextAssessment
        };

        if (session?.user?.id) {
          try {
            await saveDBRecommendations(session.user.id, newRecs);
          } catch (err) {
            console.warn("Failed to persist recommendations to DB:", err);
          }
        }

        const completedCount = enrolled.filter(c => c.progress === 100).length;
        if (state.user) {
          updateState({
            recommendations: newRecs,
            enrolledCourses: enrolled,
            suggestedCourses: suggested,
            user: {
              ...state.user,
              coursesCompleted: completedCount
            },
            isLoadingRecommendations: false
          });
        } else {
          updateState({
            recommendations: newRecs,
            enrolledCourses: enrolled,
            suggestedCourses: suggested,
            isLoadingRecommendations: false
          });
        }
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
        
        const localCourses = localRecs.courses;
        const enrolled: any[] = [];
        const suggested = localCourses;

        const completedCount = enrolled.filter(c => c.progress === 100).length;
        if (state.user) {
          updateState({ 
            recommendations: localRecs, 
            enrolledCourses: enrolled,
            suggestedCourses: suggested,
            user: {
              ...state.user,
              coursesCompleted: completedCount
            },
            isLoadingRecommendations: false 
          });
        } else {
          updateState({ 
            recommendations: localRecs, 
            enrolledCourses: enrolled,
            suggestedCourses: suggested,
            isLoadingRecommendations: false 
          });
        }
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
      
      let nextRecs = state.recommendations;
      let nextEnrolled = state.enrolledCourses;
      if (nextRecs && nextRecs.courses) {
        nextRecs = {
          ...nextRecs,
          courses: nextRecs.courses.map(c => 
            c.title === courseTitle ? { ...c, progress: 100 } : c
          )
        };
      }
      if (nextEnrolled) {
        nextEnrolled = nextEnrolled.map(c =>
          c.title === courseTitle ? { ...c, progress: 100 } : c
        );
      }
      
      const completedCount = nextEnrolled.filter(c => c.progress === 100).length;

      const nextUser = {
        ...prevUser,
        coursesCompleted: completedCount,
        xp: (prevUser.xp || 0) + 100
      };
      
      updateState({
        user: nextUser,
        recommendations: nextRecs,
        enrolledCourses: nextEnrolled
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
    },

    setAppTheme: (themeKey: "light" | "indigo" | "dark") => {
      updateState({ appTheme: themeKey });
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("app-theme", themeKey);
      }
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        if (themeKey === "light") {
          root.style.setProperty("--primary", "oklch(0.60 0.05 252)");
          root.style.setProperty("--ring", "oklch(0.60 0.05 252)");
        } else if (themeKey === "indigo") {
          root.style.setProperty("--primary", "oklch(0.62 0.2 255)");
          root.style.setProperty("--ring", "oklch(0.62 0.2 255)");
        } else if (themeKey === "dark") {
          root.style.setProperty("--primary", "oklch(0.72 0.15 165)");
          root.style.setProperty("--ring", "oklch(0.72 0.15 165)");
        }
      }
    }
  };
}

async function syncProfile(userId: string, userEmail: string, userName: string, session: any) {
  updateState({ isLoadingProfile: true });
  try {
    const dbProfile = await fetchDBProfile(userId);
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
        id: userId,
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
  } catch (err) {
    console.warn("Background fetch profile failed:", err);
    updateState({ isLoadingProfile: false });
  }
}

// Keep store session synced with Supabase Auth state changes
supabase.auth.onAuthStateChange((event: any, session: any) => {
  if (state.isRecoveringPassword) {
    // Prevent auto-login / dashboard redirect during recovery password reset step
    return;
  }

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
      id: userId,
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

  syncProfile(userId, userEmail, userName, session);
});

export type { SurveyAnswers, UserProfile };
