import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";

export function Header() {
  const store = useDashboardStore();
  const userName = store.user?.name || "Student";
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = [
    { id: "n1", text: "🔥 Daily streak active! Keep going.", time: "1h ago", read: false },
    { id: "n2", text: "🎓 New React Native courses suggested.", time: "2h ago", read: false },
    { id: "n3", text: "💬 Coach Anjali sent you a new message.", time: "Yesterday", read: true },
  ];

  const handleLogout = async () => {
    const doLogout = async () => {
      await supabase.auth.signOut();
      store.resetStore();
    };

    if (Platform.OS === "web") {
      await doLogout();
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Good morning</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
        </View>
        <Text style={styles.welcomeText}>
          Welcome back, {userName} <Text style={styles.waveEmoji}>👋</Text>
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowNotifications(!showNotifications)}>
          <Feather name="bell" size={20} color="#475569" />
          <View style={styles.badge} />
        </TouchableOpacity>

        <LinearGradient
          colors={["#f97316", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakPill}
        >
          <Text style={styles.streakText}>{store.user?.streak ?? 0} 🔥</Text>
        </LinearGradient>

        {/* Logout Button — right beside streak */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.75}>
          <Feather name="log-out" size={18} color="#475569" />
        </TouchableOpacity>

        {showNotifications && (
          <View style={styles.notificationsContainer}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Feather name="x" size={14} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.notifList}>
              {notifications.map((n) => (
                <View key={n.id} style={[styles.notifItem, !n.read && styles.notifUnread]}>
                  <Text style={styles.notifText}>{n.text}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
  },
  greetingContainer: {
    flex: 1,
    paddingRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  dot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#94a3b8",
    marginHorizontal: 6,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },
  waveEmoji: {
    fontSize: 18,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 4,
  },
  streakText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  notificationsContainer: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 260,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.08)",
      },
    }),
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  notifList: {
    gap: 8,
  },
  notifItem: {
    padding: 6,
    borderRadius: 8,
  },
  notifUnread: {
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  notifText: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 14,
  },
  notifTime: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
  },
});


