export interface CuratedResource {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: "Notes" | "PDF" | "Slides" | "Project";
  author: string;
  rating: number;
  downloads: number;
  trending: boolean;
  url?: string;
  video_url?: string;
  description?: string;
  tags?: string[];
  ai_match_percentage: number;
  is_ai_curated: boolean;
  fileName?: string;
  fileType?: string;
  fileContent?: string;
  userId?: string;
}

export const AI_WEB_REPOSITORIES: Omit<CuratedResource, "id" | "ai_match_percentage" | "is_ai_curated">[] = [
  // Frontend Web Development
  {
    title: "MDN Web Docs: Modern CSS Grid & Responsive Layouts",
    subject: "Frontend",
    level: "Beginner",
    type: "Notes",
    author: "Mozilla Developer Network",
    rating: 4.95,
    downloads: 4820,
    trending: true,
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
    video_url: "https://www.youtube.com/embed/Dp3c7G1Qhgo",
    description: "Comprehensive specification and interactive playground for CSS Grid, Subgrid, and dynamic responsive viewports.",
    tags: ["css", "grid", "frontend", "responsive", "web", "layout"],
  },
  {
    title: "React 19 Official Architecture & Server Components Manual",
    subject: "Frontend",
    level: "Intermediate",
    type: "PDF",
    author: "React Core Team",
    rating: 4.92,
    downloads: 6120,
    trending: true,
    url: "https://react.dev/reference/rsc/server-components",
    video_url: "https://www.youtube.com/embed/59IXY5IDYbA",
    description: "In-depth architecture breakdown of React 19 Actions, useActionState, Server Functions, and optimistic state updates.",
    tags: ["react", "react19", "rsc", "frontend", "javascript", "web"],
  },
  {
    title: "TypeScript 5.x Handbook: Deep-Dive Type Gymnastics & Generics",
    subject: "Frontend",
    level: "Advanced",
    type: "Notes",
    author: "Microsoft TypeScript Team",
    rating: 4.88,
    downloads: 3940,
    trending: false,
    url: "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html",
    video_url: "https://www.youtube.com/embed/zQnOB4tV3MC",
    description: "Advanced conditional types, template literal types, mapped types, and distributed infer statements.",
    tags: ["typescript", "javascript", "frontend", "typing", "advanced"],
  },
  {
    title: "Interactive UI Patterns: 60fps Micro-Interactions & CSS Animations",
    subject: "Frontend",
    level: "Intermediate",
    type: "Slides",
    author: "Web Standards Collective",
    rating: 4.85,
    downloads: 2740,
    trending: true,
    url: "https://web.dev/articles/animations-guide",
    video_url: "https://www.youtube.com/embed/m7OWXtbiXX8",
    description: "Slide deck covering 60fps GPU-accelerated compositing, CSS transform matrices, and spring physics.",
    tags: ["css", "animations", "ui", "frontend", "design"],
  },

  // Mobile Development
  {
    title: "Expo Router 4 Architecture & Universal Deep Linking Guide",
    subject: "Mobile",
    level: "Intermediate",
    type: "PDF",
    author: "Expo Open Source",
    rating: 4.96,
    downloads: 5890,
    trending: true,
    url: "https://docs.expo.dev/router/introduction/",
    video_url: "https://www.youtube.com/embed/gvkqT_qiVxM",
    description: "File-based native routing for iOS, Android, and Web with dynamic segment matching and nested stack navigators.",
    tags: ["expo", "react-native", "mobile", "ios", "android", "navigation"],
  },
  {
    title: "React Native Performance Profiling & Hermes Engine Internals",
    subject: "Mobile",
    level: "Advanced",
    type: "Notes",
    author: "Meta Open Source",
    rating: 4.91,
    downloads: 3210,
    trending: false,
    url: "https://reactnative.dev/docs/profile-hermes",
    video_url: "https://www.youtube.com/embed/Ke90Tje7VS0",
    description: "Memory leaks mitigation, bytecode pre-compilation, JSI bridges, and TurboModules optimization cheatsheet.",
    tags: ["react-native", "hermes", "performance", "mobile", "optimization"],
  },
  {
    title: "SwiftUI Declarative UI & Observation Framework Architecture",
    subject: "Mobile",
    level: "Beginner",
    type: "Slides",
    author: "Apple Developer Academy",
    rating: 4.89,
    downloads: 3410,
    trending: true,
    url: "https://developer.apple.com/documentation/swiftui",
    video_url: "https://www.youtube.com/embed/F2CznepmCg4",
    description: "Modern iOS app development using Swift 6, @Observable macros, dynamic views, and async concurrency.",
    tags: ["swift", "swiftui", "ios", "mobile", "apple"],
  },
  {
    title: "Jetpack Compose & Kotlin Coroutines StateFlow Cheatsheet",
    subject: "Mobile",
    level: "Intermediate",
    type: "Notes",
    author: "Google Android Devs",
    rating: 4.87,
    downloads: 4120,
    trending: false,
    url: "https://developer.android.com/jetpack/compose",
    video_url: "https://www.youtube.com/embed/Ch5QqJmOzCQ",
    description: "Declarative layouts, recomposition optimization, StateFlow observation, and Material 3 design systems.",
    tags: ["android", "kotlin", "compose", "mobile", "coroutines"],
  },

  // Backend Engineering
  {
    title: "FastAPI & Pydantic v2 Asynchronous Microservice Blueprint",
    subject: "Backend",
    level: "Beginner",
    type: "Notes",
    author: "Tiangolo / FastAPI Community",
    rating: 4.97,
    downloads: 7890,
    trending: true,
    url: "https://fastapi.tiangolo.com/tutorial/",
    video_url: "https://www.youtube.com/embed/Oe421EPjeBE",
    description: "Production asynchronous RESTful APIs, dependency injection, OpenAPI documentation, and high-throughput workers.",
    tags: ["python", "fastapi", "backend", "api", "async"],
  },
  {
    title: "PostgreSQL Indexing & High-Volume Query Optimization Guide",
    subject: "Backend",
    level: "Advanced",
    type: "PDF",
    author: "PostgreSQL Global Development Group",
    rating: 4.94,
    downloads: 5210,
    trending: true,
    url: "https://www.postgresql.org/docs/current/indexes.html",
    video_url: "https://www.youtube.com/embed/7VfZYMXZmeI",
    description: "B-Tree, GIN, BRIN indexes, EXPLAIN ANALYZE execution plan breakdown, and connection pooling tuning.",
    tags: ["sql", "postgresql", "backend", "database", "performance"],
  },
  {
    title: "Docker, Kubernetes & Distributed Microservices Masterclass",
    subject: "Backend",
    level: "Intermediate",
    type: "Slides",
    author: "Cloud Native Computing Foundation (CNCF)",
    rating: 4.90,
    downloads: 4650,
    trending: true,
    url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    video_url: "https://www.youtube.com/embed/Oe421EPjeBE",
    description: "Container orchestration, Helm charts, ingress controllers, horizontal pod autoscaling, and service meshes.",
    tags: ["docker", "kubernetes", "backend", "devops", "cloud"],
  },

  // AI & Machine Learning
  {
    title: "PyTorch 2.x Tensor Deep-Dive & Autograd Engine Mechanics",
    subject: "AI",
    level: "Intermediate",
    type: "Notes",
    author: "PyTorch Foundation",
    rating: 4.98,
    downloads: 8940,
    trending: true,
    url: "https://pytorch.org/tutorials/beginner/basics/intro.html",
    video_url: "https://www.youtube.com/embed/V_xro1bcAuA",
    description: "Computational graph compilation with torch.compile, dynamic backward pass, GPU memory coalescing, and CUDA optimizations.",
    tags: ["pytorch", "ai", "machine-learning", "deep-learning", "python"],
  },
  {
    title: "Hugging Face Transformers: Fine-Tuning LLMs with LoRA/QLoRA",
    subject: "AI",
    level: "Advanced",
    type: "PDF",
    author: "Hugging Face Research",
    rating: 4.95,
    downloads: 7230,
    trending: true,
    url: "https://huggingface.co/docs/transformers/index",
    video_url: "https://www.youtube.com/embed/_uQrJ0TkZlc",
    description: "Parameter-efficient fine-tuning (PEFT), 4-bit quantization, FlashAttention-2, and instruction tuning dataset curation.",
    tags: ["llm", "ai", "transformers", "huggingface", "peft", "lora"],
  },
  {
    title: "Pandas 2.0 & Polars High-Performance Data Engineering Handbook",
    subject: "AI",
    level: "Beginner",
    type: "Notes",
    author: "NumFOCUS Data Collective",
    rating: 4.88,
    downloads: 4350,
    trending: false,
    url: "https://pandas.pydata.org/docs/user_guide/index.html",
    video_url: "https://www.youtube.com/embed/F6kmIpWWEdU",
    description: "Apache Arrow backend integration, vectorization, out-of-core streaming, and exploratory feature engineering.",
    tags: ["pandas", "python", "data-science", "ai", "data"],
  },
];

/**
 * AI Web Resource Curation Engine.
 * Filters, ranks, and matches open-access educational web materials dynamically.
 */
export function discoverAIWebResources(options: {
  domain?: string;
  level?: string;
  resourceType?: string;
  query?: string;
  sortBy?: "Trending" | "Top rated" | "Most downloaded";
}): CuratedResource[] {
  const { domain = "All", level = "All levels", resourceType = "All types", query = "", sortBy = "Trending" } = options;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const matched: CuratedResource[] = [];

  for (const item of AI_WEB_REPOSITORIES) {
    if (domain !== "All" && item.subject.toLowerCase() !== domain.toLowerCase()) {
      continue;
    }
    if (level !== "All levels" && item.level.toLowerCase() !== level.toLowerCase()) {
      continue;
    }
    if (resourceType !== "All types" && item.type.toLowerCase() !== resourceType.toLowerCase()) {
      continue;
    }

    let matchFactor = 1.0;
    if (tokens.length > 0) {
      const corpus = `${item.title} ${item.description || ""} ${(item.tags || []).join(" ")} ${item.author}`.toLowerCase();
      const hits = tokens.filter((t) => corpus.includes(t)).length;
      if (hits === 0) continue;
      matchFactor = (hits / tokens.length) * 1.5;
    }

    const baseScore = (item.rating / 5.0) * 0.4 + (Math.min(item.downloads, 10000) / 10000.0) * 0.3 + (item.trending ? 0.3 : 0.1);
    const aiMatch = Math.min(99, Math.max(85, Math.round(baseScore * matchFactor * 100)));

    const id = `ai_web_${item.title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;

    matched.push({
      ...item,
      id,
      ai_match_percentage: aiMatch,
      is_ai_curated: true,
    });
  }

  if (sortBy === "Top rated") {
    matched.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "Most downloaded") {
    matched.sort((a, b) => b.downloads - a.downloads);
  } else {
    matched.sort((a, b) => {
      if (a.trending === b.trending) {
        return b.ai_match_percentage - a.ai_match_percentage;
      }
      return a.trending ? -1 : 1;
    });
  }

  return matched;
}
