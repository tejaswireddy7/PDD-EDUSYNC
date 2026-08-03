import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDashboardStore } from "../../lib/store";

export function StatCards() {
  const store = useDashboardStore();
  const targetHours = store.recommendations?.weeklyHoursTarget || 5;
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";

  const coursesCompleted = String(store.user?.coursesCompleted ?? 0);
  const fitScore = `${store.user?.careerFitScore ?? 0}%`;

  const stats = [
    { icon: "clock", iconType: "Feather", label: "Weekly Goal", value: `${targetHours} hrs`, delta: "+2 hrs", up: true, tint: "primary" },
    { icon: "book-check", iconType: "MaterialCommunityIcons", label: "Courses Completed", value: coursesCompleted, delta: coursesCompleted !== "0" ? "+1" : "0", up: true, tint: "mint" },
    { icon: "trending-up", iconType: "Feather", label: "Level Target", value: userProficiency, delta: "Active", up: true, tint: "primary" },
    { icon: "target", iconType: "Feather", label: "Career Fit Score", value: fitScore, delta: fitScore !== "0%" ? "+3%" : "0%", up: true, tint: "mint" },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((s, i) => {
        const isPrimary = s.tint === "primary";
        return (
          <View key={s.label} style={styles.card}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, isPrimary ? styles.bgPrimary : styles.bgMint]}>
                {s.iconType === "MaterialCommunityIcons" ? (
                  <MaterialCommunityIcons name={s.icon as any} size={18} color={isPrimary ? "#6366f1" : "#0d9488"} />
                ) : (
                  <Feather name={s.icon as any} size={16} color={isPrimary ? "#6366f1" : "#0d9488"} />
                )}
              </View>
              <View style={styles.deltaContainer}>
                <Feather
                  name={s.up ? "trending-up" : "trending-down"}
                  size={12}
                  color={s.up ? "#0d9488" : "#64748b"}
                />
                <Text style={[styles.deltaText, s.up ? styles.textMint : styles.textGray]}>
                  {s.delta}
                </Text>
              </View>
            </View>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  card: {
    width: "48%",
    aspectRatio: 1.35,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconContainer: {
    height: 36,
    width: 36,
    borderRadius: 12,
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
    fontSize: 10,
    fontWeight: "700",
  },
  textMint: {
    color: "#0d9488",
  },
  textGray: {
    color: "#64748b",
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
});
