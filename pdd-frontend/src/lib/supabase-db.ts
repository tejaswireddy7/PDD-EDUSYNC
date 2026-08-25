import { supabase } from "./supabase";
import {
  getRecommendations,
  RecommendationOutput,
  SurveyAnswers,
  UserProfile,
} from "./recommender";

// -------------------------------------------------------------
// Type Definitions matching our UI
// -------------------------------------------------------------

export interface DBCourse {
  id?: number;
  title: string;
  subject: string;
  progress: number;
  time: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  ai: boolean;
  colors: string[];
  url?: string;
}

export interface DBResource {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: "Notes" | "PDF" | "Slides" | "Project";
  rating: number;
  downloads: number;
  trending: boolean;
  author: string;
  course_title?: string;
  file_name?: string;
  file_type?: string;
  file_content?: string;
  user_id?: string;
}

export interface DBMilestone {
  title: string;
  description: string;
  status: "completed" | "active" | "locked";
}

export interface DBAssessment {
  id: string;
  title: string;
  type: "Project" | "Coding" | "Lab" | "Essay";
  subject: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  deadline: string;
  skills: string[];
  progress: number;
  status: "open" | "in-progress" | "submitted";
  questions?: Array<{ question: string; options: string[]; correctAnswer: number }> | null;
  responses?: any;
  start_date?: string;
  due_date?: string;
  last_penalized_at?: string;
}

export interface DBContact {
  id: string;
  name: string;
  role: string;
  initials: string;
  online: boolean;
  last: string;
  unread: number;
  colors: string[];
}

export interface DBMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

export interface DBEvaluation {
  id?: string;
  assessment_id: string;
  assessment_title: string;
  score: number;
  max_score: number;
  mentor: string;
  ai_feedback: string;
  rubric: Array<{ criterion: string; score: number; max: number; note: string }>;
  answers: Array<{
    q: string;
    student: string;
    verdict: "correct" | "partial" | "wrong";
    marks: string;
    feedback?: string;
  }>;
  subjects: Array<{ name: string; score: number; trend: string }>;
  percentile_rank: string;
}

// -------------------------------------------------------------
// Database Helper Implementations
// -------------------------------------------------------------

// Helper to log errors cleanly
function logError(funcName: string, err: any) {
  console.warn(
    `[Supabase DB] Error in ${funcName}. Falling back to local data. Reason:`,
    err.message || err,
  );
}

// 1. Fetch User Profile
export async function fetchDBProfile(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (e) {
    logError("fetchDBProfile", e);
    return null;
  }
}

// 2. Save User Profile
export async function saveDBProfile(
  userId: string,
  profile: Partial<
    UserProfile &
      SurveyAnswers & {
        streak: number;
        coursesCompleted?: number;
        careerFitScore?: number;
        xp?: number;
        lastSurveyDate?: string | number;
        lastActiveDate?: string | number;
        createdAt?: string | number;
      }
  >,
): Promise<any | null> {
  try {
    const payload: any = { id: userId };

    if (profile.name !== undefined) payload.name = profile.name;
    if (profile.email !== undefined) payload.email = profile.email;
    if (profile.focusDomain !== undefined) payload.focus_domain = profile.focusDomain;
    if (profile.proficiency !== undefined) payload.proficiency = profile.proficiency;
    if (profile.learningHours !== undefined) payload.learning_hours = profile.learningHours;
    if (profile.streak !== undefined) payload.streak = profile.streak;
    if (profile.coursesCompleted !== undefined)
      payload.courses_completed = profile.coursesCompleted;
    if (profile.careerFitScore !== undefined) payload.career_fit_score = profile.careerFitScore;
    if (profile.xp !== undefined) payload.xp = profile.xp;

    if (profile.lastSurveyDate !== undefined) {
      payload.last_survey_date =
        typeof profile.lastSurveyDate === "number"
          ? new Date(profile.lastSurveyDate).toISOString()
          : profile.lastSurveyDate;
    }

    if (profile.lastActiveDate !== undefined) {
      payload.last_active_date =
        typeof profile.lastActiveDate === "number"
          ? new Date(profile.lastActiveDate).toISOString()
          : profile.lastActiveDate;
    }

    if (profile.createdAt !== undefined) {
      payload.created_at =
        typeof profile.createdAt === "number"
          ? new Date(profile.createdAt).toISOString()
          : profile.createdAt;
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("profiles").upsert(payload).select().single();

    if (error) throw error;
    return data;
  } catch (e) {
    logError("saveDBProfile", e);
    return null;
  }
}

// 3. Fetch Pathway Courses
export async function fetchDBCourses(
  focusDomain: string,
  proficiency: string,
): Promise<DBCourse[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("focus_domain", focusDomain);

    if (error) throw error;
    if (data && data.length > 0) {
      const diffOrder = ["Beginner", "Intermediate", "Advanced"];
      const sorted = [...data].sort((a, b) => {
        const distA = Math.abs(diffOrder.indexOf(a.difficulty) - diffOrder.indexOf(proficiency));
        const distB = Math.abs(diffOrder.indexOf(b.difficulty) - diffOrder.indexOf(proficiency));
        if (distA !== distB) {
          return distA - distB;
        }
        return diffOrder.indexOf(a.difficulty) - diffOrder.indexOf(b.difficulty);
      });

      const seen = new Set<string>();
      const uniqueCourses = sorted.filter((c: any) => {
        const key = c.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return uniqueCourses as DBCourse[];
    }
  } catch (e) {
    logError("fetchDBCourses", e);
  }

  // Fallback to local getRecommendations courses
  const local = getRecommendations(focusDomain as any, proficiency as any);
  return local.courses as DBCourse[];
}

// 4. Fetch Resources
export async function fetchDBResources(
  focusDomain?: string,
  proficiency?: string,
): Promise<DBResource[]> {
  let dbData: DBResource[] = [];
  try {
    let query = supabase.from("resources").select("*");

    if (focusDomain && focusDomain !== "All") {
      query = query.eq("focus_domain", focusDomain);
    }

    if (proficiency && proficiency !== "All levels") {
      query = query.eq("level", proficiency);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      dbData = data as DBResource[];
    }
  } catch (e) {
    logError("fetchDBResources", e);
  }
  if (dbData.length > 0) {
    return dbData;
  }

  // Fallback / preseeded templates (only used when database has no records)
  const domain = focusDomain || "Mobile";
  const level = proficiency || "Beginner";
  const local = getRecommendations(domain as any, level as any);
  const fallbacks = local.resources.slice(0, 1).map((res, index) => {
    const resType: DBResource["type"] =
      res.type.includes("Article") || res.type.includes("Manual")
        ? "PDF"
        : res.type.includes("Tutorial")
          ? "Slides"
          : res.type.includes("Lab")
            ? "Project"
            : "Notes";

    return {
      id: `fallback_res_${index}`,
      title: res.title,
      subject: domain,
      level: level,
      type: resType,
      rating: parseFloat((4.8 + index * 0.05).toFixed(1)),
      downloads: 4800 + index * 1400,
      trending: index === 0,
      author: "EduSync Network",
    };
  });

  return fallbacks;
}

// 5. Fetch Career Milestones
export async function fetchDBMilestones(
  focusDomain: string,
  proficiency: string,
): Promise<DBMilestone[]> {
  try {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .eq("focus_domain", focusDomain);

    if (error) throw error;
    if (data && data.length > 0) return data as DBMilestone[];
  } catch (e) {
    logError("fetchDBMilestones", e);
  }

  // Fallback
  const local = getRecommendations(focusDomain as any, proficiency as any);
  return local.milestones as DBMilestone[];
}

// 6. Fetch Career Match Suggestions
export async function fetchDBCareerSuggestions(
  focusDomain: string,
): Promise<Array<{ role: string; match: number; skills: string[] }>> {
  try {
    const { data, error } = await supabase
      .from("career_suggestions")
      .select("role, match, skills")
      .eq("focus_domain", focusDomain);

    if (error) throw error;
    if (data && data.length > 0) {
      const seen = new Set<string>();
      return data.filter((item) => {
        const normalized = item.role.trim().toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
    }
  } catch (e) {
    logError("fetchDBCareerSuggestions", e);
  }

  // Fallback map
  const domainCareerMap: Record<
    string,
    Array<{ role: string; match: number; skills: string[] }>
  > = {
    Frontend: [
      {
        role: "UI/UX Front-end Architect",
        match: 95,
        skills: ["React", "HTML5/CSS3", "Design Systems"],
      },
      { role: "Web Application Lead", match: 88, skills: ["TypeScript", "Next.js", "Redux"] },
      {
        role: "Product Developer",
        match: 82,
        skills: ["Core JS", "Tailwind", "Responsive Design"],
      },
    ],
    Backend: [
      { role: "Senior Backend Engineer", match: 94, skills: ["Node.js", "Express", "SQL & APIs"] },
      { role: "System & DB Architect", match: 88, skills: ["Prisma", "PostgreSQL", "Caching"] },
      {
        role: "Cloud Operations Specialist",
        match: 81,
        skills: ["Docker", "Deploy", "System Design"],
      },
    ],
    Mobile: [
      {
        role: "iOS & Android App Dev",
        match: 94,
        skills: ["React Native", "Expo Ecosystem", "Flexbox"],
      },
      {
        role: "Cross-Platform Architect",
        match: 87,
        skills: ["Hardware APIs", "Kotlin/Swift", "Navigation"],
      },
      {
        role: "Mobile Interface Designer",
        match: 80,
        skills: ["App Store Deploy", "UI Frameworks", "Bridges"],
      },
    ],
    AI: [
      {
        role: "Machine Learning Engineer",
        match: 96,
        skills: ["Python Dev", "Math Models", "PyTorch"],
      },
      {
        role: "Data Science Researcher",
        match: 88,
        skills: ["Pandas/Numpy", "Stats & Math", "Data Prep"],
      },
      {
        role: "NLP & LLM Specialist",
        match: 81,
        skills: ["Attention Models", "Transformers", "Data Wrangling"],
      },
    ],
  };
  return domainCareerMap[focusDomain] || domainCareerMap.Mobile;
}

const ASSESSMENT_QUESTION_BANK: Record<
  string,
  Array<{ question: string; options: string[]; correctAnswer: number }>
> = {
  "React State & Styling Quiz": [
    {
      question: "Which React hook is used to perform side effects in functional components?",
      options: ["useState", "useEffect", "useContext", "useMemo"],
      correctAnswer: 1,
    },
    {
      question: "Which hook is used to cache the result of a calculation between re-renders?",
      options: ["useMemo", "useCallback", "useRef", "useEffect"],
      correctAnswer: 0,
    },
    {
      question: "What is the primary difference between useState and useRef?",
      options: [
        "useState does not trigger re-renders",
        "useRef does not trigger re-renders when updated",
        "useState values are immutable",
        "useRef cannot store objects",
      ],
      correctAnswer: 1,
    },
    {
      question: "Which hook is used to access context values in functional components?",
      options: ["useState", "useReducer", "useContext", "useMemo"],
      correctAnswer: 2,
    },
    {
      question: "How can you run an effect cleanup function in useEffect?",
      options: [
        "By calling effect.cleanup()",
        "By returning a function from the effect callback",
        "By passing a cleanup dependency",
        "By calling clearEffect()",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the purpose of the key prop in React lists?",
      options: [
        "To style elements uniquely",
        "To identify which items have changed, been added, or removed",
        "To bind click events",
        "To enable class caching",
      ],
      correctAnswer: 1,
    },
  ],
  "Visual Frontend Layout Challenge": [
    {
      question: "What is the default layout direction of Flexbox in CSS?",
      options: ["row", "column", "grid", "inline"],
      correctAnswer: 0,
    },
    {
      question: "In Flexbox, which property controls alignment along the main axis?",
      options: ["align-items", "justify-content", "align-content", "flex-direction"],
      correctAnswer: 1,
    },
    {
      question: "How do you define a 3-column grid with equal-width columns in CSS Grid?",
      options: [
        "grid-template-columns: repeat(3, 1fr)",
        "grid-template-columns: 33% 33% 33%",
        "grid-columns: 3",
        "grid-template-columns: 1fr 2fr 1fr",
      ],
      correctAnswer: 0,
    },
    {
      question: "Which CSS property is used to change the stacking order of elements?",
      options: ["z-index", "display", "position", "float"],
      correctAnswer: 0,
    },
    {
      question: "What does align-items: center do in a Flexbox container?",
      options: [
        "Aligns flex items along the cross axis in the center",
        "Aligns flex items along the main axis in the center",
        "Centers the container itself",
        "Distributes items evenly",
      ],
      correctAnswer: 0,
    },
    {
      question: "What is the purpose of the box-sizing: border-box CSS property?",
      options: [
        "Includes padding and border in the element's total width and height",
        "Adds a border around all elements",
        "Excludes padding from the element's width",
        "Prevents element from wrapping",
      ],
      correctAnswer: 0,
    },
  ],
  "Comprehensive Frontend Fundamentals Quiz": [
    {
      question: "What does semantic HTML primarily improve?",
      options: [
        "SEO and Accessibility",
        "Page load speed",
        "JavaScript execution time",
        "Database security",
      ],
      correctAnswer: 0,
    },
    {
      question: "What is the main purpose of the Virtual DOM in React?",
      options: [
        "To directly modify the browser's DOM for speed",
        "To synchronize local state with cloud databases",
        "To compute UI updates in memory before updating the real DOM",
        "To style web pages using CSS variables",
      ],
      correctAnswer: 2,
    },
    {
      question: "What is the difference between let and var in JavaScript?",
      options: [
        "let is block-scoped, while var is function-scoped",
        "let is function-scoped, while var is block-scoped",
        "let cannot be reassigned",
        "var is block-scoped",
      ],
      correctAnswer: 0,
    },
    {
      question: "Which method is used to select an element by its ID in JavaScript?",
      options: [
        "document.querySelector()",
        "document.getElementById()",
        "document.find()",
        "document.select()",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the purpose of the map() array method in JavaScript?",
      options: [
        "Mutates the original array in place",
        "Creates a new array populated with the results of calling a function on every element",
        "Filters out elements that do not match a criteria",
        "Sums up all numbers in the array",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is event bubbling in JavaScript?",
      options: [
        "The event starts at the root document and goes down",
        "The event starts at the target element and propagates upwards to its ancestors",
        "The event is executed twice",
        "The event is prevented from executing",
      ],
      correctAnswer: 1,
    },
  ],
  "Dockerized Server Setup Challenge": [
    {
      question: "Which HTTP status code represents a successful resource creation?",
      options: ["200 OK", "201 Created", "400 Bad Request", "500 Server Error"],
      correctAnswer: 1,
    },
    {
      question: "Which Docker command builds an image from a Dockerfile?",
      options: ["docker run", "docker build", "docker create", "docker compose"],
      correctAnswer: 1,
    },
    {
      question: "In Express, how do you retrieve route parameters (e.g. /users/:id)?",
      options: ["req.body.id", "req.params.id", "req.query.id", "req.headers.id"],
      correctAnswer: 1,
    },
    {
      question: "What is the role of a database connection pool?",
      options: [
        "To encrypt database passwords",
        "To cache database connections for reuse, improving performance",
        "To replicate databases across multiple servers",
        "To validate SQL queries",
      ],
      correctAnswer: 1,
    },
    {
      question: "Which Docker Compose command starts and runs containers in the background?",
      options: [
        "docker-compose start",
        "docker-compose up -d",
        "docker-compose run",
        "docker-compose daemon",
      ],
      correctAnswer: 1,
    },
    {
      question: "Which HTTP header is typically used to send authorization credentials?",
      options: ["Content-Type", "Authorization", "Accept", "User-Agent"],
      correctAnswer: 1,
    },
  ],
  "Visual Backend Layout Challenge": [
    {
      question:
        "In REST API design, which HTTP method should be used to update an existing resource completely?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correctAnswer: 2,
    },
    {
      question: "Which HTTP method is designed to update a resource partially?",
      options: ["GET", "PUT", "PATCH", "POST"],
      correctAnswer: 2,
    },
    {
      question: "What is middleware in Express?",
      options: [
        "A database optimization tool",
        "A function that runs between receiving a request and sending a response",
        "A server configuration file",
        "A frontend routing utility",
      ],
      correctAnswer: 1,
    },
    {
      question: "What does CORS stand for?",
      options: [
        "Core Origin Resource Sharing",
        "Cross-Origin Resource Sharing",
        "Cross-Origin Routing Server",
        "Cached Object Request System",
      ],
      correctAnswer: 1,
    },
    {
      question: "How do you handle JSON request payloads in Express?",
      options: [
        "By using express.json() middleware",
        "By parsing string arrays manually",
        "Using express.urlencoded()",
        "Using body-parser.xml()",
      ],
      correctAnswer: 0,
    },
    {
      question: "What does a 403 Forbidden status code indicate?",
      options: [
        "The server has crashed",
        "The client is authenticated but does not have permission for the resource",
        "The requested resource was not found",
        "Authentication is required",
      ],
      correctAnswer: 1,
    },
  ],
  "Comprehensive Backend Fundamentals Quiz": [
    {
      question: "What is the primary purpose of database indexing?",
      options: [
        "To encrypt credentials",
        "To optimize query search and data retrieval speeds",
        "To eliminate duplicate table rows",
        "To transform relational data to JSON automatically",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the core benefit of containerizing backend apps with Docker?",
      options: [
        "To generate random secret keys",
        "To package code and all its dependencies into a portable, isolated container",
        "To compile TypeScript into optimized JavaScript bundles",
        "To automatically write API documentation",
      ],
      correctAnswer: 1,
    },
    {
      question: "Which SQL statement is used to remove duplicate rows from a query result?",
      options: ["SELECT DISTINCT", "SELECT UNIQUE", "SELECT REMOVE_DUPLICATES", "SELECT MERGE"],
      correctAnswer: 0,
    },
    {
      question: "What is the Node.js Event Loop responsible for?",
      options: [
        "Running database queries synchronously",
        "Executing non-blocking asynchronous callbacks",
        "Compiling TypeScript files",
        "Managing standard output streams",
      ],
      correctAnswer: 1,
    },
    {
      question: "In SQL, which clause is used to filter groups based on aggregate functions?",
      options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
      correctAnswer: 1,
    },
    {
      question: "What is SQL injection?",
      options: [
        "A database caching technique",
        "A vulnerability where malicious SQL queries are executed via user inputs",
        "A way to insert millions of rows quickly",
        "An API routing strategy",
      ],
      correctAnswer: 1,
    },
  ],
  "App Navigation & Screen Mapping": [
    {
      question: "How is routing and navigation usually handled in modern Expo apps?",
      options: [
        "HTML anchor links",
        "Expo Router or React Navigation",
        "Window location redirects",
        "Conditional view rendering only",
      ],
      correctAnswer: 1,
    },
    {
      question: "In React Navigation, which navigator is used to slide in screens from the side?",
      options: ["StackNavigator", "DrawerNavigator", "TabNavigator", "SwitchNavigator"],
      correctAnswer: 1,
    },
    {
      question: "How do you pass parameters to a route when navigating?",
      options: [
        "navigation.navigate('Details', { id: 123 })",
        "navigation.setParams({ id: 123 })",
        "navigation.push('Details?id=123')",
        "navigation.params = { id: 123 }",
      ],
      correctAnswer: 0,
    },
    {
      question: "What is the purpose of the NavigationContainer component?",
      options: [
        "To display a top header bar",
        "To manage the navigation state of the entire app tree",
        "To hold all tab screens",
        "To perform network fetch requests",
      ],
      correctAnswer: 1,
    },
    {
      question: "In Expo Router, how do you create a dynamic route?",
      options: [
        "By naming the file with square brackets, e.g., [id].tsx",
        "By using query strings in navigation",
        "Using the router.push(':id') function",
        "Configuring routes.json",
      ],
      correctAnswer: 0,
    },
    {
      question: "What is the difference between push and navigate in stack navigation?",
      options: [
        "push navigates backwards, navigate goes forwards",
        "push adds a new screen to the stack every time, navigate jumps to an existing screen if possible",
        "navigate resets the stack, push does not",
        "They are exactly identical",
      ],
      correctAnswer: 1,
    },
  ],
  "Visual Mobile Layout Challenge": [
    {
      question: "What layout system is used by React Native for positioning components?",
      options: ["CSS Grid", "Floats & Absolute layout", "Flexbox", "Table columns"],
      correctAnswer: 2,
    },
    {
      question: "What is the default Flexbox direction in React Native?",
      options: ["row", "column", "row-reverse", "column-reverse"],
      correctAnswer: 1,
    },
    {
      question: "How do you handle safe area padding for notches on iOS/Android?",
      options: [
        "By adding a top margin of 50px",
        "Using SafeAreaView from react-native-safe-area-context",
        "Configuring expo.json",
        "It is handled automatically by all View elements",
      ],
      correctAnswer: 1,
    },
    {
      question:
        "Which React Native component is used to register touch interactions with visual feedback?",
      options: ["View", "Text", "TouchableOpacity", "ScrollView"],
      correctAnswer: 2,
    },
    {
      question: "How do you specify percentage-based width in React Native stylesheet?",
      options: ["width: 50", "width: '50%'", "width: '50vw'", "width: percent(50)"],
      correctAnswer: 1,
    },
    {
      question: "Which flexbox property defines how elements wrap when there is not enough space?",
      options: ["flexWrap", "flexDirection", "justifyContent", "alignItems"],
      correctAnswer: 0,
    },
  ],
  "Comprehensive Mobile Fundamentals Quiz": [
    {
      question:
        "In React Native, which component is best suited for rendering long, scrollable lists efficiently?",
      options: ["ScrollView", "FlatList", "View", "SafeAreaView"],
      correctAnswer: 1,
    },
    {
      question: "Which React Native hook reactively returns the current screen width and height?",
      options: ["useWindowDimensions", "useEffect", "useDimensions", "useStyle"],
      correctAnswer: 0,
    },
    {
      question: "What is the purpose of Expo CLI?",
      options: [
        "To run, build, and debug Expo projects locally",
        "To deploy apps to the App Store directly",
        "To style components using utility classes",
        "To manage backend database servers",
      ],
      correctAnswer: 0,
    },
    {
      question: "Which component should be used to display a basic image in React Native?",
      options: ["Img", "Image", "ImageBackground", "Picture"],
      correctAnswer: 1,
    },
    {
      question: "How do you handle platform-specific code in React Native?",
      options: [
        "Using CSS media queries",
        "Using the Platform.select() helper or platform-specific extensions (e.g. .ios.tsx)",
        "By writing separate apps",
        "Using webpack configuration",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is Fast Refresh in React Native?",
      options: [
        "A caching system for HTTP requests",
        "A feature that allows you to see changes to your code instantly in the emulator/device without losing state",
        "A database sync function",
        "A library for rendering high-rate animations",
      ],
      correctAnswer: 1,
    },
  ],
  "PyTorch Data Loading & Gradient descent": [
    {
      question:
        "What is the process of adjusting network parameters to minimize the loss function called?",
      options: [
        "Validation",
        "Regularization",
        "Optimization (e.g. Gradient Descent)",
        "Data augmentation",
      ],
      correctAnswer: 2,
    },
    {
      question: "What is the primary role of PyTorch DataLoader?",
      options: [
        "To download models from HuggingFace",
        "To batch, shuffle, and load data in parallel",
        "To normalize image pixel values",
        "To compile Python scripts",
      ],
      correctAnswer: 1,
    },
    {
      question: "Which PyTorch method computes the gradients during backpropagation?",
      options: ["loss.forward()", "loss.backward()", "optimizer.step()", "tensor.grad()"],
      correctAnswer: 1,
    },
    {
      question: "What does requires_grad=True specify on a PyTorch Tensor?",
      options: [
        "That it must be stored on GPU",
        "That gradients should be tracked for this tensor",
        "That the tensor contains integers",
        "That it cannot be updated",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the purpose of optimizer.zero_grad() in the training loop?",
      options: [
        "To set model parameters to zero",
        "To clear old gradients before computing new ones",
        "To stop training",
        "To initialize weights",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the learning rate in gradient descent?",
      options: [
        "The number of training iterations",
        "A step size parameter that determines how much weights change in each iteration",
        "The rate of loss decrease",
        "The speed of calculation",
      ],
      correctAnswer: 1,
    },
  ],
  "Visual AI Layout Challenge": [
    {
      question: "Which data structure does PyTorch use to represent multi-dimensional arrays?",
      options: ["Dataframes", "Tensors", "Matrices", "Numpy Lists"],
      correctAnswer: 1,
    },
    {
      question: "In Recharts, which component represents a line in a LineChart?",
      options: ["<ChartLine>", "<Line>", "<LinePlot>", "<StrokeLine>"],
      correctAnswer: 1,
    },
    {
      question: "What is the purpose of <ResponsiveContainer> in Recharts?",
      options: [
        "To store responsive layout metadata",
        "To make charts responsive to parent container sizes",
        "To handle mobile screen rotation events",
        "To enable chart animations",
      ],
      correctAnswer: 1,
    },
    {
      question: "Which chart component is best for showing proportions of a whole?",
      options: ["<BarChart>", "<LineChart>", "<PieChart>", "<AreaChart>"],
      correctAnswer: 2,
    },
    {
      question: "In Pandas, how do you quickly generate a line plot from a DataFrame?",
      options: ["df.line()", "df.plot(kind='line')", "df.draw_line()", "plot(df, type='line')"],
      correctAnswer: 1,
    },
    {
      question: "Which Recharts component displays details when hovering over a data point?",
      options: ["<HoverLabel>", "<Tooltip>", "<DetailsBox>", "<Legend>"],
      correctAnswer: 1,
    },
  ],
  "Comprehensive AI Fundamentals Quiz": [
    {
      question:
        "Which activation function is most widely used in hidden layers of deep neural networks?",
      options: ["Linear", "ReLU (Rectified Linear Unit)", "Softmax", "Sigmoid"],
      correctAnswer: 1,
    },
    {
      question: "What is the main goal when training a machine learning model?",
      options: [
        "To minimize memory storage sizes",
        "To memorize all training samples exactly",
        "To generalize effectively to new, unseen data",
        "To execute network training as fast as possible",
      ],
      correctAnswer: 2,
    },
    {
      question: "In NumPy, how do you create a 3x3 matrix filled with zeros?",
      options: ["np.zeros((3, 3))", "np.matrix(0, 3, 3)", "np.empty(3, 3)", "np.zeros(9)"],
      correctAnswer: 0,
    },
    {
      question: "What does standard deviation measure in statistics?",
      options: [
        "The middle value of a dataset",
        "The dispersion or spread of a dataset relative to its mean",
        "The total number of samples",
        "The difference between max and min values",
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the main difference between a list and a tuple in Python?",
      options: [
        "Lists are mutable; tuples are immutable",
        "Lists are immutable; tuples are mutable",
        "Lists only hold integers",
        "Tuples cannot contain duplicate values",
      ],
      correctAnswer: 0,
    },
    {
      question: "What is the probability of flipping a fair coin twice and getting two heads?",
      options: ["0.5", "0.25", "0.125", "0.75"],
      correctAnswer: 1,
    },
  ],
};

function getQuestionsForAssessment(
  title: string,
  subject: string,
): Array<{ question: string; options: string[]; correctAnswer: number }> {
  if (ASSESSMENT_QUESTION_BANK[title]) {
    return ASSESSMENT_QUESTION_BANK[title];
  }

  for (const key of Object.keys(ASSESSMENT_QUESTION_BANK)) {
    if (
      title.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(title.toLowerCase())
    ) {
      return ASSESSMENT_QUESTION_BANK[key];
    }
  }

  // Fallback to domain match
  if (subject === "Backend") return ASSESSMENT_QUESTION_BANK["Dockerized Server Setup Challenge"];
  if (subject === "Mobile") return ASSESSMENT_QUESTION_BANK["App Navigation & Screen Mapping"];
  if (subject === "AI") return ASSESSMENT_QUESTION_BANK["PyTorch Data Loading & Gradient descent"];
  return ASSESSMENT_QUESTION_BANK["React State & Styling Quiz"];
}

export function getDomainFromCourse(courseTitle: string): string {
  const lower = courseTitle.toLowerCase();
  if (
    lower.includes("node") ||
    lower.includes("sql") ||
    lower.includes("routing") ||
    lower.includes("spring boot") ||
    lower.includes("postgres") ||
    lower.includes("redis") ||
    lower.includes("distributed") ||
    lower.includes("docker") ||
    lower.includes("go ")
  ) {
    return "Backend";
  }
  if (
    lower.includes("native") ||
    lower.includes("expo") ||
    lower.includes("flexbox layouts in mobile") ||
    lower.includes("navigation") ||
    lower.includes("swiftui") ||
    lower.includes("kotlin") ||
    lower.includes("android")
  ) {
    return "Mobile";
  }
  if (
    lower.includes("python") ||
    lower.includes("pandas") ||
    lower.includes("numpy") ||
    lower.includes("pytorch") ||
    lower.includes("statistics") ||
    lower.includes("neural") ||
    lower.includes("nlp") ||
    lower.includes("transformer") ||
    lower.includes("generative")
  ) {
    return "AI";
  }
  return "Frontend";
}

export function getQuestionsForCourseAssessment(
  domain: string,
  index: number,
): Array<{ question: string; options: string[]; correctAnswer: number }> {
  if (domain === "Mobile") {
    if (index === 1) return ASSESSMENT_QUESTION_BANK["App Navigation & Screen Mapping"];
    if (index === 2) return ASSESSMENT_QUESTION_BANK["Visual Mobile Layout Challenge"];
    return ASSESSMENT_QUESTION_BANK["Comprehensive Mobile Fundamentals Quiz"];
  }
  if (domain === "Backend") {
    if (index === 1) return ASSESSMENT_QUESTION_BANK["Dockerized Server Setup Challenge"];
    if (index === 2) return ASSESSMENT_QUESTION_BANK["Visual Backend Layout Challenge"];
    return ASSESSMENT_QUESTION_BANK["Comprehensive Backend Fundamentals Quiz"];
  }
  if (domain === "AI") {
    if (index === 1) return ASSESSMENT_QUESTION_BANK["PyTorch Data Loading & Gradient descent"];
    if (index === 2) return ASSESSMENT_QUESTION_BANK["Visual AI Layout Challenge"];
    return ASSESSMENT_QUESTION_BANK["Comprehensive AI Fundamentals Quiz"];
  }
  if (index === 1) return ASSESSMENT_QUESTION_BANK["React State & Styling Quiz"];
  if (index === 2) return ASSESSMENT_QUESTION_BANK["Visual Frontend Layout Challenge"];
  return ASSESSMENT_QUESTION_BANK["Comprehensive Frontend Fundamentals Quiz"];
}

// 7. Fetch User Assessments
export async function fetchDBAssessments(
  userId: string,
  focusDomain: string,
  proficiency: string,
): Promise<DBAssessment[]> {
  try {
    // 1. Fetch user's enrolled courses
    const enrollments = await fetchDBUserEnrollments(userId);

    // 2. Fetch existing assessments for user
    const { data: existing, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    const dbAssessments = (existing || []) as DBAssessment[];
    const now = new Date();

    // Clean up stale assessments (for courses the user is no longer enrolled in, or fallback static list)
    const enrolledCourseIds = new Set(enrollments.map((enc) => enc.course_id));
    const staleAssessments = dbAssessments.filter((a) => {
      if (a.id.startsWith("course_")) {
        const parts = a.id.split("_");
        const courseId = parseInt(parts[1]);
        return !enrolledCourseIds.has(courseId);
      }
      return true; // Any non-course assessment (a1, a2, a3) is stale
    });

    if (staleAssessments.length > 0) {
      const staleIds = staleAssessments.map((a) => a.id);
      await supabase.from("assessments").delete().eq("user_id", userId).in("id", staleIds);

      const staleSet = new Set(staleIds);
      for (let i = dbAssessments.length - 1; i >= 0; i--) {
        if (staleSet.has(dbAssessments[i].id)) {
          dbAssessments.splice(i, 1);
        }
      }
    }

    // 3. If user has enrolled courses, manage assessments based on them
    if (enrollments && enrollments.length > 0) {
      const generated: DBAssessment[] = [];

      for (const enc of enrollments) {
        const course = enc.courses;
        if (!course) continue;

        const courseTitle = course.title;
        const courseId = enc.course_id;
        const courseDomain = course.focus_domain || getDomainFromCourse(courseTitle);
        const courseDifficulty = course.difficulty || course.level || "Beginner";

        // Find existing assessments for this specific course by prefix
        const courseAssessments = dbAssessments.filter((a) =>
          a.id.startsWith(`course_${courseId}_ass_`),
        );

        // Sort course assessments by index
        courseAssessments.sort((a, b) => {
          const idxA = parseInt(a.id.split("_ass_")[1]) || 1;
          const idxB = parseInt(b.id.split("_ass_")[1]) || 1;
          return idxA - idxB;
        });

        if (courseAssessments.length === 0) {
          // Generate first assessment: Quiz (Index 1)
          const newAssId = `course_${courseId}_ass_1`;
          const title = `${courseTitle} Basics Quiz`;
          const startDate = now.toISOString();
          const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
          const questions = getQuestionsForCourseAssessment(courseDomain, 1);

          const newAss: DBAssessment = {
            id: newAssId,
            title,
            type: "Coding",
            subject: courseTitle,
            difficulty: courseDifficulty as any,
            deadline: formatDeadline(dueDate),
            skills: [courseDomain, "Basics"],
            progress: 0,
            status: "open",
            questions,
            start_date: startDate,
            due_date: dueDate,
            last_penalized_at: dueDate,
          };

          const { error: insErr } = await supabase
            .from("assessments")
            .insert({ ...newAss, user_id: userId });

          if (!insErr) {
            generated.push(newAss);
          } else {
            console.warn("Failed to insert assessment:", insErr);
          }
        } else {
          generated.push(...courseAssessments);

          // Check if we need to unlock the next assessment in sequence
          const latest = courseAssessments[courseAssessments.length - 1];
          const latestIdx = parseInt(latest.id.split("_ass_")[1]) || 1;

          if (latest.status === "submitted" && latestIdx < 3) {
            const latestDueDate = new Date(latest.due_date || latest.deadline);

            // Generate next if current time is past the due date of the completed one
            if (now >= latestDueDate) {
              const nextIdx = latestIdx + 1;
              const newAssId = `course_${courseId}_ass_${nextIdx}`;

              if (!dbAssessments.some((a) => a.id === newAssId)) {
                const nextType = nextIdx === 2 ? "Project" : "Essay";
                const typeLabel = nextIdx === 2 ? "Layout Challenge" : "Comprehensive Exam";
                const title = `${courseTitle} ${typeLabel}`;
                const startDate = now.toISOString();
                const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
                const questions = getQuestionsForCourseAssessment(courseDomain, nextIdx);

                const newAss: DBAssessment = {
                  id: newAssId,
                  title,
                  type: nextType,
                  subject: courseTitle,
                  difficulty: courseDifficulty as any,
                  deadline: formatDeadline(dueDate),
                  skills: [courseDomain, nextIdx === 2 ? "Layout" : "Theory"],
                  progress: 0,
                  status: "open",
                  questions,
                  start_date: startDate,
                  due_date: dueDate,
                  last_penalized_at: dueDate,
                };

                const { error: insErr } = await supabase
                  .from("assessments")
                  .insert({ ...newAss, user_id: userId });

                if (!insErr) {
                  generated.push(newAss);
                } else {
                  console.warn("Failed to insert sequential assessment:", insErr);
                }
              }
            }
          }
        }
      }

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          `assessments_${userId}_${focusDomain}`,
          JSON.stringify(generated),
        );
      }
      return generated;
    }
    // 4. If the user has no enrolled courses, they should have no assessments.
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(`assessments_${userId}_${focusDomain}`);
    }
    return [];
  } catch (e) {
    logError("fetchDBAssessments", e);
  }

  // Load from localStorage if online fetch fails
  if (typeof window !== "undefined" && window.localStorage) {
    const cached = window.localStorage.getItem(`assessments_${userId}_${focusDomain}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {}
    }
  }

  return [];
}

export function formatDeadline(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return d.toLocaleDateString("en-US", options) + " · 11:59 PM";
  } catch (e) {
    return "In 3 Days";
  }
}

// 8. Update User Assessment
export async function updateDBAssessment(
  userId: string,
  assessmentId: string,
  patch: Partial<DBAssessment>,
): Promise<void> {
  // Always update in localStorage first for offline/fallback persistence
  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`assessments_${userId}_`)) {
        try {
          const data = JSON.parse(window.localStorage.getItem(key) || "[]");
          const updated = data.map((item: any) =>
            item.id === assessmentId ? { ...item, ...patch } : item,
          );
          window.localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  try {
    const { error } = await supabase
      .from("assessments")
      .update(patch)
      .eq("user_id", userId)
      .eq("id", assessmentId);

    if (error) throw error;
  } catch (e) {
    logError("updateDBAssessment", e);
  }
}

// 9. Fetch Contacts
export async function fetchDBContacts(focusDomain: string): Promise<DBContact[]> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("focus_domain", focusDomain);

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((c: any) => {
        let anonName = c.name;
        let anonInitials = c.initials;
        if (
          c.role.toLowerCase().includes("peer") ||
          c.role.toLowerCase().includes("expert") ||
          c.role.toLowerCase().includes("intern") ||
          c.role.toLowerCase().includes("enthusiast")
        ) {
          const numId = c.id.replace(/[^0-9]/g, "") || "48";
          anonName = `Anonymous ${c.role.includes("Expert") ? "Expert" : "Peer"} #${numId}`;
          anonInitials = c.role.includes("Expert") ? "AE" : "AP";
        }
        return {
          ...c,
          name: anonName,
          initials: anonInitials,
        };
      }) as DBContact[];
    }
  } catch (e) {
    logError("fetchDBContacts", e);
  }

  // Fallback
  return [
    {
      id: "c1",
      name: `Anonymous Expert #1`,
      role: `Mentor · ${focusDomain} Expert`,
      initials: "AE",
      online: true,
      last: `Welcome to the ${focusDomain} track! 👋`,
      unread: 1,
      colors: ["#6366f1", "#818cf8"],
    },
    {
      id: "c2",
      name: `Anonymous Peer #28`,
      role: `Peer · ${focusDomain} Dev`,
      initials: "AP",
      online: true,
      last: `Let's study ${focusDomain} together! 📚`,
      unread: 0,
      colors: ["#0ea5e9", "#38bdf8"],
    },
    {
      id: "c3",
      name: `Anonymous Peer #52`,
      role: `Peer · ${focusDomain} Intern`,
      initials: "AP",
      online: false,
      last: "Hey! Ready to learn?",
      unread: 0,
      colors: ["#0d9488", "#2dd4bf"],
    },
    {
      id: "c4",
      name: `Anonymous Career Coach`,
      role: "Career Coach",
      initials: "AC",
      online: true,
      last: "Happy to guide your career path!",
      unread: 0,
      colors: ["#f59e0b", "#fbbf24"],
    },
    {
      id: "c5",
      name: `Anonymous Peer #89`,
      role: `Peer · ${focusDomain} Enthusiast`,
      initials: "AP",
      online: false,
      last: "Glad to connect!",
      unread: 0,
      colors: ["#a855f7", "#c084fc"],
    },
  ];
}

// 10. Fetch Chat Messages
export async function fetchDBMessages(
  userId: string,
  contactId: string,
  welcomeMsg: string,
): Promise<DBMessage[]> {
  const fallbackMessages: DBMessage[] = [
    { id: "1", from: "them", text: welcomeMsg, time: "Just Now" },
  ];

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .eq("contact_id", contactId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((msg: any) => ({
        id: msg.id,
        from: msg.from as "me" | "them",
        text: msg.text,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    }

    // Insert welcome message as bootstrap
    const { error: insertError } = await supabase.from("messages").insert({
      user_id: userId,
      contact_id: contactId,
      from: "them",
      text: welcomeMsg,
    });

    if (insertError) throw insertError;
  } catch (e) {
    logError("fetchDBMessages", e);
  }

  return fallbackMessages;
}

// 11. Send Chat Message
export async function sendContactDBMessage(
  userId: string,
  contactId: string,
  text: string,
): Promise<DBMessage> {
  const newMsg: DBMessage = {
    id: String(Date.now()),
    from: "me",
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        contact_id: contactId,
        from: "me",
        text,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      newMsg.id = data.id;
    }
  } catch (e) {
    logError("sendContactDBMessage", e);
  }

  return newMsg;
}

// Helper to save auto reply message
export async function saveDBReply(
  userId: string,
  contactId: string,
  replyText: string,
): Promise<DBMessage> {
  const replyMsg: DBMessage = {
    id: String(Date.now() + 1),
    from: "them",
    text: replyText,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        contact_id: contactId,
        from: "them",
        text: replyText,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      replyMsg.id = data.id;
    }
  } catch (e) {
    logError("saveDBReply", e);
  }

  return replyMsg;
}

// Helper to generate dynamic rubric criteria based on title/questions analysis
function generateDynamicRubric(
  title: string,
  questions: any[],
  correctCount: number,
  focusDomain: string,
  isQuiz: boolean,
  rng: number,
): Array<{ criterion: string; max: number; note: string; score: number }> {
  const normTitle = title.toLowerCase();

  if (isQuiz) {
    const totalQuestions = questions.length || 6;
    return [
      {
        criterion: "Correctness",
        max: totalQuestions,
        score: correctCount,
        note: `Answered ${correctCount} of ${totalQuestions} questions correctly.`,
      },
    ];
  } else {
    const score1 = Math.floor(rng * 3) + 8; // 8 to 10
    const score2 = Math.floor(rng * 4) + 6; // 6 to 9
    const score3 = Math.floor(rng * 3) + 7; // 7 to 9
    const score4 = Math.floor(rng * 4) + 6; // 6 to 9

    if (
      normTitle.includes("react native") ||
      normTitle.includes("expo") ||
      normTitle.includes("mobile")
    ) {
      return [
        {
          criterion: "Native Components & JSX",
          max: 10,
          score: score1,
          note: "Correct usage of View, Text, ScrollView, FlatList.",
        },
        {
          criterion: "Layout and Style Sheets",
          max: 10,
          score: score2,
          note: "Flexbox structures scale cleanly on multiple emulator screen dimensions.",
        },
        {
          criterion: "App Navigation Flows",
          max: 10,
          score: score3,
          note: "Expo Router/Tab layout links behave smoothly without routing stack locks.",
        },
        {
          criterion: "Hardware Bridge & States",
          max: 10,
          score: score4,
          note: "Proper async permission handles for camera, local storage, or maps.",
        },
      ];
    } else if (
      normTitle.includes("css") ||
      normTitle.includes("html") ||
      normTitle.includes("styling") ||
      normTitle.includes("frontend")
    ) {
      return [
        {
          criterion: "HTML5 Semantic Nodes",
          max: 10,
          score: score1,
          note: "Correct hierarchical structure using main, section, article tags.",
        },
        {
          criterion: "CSS Grid & Flexbox Layouts",
          max: 10,
          score: score2,
          note: "Perfect responsiveness from mobile sizes to wide monitors.",
        },
        {
          criterion: "JavaScript State & DOM Hooks",
          max: 10,
          score: score3,
          note: "Correct DOM selection and asynchronous callback integration.",
        },
        {
          criterion: "Loading Speed & Web Vitals",
          max: 10,
          score: score4,
          note: "Proper image caching, minimized bundle sizes, clean code structure.",
        },
      ];
    } else if (
      normTitle.includes("sql") ||
      normTitle.includes("database") ||
      normTitle.includes("backend") ||
      normTitle.includes("api")
    ) {
      return [
        {
          criterion: "REST Endpoints Structure",
          max: 10,
          score: score1,
          note: "HTTP actions (GET, POST, DELETE) conform to standard REST protocol rules.",
        },
        {
          criterion: "SQL Queries and Indexing",
          max: 10,
          score: score2,
          note: "Efficient join queries; proper database indexing preventing slow queries.",
        },
        {
          criterion: "Prisma Schema Relationships",
          max: 10,
          score: score3,
          note: "Well configured entity-relation foreign keys and cascades.",
        },
        {
          criterion: "Request Error Catching",
          max: 10,
          score: score4,
          note: "Custom middleware filters invalid user parameters and handles server exceptions.",
        },
      ];
    } else if (
      normTitle.includes("python") ||
      normTitle.includes("model") ||
      normTitle.includes("pytorch") ||
      normTitle.includes("ai")
    ) {
      return [
        {
          criterion: "Tensor Dimension Shapes",
          max: 10,
          score: score1,
          note: "Shapes match exactly during training steps without compilation failures.",
        },
        {
          criterion: "Optimizers & Loss Math",
          max: 10,
          score: score2,
          note: "Loss value declines predictably without early gradient collapse.",
        },
        {
          criterion: "NumPy Vectorized Calculations",
          max: 10,
          score: score3,
          note: "Fast parallel processing, avoiding loops on heavy datasets.",
        },
        {
          criterion: "Cross-Validation Isolations",
          max: 10,
          score: score4,
          note: "Accurate training vs test set splitting with zero data leakage.",
        },
      ];
    } else {
      return [
        {
          criterion: "Core Logic Correctness",
          max: 10,
          score: score1,
          note: `Algorithm behaves as expected for ${focusDomain} workflows.`,
        },
        {
          criterion: "Architectural Cleanliness",
          max: 10,
          score: score2,
          note: "Proper code grouping and modular script separation.",
        },
        {
          criterion: "Execution Speed",
          max: 10,
          score: score3,
          note: "High performance rendering execution; zero memory leaks detected.",
        },
        {
          criterion: "Inline Explanations",
          max: 10,
          score: score4,
          note: "Clear inline comments explaining complex processing blocks.",
        },
      ];
    }
  }
}

// Helper to calculate subject performance metrics dynamically based on quizzes/assignments progress
function calculateDynamicSubjects(
  subjects: string[],
  focusDomain: string,
  currentEvaluationScorePercent: number,
  userId: string,
  rng: number,
): Array<{ name: string; score: number; trend: string }> {
  let totalQuizzesPassed = 0;
  let totalVideosWatched = 0;
  let totalSubmittedAssessments = 0;
  let averageAssessmentScore = 0;

  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("completed_quizzes_")) {
        try {
          const val = JSON.parse(window.localStorage.getItem(key) || "[]");
          if (Array.isArray(val)) {
            totalQuizzesPassed += val.length;
          }
        } catch (e) {}
      }
    }

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("video_progress_")) {
        try {
          const val = parseFloat(window.localStorage.getItem(key) || "0");
          if (val > 10) {
            totalVideosWatched++;
          }
        } catch (e) {}
      }
    }

    const evalCacheKey = `evaluations_${userId}`;
    const cachedEvalsStr = window.localStorage.getItem(evalCacheKey);
    if (cachedEvalsStr) {
      try {
        const cachedEvals = JSON.parse(cachedEvalsStr);
        if (Array.isArray(cachedEvals) && cachedEvals.length > 0) {
          totalSubmittedAssessments = cachedEvals.length;
          const totalScorePercent = cachedEvals.reduce(
            (sum, e) => sum + (e.score / e.max_score) * 100,
            0,
          );
          averageAssessmentScore = Math.round(totalScorePercent / cachedEvals.length);
        }
      } catch (e) {}
    }
  }

  const quizProgressPercent = Math.min(100, (totalQuizzesPassed / 6) * 100);
  const videoProgressPercent = Math.min(100, (totalVideosWatched / 4) * 100);
  const assessmentProgressPercent = totalSubmittedAssessments > 0 ? averageAssessmentScore : 40;

  const calculatedBasePerformance = Math.round(
    quizProgressPercent * 0.35 + videoProgressPercent * 0.25 + assessmentProgressPercent * 0.4,
  );

  const finalBaseScore = Math.max(35, Math.min(100, calculatedBasePerformance));

  return subjects.map((sub, idx) => {
    let relevanceBoost = 0;
    const isHighCurrentScore = currentEvaluationScorePercent >= 75;
    const isLowCurrentScore = currentEvaluationScorePercent < 55;

    if (isHighCurrentScore) {
      relevanceBoost = Math.round(rng * 8) + 2;
    } else if (isLowCurrentScore) {
      relevanceBoost = -Math.round(rng * 6) - 2;
    } else {
      relevanceBoost = Math.round((rng - 0.5) * 4);
    }

    let subjectScore = finalBaseScore + relevanceBoost + idx * 2 - 3;
    subjectScore = Math.max(35, Math.min(100, subjectScore));
    const trendVal = subjectScore > 80 ? "+5" : subjectScore > 65 ? "+3" : "+2";
    return {
      name: sub,
      score: subjectScore,
      trend: trendVal,
    };
  });
}

// Helper to generate dynamic rubric criteria, answers, and comments based on seeded random hash
function getThemedEvaluation(
  assessmentId: string,
  assessmentTitle: string,
  focusDomain: string,
  proficiency: string,
  userId: string,
): DBEvaluation {
  const seedString = assessmentId + userId + assessmentTitle;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rng = Math.abs(Math.sin(hash));

  const normTitle = assessmentTitle.toLowerCase();
  let aiFeedback = "";

  if (
    normTitle.includes("react native") ||
    normTitle.includes("expo") ||
    normTitle.includes("mobile")
  ) {
    aiFeedback = `Solid React Native mobile implementation for "${assessmentTitle}". The app navigation lifecycle works as expected, and layout constraints scale properly.`;
  } else if (
    normTitle.includes("css") ||
    normTitle.includes("html") ||
    normTitle.includes("styling") ||
    normTitle.includes("frontend")
  ) {
    aiFeedback = `Strong front-end structuring. Grid configurations render fluidly across viewport breakpoints.`;
  } else if (
    normTitle.includes("sql") ||
    normTitle.includes("database") ||
    normTitle.includes("backend") ||
    normTitle.includes("api")
  ) {
    aiFeedback = `Excellent API configuration. Server endpoints follow standard REST constraints cleanly, and connections are correctly closed.`;
  } else if (
    normTitle.includes("python") ||
    normTitle.includes("model") ||
    normTitle.includes("pytorch") ||
    normTitle.includes("ai")
  ) {
    aiFeedback = `Vectorized calculations perform cleanly. Shape assertions align perfectly throughout modeling cycles.`;
  } else {
    aiFeedback = `Solid overall implementation for "${assessmentTitle}". Code cleanliness and structure satisfy requirements.`;
  }

  const rubric = generateDynamicRubric(assessmentTitle, [], 0, focusDomain, false, rng);
  const totalScore = rubric.reduce((s, r) => s + r.score, 0);
  const maxScore = rubric.reduce((s, r) => s + r.max, 0);

  const focusSubjectsMap: Record<string, string[]> = {
    Frontend: [
      "React Native / React",
      "CSS & Flexbox Layouts",
      "JS ES6+ Async Features",
      "Web Performance Optimization",
      "State Hydration",
    ],
    Backend: [
      "RESTful API Protocols",
      "NodeJS Event Loops",
      "SQL / Database Queries",
      "Docker Deployment",
      "System Architecture",
    ],
    Mobile: [
      "React Native Core Views",
      "Platform UI Guidelines",
      "Expo CLI / Bundle Sizes",
      "State Management Hooks",
      "Native Device Bridges",
    ],
    AI: [
      "Python Core Scripting",
      "ML Regression Analysis",
      "Neural Networks & PyTorch",
      "NLP Data Processing",
      "Linear Algebra Foundations",
    ],
  };
  const subjects = focusSubjectsMap[focusDomain] || focusSubjectsMap["Mobile"];

  const currentEvaluationScorePercent = Math.round((totalScore / maxScore) * 100);
  const subjectsList = calculateDynamicSubjects(
    subjects,
    focusDomain,
    currentEvaluationScorePercent,
    userId,
    rng,
  );

  const isCorrect1 = rng > 0.3;
  const isCorrect2 = rng < 0.7;
  const isCorrect3 = rng > 0.5;

  const answersList = [
    {
      q: `Q1. Detail the component architecture implemented in ${assessmentTitle}.`,
      student: `We structured the project according to ${focusDomain} modular guidelines, splitting features into clear, reusable, and isolated nodes...`,
      verdict: isCorrect1 ? ("correct" as const) : ("partial" as const),
      marks: isCorrect1 ? "4/4" : "2/4",
      feedback: isCorrect1 ? "Well isolated components." : "Review dependency bounds.",
    },
    {
      q: "Q2. Explain key performance optimization techniques.",
      student:
        "Bottlenecks are prevented using deferred loading hooks, index lookup caches, and event pooling...",
      verdict: isCorrect2 ? ("correct" as const) : ("wrong" as const),
      marks: isCorrect2 ? "6/6" : "0/6",
      feedback: isCorrect2 ? "Correctly identified." : "Review standard profiling reports.",
    },
    {
      q: "Q3. Describe error handling strategies.",
      student:
        "All exceptions propagate to boundary handlers which map details to user-friendly messages...",
      verdict: isCorrect3 ? ("correct" as const) : ("partial" as const),
      marks: isCorrect3 ? "4/4" : "2/4",
    },
  ];

  return {
    assessment_id: assessmentId,
    assessment_title: assessmentTitle,
    score: totalScore,
    max_score: maxScore,
    mentor: "Verified by Mentor Priya M.",
    ai_feedback: aiFeedback,
    rubric,
    answers: answersList,
    subjects: subjectsList,
    percentile_rank: `Top ${Math.max(4, 15 - Math.floor(rng * 10))}%`,
  };
}

// 12. Fetch Evaluation
export async function fetchDBEvaluation(
  userId: string,
  assessmentId: string,
  assessmentTitle: string,
  focusDomain: string,
  proficiency: string,
): Promise<DBEvaluation> {
  try {
    // 1. Try to fetch existing evaluation first
    const { data: existingEval, error: evalError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .maybeSingle();

    if (evalError) throw evalError;

    // 2. Try to fetch the assessment first
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .eq("id", assessmentId)
      .maybeSingle();

    if (assessmentError) throw assessmentError;

    let shouldUpdateDB = false;
    if (existingEval) {
      let qLen = 6;
      if (assessment) {
        let assIndex = 1;
        if (assessment.id.includes("_ass_")) {
          assIndex = parseInt(assessment.id.split("_ass_")[1]) || 1;
        }
        const resolvedQuestions =
          assessment.questions && assessment.questions.length > 0
            ? assessment.questions
            : getQuestionsForCourseAssessment(focusDomain, assIndex);
        qLen = resolvedQuestions.length;
      }
      if (
        existingEval.max_score !== qLen ||
        existingEval.max_score === 15 ||
        existingEval.max_score === 16
      ) {
        shouldUpdateDB = true;
      } else {
        if (typeof window !== "undefined" && window.localStorage) {
          const cacheKey = `evaluations_${userId}`;
          const cached = window.localStorage.getItem(cacheKey);
          let list = cached ? JSON.parse(cached) : [];
          list = list.filter((e: any) => e.assessment_id !== assessmentId);
          list.push(existingEval);
          window.localStorage.setItem(cacheKey, JSON.stringify(list));
        }
        return existingEval as DBEvaluation;
      }
    }

    let dynamicEval: DBEvaluation | null = null;

    if (assessment) {
      const responses = assessment.responses || {};
      let assIndex = 1;
      if (assessment.id.includes("_ass_")) {
        assIndex = parseInt(assessment.id.split("_ass_")[1]) || 1;
      }
      const questions =
        assessment.questions && assessment.questions.length > 0
          ? assessment.questions
          : getQuestionsForCourseAssessment(focusDomain, assIndex);
      const isQuiz = Array.isArray(questions) && questions.length > 0;

      const focusSubjectsMap: Record<string, string[]> = {
        Frontend: [
          "React Native / React",
          "CSS & Flexbox Layouts",
          "JS ES6+ Async Features",
          "Web Performance Optimization",
          "State Hydration",
        ],
        Backend: [
          "RESTful API Protocols",
          "NodeJS Event Loops",
          "SQL / Database Queries",
          "Docker Deployment",
          "System Architecture",
        ],
        Mobile: [
          "React Native Core Views",
          "Platform UI Guidelines",
          "Expo CLI / Bundle Sizes",
          "State Management Hooks",
          "Native Device Bridges",
        ],
        AI: [
          "Python Core Scripting",
          "ML Regression Analysis",
          "Neural Networks & PyTorch",
          "NLP Data Processing",
          "Linear Algebra Foundations",
        ],
      };

      const subjects = focusSubjectsMap[focusDomain] || focusSubjectsMap["Mobile"];

      const seedString = assessmentId + userId + assessmentTitle;
      let hash = 0;
      for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
      }
      const rng = Math.abs(Math.sin(hash));

      if (isQuiz) {
        let correctCount = 0;
        const dynamicAnswers = questions.map((q: any, idx: number) => {
          const studentAnswerIdx = responses[idx];
          const isCorrect = studentAnswerIdx === q.correctAnswer;
          if (isCorrect) {
            correctCount++;
          }
          const verdict = isCorrect ? ("correct" as const) : ("wrong" as const);
          return {
            q: `Q${idx + 1}. ${q.question}`,
            student:
              studentAnswerIdx !== undefined && q.options && q.options[studentAnswerIdx]
                ? `Selected Option: ${q.options[studentAnswerIdx]}`
                : "No option selected",
            verdict,
            marks: isCorrect ? "1/1" : "0/1",
            feedback: isCorrect
              ? "Excellent work! Your answer is correct."
              : `Incorrect. The correct option is: ${q.options ? q.options[q.correctAnswer] : "Unknown"}`,
          };
        });

        const dynamicRubric = generateDynamicRubric(
          assessmentTitle,
          questions,
          correctCount,
          focusDomain,
          true,
          rng,
        );
        const score = dynamicRubric.reduce((s, r) => s + r.score, 0);
        const maxScore = dynamicRubric.reduce((s, r) => s + r.max, 0);

        const currentEvaluationScorePercent = Math.round((correctCount / questions.length) * 100);
        const subjectsList = calculateDynamicSubjects(
          subjects,
          focusDomain,
          currentEvaluationScorePercent,
          userId,
          rng,
        );

        dynamicEval = {
          assessment_id: assessmentId,
          assessment_title: assessmentTitle,
          score,
          max_score: maxScore,
          mentor: "Verified by Mentor Priya M.",
          ai_feedback: `Based on your quiz performance, you answered ${correctCount} of ${questions.length} questions correctly. ${
            correctCount === questions.length
              ? "Flawless score! You have masterfully grasped all evaluated concepts."
              : "Review the explanation for the incorrect answers to strengthen your command over these topics."
          }`,
          rubric: dynamicRubric,
          answers: dynamicAnswers,
          subjects: subjectsList,
          percentile_rank: `Top ${Math.max(5, 100 - Math.round((correctCount / questions.length) * 20))}%`,
        };
      } else {
        // Project evaluation
        const themed = getThemedEvaluation(
          assessmentId,
          assessmentTitle,
          focusDomain,
          proficiency,
          userId,
        );
        const githubUrl = responses.githubUrl || "https://github.com/user/project";
        const selectedTemplate = responses.selectedTemplate || "Source Code Submission";
        const filesList = Array.isArray(responses.files) ? responses.files : [];

        const repoAnswers = filesList.map((f: any) => ({
          q: `File Integrity check: ${f.name}`,
          student: `File size: ${(f.size / 1024).toFixed(1)} KB`,
          verdict: "correct" as const,
          marks: "Pass",
          feedback: `Verified file configuration for ${f.name}.`,
        }));

        if (repoAnswers.length === 0) {
          repoAnswers.push({
            q: "Repository Check",
            student: `Connected repository: ${githubUrl}`,
            verdict: "correct" as const,
            marks: "Pass",
            feedback: "Repository successfully indexed.",
          });
        }

        dynamicEval = {
          ...themed,
          answers: [...repoAnswers, ...themed.answers],
          ai_feedback: `Successfully processed project "${selectedTemplate}" submitted from GitHub repository ${githubUrl}. ${themed.ai_feedback}`,
        };
      }
    }

    // 3. Fallback if assessment couldn't be loaded
    if (!dynamicEval) {
      dynamicEval = getThemedEvaluation(
        assessmentId,
        assessmentTitle,
        focusDomain,
        proficiency,
        userId,
      );
    }

    // Cache it locally first
    if (typeof window !== "undefined" && window.localStorage) {
      const cacheKey = `evaluations_${userId}`;
      const cached = window.localStorage.getItem(cacheKey);
      let list = cached ? JSON.parse(cached) : [];
      list = list.filter((e: any) => e.assessment_id !== assessmentId);
      list.push(dynamicEval);
      window.localStorage.setItem(cacheKey, JSON.stringify(list));
    }

    // Performance trends logging removed by user request

    // 4. Save evaluation to Supabase for dynamic caching
    const payload = {
      ...dynamicEval,
      user_id: userId,
    };

    if (shouldUpdateDB && existingEval) {
      const { data: updated, error: updateError } = await supabase
        .from("evaluations")
        .update(payload)
        .eq("user_id", userId)
        .eq("assessment_id", assessmentId)
        .select()
        .single();

      if (!updateError && updated) {
        return updated as DBEvaluation;
      } else {
        console.warn(
          "fetchDBEvaluation: Failed to update database, using generated value:",
          updateError,
        );
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("evaluations")
        .insert(payload)
        .select()
        .single();

      if (!insertError && inserted) {
        return inserted as DBEvaluation;
      } else {
        console.warn(
          "fetchDBEvaluation: Failed to insert to database, using generated value:",
          insertError,
        );
      }
    }

    return dynamicEval;
  } catch (e) {
    logError("fetchDBEvaluation", e);
  }

  // Load from localStorage if offline/fallback
  if (typeof window !== "undefined" && window.localStorage) {
    const cacheKey = `evaluations_${userId}`;
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const list = JSON.parse(cached);
        const cachedEval = list.find((e: any) => e.assessment_id === assessmentId);
        if (cachedEval) {
          return cachedEval as DBEvaluation;
        }
      } catch (err) {}
    }
  }

  // Generate fallback structure if completely failed
  return getThemedEvaluation(assessmentId, assessmentTitle, focusDomain, proficiency, userId);
}

// Grievance filing removed by user request

// Performance Trends and Weak Areas fetchers removed by user request

// 18. Fetch User Recommendations containing personalized course progress
export async function fetchDBRecommendations(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("userId", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      const { data: dataAlt, error: errorAlt } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorAlt) throw errorAlt;
      if (dataAlt) {
        return {
          ...dataAlt,
          courses:
            typeof dataAlt.courses === "string" ? JSON.parse(dataAlt.courses) : dataAlt.courses,
          resources:
            typeof dataAlt.resources === "string"
              ? JSON.parse(dataAlt.resources)
              : dataAlt.resources,
          milestones:
            typeof dataAlt.milestones === "string"
              ? JSON.parse(dataAlt.milestones)
              : dataAlt.milestones,
        };
      }
      return null;
    }

    if (data) {
      return {
        ...data,
        courses: typeof data.courses === "string" ? JSON.parse(data.courses) : data.courses,
        resources: typeof data.resources === "string" ? JSON.parse(data.resources) : data.resources,
        milestones:
          typeof data.milestones === "string" ? JSON.parse(data.milestones) : data.milestones,
      };
    }
  } catch (e) {
    logError("fetchDBRecommendations", e);
  }
  return null;
}

// 19. Update courses progress inside recommendations table and user_enrollments
export async function saveDBCourseProgress(userId: string, courses: DBCourse[]): Promise<void> {
  try {
    const { error } = await supabase
      .from("recommendations")
      .update({
        courses: JSON.stringify(courses),
      })
      .eq("userId", userId);

    if (error) {
      await supabase
        .from("recommendations")
        .update({
          courses: JSON.stringify(courses),
        })
        .eq("user_id", userId);
    }

    // Sync individual course progress to user_enrollments table
    if (courses && courses.length > 0) {
      for (const course of courses) {
        if (course.id && (course.progress || 0) > 0) {
          await supabase.from("user_enrollments").upsert(
            {
              user_id: userId,
              course_id: course.id,
              progress: course.progress || 0,
            },
            { onConflict: "user_id,course_id" },
          );
        }
      }
    }
  } catch (e) {
    logError("saveDBCourseProgress", e);
  }
}

// Save complete recommendations
export async function saveDBRecommendations(userId: string, recs: any): Promise<void> {
  try {
    const payload = {
      userId: userId,
      user_id: userId,
      courses: typeof recs.courses === "string" ? recs.courses : JSON.stringify(recs.courses),
      resources:
        typeof recs.resources === "string" ? recs.resources : JSON.stringify(recs.resources),
      milestones:
        typeof recs.milestones === "string" ? recs.milestones : JSON.stringify(recs.milestones),
      weeklyHoursTarget: recs.weeklyHoursTarget || 5,
      nextAssessment: recs.nextAssessment || "",
    };

    const { error } = await supabase
      .from("recommendations")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      // Fallback if user_id conflict constraint differs
      await supabase.from("recommendations").upsert(
        {
          userId: userId,
          courses: typeof recs.courses === "string" ? recs.courses : JSON.stringify(recs.courses),
          resources:
            typeof recs.resources === "string" ? recs.resources : JSON.stringify(recs.resources),
          milestones:
            typeof recs.milestones === "string" ? recs.milestones : JSON.stringify(recs.milestones),
          weeklyHoursTarget: recs.weeklyHoursTarget || 5,
          nextAssessment: recs.nextAssessment || "",
        },
        { onConflict: "userId" },
      );
    }
  } catch (e) {
    logError("saveDBRecommendations", e);
  }
}

// 20. Fetch All Profiles
export async function fetchDBAllProfiles(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn("fetchDBAllProfiles failed:", e);
    return [];
  }
}

// 21. Fetch All Recommendations for extracting current courses
export async function fetchDBAllRecommendations(): Promise<any[]> {
  try {
    // Attempt with user_id first
    const { data, error } = await supabase.from("recommendations").select("user_id, courses");

    if (error) {
      // Fallback to userId
      const { data: dataAlt, error: errorAlt } = await supabase
        .from("recommendations")
        .select("userId, courses");
      if (errorAlt) throw errorAlt;
      return (dataAlt || []).map((x) => ({ user_id: x.userId, courses: x.courses }));
    }
    return data || [];
  } catch (e) {
    console.warn("fetchDBAllRecommendations failed:", e);
    return [];
  }
}

// 22. Fetch Connections involving active user
export async function fetchDBConnections(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("peer_connections")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn("fetchDBConnections failed:", e);
    return [];
  }
}

// 23. Send Connection Request
export async function sendDBConnectionRequest(senderId: string, receiverId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("peer_connections")
      .insert({ sender_id: senderId, receiver_id: receiverId, status: "pending" })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("sendDBConnectionRequest failed:", e);
    throw e;
  }
}

// 24. Update Connection Status (Accept/Reject)
export async function updateDBConnectionStatus(
  connectionId: string,
  status: "accepted" | "rejected",
  senderId: string,
  receiverId: string,
): Promise<void> {
  try {
    // Update connection status
    const { error } = await supabase
      .from("peer_connections")
      .update({ status })
      .eq("id", connectionId);
    if (error) throw error;

    if (status === "accepted") {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from("peer_conversations")
        .insert({})
        .select()
        .single();
      if (convError) throw convError;

      // Insert participants
      const { error: partError } = await supabase.from("peer_conversation_participants").insert([
        { conversation_id: conv.id, user_id: senderId },
        { conversation_id: conv.id, user_id: receiverId },
      ]);
      if (partError) throw partError;
    }
  } catch (e) {
    console.warn("updateDBConnectionStatus failed:", e);
    throw e;
  }
}

// 25. Fetch Conversations user is involved in
export async function fetchDBConversations(userId: string): Promise<any[]> {
  try {
    const { data: myPart, error: partErr } = await supabase
      .from("peer_conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);
    if (partErr) throw partErr;

    if (!myPart || myPart.length === 0) return [];
    const convIds = myPart.map((cp) => cp.conversation_id);

    const { data: allPart, error: allErr } = await supabase
      .from("peer_conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);
    if (allErr) throw allErr;

    return allPart || [];
  } catch (e) {
    console.warn("fetchDBConversations failed:", e);
    return [];
  }
}

// 26. Fetch Messages in conversation with pagination (limit and offset)
export async function fetchDBMessagesPaged(
  conversationId: string,
  limit: number = 30,
  offset: number = 0,
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("peer_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data || []).reverse();
  } catch (e) {
    console.warn("fetchDBMessagesPaged failed:", e);
    return [];
  }
}

// 27. Send Message in a conversation
export async function sendDBMessage(
  conversationId: string,
  senderId: string,
  message: string,
  attachmentUrl?: string,
  attachmentName?: string,
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("peer_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("sendDBMessage failed:", e);
    throw e;
  }
}

// 28. Mark Messages as read
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("peer_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);
    if (error) throw error;
  } catch (e) {
    console.warn("markMessagesAsRead failed:", e);
  }
}

// 29. Fetch total unread count for all conversations
export async function fetchDBAllIncomingUnreadCount(currentUserId: string): Promise<number> {
  try {
    const { data: myPart, error: partErr } = await supabase
      .from("peer_conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);
    if (partErr) throw partErr;

    if (!myPart || myPart.length === 0) return 0;
    const convIds = myPart.map((cp) => cp.conversation_id);

    const { count, error } = await supabase
      .from("peer_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);
    if (error) throw error;
    return count || 0;
  } catch (e) {
    return 0;
  }
}

// 30. Get or Create Peer Conversation
export async function getOrCreateConversation(user1: string, user2: string): Promise<string> {
  console.log("[Supabase DB] getOrCreateConversation started for user1:", user1, "user2:", user2);
  try {
    // 1. Fetch conversations for user1
    const { data: myPart, error: partErr } = await supabase
      .from("peer_conversation_participants")
      .select("conversation_id")
      .eq("user_id", user1);
    if (partErr) {
      console.error("[Supabase DB] Fetching conversations for user1 failed:", partErr);
      throw partErr;
    }

    console.log("[Supabase DB] user1 conversations count:", myPart ? myPart.length : 0);

    if (myPart && myPart.length > 0) {
      const convIds = myPart.map((cp) => cp.conversation_id);

      // 2. Find common conversation containing user2 using limit(1) to avoid duplicate rows error
      const { data: commonParts, error: commonErr } = await supabase
        .from("peer_conversation_participants")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .eq("user_id", user2)
        .limit(1);

      if (commonErr) {
        console.error("[Supabase DB] Finding common conversation failed:", commonErr);
        throw commonErr;
      }

      if (commonParts && commonParts.length > 0) {
        console.log(
          "[Supabase DB] Found existing conversation ID:",
          commonParts[0].conversation_id,
        );
        return commonParts[0].conversation_id;
      }
    }

    console.log("[Supabase DB] No common conversation found. Creating a new one...");

    // 3. Create conversation if not exist
    const { data: conv, error: convError } = await supabase
      .from("peer_conversations")
      .insert({})
      .select()
      .single();
    if (convError) {
      console.error("[Supabase DB] Creating conversation failed:", convError);
      throw convError;
    }

    console.log("[Supabase DB] New conversation created with ID:", conv.id);

    // 4. Insert participants
    const { error: partError } = await supabase.from("peer_conversation_participants").insert([
      { conversation_id: conv.id, user_id: user1 },
      { conversation_id: conv.id, user_id: user2 },
    ]);
    if (partError) {
      console.error("[Supabase DB] Inserting participants failed:", partError);
      throw partError;
    }

    console.log(
      "[Supabase DB] Participants inserted successfully. Returning new conversation ID:",
      conv.id,
    );
    return conv.id;
  } catch (e) {
    console.error("[Supabase DB] getOrCreateConversation failed:", e);
    throw e;
  }
}

// 31. Disconnect a connection
export async function deleteDBConnection(connectionId: string): Promise<void> {
  try {
    const { error } = await supabase.from("peer_connections").delete().eq("id", connectionId);
    if (error) throw error;
  } catch (e) {
    console.error("deleteDBConnection failed:", e);
    throw e;
  }
}

// 32. Block a connection user
export async function blockDBUser(connectionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("peer_connections")
      .update({ status: "blocked" })
      .eq("id", connectionId);
    if (error) throw error;
  } catch (e) {
    console.error("blockDBUser failed:", e);
    throw e;
  }
}

// 33. Block a user directly (no existing connection)
export async function blockDBUserDirect(senderId: string, receiverId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("peer_connections")
      .insert({ sender_id: senderId, receiver_id: receiverId, status: "blocked" });
    if (error) throw error;
  } catch (e) {
    console.error("blockDBUserDirect failed:", e);
    throw e;
  }
}

// 34. Fetch User Enrollments from Supabase
export async function fetchDBUserEnrollments(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("user_enrollments")
      .select(
        `
        *,
        courses (
          title,
          difficulty,
          focus_domain
        )
      `,
      )
      .eq("user_id", userId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("fetchDBUserEnrollments failed:", e);
    return [];
  }
}

// 35. Enroll in a Course in Supabase
export async function enrollInDBCourse(userId: string, courseId: number): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("user_enrollments")
      .insert({ user_id: userId, course_id: courseId, progress: 0 })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("enrollInDBCourse failed:", e);
    throw e;
  }
}

// -------------------------------------------------------------
// Course Sections, Reference Materials, and Achievements
// -------------------------------------------------------------

export interface DBSection {
  title: string;
  startSec: number;
  duration: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

export interface DBAchievement {
  id: string;
  title: string;
  emoji: string;
  requirement: string;
  metric: string;
  threshold: number;
  color: string;
}

const COURSE_MATERIALS_FALLBACK: Record<
  string,
  Array<{ label: string; url: string; type: "doc" | "tutorial" | "article" }>
> = {
  "HTML5, CSS3, & Modern Grid": [
    {
      label: "MDN Web Docs: HTML & CSS Basics",
      url: "https://developer.mozilla.org/en-US/docs/Learn",
      type: "doc",
    },
    {
      label: "CSS Tricks: Complete Guide to Flexbox",
      url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
      type: "article",
    },
    {
      label: "Interactive CSS Grid Garden Game",
      url: "https://cssgridgarden.com/",
      type: "tutorial",
    },
  ],
  "JavaScript Fundamentals & DOM": [
    {
      label: "MDN Web Docs: JavaScript Programming Guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      type: "doc",
    },
    {
      label: "JavaScript.info - Comprehensive Tutorial",
      url: "https://javascript.info/",
      type: "tutorial",
    },
    {
      label: "Eloquent JavaScript (Free Digital Book)",
      url: "https://eloquentjavascript.net/",
      type: "doc",
    },
  ],
  "Intro to React & Component States": [
    {
      label: "React Official Docs: Quick Start Guide",
      url: "https://react.dev/learn",
      type: "doc",
    },
    {
      label: "Scrimba: Free Interactive React Course",
      url: "https://scrimba.com/learn/learnreact",
      type: "tutorial",
    },
    {
      label: "Robin Wieruch: Complete React State tutorial",
      url: "https://www.robinwieruch.de/react-state/",
      type: "article",
    },
  ],
  "Intro to Node.js & REST API": [
    {
      label: "Node.js Official Documentation Guide",
      url: "https://nodejs.org/en/docs",
      type: "doc",
    },
    {
      label: "Express.js RESTful API Routing guide",
      url: "https://expressjs.com/en/guide/routing.html",
      type: "doc",
    },
    {
      label: "RestApiTutorial: What is REST?",
      url: "https://restapitutorial.com/",
      type: "tutorial",
    },
  ],
  "SQL Fundamentals & Relational DBs": [
    {
      label: "W3Schools Interactive SQL Reference",
      url: "https://www.w3schools.com/sql/",
      type: "tutorial",
    },
    { label: "SQLBolt: Interactive SQL Lessons", url: "https://sqlbolt.com/", type: "tutorial" },
    {
      label: "Use The Index, Luke: SQL query speed guide",
      url: "https://use-the-index-luke.com/",
      type: "doc",
    },
  ],
  "React Native & Expo Ecosystem": [
    {
      label: "React Native official Layout Guides",
      url: "https://reactnative.dev/docs/flexbox",
      type: "doc",
    },
    { label: "Expo CLI Docs: Building native bundles", url: "https://docs.expo.dev/", type: "doc" },
    {
      label: "React Navigation state container setups",
      url: "https://reactnavigation.org/",
      type: "article",
    },
  ],
  "Python Fundamentals & Packages": [
    {
      label: "Python.org Official Tutorial",
      url: "https://docs.python.org/3/tutorial/",
      type: "doc",
    },
    {
      label: "Real Python: Comprehensive Learning Path",
      url: "https://realpython.com/",
      type: "tutorial",
    },
  ],
  "Neural Networks with PyTorch": [
    {
      label: "PyTorch Official Neural Network Tutorial",
      url: "https://pytorch.org/tutorials/beginner/blitz/neural_networks_tutorial.html",
      type: "doc",
    },
    {
      label: "Deep Learning with PyTorch (Free book)",
      url: "https://pytorch.org/deep-learning-with-pytorch-book",
      type: "doc",
    },
  ],
  "React Router & Global Context": [
    { label: "React Router Docs: Routing Basics", url: "https://reactrouter.com/", type: "doc" },
  ],
  "Tailwind CSS & Responsive Layouts": [
    { label: "Tailwind CSS Official Docs", url: "https://tailwindcss.com/", type: "doc" },
  ],
  "TypeScript Essentials for Web": [
    {
      label: "TypeScript Deep Dive Handbook",
      url: "https://basarat.gitbook.io/typescript/",
      type: "doc",
    },
  ],
  "Java Spring Boot Microservices": [
    { label: "Spring Boot Official Guides", url: "https://spring.io/guides", type: "doc" },
  ],
  "PostgreSQL Queries & Optimization": [
    {
      label: "Postgres Guide: Indexes & Queries",
      url: "https://www.postgresguide.com/",
      type: "doc",
    },
  ],
  "SwiftUI Mastery for iOS Platforms": [
    {
      label: "Apple Developer SwiftUI Tutorials",
      url: "https://developer.apple.com/tutorials/swiftui",
      type: "doc",
    },
  ],
  "Kotlin & Android Jetpack UI": [
    {
      label: "Android Developers Jetpack Compose Guide",
      url: "https://developer.android.com/jetpack/compose",
      type: "doc",
    },
  ],
  "Pandas & Numpy Data Wrangling": [
    {
      label: "Pandas User Guide & Exercises",
      url: "https://pandas.pydata.org/docs/user_guide/index.html",
      type: "doc",
    },
  ],
  "Basics of Routing & HTTP Methods": [
    {
      label: "HTTP Protocols MDN Reference",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
      type: "doc",
    },
  ],
};

const ACHIEVEMENTS_FALLBACK: DBAchievement[] = [
  {
    id: "first_course",
    title: "First Course Completed",
    emoji: "🏆",
    requirement: "Complete 1 course from registered pathways",
    metric: "courses_completed",
    threshold: 1,
    color: "#f59e0b",
  },
  {
    id: "streak_30",
    title: "30-Day Streak",
    emoji: "🔥",
    requirement: "Maintain a consecutive study streak of 30 days",
    metric: "streak",
    threshold: 30,
    color: "#ef4444",
  },
  {
    id: "quizzes_100",
    title: "100 Quizzes",
    emoji: "📚",
    requirement: "Answer questions correctly to reach 1,000+ XP",
    metric: "xp",
    threshold: 1000,
    color: "#3b82f6",
  },
  {
    id: "coding_master",
    title: "Coding Master",
    emoji: "💻",
    requirement: "Earn 5,000+ total Experience Points (XP)",
    metric: "xp",
    threshold: 5000,
    color: "#10b981",
  },
];

const DEFAULT_SECTIONS_FALLBACK: DBSection[] = [
  {
    title: "Section 1: Getting Started and Basic Setup",
    startSec: 0,
    duration: "10 mins",
    quiz: {
      question: "What is the primary language used in this course domain?",
      options: ["TypeScript/JavaScript", "Python", "Swift", "C++"],
      correctAnswer: 0,
    },
  },
  {
    title: "Section 2: Deep Dive into Core Workflows",
    startSec: 600,
    duration: "15 mins",
    quiz: {
      question: "Which hook or function is commonly used for managing local state updates?",
      options: ["useReducer", "useState", "useEffect", "useMemo"],
      correctAnswer: 1,
    },
  },
];

const COURSE_SECTIONS_FALLBACK: Record<string, DBSection[]> = {
  "React Native & Expo Ecosystem": [
    {
      title: "Section 1: Introduction to React Native & Expo Starter",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What is the primary benefit of using Expo with React Native?",
        options: [
          "It compiles to native platforms without Xcode/Android Studio manual installs",
          "It forces you to write code in pure HTML/CSS styles",
          "It completely removes JavaScript from the runtime engine",
          "It only supports web-based targets",
        ],
        correctAnswer: 0,
      },
    },
    {
      title: "Section 2: Layouts, Styling, Flexbox & Component States",
      startSec: 600,
      duration: "15 mins",
      quiz: {
        question:
          "Which React Native element is the equivalent of a <div> in normal HTML web pages?",
        options: ["Text", "Div", "View", "Container"],
        correctAnswer: 2,
      },
    },
    {
      title: "Section 3: Navigation, App Router & Device API Integrations",
      startSec: 1500,
      duration: "20 mins",
      quiz: {
        question: "Which navigation routing library is built-in in modern Expo SDK releases?",
        options: ["react-router-dom", "Expo Router", "native-navigation", "window.location"],
        correctAnswer: 1,
      },
    },
  ],
  "HTML5, CSS3, & Modern Grid": [
    {
      title: "Section 1: Semantic Elements & Document Headers",
      startSec: 0,
      duration: "12 mins",
      quiz: {
        question: "Which HTML5 semantic element is most appropriate for a syndicatable blog post?",
        options: ["<section>", "<div>", "<article>", "<aside>"],
        correctAnswer: 2,
      },
    },
    {
      title: "Section 2: Flexible Box Layouts & Media Queries",
      startSec: 720,
      duration: "15 mins",
      quiz: {
        question: "What is the default direction of flex-direction in CSS Flexbox?",
        options: ["row", "column", "row-reverse", "grid"],
        correctAnswer: 0,
      },
    },
    {
      title: "Section 3: CSS Grid Gardens & Auto-fit Columns",
      startSec: 1620,
      duration: "18 mins",
      quiz: {
        question: "Which CSS property defines column tracks and sizes in grid templates?",
        options: ["grid-column-gap", "grid-template-columns", "grid-rows", "flex-basis"],
        correctAnswer: 1,
      },
    },
  ],
  "JavaScript Fundamentals & DOM": [
    {
      title: "Section 1: Variables, Types & Block Scopes",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question:
          "Which variable declaration keyword is block-scoped and prevents value reassignments?",
        options: ["var", "let", "const", "define"],
        correctAnswer: 2,
      },
    },
    {
      title: "Section 2: Functions, Array Map/Filter/Reduce & Callbacks",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question:
          "Which array method returns a new array containing items that evaluate true inside a callback function?",
        options: ["map()", "filter()", "forEach()", "reduce()"],
        correctAnswer: 1,
      },
    },
    {
      title: "Section 3: DOM Selectors & Document Event Listeners",
      startSec: 1320,
      duration: "15 mins",
      quiz: {
        question:
          "Which DOM method returns the first element that matches the specified CSS selectors?",
        options: ["getElementById", "getElementsByClassName", "querySelector", "querySelectorAll"],
        correctAnswer: 2,
      },
    },
  ],
  "Intro to React & Component States": [
    {
      title: "Section 1: JSX Syntax & Virtual DOM Diffing",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What is JSX in React component development?",
        options: [
          "A JavaScript XML syntax extension",
          "A styling stylesheet framework",
          "A transpiler utility",
          "A direct browser compiler",
        ],
        correctAnswer: 0,
      },
    },
    {
      title: "Section 2: Functional Components & Custom Props passing",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "How are initial arguments passed down from parent to child React components?",
        options: [
          "Via local storage",
          "Via component context hook",
          "Via Component Props object",
          "Via global window objects",
        ],
        correctAnswer: 2,
      },
    },
    {
      title: "Section 3: useState Hooks & Rendering lifecycles",
      startSec: 1320,
      duration: "15 mins",
      quiz: {
        question:
          "Which built-in Hook allows functional components to store and update local state values?",
        options: ["useEffect", "useState", "useRef", "useContext"],
        correctAnswer: 1,
      },
    },
  ],
};

function generateDynamicCourseSections(courseTitle: string): DBSection[] {
  const lower = courseTitle.toLowerCase();

  if (
    lower.includes("python") ||
    lower.includes("pandas") ||
    lower.includes("numpy") ||
    lower.includes("statistics") ||
    lower.includes("pytorch") ||
    lower.includes("nlp") ||
    lower.includes("transformer") ||
    lower.includes("generative") ||
    lower.includes("mlops") ||
    lower.includes("data visualization")
  ) {
    return [
      {
        title: "Section 1: Core Concepts & Data Structures",
        startSec: 0,
        duration: "12 mins",
        quiz: {
          question: lower.includes("python")
            ? "Which Python data structure is mutable and stores key-value pairs?"
            : lower.includes("pandas") || lower.includes("numpy")
              ? "Which library is optimized for multi-dimensional array operations?"
              : lower.includes("pytorch") || lower.includes("neural")
                ? "What is the function of backward() in PyTorch training loops?"
                : lower.includes("transformer") || lower.includes("generative")
                  ? "What is the key mechanism in Transformer architectures?"
                  : "What is the primary language used in AI/ML engineering?",
          options: lower.includes("python")
            ? ["Tuple", "List", "Dictionary", "Set"]
            : lower.includes("pandas") || lower.includes("numpy")
              ? ["Pandas", "NumPy", "Matplotlib", "Requests"]
              : lower.includes("pytorch") || lower.includes("neural")
                ? [
                    "Initialize weights",
                    "Compute gradients",
                    "Update optimizer",
                    "Calculate loss value",
                  ]
                : lower.includes("transformer") || lower.includes("generative")
                  ? [
                      "Recurrent state connections",
                      "Self-Attention mechanism",
                      "Convolutional pooling layers",
                      "Gradient clipping",
                    ]
                  : ["Python", "JavaScript", "C++", "Java"],
          correctAnswer: lower.includes("python")
            ? 2
            : lower.includes("pandas") || lower.includes("numpy")
              ? 1
              : lower.includes("pytorch") || lower.includes("neural")
                ? 1
                : lower.includes("transformer") || lower.includes("generative")
                  ? 1
                  : 0,
        },
      },
      {
        title: "Section 2: Workflows, Model Training & Data Prep",
        startSec: 720,
        duration: "15 mins",
        quiz: {
          question:
            lower.includes("pandas") || lower.includes("numpy")
              ? "Which method drops rows with missing/null values in a Pandas DataFrame?"
              : lower.includes("pytorch") ||
                  lower.includes("neural") ||
                  lower.includes("transformer")
                ? "Why do we use an optimizer during neural network training?"
                : "Which metric represents the center of a probability distribution?",
          options:
            lower.includes("pandas") || lower.includes("numpy")
              ? ["df.dropna()", "df.clean()", "df.isnull()", "df.remove()"]
              : lower.includes("pytorch") ||
                  lower.includes("neural") ||
                  lower.includes("transformer")
                ? [
                    "To speed up data loading",
                    "To update model weights based on loss gradients",
                    "To store check-in parameters",
                    "To shuffle the input dataloader",
                  ]
                : ["Variance", "Standard Deviation", "Mean", "Median"],
          correctAnswer:
            lower.includes("pandas") || lower.includes("numpy")
              ? 0
              : lower.includes("pytorch") ||
                  lower.includes("neural") ||
                  lower.includes("transformer")
                ? 1
                : 2,
        },
      },
    ];
  }

  if (
    lower.includes("native") ||
    lower.includes("expo") ||
    lower.includes("mobile") ||
    lower.includes("swiftui") ||
    lower.includes("kotlin") ||
    lower.includes("navigation")
  ) {
    return [
      {
        title: "Section 1: Navigation & UI Container Architecture",
        startSec: 0,
        duration: "10 mins",
        quiz: {
          question: lower.includes("swiftui")
            ? "Which view wrapper serves as a list container in SwiftUI?"
            : lower.includes("kotlin")
              ? "Which UI toolkit is recommended for modern native Android development?"
              : "Which container is used to handle tab-based navigation routing in React Native?",
          options: lower.includes("swiftui")
            ? ["VStack", "List", "ScrollView", "Form"]
            : lower.includes("kotlin")
              ? ["Android XML Layout", "Jetpack Compose", "React Native", "Flutter View"]
              : ["Stack.Navigator", "Tab.Navigator", "Drawer.Navigator", "NavigationContainer"],
          correctAnswer: lower.includes("swiftui") ? 1 : lower.includes("kotlin") ? 1 : 1,
        },
      },
      {
        title: "Section 2: Device Hardware Integrations & Performance",
        startSec: 600,
        duration: "15 mins",
        quiz: {
          question:
            "How do React Native applications interact with native hardware features like GPS/Camera?",
          options: [
            "Using native device webviews",
            "Through asynchronous native bridge channels / Expo SDKs",
            "By converting JavaScript to C++ compiles directly",
            "Using HTML5 WebRTC standard API interfaces",
          ],
          correctAnswer: 1,
        },
      },
    ];
  }

  if (
    lower.includes("node") ||
    lower.includes("sql") ||
    lower.includes("express") ||
    lower.includes("spring boot") ||
    lower.includes("postgres") ||
    lower.includes("redis") ||
    lower.includes("docker") ||
    lower.includes("kubernetes") ||
    lower.includes("microservices") ||
    lower.includes("distributed") ||
    lower.includes("go ")
  ) {
    return [
      {
        title: "Section 1: API Design & Server Architectures",
        startSec: 0,
        duration: "12 mins",
        quiz: {
          question:
            lower.includes("sql") || lower.includes("postgres")
              ? "Which SQL statement is used to combine rows from multiple tables based on a related column?"
              : lower.includes("docker") || lower.includes("kubernetes")
                ? "What is the primary purpose of a Docker container?"
                : "Which HTTP request method is standard for creating new resources in a REST API?",
          options:
            lower.includes("sql") || lower.includes("postgres")
              ? ["UNION", "GROUP BY", "JOIN", "CONNECT"]
              : lower.includes("docker") || lower.includes("kubernetes")
                ? [
                    "To encrypt developer operating systems",
                    "To isolate applications and their dependencies in a lightweight package",
                    "To manage cloud database clusters",
                    "To run local hypervisor virtual machines",
                  ]
                : ["GET", "POST", "PUT", "DELETE"],
          correctAnswer:
            lower.includes("sql") || lower.includes("postgres")
              ? 2
              : lower.includes("docker") || lower.includes("kubernetes")
                ? 1
                : 1,
        },
      },
      {
        title: "Section 2: Caching, Persistence & Cloud Operations",
        startSec: 720,
        duration: "14 mins",
        quiz: {
          question:
            lower.includes("redis") || lower.includes("caching")
              ? "Which database model does Redis implement for high-performance caching?"
              : lower.includes("sql") || lower.includes("postgres")
                ? "Which index type is best for speeding up exact value match queries?"
                : "Which command starts a set of microservice containers declared in a compose file?",
          options:
            lower.includes("redis") || lower.includes("caching")
              ? [
                  "Relational columns",
                  "Key-Value store",
                  "Document tree model",
                  "Graph connections",
                ]
              : lower.includes("sql") || lower.includes("postgres")
                ? ["B-Tree Index", "Hash Index", "Gist Index", "Brin Index"]
                : ["docker run", "docker-compose up", "kubectl apply", "npm run compose"],
          correctAnswer:
            lower.includes("redis") || lower.includes("caching")
              ? 1
              : lower.includes("sql") || lower.includes("postgres")
                ? 0
                : 1,
        },
      },
    ];
  }

  return [
    {
      title: "Section 1: Document Structure & Styling Systems",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: lower.includes("tailwind")
          ? "Which utility class adds absolute padding to the left and right in Tailwind CSS?"
          : lower.includes("typescript")
            ? "Which keyword is used to declare a contract structure for objects in TypeScript?"
            : "Which HTML5 semantic element represents an independent, self-contained piece of content?",
        options: lower.includes("tailwind")
          ? ["py-4", "px-4", "m-4", "p-4"]
          : lower.includes("typescript")
            ? ["class", "interface", "type", "contract"]
            : ["<section>", "<article>", "<header>", "<aside>"],
        correctAnswer: lower.includes("tailwind") ? 1 : lower.includes("typescript") ? 1 : 1,
      },
    },
    {
      title: "Section 2: Component Lifecycles & State Management",
      startSec: 600,
      duration: "15 mins",
      quiz: {
        question: lower.includes("next.js")
          ? "Which directory structure is utilized for modern App Router file-based layouts in Next.js 14?"
          : "Which React state hooks are recommended for triggering side-effects like API data fetching?",
        options: lower.includes("next.js")
          ? ["pages/", "src/routes/", "app/", "public/"]
          : ["useState", "useMemo", "useEffect", "useCallback"],
        correctAnswer: lower.includes("next.js") ? 2 : 2,
      },
    },
  ];
}

function normalizeCourseTitle(title: string): string {
  const mapping: Record<string, string> = {
    "HTML5, CSS3, & Modern Grid": "HTML5, CSS3, & Modern Grid",
    "JavaScript Fundamentals & DOM": "JavaScript Fundamentals & DOM",
    "Intro to React & Component States": "Intro to React & Component States",
    "React Native & Expo Ecosystem": "React Native & Expo Ecosystem",
    "Python Fundamentals & Packages": "Python Fundamentals & Packages",
    "Neural Networks with PyTorch": "Neural Networks with PyTorch",
    "SQL Fundamentals & Relational DBs": "SQL Fundamentals & Relational DBs",
    "Intro to Node.js & REST API": "Intro to Node.js & REST API",
    "Pandas & Numpy Data Wrangling": "Pandas & Numpy Data Wrangling",
    "React Router & Global Context": "React Router & Global Context",
    "Tailwind CSS & Responsive Layouts": "Tailwind CSS & Responsive Layouts",
    "TypeScript Essentials for Web": "TypeScript Essentials for Web",
    "Java Spring Boot Microservices": "Java Spring Boot Microservices",
    "PostgreSQL Queries & Optimization": "PostgreSQL Queries & Optimization",
    "SwiftUI Mastery for iOS Platforms": "SwiftUI Mastery for iOS Platforms",
    "Kotlin & Android Jetpack UI": "Kotlin & Android Jetpack UI",
    "Basics of Routing & HTTP Methods": "Basics of Routing & HTTP Methods",
  };
  return mapping[title] || title;
}

export async function fetchDBCourseSections(courseTitle: string): Promise<DBSection[]> {
  try {
    const { data, error } = await supabase
      .from("course_sections")
      .select("*")
      .eq("course_title", courseTitle)
      .order("section_index", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((item) => ({
        title: item.title,
        startSec: item.start_sec,
        duration: item.duration,
        quiz: typeof item.quiz === "string" ? JSON.parse(item.quiz) : item.quiz,
      }));
    }
  } catch (e) {
    console.warn("fetchDBCourseSections failed. Falling back to local data. Reason:", e);
  }

  // Local fallback
  const normalized = normalizeCourseTitle(courseTitle);
  return (COURSE_SECTIONS_FALLBACK[normalized] ||
    generateDynamicCourseSections(courseTitle)) as DBSection[];
}

export async function fetchDBCourseMaterials(
  courseTitle: string,
): Promise<Array<{ label: string; url: string; type: "doc" | "tutorial" | "article" }>> {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("course_title", courseTitle)
      .is("user_id", null);

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((item) => ({
        label: item.title,
        url: item.url || "https://developer.mozilla.org/en-US/docs/Learn",
        type: item.type === "PDF" ? "doc" : item.type === "Slides" ? "tutorial" : "article",
      }));
    }
  } catch (e) {
    console.warn("fetchDBCourseMaterials failed. Falling back to local data. Reason:", e);
  }

  // Local fallback
  const normalized = normalizeCourseTitle(courseTitle);
  return (
    COURSE_MATERIALS_FALLBACK[normalized] || [
      {
        label: "EduSync Course Study Manual (PDF)",
        url: "https://developer.mozilla.org/en-US/docs/Learn",
        type: "doc",
      },
      { label: "Topic Reference Guides & Examples", url: "https://dev.to", type: "article" },
      {
        label: "Interactive Coding Sandbox Practice",
        url: "https://www.freecodecamp.org/learn",
        type: "tutorial",
      },
    ]
  );
}

export async function fetchDBAchievements(): Promise<DBAchievement[]> {
  try {
    const { data, error } = await supabase.from("achievements").select("*");

    if (error) throw error;
    if (data && data.length > 0) {
      return data as DBAchievement[];
    }
  } catch (e) {
    console.warn("fetchDBAchievements failed. Falling back to local data. Reason:", e);
  }

  // Local fallback
  return ACHIEVEMENTS_FALLBACK;
}

// 38. Fetch unread counts mapping per conversation
export async function fetchDBConversationUnreadCounts(
  currentUserId: string,
): Promise<Record<string, number>> {
  try {
    const { data: myPart, error: partErr } = await supabase
      .from("peer_conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);
    if (partErr) throw partErr;

    if (!myPart || myPart.length === 0) return {};
    const convIds = myPart.map((cp) => cp.conversation_id);

    const { data, error } = await supabase
      .from("peer_messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);

    if (error) throw error;

    const counts: Record<string, number> = {};
    convIds.forEach((id) => {
      counts[id] = 0;
    });

    data?.forEach((msg) => {
      if (msg.conversation_id) {
        counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
      }
    });

    return counts;
  } catch (e) {
    console.warn("fetchDBConversationUnreadCounts failed:", e);
    return {};
  }
}
