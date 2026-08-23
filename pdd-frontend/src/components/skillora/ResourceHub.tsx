import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useDashboardStore, themeColors } from "../../lib/store";
import { useNavigate } from "@tanstack/react-router";
import { WebView } from "react-native-webview";

const RESOURCE_VIDEOS: Record<string, string> = {
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

  // Extra Hub items
  "Interactive CSS Flexbox Playground": "https://www.youtube.com/embed/0xMQfnTU6oo",
  "Next.js Core Web Vitals Optimization Guides": "https://www.youtube.com/embed/t5fjIW3tB00",
  "Tailwind UI Layout Best Practices": "https://www.youtube.com/embed/m7OWXtbiXX8",
  "System Design Interview Cheat Sheet": "https://www.youtube.com/embed/oSkTPzOGMuw",
  "PostgreSQL Window Functions Explained": "https://www.youtube.com/embed/qw--VYLpxG4",
  "Docker Containerization Fundamentals": "https://www.youtube.com/embed/rjjES5IsPdg",
  "React Native Performance Debugging Tools": "https://www.youtube.com/embed/0-S5a0eXPoc",
  "Expo Router Dynamic Linking Manual": "https://www.youtube.com/embed/0-S5a0eXPoc",
  "iOS Native UI Optimization Principles": "https://www.youtube.com/embed/HXoVSbwWUIk",
  "Python OOP and Memory Structures": "https://www.youtube.com/embed/_uQrJ0TkZlc",
  "Calculus behind SGD Backpropagation": "https://www.youtube.com/embed/V_xro1bcAuA",
  "Hugging Face LLM Pipeline Integration Guides": "https://www.youtube.com/embed/V_xro1bcAuA",
};

const getResourceVideo = (title: string): string => {
  const matched = RESOURCE_VIDEOS[title];
  if (matched) return matched;
  const lower = title.toLowerCase();
  if (lower.includes("next.js") || lower.includes("nextjs") || lower.includes("ssr")) return "https://www.youtube.com/embed/wm5gMKuwSYk";
  if (lower.includes("react native") || lower.includes("expo") || lower.includes("mobile")) return "https://www.youtube.com/embed/0-S5a0eXPoc";
  if (lower.includes("react") || lower.includes("frontend") || lower.includes("html") || lower.includes("css")) return "https://www.youtube.com/embed/Ke90Tje7VS0";
  if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("devops")) return "https://www.youtube.com/embed/rjjES5IsPdg";
  if (lower.includes("pandas") || lower.includes("numpy") || lower.includes("pytorch") || lower.includes("ai") || lower.includes("python")) return "https://www.youtube.com/embed/V_xro1bcAuA";
  if (lower.includes("sql") || lower.includes("database") || lower.includes("postgresql")) return "https://www.youtube.com/embed/7S_tz1z_5bA";
  return "https://www.youtube.com/embed/hdI2bqOjy3c";
};

const getResourceIcon = (title: string, type?: string) => {
  const lowerTitle = title.toLowerCase();
  const lowerType = (type || "").toLowerCase();
  
  if (lowerTitle.includes("video") || lowerType.includes("video") || lowerType.includes("tutorial")) {
    return "play-circle";
  }
  if (lowerTitle.includes("sandbox") || lowerTitle.includes("playground") || lowerType.includes("sandbox") || lowerType.includes("tool")) {
    return "terminal";
  }
  if (lowerTitle.includes("cheat sheet") || lowerTitle.includes("manual") || lowerType.includes("sheet") || lowerType.includes("doc") || lowerTitle.includes("pdf")) {
    return "file";
  }
  if (lowerTitle.includes("code") || lowerTitle.includes("programming") || lowerType.includes("code") || lowerType.includes("lab")) {
    return "code";
  }
  if (lowerTitle.includes("guide") || lowerTitle.includes("explain") || lowerType.includes("article") || lowerType.includes("blog")) {
    return "book-open";
  }
  return "file-text";
};

export function ResourceHub() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "General";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const navigate = useNavigate();
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

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
      type: res.type,
      subject: focusDomain,
      level: userProficiency,
      rating: 4.8 + (index * 0.05) > 5 ? 5.0 : parseFloat((4.8 + (index * 0.05)).toFixed(1)),
      downloads: `${4.5 + index}k`,
      trending: index === 0,
      author: "EduSync Network"
    }));
  }, [store.recommendations?.resources, focusDomain, userProficiency]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: currentColors.text }]}>Collaborative Resource Hub</Text>
          <Text style={[styles.subTitle, { color: currentColors.subtext }]}>Notes & projects shared by peers</Text>
        </View>
        <TouchableOpacity onPress={() => navigate({ to: "/resources" })}>
          <Text style={[styles.exploreAll, { color: currentColors.primary }]}>Explore all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {dynamicResources.map((r) => (
          <TouchableOpacity 
            key={r.id} 
            style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}
            onPress={() => openResourceUrl(r.title)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, isDark && { backgroundColor: currentColors.divider }]}>
                <Feather name={getResourceIcon(r.title, r.type) as any} size={16} color="#6366f1" />
              </View>
              <TouchableOpacity>
                <Feather name="bookmark" size={16} color={currentColors.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, styles.bgPrimary]}>
                <Text style={[styles.badgeText, styles.textPrimary]}>{r.subject}</Text>
              </View>
              <View style={[styles.badge, isDark ? { backgroundColor: currentColors.divider } : styles.bgMuted]}>
                <Text style={[styles.badgeText, { color: currentColors.subtext }]}>{r.level}</Text>
              </View>
              {r.trending && (
                <View style={[styles.badge, styles.bgMint]}>
                  <Feather name="trending-up" size={10} color="#0d9488" />
                  <Text style={[styles.badgeText, styles.textMint]}>Trending</Text>
                </View>
              )}
            </View>

            <Text style={[styles.resourceTitle, { color: currentColors.text }]} numberOfLines={2}>
              {r.title}
            </Text>

            <View style={styles.footer}>
              <Text style={[styles.author, { color: currentColors.subtext }]} numberOfLines={1}>by {r.author}</Text>
              <View style={styles.stats}>
                <View style={styles.statRow}>
                  <FontAwesome name="star" size={10} color="#0d9488" />
                  <Text style={[styles.statText, { color: currentColors.subtext }]}>{r.rating}</Text>
                </View>
                <View style={styles.statRow}>
                  <Feather name="download" size={10} color={currentColors.subtext} />
                  <Text style={[styles.statText, { color: currentColors.subtext }]}>{r.downloads}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {videoUrl && (
        <View style={styles.videoOverlay}>
          <View style={[styles.videoModal, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
            <View style={styles.videoHeader}>
              <Text style={[styles.videoTitle, { color: currentColors.text }]} numberOfLines={1}>{videoTitle}</Text>
              <TouchableOpacity onPress={() => setVideoUrl(null)} style={styles.closeBtn}>
                <Feather name="x" size={18} color={currentColors.text} />
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
                <WebView
                  style={{ flex: 1, borderRadius: 16 }}
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
                            src="${videoUrl}?autoplay=1&origin=https://google.com"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                            referrerpolicy="strict-origin-when-cross-origin"
                          ></iframe>
                        </body>
                      </html>
                    `,
                    baseUrl: "https://google.com"
                  }}
                />
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
