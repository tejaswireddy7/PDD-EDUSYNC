import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useDashboardStore } from "../../lib/store";
import { useNavigate } from "@tanstack/react-router";

const RESOURCE_VIDEOS: Record<string, string> = {
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
  "Interactive CSS Flexbox Playground": "https://www.youtube.com/embed/Dp3c7G1Qhgo",
  "Next.js Core Web Vitals Optimization Guides": "https://www.youtube.com/embed/59IXY5IDYbA",
  "Tailwind UI Layout Best Practices": "https://www.youtube.com/embed/m7OWXtbiXX8",
  "System Design Interview Cheat Sheet": "https://www.youtube.com/embed/gvkqT_qiVxM",
  "PostgreSQL Window Functions Explained": "https://www.youtube.com/embed/7VfZYMXZmeI",
  "Docker Containerization Fundamentals": "https://www.youtube.com/embed/Oe421EPjeBE",
  "React Native Performance Debugging Tools": "https://www.youtube.com/embed/gvkqT_qiVxM",
  "Expo Router Dynamic Linking Manual": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "iOS Native UI Optimization Principles": "https://www.youtube.com/embed/F2CznepmCg4",
  "Python OOP and Memory Structures": "https://www.youtube.com/embed/_uQrJ0TkZlc",
  "Calculus behind SGD Backpropagation": "https://www.youtube.com/embed/V_xro1bcAuA",
  "Hugging Face LLM Pipeline Integration Guides": "https://www.youtube.com/embed/_uQrJ0TkZlc",
};

const getResourceVideo = (title: string): string => {
  const matched = RESOURCE_VIDEOS[title];
  if (matched) return matched;
  const lower = title.toLowerCase();
  if (lower.includes("next.js") || lower.includes("nextjs") || lower.includes("ssr")) return "https://www.youtube.com/embed/Dp3c7G1Qhgo";
  if (lower.includes("react native") || lower.includes("expo") || lower.includes("mobile")) return "https://www.youtube.com/embed/gvkqT_qiVxM";
  if (lower.includes("react") || lower.includes("frontend") || lower.includes("html") || lower.includes("css")) return "https://www.youtube.com/embed/Ke90Tje7VS0";
  if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("devops")) return "https://www.youtube.com/embed/Oe421EPjeBE";
  if (lower.includes("pandas") || lower.includes("numpy") || lower.includes("pytorch") || lower.includes("ai") || lower.includes("python")) return "https://www.youtube.com/embed/V_xro1bcAuA";
  if (lower.includes("sql") || lower.includes("database") || lower.includes("postgresql")) return "https://www.youtube.com/embed/HXTt1AjbTtc";
  return "https://www.youtube.com/embed/zjsYHGK6a4Q";
};

export function ResourceHub() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "General";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const navigate = useNavigate();

  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [videoTitle, setVideoTitle] = React.useState<string>("");

  const openResourceUrl = (title: string) => {
    const embedUrl = getResourceVideo(title);
    setVideoTitle(title);
    setVideoUrl(embedUrl);
  };

  const dynamicResources = useMemo(() => {
    const list = store.recommendations?.resources || [];
    return list.map((res, index) => ({
      id: `hub_res_${index}`,
      title: res.title,
      subject: focusDomain,
      level: userProficiency,
      rating: 4.8 + (index * 0.05) > 5 ? 5.0 : parseFloat((4.8 + (index * 0.05)).toFixed(1)),
      downloads: `${4.5 + index}k`,
      trending: index === 0,
      author: "EduSync AI Coach"
    }));
  }, [store.recommendations?.resources, focusDomain, userProficiency]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Collaborative Resource Hub</Text>
          <Text style={styles.subTitle}>Notes & projects shared by peers</Text>
        </View>
        <TouchableOpacity onPress={() => navigate({ to: "/resources" })}>
          <Text style={styles.exploreAll}>Explore all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {dynamicResources.map((r) => (
          <TouchableOpacity 
            key={r.id} 
            style={styles.card}
            onPress={() => openResourceUrl(r.title)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Feather name="file-text" size={16} color="#6366f1" />
              </View>
              <TouchableOpacity>
                <Feather name="bookmark" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, styles.bgPrimary]}>
                <Text style={[styles.badgeText, styles.textPrimary]}>{r.subject}</Text>
              </View>
              <View style={[styles.badge, styles.bgMuted]}>
                <Text style={[styles.badgeText, styles.textGray]}>{r.level}</Text>
              </View>
              {r.trending && (
                <View style={[styles.badge, styles.bgMint]}>
                  <Feather name="trending-up" size={10} color="#0d9488" />
                  <Text style={[styles.badgeText, styles.textMint]}>Trending</Text>
                </View>
              )}
            </View>

            <Text style={styles.resourceTitle} numberOfLines={2}>
              {r.title}
            </Text>

            <View style={styles.footer}>
              <Text style={styles.author} numberOfLines={1}>by {r.author}</Text>
              <View style={styles.stats}>
                <View style={styles.statRow}>
                  <FontAwesome name="star" size={10} color="#0d9488" />
                  <Text style={styles.statText}>{r.rating}</Text>
                </View>
                <View style={styles.statRow}>
                  <Feather name="download" size={10} color="#64748b" />
                  <Text style={styles.statText}>{r.downloads}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

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

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  subTitle: {
    fontSize: 11,
    color: "#64748b",
  },
  exploreAll: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBox: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  bgMuted: {
    backgroundColor: "#f1f5f9",
  },
  bgMint: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  textPrimary: {
    color: "#6366f1",
  },
  textGray: {
    color: "#64748b",
  },
  textMint: {
    color: "#0d9488",
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  author: {
    fontSize: 10,
    color: "#64748b",
    flex: 1,
    paddingRight: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statText: {
    fontSize: 10,
    color: "#64748b",
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
