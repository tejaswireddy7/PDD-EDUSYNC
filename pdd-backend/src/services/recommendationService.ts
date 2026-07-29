import { supabase } from "../config/supabase";
import { getRecommendedResources } from "./apiAggregator";
import {
  RecommendedCourse,
  RecommendedResource,
  CareerMilestone,
  RecommendationOutput,
  SurveyAnswers,
} from "../types";
import { AppError, errorCodes } from "../utils/errors";

// Predefined course recommendations based on domain and proficiency
const courseRecommendations: Record<
  string,
  Record<string, RecommendedCourse[]>
> = {
  Frontend: {
    Beginner: [
      {
        title: "HTML & CSS Fundamentals",
        subject: "Web Basics",
        progress: 0,
        time: "4 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#FF6B6B", "#4ECDC4"],
      },
      {
        title: "JavaScript Essentials",
        subject: "Programming",
        progress: 0,
        time: "6 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#FFE66D", "#95E1D3"],
      },
      {
        title: "Responsive Web Design",
        subject: "Web Design",
        progress: 0,
        time: "3 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#A8D8EA", "#AA96DA"],
      },
    ],
    Intermediate: [
      {
        title: "React.js Fundamentals",
        subject: "Frontend Framework",
        progress: 0,
        time: "5 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#61DAFB", "#282C34"],
      },
      {
        title: "TypeScript for React",
        subject: "Type Safety",
        progress: 0,
        time: "4 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#3178C6", "#E34C26"],
      },
      {
        title: "State Management with Redux",
        subject: "Advanced Patterns",
        progress: 0,
        time: "3 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#764ABC", "#F7DF1E"],
      },
    ],
    Advanced: [
      {
        title: "Next.js & Server Components",
        subject: "Fullstack Framework",
        progress: 0,
        time: "6 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#000000", "#FFFFFF"],
      },
      {
        title: "Advanced TypeScript Patterns",
        subject: "Advanced TypeScript",
        progress: 0,
        time: "5 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#3178C6", "#FFD700"],
      },
      {
        title: "Performance Optimization",
        subject: "Web Performance",
        progress: 0,
        time: "4 weeks",
        difficulty: "Advanced",
        ai: false,
        colors: ["#FF9900", "#146EB0"],
      },
    ],
  },
  Backend: {
    Beginner: [
      {
        title: "Node.js & Express Basics",
        subject: "Backend Runtime",
        progress: 0,
        time: "4 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#68A063", "#F7DF1E"],
      },
      {
        title: "REST API Design",
        subject: "API Design",
        progress: 0,
        time: "3 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#009688", "#FF5722"],
      },
      {
        title: "Database Basics (SQL)",
        subject: "Databases",
        progress: 0,
        time: "5 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#336791", "#FFD700"],
      },
    ],
    Intermediate: [
      {
        title: "Authentication & Authorization",
        subject: "Security",
        progress: 0,
        time: "3 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#E74C3C", "#3498DB"],
      },
      {
        title: "PostgreSQL Advanced",
        subject: "Databases",
        progress: 0,
        time: "4 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#336791", "#E8E8E8"],
      },
      {
        title: "API Testing & Documentation",
        subject: "Quality Assurance",
        progress: 0,
        time: "3 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#2ECC71", "#F39C12"],
      },
    ],
    Advanced: [
      {
        title: "Microservices Architecture",
        subject: "System Design",
        progress: 0,
        time: "6 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#34495E", "#2ECC71"],
      },
      {
        title: "Message Queues & Event Streaming",
        subject: "Distributed Systems",
        progress: 0,
        time: "5 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#FF6B6B", "#4ECDC4"],
      },
      {
        title: "DevOps & Deployment",
        subject: "Infrastructure",
        progress: 0,
        time: "4 weeks",
        difficulty: "Advanced",
        ai: false,
        colors: ["#F7931E", "#1D3557"],
      },
    ],
  },
  Mobile: {
    Beginner: [
      {
        title: "React Native Basics",
        subject: "Mobile Development",
        progress: 0,
        time: "4 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#61DAFB", "#282C34"],
      },
      {
        title: "Mobile UI/UX Principles",
        subject: "Design",
        progress: 0,
        time: "3 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#FF6B9D", "#C44569"],
      },
      {
        title: "Mobile Navigation & Routing",
        subject: "Mobile Patterns",
        progress: 0,
        time: "2 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#667EEA", "#764BA2"],
      },
    ],
    Intermediate: [
      {
        title: "Native Modules & Bridging",
        subject: "Advanced React Native",
        progress: 0,
        time: "4 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#61DAFB", "#FF6B9D"],
      },
      {
        title: "Mobile App Performance",
        subject: "Performance",
        progress: 0,
        time: "3 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#FF9900", "#3498DB"],
      },
      {
        title: "Offline-First Architecture",
        subject: "Mobile Architecture",
        progress: 0,
        time: "3 weeks",
        difficulty: "Intermediate",
        ai: false,
        colors: ["#2ECC71", "#E74C3C"],
      },
    ],
    Advanced: [
      {
        title: "Cross-Platform Optimization",
        subject: "Advanced Patterns",
        progress: 0,
        time: "5 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#667EEA", "#764BA2"],
      },
      {
        title: "Mobile Security Best Practices",
        subject: "Security",
        progress: 0,
        time: "4 weeks",
        difficulty: "Advanced",
        ai: false,
        colors: ["#E74C3C", "#34495E"],
      },
      {
        title: "App Store Deployment & Analytics",
        subject: "Distribution",
        progress: 0,
        time: "2 weeks",
        difficulty: "Advanced",
        ai: false,
        colors: ["#2ECC71", "#F39C12"],
      },
    ],
  },
  AI: {
    Beginner: [
      {
        title: "Python for AI/ML",
        subject: "Programming",
        progress: 0,
        time: "5 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#3776AB", "#FFD43B"],
      },
      {
        title: "Machine Learning Fundamentals",
        subject: "ML Concepts",
        progress: 0,
        time: "4 weeks",
        difficulty: "Beginner",
        ai: true,
        colors: ["#FF6B6B", "#4ECDC4"],
      },
      {
        title: "Data Science Essentials",
        subject: "Data Science",
        progress: 0,
        time: "4 weeks",
        difficulty: "Beginner",
        ai: false,
        colors: ["#F7931E", "#1D3557"],
      },
    ],
    Intermediate: [
      {
        title: "TensorFlow & Keras",
        subject: "Deep Learning",
        progress: 0,
        time: "5 weeks",
        difficulty: "Intermediate",
        ai: true,
        colors: ["#FF6F00", "#FFFFFF"],
      },
      {
        title: "NLP & Text Processing",
        subject: "NLP",
        progress: 0,
        time: "4 weeks",
        difficulty: "Intermediate",
        ai: true,
        colors: ["#3498DB", "#2ECC71"],
      },
      {
        title: "Computer Vision Basics",
        subject: "Computer Vision",
        progress: 0,
        time: "5 weeks",
        difficulty: "Intermediate",
        ai: true,
        colors: ["#E74C3C", "#34495E"],
      },
    ],
    Advanced: [
      {
        title: "Advanced Neural Networks",
        subject: "Deep Learning",
        progress: 0,
        time: "6 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#FF6B6B", "#4ECDC4"],
      },
      {
        title: "Generative AI & LLMs",
        subject: "Generative AI",
        progress: 0,
        time: "5 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#9B59B6", "#F39C12"],
      },
      {
        title: "ML Model Production & MLOps",
        subject: "ML Operations",
        progress: 0,
        time: "4 weeks",
        difficulty: "Advanced",
        ai: true,
        colors: ["#2ECC71", "#34495E"],
      },
    ],
  },
};

// Predefined milestones
const careerMilestones: Record<
  string,
  Record<string, CareerMilestone[]>
> = {
  Frontend: {
    Beginner: [
      {
        title: "Build your first webpage",
        description: "Create a responsive HTML/CSS portfolio",
        status: "active",
      },
      {
        title: "JavaScript interactivity",
        description: "Add DOM manipulation and events",
        status: "locked",
      },
    ],
    Intermediate: [
      {
        title: "React component library",
        description: "Build reusable React components",
        status: "active",
      },
      {
        title: "State management mastery",
        description: "Master Redux or Context API",
        status: "locked",
      },
    ],
    Advanced: [
      {
        title: "Full-stack Next.js app",
        description: "Build production-ready app with Next.js",
        status: "active",
      },
      {
        title: "Performance optimization",
        description: "Achieve 90+ Lighthouse score",
        status: "locked",
      },
    ],
  },
  Backend: {
    Beginner: [
      {
        title: "RESTful API creation",
        description: "Build your first REST API",
        status: "active",
      },
      {
        title: "Database integration",
        description: "Connect and query a database",
        status: "locked",
      },
    ],
    Intermediate: [
      {
        title: "Authentication system",
        description: "Implement JWT-based auth",
        status: "active",
      },
      {
        title: "API security",
        description: "Add authorization & validation",
        status: "locked",
      },
    ],
    Advanced: [
      {
        title: "Microservices architecture",
        description: "Design scalable services",
        status: "active",
      },
      {
        title: "Deploy to production",
        description: "Use Docker, Kubernetes, or cloud platform",
        status: "locked",
      },
    ],
  },
  Mobile: {
    Beginner: [
      {
        title: "First React Native app",
        description: "Build a simple mobile app",
        status: "active",
      },
      {
        title: "Navigation setup",
        description: "Implement app navigation",
        status: "locked",
      },
    ],
    Intermediate: [
      {
        title: "State management",
        description: "Use Redux or Context in mobile app",
        status: "active",
      },
      {
        title: "Native modules integration",
        description: "Bridge JavaScript and native code",
        status: "locked",
      },
    ],
    Advanced: [
      {
        title: "App store deployment",
        description: "Publish to App Store & Play Store",
        status: "active",
      },
      {
        title: "Performance optimization",
        description: "Optimize app for all devices",
        status: "locked",
      },
    ],
  },
  AI: {
    Beginner: [
      {
        title: "ML model training",
        description: "Train your first ML model",
        status: "active",
      },
      {
        title: "Model evaluation",
        description: "Understand accuracy and metrics",
        status: "locked",
      },
    ],
    Intermediate: [
      {
        title: "Deep learning model",
        description: "Build and train neural networks",
        status: "active",
      },
      {
        title: "Model deployment",
        description: "Deploy ML model as API",
        status: "locked",
      },
    ],
    Advanced: [
      {
        title: "LLM fine-tuning",
        description: "Fine-tune language models",
        status: "active",
      },
      {
        title: "Production ML system",
        description: "Build complete ML pipeline with monitoring",
        status: "locked",
      },
    ],
  },
};

// Vocabulary list of keyword features used to map user preferences to courses & resources
const ALL_TAGS = [
  // Frontend
  "html", "css", "grid", "javascript", "js", "dom", "react", "redux", "context", "tailwind", "typescript", "next.js", "vitals", "performance", "micro-frontends",
  // Backend
  "node", "express", "sql", "database", "api", "rest", "spring boot", "postgresql", "redis", "caching", "distributed systems", "docker", "kubernetes", "devops", "go",
  // Mobile
  "expo", "react native", "swiftui", "kotlin", "jetpack", "navigation", "hardware", "bridge",
  // AI
  "python", "pandas", "numpy", "pytorch", "neural networks", "nlp", "llm", "generative ai", "mlops", "deep learning"
];

// Helper to construct a features vector for any learning resource
function getFeaturesVector(title: string, subject: string, extraText: string = ""): number[] {
  const combined = `${title} ${subject} ${extraText}`.toLowerCase();
  return ALL_TAGS.map(tag => (combined.includes(tag) ? 1.0 : 0.0));
}

// Helper to construct user preference vector, boosting weights using focus domain and weak areas
function getUserVector(
  focusDomain: "Frontend" | "Backend" | "Mobile" | "AI",
  weakAreas: Array<{ topic: string; score: number }> = []
): number[] {
  const userVec = new Array(ALL_TAGS.length).fill(0.0);
  
  const domainKeywords: Record<string, string[]> = {
    Frontend: ["html", "css", "grid", "javascript", "js", "dom", "react", "redux", "context", "tailwind", "typescript", "next.js", "vitals", "performance", "micro-frontends"],
    Backend: ["node", "express", "sql", "database", "api", "rest", "spring boot", "postgresql", "redis", "caching", "distributed systems", "docker", "kubernetes", "devops", "go"],
    Mobile: ["expo", "react native", "swiftui", "kotlin", "jetpack", "navigation", "hardware", "bridge"],
    AI: ["python", "pandas", "numpy", "pytorch", "neural networks", "nlp", "llm", "generative ai", "mlops", "deep learning"]
  };

  const activeKeywords = domainKeywords[focusDomain] || [];
  activeKeywords.forEach(keyword => {
    const idx = ALL_TAGS.indexOf(keyword);
    if (idx !== -1) {
      userVec[idx] = 0.8; // Baseline weight for user domain
    }
  });

  // Adaptive feedback loop: boost weights of topics corresponding to weak performance areas
  weakAreas.forEach(area => {
    const topicText = area.topic.toLowerCase();
    const severityBoost = (100 - area.score) / 100; // Lower score yields higher priority boost
    
    ALL_TAGS.forEach((tag, idx) => {
      if (topicText.includes(tag)) {
        userVec[idx] = Math.min(userVec[idx] + severityBoost, 2.0);
      }
    });
  });

  return userVec;
}

// Compute Cosine Similarity between User profile vector and resource feature vector
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Map difficulty similarity multiplier
function getDifficultyMultiplier(
  itemDifficulty: string,
  userProficiency: string
): number {
  const diffs = ["Beginner", "Intermediate", "Advanced"];
  const userIdx = diffs.indexOf(userProficiency);
  const itemIdx = diffs.indexOf(itemDifficulty);
  if (userIdx === -1 || itemIdx === -1) return 1.0;
  
  const distance = Math.abs(userIdx - itemIdx);
  if (distance === 0) return 1.0; // Perfect level match
  if (distance === 1) return 0.5; // Neighboring level
  return 0.1; // Remote level
}

export const generateRecommendations = async (
  userId: string,
  answers: SurveyAnswers
): Promise<RecommendationOutput> => {
  try {
    // 1. Fetch weak areas for adaptive boosts
    const { data: weakAreasData } = await supabase
      .from("weak_areas")
      .select("topic, score")
      .eq("focus_domain", answers.focusDomain);

    const weakAreas = weakAreasData || [];
    const userVec = getUserVector(answers.focusDomain as any, weakAreas);

    // 2. Score and rank courses (Content-Based Filtering via Cosine Similarity)
    const courseCandidates: RecommendedCourse[] = [];
    Object.keys(courseRecommendations).forEach(domain => {
      Object.keys(courseRecommendations[domain]).forEach(level => {
        courseRecommendations[domain][level].forEach(c => {
          courseCandidates.push({ ...c });
        });
      });
    });

    const scoredCourses = courseCandidates.map(course => {
      const courseVec = getFeaturesVector(course.title, course.subject);
      const cosSim = cosineSimilarity(userVec, courseVec);
      const diffMult = getDifficultyMultiplier(course.difficulty, answers.proficiency);
      
      const isDomainMatch = course.difficulty === answers.proficiency && courseRecommendations[answers.focusDomain]?.[answers.proficiency]?.some(c => c.title === course.title);
      const domainBoost = isDomainMatch ? 0.3 : 0.0;

      return {
        course,
        score: cosSim * diffMult + domainBoost
      };
    });

    scoredCourses.sort((a, b) => b.score - a.score);
    const courses = scoredCourses.slice(0, 3).map(x => x.course);

    // 3. Score and rank milestones
    const milestoneCandidates: CareerMilestone[] = [];
    Object.keys(careerMilestones).forEach(domain => {
      Object.keys(careerMilestones[domain]).forEach(level => {
        careerMilestones[domain][level].forEach(m => {
          milestoneCandidates.push({ ...m });
        });
      });
    });

    const scoredMilestones = milestoneCandidates.map(mile => {
      const mileVec = getFeaturesVector(mile.title, mile.description);
      const cosSim = cosineSimilarity(userVec, mileVec);
      
      const isDomainMatch = careerMilestones[answers.focusDomain]?.[answers.proficiency]?.some(m => m.title === mile.title);
      const domainBoost = isDomainMatch ? 0.3 : 0.0;

      return {
        mile,
        score: cosSim + domainBoost
      };
    });

    scoredMilestones.sort((a, b) => b.score - a.score);
    const milestones = scoredMilestones.slice(0, 3).map(x => x.mile);

    // 4. Fetch dynamic external resources from YouTube/GitHub/Dev.to/Wikipedia
    const apiResources = await getRecommendedResources(
      answers.focusDomain,
      answers.proficiency
    );

    // Score and rank the fetched API resources so they precisely match user keywords/weak areas!
    const scoredResources = apiResources.map(r => {
      const rVec = getFeaturesVector(r.title, r.source, r.description || "");
      const cosSim = cosineSimilarity(userVec, rVec);
      
      return {
        resource: {
          title: r.title,
          type: r.source,
          duration: r.duration || "Variable"
        },
        score: cosSim
      };
    });

    scoredResources.sort((a, b) => b.score - a.score);
    const resources: RecommendedResource[] = scoredResources.slice(0, 3).map(x => x.resource);

    // 5. Build final targets
    const weeklyHoursTarget = Math.max(5, answers.learningHours * 2);

    const nextAssessment = new Date();
    nextAssessment.setDate(nextAssessment.getDate() + 7);

    const recommendation: RecommendationOutput = {
      courses,
      resources,
      milestones,
      weeklyHoursTarget,
      nextAssessment: nextAssessment.toISOString(),
    };

    // Save recommendations in Database
    const { error: insertError } = await supabase
      .from("recommendations")
      .insert({
        userId,
        focusDomain: answers.focusDomain,
        proficiency: answers.proficiency,
        courses: JSON.stringify(courses),
        resources: JSON.stringify(resources),
        milestones: JSON.stringify(milestones),
        weeklyHoursTarget,
        nextAssessment: nextAssessment.toISOString(),
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return recommendation;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw new AppError(
      "Error generating recommendations",
      errorCodes.DATABASE_ERROR.code,
      errorCodes.DATABASE_ERROR.statusCode
    );
  }
};

export const getLatestRecommendations = async (
  userId: string
): Promise<RecommendationOutput | null> => {
  try {
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching recommendations from Supabase:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const recommendation = data[0];

    return {
      courses: typeof recommendation.courses === "string" ? JSON.parse(recommendation.courses) : recommendation.courses,
      resources: typeof recommendation.resources === "string" ? JSON.parse(recommendation.resources) : recommendation.resources,
      milestones: typeof recommendation.milestones === "string" ? JSON.parse(recommendation.milestones) : recommendation.milestones,
      weeklyHoursTarget: recommendation.weeklyHoursTarget,
      nextAssessment: new Date(recommendation.nextAssessment).toISOString(),
    };
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return null;
  }
};
