import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Platform, Modal, Alert, Image } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigate } from "@tanstack/react-router";
import { useDashboardStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";

const COURSE_VIDEOS: Record<string, string> = {
  "HTML5, CSS3, & Modern Grid": "https://www.youtube.com/embed/Dp3c7G1Qhgo",
  "JavaScript Fundamentals & DOM": "https://www.youtube.com/embed/hdI2bqOjy3c",
  "Intro to React & Component States": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "Intro to Node.js & REST API": "https://www.youtube.com/embed/Oe421EPjeBE",
  "SQL Fundamentals & Relational DBs": "https://www.youtube.com/embed/HXTt1AjbTtc",
  "React Native & Expo Ecosystem": "https://www.youtube.com/embed/gvkqT_qiVxM",
  "Python Fundamentals & Packages": "https://www.youtube.com/embed/_uQrJ0TkZlc",
  "Neural Networks with PyTorch": "https://www.youtube.com/embed/V_xro1bcAuA",
  "React Router & Global Context": "https://www.youtube.com/embed/59IXY5IDYbA",
  "Tailwind CSS & Responsive Layouts": "https://www.youtube.com/embed/m7OWXtbiXX8",
  "TypeScript Essentials for Web": "https://www.youtube.com/embed/zQnOB4tV3MC",
  "Java Spring Boot Microservices": "https://www.youtube.com/embed/35EQXmHKZYs",
  "PostgreSQL Queries & Optimization": "https://www.youtube.com/embed/7VfZYMXZmeI",
  "SwiftUI Mastery for iOS Platforms": "https://www.youtube.com/embed/F2CznepmCg4",
  "Kotlin & Android Jetpack UI": "https://www.youtube.com/embed/Ch5QqJmOzCQ",
  "Pandas & Numpy Data Wrangling": "https://www.youtube.com/embed/F6kmIpWWEdU",
  "Basics of Routing & HTTP Methods": "https://www.youtube.com/embed/yQleTeoUskc",
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
    { label: "React Tutorial: Tic-Tac-Toe Game", url: "https://react.dev/learn/tutorial-tic-tac-toe", type: "tutorial" },
    { label: "Thinking in React: Design Paradigm", url: "https://react.dev/learn/thinking-in-react", type: "article" }
  ],
  "React Native & Expo Ecosystem": [
    { label: "React Native: Interactive Core APIs Docs", url: "https://reactnative.dev/docs/components-and-apis", type: "doc" },
    { label: "Expo Docs: Learn the App Workflow", url: "https://docs.expo.dev/", type: "doc" },
    { label: "React Native Express: Quick Reference Guide", url: "http://www.reactnativeexpress.com/", type: "tutorial" }
  ],
  "Python Fundamentals & Packages": [
    { label: "Python 3 Official Tutorial", url: "https://docs.python.org/3/tutorial/", type: "doc" },
    { label: "Real Python: Interactive Learning Paths", url: "https://realpython.com/python-first-steps/", type: "article" },
    { label: "W3Schools Python Syntax Reference", url: "https://www.w3schools.com/python/", type: "tutorial" }
  ],
  "Neural Networks with PyTorch": [
    { label: "PyTorch Official API & Getting Started Tutorials", url: "https://pytorch.org/tutorials/", type: "doc" },
    { label: "Deep Learning with PyTorch (Free PDF book)", url: "https://pytorch.org/assets/deep-learning/Deep-Learning-with-PyTorch.pdf", type: "doc" },
    { label: "3Blue1Brown Neural Networks Playlists", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", type: "tutorial" }
  ],
  "SQL Fundamentals & Relational DBs": [
    { label: "W3Schools SQL Syntax Tutorials", url: "https://www.w3schools.com/sql/", type: "tutorial" },
    { label: "SQLBolt: Interactive SQL Tutorials", url: "https://sqlbolt.com/", type: "tutorial" },
    { label: "PostgreSQL Tutorial for Beginners", url: "https://www.postgresqltutorial.com/", type: "doc" }
  ],
  "Intro to Node.js & REST API": [
    { label: "Node.js Official Documentation Guide", url: "https://nodejs.org/en/docs/guides", type: "doc" },
    { label: "MDN Express Tutorial: Local Library App", url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs", type: "tutorial" },
    { label: "REST API Design Best Practices", url: "https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/", type: "article" }
  ],
  "Pandas & Numpy Data Wrangling": [
    { label: "Pandas User Guide & Cookbook", url: "https://pandas.pydata.org/docs/user_guide/index.html", type: "doc" },
    { label: "NumPy Quickstart Tutorial", url: "https://numpy.org/doc/stable/user/quickstart.html", type: "doc" },
    { label: "Kaggle: Pandas Practical Course", url: "https://www.kaggle.com/learn/pandas", type: "tutorial" }
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
        question: "Which HTML5 semantic element is most appropriate for a self-contained syndicatable blog post?",
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
  ]
};

export function ContinueLearning() {
  const store = useDashboardStore();
  const navigate = useNavigate();
  const courses = store.recommendations?.courses || [];
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [videoTitle, setVideoTitle] = React.useState<string>("");

  // Section timeline states
  const [activeStartSec, setActiveStartSec] = React.useState<number>(0);
  const [showQuizSectionIdx, setShowQuizSectionIdx] = React.useState<number | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = React.useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = React.useState<{ type: "correct" | "incorrect"; msg: string } | null>(null);
  const [peerMaterials, setPeerMaterials] = React.useState<any[]>([]);
  const [viewingResource, setViewingResource] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!videoTitle) return;
    async function loadPeerMaterials() {
      try {
        const local = localStorage.getItem("uploaded_resources");
        const localItems = local ? JSON.parse(local) : [];
        const courseLocal = localItems.filter((x: any) => x.courseTitle === videoTitle);

        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("course_title", videoTitle);

        if (error) throw error;
        const dbItems = data || [];
        setPeerMaterials([...courseLocal, ...dbItems]);
      } catch (e) {
        console.warn("Failed to load peer materials:", e);
        const local = localStorage.getItem("uploaded_resources");
        const localItems = local ? JSON.parse(local) : [];
        const courseLocal = localItems.filter((x: any) => x.courseTitle === videoTitle);
        setPeerMaterials(courseLocal);
      }
    }
    loadPeerMaterials();
  }, [videoTitle]);

  const materials = COURSE_MATERIALS[videoTitle] || [
    { label: "EduSync Course Study Manual (PDF)", url: "https://developer.mozilla.org/en-US/docs/Learn", type: "doc" as const },
    { label: "Topic Reference Guides & Examples", url: "https://dev.to", type: "article" as const },
    { label: "FreeCodeCamp Interactive Exercises", url: "https://www.freecodecamp.org/learn", type: "tutorial" as const }
  ];

  const getWatchUrl = (embedUrl: string) => {
    return embedUrl.replace("/embed/", "/watch?v=");
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

  const handleOpenMaterial = (label: string, url: string) => {
    store.cacheMaterial(label, url);
    if (store.lowDataMode) {
      Alert.alert(
        "Low-Data Cache Success",
        `"${label}" has been saved in local cache memory for offline revisiting without internet access.`
      );
    }
    Linking.openURL(url);
  };

  const handleOpenPeerMaterial = (m: any) => {
    store.cacheMaterial(m.title, "https://developer.mozilla.org/en-US/");
    if (store.lowDataMode) {
      Alert.alert(
        "Low-Data Cache Success",
        `"${m.title}" has been saved in local cache memory for offline revisiting without internet access.`
      );
    }
    setViewingResource(m);
  };

  const handleQuizSubmit = (sectionIdx: number) => {
    const sectList = COURSE_SECTIONS[videoTitle];
    if (!sectList || showQuizSectionIdx === null) return;
    const sect = sectList[sectionIdx];
    if (selectedQuizOption === null) {
      Alert.alert("Error", "Please select an answer first.");
      return;
    }

    if (selectedQuizOption === sect.quiz.correctAnswer) {
      setQuizFeedback({
        type: "correct",
        msg: "Correct! You have earned +50 XP!"
      });
      store.addXp(50);
    } else {
      setQuizFeedback({
        type: "incorrect",
        msg: "Incorrect. Re-watch the video section and try again!"
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Continue Learning</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {courses.map((c) => (
          <TouchableOpacity 
            key={c.title} 
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => {
              if (Platform.OS === "web") {
                window.open("/course-learn?course=" + encodeURIComponent(c.title), "_blank");
              } else {
                navigate({ to: "/course-learn", search: { course: c.title } });
              }
            }}
          >
            <LinearGradient
              colors={c.colors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardHeader}
            >
              <View style={styles.badgeRow}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectText}>{c.subject}</Text>
                </View>
                {c.ai && (
                  <View style={styles.aiBadge}>
                    <MaterialCommunityIcons name={"sparkles" as any} size={10} color="#6366f1" />
                    <Text style={styles.aiText}>AI Pick</Text>
                  </View>
                )}
              </View>
              <View style={styles.playButton}>
                <Feather name="play" size={16} color="#6366f1" style={styles.playIcon} />
              </View>
            </LinearGradient>
            <View style={styles.cardBody}>
              <View style={styles.metaRow}>
                <Feather name="clock" size={12} color="#64748b" />
                <Text style={styles.metaText}>{c.time}</Text>
                <View style={styles.dot} />
                <Text style={styles.metaText}>{c.difficulty}</Text>
              </View>
              <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${c.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{c.progress}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;
const cardWidth = screenWidth * 0.72; // Premium sliding cards

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  viewAll: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
  },
  scrollContainer: {
    gap: 12,
    paddingHorizontal: 4,
  },
  card: {
    width: cardWidth,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    height: 100,
    padding: 12,
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  subjectText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aiBadge: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  aiText: {
    color: "#6366f1",
    fontSize: 9,
    fontWeight: "700",
  },
  playButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  playIcon: {
    marginLeft: 2,
  },
  cardBody: {
    padding: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: 4,
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: "#94a3b8",
    marginHorizontal: 6,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 18,
    height: 36,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  videoModal: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      }
    })
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 12,
  },
  watchOnYTBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  watchOnYTText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  materialsSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  materialsSection: {
    marginTop: 8,
    marginBottom: 18,
  },
  materialsHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
  },
  materialsList: {
    gap: 8,
  },
  materialItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  materialLabel: {
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 14,
    alignItems: "stretch",
  },
  quizBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 14,
  },
  quizBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionsContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 14,
  },
  sectionsHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  sectionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  sectionPlayPart: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  sectionPlayIconCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionItemTitle: {
    fontSize: 12,
    color: "#f1f5f9",
    fontWeight: "600",
  },
  sectionItemDuration: {
    fontSize: 10,
    color: "#38bdf8",
    marginTop: 1,
    fontWeight: "500",
  },
  sectionQuizBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sectionQuizBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  peerSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  peerHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14b8a6",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyUploadsCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 16,
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
    borderRadius: 12,
    marginBottom: 6,
  },
  peerIconBox: {
    height: 28,
    width: 28,
    borderRadius: 8,
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deletePeerBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  // Viewer styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 10000,
  },
  viewerModal: {
    width: "95%",
    maxWidth: 620,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
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
    marginBottom: 14,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  viewerSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  viewerCloseBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBody: {
    maxHeight: 480,
  },
  notesTextContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  notesTextContent: {
    fontSize: 13,
    color: "#f1f5f9",
    lineHeight: 20,
  },
  pdfFallback: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
});
