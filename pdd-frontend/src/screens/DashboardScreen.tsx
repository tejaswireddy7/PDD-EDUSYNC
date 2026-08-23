import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from "react-native";
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
  const [refreshing, setRefreshing] = useState(false);

  const focusDomain = store.surveyAnswers?.focusDomain;
  const proficiency = store.surveyAnswers?.proficiency;

  useEffect(() => {
    if (store.token && !store.isLoadingRecommendations) {
      store.fetchRecommendations();
    }
  }, [store.token, focusDomain, proficiency]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await store.fetchRecommendations();
    } catch (e) {
      console.warn("Dashboard refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.outerContainer}>


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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366f1"]} />
          }
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
    height: 100,
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

});
