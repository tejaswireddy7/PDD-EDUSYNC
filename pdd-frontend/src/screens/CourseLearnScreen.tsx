import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Platform, Modal, Alert, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";

const COURSE_VIDEOS: Record<string, string> = {
  "HTML5, CSS3, & Modern Grid": "https://www.youtube.com/embed/Dp3c7G1Qhgo",
  "JavaScript Fundamentals & DOM": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "Intro to React & Component States": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "React Native & Expo Ecosystem": "https://www.youtube.com/embed/zjsYHGK6a4Q",
  "SQL Fundamentals & Relational DBs": "https://www.youtube.com/embed/HXTt1AjbTtc",
  "Intro to Node.js & REST API": "https://www.youtube.com/embed/Oe421EPjeBE",
  "Pandas & Numpy Data Wrangling": "https://www.youtube.com/embed/V_xro1bcAuA"
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

export default function CourseLearnScreen() {
  const store = useDashboardStore();
  
  // Extract course title from search queries
  const params = new URLSearchParams(Platform.OS === "web" ? window.location.search : "");
  const courseTitle = params.get("course") || "React Native & Expo Ecosystem";

  const videoUrl = COURSE_VIDEOS[courseTitle] || "https://www.youtube.com/embed/zjsYHGK6a4Q";

  // Timeline and Quiz States
  const [activeStartSec, setActiveStartSec] = useState<number>(0);
  const [showQuizSectionIdx, setShowQuizSectionIdx] = useState<number | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ type: "correct" | "incorrect"; msg: string } | null>(null);
  const [peerMaterials, setPeerMaterials] = useState<any[]>([]);
  const [viewingResource, setViewingResource] = useState<any | null>(null);

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
    const sectList = COURSE_SECTIONS[courseTitle];
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

  const sections = COURSE_SECTIONS[courseTitle] || defaultSections;

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
              <iframe
                width="100%"
                height="100%"
                src={`${videoUrl}?autoplay=1&start=${activeStartSec}`}
                title={courseTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ borderRadius: 20, border: "none" }}
              />
            ) : (
              <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#fff" }}>Playback only supported on Web version.</Text>
              </View>
            )}
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
                    
                    <TouchableOpacity
                      onPress={() => {
                        setShowQuizSectionIdx(sIdx);
                        setSelectedQuizOption(null);
                        setQuizFeedback(null);
                      }}
                      style={styles.sectionQuizBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="award" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.sectionQuizBtnText}>Quiz</Text>
                    </TouchableOpacity>
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
                {peerMaterials.length === 0 ? (
                  <View style={styles.emptyUploadsCard}>
                    <MaterialCommunityIcons name="folder-open-outline" size={32} color="#64748b" />
                    <Text style={styles.emptyUploadsText}>
                      No peer documents uploaded yet for this course. Be the first to upload reference study notes or PDFs in the Resource Hub!
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
    fontWeight: "850",
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
});
