import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, TextInput, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { SurveyModal } from "../components/skillora/SurveyModal";

const themeColors = {
  light: {
    primary: "#6366f1",
    secondary: "#475569",
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    subtext: "#64748b",
    border: "#cbd5e1",
    divider: "#f1f5f9",
    inputBg: "#f8fafc"
  },
  dark: {
    primary: "#818cf8",
    secondary: "#94a3b8",
    background: "#090d16",
    card: "#151b2c",
    text: "#f8fafc",
    subtext: "#94a3b8",
    border: "#1e293b",
    divider: "#1e293b",
    inputBg: "#111827"
  }
};

import { BootstrapIcon } from "../components/ui/BootstrapIcon";

export default function ProfileScreen() {
  const store = useDashboardStore();
  const userName = store.user?.name || "Student";
  const userEmail = store.user?.email || "";
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const streak = store.user?.streak ?? 0;
  const xp = store.user?.xp ?? 0;
  const enrolled = store.enrolledCourses || [];
  const registeredCourses = enrolled.filter(c => c.progress < 100);
  const completedCourses = enrolled.filter(c => c.progress === 100);
  const coursesCompletedCount = completedCourses.length;

  const defaultAchievements = [
    {
      id: "first_course",
      title: "First Course Completed",
      emoji: "🏆",
      requirement: "Complete 1 course from registered pathways",
      metric: "courses_completed",
      threshold: 1,
      color: "#f59e0b"
    },
    {
      id: "streak_30",
      title: "30-Day Streak",
      emoji: "🔥",
      requirement: "Maintain a consecutive study streak of 30 days",
      metric: "streak",
      threshold: 30,
      color: "#ef4444"
    },
    {
      id: "quizzes_100",
      title: "100 Quizzes",
      emoji: "📚",
      requirement: "Answer questions correctly to reach 1,000+ XP",
      metric: "xp",
      threshold: 1000,
      color: "#3b82f6"
    },
    {
      id: "coding_master",
      title: "Coding Master",
      emoji: "💻",
      requirement: "Earn 5,000+ total Experience Points (XP)",
      metric: "xp",
      threshold: 5000,
      color: "#10b981"
    }
  ];

  const [dbAchievements, setDbAchievements] = useState<any[]>(defaultAchievements);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const { fetchDBAchievements } = await import("../lib/supabase-db");
        const list = await fetchDBAchievements();
        if (list && list.length > 0) {
          setDbAchievements(list);
        }
      } catch (e) {
        console.warn("Failed to load achievements dynamically:", e);
      }
    }
    loadAchievements();
  }, []);

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Settings States
  const [pushNotifs, setPushNotifs] = useState(true);
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  // Password Reset States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load Blocked Users
  const loadBlockedUsers = async () => {
    if (!store.user) return;
    setLoadingBlocked(true);
    try {
      const { data: conns, error: connErr } = await supabase
        .from("peer_connections")
        .select("*")
        .eq("status", "blocked")
        .or(`sender_id.eq.${store.user.id},receiver_id.eq.${store.user.id}`);

      if (connErr) throw connErr;
      if (!conns || conns.length === 0) {
        setBlockedUsers([]);
        setLoadingBlocked(false);
        return;
      }

      const otherUserIds = conns.map(c => c.sender_id === store.user?.id ? c.receiver_id : c.sender_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", otherUserIds);

      if (profErr) throw profErr;

      const mapped = conns.map(c => {
        const otherId = c.sender_id === store.user?.id ? c.receiver_id : c.sender_id;
        const prof = profiles?.find(p => p.id === otherId);
        return {
          connectionId: c.id,
          userId: otherId,
          name: prof?.name || "Student Partner",
          email: prof?.email || ""
        };
      });
      setBlockedUsers(mapped);
    } catch (e) {
      console.warn("Failed to load blocked users:", e);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, [store.user]);

  const handleUnblock = async (connectionId: string, blockedName: string) => {
    try {
      const { error } = await supabase
        .from("peer_connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) throw error;

      Alert.alert("Success", `${blockedName} has been unblocked successfully.`);
      loadBlockedUsers();
    } catch (e) {
      Alert.alert("Error", "Failed to unblock user. Please try again.");
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await supabase.auth.signOut();
      store.resetStore();
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out?")) {
        await doLogout();
      }
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert("Success", "Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Achievements evaluation
  const achievements = dbAchievements.map(a => {
    let unlocked = false;
    if (a.metric === "courses_completed") {
      unlocked = coursesCompletedCount >= a.threshold;
    } else if (a.metric === "streak") {
      unlocked = streak >= a.threshold;
    } else if (a.metric === "xp") {
      unlocked = xp >= a.threshold;
    }
    return {
      ...a,
      unlocked
    };
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentColors.background }]} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      
      {/* Profile Overview Card */}
      <View style={[styles.profileCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={[styles.avatarCircle, { backgroundColor: `${currentColors.primary}1a` }]}>
          <Text style={[styles.avatarText, { color: currentColors.primary }]}>
            {userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.profileName, { color: currentColors.text }]}>{userName}</Text>
        <Text style={[styles.profileEmail, { color: currentColors.subtext }]}>{userEmail}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.focusBadge, { backgroundColor: `${currentColors.primary}14` }]}>
            <Text style={[styles.focusText, { color: currentColors.primary }]}>{focusDomain}</Text>
          </View>
          <View style={[styles.levelBadge, isDark && { backgroundColor: "rgba(129, 140, 248, 0.15)" }]}>
            <Text style={[styles.levelText, isDark && { color: "#818cf8" }]}>{userProficiency}</Text>
          </View>
        </View>
      </View>

      {/* Streak Options Card */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <BootstrapIcon name="fire" size={20} color="#f97316" />
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Study Streak Options</Text>
        </View>
        <View style={[styles.streakPanel, isDark && { backgroundColor: "rgba(249, 115, 22, 0.08)", borderColor: "rgba(249, 115, 22, 0.2)" }]}>
          <Text style={styles.streakCount}>{streak} Days Active</Text>
          <Text style={[styles.streakDesc, { color: currentColors.subtext }]}>
            {streak > 0 
              ? "Awesome work! Keep logging in daily to secure your learning streak and claim streak bonus rewards."
              : "No consecutive days logged yet. Learn a topic or view resources today to launch your consecutive streak!"
            }
          </Text>
          <View style={styles.streakGoalRow}>
            <BootstrapIcon name="graph-up-arrow" size={14} color={currentColors.primary} />
            <Text style={[styles.streakGoalText, { color: currentColors.primary }]}>Next Streak Milestone: 7 Days (+250 XP bonus)</Text>
          </View>
        </View>
      </View>

      {/* Achievements (Badges) Card */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <BootstrapIcon name="award" size={20} color="#3b82f6" />
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Achievements & Badges</Text>
        </View>
        <View style={styles.badgeGrid}>
          {achievements.map((ach) => (
            <View 
              key={ach.id} 
              style={[
                styles.badgeCard, 
                ach.unlocked 
                  ? { borderColor: ach.color, backgroundColor: `${ach.color}08` } 
                  : [styles.badgeCardLocked, { borderColor: currentColors.border, backgroundColor: currentColors.background }]
              ]}
            >
              <Text style={[styles.badgeIcon, !ach.unlocked && styles.badgeLockedOpacity]}>{ach.emoji}</Text>
              <Text style={[styles.badgeTitle, !ach.unlocked && styles.lockedText, { color: currentColors.text }]}>{ach.title}</Text>
              <Text style={[styles.badgeDesc, { color: currentColors.subtext }]}>{ach.requirement}</Text>
              <View style={[styles.statusPill, ach.unlocked ? { backgroundColor: ach.color } : [styles.statusPillLocked, isDark && { backgroundColor: "#1e293b" }]]}>
                <Text style={styles.statusPillText}>{ach.unlocked ? "Unlocked" : "Locked"}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Registered & Completed Courses */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <BootstrapIcon name="journal-code" size={20} color="#10b981" />
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>My Courses Pathway</Text>
        </View>

        {/* Registered (Active) Courses */}
        <View style={styles.courseSection}>
          <Text style={[styles.courseSubtitle, { color: currentColors.subtext }]}>Registered Courses ({registeredCourses.length})</Text>
          {registeredCourses.length === 0 ? (
            <Text style={[styles.emptyText, { color: currentColors.subtext }]}>No active registered courses. Check Suggested Courses on your home dashboard to enroll!</Text>
          ) : (
            registeredCourses.map(c => (
              <View key={c.title} style={[styles.courseItem, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseItemTitle, { color: currentColors.text }]}>{c.title}</Text>
                  <Text style={[styles.courseItemMeta, { color: currentColors.subtext }]}>{c.subject} • {c.time} • {c.difficulty}</Text>
                </View>
                <View style={[styles.courseProgressBadge, { backgroundColor: `${currentColors.primary}1a` }]}>
                  <Text style={[styles.courseProgressText, { color: currentColors.primary }]}>{c.progress}%</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Completed Courses */}
        <View style={[styles.courseSection, { borderTopWidth: 1, borderTopColor: currentColors.border, marginTop: 14, paddingTop: 14 }]}>
          <Text style={[styles.courseSubtitle, { color: currentColors.subtext }]}>Completed Courses ({completedCourses.length})</Text>
          {completedCourses.length === 0 ? (
            <Text style={[styles.emptyText, { color: currentColors.subtext }]}>No completed courses yet. Work through your registered lesson videos to hit 100%!</Text>
          ) : (
            completedCourses.map(c => (
              <View key={c.title} style={[styles.courseItem, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseItemTitle, { color: currentColors.subtext, textDecorationLine: "line-through" }]}>{c.title}</Text>
                  <Text style={[styles.courseItemMeta, { color: currentColors.subtext }]}>{c.subject} • Completed</Text>
                </View>
                <View style={[styles.courseProgressBadge, { backgroundColor: isDark ? "#064e3b" : "#dcfce7" }]}>
                  <BootstrapIcon name="check-lg" size={12} color={isDark ? "#34d399" : "#15803d"} />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Retake Survey Section */}
      <View style={[styles.card, { borderColor: `${currentColors.primary}33`, backgroundColor: `${currentColors.primary}05` }]}>
        <View style={styles.cardHeader}>
          <BootstrapIcon name="card-checklist" size={20} color={currentColors.primary} />
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Learning Pathway Re-survey</Text>
        </View>
        <View style={styles.surveyBody}>
          <Text style={[styles.surveyText, { color: currentColors.subtext }]}>
            Want to change your learning goals or switch to another focus domain? Retaking the onboarding survey will reconfigure your recommended courses, milestone checklist, and upcoming assessments.
          </Text>
          <TouchableOpacity 
            style={[styles.surveyBtn, { backgroundColor: currentColors.primary }]} 
            activeOpacity={0.8}
            onPress={() => {
              store.triggerManualSurvey();
              Alert.alert("Survey Initialized", "The onboarding configuration modal has been queued. Navigate to the Home dashboard tab to reconfigure your parameters.");
            }}
          >
            <BootstrapIcon name="arrow-repeat" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.surveyBtnText}>Retake Onboarding Survey</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Blocked Users Section */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <BootstrapIcon name="person-x" size={20} color="#ef4444" />
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Blocked Connections Manager</Text>
        </View>
        {loadingBlocked ? (
          <ActivityIndicator size="small" color="#ef4444" style={{ marginVertical: 12 }} />
        ) : blockedUsers.length === 0 ? (
          <Text style={[styles.emptyText, { color: currentColors.subtext }]}>You haven't blocked any users. Connections are fully open.</Text>
        ) : (
          <View style={styles.blockedList}>
            {blockedUsers.map((u) => (
              <View key={u.userId} style={[styles.blockedItem, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.blockedName, { color: currentColors.text }]}>{u.name}</Text>
                  <Text style={[styles.blockedEmail, { color: currentColors.subtext }]}>{u.email}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.unblockBtn} 
                  activeOpacity={0.8}
                  onPress={() => handleUnblock(u.connectionId, u.name)}
                >
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* App Settings Section */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <BootstrapIcon name="gear" size={20} color={currentColors.primary} />
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Settings & Preferences</Text>
        </View>

        {/* 1. Notifications Options */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: currentColors.text }]}>Push Notifications</Text>
            <Text style={[styles.settingDesc, { color: currentColors.subtext }]}>Receive daily streaks, quiz alerts, and class reminders.</Text>
          </View>
          <Switch 
            value={pushNotifs} 
            onValueChange={setPushNotifs} 
            trackColor={{ false: isDark ? "#1e293b" : "#e2e8f0", true: `${currentColors.primary}66` }}
            thumbColor={pushNotifs ? currentColors.primary : "#94a3b8"}
          />
        </View>

        {/* 2. Theme Picker */}
        <View style={[styles.settingDivider, { backgroundColor: currentColors.divider }]} />
        <View style={styles.themeSection}>
          <Text style={[styles.settingLabel, { color: currentColors.text }]}>App Theme</Text>
          <Text style={[styles.settingDesc, { color: currentColors.subtext }]}>Switch between light and dark modes.</Text>
          <View style={styles.themeRow}>
            {([
              { key: "light", label: "Light Mode", color: "#6366f1" },
              { key: "dark", label: "Dark Mode", color: "#818cf8" }
            ] as const).map(th => {
              const selected = appTheme === th.key;
              return (
                <TouchableOpacity 
                  key={th.key} 
                  style={[styles.themeBtn, { borderColor: selected ? th.color : currentColors.border }, selected && { backgroundColor: `${th.color}15` }]} 
                  onPress={() => store.setAppTheme(th.key)}
                  activeOpacity={0.8}
                >
                  <BootstrapIcon 
                    name={th.key === "dark" ? "moon" : "sun"} 
                    size={16} 
                    color={selected ? th.color : currentColors.subtext} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[styles.themeBtnText, { color: selected ? th.color : currentColors.subtext }]}>{th.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Change Password Form */}
        <View style={[styles.settingDivider, { backgroundColor: currentColors.divider }]} />
        <View style={styles.passwordSection}>
          <Text style={[styles.settingLabel, { color: currentColors.text }]}>Change Password</Text>
          <Text style={[styles.settingDesc, { color: currentColors.subtext }]}>Ensure your account details remain fully encrypted.</Text>
          <View style={styles.passwordForm}>
            <TextInput
              secureTextEntry
              placeholder="New Password"
              placeholderTextColor={currentColors.subtext}
              value={newPassword}
              onChangeText={setNewPassword}
              style={[styles.passwordInput, { backgroundColor: currentColors.inputBg, borderColor: currentColors.border, color: currentColors.text }]}
            />
            <TextInput
              secureTextEntry
              placeholder="Confirm New Password"
              placeholderTextColor={currentColors.subtext}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[styles.passwordInput, { backgroundColor: currentColors.inputBg, borderColor: currentColors.border, color: currentColors.text }]}
            />
            <TouchableOpacity 
              style={styles.passwordBtn} 
              activeOpacity={0.8}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
            >
              <Text style={styles.passwordBtnText}>
                {isUpdatingPassword ? "Updating..." : "Update Security Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Logout Action button */}
        <View style={styles.settingDivider} />
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <BootstrapIcon name="box-arrow-right" size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <SurveyModal visible={!store.surveyCompleted} isResurvey={true} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#6366f1",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  profileEmail: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  focusBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  focusText: {
    color: "#6366f1",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  levelBadge: {
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  levelText: {
    color: "#0d9488",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  streakPanel: {
    backgroundColor: "rgba(249, 115, 22, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.08)",
    borderRadius: 16,
    padding: 14,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f97316",
  },
  streakDesc: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
    marginTop: 4,
  },
  streakGoalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  streakGoalText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#6366f1",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    flex: 1,
    minWidth: 130,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  badgeCardLocked: {
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeLockedOpacity: {
    opacity: 0.25,
  },
  badgeTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  lockedText: {
    color: "#94a3b8",
  },
  badgeDesc: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
    height: 24,
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  statusPillLocked: {
    backgroundColor: "#e2e8f0",
  },
  statusPillText: {
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  courseSection: {
    gap: 8,
  },
  courseSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
    paddingVertical: 4,
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 12,
    padding: 10,
  },
  courseItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  courseItemMeta: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 2,
  },
  courseProgressBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseProgressText: {
    color: "#6366f1",
    fontSize: 10.5,
    fontWeight: "700",
  },
  surveyBody: {
    gap: 12,
  },
  surveyText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
  },
  surveyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
  },
  surveyBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "700",
  },
  blockedList: {
    gap: 8,
  },
  blockedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  blockedName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  blockedEmail: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 1,
  },
  unblockBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unblockText: {
    color: "#ef4444",
    fontSize: 10.5,
    fontWeight: "700",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0f172a",
  },
  settingDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 15,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  themeSection: {
    gap: 8,
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  themeDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  passwordSection: {
    gap: 6,
  },
  passwordForm: {
    gap: 8,
    marginTop: 8,
  },
  passwordInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11.5,
    color: "#0f172a",
  },
  passwordBtn: {
    backgroundColor: "#475569",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  passwordBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
