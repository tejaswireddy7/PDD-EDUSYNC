import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import Fully Converted React Native Screens
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AssessmentsScreen from './src/screens/AssessmentsScreen';
import ChatScreen from './src/screens/ChatScreen';
import EvaluationScreen from './src/screens/EvaluationScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';
import { useDashboardStore } from './src/lib/store';

// Initialize the Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Custom Theme matching Skillora's premium color scheme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1', // Indigo-500
    secondary: '#06b6d4', // Cyan-500
    background: '#f8fafc', // Slate-50
    surface: '#ffffff',
    error: '#ef4444',
  },
};

const Tab = createBottomTabNavigator();

export default function App() {
  const store = useDashboardStore();
  const isAuthenticated = store.user !== null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          {!isAuthenticated ? (
            <AuthScreen onSuccess={() => {}} />
          ) : (
            <NavigationContainer>
              <StatusBar style="dark" />
              <Tab.Navigator
                initialRouteName="Dashboard"
                screenOptions={({ route }: { route: { name: string } }) => ({
                  tabBarIcon: ({ color, size }: { color: string; size: number }) => {
                    let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'help';

                    if (route.name === 'Dashboard') {
                      iconName = 'view-dashboard';
                    } else if (route.name === 'Assessments') {
                      iconName = 'clipboard-text';
                    } else if (route.name === 'Chat') {
                      iconName = 'message-text';
                    } else if (route.name === 'Evaluation') {
                      iconName = 'chart-bar';
                    } else if (route.name === 'Resources') {
                      iconName = 'folder-open';
                    }

                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                  },
                  tabBarActiveTintColor: '#6366f1', // Skillora Indigo Accent
                  tabBarInactiveTintColor: '#64748b', // Slate Gray
                  tabBarStyle: styles.tabBar,
                  tabBarLabelStyle: styles.tabBarLabel,
                  headerStyle: styles.header,
                  headerTitleStyle: styles.headerTitle,
                  headerTintColor: '#0f172a',
                })}
              >
                <Tab.Screen 
                  name="Dashboard" 
                  component={DashboardScreen} 
                  options={{ title: 'Skillora' }}
                />
                <Tab.Screen 
                  name="Assessments" 
                  component={AssessmentsScreen} 
                  options={{ title: 'Assessments' }}
                />
                <Tab.Screen 
                  name="Chat" 
                  component={ChatScreen} 
                  options={{ 
                    title: 'AI Coach',
                    headerShown: false // Hide react-navigation header to use custom header inside the dual-pane list view
                  }}
                />
                <Tab.Screen 
                  name="Evaluation" 
                  component={EvaluationScreen} 
                  options={{ title: 'Analytics' }}
                />
                <Tab.Screen 
                  name="Resources" 
                  component={ResourcesScreen} 
                  options={{ title: 'Resource Hub' }}
                />
              </Tab.Navigator>
            </NavigationContainer>
          )}
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0', // Slate-200
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabBarLabel: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'System',
    color: '#0f172a', // Slate-900
  },
});
