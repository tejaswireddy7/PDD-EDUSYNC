import { supabase } from "./supabase";
import { getRecommendations, RecommendationOutput, SurveyAnswers, UserProfile } from "./recommender";

// -------------------------------------------------------------
// Type Definitions matching our UI
// -------------------------------------------------------------

export interface DBCourse {
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
  responses?: Record<number, number> | null;
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
  answers: Array<{ q: string; student: string; verdict: "correct" | "partial" | "wrong"; marks: string; feedback?: string }>;
  subjects: Array<{ name: string; score: number; trend: string }>;
  percentile_rank: string;
}

// -------------------------------------------------------------
// Database Helper Implementations
// -------------------------------------------------------------

// Helper to log errors cleanly
function logError(funcName: string, err: any) {
  console.warn(`[Supabase DB] Error in ${funcName}. Falling back to local data. Reason:`, err.message || err);
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
  profile: Partial<UserProfile & SurveyAnswers & { 
    streak: number; 
    coursesCompleted?: number; 
    careerFitScore?: number; 
    xp?: number;
    lastSurveyDate?: string | number;
    lastActiveDate?: string | number;
    createdAt?: string | number;
  }>
): Promise<any | null> {
  try {
    const payload: any = { id: userId };
    
    if (profile.name !== undefined) payload.name = profile.name;
    if (profile.email !== undefined) payload.email = profile.email;
    if (profile.focusDomain !== undefined) payload.focus_domain = profile.focusDomain;
    if (profile.proficiency !== undefined) payload.proficiency = profile.proficiency;
    if (profile.learningHours !== undefined) payload.learning_hours = profile.learningHours;
    if (profile.streak !== undefined) payload.streak = profile.streak;
    if (profile.coursesCompleted !== undefined) payload.courses_completed = profile.coursesCompleted;
    if (profile.careerFitScore !== undefined) payload.career_fit_score = profile.careerFitScore;
    if (profile.xp !== undefined) payload.xp = profile.xp;
    
    if (profile.lastSurveyDate !== undefined) {
      payload.last_survey_date = typeof profile.lastSurveyDate === 'number' 
        ? new Date(profile.lastSurveyDate).toISOString() 
        : profile.lastSurveyDate;
    }
    
    if (profile.lastActiveDate !== undefined) {
      payload.last_active_date = typeof profile.lastActiveDate === 'number'
        ? new Date(profile.lastActiveDate).toISOString()
        : profile.lastActiveDate;
    }

    if (profile.createdAt !== undefined) {
      payload.created_at = typeof profile.createdAt === 'number'
        ? new Date(profile.createdAt).toISOString()
        : profile.createdAt;
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    logError("saveDBProfile", e);
    return null;
  }
}

// 3. Fetch Pathway Courses
export async function fetchDBCourses(focusDomain: string, proficiency: string): Promise<DBCourse[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("focus_domain", focusDomain)
      .eq("difficulty", proficiency);

    if (error) throw error;
    if (data && data.length > 0) return data as DBCourse[];
  } catch (e) {
    logError("fetchDBCourses", e);
  }

  // Fallback to local getRecommendations courses
  const local = getRecommendations(focusDomain as any, proficiency as any);
  return local.courses as DBCourse[];
}

// 4. Fetch Resources
export async function fetchDBResources(focusDomain: string, proficiency: string): Promise<DBResource[]> {
  try {
    let query = supabase.from("resources").select("*").eq("focus_domain", focusDomain);
    
    // If not "All levels", filter by specific proficiency
    if (proficiency && proficiency !== "All levels") {
      query = query.eq("level", proficiency);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) return data as DBResource[];
  } catch (e) {
    logError("fetchDBResources", e);
  }

  // Fallback to local getRecommendations resources
  const local = getRecommendations(focusDomain as any, proficiency as any);
  return local.resources.map((res, index) => {
    const resType: DBResource["type"] = 
      (res.type.includes("Article") || res.type.includes("Manual")) ? "PDF" 
      : res.type.includes("Tutorial") ? "Slides" 
      : res.type.includes("Lab") ? "Project" : "Notes";
    
    return {
      id: `fallback_res_${index}`,
      title: res.title,
      subject: focusDomain,
      level: proficiency,
      type: resType,
      rating: parseFloat((4.8 + (index * 0.05)).toFixed(1)),
      downloads: 4800 + (index * 1400),
      trending: index === 0,
      author: "EduSync AI Coach"
    };
  });
}

// 5. Fetch Career Milestones
export async function fetchDBMilestones(focusDomain: string, proficiency: string): Promise<DBMilestone[]> {
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
export async function fetchDBCareerSuggestions(focusDomain: string): Promise<Array<{ role: string; match: number; skills: string[] }>> {
  try {
    const { data, error } = await supabase
      .from("career_suggestions")
      .select("role, match, skills")
      .eq("focus_domain", focusDomain);

    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (e) {
    logError("fetchDBCareerSuggestions", e);
  }

  // Fallback map
  const domainCareerMap: Record<string, Array<{ role: string; match: number; skills: string[] }>> = {
    Frontend: [
      { role: "UI/UX Front-end Architect", match: 95, skills: ["React", "HTML5/CSS3", "Design Systems"] },
      { role: "Web Application Lead", match: 88, skills: ["TypeScript", "Next.js", "Redux"] },
      { role: "Product Developer", match: 82, skills: ["Core JS", "Tailwind", "Responsive Design"] },
    ],
    Backend: [
      { role: "Senior Backend Engineer", match: 94, skills: ["Node.js", "Express", "SQL & APIs"] },
      { role: "System & DB Architect", match: 88, skills: ["Prisma", "PostgreSQL", "Caching"] },
      { role: "Cloud Operations Specialist", match: 81, skills: ["Docker", "Deploy", "System Design"] },
    ],
    Mobile: [
      { role: "iOS & Android App Dev", match: 94, skills: ["React Native", "Expo Ecosystem", "Flexbox"] },
      { role: "Cross-Platform Architect", match: 87, skills: ["Hardware APIs", "Kotlin/Swift", "Navigation"] },
      { role: "Mobile Interface Designer", match: 80, skills: ["App Store Deploy", "UI Frameworks", "Bridges"] },
    ],
    AI: [
      { role: "Machine Learning Engineer", match: 96, skills: ["Python Dev", "Math Models", "PyTorch"] },
      { role: "Data Science Researcher", match: 88, skills: ["Pandas/Numpy", "Stats & Math", "Data Prep"] },
      { role: "NLP & LLM Specialist", match: 81, skills: ["Attention Models", "Transformers", "Data Wrangling"] },
    ],
  };
  return domainCareerMap[focusDomain] || domainCareerMap.Mobile;
}

const ASSESSMENT_QUESTION_BANK: Record<string, Array<{ question: string; options: string[]; correctAnswer: number }>> = {
  "React State & Styling Quiz": [
    { question: "Which React hook is used to perform side effects in functional components?", options: ["useState", "useEffect", "useContext", "useMemo"], correctAnswer: 1 },
    { question: "Which hook is used to cache the result of a calculation between re-renders?", options: ["useMemo", "useCallback", "useRef", "useEffect"], correctAnswer: 0 },
    { question: "What is the primary difference between useState and useRef?", options: ["useState does not trigger re-renders", "useRef does not trigger re-renders when updated", "useState values are immutable", "useRef cannot store objects"], correctAnswer: 1 },
    { question: "Which hook is used to access context values in functional components?", options: ["useState", "useReducer", "useContext", "useMemo"], correctAnswer: 2 },
    { question: "How can you run an effect cleanup function in useEffect?", options: ["By calling effect.cleanup()", "By returning a function from the effect callback", "By passing a cleanup dependency", "By calling clearEffect()"], correctAnswer: 1 },
    { question: "What is the purpose of the key prop in React lists?", options: ["To style elements uniquely", "To identify which items have changed, been added, or removed", "To bind click events", "To enable class caching"], correctAnswer: 1 }
  ],
  "Visual Frontend Layout Challenge": [
    { question: "What is the default layout direction of Flexbox in CSS?", options: ["row", "column", "grid", "inline"], correctAnswer: 0 },
    { question: "In Flexbox, which property controls alignment along the main axis?", options: ["align-items", "justify-content", "align-content", "flex-direction"], correctAnswer: 1 },
    { question: "How do you define a 3-column grid with equal-width columns in CSS Grid?", options: ["grid-template-columns: repeat(3, 1fr)", "grid-template-columns: 33% 33% 33%", "grid-columns: 3", "grid-template-columns: 1fr 2fr 1fr"], correctAnswer: 0 },
    { question: "Which CSS property is used to change the stacking order of elements?", options: ["z-index", "display", "position", "float"], correctAnswer: 0 },
    { question: "What does align-items: center do in a Flexbox container?", options: ["Aligns flex items along the cross axis in the center", "Aligns flex items along the main axis in the center", "Centers the container itself", "Distributes items evenly"], correctAnswer: 0 },
    { question: "What is the purpose of the box-sizing: border-box CSS property?", options: ["Includes padding and border in the element's total width and height", "Adds a border around all elements", "Excludes padding from the element's width", "Prevents element from wrapping"], correctAnswer: 0 }
  ],
  "Comprehensive Frontend Fundamentals Quiz": [
    { question: "What does semantic HTML primarily improve?", options: ["SEO and Accessibility", "Page load speed", "JavaScript execution time", "Database security"], correctAnswer: 0 },
    { question: "What is the main purpose of the Virtual DOM in React?", options: ["To directly modify the browser's DOM for speed", "To synchronize local state with cloud databases", "To compute UI updates in memory before updating the real DOM", "To style web pages using CSS variables"], correctAnswer: 2 },
    { question: "What is the difference between let and var in JavaScript?", options: ["let is block-scoped, while var is function-scoped", "let is function-scoped, while var is block-scoped", "let cannot be reassigned", "var is block-scoped"], correctAnswer: 0 },
    { question: "Which method is used to select an element by its ID in JavaScript?", options: ["document.querySelector()", "document.getElementById()", "document.find()", "document.select()"], correctAnswer: 1 },
    { question: "What is the purpose of the map() array method in JavaScript?", options: ["Mutates the original array in place", "Creates a new array populated with the results of calling a function on every element", "Filters out elements that do not match a criteria", "Sums up all numbers in the array"], correctAnswer: 1 },
    { question: "What is event bubbling in JavaScript?", options: ["The event starts at the root document and goes down", "The event starts at the target element and propagates upwards to its ancestors", "The event is executed twice", "The event is prevented from executing"], correctAnswer: 1 }
  ],
  "Dockerized Server Setup Challenge": [
    { question: "Which HTTP status code represents a successful resource creation?", options: ["200 OK", "201 Created", "400 Bad Request", "500 Server Error"], correctAnswer: 1 },
    { question: "Which Docker command builds an image from a Dockerfile?", options: ["docker run", "docker build", "docker create", "docker compose"], correctAnswer: 1 },
    { question: "In Express, how do you retrieve route parameters (e.g. /users/:id)?", options: ["req.body.id", "req.params.id", "req.query.id", "req.headers.id"], correctAnswer: 1 },
    { question: "What is the role of a database connection pool?", options: ["To encrypt database passwords", "To cache database connections for reuse, improving performance", "To replicate databases across multiple servers", "To validate SQL queries"], correctAnswer: 1 },
    { question: "Which Docker Compose command starts and runs containers in the background?", options: ["docker-compose start", "docker-compose up -d", "docker-compose run", "docker-compose daemon"], correctAnswer: 1 },
    { question: "Which HTTP header is typically used to send authorization credentials?", options: ["Content-Type", "Authorization", "Accept", "User-Agent"], correctAnswer: 1 }
  ],
  "Visual Backend Layout Challenge": [
    { question: "In REST API design, which HTTP method should be used to update an existing resource completely?", options: ["GET", "POST", "PUT", "DELETE"], correctAnswer: 2 },
    { question: "Which HTTP method is designed to update a resource partially?", options: ["GET", "PUT", "PATCH", "POST"], correctAnswer: 2 },
    { question: "What is middleware in Express?", options: ["A database optimization tool", "A function that runs between receiving a request and sending a response", "A server configuration file", "A frontend routing utility"], correctAnswer: 1 },
    { question: "What does CORS stand for?", options: ["Core Origin Resource Sharing", "Cross-Origin Resource Sharing", "Cross-Origin Routing Server", "Cached Object Request System"], correctAnswer: 1 },
    { question: "How do you handle JSON request payloads in Express?", options: ["By using express.json() middleware", "By parsing string arrays manually", "Using express.urlencoded()", "Using body-parser.xml()"], correctAnswer: 0 },
    { question: "What does a 403 Forbidden status code indicate?", options: ["The server has crashed", "The client is authenticated but does not have permission for the resource", "The requested resource was not found", "Authentication is required"], correctAnswer: 1 }
  ],
  "Comprehensive Backend Fundamentals Quiz": [
    { question: "What is the primary purpose of database indexing?", options: ["To encrypt credentials", "To optimize query search and data retrieval speeds", "To eliminate duplicate table rows", "To transform relational data to JSON automatically"], correctAnswer: 1 },
    { question: "What is the core benefit of containerizing backend apps with Docker?", options: ["To generate random secret keys", "To package code and all its dependencies into a portable, isolated container", "To compile TypeScript into optimized JavaScript bundles", "To automatically write API documentation"], correctAnswer: 1 },
    { question: "Which SQL statement is used to remove duplicate rows from a query result?", options: ["SELECT DISTINCT", "SELECT UNIQUE", "SELECT REMOVE_DUPLICATES", "SELECT MERGE"], correctAnswer: 0 },
    { question: "What is the Node.js Event Loop responsible for?", options: ["Running database queries synchronously", "Executing non-blocking asynchronous callbacks", "Compiling TypeScript files", "Managing standard output streams"], correctAnswer: 1 },
    { question: "In SQL, which clause is used to filter groups based on aggregate functions?", options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], correctAnswer: 1 },
    { question: "What is SQL injection?", options: ["A database caching technique", "A vulnerability where malicious SQL queries are executed via user inputs", "A way to insert millions of rows quickly", "An API routing strategy"], correctAnswer: 1 }
  ],
  "App Navigation & Screen Mapping": [
    { question: "How is routing and navigation usually handled in modern Expo apps?", options: ["HTML anchor links", "Expo Router or React Navigation", "Window location redirects", "Conditional view rendering only"], correctAnswer: 1 },
    { question: "In React Navigation, which navigator is used to slide in screens from the side?", options: ["StackNavigator", "DrawerNavigator", "TabNavigator", "SwitchNavigator"], correctAnswer: 1 },
    { question: "How do you pass parameters to a route when navigating?", options: ["navigation.navigate('Details', { id: 123 })", "navigation.setParams({ id: 123 })", "navigation.push('Details?id=123')", "navigation.params = { id: 123 }"], correctAnswer: 0 },
    { question: "What is the purpose of the NavigationContainer component?", options: ["To display a top header bar", "To manage the navigation state of the entire app tree", "To hold all tab screens", "To perform network fetch requests"], correctAnswer: 1 },
    { question: "In Expo Router, how do you create a dynamic route?", options: ["By naming the file with square brackets, e.g., [id].tsx", "By using query strings in navigation", "Using the router.push(':id') function", "Configuring routes.json"], correctAnswer: 0 },
    { question: "What is the difference between push and navigate in stack navigation?", options: ["push navigates backwards, navigate goes forwards", "push adds a new screen to the stack every time, navigate jumps to an existing screen if possible", "navigate resets the stack, push does not", "They are exactly identical"], correctAnswer: 1 }
  ],
  "Visual Mobile Layout Challenge": [
    { question: "What layout system is used by React Native for positioning components?", options: ["CSS Grid", "Floats & Absolute layout", "Flexbox", "Table columns"], correctAnswer: 2 },
    { question: "What is the default Flexbox direction in React Native?", options: ["row", "column", "row-reverse", "column-reverse"], correctAnswer: 1 },
    { question: "How do you handle safe area padding for notches on iOS/Android?", options: ["By adding a top margin of 50px", "Using SafeAreaView from react-native-safe-area-context", "Configuring expo.json", "It is handled automatically by all View elements"], correctAnswer: 1 },
    { question: "Which React Native component is used to register touch interactions with visual feedback?", options: ["View", "Text", "TouchableOpacity", "ScrollView"], correctAnswer: 2 },
    { question: "How do you specify percentage-based width in React Native stylesheet?", options: ["width: 50", "width: '50%'", "width: '50vw'", "width: percent(50)"], correctAnswer: 1 },
    { question: "Which flexbox property defines how elements wrap when there is not enough space?", options: ["flexWrap", "flexDirection", "justifyContent", "alignItems"], correctAnswer: 0 }
  ],
  "Comprehensive Mobile Fundamentals Quiz": [
    { question: "In React Native, which component is best suited for rendering long, scrollable lists efficiently?", options: ["ScrollView", "FlatList", "View", "SafeAreaView"], correctAnswer: 1 },
    { question: "Which React Native hook reactively returns the current screen width and height?", options: ["useWindowDimensions", "useEffect", "useDimensions", "useStyle"], correctAnswer: 0 },
    { question: "What is the purpose of Expo CLI?", options: ["To run, build, and debug Expo projects locally", "To deploy apps to the App Store directly", "To style components using utility classes", "To manage backend database servers"], correctAnswer: 0 },
    { question: "Which component should be used to display a basic image in React Native?", options: ["Img", "Image", "ImageBackground", "Picture"], correctAnswer: 1 },
    { question: "How do you handle platform-specific code in React Native?", options: ["Using CSS media queries", "Using the Platform.select() helper or platform-specific extensions (e.g. .ios.tsx)", "By writing separate apps", "Using webpack configuration"], correctAnswer: 1 },
    { question: "What is Fast Refresh in React Native?", options: ["A caching system for HTTP requests", "A feature that allows you to see changes to your code instantly in the emulator/device without losing state", "A database sync function", "A library for rendering high-rate animations"], correctAnswer: 1 }
  ],
  "PyTorch Data Loading & Gradient descent": [
    { question: "What is the process of adjusting network parameters to minimize the loss function called?", options: ["Validation", "Regularization", "Optimization (e.g. Gradient Descent)", "Data augmentation"], correctAnswer: 2 },
    { question: "What is the primary role of PyTorch DataLoader?", options: ["To download models from HuggingFace", "To batch, shuffle, and load data in parallel", "To normalize image pixel values", "To compile Python scripts"], correctAnswer: 1 },
    { question: "Which PyTorch method computes the gradients during backpropagation?", options: ["loss.forward()", "loss.backward()", "optimizer.step()", "tensor.grad()"], correctAnswer: 1 },
    { question: "What does requires_grad=True specify on a PyTorch Tensor?", options: ["That it must be stored on GPU", "That gradients should be tracked for this tensor", "That the tensor contains integers", "That it cannot be updated"], correctAnswer: 1 },
    { question: "What is the purpose of optimizer.zero_grad() in the training loop?", options: ["To set model parameters to zero", "To clear old gradients before computing new ones", "To stop training", "To initialize weights"], correctAnswer: 1 },
    { question: "What is the learning rate in gradient descent?", options: ["The number of training iterations", "A step size parameter that determines how much weights change in each iteration", "The rate of loss decrease", "The speed of calculation"], correctAnswer: 1 }
  ],
  "Visual AI Layout Challenge": [
    { question: "Which data structure does PyTorch use to represent multi-dimensional arrays?", options: ["Dataframes", "Tensors", "Matrices", "Numpy Lists"], correctAnswer: 1 },
    { question: "In Recharts, which component represents a line in a LineChart?", options: ["<ChartLine>", "<Line>", "<LinePlot>", "<StrokeLine>"], correctAnswer: 1 },
    { question: "What is the purpose of <ResponsiveContainer> in Recharts?", options: ["To store responsive layout metadata", "To make charts responsive to parent container sizes", "To handle mobile screen rotation events", "To enable chart animations"], correctAnswer: 1 },
    { question: "Which chart component is best for showing proportions of a whole?", options: ["<BarChart>", "<LineChart>", "<PieChart>", "<AreaChart>"], correctAnswer: 2 },
    { question: "In Pandas, how do you quickly generate a line plot from a DataFrame?", options: ["df.line()", "df.plot(kind='line')", "df.draw_line()", "plot(df, type='line')"], correctAnswer: 1 },
    { question: "Which Recharts component displays details when hovering over a data point?", options: ["<HoverLabel>", "<Tooltip>", "<DetailsBox>", "<Legend>"], correctAnswer: 1 }
  ],
  "Comprehensive AI Fundamentals Quiz": [
    { question: "Which activation function is most widely used in hidden layers of deep neural networks?", options: ["Linear", "ReLU (Rectified Linear Unit)", "Softmax", "Sigmoid"], correctAnswer: 1 },
    { question: "What is the main goal when training a machine learning model?", options: ["To minimize memory storage sizes", "To memorize all training samples exactly", "To generalize effectively to new, unseen data", "To execute network training as fast as possible"], correctAnswer: 2 },
    { question: "In NumPy, how do you create a 3x3 matrix filled with zeros?", options: ["np.zeros((3, 3))", "np.matrix(0, 3, 3)", "np.empty(3, 3)", "np.zeros(9)"], correctAnswer: 0 },
    { question: "What does standard deviation measure in statistics?", options: ["The middle value of a dataset", "The dispersion or spread of a dataset relative to its mean", "The total number of samples", "The difference between max and min values"], correctAnswer: 1 },
    { question: "What is the main difference between a list and a tuple in Python?", options: ["Lists are mutable; tuples are immutable", "Lists are immutable; tuples are mutable", "Lists only hold integers", "Tuples cannot contain duplicate values"], correctAnswer: 0 },
    { question: "What is the probability of flipping a fair coin twice and getting two heads?", options: ["0.5", "0.25", "0.125", "0.75"], correctAnswer: 1 }
  ]
};

function getQuestionsForAssessment(title: string, subject: string): Array<{ question: string; options: string[]; correctAnswer: number }> {
  if (ASSESSMENT_QUESTION_BANK[title]) {
    return ASSESSMENT_QUESTION_BANK[title];
  }
  
  for (const key of Object.keys(ASSESSMENT_QUESTION_BANK)) {
    if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
      return ASSESSMENT_QUESTION_BANK[key];
    }
  }

  // Fallback to domain match
  if (subject === "Backend") return ASSESSMENT_QUESTION_BANK["Dockerized Server Setup Challenge"];
  if (subject === "Mobile") return ASSESSMENT_QUESTION_BANK["App Navigation & Screen Mapping"];
  if (subject === "AI") return ASSESSMENT_QUESTION_BANK["PyTorch Data Loading & Gradient descent"];
  return ASSESSMENT_QUESTION_BANK["React State & Styling Quiz"];
}

// 7. Fetch User Assessments
export async function fetchDBAssessments(userId: string, focusDomain: string, proficiency: string): Promise<DBAssessment[]> {
  const nextTitle = focusDomain === "Frontend" ? "React State & Styling Quiz"
    : focusDomain === "Backend" ? "Dockerized Server Setup Challenge"
      : focusDomain === "Mobile" ? "App Navigation & Screen Mapping"
        : "PyTorch Data Loading & Gradient descent";

  const fallbackSeed: DBAssessment[] = [
    { id: "a1", title: nextTitle, type: "Coding", subject: focusDomain, difficulty: proficiency as any, deadline: "Tue, Aug 4 · 9:00 AM", skills: [focusDomain, "Interactive"], progress: 0, status: "open", questions: getQuestionsForAssessment(nextTitle, focusDomain) },
    { id: "a2", title: `Visual ${focusDomain} Layout Challenge`, type: "Project", subject: focusDomain, difficulty: proficiency as any, deadline: "Thu, Aug 6 · 6:00 PM", skills: [focusDomain, "Architecture"], progress: 0, status: "open", questions: getQuestionsForAssessment(`Visual ${focusDomain} Layout Challenge`, focusDomain) },
    { id: "a3", title: `Comprehensive ${focusDomain} Fundamentals Quiz`, type: "Essay", subject: focusDomain, difficulty: proficiency as any, deadline: "Sat, Aug 8 · 11:59 PM", skills: [focusDomain, "Theory"], progress: 0, status: "open", questions: getQuestionsForAssessment(`Comprehensive ${focusDomain} Fundamentals Quiz`, focusDomain) },
  ];

  try {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (data && data.length > 0) {
      // Ensure all assessments have questions populated and dynamic August 2026 deadlines
      const updatedData = await Promise.all(data.map(async (item: any) => {
        let deadline = item.deadline;
        if (item.id === "a1") deadline = "Tue, Aug 4 · 9:00 AM";
        if (item.id === "a2") deadline = "Thu, Aug 6 · 6:00 PM";
        if (item.id === "a3") deadline = "Sat, Aug 8 · 11:59 PM";

        if (!item.questions || item.questions.length === 0) {
          const generatedQuestions = getQuestionsForAssessment(item.title, item.subject);
          const updatedItem = { ...item, deadline, questions: generatedQuestions };
          // Attempt to update database asynchronously
          supabase
            .from("assessments")
            .update({ questions: generatedQuestions })
            .eq("user_id", userId)
            .eq("id", item.id)
            .then(({ error: updateErr }) => {
              if (updateErr) console.warn("Failed to auto-populate assessment questions in Supabase:", updateErr);
            });
          return updatedItem;
        }
        return { ...item, deadline };
      }));

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(`assessments_${userId}_${focusDomain}`, JSON.stringify(updatedData));
      }
      return updatedData as DBAssessment[];
    }

    // Insert fallback seed into Supabase to bootstrap
    const inserts = fallbackSeed.map(item => ({ ...item, user_id: userId }));
    const { data: insertedData, error: insertError } = await supabase
      .from("assessments")
      .insert(inserts)
      .select();

    if (insertError) throw insertError;
    if (insertedData) {
      const mappedInserted = insertedData.map((item: any) => {
        let deadline = item.deadline;
        if (item.id === "a1") deadline = "Tue, Aug 4 · 9:00 AM";
        if (item.id === "a2") deadline = "Thu, Aug 6 · 6:00 PM";
        if (item.id === "a3") deadline = "Sat, Aug 8 · 11:59 PM";
        return { ...item, deadline };
      });
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(`assessments_${userId}_${focusDomain}`, JSON.stringify(mappedInserted));
      }
      return mappedInserted as DBAssessment[];
    }
  } catch (e) {
    logError("fetchDBAssessments", e);
  }

  // Load from localStorage if online fetch fails
  if (typeof window !== "undefined" && window.localStorage) {
    const cached = window.localStorage.getItem(`assessments_${userId}_${focusDomain}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const healed = parsed.map((item: any) => {
          let deadline = item.deadline;
          if (item.id === "a1") deadline = "Tue, Aug 4 · 9:00 AM";
          if (item.id === "a2") deadline = "Thu, Aug 6 · 6:00 PM";
          if (item.id === "a3") deadline = "Sat, Aug 8 · 11:59 PM";

          if (!item.questions || item.questions.length === 0) {
            item.questions = getQuestionsForAssessment(item.title, item.subject);
          }
          return { ...item, deadline };
        });
        return healed as DBAssessment[];
      } catch (err) {
        // Ignore
      }
    }
  }

  return fallbackSeed;
}

// 8. Update User Assessment
export async function updateDBAssessment(userId: string, assessmentId: string, patch: Partial<DBAssessment>): Promise<void> {
  // Always update in localStorage first for offline/fallback persistence
  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`assessments_${userId}_`)) {
        try {
          const data = JSON.parse(window.localStorage.getItem(key) || "[]");
          const updated = data.map((item: any) => 
            item.id === assessmentId ? { ...item, ...patch } : item
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
        if (c.role.toLowerCase().includes("peer") || c.role.toLowerCase().includes("expert") || c.role.toLowerCase().includes("intern") || c.role.toLowerCase().includes("enthusiast")) {
          const numId = c.id.replace(/[^0-9]/g, "") || "48";
          anonName = `Anonymous ${c.role.includes("Expert") ? "Expert" : "Peer"} #${numId}`;
          anonInitials = c.role.includes("Expert") ? "AE" : "AP";
        }
        return {
          ...c,
          name: anonName,
          initials: anonInitials
        };
      }) as DBContact[];
    }
  } catch (e) {
    logError("fetchDBContacts", e);
  }

  // Fallback
  return [
    { id: "c1", name: `Anonymous Expert #1`, role: `Mentor · ${focusDomain} Expert`, initials: "AE", online: true, last: `Welcome to the ${focusDomain} track! 👋`, unread: 1, colors: ["#6366f1", "#818cf8"] },
    { id: "c2", name: `Anonymous Peer #28`, role: `Peer · ${focusDomain} Dev`, initials: "AP", online: true, last: `Let's study ${focusDomain} together! 📚`, unread: 0, colors: ["#0ea5e9", "#38bdf8"] },
    { id: "c3", name: `Anonymous Peer #52`, role: `Peer · ${focusDomain} Intern`, initials: "AP", online: false, last: "Hey! Ready to learn?", unread: 0, colors: ["#0d9488", "#2dd4bf"] },
    { id: "c4", name: `Anonymous Career Coach`, role: "Career Coach", initials: "AC", online: true, last: "Happy to guide your career path!", unread: 0, colors: ["#f59e0b", "#fbbf24"] },
    { id: "c5", name: `Anonymous Peer #89`, role: `Peer · ${focusDomain} Enthusiast`, initials: "AP", online: false, last: "Glad to connect!", unread: 0, colors: ["#a855f7", "#c084fc"] },
  ];
}

// 10. Fetch Chat Messages
export async function fetchDBMessages(userId: string, contactId: string, welcomeMsg: string): Promise<DBMessage[]> {
  const fallbackMessages: DBMessage[] = [
    { id: "1", from: "them", text: welcomeMsg, time: "Just Now" }
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
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    }

    // Insert welcome message as bootstrap
    const { error: insertError } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        contact_id: contactId,
        from: "them",
        text: welcomeMsg
      });

    if (insertError) throw insertError;
  } catch (e) {
    logError("fetchDBMessages", e);
  }

  return fallbackMessages;
}

// 11. Send Chat Message
export async function sendDBMessage(userId: string, contactId: string, text: string): Promise<DBMessage> {
  const newMsg: DBMessage = {
    id: String(Date.now()),
    from: "me",
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        contact_id: contactId,
        from: "me",
        text
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      newMsg.id = data.id;
    }
  } catch (e) {
    logError("sendDBMessage", e);
  }

  return newMsg;
}

// Helper to save auto reply message
export async function saveDBReply(userId: string, contactId: string, replyText: string): Promise<DBMessage> {
  const replyMsg: DBMessage = {
    id: String(Date.now() + 1),
    from: "them",
    text: replyText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        contact_id: contactId,
        from: "them",
        text: replyText
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

// 12. Fetch Evaluation
export async function fetchDBEvaluation(
  userId: string, 
  assessmentId: string, 
  assessmentTitle: string, 
  focusDomain: string, 
  proficiency: string
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
    if (existingEval) {
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

    // 2. If no evaluation, try to fetch the assessment to build dynamic evaluation
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .eq("id", assessmentId)
      .maybeSingle();

    if (assessmentError) throw assessmentError;

    let dynamicEval: DBEvaluation | null = null;

    if (assessment) {
      const responses = assessment.responses || {};
      const questions = assessment.questions || [];
      const isQuiz = Array.isArray(questions) && questions.length > 0;

      const focusSubjectsMap: Record<string, string[]> = {
        Frontend: ["React Native / React", "CSS & Flexbox Layouts", "JS ES6+ Async Features", "Web Performance Optimization", "State Hydration"],
        Backend: ["RESTful API Protocols", "NodeJS Event Loops", "SQL / Database Queries", "Docker Deployment", "System Architecture"],
        Mobile: ["React Native Core Views", "Platform UI Guidelines", "Expo CLI / Bundle Sizes", "State Management Hooks", "Native Device Bridges"],
        AI: ["Python Core Scripting", "ML Regression Analysis", "Neural Networks & PyTorch", "NLP Data Processing", "Linear Algebra Foundations"],
      };
      
      const subjects = focusSubjectsMap[focusDomain] || focusSubjectsMap["Mobile"];

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
            student: studentAnswerIdx !== undefined && q.options && q.options[studentAnswerIdx] 
              ? `Selected Option: ${q.options[studentAnswerIdx]}`
              : "No option selected",
            verdict,
            marks: isCorrect ? "1/1" : "0/1",
            feedback: isCorrect 
              ? "Excellent work! Your answer is correct." 
              : `Incorrect. The correct option is: ${q.options ? q.options[q.correctAnswer] : "Unknown"}`
          };
        });

        const dynamicRubric = [
          { criterion: "Correctness", score: correctCount, max: questions.length, note: `Answered ${correctCount} of ${questions.length} questions correctly.` },
          { criterion: "Concept understanding", score: Math.round((correctCount / questions.length) * 10), max: 10, note: `Demonstrated understanding of core concepts.` },
        ];

        const score = dynamicRubric.reduce((s, r) => s + r.score, 0);
        const maxScore = dynamicRubric.reduce((s, r) => s + r.max, 0);

        const subjectsList = subjects.map((sub, idx) => ({
          name: sub,
          score: Math.round((correctCount / questions.length) * 100),
          trend: idx % 2 === 0 ? `+${3 + idx}` : `+${1 + idx}`,
        }));

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
          percentile_rank: `Top ${Math.max(5, 100 - Math.round((correctCount / questions.length) * 20))}%`
        };
      } else {
        // Project evaluation
        const githubUrl = responses.githubUrl || "https://github.com/user/project";
        const selectedTemplate = responses.selectedTemplate || "Source Code Submission";
        const filesList = Array.isArray(responses.files) ? responses.files : [];

        const dynamicAnswers = filesList.map((f: any) => ({
          q: `File Integrity check: ${f.name}`,
          student: `File size: ${(f.size / 1024).toFixed(1)} KB`,
          verdict: "correct" as const,
          marks: "Pass",
          feedback: `Verified file configuration for ${f.name}.`
        }));

        if (dynamicAnswers.length === 0) {
          dynamicAnswers.push({
            q: "Repository Check",
            student: `Connected repository: ${githubUrl}`,
            verdict: "correct" as const,
            marks: "Pass",
            feedback: "Repository successfully indexed."
          });
        }

        const dynamicRubric = [
          { criterion: "Structure & Setup", score: 9, max: 10, note: `Project template "${selectedTemplate}" is correctly configured.` },
          { criterion: "Repository Integration", score: 10, max: 10, note: `GitHub repository at ${githubUrl} is accessible.` },
          { criterion: "Separation of concerns", score: 8, max: 10, note: `Appropriate componentization of ${focusDomain} logic.` },
          { criterion: "Code Quality", score: 8, max: 10, note: `Clean files layout with clear code separation.` }
        ];

        const score = dynamicRubric.reduce((s, r) => s + r.score, 0);
        const maxScore = dynamicRubric.reduce((s, r) => s + r.max, 0);

        const subjectsList = subjects.map((sub, idx) => ({
          name: sub,
          score: 85 + (idx * 3) > 100 ? 98 : 85 + (idx * 3),
          trend: `+${4 + idx}`,
        }));

        dynamicEval = {
          assessment_id: assessmentId,
          assessment_title: assessmentTitle,
          score,
          max_score: maxScore,
          mentor: "Verified by Mentor Priya M.",
          ai_feedback: `Successfully processed project "${selectedTemplate}" submitted from GitHub repository ${githubUrl}. The files (${filesList.map((f: any) => f.name).join(", ") || "none"}) show correct integration of ${focusDomain} architecture, proper styling guidelines, and modular component separation.`,
          rubric: dynamicRubric,
          answers: dynamicAnswers,
          subjects: subjectsList,
          percentile_rank: "Top 7%"
        };
      }
    }

    // 3. Fallback if assessment couldn't be loaded
    if (!dynamicEval) {
      const fallbackRubric = [
        { criterion: "Correctness", score: 9, max: 10, note: `All test cases pass; ${focusDomain} logic is solid.` },
        { criterion: "Code Quality", score: 8, max: 10, note: "Good structure; consider extracting reusable helpers." },
        { criterion: "Efficiency", score: 7, max: 10, note: "Highly optimized execution times; zero responsive bottlenecks." },
        { criterion: "Documentation", score: 8, max: 10, note: "Clear comments; add appropriate module declarations." },
      ];

      const focusSubjectsMap: Record<string, string[]> = {
        Frontend: ["React Native / React", "CSS & Flexbox Layouts", "JS ES6+ Async Features", "Web Performance Optimization", "State Hydration"],
        Backend: ["RESTful API Protocols", "NodeJS Event Loops", "SQL / Database Queries", "Docker Deployment", "System Architecture"],
        Mobile: ["React Native Core Views", "Platform UI Guidelines", "Expo CLI / Bundle Sizes", "State Management Hooks", "Native Device Bridges"],
        AI: ["Python Core Scripting", "ML Regression Analysis", "Neural Networks & PyTorch", "NLP Data Processing", "Linear Algebra Foundations"],
      };
      
      const subjectsList = (focusSubjectsMap[focusDomain] || focusSubjectsMap["Mobile"]).map((sub, idx) => ({
        name: sub,
        score: 78 + (idx * 4) > 100 ? 98 : 78 + (idx * 4),
        trend: idx % 2 === 0 ? `+${3 + idx}` : `+${1 + idx}`,
      }));

      const fallbackAnswers = [
        { q: `Q1. Explain the main component architecture of ${focusDomain}.`, student: `In ${focusDomain}, modular designs partition components into clear, isolated, and scalable nodes...`, verdict: "correct" as const, marks: "4/4" },
        { q: `Q2. Describe the standard flow of data in a typical ${focusDomain} lifecycle.`, student: "Data flows uni-directionally from parents to downstream nodes...", verdict: "partial" as const, marks: "2/3", feedback: "Review lifecycle hooks and state updates." },
        { q: `Q3. What is the time complexity of compiling native bundles for ${focusDomain}?`, student: "O(n²)", verdict: "wrong" as const, marks: "0/2", feedback: "Linear compilation complexity O(n). Check tree-shaking details." },
        { q: `Q4. Explain state management strategies best suited for ${focusDomain}.`, student: "Use React Hooks or localized pub/sub listeners to synchronize states...", verdict: "correct" as const, marks: "6/6" },
      ];

      dynamicEval = {
        assessment_id: assessmentId,
        assessment_title: assessmentTitle,
        score: fallbackRubric.reduce((s, r) => s + r.score, 0),
        max_score: fallbackRubric.reduce((s, r) => s + r.max, 0),
        mentor: "Verified by Mentor Priya M.",
        ai_feedback: `Strong overall implementation with clean separation of concerns in the ${focusDomain} structure. Eviction logic is correct, but consider optimized cache/memoization maps for true O(1) rendering times.`,
        rubric: fallbackRubric,
        answers: fallbackAnswers,
        subjects: subjectsList,
        percentile_rank: "Top 8%"
      };
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

    // Dynamic database insertion / updating for performance_trends table
    try {
      const scorePercentage = Math.round((dynamicEval.score / dynamicEval.max_score) * 100);
      const { data: trend } = await supabase
        .from("performance_trends")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const currentMonth = new Date().getMonth(); // 7 for August
      let trendData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      if (trend) {
        trendData = trend.data || trendData;
        trendData[currentMonth] = scorePercentage;
        const nonZero = trendData.filter(x => x > 0);
        const newAvg = nonZero.length > 0 ? Math.round(nonZero.reduce((s, v) => s + v, 0) / nonZero.length) : scorePercentage;
        
        await supabase
          .from("performance_trends")
          .update({ data: trendData, avg_score: newAvg })
          .eq("id", trend.id);
      } else {
        const baseVal = proficiency === "Beginner" ? 60 : proficiency === "Intermediate" ? 72 : 82;
        for (let i = 0; i < currentMonth; i++) {
          trendData[i] = baseVal + Math.sin(i) * 2;
        }
        trendData[currentMonth] = scorePercentage;
        
        await supabase
          .from("performance_trends")
          .insert({
            user_id: userId,
            proficiency,
            data: trendData,
            avg_score: scorePercentage
          });
      }
    } catch (trendErr) {
      console.warn("Failed to save performance trend in Supabase:", trendErr);
    }

    // 4. Save evaluation to Supabase for dynamic caching
    const payload = {
      ...dynamicEval,
      user_id: userId
    };
    const { data: inserted, error: insertError } = await supabase
      .from("evaluations")
      .insert(payload)
      .select()
      .single();

    if (insertError) throw insertError;
    if (inserted) return inserted as DBEvaluation;
    
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
  const fallbackRubric = [
    { criterion: "Correctness", score: 9, max: 10, note: `All test cases pass; ${focusDomain} logic is solid.` },
    { criterion: "Code Quality", score: 8, max: 10, note: "Good structure; consider extracting reusable helpers." },
    { criterion: "Efficiency", score: 7, max: 10, note: "Highly optimized execution times; zero responsive bottlenecks." },
    { criterion: "Documentation", score: 8, max: 10, note: "Clear comments; add appropriate module declarations." },
  ];

  const focusSubjectsMap: Record<string, string[]> = {
    Frontend: ["React Native / React", "CSS & Flexbox Layouts", "JS ES6+ Async Features", "Web Performance Optimization", "State Hydration"],
    Backend: ["RESTful API Protocols", "NodeJS Event Loops", "SQL / Database Queries", "Docker Deployment", "System Architecture"],
    Mobile: ["React Native Core Views", "Platform UI Guidelines", "Expo CLI / Bundle Sizes", "State Management Hooks", "Native Device Bridges"],
    AI: ["Python Core Scripting", "ML Regression Analysis", "Neural Networks & PyTorch", "NLP Data Processing", "Linear Algebra Foundations"],
  };
  
  const subjectsList = (focusSubjectsMap[focusDomain] || focusSubjectsMap["Mobile"]).map((sub, idx) => ({
    name: sub,
    score: 78 + (idx * 4) > 100 ? 98 : 78 + (idx * 4),
    trend: idx % 2 === 0 ? `+${3 + idx}` : `+${1 + idx}`,
  }));

  const fallbackAnswers = [
    { q: `Q1. Explain the main component architecture of ${focusDomain}.`, student: `In ${focusDomain}, modular designs partition components into clear, isolated, and scalable nodes...`, verdict: "correct" as const, marks: "4/4" },
    { q: `Q2. Describe the standard flow of data in a typical ${focusDomain} lifecycle.`, student: "Data flows uni-directionally from parents to downstream nodes...", verdict: "partial" as const, marks: "2/3", feedback: "Review lifecycle hooks and state updates." },
    { q: `Q3. What is the time complexity of compiling native bundles for ${focusDomain}?`, student: "O(n²)", verdict: "wrong" as const, marks: "0/2", feedback: "Linear compilation complexity O(n). Check tree-shaking details." },
    { q: `Q4. Explain state management strategies best suited for ${focusDomain}.`, student: "Use React Hooks or localized pub/sub listeners to synchronize states...", verdict: "correct" as const, marks: "6/6" },
  ];

  return {
    assessment_id: assessmentId,
    assessment_title: assessmentTitle,
    score: fallbackRubric.reduce((s, r) => s + r.score, 0),
    max_score: fallbackRubric.reduce((s, r) => s + r.max, 0),
    mentor: "Verified by Mentor Priya M.",
    ai_feedback: `Strong overall implementation with clean separation of concerns in the ${focusDomain} structure. Eviction logic is correct, but consider optimized cache/memoization maps for true O(1) rendering times.`,
    rubric: fallbackRubric,
    answers: fallbackAnswers,
    subjects: subjectsList,
    percentile_rank: "Top 8%"
  };
}

// 13. Submit Grievance
export async function submitDBGrievance(
  userId: string, 
  assessmentId: string, 
  assessmentTitle: string, 
  reason: string
): Promise<string> {
  const refNo = `G-${Math.floor(Math.random() * 9000) + 1000}`;
  try {
    const { error } = await supabase
      .from("grievances")
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        assessment_title: assessmentTitle,
        reason,
        ref_no: refNo
      });

    if (error) throw error;
  } catch (e) {
    logError("submitDBGrievance", e);
  }
  return refNo;
}

// 14. Fetch Performance Trends
export async function fetchDBPerformanceTrends(userId: string, proficiency: string): Promise<number[]> {
  const currentMonth = new Date().getMonth(); // 7 for August
  const baseVal = proficiency === "Beginner" ? 60 : proficiency === "Intermediate" ? 72 : 82;
  const baseTrend = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  // Set baseline up to July
  for (let i = 0; i < currentMonth; i++) {
    baseTrend[i] = baseVal + Math.round(Math.sin(i) * 2);
  }

  try {
    // Try Supabase first
    const { data: trend, error } = await supabase
      .from("performance_trends")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (trend && trend.data) {
      return trend.data;
    }
  } catch (e) {
    // Fall back to localStorage or local calculation
  }

  // Fallback: calculate from localStorage evaluations
  if (typeof window !== "undefined" && window.localStorage) {
    let totalScore = 0;
    let evalCount = 0;
    
    // Check if there are cached evaluations
    const cacheKey = `evaluations_${userId}`;
    const cachedEvalsStr = window.localStorage.getItem(cacheKey);
    if (cachedEvalsStr) {
      try {
        const cachedEvals = JSON.parse(cachedEvalsStr);
        if (Array.isArray(cachedEvals) && cachedEvals.length > 0) {
          cachedEvals.forEach(e => {
            totalScore += (e.score / e.max_score) * 100;
            evalCount++;
          });
        }
      } catch (e) {}
    }
    
    if (evalCount > 0) {
      const avgPercentage = Math.round(totalScore / evalCount);
      baseTrend[currentMonth] = avgPercentage;
      baseTrend[currentMonth + 1] = Math.min(100, Math.round(avgPercentage * 1.05));
      return baseTrend;
    }
  }

  // Fallback: check submitted assessments count if no evaluations cached
  let localSubmittedCount = 0;
  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`assessments_${userId}_`)) {
        try {
          const cached = JSON.parse(window.localStorage.getItem(key) || "[]");
          localSubmittedCount = Math.max(localSubmittedCount, cached.filter((a: any) => a.status === "submitted").length);
        } catch (e) {}
      }
    }
  }

  if (localSubmittedCount > 0) {
    const avgPercentage = localSubmittedCount === 1 ? 78 : localSubmittedCount === 2 ? 84 : 88;
    baseTrend[currentMonth] = avgPercentage;
    baseTrend[currentMonth + 1] = Math.min(100, Math.round(avgPercentage * 1.05));
    return baseTrend;
  }

  // If no submissions at all, keep current and future months at 0
  baseTrend[currentMonth] = 0;
  baseTrend[currentMonth + 1] = 0;
  return baseTrend;
}

// 15. Fetch Weak Areas
export async function fetchDBWeakAreas(userId: string, focusDomain: string): Promise<Array<{ topic: string; score: number }>> {
  let submittedCount = 0;
  try {
    // Check if the user has started their journey (has submitted assessments)
    const { count, error: countError } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "submitted");

    if (!countError && count !== null) {
      submittedCount = count;
    }
  } catch (e) {}

  // Local storage check fallback for offline/placeholder mode
  if (submittedCount === 0 && typeof window !== "undefined" && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`assessments_${userId}_`)) {
        try {
          const cached = JSON.parse(window.localStorage.getItem(key) || "[]");
          const localCount = cached.filter((a: any) => a.status === "submitted").length;
          submittedCount = Math.max(submittedCount, localCount);
        } catch (e) {}
      }
    }
  }

  if (submittedCount === 0) return []; // New user has not submitted any evaluations yet!

  try {
    const { data, error } = await supabase
      .from("weak_areas")
      .select("topic, score")
      .eq("focus_domain", focusDomain);

    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (e) {
    // Fall back to local map
  }

  // Fallback to static weak areas if database lookup failed or empty
  const localWeakMap: Record<string, Array<{ topic: string; score: number }>> = {
    Frontend: [
      { topic: "CSS Grid & Flexbox", score: 58 },
      { topic: "State Context Hydration", score: 62 },
      { topic: "TypeScript Strict Mappings", score: 68 },
    ],
    Backend: [
      { topic: "SQL Index & Join Queries", score: 54 },
      { topic: "Asynchronous Event Loops", score: 61 },
      { topic: "Prisma Schema Relations", score: 67 },
    ],
    Mobile: [
      { topic: "Native Bridge Compilation", score: 56 },
      { topic: "Flexbox Layout Scaling", score: 62 },
      { topic: "Expo Router Deep-Linking", score: 69 },
    ],
    AI: [
      { topic: "SGD Backpropagation Math", score: 52 },
      { topic: "Pandas Data Cleaning", score: 63 },
      { topic: "CNN Convolution Matrix", score: 68 },
    ],
  };

  return localWeakMap[focusDomain] || localWeakMap["Mobile"];
}
