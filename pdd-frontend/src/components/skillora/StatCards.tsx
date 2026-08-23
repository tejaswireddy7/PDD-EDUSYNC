import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, themeColors } from "../../lib/store";

import { BootstrapIcon } from "../ui/BootstrapIcon";

export function StatCards() {
  const store = useDashboardStore();
  const targetHours = store.recommendations?.weeklyHoursTarget || 5;
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  const enrolled = store.enrolledCourses || [];
  const coursesCompleted = String(enrolled.filter(c => c.progress === 100).length);
  const fitScore = `${store.user?.careerFitScore ?? 0}%`;

  const stats = [
    { bootstrapIcon: "clock-history", label: "Weekly Goal", value: `${targetHours} hrs`, delta: "+2 hrs", up: true, tint: "primary", bgImage: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=150&auto=format&fit=crop" },
    { bootstrapIcon: "journal-check", label: "Courses Completed", value: coursesCompleted, delta: coursesCompleted !== "0" ? "+1" : "0", up: true, tint: "mint", bgImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&auto=format&fit=crop" },
    { bootstrapIcon: "bullseye", label: "Level Target", value: userProficiency, delta: "Active", up: true, tint: "primary", bgImage: "https://images.unsplash.com/photo-1518133680487-4179324e58a7?w=150&auto=format&fit=crop" },
    { bootstrapIcon: "speedometer2", label: "Career Fit Score", value: fitScore, delta: fitScore !== "0%" ? "+3%" : "0%", up: true, tint: "mint", bgImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150&auto=format&fit=crop" },
  ];

  // XP Calculations
  const userXp = store.user?.xp ?? 0;
  const nextLevelXp = 5000;
  const progressPercent = Math.min(100, Math.round((userXp / nextLevelXp) * 100));

  const showXpGuide = () => {
    Alert.alert(
      "XP Calculation Guide",
      "XP represents your Experience Points. You earn it by completing learning tasks:\n\n• Complete Course Assignments: +800 XP\n• Pass Section Video Quizzes: +50 XP\n• Reviewing Syllabus Resources: +10 XP\n• Daily Consecutive Streaks: +100 XP consecutive bonus"
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. XP Calculator Widget */}
      <TouchableOpacity activeOpacity={0.9} onPress={showXpGuide} style={[styles.xpCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.xpHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color="#eab308" />
            <Text style={[styles.xpTitle, { color: currentColors.text }]}>XP Calculator & Progress</Text>
          </View>
          <Text style={[styles.xpValue, { color: currentColors.text }]}>{userXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: currentColors.divider }]}>
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={[styles.xpFeedback, { color: currentColors.subtext }]}>
          {userXp > 0 
            ? `You need ${(nextLevelXp - userXp).toLocaleString()} XP to rank up as Elite Pathway Learner!` 
            : "Complete lesson tasks to earn XP and progress!"}
        </Text>
      </TouchableOpacity>

      {/* 2. Compact 2x2 Metric Cards Grid */}
      <View style={styles.grid}>
        {stats.map((s, i) => {
          const isPrimary = s.tint === "primary";
          return (
            <View key={s.label} style={[styles.card, { borderColor: currentColors.border }]}>
              <Image
                source={{ uri: s.bgImage }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? "rgba(21, 27, 44, 0.92)" : "rgba(255, 255, 255, 0.88)" }]} />
              <View style={styles.header}>
                <View style={[styles.iconContainer, isPrimary ? styles.bgPrimary : styles.bgMint]}>
                  <BootstrapIcon name={s.bootstrapIcon} size={15} color={isPrimary ? "#6366f1" : "#0d9488"} />
                </View>
                <View style={styles.deltaContainer}>
                  <Feather
                    name={s.up ? "trending-up" : "trending-down"}
                    size={10}
                    color={s.up ? "#0d9488" : "#64748b"}
                  />
                  <Text style={[styles.deltaText, s.up ? styles.textMint : styles.textGray]}>
                    {s.delta}
                  </Text>
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.value, { color: currentColors.text }]}>{s.value}</Text>
                <Text style={[styles.label, { color: currentColors.subtext }]}>{s.label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  xpCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  xpTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  xpValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6366f1",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  xpFeedback: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  card: {
    width: Platform.OS === "web" ? "23.5%" : "48%",
    aspectRatio: 1.05, // Small passport-sized square grid items
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    height: 26,
    width: 26,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  bgMint: {
    backgroundColor: "rgba(13, 148, 136, 0.15)",
  },
  deltaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  deltaText: {
    fontSize: 9,
    fontWeight: "700",
  },
  textMint: {
    color: "#0d9488",
  },
  textGray: {
    color: "#64748b",
  },
  textContainer: {
    marginTop: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 1,
  },
});
