import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";

type SidebarItem = {
  icon: keyof typeof Feather.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconType: "Feather" | "MaterialCommunityIcons";
  label: string;
  route: string;
};

const items: SidebarItem[] = [
  { icon: "home", iconType: "Feather", label: "Home", route: "Dashboard" },
  { icon: "book-open", iconType: "Feather", label: "Learning", route: "Dashboard" },
  { icon: "clipboard-text", iconType: "MaterialCommunityIcons", label: "Assessments", route: "Assessments" },
  { icon: "chart-bar", iconType: "MaterialCommunityIcons", label: "Evaluation", route: "Evaluation" },
  { icon: "compass", iconType: "Feather", label: "Career", route: "Dashboard" },
  { icon: "folder-open", iconType: "MaterialCommunityIcons", label: "Resources", route: "Resources" },
  { icon: "message-text", iconType: "MaterialCommunityIcons", label: "Chat", route: "Chat" },
  { icon: "user", iconType: "Feather", label: "Profile", route: "Dashboard" },
];

interface SidebarProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export function Sidebar({ activeRoute = "Dashboard", onNavigate }: SidebarProps) {
  const store = useDashboardStore();

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

  return (
    <View style={styles.sidebar}>
      {/* Brand logo */}
      <View style={styles.brandRow}>
        <LinearGradient
          colors={["#6366f1", "#818cf8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBox}
        >
          <MaterialCommunityIcons name={"sparkles" as any} size={18} color="#ffffff" />
        </LinearGradient>
        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>EduSync</Text>
          <Text style={styles.brandSub}>AI Learning OS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {items.map((it) => {
          const isActive = activeRoute === it.route;
          return (
            <TouchableOpacity
              key={it.label}
              onPress={() => onNavigate && onNavigate(it.route)}
              style={[styles.itemButton, isActive && styles.activeItemButton]}
            >
              {it.iconType === "Feather" ? (
                <Feather 
                  name={it.icon as any} 
                  size={16} 
                  color={isActive ? "#6366f1" : "#64748b"} 
                />
              ) : (
                <MaterialCommunityIcons 
                  name={it.icon as any} 
                  size={16} 
                  color={isActive ? "#6366f1" : "#64748b"} 
                />
              )}
              <Text style={[styles.itemLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>
                {it.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pro Upgrade Widget Card */}
      <LinearGradient
        colors={["#0f172a", "#1e1b4b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.proCard}
      >
        <MaterialCommunityIcons name={"sparkles" as any} size={16} color="#ffffff" style={styles.proIcon} />
        <Text style={styles.proTitle}>Upgrade to Pro</Text>
        <Text style={styles.proDesc}>Unlock AI mentor & unlimited assessments.</Text>
        <TouchableOpacity style={styles.proBtn}>
          <Text style={styles.proBtnText}>Upgrade</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Log Out Button */}
      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={handleLogout}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="logout" size={14} color="#ef4444" />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    padding: 16,
    height: "100%",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  logoBox: {
    height: 36,
    width: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  brandSub: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
  },
  scrollContainer: {
    gap: 4,
  },
  itemButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  activeItemButton: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  activeLabel: {
    color: "#6366f1",
  },
  inactiveLabel: {
    color: "#64748b",
  },
  activeDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#6366f1",
  },
  proCard: {
    borderRadius: 20,
    padding: 14,
    marginTop: "auto",
    position: "relative",
    overflow: "hidden",
  },
  proIcon: {
    marginBottom: 6,
  },
  proTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  proDesc: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 12,
  },
  proBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  proBtnText: {
    color: "#6366f1",
    fontSize: 10,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },
});
