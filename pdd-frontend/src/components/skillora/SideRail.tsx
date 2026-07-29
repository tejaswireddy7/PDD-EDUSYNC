import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../../lib/store";

export function SideRail() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const nextAssessment = store.recommendations?.nextAssessment || `Introduction to ${focusDomain}`;

  // Domain-specific weak topics
  const domainWeakMap: Record<string, Array<{ topic: string; score: number }>> = {
    Frontend: [
      { topic: "CSS Grid & Flexbox", score: 58 },
      { topic: "State Context Hydration", score: 62 },
      { topic: "TypeScript Strict Mappings", score: 68 },
    ],
    Backend: [
      { topic: "SQL Index & Join Queries", score: 54 },
      { topic: "Asynchronous Event Loops", score: 61 },
      { topic: "Prisma Schema Relations", score: 67 },
    ],
    Mobile: [
      { topic: "Native Bridge Compilation", score: 56 },
      { topic: "Flexbox Layout Scaling", score: 62 },
      { topic: "Expo Router Deep-Linking", score: 69 },
    ],
    AI: [
      { topic: "SGD Backpropagation Math", score: 52 },
      { topic: "Pandas Data Cleaning", score: 63 },
      { topic: "CNN Convolution Matrix", score: 68 },
    ],
  };

  const [weak, setWeak] = React.useState<Array<{ topic: string; score: number }>>([]);

  const initialUpcoming = [
    { title: nextAssessment, day: "Tue", date: "19", color: "primary" },
    { title: `${focusDomain} Lab Exercise`, day: "Thu", date: "21", color: "mint" },
    { title: `Comprehensive ${focusDomain} Exam`, day: "Sat", date: "23", color: "primary" },
  ];
  const [upcoming, setUpcoming] = React.useState<Array<{ title: string; day: string; date: string; color: string }>>(initialUpcoming);

  React.useEffect(() => {
    async function loadSideRailData() {
      try {
        const { fetchDBWeakAreas } = await import("../../lib/supabase-db");
        const { supabase } = await import("../../lib/supabase");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dbWeak = await fetchDBWeakAreas(user.id, focusDomain);
          setWeak(dbWeak);
        } else {
          setWeak([]);
        }
      } catch (err) {
        console.warn("Failed to load weak areas from Supabase:", err);
        setWeak([]);
      }
    }
    loadSideRailData();
  }, [focusDomain]);

  React.useEffect(() => {
    setUpcoming([
      { title: nextAssessment, day: "Tue", date: "19", color: "primary" },
      { title: `${focusDomain} Lab Exercise`, day: "Thu", date: "21", color: "mint" },
      { title: `Comprehensive ${focusDomain} Exam`, day: "Sat", date: "23", color: "primary" },
    ]);
  }, [focusDomain, nextAssessment]);

  const badges = [
    { name: "Quick Solver", emoji: "⚡" },
    { name: "Skill Master", emoji: "🏆" },
    { name: "Consistent", emoji: "🔥" },
    { name: "Contributor", emoji: "🌟" },
  ];
  return (
    <View style={styles.container}>
      {/* Weak Areas Widget */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, styles.bgDestructive]}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
          </View>
          <Text style={styles.cardTitle}>Weak Areas</Text>
        </View>
        <View style={styles.list}>
          {weak.length === 0 ? (
            <Text style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", textAlign: "center", marginVertical: 8 }}>
              No weak areas identified yet! Keep learning. 🚀
            </Text>
          ) : (
            weak.map((w) => (
              <View key={w.topic} style={styles.weakRow}>
                <View style={styles.weakMeta}>
                   <Text style={styles.weakLabel}>{w.topic}</Text>
                  <Text style={styles.weakValue}>{w.score}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarDestructive, { width: `${w.score}%` }]} />
                </View>
              </View>
            ))
          )}
        </View>
        <TouchableOpacity>
          <Text style={styles.cardAction}>Generate revision plan →</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Assessments Widget */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, styles.bgPrimary]}>
            <Feather name="calendar" size={16} color="#6366f1" />
          </View>
          <Text style={styles.cardTitle}>Upcoming Assessments</Text>
        </View>
        <View style={styles.upcomingList}>
          {upcoming.map((u) => {
            const isPrimary = u.color === "primary";
            return (
              <View key={u.title} style={styles.upcomingItem}>
                <View style={[styles.dateBox, isPrimary ? styles.bgPrimaryLight : styles.bgMintLight]}>
                  <Text style={[styles.dayText, isPrimary ? styles.textPrimary : styles.textMint]}>
                    {u.day}
                  </Text>
                  <Text style={[styles.dateText, isPrimary ? styles.textPrimary : styles.textMint]}>
                    {u.date}
                  </Text>
                </View>
                <View style={styles.upcomingDetails}>
                  <Text style={styles.upcomingTitle} numberOfLines={1}>{u.title}</Text>
                  <Text style={styles.upcomingMeta}>9:00 AM • 45 min</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* XP & Badges widget */}
      <LinearGradient
        colors={["#0d9488", "#14b8a6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.xpCard}
      >
        <View style={styles.xpHeader}>
          <Feather name="award" size={22} color="#ffffff" />
          <Text style={styles.xpTitle}>{store.user?.xp !== undefined ? `${store.user.xp.toLocaleString()} XP` : "0 XP"} this week</Text>
        </View>
        <Text style={styles.xpSubtitle}>
          {store.user?.xp && store.user.xp > 0 ? "You're in the top 8% of learners" : "Start learning to rank on the leaderboard!"}
        </Text>
        <View style={styles.badgesRow}>
          {badges.map((b) => (
            <View key={b.name} style={styles.badgeCol}>
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
              <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Offline sync widget */}
      <View style={[styles.card, styles.offlineCard]}>
        <View style={styles.offlineLeft}>
          <View style={styles.iconBoxBeige}>
            <Feather name="wifi-off" size={18} color="#78350f" />
          </View>
          <View style={styles.offlineText}>
            <Text style={styles.offlineTitle}>Low-data mode</Text>
            <Text style={styles.offlineSubtitle}>12 lessons synced offline</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadBtn}>
          <Feather name="download" size={14} color="#6366f1" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    height: 32,
    width: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bgDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  list: {
    gap: 12,
  },
  weakRow: {
    gap: 4,
  },
  weakMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weakLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  weakValue: {
    fontSize: 12,
    color: "#64748b",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarDestructive: {
    height: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.7)",
    borderRadius: 3,
  },
  cardAction: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
    marginTop: 14,
  },
  upcomingList: {
    gap: 8,
  },
  upcomingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 6,
    borderRadius: 16,
  },
  dateBox: {
    height: 40,
    width: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bgPrimaryLight: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  bgMintLight: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  dayText: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "800",
  },
  textPrimary: {
    color: "#6366f1",
  },
  textMint: {
    color: "#0d9488",
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  upcomingMeta: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  xpCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  xpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  xpSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  badgeCol: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: {
    fontSize: 18,
  },
  badgeName: {
    fontSize: 8,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 2,
    lineHeight: 10,
  },
  offlineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offlineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBoxBeige: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: "#fef3c7", // Amber/Beige
    justifyContent: "center",
    alignItems: "center",
  },
  offlineText: {
    justifyContent: "center",
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  offlineSubtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  downloadBtn: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
