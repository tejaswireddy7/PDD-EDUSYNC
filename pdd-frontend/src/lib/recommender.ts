export interface RecommendedCourse {
  title: string;
  subject: string;
  progress: number;
  time: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  ai: boolean;
  colors: string[];
  url?: string;
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

// Full knowledge base of learning assets
const COURSE_DATABASE: Record<string, Record<string, RecommendedCourse[]>> = {
  Frontend: {
    Beginner: [
      { title: "HTML5, CSS3, & Modern Grid", subject: "Web Basics", progress: 0, time: "15 hrs", difficulty: "Beginner", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "JavaScript Fundamentals & DOM", subject: "JS Core", progress: 0, time: "22 hrs", difficulty: "Beginner", ai: false, colors: ["#f59e0b", "#fbbf24"] },
      { title: "Intro to React & Component States", subject: "React Framework", progress: 0, time: "18 hrs", difficulty: "Beginner", ai: true, colors: ["#0ea5e9", "#38bdf8"] }
    ],
    Intermediate: [
      { title: "React Router & Global Context", subject: "React Architecture", progress: 0, time: "14 hrs", difficulty: "Intermediate", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "Tailwind CSS & Responsive Layouts", subject: "Styling Systems", progress: 0, time: "8 hrs", difficulty: "Intermediate", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "TypeScript Essentials for Web", subject: "Typed Systems", progress: 0, time: "16 hrs", difficulty: "Intermediate", ai: true, colors: ["#2563eb", "#60a5fa"] }
    ],
    Advanced: [
      { title: "Next.js 14 App Router Mastery", subject: "Production Frameworks", progress: 0, time: "25 hrs", difficulty: "Advanced", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "Web Performance & Core Web Vitals", subject: "Performance", progress: 0, time: "12 hrs", difficulty: "Advanced", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "Module Federation & Micro-Frontends", subject: "Web Architecture", progress: 0, time: "30 hrs", difficulty: "Advanced", ai: true, colors: ["#2563eb", "#60a5fa"] }
    ]
  },
  Backend: {
    Beginner: [
      { title: "Intro to Node.js & REST API", subject: "JS Server", progress: 0, time: "14 hrs", difficulty: "Beginner", ai: true, colors: ["#16a34a", "#4ade80"] },
      { title: "SQL Fundamentals & Relational DBs", subject: "Databases", progress: 0, time: "18 hrs", difficulty: "Beginner", ai: false, colors: ["#0f172a", "#334155"] },
      { title: "Basics of Routing & HTTP Methods", subject: "Networking", progress: 0, time: "10 hrs", difficulty: "Beginner", ai: true, colors: ["#db2777", "#f472b6"] }
    ],
    Intermediate: [
      { title: "Java Spring Boot Microservices", subject: "Enterprise Java", progress: 0, time: "35 hrs", difficulty: "Intermediate", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "PostgreSQL Queries & Optimization", subject: "Databases", progress: 0, time: "15 hrs", difficulty: "Intermediate", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "Redis Caching & Task Queues", subject: "Performance", progress: 0, time: "12 hrs", difficulty: "Intermediate", ai: true, colors: ["#2563eb", "#60a5fa"] }
    ],
    Advanced: [
      { title: "Distributed Systems & Scalability", subject: "System Design", progress: 0, time: "40 hrs", difficulty: "Advanced", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "Docker & Kubernetes Orchestration", subject: "DevOps", progress: 0, time: "28 hrs", difficulty: "Advanced", ai: false, colors: ["#0ea5e9", "#38bdf8"] },
      { title: "Go Concurrency & Channels Deep-Dive", subject: "Backend Go", progress: 0, time: "24 hrs", difficulty: "Advanced", ai: true, colors: ["#0d9488", "#2dd4bf"] }
    ]
  },
  Mobile: {
    Beginner: [
      { title: "React Native & Expo Ecosystem", subject: "Cross-Platform", progress: 0, time: "18 hrs", difficulty: "Beginner", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "Flexbox Layouts in Mobile Screens", subject: "UI Design", progress: 0, time: "8 hrs", difficulty: "Beginner", ai: false, colors: ["#ec4899", "#f472b6"] },
      { title: "Navigation Containers & Tabs", subject: "App Flow", progress: 0, time: "12 hrs", difficulty: "Beginner", ai: true, colors: ["#2563eb", "#60a5fa"] }
    ],
    Intermediate: [
      { title: "Advanced React Navigation v6", subject: "App Flow", progress: 0, time: "16 hrs", difficulty: "Intermediate", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "Native Features: Camera, GPS & Audio", subject: "Hardware APIs", progress: 0, time: "22 hrs", difficulty: "Intermediate", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "State Management in Native Apps", subject: "Data Flow", progress: 0, time: "14 hrs", difficulty: "Intermediate", ai: true, colors: ["#f59e0b", "#fbbf24"] }
    ],
    Advanced: [
      { title: "SwiftUI Mastery for iOS Platforms", subject: "Native iOS", progress: 0, time: "30 hrs", difficulty: "Advanced", ai: true, colors: ["#f97316", "#fdba74"] },
      { title: "Kotlin & Android Jetpack UI", subject: "Native Android", progress: 0, time: "32 hrs", difficulty: "Advanced", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "Native Bridges & Performance Tuning", subject: "Advanced Core", progress: 0, time: "20 hrs", difficulty: "Advanced", ai: true, colors: ["#2563eb", "#60a5fa"] }
    ]
  },
  AI: {
    Beginner: [
      { title: "Python Fundamentals & Packages", subject: "Python Dev", progress: 0, time: "14 hrs", difficulty: "Beginner", ai: true, colors: ["#2563eb", "#60a5fa"] },
      { title: "Pandas & Numpy Data Wrangling", subject: "Data Prep", progress: 0, time: "16 hrs", difficulty: "Beginner", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "Basic Statistics & Probability", subject: "Math Foundations", progress: 0, time: "12 hrs", difficulty: "Beginner", ai: true, colors: ["#a855f7", "#c084fc"] }
    ],
    Intermediate: [
      { title: "Neural Networks with PyTorch", subject: "Deep Learning", progress: 0, time: "28 hrs", difficulty: "Intermediate", ai: true, colors: ["#6366f1", "#818cf8"] },
      { title: "Natural Language Processing (NLP)", subject: "AI Focus", progress: 0, time: "24 hrs", difficulty: "Intermediate", ai: false, colors: ["#db2777", "#f472b6"] },
      { title: "Data Visualization with Recharts", subject: "Data Presenting", progress: 0, time: "8 hrs", difficulty: "Intermediate", ai: true, colors: ["#0ea5e9", "#38bdf8"] }
    ],
    Advanced: [
      { title: "Fine-Tuning Generative AI Models", subject: "LLM Systems", progress: 0, time: "35 hrs", difficulty: "Advanced", ai: true, colors: ["#a855f7", "#c084fc"] },
      { title: "MLOps: CI/CD Pipeline for Models", subject: "AI DevOps", progress: 0, time: "26 hrs", difficulty: "Advanced", ai: false, colors: ["#0d9488", "#2dd4bf"] },
      { title: "Transformer Architectures & Attention", subject: "Neural Science", progress: 0, time: "40 hrs", difficulty: "Advanced", ai: true, colors: ["#2563eb", "#60a5fa"] }
    ]
  }
};

// Resource suggestions matching Focus Areas
const RESOURCE_DATABASE: Record<string, RecommendedResource[]> = {
  Frontend: [
    { title: "Interactive CSS Flexbox Playground", type: "Sandbox Tool", duration: "10 min" },
    { title: "Next.js Core Web Vitals Optimization Guides", type: "Technical Article", duration: "15 min" },
    { title: "Tailwind UI Layout Best Practices", type: "Video Tutorial", duration: "25 min" }
  ],
  Backend: [
    { title: "System Design Interview Cheat Sheet", type: "Cheat Sheet", duration: "8 min" },
    { title: "PostgreSQL Window Functions Explained", type: "Technical Article", duration: "12 min" },
    { title: "Docker Containerization Fundamentals", type: "Lab Exercise", duration: "30 min" }
  ],
  Mobile: [
    { title: "React Native Performance Debugging Tools", type: "Interactive Guide", duration: "18 min" },
    { title: "Expo Router Dynamic Linking Manual", type: "Documentation", duration: "10 min" },
    { title: "iOS Native UI Optimization Principles", type: "Video Tutorial", duration: "20 min" }
  ],
  AI: [
    { title: "Python OOP and Memory Structures", type: "interactive Tutorial", duration: "15 min" },
    { title: "Calculus behind SGD Backpropagation", type: "Video Lecture", duration: "35 min" },
    { title: "Hugging Face LLM Pipeline Integration Guides", type: "Lab Exercise", duration: "25 min" }
  ]
};

// Milestones matching career expectations
const MILESTONE_DATABASE: Record<string, CareerMilestone[]> = {
  Frontend: [
    { title: "UI/UX Master", description: "Design a fully responsive 3-column dashboard grid", status: "active" },
    { title: "Component Architect", description: "Refactor global state using TypeScript structures", status: "locked" },
    { title: "Federation Lead", description: "Launch micro-frontends with perfect Web Vitals", status: "locked" }
  ],
  Backend: [
    { title: "REST Designer", description: "Build full CRUD REST API endpoints with Express", status: "active" },
    { title: "Docker Deployer", description: "Deploy localized database containers and Redis caching", status: "locked" },
    { title: "Kubernetes Master", description: "Launch enterprise microservice clusters", status: "locked" }
  ],
  Mobile: [
    { title: "Expo Pioneer", description: "Boot an interactive Expo application in the emulator", status: "active" },
    { title: "Hardware Orchestrator", description: "Access live location maps and camera APIs", status: "locked" },
    { title: "Performance Engineer", description: "Deploy native Bridges and minimize bundle weight", status: "locked" }
  ],
  AI: [
    { title: "Data Analyst", description: "Filter, clean, and visualize 50k rows using Pandas", status: "active" },
    { title: "PyTorch Builder", description: "Train a custom MLP classifier on localized inputs", status: "locked" },
    { title: "MLOps Architect", description: "Deploy high-volume LLM API endpoints to public cloud", status: "locked" }
  ]
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

// Main ML-based adaptive recommendation engine using Content-Based Filtering & Cosine Similarity
export function getRecommendations(
  focusDomain: "Frontend" | "Backend" | "Mobile" | "AI" = "Mobile",
  proficiency: "Beginner" | "Intermediate" | "Advanced" = "Beginner",
  learningHours: number = 5,
  weakAreas: Array<{ topic: string; score: number }> = []
): RecommendationOutput {
  const userVec = getUserVector(focusDomain, weakAreas);

  // 1. Score & Rank Courses
  const courseCandidates: RecommendedCourse[] = [];
  Object.keys(COURSE_DATABASE).forEach(domain => {
    Object.keys(COURSE_DATABASE[domain]).forEach(level => {
      COURSE_DATABASE[domain][level].forEach(c => {
        courseCandidates.push({ ...c });
      });
    });
  });

  const scoredCourses = courseCandidates.map(course => {
    const courseVec = getFeaturesVector(course.title, course.subject);
    const cosSim = cosineSimilarity(userVec, courseVec);
    const diffMult = getDifficultyMultiplier(course.difficulty, proficiency);
    
    // Add baseline domain alignment boost
    const isDomainMatch = course.difficulty === proficiency && COURSE_DATABASE[focusDomain]?.[proficiency]?.some(c => c.title === course.title);
    const domainBoost = isDomainMatch ? 0.3 : 0.0;

    return {
      course,
      score: cosSim * diffMult + domainBoost
    };
  });

  scoredCourses.sort((a, b) => b.score - a.score);
  const courses = scoredCourses.slice(0, 3).map(x => x.course);

  // 2. Score & Rank Resources
  const resourceCandidates: RecommendedResource[] = [];
  Object.keys(RESOURCE_DATABASE).forEach(domain => {
    RESOURCE_DATABASE[domain].forEach(r => {
      resourceCandidates.push({ ...r });
    });
  });

  const scoredResources = resourceCandidates.map(res => {
    const resVec = getFeaturesVector(res.title, res.type);
    const cosSim = cosineSimilarity(userVec, resVec);
    
    const isDomainMatch = RESOURCE_DATABASE[focusDomain]?.some(r => r.title === res.title);
    const domainBoost = isDomainMatch ? 0.3 : 0.0;

    return {
      res,
      score: cosSim + domainBoost
    };
  });

  scoredResources.sort((a, b) => b.score - a.score);
  const resources = scoredResources.slice(0, 3).map(x => x.res);

  // 3. Score & Rank Milestones
  const milestoneCandidates: CareerMilestone[] = [];
  Object.keys(MILESTONE_DATABASE).forEach(domain => {
    MILESTONE_DATABASE[domain].forEach(m => {
      milestoneCandidates.push({ ...m });
    });
  });

  const scoredMilestones = milestoneCandidates.map(mile => {
    const mileVec = getFeaturesVector(mile.title, mile.description);
    const cosSim = cosineSimilarity(userVec, mileVec);
    
    const isDomainMatch = MILESTONE_DATABASE[focusDomain]?.some(m => m.title === mile.title);
    const domainBoost = isDomainMatch ? 0.3 : 0.0;

    return {
      mile,
      score: cosSim + domainBoost
    };
  });

  scoredMilestones.sort((a, b) => b.score - a.score);
  const milestones = scoredMilestones.slice(0, 3).map(x => x.mile);

  const weeklyHoursTarget = learningHours || 5;
  const nextAssessment =
    focusDomain === "Frontend" ? "React State & Styling Quiz"
      : focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
        : focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
          : "PyTorch Data Loading & Gradient descent";

  return {
    courses,
    resources,
    milestones,
    weeklyHoursTarget,
    nextAssessment
  };
}

export interface SurveyAnswers {
  focusDomain: "Frontend" | "Backend" | "Mobile" | "AI";
  proficiency: "Beginner" | "Intermediate" | "Advanced";
  learningHours: number;
}

export interface UserProfile {
  name: string;
  email: string;
  registeredAt: number;
  streak?: number;
  coursesCompleted?: number;
  careerFitScore?: number;
  xp?: number;
}
