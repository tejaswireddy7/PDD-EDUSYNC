import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Platform, Modal, Alert, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";

const COURSE_VIDEOS: Record<string, string> = {
  // Frontend
  "HTML5, CSS3, & Modern Grid": "https://www.youtube.com/embed/0xMQfnTU6oo",
  "JavaScript Fundamentals & DOM": "https://www.youtube.com/embed/hdI2bqOjy3c",
  "Intro to React & Component States": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "React Router & Global Context": "https://www.youtube.com/embed/Ul3y1LXxzdU",
  "Tailwind CSS & Responsive Layouts": "https://www.youtube.com/embed/m7OWXtbiXX8",
  "TypeScript Essentials for Web": "https://www.youtube.com/embed/d56mG7DezGs",
  "Next.js 14 App Router Mastery": "https://www.youtube.com/embed/wm5gMKuwSYk",
  "Web Performance & Core Web Vitals": "https://www.youtube.com/embed/t5fjIW3tB00",
  "Module Federation & Micro-Frontends": "https://www.youtube.com/embed/ICeH3uBGGeo",

  // Backend
  "Intro to Node.js & REST API": "https://www.youtube.com/embed/Oe421EPjeBE",
  "SQL Fundamentals & Relational DBs": "https://www.youtube.com/embed/7S_tz1z_5bA",
  "Basics of Routing & HTTP Methods": "https://www.youtube.com/embed/iYM2zFP3Zn0",
  "Java Spring Boot Microservices": "https://www.youtube.com/embed/35EQXmHKZYs",
  "PostgreSQL Queries & Optimization": "https://www.youtube.com/embed/qw--VYLpxG4",
  "Redis Caching & Task Queues": "https://www.youtube.com/embed/jgpVdJB2sKQ",
  "Distributed Systems & Scalability": "https://www.youtube.com/embed/oSkTPzOGMuw",
  "Docker & Kubernetes Orchestration": "https://www.youtube.com/embed/rjjES5IsPdg",
  "Go Concurrency & Channels Deep-Dive": "https://www.youtube.com/embed/un6ZyFkqFKo",

  // Mobile
  "React Native & Expo Ecosystem": "https://www.youtube.com/embed/0-S5a0eXPoc",
  "Flexbox Layouts in Mobile Screens": "https://www.youtube.com/embed/Hf2esGA7vCc",
  "Navigation Containers & Tabs": "https://www.youtube.com/embed/ur6I5m2nTvk",
  "Advanced React Navigation v6": "https://www.youtube.com/embed/UVUPEokN8Mw",
  "Native Features: Camera, GPS & Audio": "https://www.youtube.com/embed/0-S5a0eXPoc",
  "State Management in Native Apps": "https://www.youtube.com/embed/0-S5a0eXPoc",
  "SwiftUI Mastery for iOS Platforms": "https://www.youtube.com/embed/HXoVSbwWUIk",
  "Kotlin & Android Jetpack UI": "https://www.youtube.com/embed/6_wK_Ud8--0",
  "Native Bridges & Performance Tuning": "https://www.youtube.com/embed/0-S5a0eXPoc",

  // AI
  "Python Fundamentals & Packages": "https://www.youtube.com/embed/_uQrJ0TkZlc",
  "Pandas & Numpy Data Wrangling": "https://www.youtube.com/embed/F6kmIpWWEdU",
  "Basic Statistics & Probability": "https://www.youtube.com/embed/xxpc-HPKN28",
  "Neural Networks with PyTorch": "https://www.youtube.com/embed/V_xro1bcAuA",
  "Natural Language Processing (NLP)": "https://www.youtube.com/embed/dIUTsFT2MeQ",
  "Data Visualization with Recharts": "https://www.youtube.com/embed/F6kmIpWWEdU",
  "Fine-Tuning Generative AI Models": "https://www.youtube.com/embed/V_xro1bcAuA",
  "MLOps: CI/CD Pipeline for Models": "https://www.youtube.com/embed/V_xro1bcAuA",
  "Transformer Architectures & Attention": "https://www.youtube.com/embed/V_xro1bcAuA"
};

const COURSE_MATERIALS: Record<string, Array<{ label: string; url: string; type: "doc" | "tutorial" | "article" }>> = {
  "HTML5, CSS3, & Modern Grid": [
    { label: "MDN Web Docs: HTML & CSS Basics", url: "https://developer.mozilla.org/en-US/docs/Learn", type: "doc" },
    { label: "CSS Tricks: Complete Guide to Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", type: "article" },
    { label: "Interactive CSS Grid Garden Game", url: "https://cssgridgarden.com/", type: "tutorial" }
  ],
  "JavaScript Fundamentals & DOM": [
    { label: "MDN Web Docs: JavaScript Programming Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "doc" },
    { label: "JavaScript.info - Comprehensive Tutorial", url: "https://javascript.info/", type: "tutorial" },
    { label: "Eloquent JavaScript (Free Digital Book)", url: "https://eloquentjavascript.net/", type: "doc" }
  ],
  "Intro to React & Component States": [
    { label: "React Official Docs: Quick Start Guide", url: "https://react.dev/learn", type: "doc" },
    { label: "Scrimba: Free Interactive React Course", url: "https://scrimba.com/learn/learnreact", type: "tutorial" },
    { label: "Robin Wieruch: Complete React State tutorial", url: "https://www.robinwieruch.de/react-state/", type: "article" }
  ],
  "Intro to Node.js & REST API": [
    { label: "Node.js Official Documentation Guide", url: "https://nodejs.org/en/docs", type: "doc" },
    { label: "Express.js RESTful API Routing guide", url: "https://expressjs.com/en/guide/routing.html", type: "doc" },
    { label: "RestApiTutorial: What is REST?", url: "https://restapitutorial.com/", type: "tutorial" }
  ],
  "SQL Fundamentals & Relational DBs": [
    { label: "W3Schools Interactive SQL Reference", url: "https://www.w3schools.com/sql/", type: "tutorial" },
    { label: "SQLBolt: Interactive SQL Lessons", url: "https://sqlbolt.com/", type: "tutorial" },
    { label: "Use The Index, Luke: SQL query speed guide", url: "https://use-the-index-luke.com/", type: "doc" }
  ],
  "React Native & Expo Ecosystem": [
    { label: "React Native official Layout Guides", url: "https://reactnative.dev/docs/flexbox", type: "doc" },
    { label: "Expo CLI Docs: Building native bundles", url: "https://docs.expo.dev/", type: "doc" },
    { label: "React Navigation state container setups", url: "https://reactnavigation.org/", type: "article" }
  ],
  "Python Fundamentals & Packages": [
    { label: "Python.org Official Tutorial", url: "https://docs.python.org/3/tutorial/", type: "doc" },
    { label: "Real Python: Comprehensive Learning Path", url: "https://realpython.com/", type: "tutorial" }
  ],
  "Neural Networks with PyTorch": [
    { label: "PyTorch Official Neural Network Tutorial", url: "https://pytorch.org/tutorials/beginner/blitz/neural_networks_tutorial.html", type: "doc" },
    { label: "Deep Learning with PyTorch (Free book)", url: "https://pytorch.org/deep-learning-with-pytorch-book", type: "doc" }
  ],
  "React Router & Global Context": [
    { label: "React Router Docs: Routing Basics", url: "https://reactrouter.com/", type: "doc" }
  ],
  "Tailwind CSS & Responsive Layouts": [
    { label: "Tailwind CSS Official Docs", url: "https://tailwindcss.com/", type: "doc" }
  ],
  "TypeScript Essentials for Web": [
    { label: "TypeScript Deep Dive Handbook", url: "https://basarat.gitbook.io/typescript/", type: "doc" }
  ],
  "Java Spring Boot Microservices": [
    { label: "Spring Boot Official Guides", url: "https://spring.io/guides", type: "doc" }
  ],
  "PostgreSQL Queries & Optimization": [
    { label: "Postgres Guide: Indexes & Queries", url: "https://www.postgresguide.com/", type: "doc" }
  ],
  "SwiftUI Mastery for iOS Platforms": [
    { label: "Apple Developer SwiftUI Tutorials", url: "https://developer.apple.com/tutorials/swiftui", type: "doc" }
  ],
  "Kotlin & Android Jetpack UI": [
    { label: "Android Developers Jetpack Compose Guide", url: "https://developer.android.com/jetpack/compose", type: "doc" }
  ],
  "Pandas & Numpy Data Wrangling": [
    { label: "Pandas User Guide & Exercises", url: "https://pandas.pydata.org/docs/user_guide/index.html", type: "doc" }
  ],
  "Basics of Routing & HTTP Methods": [
    { label: "HTTP Protocols MDN Reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", type: "doc" }
  ]
};

interface Section {
  title: string;
  startSec: number;
  duration: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

const COURSE_SECTIONS: Record<string, Section[]> = {
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
          "It only supports web-based targets"
        ],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: Layouts, Styling, Flexbox & Component States",
      startSec: 600,
      duration: "15 mins",
      quiz: {
        question: "Which React Native element is the equivalent of a <div> in normal HTML web pages?",
        options: ["Text", "Div", "View", "Container"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 3: Navigation, App Router & Device API Integrations",
      startSec: 1500,
      duration: "20 mins",
      quiz: {
        question: "Which navigation routing library is built-in in modern Expo SDK releases?",
        options: ["react-router-dom", "Expo Router", "native-navigation", "window.location"],
        correctAnswer: 1
      }
    }
  ],
  "HTML5, CSS3, & Modern Grid": [
    {
      title: "Section 1: Semantic Elements & Document Headers",
      startSec: 0,
      duration: "12 mins",
      quiz: {
        question: "Which HTML5 semantic element is most appropriate for a self-contained blog post?",
        options: ["<section>", "<div>", "<article>", "<aside>"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 2: Flexible Box Layouts & Media Queries",
      startSec: 720,
      duration: "15 mins",
      quiz: {
        question: "What is the default direction of flex-direction in CSS Flexbox?",
        options: ["row", "column", "row-reverse", "grid"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 3: CSS Grid Gardens & Auto-fit Columns",
      startSec: 1620,
      duration: "18 mins",
      quiz: {
        question: "Which CSS property defines column tracks and sizes in grid templates?",
        options: ["grid-column-gap", "grid-template-columns", "grid-rows", "flex-basis"],
        correctAnswer: 1
      }
    }
  ],
  "JavaScript Fundamentals & DOM": [
    {
      title: "Section 1: Variables, Types & Block Scopes",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which variable declaration keyword is block-scoped and prevents value reassignments?",
        options: ["var", "let", "const", "define"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 2: Functions, Array Map/Filter/Reduce & Callbacks",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which array method returns a new array containing items that evaluate true inside a callback function?",
        options: ["map()", "filter()", "forEach()", "reduce()"],
        correctAnswer: 1
      }
    },
    {
      title: "Section 3: DOM Selectors & Document Event Listeners",
      startSec: 1320,
      duration: "15 mins",
      quiz: {
        question: "Which DOM method returns the first element that matches the specified CSS selectors?",
        options: ["getElementById", "getElementsByClassName", "querySelector", "querySelectorAll"],
        correctAnswer: 2
      }
    }
  ],
  "Intro to React & Component States": [
    {
      title: "Section 1: JSX Syntax & Virtual DOM Diffing",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What is JSX in React component development?",
        options: ["A JavaScript XML syntax extension", "A styling stylesheet framework", "A transpiler utility", "A direct browser compiler"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: Functional Components & Custom Props passing",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "How are initial arguments passed down from parent to child React components?",
        options: ["Via local storage", "Via component context hook", "Via Component Props object", "Via global window objects"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 3: useState Hooks & Rendering lifecycles",
      startSec: 1320,
      duration: "15 mins",
      quiz: {
        question: "Which built-in Hook allows functional components to store and update local state values?",
        options: ["useEffect", "useState", "useRef", "useContext"],
        correctAnswer: 1
      }
    }
  ],
  "SQL Fundamentals & Relational DBs": [
    {
      title: "Section 1: Relational Database Models & Tables",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What does the SQL acronym stand for?",
        options: ["Structured Query Language", "Simple Query List", "Server Queue Language", "Stateful Query Loop"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: Primary Keys, Foreign Keys & Schema relations",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which constraint uniquely identifies each record in a database table?",
        options: ["Foreign Key", "Primary Key", "Unique Index", "NotNull Constraint"],
        correctAnswer: 1
      }
    }
  ],
  "Intro to Node.js & REST API": [
    {
      title: "Section 1: Event Loops & Non-blocking I/O operations",
      startSec: 0,
      duration: "11 mins",
      quiz: {
        question: "Is Node.js multi-threaded or single-threaded by default?",
        options: ["Multi-threaded", "Single-threaded with event loop", "Dual-threaded", "Process-isolated"],
        correctAnswer: 1
      }
    },
    {
      title: "Section 2: Creating REST Endpoints with Express middleware",
      startSec: 660,
      duration: "14 mins",
      quiz: {
        question: "Which HTTP status code represents a successful REST operation?",
        options: ["200 OK", "404 Not Found", "500 Server Error", "403 Forbidden"],
        correctAnswer: 0
      }
    }
  ],
  "Python Fundamentals & Packages": [
    {
      title: "Section 1: Syntax basics, variables, list comprehensions",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which Python data structure is mutable and ordered?",
        options: ["Tuple", "Set", "List", "Dictionary"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 2: Packages, modules import & PIP package manager",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which command-line utility is used to install Python external packages?",
        options: ["npm", "pip", "brew", "apt-get"],
        correctAnswer: 1
      }
    }
  ],
  "Neural Networks with PyTorch": [
    {
      title: "Section 1: Tensors, Gradient computation, backpropagation",
      startSec: 0,
      duration: "15 mins",
      quiz: {
        question: "What is the primary multidimensional array data structure in PyTorch?",
        options: ["DataFrame", "List", "Tensor", "Matrix"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 2: Building Neural Networks using torch.nn",
      startSec: 900,
      duration: "15 mins",
      quiz: {
        question: "Which activation function is most commonly used in deep network hidden layers?",
        options: ["Sigmoid", "ReLU", "Tanh", "Linear"],
        correctAnswer: 1
      }
    }
  ],
  "React Router & Global Context": [
    {
      title: "Section 1: Dynamic client-side routing setups",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which hook is used to get URL query params in React Router?",
        options: ["useParams", "useNavigate", "useLocation", "useSearchParams"],
        correctAnswer: 3
      }
    },
    {
      title: "Section 2: Global state sharing via useContext",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "What is the primary benefit of React Context API?",
        options: ["It optimizes database queries", "It avoids prop drilling by sharing state globally", "It styles components dynamically", "It compiles code to WebAssembly"],
        correctAnswer: 1
      }
    }
  ],
  "Tailwind CSS & Responsive Layouts": [
    {
      title: "Section 1: Utility classes & style compilation",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What describes Tailwind CSS?",
        options: ["A utility-first CSS framework", "A preprocessor compiler", "A component framework like Bootstrap", "An inline styles generator"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: Responsive screen prefixes & modifiers",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which breakpoint prefix applies styles on screens 768px and wider in Tailwind?",
        options: ["sm:", "md:", "lg:", "xl:"],
        correctAnswer: 1
      }
    }
  ],
  "TypeScript Essentials for Web": [
    {
      title: "Section 1: Interfaces, Types & Static type checks",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What compiles TypeScript code into browser-readable JavaScript?",
        options: ["Babel", "TypeScript Compiler (tsc)", "Vite", "Webpack"],
        correctAnswer: 1
      }
    },
    {
      title: "Section 2: Generics & Union Types mapping",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which type utility allows defining parameters that accept multiple distinct type definitions?",
        options: ["Generics", "Union Types", "Interfaces", "Tuples"],
        correctAnswer: 1
      }
    }
  ],
  "Java Spring Boot Microservices": [
    {
      title: "Section 1: Dependency Injection & Beans configurations",
      startSec: 0,
      duration: "12 mins",
      quiz: {
        question: "Which annotation registers a class as a Spring component bean?",
        options: ["@Autowired", "@Component", "@Bean", "@Service"],
        correctAnswer: 1
      }
    },
    {
      title: "Section 2: Creating REST APIs using @RestController",
      startSec: 720,
      duration: "15 mins",
      quiz: {
        question: "Which annotation maps HTTP GET requests in Spring controllers?",
        options: ["@GetMapping", "@PostMapping", "@RequestMapping", "@PathValue"],
        correctAnswer: 0
      }
    }
  ],
  "PostgreSQL Queries & Optimization": [
    {
      title: "Section 1: Select joins, filters & aggregate commands",
      startSec: 0,
      duration: "11 mins",
      quiz: {
        question: "Which join returns all matched records and unmatched rows from both tables?",
        options: ["Inner Join", "Left Join", "Full Outer Join", "Right Join"],
        correctAnswer: 2
      }
    },
    {
      title: "Section 2: B-Tree Indexing, EXPLAIN ANALYZE checks",
      startSec: 660,
      duration: "14 mins",
      quiz: {
        question: "Which PostgreSQL statement is used to show query execution plans and costs?",
        options: ["DESCRIBE", "EXPLAIN ANALYZE", "SELECT INDEX", "SHOW COSTS"],
        correctAnswer: 1
      }
    }
  ],
  "SwiftUI Mastery for iOS Platforms": [
    {
      title: "Section 1: Declarative UI structures & State variables",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which property wrapper triggers view updates on state changes in SwiftUI?",
        options: ["@State", "@Binding", "@ObservedObject", "@Environment"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: NavigationStack, lists, grids scaling",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "What is the equivalent of ScrollView with items in SwiftUI?",
        options: ["ListView", "List", "VStack", "GridView"],
        correctAnswer: 1
      }
    }
  ],
  "Kotlin & Android Jetpack UI": [
    {
      title: "Section 1: Composable layouts & state modifiers",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which function defines a composable UI element in Jetpack Compose?",
        options: ["@Compose", "@Composable", "onCreateView", "buildUI"],
        correctAnswer: 1
      }
    },
    {
      title: "Section 2: State hoisting & viewModels binding",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which wrapper preserves composable state values across recompositions?",
        options: ["remember", "mutableStateOf", "remember { mutableStateOf(value) }", "stateSave"],
        correctAnswer: 2
      }
    }
  ],
  "Pandas & Numpy Data Wrangling": [
    {
      title: "Section 1: NDArrays & Vectorized math in NumPy",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which property gets the dimensions of a NumPy array?",
        options: ["ndim", "shape", "size", "dtype"],
        correctAnswer: 1
      }
    },
    {
      title: "Section 2: Series, DataFrames & group aggregations in Pandas",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which Pandas method aggregates grouped rows by function values?",
        options: ["groupby()", "merge()", "concat()", "apply()"],
        correctAnswer: 0
      }
    }
  ],
  "Basics of Routing & HTTP Methods": [
    {
      title: "Section 1: Client-Server requests & Headers",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "Which HTTP request header specifies content encoding/type?",
        options: ["Content-Type", "Accept", "User-Agent", "Authorization"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: GET, POST, PUT, DELETE method routing",
      startSec: 600,
      duration: "12 mins",
      quiz: {
        question: "Which HTTP method should be used to create a new resource on the server?",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctAnswer: 1
      }
    }
  ]
};

function normalizeCourseTitle(title: string): string {
  const mapping: Record<string, string> = {
    // Frontend aliases
    "HTML & CSS Fundamentals": "HTML5, CSS3, & Modern Grid",
    "JavaScript Essentials": "JavaScript Fundamentals & DOM",
    "Responsive Web Design": "Tailwind CSS & Responsive Layouts",
    "React.js Fundamentals": "Intro to React & Component States",
    "TypeScript for React": "TypeScript Essentials for Web",
    "State Management with Redux": "React Router & Global Context",
    "Next.js & Server Components": "React Router & Global Context",
    "Advanced TypeScript Patterns": "TypeScript Essentials for Web",
    "Performance Optimization": "Intro to React & Component States",

    // Backend aliases
    "Node.js & Express Basics": "Intro to Node.js & REST API",
    "REST API Design": "Basics of Routing & HTTP Methods",
    "Database Basics (SQL)": "SQL Fundamentals & Relational DBs",
    "Authentication & Authorization": "Intro to Node.js & REST API",
    "PostgreSQL Advanced": "PostgreSQL Queries & Optimization",
    "API Testing & Documentation": "Intro to Node.js & REST API",
    "Microservices Architecture": "Java Spring Boot Microservices",
    "Message Queues & Event Streaming": "Java Spring Boot Microservices",
    "DevOps & Deployment": "Java Spring Boot Microservices",

    // Mobile aliases
    "React Native Basics": "React Native & Expo Ecosystem",
    "Mobile UI/UX Principles": "React Native & Expo Ecosystem",
    "Mobile Navigation & Routing": "React Native & Expo Ecosystem",
    "Native Modules & Bridging": "React Native & Expo Ecosystem",
    "Mobile App Performance": "React Native & Expo Ecosystem",
    "Offline-First Architecture": "React Native & Expo Ecosystem",
    "Cross-Platform Optimization": "React Native & Expo Ecosystem",
    "Mobile Security Best Practices": "React Native & Expo Ecosystem",
    "App Store Deployment & Analytics": "React Native & Expo Ecosystem",

    // AI aliases
    "Python for AI/ML": "Python Fundamentals & Packages",
    "Machine Learning Fundamentals": "Neural Networks with PyTorch",
    "Data Science Essentials": "Pandas & Numpy Data Wrangling",
    "TensorFlow & Keras": "Neural Networks with PyTorch",
    "NLP & Text Processing": "Neural Networks with PyTorch",
    "Computer Vision Basics": "Neural Networks with PyTorch",
    "Advanced Neural Networks": "Neural Networks with PyTorch",
    "Generative AI & LLMs": "Neural Networks with PyTorch",
    "ML Model Production & MLOps": "Neural Networks with PyTorch",
  };

  return mapping[title] || title;
}

export default function CourseLearnScreen() {
  const store = useDashboardStore();
  
  // Extract course title from search queries
  const params = new URLSearchParams(Platform.OS === "web" ? window.location.search : "");
  const courseTitle = params.get("course") || "React Native & Expo Ecosystem";
  const normalizedTitle = normalizeCourseTitle(courseTitle);

  const videoUrl = COURSE_VIDEOS[normalizedTitle] || "https://www.youtube.com/embed/hdI2bqOjy3c";

  // Timeline and Quiz States
  const [activeStartSec, setActiveStartSec] = useState<number>(0);
  const [showQuizSectionIdx, setShowQuizSectionIdx] = useState<number | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ type: "correct" | "incorrect"; msg: string } | null>(null);
  const [peerMaterials, setPeerMaterials] = useState<any[]>([]);
  const [viewingResource, setViewingResource] = useState<any | null>(null);

  // Track completed section quizzes inside local state & localStorage
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<number, { selected: number; correct: boolean }>>({});

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const cacheKey = `completed_quizzes_${courseTitle}_${store.user?.email || "guest"}`;
      const saved = window.localStorage.getItem(cacheKey);
      if (saved) {
        try {
          setCompletedQuizzes(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [courseTitle, store.user?.email]);

  // New: Watch time threshold tracking states
  const [watchedTime, setWatchedTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [quizTriggered, setQuizTriggered] = useState<boolean>(false);
  const [showFifteenMinQuiz, setShowFifteenMinQuiz] = useState<boolean>(false);
  const [q1Answer, setQ1Answer] = useState<number | null>(null);
  const [q2Answer, setQ2Answer] = useState<number | null>(null);
  const [fifteenMinQuizFeedback, setFifteenMinQuizFeedback] = useState<string | null>(null);
  const [fifteenMinScore, setFifteenMinScore] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(900); // 15 mins default fallback

  // Load saved video progress on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const cacheKey = `video_progress_${courseTitle}_${store.user?.email || "guest"}`;
      const savedTime = window.localStorage.getItem(cacheKey);
      if (savedTime) {
        const seconds = parseInt(savedTime, 10);
        if (!isNaN(seconds)) {
          setWatchedTime(seconds);
          setActiveStartSec(seconds);
        }
      }
    }
  }, [courseTitle, store.user?.email]);

  // Listen for YouTube player state changes via postMessage (enablejsapi=1)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info) {
          if (data.info.playerState !== undefined) {
            setIsPlaying(data.info.playerState === 1);
          }
          if (data.info.duration !== undefined && data.info.duration > 0) {
            setVideoDuration(data.info.duration);
          }
          if (data.info.currentTime !== undefined) {
            const current = data.info.currentTime;
            setWatchedTime(current);
            
            if (typeof window !== "undefined" && window.localStorage) {
              const cacheKey = `video_progress_${courseTitle}_${store.user?.email || "guest"}`;
              window.localStorage.setItem(cacheKey, Math.round(current).toString());
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [courseTitle, store.user?.email]);

  // Watch timer: increments watched seconds if playing as fallback/helper
  useEffect(() => {
    if (!isPlaying || showFifteenMinQuiz) return;

    const interval = setInterval(() => {
      setWatchedTime((prev) => {
        const next = prev + 1;

        if (typeof window !== "undefined" && window.localStorage) {
          const cacheKey = `video_progress_${courseTitle}_${store.user?.email || "guest"}`;
          window.localStorage.setItem(cacheKey, next.toString());
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, courseTitle, store.user?.email]);

  // Dynamic progress synchronization based on watchedTime / videoDuration
  useEffect(() => {
    if (videoDuration > 0) {
      const progressPercent = Math.min(99, Math.round((watchedTime / videoDuration) * 99));
      store.updateCourseProgress(courseTitle, progressPercent);

      if (watchedTime >= videoDuration * 0.99 && !quizTriggered) {
        setQuizTriggered(true);
        setShowFifteenMinQuiz(true);

        const iframe = document.querySelector("iframe");
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*"
          );
        }
      }
    }
  }, [watchedTime, videoDuration, courseTitle, quizTriggered]);

  const handleFifteenMinQuizSubmit = () => {
    const sectList = COURSE_SECTIONS[courseTitle] || defaultSections;
    if (q1Answer === null || q2Answer === null) {
      Alert.alert("Error", "Please answer both questions before submitting.");
      return;
    }

    const correctQ1 = sectList[0]?.quiz.correctAnswer;
    const correctQ2 = sectList[1]?.quiz.correctAnswer;

    let score = 0;
    if (q1Answer === correctQ1) score++;
    if (q2Answer === correctQ2) score++;

    setFifteenMinScore(score);

    if (score === 2) {
      setFifteenMinQuizFeedback("Excellent! Flawless score! Course marked as completed. You earned +100 XP!");
      store.completeCourse(courseTitle);
    } else if (score === 1) {
      setFifteenMinQuizFeedback("Good job! You answered 1 out of 2 correctly. Course marked as completed. You earned +100 XP!");
      store.completeCourse(courseTitle);
    } else {
      setFifteenMinQuizFeedback("You got 0 out of 2 correctly. We recommend re-watching sections, but course progress is updated. You earned +100 XP!");
      store.completeCourse(courseTitle);
    }
  };

  useEffect(() => {
    async function loadPeerMaterials() {
      try {
        const local = localStorage.getItem("uploaded_resources");
        const localItems = local ? JSON.parse(local) : [];
        const courseLocal = localItems.filter((x: any) => x.courseTitle === courseTitle);

        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("course_title", courseTitle);

        if (error) throw error;
        const dbItems = data || [];
        setPeerMaterials([...courseLocal, ...dbItems]);
      } catch (e) {
        console.warn("Failed to load peer materials:", e);
        const local = localStorage.getItem("uploaded_resources");
        const localItems = local ? JSON.parse(local) : [];
        const courseLocal = localItems.filter((x: any) => x.courseTitle === courseTitle);
        setPeerMaterials(courseLocal);
      }
    }
    loadPeerMaterials();
  }, [courseTitle]);

  const getWatchUrl = (embedUrl: string) => {
    return embedUrl.replace("/embed/", "/watch?v=");
  };

  const handleOpenPeerMaterial = (m: any) => {
    store.cacheMaterial(m.title, "https://developer.mozilla.org/en-US/");
    if (store.lowDataMode) {
      Alert.alert(
        "Low-Data Cache Success",
        `"${m.title}" has been saved in local cache memory for offline access.`
      );
    }
    setViewingResource(m);
  };

  const handleDeletePeerMaterial = async (id: string) => {
    setPeerMaterials((prev) => prev.filter((x) => x.id !== id));
    const local = localStorage.getItem("uploaded_resources");
    if (local) {
      const localItems = JSON.parse(local);
      const updated = localItems.filter((x: any) => x.id !== id);
      localStorage.setItem("uploaded_resources", JSON.stringify(updated));
    }
    try {
      await supabase.from("resources").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete remote resource:", e);
    }
    Alert.alert("Success", "Your uploaded resource has been deleted successfully.");
  };

  const handleQuizSubmit = (sectionIdx: number) => {
    const sectList = COURSE_SECTIONS[courseTitle] || defaultSections;
    if (!sectList || showQuizSectionIdx === null) return;
    const sect = sectList[sectionIdx];
    if (selectedQuizOption === null) {
      Alert.alert("Error", "Please select an answer first.");
      return;
    }

    const isCorrect = selectedQuizOption === sect.quiz.correctAnswer;
    
    const updated = {
      ...completedQuizzes,
      [sectionIdx]: { selected: selectedQuizOption, correct: isCorrect }
    };
    setCompletedQuizzes(updated);

    if (typeof window !== "undefined" && window.localStorage) {
      const cacheKey = `completed_quizzes_${courseTitle}_${store.user?.email || "guest"}`;
      window.localStorage.setItem(cacheKey, JSON.stringify(updated));
    }

    // Dynamic course progress sync based on section quiz passes
    const correctCount = Object.values(updated).filter((x) => x.correct).length;
    const nextProgress = Math.min(99, Math.round((correctCount / sectList.length) * 99));
    store.updateCourseProgress(courseTitle, nextProgress);

    if (isCorrect) {
      setQuizFeedback({
        type: "correct",
        msg: "Correct! Score: 1/1. You have earned +50 XP!"
      });
      store.addXp(50);
    } else {
      setQuizFeedback({
        type: "incorrect",
        msg: "Incorrect. Score: 0/1. Re-watch the video section and try again!"
      });
    }
  };

  const closeWindow = () => {
    if (Platform.OS === "web") {
      window.close();
      // Fallback if window.close is blocked
      window.location.href = "/";
    }
  };

  const defaultSections = [
    {
      title: "Section 1: Getting Started and Basic Setup",
      startSec: 0,
      duration: "10 mins",
      quiz: {
        question: "What is the primary language used in this course domain?",
        options: ["TypeScript/JavaScript", "Python", "Swift", "C++"],
        correctAnswer: 0
      }
    },
    {
      title: "Section 2: Deep Dive into Core Workflows",
      startSec: 600,
      duration: "15 mins",
      quiz: {
        question: "Which hook or function is commonly used for managing local state updates?",
        options: ["useReducer", "useState", "useEffect", "useMemo"],
        correctAnswer: 1
      }
    }
  ];

  const sections = COURSE_SECTIONS[normalizedTitle] || defaultSections;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={true}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Pathway Learning Hub</Text>
          <Text style={styles.headerTitle}>{courseTitle}</Text>
        </View>
        <TouchableOpacity onPress={closeWindow} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.layoutRow}>
        {/* LEFT COLUMN - VIDEO PLAYER */}
        <View style={styles.leftCol}>
          <View style={styles.videoPlayerContainer}>
            {Platform.OS === "web" ? (
              !showFifteenMinQuiz ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`${videoUrl}?autoplay=1&enablejsapi=1&start=${activeStartSec}`}
                  title={courseTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ borderRadius: 20, border: "none" }}
                />
              ) : (
                <View style={{ flex: 1, backgroundColor: "#090d16", justifyContent: "center", alignItems: "center", borderRadius: 20 }}>
                  <MaterialCommunityIcons name="video-off" size={48} color="#475569" style={{ marginBottom: 12 }} />
                  <Text style={{ color: "#94a3b8", fontSize: 15, fontWeight: "600" }}>Lesson Paused for Checkpoint Quiz</Text>
                  <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Resume watching after closing the quiz</Text>
                </View>
              )
            ) : (
              <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#fff" }}>Playback only supported on Web version.</Text>
              </View>
            )}
          </View>

          <View style={styles.timerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="timer-outline" size={16} color="#6366f1" />
              <Text style={styles.timerText}>
                Watch Progress: {Math.floor(watchedTime / 60)}m {Math.floor(watchedTime % 60)}s / {Math.floor(videoDuration / 60)}m {Math.floor(videoDuration % 60)}s
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const targetTime = Math.max(0, videoDuration - 5);
                setWatchedTime(targetTime);
                if (typeof window !== "undefined" && window.localStorage) {
                  const cacheKey = `video_progress_${courseTitle}_${store.user?.email || "guest"}`;
                  window.localStorage.setItem(cacheKey, targetTime.toString());
                }
              }}
              style={styles.simulateBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.simulateBtnText}>⚡ Simulate Watch</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.videoFooterRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="youtube" size={20} color="#ef4444" />
              <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "600" }}>Source Lesson Video</Text>
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL(getWatchUrl(videoUrl) + (activeStartSec > 0 ? `&t=${activeStartSec}s` : ""))}
              style={styles.watchOnYTBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.watchOnYTText}>Watch on YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT COLUMN - LESSON TIMELINE & DOCUMENTS */}
        <View style={styles.rightCol}>
          {/* SECTION QUIZ OVERLAY PANEL */}
          {showQuizSectionIdx !== null && (
            <View style={styles.quizPanel}>
              <View style={styles.quizPanelHeader}>
                <Text style={styles.quizPanelTitle}>
                  Section Quiz: Lesson {showQuizSectionIdx + 1}
                </Text>
                <TouchableOpacity onPress={() => { setShowQuizSectionIdx(null); setSelectedQuizOption(null); setQuizFeedback(null); }}>
                  <Text style={styles.quizCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {(() => {
                const sect = sections[showQuizSectionIdx];
                if (!sect) return null;
                return (
                  <View style={styles.quizPanelBody}>
                    <Text style={styles.quizQuestion}>{sect.quiz.question}</Text>
                    <View style={styles.quizOptions}>
                      {sect.quiz.options.map((opt, oIdx) => {
                        const isSel = selectedQuizOption === oIdx;
                        return (
                          <TouchableOpacity
                            key={oIdx}
                            onPress={() => {
                              if (quizFeedback) return;
                              setSelectedQuizOption(oIdx);
                            }}
                            style={[styles.quizOptionBtn, isSel && styles.quizOptionBtnActive]}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.quizOptionCircle, isSel && styles.quizOptionCircleActive]}>
                              {isSel && <View style={styles.quizOptionInner} />}
                            </View>
                            <Text style={[styles.quizOptionText, isSel && styles.quizOptionTextActive]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {quizFeedback && (
                      <View style={[styles.feedbackBox, quizFeedback.type === "correct" ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                        <MaterialCommunityIcons
                          name={quizFeedback.type === "correct" ? "check-circle" : "alert-circle"}
                          size={16}
                          color={quizFeedback.type === "correct" ? "#10b981" : "#ef4444"}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.feedbackText, quizFeedback.type === "correct" ? styles.textCorrect : styles.textIncorrect]}>
                          {quizFeedback.msg}
                        </Text>
                      </View>
                    )}

                    {!quizFeedback ? (
                      <TouchableOpacity
                        style={styles.quizSubmitBtn}
                        onPress={() => handleQuizSubmit(showQuizSectionIdx)}
                      >
                        <Text style={styles.quizSubmitText}>Submit Answer</Text>
                      </TouchableOpacity>
                    ) : quizFeedback.type === "incorrect" ? (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.quizSubmitBtn, { backgroundColor: "#ef4444", flex: 1 }]}
                          onPress={() => {
                            setQuizFeedback(null);
                            setSelectedQuizOption(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.quizSubmitText}>🔄 Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quizSubmitBtn, { backgroundColor: "#64748b", flex: 1 }]}
                          onPress={() => {
                            setShowQuizSectionIdx(null);
                            setSelectedQuizOption(null);
                            setQuizFeedback(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.quizSubmitText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.quizSubmitBtn, { backgroundColor: "#475569" }]}
                        onPress={() => {
                          setShowQuizSectionIdx(null);
                          setSelectedQuizOption(null);
                          setQuizFeedback(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.quizSubmitText}>Close Quiz</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          {/* VIDEO SECTIONS TIMELINE */}
          {showQuizSectionIdx === null && (
            <View style={styles.sectionsContainer}>
              <Text style={styles.sectionsHeaderTitle}>Divided Video Lessons</Text>
              <View style={styles.sectionsList}>
                {sections.map((sect, sIdx) => (
                  <View key={sIdx} style={styles.sectionItemRow}>
                    <TouchableOpacity
                      onPress={() => setActiveStartSec(sect.startSec)}
                      style={styles.sectionPlayPart}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sectionPlayIconCircle}>
                        <Text style={styles.sectionPlayIndicatorText}>▶</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sectionItemTitle} numberOfLines={2}>
                          {sect.title}
                        </Text>
                        <Text style={styles.sectionItemDuration}>{sect.duration}</Text>
                      </View>
                    </TouchableOpacity>
                    
                    {completedQuizzes[sIdx] ? (
                      <TouchableOpacity
                        onPress={() => {
                          setShowQuizSectionIdx(sIdx);
                          setSelectedQuizOption(completedQuizzes[sIdx].selected);
                          setQuizFeedback({
                            type: completedQuizzes[sIdx].correct ? "correct" : "incorrect",
                            msg: completedQuizzes[sIdx].correct 
                              ? "Correct! Score: 1/1. You have earned +50 XP!"
                              : "Incorrect. Score: 0/1. Re-watch the video section and try again!"
                          });
                        }}
                        style={[
                          styles.sectionQuizBtn, 
                          completedQuizzes[sIdx].correct ? { backgroundColor: "#10b981" } : { backgroundColor: "#ef4444" }
                        ]}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons 
                          name={completedQuizzes[sIdx].correct ? "check-circle" : "close-circle"} 
                          size={12} 
                          color="#ffffff" 
                          style={{ marginRight: 4 }} 
                        />
                        <Text style={styles.sectionQuizBtnText}>
                          {completedQuizzes[sIdx].correct ? "Score: 1/1" : "Score: 0/1"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setShowQuizSectionIdx(sIdx);
                          setSelectedQuizOption(null);
                          setQuizFeedback(null);
                        }}
                        style={styles.sectionQuizBtn}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="trophy-outline" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.sectionQuizBtnText}>Quiz</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* DYNAMIC SYLLABUS STUDY MATERIALS */}
          {showQuizSectionIdx === null && (
            <View style={styles.peerSection}>
              <Text style={styles.peerHeader}>Syllabus Study Materials & Documents</Text>
              <View style={styles.materialsList}>
                {/* 1. Official Course Materials */}
                <Text style={styles.materialsSubHeader}>Official Reference Guides</Text>
                {(COURSE_MATERIALS[normalizedTitle] || [
                  { label: "EduSync Course Study Manual (PDF)", url: "https://developer.mozilla.org/en-US/docs/Learn", type: "doc" },
                  { label: "Topic Reference Guides & Examples", url: "https://dev.to", type: "article" },
                  { label: "Interactive Coding Sandbox Practice", url: "https://www.freecodecamp.org/learn", type: "tutorial" }
                ]).map((m, idx) => {
                  let icon = "file-pdf-box";
                  if (m.type === "article") icon = "pencil-box-outline";
                  if (m.type === "tutorial") icon = "folder-outline";
                  return (
                    <View key={`static_${idx}`} style={styles.materialItemRow}>
                      <TouchableOpacity
                        onPress={() => handleOpenPeerMaterial({ ...m, title: m.label, author: "System Instructor" })}
                        style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.peerIconBox}>
                          <MaterialCommunityIcons name={icon as any} size={15} color="#6366f1" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.materialLabel} numberOfLines={1}>
                            {m.label}
                          </Text>
                          <Text style={styles.authorLabel}>Official Syllabus Resource</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* 2. Peer Shared Notes */}
                <Text style={[styles.materialsSubHeader, { marginTop: 16 }]}>Student Shared Notes</Text>
                {peerMaterials.length === 0 ? (
                  <View style={styles.emptyUploadsCard}>
                    <MaterialCommunityIcons name="folder-open-outline" size={24} color="#64748b" />
                    <Text style={styles.emptyUploadsText}>
                      No shared student notes yet. Be the first to upload in the Resource Hub!
                    </Text>
                  </View>
                ) : (
                  peerMaterials.map((p, idx) => {
                    let icon = "file-document-outline";
                    if (p.type === "Notes") icon = "pencil-box-outline";
                    if (p.type === "PDF") icon = "file-pdf-box";
                    if (p.type === "Project") icon = "folder-outline";
                    return (
                      <View key={p.id || idx} style={styles.materialItemRow}>
                        <TouchableOpacity
                          onPress={() => handleOpenPeerMaterial(p)}
                          style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.peerIconBox}>
                            <MaterialCommunityIcons name={icon as any} size={15} color="#14b8a6" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.materialLabel} numberOfLines={1}>
                              {p.title}
                            </Text>
                            <Text style={styles.authorLabel}>Uploaded by {p.author}</Text>
                          </View>
                        </TouchableOpacity>
                        
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <MaterialCommunityIcons name="eye-outline" size={14} color="#94a3b8" />
                          {p.id?.startsWith("uploaded_") && (
                            <TouchableOpacity
                              onPress={() => handleDeletePeerMaterial(p.id)}
                              style={styles.deletePeerBtn}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* UPLOADED RESOURCE VIEWER MODAL */}
      <Modal
        visible={viewingResource !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingResource(null)}
      >
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerModal}>
            <View style={styles.viewerHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.viewerTitle} numberOfLines={1}>{viewingResource?.title}</Text>
                <Text style={styles.viewerSubtitle}>
                  Uploaded by {viewingResource?.author} • {viewingResource?.type}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewingResource(null)} style={styles.viewerCloseBtn} activeOpacity={0.7}>
                <Text style={styles.viewerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.viewerBody} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={true}>
              {viewingResource?.fileContent ? (
                <>
                  {viewingResource.fileType?.startsWith("image/") ? (
                    <Image
                      source={{ uri: viewingResource.fileContent }}
                      style={{ width: "100%", height: 350, borderRadius: 16, backgroundColor: "#0f172a" }}
                      resizeMode="contain"
                    />
                  ) : viewingResource.fileType?.includes("pdf") ? (
                    Platform.OS === "web" ? (
                      <iframe
                        src={viewingResource.fileContent}
                        style={{ width: "100%", height: 500, borderRadius: 16, border: "none" }}
                      />
                    ) : (
                      <View style={styles.pdfFallback}>
                        <MaterialCommunityIcons name="file-pdf-box" size={48} color="#a5b4fc" />
                        <Text style={{ color: "#ffffff", marginTop: 12, textAlign: "center" }}>
                          PDF preview is only supported on Web.
                        </Text>
                      </View>
                    )
                  ) : (
                    // Plain text notes/files
                    <View style={styles.notesTextContainer}>
                      <Text style={styles.notesTextContent}>{viewingResource.fileContent}</Text>
                    </View>
                  )}
                </>
              ) : (
                // Fallback for preseeded/local preview
                <View style={styles.notesTextContainer}>
                  <Text style={styles.notesTextContent}>
                    {viewingResource?.title} description and details:{"\n\n"}
                    This reference material has been prepared to help you study dynamic concepts related to {courseTitle}.{"\n\n"}Revisit this guide to prepare for checkpoints!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 15-Minute Watch Threshold Checkpoint Quiz Modal */}
      <Modal
        visible={showFifteenMinQuiz}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={styles.fifteenOverlay}>
          <View style={styles.fifteenModal}>
            <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={styles.fifteenHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <MaterialCommunityIcons name="timer-sand" size={24} color="#6366f1" />
                  <Text style={styles.fifteenTitle}>15-Minute Checkpoint Quiz</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setShowFifteenMinQuiz(false);
                    setIsPlaying(false);
                  }}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.fifteenIntro}>
                Great job! You have watched 15 minutes of this lesson video. Answer these 2 questions based on what you have learned to complete the course and submit your progress:
              </Text>

              <View style={styles.fifteenBody}>
                {/* Question 1 */}
                {sections[0] && (
                  <View style={styles.fifteenQCard}>
                    <Text style={styles.fifteenQText}>Q1: {sections[0].quiz.question}</Text>
                    <View style={styles.fifteenOptions}>
                      {sections[0].quiz.options.map((opt, oIdx) => {
                        const isSel = q1Answer === oIdx;
                        return (
                          <TouchableOpacity
                            key={oIdx}
                            onPress={() => {
                              if (fifteenMinScore !== null) return;
                              setQ1Answer(oIdx);
                            }}
                            style={[styles.quizOptionBtn, isSel && styles.quizOptionBtnActive]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.quizOptionText, isSel && styles.quizOptionTextActive]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Question 2 */}
                {sections[1] && (
                  <View style={styles.fifteenQCard}>
                    <Text style={styles.fifteenQText}>Q2: {sections[1].quiz.question}</Text>
                    <View style={styles.fifteenOptions}>
                      {sections[1].quiz.options.map((opt, oIdx) => {
                        const isSel = q2Answer === oIdx;
                        return (
                          <TouchableOpacity
                            key={oIdx}
                            onPress={() => {
                              if (fifteenMinScore !== null) return;
                              setQ2Answer(oIdx);
                            }}
                            style={[styles.quizOptionBtn, isSel && styles.quizOptionBtnActive]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.quizOptionText, isSel && styles.quizOptionTextActive]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {fifteenMinQuizFeedback && (
                <View style={styles.fifteenScoreBox}>
                  <Text style={styles.fifteenScoreText}>
                    Your Score: {fifteenMinScore} / 2
                  </Text>
                  <Text style={styles.fifteenFeedbackText}>
                    {fifteenMinQuizFeedback}
                  </Text>
                </View>
              )}

              <View style={styles.fifteenFooter}>
                {fifteenMinScore === null ? (
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      style={[styles.fifteenSubmitBtn, { backgroundColor: "#475569", flex: 1 }]}
                      onPress={() => {
                        setShowFifteenMinQuiz(false);
                        setIsPlaying(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.fifteenSubmitText}>Go Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.fifteenSubmitBtn, { flex: 2 }]}
                      onPress={handleFifteenMinQuizSubmit}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.fifteenSubmitText}>Submit Checkpoint</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "column", gap: 10 }}>
                    {fifteenMinScore < 2 && (
                      <TouchableOpacity
                        style={[styles.fifteenSubmitBtn, { backgroundColor: "#ef4444" }]}
                        onPress={() => {
                          setQ1Answer(null);
                          setQ2Answer(null);
                          setFifteenMinScore(null);
                          setFifteenMinQuizFeedback(null);
                          setShowFifteenMinQuiz(false);
                          setIsPlaying(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.fifteenSubmitText}>🔄 Try Again / Go Back to Lesson</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.fifteenSubmitBtn, { backgroundColor: "#6366f1" }]}
                      onPress={() => {
                        setShowFifteenMinQuiz(false);
                        closeWindow();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.fifteenSubmitText}>Complete & Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  contentContainer: {
    padding: 24,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 16,
    marginBottom: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  backBtnText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "800",
  },
  layoutRow: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 24,
  },
  leftCol: {
    flex: 1.3,
    minWidth: Platform.OS === "web" ? 500 : "100%",
  },
  rightCol: {
    flex: 1,
    gap: 20,
  },
  videoPlayerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
  },
  videoFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  watchOnYTBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  watchOnYTText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionsContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  sectionsHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
  },
  sectionsList: {
    gap: 8,
  },
  sectionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  sectionPlayPart: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  sectionPlayIconCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionPlayIndicatorText: {
    color: "#6366f1",
    fontSize: 10,
    fontWeight: "800",
  },
  sectionItemTitle: {
    fontSize: 12,
    color: "#f1f5f9",
    fontWeight: "600",
    lineHeight: 16,
  },
  sectionItemDuration: {
    fontSize: 11,
    color: "#38bdf8",
    marginTop: 2,
    fontWeight: "600",
  },
  sectionQuizBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sectionQuizBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  peerSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  peerHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#14b8a6",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  materialsList: {
    gap: 8,
  },
  emptyUploadsCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderStyle: "dashed",
  },
  emptyUploadsText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
  materialItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  peerIconBox: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deletePeerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  materialLabel: {
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: "600",
  },
  authorLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  // Quiz styles
  quizPanel: {
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.15)",
    marginBottom: 20,
  },
  quizPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.1)",
    paddingBottom: 8,
    marginBottom: 12,
  },
  quizPanelTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quizCloseText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "800",
  },
  quizPanelBody: {
    marginTop: 4,
  },
  quizQuestion: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 18,
  },
  quizOptions: {
    gap: 8,
    marginBottom: 14,
  },
  quizOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  quizOptionBtnActive: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  quizOptionCircle: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#94a3b8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  quizOptionCircleActive: {
    borderColor: "#6366f1",
  },
  quizOptionInner: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  quizOptionText: {
    fontSize: 12,
    color: "#cbd5e1",
    flex: 1,
  },
  quizOptionTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  quizSubmitBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quizSubmitText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  feedbackBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackCorrect: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  feedbackIncorrect: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  textCorrect: {
    color: "#10b981",
  },
  textIncorrect: {
    color: "#ef4444",
  },
  // Viewer Modal styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 10000,
  },
  viewerModal: {
    width: "100%",
    maxWidth: 800,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 12,
    marginBottom: 16,
  },
  viewerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  viewerSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  viewerCloseBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCloseText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "800",
  },
  viewerBody: {
    maxHeight: 520,
  },
  notesTextContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  notesTextContent: {
    fontSize: 14,
    color: "#cbd5e1",
    lineHeight: 22,
  },
  pdfFallback: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  // Timer & Watch Check styles
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  timerText: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "700",
  },
  simulateBtn: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.4)",
  },
  simulateBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  materialsSubHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  // Fifteen Minute Checkpoint Modal styles
  fifteenOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 20000,
  },
  fifteenModal: {
    width: "100%",
    maxWidth: 650,
    maxHeight: "85%",
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.7)",
  },
  fifteenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 16,
    marginBottom: 16,
  },
  fifteenTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  fifteenIntro: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 16,
  },
  fifteenBody: {
    gap: 16,
    paddingBottom: 16,
  },
  fifteenQCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  fifteenQText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
  },
  fifteenOptions: {
    gap: 8,
  },
  fifteenScoreBox: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    marginTop: 16,
    alignItems: "center",
  },
  fifteenScoreText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10b981",
  },
  fifteenFeedbackText: {
    fontSize: 13,
    color: "#34d399",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  fifteenFooter: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 16,
  },
  fifteenSubmitBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  fifteenSubmitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
