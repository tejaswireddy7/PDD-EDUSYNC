import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  Modal,
  Alert,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { useNavigate } from "@tanstack/react-router";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";

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

const COURSE_VIDEO_MAP: Record<string, string> = {
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
  "Flexbox Layouts in Mobile Screens": "https://www.youtube.com/embed/kGtEax1WQFg",
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
  "Transformer Architectures & Attention": "https://www.youtube.com/embed/V_xro1bcAuA",
};

function getFallbackVideoUrl(title: string): string {
  // 1. Exact match
  if (COURSE_VIDEO_MAP[title]) {
    return COURSE_VIDEO_MAP[title];
  }

  // 2. Keyword fallback matching
  const lower = title.toLowerCase();
  if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("devops")) {
    return "https://www.youtube.com/embed/rjjES5IsPdg";
  }
  if (lower.includes("spring boot") || lower.includes("microservices")) {
    return "https://www.youtube.com/embed/35EQXmHKZYs";
  }
  if (
    lower.includes("next.js") ||
    lower.includes("nextjs") ||
    lower.includes("ssr") ||
    lower.includes("federation") ||
    lower.includes("micro-frontends") ||
    lower.includes("vitals")
  ) {
    return "https://www.youtube.com/embed/wm5gMKuwSYk";
  }
  if (lower.includes("tailwind")) {
    return "https://www.youtube.com/embed/m7OWXtbiXX8";
  }
  if (lower.includes("typescript") || lower.includes("ts")) {
    return "https://www.youtube.com/embed/d56mG7DezGs";
  }
  if (
    lower.includes("router") ||
    lower.includes("context") ||
    lower.includes("redux") ||
    lower.includes("zustand") ||
    lower.includes("state management")
  ) {
    return "https://www.youtube.com/embed/Ul3y1LXxzdU";
  }
  if (lower.includes("redis") || lower.includes("caching") || lower.includes("queue")) {
    return "https://www.youtube.com/embed/jgpVdJB2sKQ";
  }
  if (lower.includes("distributed") || lower.includes("scalability")) {
    return "https://www.youtube.com/embed/oSkTPzOGMuw";
  }
  if (lower.includes("statistics") || lower.includes("probability") || lower.includes("stats")) {
    return "https://www.youtube.com/embed/xxpc-HPKN28";
  }
  if (lower.includes("nlp") || lower.includes("natural language")) {
    return "https://www.youtube.com/embed/dIUTsFT2MeQ";
  }
  if (lower.includes("swiftui") || lower.includes("swift")) {
    return "https://www.youtube.com/embed/HXoVSbwWUIk";
  }
  if (lower.includes("kotlin") || lower.includes("jetpack") || lower.includes("android")) {
    return "https://www.youtube.com/embed/6_wK_Ud8--0";
  }
  if (
    lower.includes("go concurrency") ||
    lower.includes("golang") ||
    lower.includes("concurrency") ||
    lower.includes("go ")
  ) {
    return "https://www.youtube.com/embed/un6ZyFkqFKo";
  }
  if (
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("grid") ||
    lower.includes("flexbox")
  ) {
    return "https://www.youtube.com/embed/0xMQfnTU6oo";
  }
  if (lower.includes("react") && !lower.includes("native")) {
    return "https://www.youtube.com/embed/Ke90Tje7VS0";
  }
  if (lower.includes("native") || lower.includes("expo")) {
    return "https://www.youtube.com/embed/0-S5a0eXPoc";
  }
  if (
    lower.includes("node") ||
    lower.includes("rest api") ||
    lower.includes("express") ||
    lower.includes("routing")
  ) {
    return "https://www.youtube.com/embed/Oe421EPjeBE";
  }
  if (lower.includes("sql") || lower.includes("postgres") || lower.includes("database")) {
    return "https://www.youtube.com/embed/7S_tz1z_5bA";
  }
  if (
    lower.includes("python") ||
    lower.includes("numpy") ||
    lower.includes("pytorch") ||
    lower.includes("ai") ||
    lower.includes("neural") ||
    lower.includes("machine learning")
  ) {
    return "https://www.youtube.com/embed/V_xro1bcAuA";
  }
  return "https://www.youtube.com/embed/hdI2bqOjy3c"; // Default JavaScript video
}

export default function CourseLearnScreen() {
  const store = useDashboardStore();
  const navigate = useNavigate();
  let navigation: any;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Fail-safe
  }

  let nativeParams: any = {};
  try {
    const route = useRoute();
    nativeParams = route.params || {};
  } catch (e) {
    // Fail-safe
  }

  // Extract course title from search queries
  const courseTitle =
    Platform.OS === "web"
      ? new URLSearchParams(window.location.search).get("course") || "React Native & Expo Ecosystem"
      : nativeParams.course || "React Native & Expo Ecosystem";
  const normalizedTitle = normalizeCourseTitle(courseTitle);

  const defaultSections = [
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

  const [videoUrl, setVideoUrl] = useState<string>(() => getFallbackVideoUrl(courseTitle));

  useEffect(() => {
    setVideoUrl(getFallbackVideoUrl(courseTitle));
  }, [courseTitle]);
  const [sections, setSections] = useState<any[]>(defaultSections);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    async function loadDynamicCourseData() {
      try {
        const { fetchDBCourseSections, fetchDBCourseMaterials } =
          await import("../lib/supabase-db");
        const [dbSections, dbMaterials] = await Promise.all([
          fetchDBCourseSections(courseTitle),
          fetchDBCourseMaterials(courseTitle),
        ]);
        setSections(dbSections);
        setMaterials(dbMaterials);

        // Fetch dynamic course video URL from course database table
        const { data } = await supabase
          .from("courses")
          .select("url")
          .eq("title", courseTitle)
          .maybeSingle();
        if (data && data.url) {
          setVideoUrl(data.url);
        }
      } catch (e) {
        console.warn("Failed to load course details dynamically:", e);
      }
    }
    loadDynamicCourseData();
  }, [courseTitle]);

  // Timeline and Quiz States
  const [activeStartSec, setActiveStartSec] = useState<number>(0);
  const [showQuizSectionIdx, setShowQuizSectionIdx] = useState<number | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{
    type: "correct" | "incorrect";
    msg: string;
  } | null>(null);
  const [peerMaterials, setPeerMaterials] = useState<any[]>([]);
  const [viewingResource, setViewingResource] = useState<any | null>(null);

  // Track completed section quizzes inside local state & localStorage
  const [completedQuizzes, setCompletedQuizzes] = useState<
    Record<number, { selected: number; correct: boolean }>
  >({});

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
    if (Platform.OS !== "web") return;

    const handleMessage = (event: any) => {
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

        if (Platform.OS === "web") {
          const iframe = document.querySelector("iframe");
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
              "*",
            );
          }
        }
      }
    }
  }, [watchedTime, videoDuration, courseTitle, quizTriggered]);

  const handleFifteenMinQuizSubmit = () => {
    const sectList = sections;
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
      setFifteenMinQuizFeedback(
        "Excellent! Flawless score! Course marked as completed. You earned +100 XP!",
      );
      store.completeCourse(courseTitle);
    } else if (score === 1) {
      setFifteenMinQuizFeedback(
        "Good job! You answered 1 out of 2 correctly. Course marked as completed. You earned +100 XP!",
      );
      store.completeCourse(courseTitle);
    } else {
      setFifteenMinQuizFeedback(
        "Failed checkpoint! You answered 0 out of 2 questions correctly. Re-watch the video sections and try again!",
      );
    }
  };

  useEffect(() => {
    async function loadPeerMaterials() {
      try {
        let courseLocal: any[] = [];
        if (Platform.OS === "web") {
          const local = localStorage.getItem("uploaded_resources");
          const localItems = local ? JSON.parse(local) : [];
          courseLocal = localItems.filter((x: any) => x.courseTitle === courseTitle);
        }

        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("course_title", courseTitle);

        if (error) throw error;
        const dbItems = data || [];
        setPeerMaterials([...courseLocal, ...dbItems]);
      } catch (e) {
        console.warn("Failed to load peer materials:", e);
        let courseLocal: any[] = [];
        if (Platform.OS === "web") {
          const local = localStorage.getItem("uploaded_resources");
          const localItems = local ? JSON.parse(local) : [];
          courseLocal = localItems.filter((x: any) => x.courseTitle === courseTitle);
        }
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
        `"${m.title}" has been saved in local cache memory for offline access.`,
      );
    }
    setViewingResource(m);
  };

  const handleDeletePeerMaterial = async (id: string) => {
    setPeerMaterials((prev) => prev.filter((x) => x.id !== id));
    if (Platform.OS === "web") {
      const local = localStorage.getItem("uploaded_resources");
      if (local) {
        const localItems = JSON.parse(local);
        const updated = localItems.filter((x: any) => x.id !== id);
        localStorage.setItem("uploaded_resources", JSON.stringify(updated));
      }
    }
    try {
      await supabase.from("resources").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete remote resource:", e);
    }
    Alert.alert("Success", "Your uploaded resource has been deleted successfully.");
  };

  const handleQuizSubmit = (sectionIdx: number) => {
    const sectList = sections;
    if (!sectList || showQuizSectionIdx === null) return;
    const sect = sectList[sectionIdx];
    if (selectedQuizOption === null) {
      Alert.alert("Error", "Please select an answer first.");
      return;
    }

    const isCorrect = selectedQuizOption === sect.quiz.correctAnswer;

    const updated = {
      ...completedQuizzes,
      [sectionIdx]: { selected: selectedQuizOption, correct: isCorrect },
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
        msg: "Correct! Score: 1/1. You have earned +50 XP!",
      });
      store.addXp(50);
    } else {
      setQuizFeedback({
        type: "incorrect",
        msg: "Incorrect. Score: 0/1. Re-watch the video section and try again!",
      });
    }
  };

  const closeWindow = () => {
    if (Platform.OS === "web") {
      navigate({ to: "/" });
    } else {
      try {
        navigation.goBack();
      } catch (e) {
        console.warn("Failed to go back on mobile:", e);
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
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
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#090d16",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 20,
                  }}
                >
                  <MaterialCommunityIcons
                    name="video-off"
                    size={48}
                    color="#475569"
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={{ color: "#94a3b8", fontSize: 15, fontWeight: "600" }}>
                    Lesson Paused for Checkpoint Quiz
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    Resume watching after closing the quiz
                  </Text>
                </View>
              )
            ) : !showFifteenMinQuiz ? (
              <WebView
                style={{ flex: 1, borderRadius: 20 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                source={{
                  html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
                            iframe { width: 100%; height: 100%; border: none; }
                          </style>
                        </head>
                        <body>
                          <iframe
                            src="${videoUrl}?autoplay=1&enablejsapi=1&origin=https://google.com&start=${activeStartSec}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                            referrerpolicy="strict-origin-when-cross-origin"
                          ></iframe>
                        </body>
                      </html>
                    `,
                  baseUrl: "https://google.com",
                }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#090d16",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 20,
                }}
              >
                <MaterialCommunityIcons
                  name="video-off"
                  size={48}
                  color="#475569"
                  style={{ marginBottom: 12 }}
                />
                <Text style={{ color: "#94a3b8", fontSize: 15, fontWeight: "600" }}>
                  Lesson Paused for Checkpoint Quiz
                </Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  Resume watching after closing the quiz
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                getWatchUrl(videoUrl) + (activeStartSec > 0 ? `&t=${activeStartSec}s` : ""),
              )
            }
            style={styles.videoFooterRow}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="youtube" size={16} color="#ef4444" />
            <Text style={{ color: "#f8fafc", fontSize: 11, fontWeight: "600", marginLeft: 6 }}>
              Source Lesson Video
            </Text>
          </TouchableOpacity>
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
                <TouchableOpacity
                  onPress={() => {
                    setShowQuizSectionIdx(null);
                    setSelectedQuizOption(null);
                    setQuizFeedback(null);
                  }}
                >
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
                      {sect.quiz.options.map((opt: string, oIdx: number) => {
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
                            <View
                              style={[
                                styles.quizOptionCircle,
                                isSel && styles.quizOptionCircleActive,
                              ]}
                            >
                              {isSel && <View style={styles.quizOptionInner} />}
                            </View>
                            <Text
                              style={[styles.quizOptionText, isSel && styles.quizOptionTextActive]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {quizFeedback && (
                      <View
                        style={[
                          styles.feedbackBox,
                          quizFeedback.type === "correct"
                            ? styles.feedbackCorrect
                            : styles.feedbackIncorrect,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={quizFeedback.type === "correct" ? "check-circle" : "alert-circle"}
                          size={16}
                          color={quizFeedback.type === "correct" ? "#10b981" : "#ef4444"}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.feedbackText,
                            quizFeedback.type === "correct"
                              ? styles.textCorrect
                              : styles.textIncorrect,
                          ]}
                        >
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
                              : "Incorrect. Score: 0/1. Re-watch the video section and try again!",
                          });
                        }}
                        style={[
                          styles.sectionQuizBtn,
                          completedQuizzes[sIdx].correct
                            ? { backgroundColor: "#10b981" }
                            : { backgroundColor: "#ef4444" },
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
                        <MaterialCommunityIcons
                          name="trophy-outline"
                          size={12}
                          color="#ffffff"
                          style={{ marginRight: 4 }}
                        />
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
                {(materials.length > 0
                  ? materials
                  : [
                      {
                        label: "EduSync Course Study Manual (PDF)",
                        url: "https://developer.mozilla.org/en-US/docs/Learn",
                        type: "doc",
                      },
                      {
                        label: "Topic Reference Guides & Examples",
                        url: "https://dev.to",
                        type: "article",
                      },
                      {
                        label: "Interactive Coding Sandbox Practice",
                        url: "https://www.freecodecamp.org/learn",
                        type: "tutorial",
                      },
                    ]
                ).map((m, idx) => {
                  let icon = "file-pdf-box";
                  if (m.type === "article") icon = "pencil-box-outline";
                  if (m.type === "tutorial") icon = "folder-outline";
                  return (
                    <View key={`static_${idx}`} style={styles.materialItemRow}>
                      <TouchableOpacity
                        onPress={() =>
                          handleOpenPeerMaterial({
                            ...m,
                            title: m.label,
                            author: "System Instructor",
                          })
                        }
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
                <Text style={[styles.materialsSubHeader, { marginTop: 16 }]}>
                  Student Shared Notes
                </Text>
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
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={14}
                                color="#ef4444"
                              />
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
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {viewingResource?.title}
                </Text>
                <Text style={styles.viewerSubtitle}>
                  Uploaded by {viewingResource?.author} • {viewingResource?.type}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setViewingResource(null)}
                style={styles.viewerCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.viewerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.viewerBody}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {viewingResource?.fileContent ? (
                <>
                  {viewingResource.fileType?.startsWith("image/") ? (
                    <Image
                      source={{ uri: viewingResource.fileContent }}
                      style={{
                        width: "100%",
                        height: 350,
                        borderRadius: 16,
                        backgroundColor: "#0f172a",
                      }}
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
                    This reference material has been prepared to help you study dynamic concepts
                    related to {courseTitle}.{"\n\n"}Revisit this guide to prepare for checkpoints!
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
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
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
                Great job! You have watched 15 minutes of this lesson video. Answer these 2
                questions based on what you have learned to complete the course and submit your
                progress:
              </Text>

              <View style={styles.fifteenBody}>
                {/* Question 1 */}
                {sections[0] && (
                  <View style={styles.fifteenQCard}>
                    <Text style={styles.fifteenQText}>Q1: {sections[0].quiz.question}</Text>
                    <View style={styles.fifteenOptions}>
                      {sections[0].quiz.options.map((opt: string, oIdx: number) => {
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
                            <Text
                              style={[styles.quizOptionText, isSel && styles.quizOptionTextActive]}
                            >
                              {opt}
                            </Text>
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
                      {sections[1].quiz.options.map((opt: string, oIdx: number) => {
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
                            <Text
                              style={[styles.quizOptionText, isSel && styles.quizOptionTextActive]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {fifteenMinQuizFeedback && (
                <View style={styles.fifteenScoreBox}>
                  <Text style={styles.fifteenScoreText}>Your Score: {fifteenMinScore} / 2</Text>
                  <Text style={styles.fifteenFeedbackText}>{fifteenMinQuizFeedback}</Text>
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
                    {fifteenMinScore < 1 ? (
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
                        <Text style={styles.fifteenSubmitText}>
                          🔄 Try Again / Go Back to Lesson
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        {fifteenMinScore < 2 && (
                          <TouchableOpacity
                            style={[styles.fifteenSubmitBtn, { backgroundColor: "#ea580c" }]}
                            onPress={() => {
                              setQ1Answer(null);
                              setQ2Answer(null);
                              setFifteenMinScore(null);
                              setFifteenMinQuizFeedback(null);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.fifteenSubmitText}>🔄 Retry for Perfect Score</Text>
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
                      </>
                    )}
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
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignSelf: "flex-start",
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
