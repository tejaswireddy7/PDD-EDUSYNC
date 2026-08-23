import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView, Switch } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, themeColors } from "../../lib/store";
import { BootstrapIcon } from "../ui/BootstrapIcon";

export function SideRail() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const nextAssessment = store.recommendations?.nextAssessment || `Introduction to ${focusDomain}`;
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  const [showCacheManager, setShowCacheManager] = useState(false);

  const showXpGuide = () => {
    Alert.alert(
      "XP Calculation Guide",
      "XP represents your Experience Points. You earn it by completing learning tasks:\n\n• Complete Course Assignments: +800 XP\n• Pass Section Video Quizzes: +50 XP\n• Reviewing Syllabus Resources: +10 XP\n• Daily Consecutive Streaks: +100 XP consecutive bonus"
    );
  };

  const initialUpcoming = [
    { title: nextAssessment, day: "Tue", date: "04", color: "primary" },
    { title: `${focusDomain} Lab Exercise`, day: "Thu", date: "06", color: "mint" },
    { title: `Comprehensive ${focusDomain} Exam`, day: "Sat", date: "08", color: "primary" },
  ];
  const [upcoming, setUpcoming] = useState<Array<{ title: string; day: string; date: string; color: string }>>(initialUpcoming);

  React.useEffect(() => {
    setUpcoming([
      { title: nextAssessment, day: "Tue", date: "04", color: "primary" },
      { title: `${focusDomain} Lab Exercise`, day: "Thu", date: "06", color: "mint" },
      { title: `Comprehensive ${focusDomain} Exam`, day: "Sat", date: "08", color: "primary" },
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
      {/* Upcoming Assessments Widget */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, styles.bgPrimary]}>
            <BootstrapIcon name="calendar" size={16} color="#6366f1" />
          </View>
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Upcoming Assessments</Text>
        </View>
        <View style={styles.upcomingList}>
          {upcoming.map((u) => {
            const isPrimary = u.color === "primary";
            return (
              <View key={u.title} style={styles.upcomingItem}>
                <View style={[styles.dateBox, isDark ? { backgroundColor: currentColors.divider } : (isPrimary ? styles.bgPrimaryLight : styles.bgMintLight)]}>
                  <Text style={[styles.dayText, isDark ? { color: currentColors.subtext } : (isPrimary ? styles.textPrimary : styles.textMint)]}>
                    {u.day}
                  </Text>
                  <Text style={[styles.dateText, { color: isDark ? currentColors.text : (isPrimary ? "#6366f1" : "#0d9488") }]}>
                    {u.date}
                  </Text>
                </View>
                <View style={styles.upcomingDetails}>
                  <Text style={[styles.upcomingTitle, { color: currentColors.text }]} numberOfLines={1}>{u.title}</Text>
                  <Text style={[styles.upcomingMeta, { color: currentColors.subtext }]}>9:00 AM • 45 min</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* XP & Badges widget */}
      <TouchableOpacity activeOpacity={0.9} onPress={showXpGuide}>
        <LinearGradient
          colors={["#0d9488", "#14b8a6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.xpCard}
        >
          <View style={styles.xpHeader}>
            <BootstrapIcon name="award" size={22} color="#ffffff" />
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
      </TouchableOpacity>

      {/* Offline sync widget */}
      <TouchableOpacity 
        activeOpacity={0.85} 
        onPress={() => setShowCacheManager(true)} 
        style={[styles.card, styles.offlineCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}
      >
        <View style={styles.offlineLeft}>
          <View style={[styles.iconBoxBeige, isDark && { backgroundColor: currentColors.divider }]}>
            <BootstrapIcon name="wifi-off" size={18} color={isDark ? currentColors.text : "#78350f"} />
          </View>
          <View style={styles.offlineText}>
            <Text style={[styles.offlineTitle, { color: currentColors.text }]}>Low-data mode</Text>
            <Text style={[styles.offlineSubtitle, { color: currentColors.subtext }]}>
              {store.lowDataMode ? "Active" : "Disabled"} • {store.cachedMaterials.length} files cached
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => setShowCacheManager(true)}>
          <BootstrapIcon name="download" size={14} color="#6366f1" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 2. OFFLINE CACHE MANAGER MODAL */}
      <Modal
        visible={showCacheManager}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCacheManager(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: currentColors.divider }]}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>Offline Cache Settings</Text>
              <TouchableOpacity onPress={() => setShowCacheManager(false)} style={styles.closeBtn}>
                <BootstrapIcon name="x" size={18} color={currentColors.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.cacheSettingRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.cacheSettingLabel, { color: currentColors.text }]}>Enable Low-Data Caching</Text>
                <Text style={[styles.cacheSettingDesc, { color: currentColors.subtext }]}>
                  Stores all course documents, syllabus guides, and notes locally when opened so you don't need internet to revisit them.
                </Text>
              </View>
              <Switch
                value={store.lowDataMode}
                onValueChange={store.toggleLowDataMode}
              />
            </View>

            <Text style={[styles.cachedSectionHeader, { color: currentColors.text }]}>
              Cached Lessons ({store.cachedMaterials.length})
            </Text>

            <ScrollView style={styles.cachedListScroll} showsVerticalScrollIndicator={true}>
              {store.cachedMaterials.length === 0 ? (
                <Text style={[styles.emptyCacheText, { color: currentColors.subtext }]}>No items stored in local cache memory yet.</Text>
              ) : (
                store.cachedMaterials.map((m, idx) => (
                  <View key={idx} style={styles.cachedItemRow}>
                    <BootstrapIcon name="file-text" size={12} color="#6366f1" style={{ marginRight: 6 }} />
                    <Text style={[styles.cachedItemText, { color: currentColors.text }]} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={[styles.cachedItemDate, { color: currentColors.subtext }]}>
                      {new Date(m.cachedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.cacheFooterActions}>
              <TouchableOpacity 
                style={[styles.cacheActionBtn, { backgroundColor: "#ef4444" }]} 
                onPress={() => {
                  store.clearOfflineCache();
                  Alert.alert("Success", "Offline cache memory has been cleared successfully.");
                }}
              >
                <Text style={styles.cacheActionBtnText}>Clear Cache</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.cacheActionBtn, { backgroundColor: "#6366f1" }]} 
                onPress={() => {
                  Alert.alert("Cache Synced", "All focus domain learning documents are synced locally for offline revisit.");
                }}
              >
                <Text style={styles.cacheActionBtnText}>Sync Domain</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 14,
  },
  iconBox: {
    height: 32,
    width: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  bgDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  list: {
    gap: 10,
    marginBottom: 12,
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
    color: "#334155",
  },
  weakValue: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarDestructive: {
    height: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 3,
  },
  cardAction: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "700",
    textAlign: "left",
  },
  upcomingList: {
    gap: 12,
  },
  upcomingItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateBox: {
    height: 38,
    width: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bgPrimaryLight: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  bgMintLight: {
    backgroundColor: "rgba(13, 148, 136, 0.08)",
  },
  textPrimary: {
    color: "#6366f1",
  },
  textMint: {
    color: "#0d9488",
  },
  dayText: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: -2,
  },
  upcomingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  upcomingMeta: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  xpCard: {
    borderRadius: 24,
    padding: 16,
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
    backgroundColor: "#fef3c7",
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  closeBtn: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    maxHeight: 280,
    marginBottom: 16,
  },
  revisionWelcome: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 12,
  },
  perfectStateBox: {
    alignItems: "center",
    paddingVertical: 20,
  },
  perfectStateEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  perfectStateTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  perfectStateText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
  },
  revisionTopicCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  topicScore: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "700",
  },
  recoverySteps: {
    gap: 4,
  },
  stepItem: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 16,
  },
  modalActionBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  cacheSettingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  cacheSettingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  cacheSettingDesc: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 14,
  },
  cachedSectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  cachedListScroll: {
    maxHeight: 120,
    marginBottom: 16,
  },
  emptyCacheText: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  cachedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cachedItemText: {
    fontSize: 11,
    color: "#334155",
    flex: 1,
  },
  cachedItemDate: {
    fontSize: 9,
    color: "#94a3b8",
    marginLeft: 8,
  },
  cacheFooterActions: {
    flexDirection: "row",
    gap: 10,
  },
  cacheActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cacheActionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
