import React from "react";
import { Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

interface BootstrapIconProps {
  name: string;
  size: number;
  color: string;
  style?: any;
}

export function BootstrapIcon({ name, size, color, style }: BootstrapIconProps) {
  if (Platform.OS === "web") {
    return (
      <i
        className={`bi bi-${name}`}
        style={{ fontSize: size, color: color, display: "inline-block", lineHeight: 1, ...style }}
      />
    );
  }

  let nativeName: any = "help-circle";
  let iconLibrary: "Feather" | "MaterialCommunityIcons" = "Feather";

  const lower = name.toLowerCase();

  if (lower.includes("sparkles")) {
    nativeName = "sparkles";
    iconLibrary = "MaterialCommunityIcons";
  } else if (lower.includes("trophy")) {
    nativeName = "trophy-outline";
    iconLibrary = "MaterialCommunityIcons";
  } else if (lower.includes("speedometer")) {
    nativeName = "gauge";
    iconLibrary = "MaterialCommunityIcons";
  } else if (lower.includes("fire")) {
    nativeName = "fire";
    iconLibrary = "MaterialCommunityIcons";
  } else if (lower.includes("chat") || lower.includes("message") || lower.includes("talk")) {
    nativeName = "message-square";
  } else if (lower.includes("folder")) {
    nativeName = "folder";
  } else if (lower.includes("house") || lower.includes("home")) {
    nativeName = "home";
  } else if (lower.includes("person") || lower.includes("user")) {
    nativeName = "user";
  } else if (lower.includes("compass")) {
    nativeName = "compass";
  } else if (lower.includes("chart") || lower.includes("graph")) {
    nativeName = "bar-chart-2";
  } else if (lower.includes("calendar")) {
    nativeName = "calendar";
  } else if (lower.includes("bell")) {
    nativeName = "bell";
  } else if (lower.includes("wifi-off")) {
    nativeName = "wifi-off";
  } else if (lower.includes("file-text") || lower.includes("file")) {
    nativeName = "file-text";
  } else if (lower.includes("x") || lower.includes("close")) {
    nativeName = "x";
  } else if (lower.includes("bookmark")) {
    nativeName = "bookmark";
  } else if (lower.includes("plus-circle")) {
    nativeName = "plus-circle";
  } else if (lower.includes("plus")) {
    nativeName = "plus";
  } else if (lower.includes("search")) {
    nativeName = "search";
  } else if (lower.includes("chevron-up")) {
    nativeName = "chevron-up";
  } else if (lower.includes("chevron-down")) {
    nativeName = "chevron-down";
  } else if (lower.includes("arrow-left")) {
    nativeName = "arrow-left";
  } else if (lower.includes("arrow-right")) {
    nativeName = "arrow-right";
  } else if (lower.includes("check")) {
    nativeName = "check";
  } else if (lower.includes("star")) {
    nativeName = "star";
  } else if (lower.includes("layers")) {
    nativeName = "layers";
  } else if (lower.includes("clock")) {
    nativeName = "clock";
  } else if (lower.includes("bullseye") || lower.includes("target")) {
    nativeName = "target";
  } else if (lower.includes("award")) {
    nativeName = "award";
  } else if (lower.includes("gear") || lower.includes("settings")) {
    nativeName = "settings";
  } else if (lower.includes("logout") || lower.includes("box-arrow-right")) {
    nativeName = "log-out";
  } else if (lower.includes("trash")) {
    nativeName = "trash-2";
  } else if (lower.includes("paperclip")) {
    nativeName = "paperclip";
  } else if (lower.includes("download")) {
    nativeName = "download";
  }

  if (iconLibrary === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={nativeName} size={size} color={color} style={style} />;
  }
  return <Feather name={nativeName} size={size} color={color} style={style} />;
}
