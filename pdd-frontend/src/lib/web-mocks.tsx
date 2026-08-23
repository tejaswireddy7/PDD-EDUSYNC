import React from "react";
import * as Lucide from "lucide-react";

// Web-safe Mock for Expo's LinearGradient utilizing pure CSS
export const LinearGradient = ({ colors, style, children, ...props }: any) => {
  const gradientStyle = colors && colors.length >= 2 
    ? { backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})` }
    : {};
  
  const resolvedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style) 
    : style || {};

  return (
    <div style={{ ...resolvedStyle, ...gradientStyle }} {...props}>
      {children}
    </div>
  );
};

// Web-safe Mock for Expo's StatusBar
export const StatusBar = () => null;

// Web-safe Mock mapping Expo vector icons to Lucide SVGs
export const MaterialCommunityIcons = ({ name, size, color, style }: any) => {
  const resolvedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style) 
    : style || {};

  const nameMap: Record<string, string> = {
    "home": "Home",
    "notebook": "BookOpen",
    "chat": "MessageCircle",
    "file-document": "FileText",
    "trophy": "Trophy",
    "bell": "Bell",
    "fire": "Zap",
    "chevron-right": "ChevronRight",
    "chevron-down": "ChevronDown",
    "account": "User",
    "magnify": "Search",
    "filter": "Filter",
    "bookmark": "Bookmark",
    "send": "Send",
    "logout": "LogOut",
    "shield-alert": "ShieldAlert",
    "alert-circle": "AlertCircle",
    "check-circle": "CheckCircle",
    "star": "Star",
    "trending-up": "TrendingUp",
    "trending-down": "TrendingDown",
    "clock": "Clock",
    // Feather / Auth Screen Specific Icons
    "mail": "Mail",
    "lock": "Lock",
    "user": "User",
    "eye": "Eye",
    "eye-off": "EyeOff",
    "arrow-right": "ArrowRight",
    "more-vertical": "MoreVertical",
    "user-x": "UserMinus",
    "slash": "Ban",
    "bar-chart-2": "BarChart3"
  };

  const lucideName = nameMap[name] || "Menu";
  const IconComponent = (Lucide as any)[lucideName] || Lucide.Menu;

  return <IconComponent size={size} color={color} style={resolvedStyle} />;
};

export const Feather = MaterialCommunityIcons;
export const Ionicons = MaterialCommunityIcons;
export const FontAwesome = MaterialCommunityIcons;

// Mocks for react-native-safe-area-context
export const SafeAreaProvider = ({ children, style }: any) => (
  <div style={{ width: "100%", height: "100%", ...style }}>{children}</div>
);
export const SafeAreaView = ({ children, style }: any) => {
  const resolvedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style || {};
  return <div style={{ width: "100%", height: "100%", ...resolvedStyle }}>{children}</div>;
};
export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
});

// Mocks for react-native-svg
export const Svg = ({ children, ...props }: any) => <svg {...props}>{children}</svg>;
export const Path = (props: any) => <path {...props} />;
export const Line = (props: any) => <line {...props} />;
export const Circle = (props: any) => <circle {...props} />;
export const Rect = (props: any) => <rect {...props} />;
export const G = ({ children, ...props }: any) => <g {...props}>{children}</g>;
export const Text = ({ children, ...props }: any) => <text {...props}>{children}</text>;
export default Svg;
