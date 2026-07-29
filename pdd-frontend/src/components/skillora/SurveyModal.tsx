import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, SurveyAnswers } from "../../lib/store";

interface SurveyModalProps {
  visible: boolean;
  isResurvey?: boolean;
}

export function SurveyModal({ visible, isResurvey = false }: SurveyModalProps) {
  const store = useDashboardStore();
  
  // Selection states
  const [domain, setDomain] = useState<"Frontend" | "Backend" | "Mobile" | "AI">("Mobile");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [hours, setHours] = useState<number>(5);

  const handleSubmit = () => {
    const answers: SurveyAnswers = {
      focusDomain: domain,
      proficiency: level,
      learningHours: hours
    };
    store.submitSurvey(answers);
  };

  const handleDismiss = () => {
    if (isResurvey) {
      store.skipResurvey();
    } else {
      // Submit with current default selections so dashboard loads immediately
      store.submitSurvey({
        focusDomain: domain,
        proficiency: level,
        learningHours: hours,
      });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header Graphic */}
          <LinearGradient
            colors={["#8b5cf6", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={styles.sparkleRow}>
              <Feather name="star" size={20} color="#ffffff" />
              <Text style={styles.headerSubtitle}>
                {isResurvey ? "Weekly Check-In" : "Personalize Your Path"}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {isResurvey ? "Re-evaluate Your Learning Goals" : "Welcome to EduSync!"}
            </Text>
            <Text style={styles.headerDesc}>
              {isResurvey 
                ? "Let's update your focus to optimize your daily AI recommendation feeds."
                : "Answer 3 quick questions to build your personalized AI learning pipeline."}
            </Text>
          </LinearGradient>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Question 1: Domain Focus */}
            <View style={styles.questionSection}>
              <Text style={styles.questionTitle}>1. What is your primary learning focus?</Text>
              <View style={styles.optionsGrid}>
                {[
                  { id: "Frontend", label: "Frontend Dev", icon: "monitor" },
                  { id: "Backend", label: "Backend Systems", icon: "database" },
                  { id: "Mobile", label: "Mobile Apps", icon: "smartphone" },
                  { id: "AI", label: "AI & Data Science", icon: "cpu" }
                ].map((item) => {
                  const isSelected = domain === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => setDomain(item.id as any)}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    >
                      <Feather 
                        name={item.icon as any} 
                        size={20} 
                        color={isSelected ? "#6366f1" : "#64748b"} 
                        style={styles.optionIcon} 
                      />
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Question 2: Proficiency */}
            <View style={styles.questionSection}>
              <Text style={styles.questionTitle}>2. What is your current technical proficiency?</Text>
              <View style={styles.tierContainer}>
                {[
                  { id: "Beginner", label: "Beginner", desc: "No coding experience" },
                  { id: "Intermediate", label: "Intermediate", desc: "Know coding basics" },
                  { id: "Advanced", label: "Advanced", desc: "Building architectures" }
                ].map((item) => {
                  const isSelected = level === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => setLevel(item.id as any)}
                      style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                    >
                      <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
                      <View style={styles.tierTextColumn}>
                        <Text style={[styles.tierLabel, isSelected && styles.tierLabelSelected]}>
                          {item.label}
                        </Text>
                        <Text style={styles.tierDesc}>{item.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Question 3: Time Commitment */}
            <View style={styles.questionSection}>
              <Text style={styles.questionTitle}>3. How many hours can you dedicate weekly?</Text>
              <View style={styles.hoursRow}>
                {[
                  { val: 2, label: "2 Hrs / wk" },
                  { val: 5, label: "5 Hrs / wk" },
                  { val: 10, label: "10+ Hrs / wk" }
                ].map((item) => {
                  const isSelected = hours === item.val;
                  return (
                    <TouchableOpacity
                      key={item.val}
                      activeOpacity={0.8}
                      onPress={() => setHours(item.val)}
                      style={[styles.hourPill, isSelected && styles.hourPillSelected]}
                    >
                      <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.footerRow}>
            {isResurvey && (
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={store.skipResurvey} 
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              activeOpacity={0.85} 
              onPress={handleSubmit} 
              style={[styles.submitButton, !isResurvey && { width: "100%" }]}
            >
              <LinearGradient
                colors={["#8b5cf6", "#6366f1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientSubmit}
              >
                <Text style={styles.submitText}>
                  {isResurvey ? "Apply Settings" : "Start Learning"}
                </Text>
                <Feather name="arrow-right" size={16} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // Slate-900 back-tint
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: "blur(8px)",
      }
    })
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    maxHeight: "90%",
  },
  modalHeader: {
    padding: 24,
    paddingTop: 32,
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 28,
  },
  headerDesc: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
  scrollBody: {
    padding: 24,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionCard: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionCardSelected: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  optionIcon: {
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  optionLabelSelected: {
    color: "#4f46e5",
  },
  tierContainer: {
    gap: 10,
  },
  tierCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 14,
  },
  tierCardSelected: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#94a3b8",
    marginRight: 12,
  },
  radioDotSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#6366f1",
  },
  tierTextColumn: {},
  tierLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  tierLabelSelected: {
    color: "#4f46e5",
  },
  tierDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  hoursRow: {
    flexDirection: "row",
    gap: 10,
  },
  hourPill: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 14,
    paddingVertical: 12,
  },
  hourPillSelected: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  hourText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  hourTextSelected: {
    color: "#4f46e5",
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  skipText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1.8,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientSubmit: {
    flexDirection: "row",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
