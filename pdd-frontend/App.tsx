import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchDBAllIncomingUnreadCount } from "./src/lib/supabase-db";
import { supabase } from "./src/lib/supabase";

class MemoryStorage {
  private data: Record<string, string> = {};
  private hydrationPromise: Promise<void> | null = null;

  constructor() {
    this.hydrationPromise = this.loadFromAsyncStorage();
  }

  async loadFromAsyncStorage() {
    if (Platform.OS !== "web") {
      try {
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const keys = await AsyncStorage.getAllKeys();
        const pairs = await AsyncStorage.multiGet(keys);
        for (const [key, value] of pairs) {
          if (value !== null) {
            this.data[key] = value;
          }
        }
      } catch (e) {
        console.warn("MemoryStorage hydration failed:", e);
      }
    }
  }

  getItem(key: string): string | null {
    return this.data[key] !== undefined ? this.data[key] : null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
    if (Platform.OS !== "web") {
      import("@react-native-async-storage/async-storage")
        .then(({ default: AsyncStorage }) => {
          AsyncStorage.setItem(key, String(value));
        })
        .catch(() => {});
    }
  }

  removeItem(key: string): void {
    delete this.data[key];
    if (Platform.OS !== "web") {
      import("@react-native-async-storage/async-storage")
        .then(({ default: AsyncStorage }) => {
          AsyncStorage.removeItem(key);
        })
        .catch(() => {});
    }
  }

  clear(): void {
    this.data = {};
    if (Platform.OS !== "web") {
      import("@react-native-async-storage/async-storage")
        .then(({ default: AsyncStorage }) => {
          AsyncStorage.clear();
        })
        .catch(() => {});
    }
  }

  get length(): number {
    return Object.keys(this.data).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] !== undefined ? keys[index] : null;
  }
}

if (Platform.OS !== "web" && typeof window !== "undefined") {
  (window as any).localStorage = new MemoryStorage();
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
                      title: "Messenger",
                      headerShown: false, // Hide react-navigation header to use custom header inside the dual-pane list view
                      tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    }}
                  />
                  <Tab.Screen
                    name="Evaluation"
                    component={EvaluationScreen}
                    options={{ title: "Analytics" }}
                  />
                  <Tab.Screen
                    name="Resources"
                    component={ResourcesScreen}
                    options={{ title: "Resource Hub" }}
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
