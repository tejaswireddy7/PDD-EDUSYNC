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

// Web mock for react-native-webview
export const WebView = ({ source, style, ...props }: any) => {
  const uri = source?.uri || source?.html || "";
  const resolvedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style || {};
  return (
    <iframe 
      src={uri} 
      style={{ border: "none", width: "100%", height: "100%", minHeight: 300, ...resolvedStyle }} 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      {...props} 
    />
  );
};

// Web mock for expo-document-picker
export const getDocumentAsync = async (options?: any) => {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve({ canceled: true });
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    if (options?.type) {
      if (Array.isArray(options.type)) {
        input.accept = options.type.join(",");
      } else {
        input.accept = options.type;
      }
    }
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        resolve({
          canceled: false,
          assets: [{
            name: file.name,
            size: file.size,
            uri: URL.createObjectURL(file),
            mimeType: file.type
          }],
          name: file.name,
          size: file.size,
          uri: URL.createObjectURL(file),
        });
      } else {
        resolve({ canceled: true });
      }
    };
    input.click();
  });
};

// Web mock for expo-file-system
export const EncodingType = {
  UTF8: "utf8",
  Base64: "base64"
};

export const readAsStringAsync = async (uri: string, options?: any) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (options?.encoding === EncodingType.Base64) {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      } else {
        resolve(reader.result);
      }
    };
    reader.onerror = () => reject(reader.error);
    if (options?.encoding === EncodingType.Base64) {
      reader.readAsDataURL(blob);
    } else {
      reader.readAsText(blob);
    }
  });
};

export default Svg;
