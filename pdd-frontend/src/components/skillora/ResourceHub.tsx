import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useDashboardStore } from "../../lib/store";
import { useNavigate } from "@tanstack/react-router";

export function ResourceHub() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "General";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const navigate = useNavigate();

  const openResourceUrl = (title: string) => {
    const query = encodeURIComponent(title);
    let url = `https://www.google.com/search?q=${query}`;
    
    const lower = title.toLowerCase();
    if (lower.includes("next.js") || lower.includes("nextjs")) {
      url = "https://nextjs.org/docs";
    } else if (lower.includes("react native") || lower.includes("expo")) {
      url = "https://reactnative.dev/docs/getting-started";
    } else if (lower.includes("docker")) {
      url = "https://docs.docker.com/get-started/";
    } else if (lower.includes("pandas") || lower.includes("numpy")) {
      url = "https://pandas.pydata.org/docs/user_guide/index.html";
    } else if (lower.includes("postgresql") || lower.includes("sql")) {
      url = "https://www.postgresql.org/docs/";
    } else if (lower.includes("pytorch")) {
      url = "https://pytorch.org/docs/stable/index.html";
    } else if (lower.includes("spring boot")) {
      url = "https://spring.io/projects/spring-boot";
    } else if (lower.includes("node.js") || lower.includes("express")) {
      url = "https://nodejs.org/en/docs/";
    }
    
    Linking.openURL(url).catch((err) => console.warn("Failed to open URL:", err));
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
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
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
    lineHeight: 16,
    height: 32,
    marginBottom: 12,
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
    alignItems: "center",
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
});
