import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

type NavItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
};

const items: NavItem[] = [
  { icon: "home", label: "Home", route: "Dashboard" },
  { icon: "clipboard", label: "Tests", route: "Assessments" },
  { icon: "shield", label: "Review", route: "Evaluation" },
  { icon: "folder", label: "Hub", route: "Resources" },
  { icon: "message-circle", label: "Chat", route: "Chat" },
];

interface BottomNavProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export function BottomNav({ activeRoute = "Dashboard", onNavigate }: BottomNavProps) {
  return (
    <View style={styles.nav}>
      {items.map((it) => {
        const isActive = activeRoute === it.route;
        return (
          <TouchableOpacity
            key={it.label}
            onPress={() => onNavigate && onNavigate(it.route)}
            style={[styles.item, isActive && styles.activeItem]}
          >
            <Feather 
              name={it.icon} 
              size={18} 
              color={isActive ? "#ffffff" : "#64748b"} 
            />
            <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 24,
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 999,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  activeItem: {
    backgroundColor: "#6366f1", // Skillora Gradient start equivalent
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
  },
  activeLabel: {
    color: "#ffffff",
  },
  inactiveLabel: {
    color: "#64748b",
  },
});
