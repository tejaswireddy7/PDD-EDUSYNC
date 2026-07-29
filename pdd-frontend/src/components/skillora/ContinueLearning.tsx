import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

export function ContinueLearning() {
  const store = useDashboardStore();
  const courses = store.recommendations?.courses || [];
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [videoTitle, setVideoTitle] = React.useState<string>("");

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

      {videoUrl && (
        <View style={styles.videoOverlay}>
          <View style={styles.videoModal}>
            <View style={styles.videoHeader}>
              <Text style={styles.videoTitle} numberOfLines={1}>{videoTitle}</Text>
              <TouchableOpacity onPress={() => setVideoUrl(null)} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoPlayerContainer}>
              {Platform.OS === "web" ? (
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
          </View>
        </View>
      )}
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
    position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  videoModal: {
    width: "95%",
    maxWidth: 680,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    paddingRight: 12,
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
  },
});
