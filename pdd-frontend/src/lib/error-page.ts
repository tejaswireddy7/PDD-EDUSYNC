import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ErrorPageProps {
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function RenderErrorPage({ error, onRetry, onGoHome }: ErrorPageProps) {
  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(
      View,
      { style: styles.card },
      React.createElement(
        View,
        { style: styles.iconBox },
        React.createElement(Feather as any, { name: "alert-triangle", size: 32, color: "#ef4444" })
      ),
      React.createElement(Text, { style: styles.title }, "This page didn't load"),
      React.createElement(
        Text,
        { style: styles.subtitle },
        "Something went wrong on our end. You can try refreshing or head back home."
      ),
      error
        ? React.createElement(
            Text,
            { style: styles.errorText, numberOfLines: 3 },
            typeof error === "string" ? error : error.message
          )
        : null,
      React.createElement(
        View,
        { style: styles.actions },
        onRetry
          ? React.createElement(
              TouchableOpacity,
              { onPress: onRetry, style: styles.primaryBtn },
              React.createElement(Text, { style: styles.primaryText }, "Try again")
            )
          : null,
        onGoHome
          ? React.createElement(
              TouchableOpacity,
              { onPress: onGoHome, style: styles.secondaryBtn },
              React.createElement(Text, { style: styles.secondaryText }, "Go home")
            )
          : null
      )
    )
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBox: {
    height: 64,
    width: 64,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 10,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.04)",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    marginBottom: 16,
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    width: "100%",
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
  },
});
