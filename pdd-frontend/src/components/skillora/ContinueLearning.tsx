import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Platform, Modal } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigate } from "@tanstack/react-router";
import { useDashboardStore } from "../../lib/store";

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

export function ContinueLearning() {
  const store = useDashboardStore();
  const navigate = useNavigate();
  const courses = store.recommendations?.courses || [];
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [videoTitle, setVideoTitle] = React.useState<string>("");

  const materials = COURSE_MATERIALS[videoTitle] || [
    { label: "EduSync Course Study Manual (PDF)", url: "https://developer.mozilla.org/en-US/docs/Learn", type: "doc" as const },
    { label: "Topic Reference Guides & Examples", url: "https://dev.to", type: "article" as const },
    { label: "FreeCodeCamp Interactive Exercises", url: "https://www.freecodecamp.org/learn", type: "tutorial" as const }
  ];

  const getWatchUrl = (embedUrl: string) => {
    return embedUrl.replace("/embed/", "/watch?v=");
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
                <Text style={styles.materialsSubtitle}>Course Syllabus & Guide</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {videoUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(getWatchUrl(videoUrl))}
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
                  src={`${videoUrl}?autoplay=1`}
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

            {/* STUDY MATERIALS SECTION */}
            <View style={styles.materialsSection}>
              <Text style={styles.materialsHeader}>Course Learning Materials</Text>
              <View style={styles.materialsList}>
                {materials.map((m, idx) => {
                  let icon = "book-open";
                  if (m.type === "tutorial") icon = "code";
                  if (m.type === "article") icon = "file-text";
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => Linking.openURL(m.url)}
                      style={styles.materialItem}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                        <Feather name={icon as any} size={13} color="#6366f1" style={{ marginTop: 1 }} />
                        <Text style={styles.materialLabel} numberOfLines={1}>
                          {m.label}
                        </Text>
                      </View>
                      <Feather name="external-link" size={12} color="#94a3b8" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* GO TO ASSESSMENTS ACTION BUTTON */}
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
    marginBottom: 16,
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
    marginBottom: 16,
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
});
