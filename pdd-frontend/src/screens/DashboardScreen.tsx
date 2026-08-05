import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { Header } from "../components/skillora/Header";
import { StatCards } from "../components/skillora/StatCards";
import { ContinueLearning } from "../components/skillora/ContinueLearning";
import { CareerPanel } from "../components/skillora/CareerPanel";
import { SideRail } from "../components/skillora/SideRail";
import { ResourceHub } from "../components/skillora/ResourceHub";
import { SurveyModal } from "../components/skillora/SurveyModal";
import { useDashboardStore } from "../lib/store";

export default function DashboardScreen() {
  const store = useDashboardStore();

  const focusDomain = store.surveyAnswers?.focusDomain;
  const proficiency = store.surveyAnswers?.proficiency;

  useEffect(() => {
    if (store.token && !store.isLoadingRecommendations) {
      store.fetchRecommendations();
    }
  }, [store.token, focusDomain, proficiency]);

  return (
    <View style={styles.outerContainer}>
      {/* ========================================================================= */}
      {/* DEVELOPER SANDBOX CONTROLS (Secret Testing Override Bar)                  */}
      {/* ========================================================================= */}
      <View style={styles.sandboxBar}>
        <View style={styles.sandboxTextRow}>
          <View style={styles.sandboxBadge} />
          <Text style={styles.sandboxTitle}>EduSync Testing Sandbox</Text>
        </View>
        <View style={styles.sandboxActions}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={store.triggerInstantResurvey} 
            style={styles.sandboxBtn}
          >
            <Text style={styles.sandboxBtnText}>⚡ Simulate 7-Day Resurvey</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={store.resetSurvey} 
            style={[styles.sandboxBtn, styles.sandboxBtnReset]}
          >
            <Text style={[styles.sandboxBtnText, styles.sandboxBtnTextReset]}>🔄 Reset Survey</Text>
          </TouchableOpacity>
        </View>
      </View>

      {store.isLoadingRecommendations || !store.recommendations || !store.recommendations.courses ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Personalizing your learning path...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          <StatCards />
          <ContinueLearning />
          <CareerPanel />
          <SideRail />
          <ResourceHub />
          <View style={styles.spacer} />
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* DUAL SURVEILLANCE OVERLAYS                                                */}
      {/* ========================================================================= */}
      {/* Modal 1: Onboarding Survey (First login) */}
      <SurveyModal 
        visible={!store.isLoadingProfile && !store.surveyCompleted} 
        isResurvey={false} 
      />

      {/* Modal 2: 7-Day Recurring Check-In Survey (Active after 7 days) */}
      <SurveyModal 
        visible={store.isResurveyDue} 
        isResurvey={true} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  spacer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  
  // Sandbox styles
  sandboxBar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }
    })
  },
  sandboxTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sandboxBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  sandboxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.3,
  },
  sandboxActions: {
    flexDirection: "row",
    gap: 8,
  },
  sandboxBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sandboxBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
  },
  sandboxBtnReset: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
  },
  sandboxBtnTextReset: {
    color: "#ef4444",
  },
});
