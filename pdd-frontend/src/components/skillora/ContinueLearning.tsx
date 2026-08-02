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
              const url = COURSE_VIDEOS[c.title] || "https://www.youtube.com/embed/zjsYHGK6a4Q";
              setVideoTitle(c.title);
              setVideoUrl(url);
              setActiveStartSec(0);
              setShowQuizSectionIdx(null);
              setSelectedQuizOption(null);
              setQuizFeedback(null);
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

      <Modal
        visible={!!videoUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoUrl(null)}
      >
        <View style={styles.videoOverlay}>
          <View style={styles.videoModal}>
            <View style={styles.videoHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.videoTitle} numberOfLines={1}>{videoTitle}</Text>
                <Text style={styles.materialsSubtitle}>Interactive Learning Hub</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {videoUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(getWatchUrl(videoUrl) + (activeStartSec > 0 ? `&t=${activeStartSec}s` : ""))}
                    style={styles.watchOnYTBtn}
                    activeOpacity={0.75}
                  >
                    <Feather name="youtube" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.watchOnYTText}>Watch on YouTube</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setVideoUrl(null)} style={styles.closeBtn}>
                  <Feather name="x" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.videoPlayerContainer}>
              {Platform.OS === "web" && videoUrl ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`${videoUrl}?autoplay=1&start=${activeStartSec}`}
                  title={videoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ borderRadius: 16, border: "none" }}
                />
              ) : (
                <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#fff" }}>Playback only supported on Web version.</Text>
                </View>
              )}
            </View>

            {/* SECTION QUIZ OVERLAY PANEL */}
            {showQuizSectionIdx !== null && (
              <View style={styles.quizPanel}>
                <View style={styles.quizPanelHeader}>
                  <Text style={styles.quizPanelTitle}>
                    Section Quiz: Lesson {showQuizSectionIdx + 1}
                  </Text>
                  <TouchableOpacity onPress={() => { setShowQuizSectionIdx(null); setSelectedQuizOption(null); setQuizFeedback(null); }}>
                    <Feather name="x-circle" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {(() => {
                  const sect = COURSE_SECTIONS[videoTitle]?.[showQuizSectionIdx];
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
                          <Feather
                            name={quizFeedback.type === "correct" ? "check-circle" : "alert-circle"}
                            size={14}
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
                      ) : (
                        <TouchableOpacity
                          style={[styles.quizSubmitBtn, { backgroundColor: "#475569" }]}
                          onPress={() => {
                            setShowQuizSectionIdx(null);
                            setSelectedQuizOption(null);
                            setQuizFeedback(null);
                          }}
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
            {COURSE_SECTIONS[videoTitle] && showQuizSectionIdx === null && (
              <View style={styles.sectionsContainer}>
                <Text style={styles.sectionsHeaderTitle}>Divided Video Lessons</Text>
                <ScrollView style={{ maxHeight: 140 }} showsVerticalScrollIndicator={true}>
                  {COURSE_SECTIONS[videoTitle].map((sect, sIdx) => (
                    <View key={sIdx} style={styles.sectionItemRow}>
                      <TouchableOpacity
                        onPress={() => setActiveStartSec(sect.startSec)}
                        style={styles.sectionPlayPart}
                        activeOpacity={0.7}
                      >
                        <View style={styles.sectionPlayIconCircle}>
                          <Feather name="play" size={10} color="#6366f1" style={{ marginLeft: 1 }} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sectionItemTitle} numberOfLines={2}>
                            {sect.title}
                          </Text>
                          <Text style={styles.sectionItemDuration}>{sect.duration}</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => {
                          setShowQuizSectionIdx(sIdx);
                          setSelectedQuizOption(null);
                          setQuizFeedback(null);
                        }}
                        style={styles.sectionQuizBtn}
                        activeOpacity={0.7}
                      >
                        <Feather name="award" size={10} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.sectionQuizBtnText}>Quiz</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* SYLLABUS STUDY MATERIALS & DOCUMENTS (DYNAMIC DATA ONLY) */}
            {showQuizSectionIdx === null && (
              <View style={styles.peerSection}>
                <Text style={styles.peerHeader}>Syllabus Study Materials & Documents</Text>
                <View style={styles.materialsList}>
                  {peerMaterials.length === 0 ? (
                    <View style={styles.emptyUploadsCard}>
                      <Feather name="folder-open" size={24} color="#94a3b8" />
                      <Text style={styles.emptyUploadsText}>
                        No peer documents uploaded yet for this course. Be the first to upload reference study notes or PDFs in the Resource Hub!
                      </Text>
                    </View>
                  ) : (
                    peerMaterials.map((p, idx) => {
                      let icon = "file";
                      if (p.type === "Notes") icon = "edit-3";
                      if (p.type === "PDF") icon = "file-text";
                      if (p.type === "Project") icon = "folder";
                      return (
                        <View key={p.id || idx} style={styles.materialItemRow}>
                          <TouchableOpacity
                            onPress={() => handleOpenPeerMaterial(p)}
                            style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.peerIconBox}>
                              <Feather name={icon as any} size={13} color="#14b8a6" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.materialLabel} numberOfLines={1}>
                                {p.title}
                              </Text>
                              <Text style={styles.authorLabel}>Uploaded by {p.author}</Text>
                            </View>
                          </TouchableOpacity>
                          
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Feather name="eye" size={12} color="#94a3b8" />
                            {p.id?.startsWith("uploaded_") && (
                              <TouchableOpacity
                                onPress={() => handleDeletePeerMaterial(p.id)}
                                style={styles.deletePeerBtn}
                                activeOpacity={0.7}
                              >
                                <Feather name="trash-2" size={12} color="#ef4444" />
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

            {/* ASSESSMENTS ACTION BUTTON */}
            {showQuizSectionIdx === null && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.quizBtn}
                  onPress={() => {
                    setVideoUrl(null);
                    navigate({ to: "/assessments" });
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.quizBtnText}>Test Your Knowledge (Go to Quiz)</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* 3. UPLOADED RESOURCE VIEWER MODAL */}
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
              <TouchableOpacity onPress={() => setViewingResource(null)} style={styles.viewerCloseBtn}>
                <Feather name="x" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.viewerBody} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={true}>
              {viewingResource?.fileContent ? (
                <>
                  {viewingResource.fileType?.startsWith("image/") ? (
                    <Image
                      source={{ uri: viewingResource.fileContent }}
                      style={{ width: "100%", height: 320, borderRadius: 16, backgroundColor: "#0f172a" }}
                      resizeMode="contain"
                    />
                  ) : viewingResource.fileType?.includes("pdf") ? (
                    Platform.OS === "web" ? (
                      <iframe
                        src={viewingResource.fileContent}
                        style={{ width: "100%", height: 420, borderRadius: 16, border: "none" }}
                      />
                    ) : (
                      <View style={styles.pdfFallback}>
                        <Feather name="file-text" size={48} color="#a5b4fc" />
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
                // Fallback for preseeded / notes preview
                <View style={styles.notesTextContainer}>
                  <Text style={styles.notesTextContent}>
                    {viewingResource?.title} description and details:\n\n
                    This reference material has been prepared to help you study dynamic concepts related to {viewingResource?.courseTitle || videoTitle}.\n\nRevisit this guide to prepare for checkpoints!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
