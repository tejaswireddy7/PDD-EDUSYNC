import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useDashboardStore, themeColors } from "../../lib/store";
import { useNavigate } from "@tanstack/react-router";
import { WebView } from "react-native-webview";
import { discoverAIWebResources, CuratedResource } from "../../lib/ai-resource-curator";

const getResourceIcon = (title: string, type?: string) => {
  const lowerTitle = title.toLowerCase();
  const lowerType = (type || "").toLowerCase();

  if (
    lowerTitle.includes("video") ||
    lowerType.includes("video") ||
    lowerType.includes("tutorial")
  ) {
    return "play-circle";
  }
  if (
    lowerTitle.includes("sandbox") ||
    lowerTitle.includes("playground") ||
    lowerType.includes("sandbox") ||
    lowerType.includes("tool")
  ) {
    return "terminal";
  }
  if (
    lowerTitle.includes("cheat sheet") ||
    lowerTitle.includes("manual") ||
    lowerType.includes("sheet") ||
    lowerType.includes("doc") ||
    lowerTitle.includes("pdf")
  ) {
    return "file";
  }
  if (
    lowerTitle.includes("code") ||
    lowerTitle.includes("programming") ||
    lowerType.includes("code") ||
    lowerType.includes("lab")
  ) {
    return "code";
  }
  if (
    lowerTitle.includes("guide") ||
    lowerTitle.includes("explain") ||
    lowerType.includes("article") ||
    lowerType.includes("blog")
  ) {
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

  const dynamicResources = useMemo(() => {
    // 1. Discover verified AI web resources for the current learner's focus domain
    const aiDiscovered = discoverAIWebResources(focusDomain, userProficiency);
    
    // 2. Map recommendation resources if present
    const storeList = store.recommendations?.resources || [];
    const fromStore: CuratedResource[] = storeList.map((res, index) => ({
      id: `hub_rec_${index}`,
      title: res.title,
      type: res.type as any || "Guide",
      course: focusDomain,
      subject: focusDomain,
      level: userProficiency,
      rating: 4.8 + index * 0.05 > 5 ? 5.0 : parseFloat((4.8 + index * 0.05).toFixed(1)),
      downloads: `${4.5 + index}k`,
      trending: index === 0,
      author: "EduSync AI Curator",
      source: "ai_discovered",
      ai_match_percentage: 95,
      url: "https://developer.mozilla.org/en-US/docs/Web",
    }));

    // Combine & slice top 4 for the dashboard widget
    const combined = [...aiDiscovered, ...fromStore];
    const seen = new Set<string>();
    const deduplicated = combined.filter((r) => {
      if (seen.has(r.title)) return false;
      seen.add(r.title);
      return true;
    });

    return deduplicated.slice(0, 4);
  }, [store.recommendations?.resources, focusDomain, userProficiency]);

  const handleResourcePress = (res: CuratedResource) => {
    if (res.video_url) {
      setVideoTitle(res.title);
      setVideoUrl(res.video_url);
    } else if (res.url) {
      if (Platform.OS === "web") {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        Linking.openURL(res.url).catch(() => {});
      }
    } else {
      navigate({ to: "/resources" });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: currentColors.text }]}>
            Collaborative Resource Hub
          </Text>
          <Text style={[styles.subTitle, { color: currentColors.subtext }]}>
            Notes & projects shared by peers
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigate({ to: "/resources" })}>
          <Text style={[styles.exploreAll, { color: currentColors.primary }]}>Explore all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {dynamicResources.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.card,
              { backgroundColor: currentColors.card, borderColor: currentColors.border },
            ]}
            onPress={() => handleResourcePress(r)}
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
              <View
                style={[
                  styles.badge,
                  isDark ? { backgroundColor: currentColors.divider } : styles.bgMuted,
                ]}
              >
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
              <Text style={[styles.author, { color: currentColors.subtext }]} numberOfLines={1}>
                by {r.author}
              </Text>
              <View style={styles.stats}>
                <View style={styles.statRow}>
                  <FontAwesome name="star" size={10} color="#0d9488" />
                  <Text style={[styles.statText, { color: currentColors.subtext }]}>
                    {r.rating}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Feather name="download" size={10} color={currentColors.subtext} />
                  <Text style={[styles.statText, { color: currentColors.subtext }]}>
                    {r.downloads}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {videoUrl && (
        <View style={styles.videoOverlay}>
          <View
            style={[
              styles.videoModal,
              { backgroundColor: currentColors.card, borderColor: currentColors.border },
            ]}
          >
            <View style={styles.videoHeader}>
              <Text style={[styles.videoTitle, { color: currentColors.text }]} numberOfLines={1}>
                {videoTitle}
              </Text>
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
                    baseUrl: "https://google.com",
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
