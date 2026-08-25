import "./src/lib/polyfills";
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchDBAllIncomingUnreadCount } from "./src/lib/supabase-db";
import { supabase } from "./src/lib/supabase";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Uncaught App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f8fafc" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0f172a", marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: "#6366f1", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Import Fully Converted React Native Screens
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AssessmentsScreen from "./src/screens/AssessmentsScreen";
import ChatScreen from "./src/screens/ChatScreen";
import EvaluationScreen from "./src/screens/EvaluationScreen";
import ResourcesScreen from "./src/screens/ResourcesScreen";
import CourseLearnScreen from "./src/screens/CourseLearnScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { useDashboardStore } from "./src/lib/store";

// Initialize the Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const Tab = createBottomTabNavigator();

export default function App() {
  const store = useDashboardStore();
  const isAuthenticated = store.user !== null;
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      const storage = (window as any).localStorage;
      if (storage && typeof storage.loadFromAsyncStorage === "function") {
        storage.loadFromAsyncStorage().then(() => {
          store.hydrateStore();
          setIsHydrated(true);
        });
      } else {
        setIsHydrated(true);
      }
    } else {
      setIsHydrated(true);
    }
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!store.user?.id) {
      setUnreadCount(0);
      return;
    }

    const poll = async () => {
      try {
        const count = await fetchDBAllIncomingUnreadCount(store.user!.id);
        setUnreadCount(count);
      } catch (err) {
        console.warn("Error polling unread count:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    const channel = supabase
      .channel("global_unread_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "peer_messages" }, () => {
        poll();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [store.user?.id]);

  const isDark = store.appTheme === "dark";
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  const currentThemeColor = isDark ? "#818cf8" : "#6366f1";

  const dynamicTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: currentThemeColor,
      secondary: "#06b6d4",
      background: isDark ? "#090d16" : "#f8fafc",
      surface: isDark ? "#151b2c" : "#ffffff",
      error: "#ef4444",
    },
  };

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={dynamicTheme}>
            {!isAuthenticated ? (
              <AuthScreen onSuccess={() => {}} />
            ) : (
              <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
                <NavigationContainer>
                  <StatusBar style="dark" />
                  <Tab.Navigator
                    initialRouteName="Dashboard"
                    screenOptions={({ route }: { route: { name: string } }) => ({
                      headerShown: false,
                      tabBarIcon: ({ color, size }: { color: string; size: number }) => {
                        let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "help";

                        if (route.name === "Dashboard") {
                          iconName = "view-dashboard";
                        } else if (route.name === "Assessments") {
                          iconName = "clipboard-text";
                        } else if (route.name === "Chat") {
                          iconName = "message-text";
                        } else if (route.name === "Evaluation") {
                          iconName = "chart-bar";
                        } else if (route.name === "Resources") {
                          iconName = "folder-open";
                        } else if (route.name === "Profile") {
                          iconName = "account";
                        }

                        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                      },
                      tabBarActiveTintColor: currentThemeColor,
                      tabBarInactiveTintColor: isDark ? "#94a3b8" : "#64748b",
                      tabBarStyle: [
                        styles.tabBar,
                        isDark && { backgroundColor: "#151b2c", borderTopColor: "#1e293b" },
                      ],
                      tabBarLabelStyle: styles.tabBarLabel,
                      headerStyle: [
                        styles.header,
                        isDark && { backgroundColor: "#151b2c", borderBottomColor: "#1e293b" },
                      ],
                      headerTitleStyle: [styles.headerTitle, isDark && { color: "#f8fafc" }],
                      headerTintColor: isDark ? "#f8fafc" : "#0f172a",
                    })}
                  >
                    <Tab.Screen
                      name="Dashboard"
                      component={DashboardScreen}
                      options={{ title: "EduSync" }}
                    />
                    <Tab.Screen
                      name="Assessments"
                      component={AssessmentsScreen}
                      options={{ title: "Assessments" }}
                    />
                    <Tab.Screen
                      name="Chat"
                      component={ChatScreen}
                      options={{
                        title: "Messages",
                        tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                        tabBarBadgeStyle: {
                          backgroundColor: "#6366f1",
                          color: "#ffffff",
                          fontSize: 10,
                          fontWeight: "bold",
                        },
                      }}
                    />
                    <Tab.Screen
                      name="Evaluation"
                      component={EvaluationScreen}
                      options={{ title: "Progress" }}
                    />
                    <Tab.Screen
                      name="Resources"
                      component={ResourcesScreen}
                      options={{ title: "Resources" }}
                    />
                    <Tab.Screen
                      name="Profile"
                      component={ProfileScreen}
                      options={{ title: "Profile" }}
                    />
                    <Tab.Screen
                      name="CourseLearn"
                      component={CourseLearnScreen}
                      options={{
                        title: "Course Lesson",
                        tabBarButton: () => null,
                      }}
                    />
                  </Tab.Navigator>
                </NavigationContainer>
              </SafeAreaView>
            )}
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0", // Slate-200
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabBarLabel: {
    fontSize: 11,
    fontFamily: "System",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: 18,
    fontFamily: "System",
    color: "#0f172a", // Slate-900
  },
});
