import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, TextInput } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const store = useDashboardStore();
  const userName = store.user?.name || "Student";
  const userEmail = store.user?.email || "";
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const streak = store.user?.streak ?? 0;
  const xp = store.user?.xp ?? 0;
  const coursesCompletedCount = store.user?.coursesCompleted ?? 0;

  const enrolled = store.enrolledCourses || [];
  const registeredCourses = enrolled.filter(c => c.progress < 100);
  const completedCourses = enrolled.filter(c => c.progress === 100);

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Settings States
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [appTheme, setAppTheme] = useState<"light" | "indigo" | "dark">("indigo");
  const [isPrivate, setIsPrivate] = useState(false);

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
  const achievements = [
    {
      id: "first_course",
      title: "First Course Completed",
      emoji: "🏆",
      requirement: "Complete 1 course from registered pathways",
      unlocked: coursesCompletedCount > 0,
      color: "#f59e0b"
    },
    {
      id: "streak_30",
      title: "30-Day Streak",
      emoji: "🔥",
      requirement: "Maintain a consecutive study streak of 30 days",
      unlocked: streak >= 30,
      color: "#ef4444"
    },
    {
      id: "quizzes_100",
      title: "100 Quizzes",
      emoji: "📚",
      requirement: "Answer questions correctly to reach 1,000+ XP",
      unlocked: xp >= 1000,
      color: "#3b82f6"
    },
    {
      id: "coding_master",
      title: "Coding Master",
      emoji: "💻",
      requirement: "Earn 5,000+ total Experience Points (XP)",
      unlocked: xp >= 5000,
      color: "#10b981"
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      
      {/* Profile Overview Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.focusBadge}>
            <Text style={styles.focusText}>{focusDomain}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{userProficiency}</Text>
          </View>
        </View>
      </View>

      {/* Streak Options Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="fire" size={20} color="#f97316" />
          <Text style={styles.cardTitle}>Study Streak Options</Text>
        </View>
        <View style={styles.streakPanel}>
          <Text style={styles.streakCount}>{streak} Days Active</Text>
          <Text style={styles.streakDesc}>
            {streak > 0 
              ? "Awesome work! Keep logging in daily to secure your learning streak and claim streak bonus rewards."
              : "No consecutive days logged yet. Learn a topic or view resources today to launch your consecutive streak!"
            }
          </Text>
          <View style={styles.streakGoalRow}>
            <Feather name="trending-up" size={14} color="#6366f1" />
            <Text style={styles.streakGoalText}>Next Streak Milestone: 7 Days (+250 XP bonus)</Text>
          </View>
        </View>
      </View>

      {/* Achievements (Badges) Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="award" size={20} color="#3b82f6" />
          <Text style={styles.cardTitle}>Achievements & Badges</Text>
        </View>
        <View style={styles.badgeGrid}>
          {achievements.map((ach) => (
            <View 
              key={ach.id} 
              style={[
                styles.badgeCard, 
                ach.unlocked ? { borderColor: ach.color, backgroundColor: `${ach.color}08` } : styles.badgeCardLocked
              ]}
            >
              <Text style={[styles.badgeIcon, !ach.unlocked && styles.badgeLockedOpacity]}>{ach.emoji}</Text>
              <Text style={[styles.badgeTitle, !ach.unlocked && styles.lockedText]}>{ach.title}</Text>
              <Text style={styles.badgeDesc}>{ach.requirement}</Text>
              <View style={[styles.statusPill, ach.unlocked ? { backgroundColor: ach.color } : styles.statusPillLocked]}>
                <Text style={styles.statusPillText}>{ach.unlocked ? "Unlocked" : "Locked"}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Registered & Completed Courses */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="book-open" size={20} color="#10b981" />
          <Text style={styles.cardTitle}>My Courses Pathway</Text>
        </View>

        {/* Registered (Active) Courses */}
        <View style={styles.courseSection}>
          <Text style={styles.courseSubtitle}>Registered Courses ({registeredCourses.length})</Text>
          {registeredCourses.length === 0 ? (
            <Text style={styles.emptyText}>No active registered courses. Check Suggested Courses on your home dashboard to enroll!</Text>
          ) : (
            registeredCourses.map(c => (
              <View key={c.title} style={styles.courseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseItemTitle}>{c.title}</Text>
                  <Text style={styles.courseItemMeta}>{c.subject} • {c.time} • {c.difficulty}</Text>
                </View>
                <View style={styles.courseProgressBadge}>
                  <Text style={styles.courseProgressText}>{c.progress}%</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Completed Courses */}
        <View style={[styles.courseSection, { borderTopWidth: 1, borderTopColor: "#f1f5f9", marginTop: 14, paddingTop: 14 }]}>
          <Text style={styles.courseSubtitle}>Completed Courses ({completedCourses.length})</Text>
          {completedCourses.length === 0 ? (
            <Text style={styles.emptyText}>No completed courses yet. Work through your registered lesson videos to hit 100%!</Text>
          ) : (
            completedCourses.map(c => (
              <View key={c.title} style={styles.courseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseItemTitle, { color: "#64748b", textDecorationLine: "line-through" }]}>{c.title}</Text>
                  <Text style={styles.courseItemMeta}>{c.subject} • Completed</Text>
                </View>
                <View style={[styles.courseProgressBadge, { backgroundColor: "#dcfce7" }]}>
                  <Feather name="check" size={12} color="#15803d" />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Retake Survey Section */}
      <View style={[styles.card, { borderColor: "rgba(99, 102, 241, 0.2)", backgroundColor: "rgba(99, 102, 241, 0.02)" }]}>
        <View style={styles.cardHeader}>
          <Feather name="sliders" size={20} color="#6366f1" />
          <Text style={styles.cardTitle}>Learning Pathway Re-survey</Text>
        </View>
        <View style={styles.surveyBody}>
          <Text style={styles.surveyText}>
            Want to change your learning goals or switch to another focus domain? Retaking the onboarding survey will reconfigure your recommended courses, milestone checklist, and upcoming assessments.
          </Text>
          <TouchableOpacity 
            style={styles.surveyBtn} 
            activeOpacity={0.8}
            onPress={() => {
              store.triggerManualSurvey();
              Alert.alert("Survey Initialized", "The onboarding configuration modal has been queued. Navigate to the Home dashboard tab to reconfigure your parameters.");
            }}
          >
            <Feather name="refresh-cw" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.surveyBtnText}>Retake Onboarding Survey</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Blocked Users Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="slash" size={20} color="#ef4444" />
          <Text style={styles.cardTitle}>Blocked Connections Manager</Text>
        </View>
        {loadingBlocked ? (
          <ActivityIndicator size="small" color="#ef4444" style={{ marginVertical: 12 }} />
        ) : blockedUsers.length === 0 ? (
          <Text style={styles.emptyText}>You haven't blocked any users. Connections are fully open.</Text>
        ) : (
          <View style={styles.blockedList}>
            {blockedUsers.map((u) => (
              <View key={u.userId} style={styles.blockedItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedName}>{u.name}</Text>
                  <Text style={styles.blockedEmail}>{u.email}</Text>
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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="settings" size={20} color="#475569" />
          <Text style={styles.cardTitle}>Settings & Preferences</Text>
        </View>

        {/* 1. Notifications Options */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Receive daily streaks, quiz alerts, and class reminders.</Text>
          </View>
          <Switch 
            value={pushNotifs} 
            onValueChange={setPushNotifs} 
            trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
            thumbColor={pushNotifs ? "#6366f1" : "#94a3b8"}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Email Summaries</Text>
            <Text style={styles.settingDesc}>Receive weekly analytics progress summaries in your inbox.</Text>
          </View>
          <Switch 
            value={emailNotifs} 
            onValueChange={setEmailNotifs} 
            trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
            thumbColor={emailNotifs ? "#6366f1" : "#94a3b8"}
          />
        </View>

        {/* 2. Theme Picker */}
        <View style={styles.settingDivider} />
        <View style={styles.themeSection}>
          <Text style={styles.settingLabel}>App Accent Theme</Text>
          <Text style={styles.settingDesc}>Customize the primary interactive color styles across screens.</Text>
          <View style={styles.themeRow}>
            {([
              { key: "light", label: "Classic Slate", color: "#64748b" },
              { key: "indigo", label: "Royal Indigo", color: "#6366f1" },
              { key: "dark", label: "Mint Emerald", color: "#0d9488" }
            ] as const).map(th => {
              const selected = appTheme === th.key;
              return (
                <TouchableOpacity 
                  key={th.key} 
                  style={[styles.themeBtn, selected && { borderColor: th.color, backgroundColor: `${th.color}08` }]} 
                  onPress={() => setAppTheme(th.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.themeDot, { backgroundColor: th.color }]} />
                  <Text style={[styles.themeBtnText, selected && { color: th.color }]}>{th.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Privacy Settings */}
        <View style={styles.settingDivider} />
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Private Profile Mode</Text>
            <Text style={styles.settingDesc}>Hide your profile details from peer student suggestion panels.</Text>
          </View>
          <Switch 
            value={isPrivate} 
            onValueChange={setIsPrivate} 
            trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
            thumbColor={isPrivate ? "#6366f1" : "#94a3b8"}
          />
        </View>

        {/* 4. Change Password Form */}
        <View style={styles.settingDivider} />
        <View style={styles.passwordSection}>
          <Text style={styles.settingLabel}>Change Password</Text>
          <Text style={styles.settingDesc}>Ensure your account details remain fully encrypted.</Text>
          <View style={styles.passwordForm}>
            <TextInput
              secureTextEntry
              placeholder="New Password"
              placeholderTextColor="#94a3b8"
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.passwordInput}
            />
            <TextInput
              secureTextEntry
              placeholder="Confirm New Password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.passwordInput}
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
          <Feather name="log-out" size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out & Log Out</Text>
        </TouchableOpacity>
      </View>
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
    fontWeight: "850",
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
