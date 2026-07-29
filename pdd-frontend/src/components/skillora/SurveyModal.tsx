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
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, SurveyAnswers } from "../../lib/store";

interface SurveyModalProps {
  visible: boolean;
  isResurvey?: boolean;
}

const CONNECTING_QUESTIONS = {
  Frontend: {
    knowledgeOptions: [
      { id: "html_css", label: "HTML5/CSS3 Layouts (Flexbox, Grid)" },
      { id: "js_basics", label: "JavaScript fundamentals & ES6" },
      { id: "react_basics", label: "React basics (components, state, props)" }
    ],
    masterOptions: [
      { id: "state_management", label: "State Management (Redux/Zustand)" },
      { id: "ssr_nextjs", label: "Next.js & Server Components" },
      { id: "tailwind_styling", label: "Tailwind CSS & Styling systems" },
      { id: "performance", label: "Performance & Core Web Vitals" }
    ]
  },
  Backend: {
    knowledgeOptions: [
      { id: "node_basics", label: "Node.js runtime & npm package basics" },
      { id: "express_apis", label: "REST APIs & Express routing" },
      { id: "basic_sql", label: "Relational databases & SQL queries" }
    ],
    masterOptions: [
      { id: "db_prisma", label: "Database relations & Prisma ORM" },
      { id: "docker", label: "Docker containerization & Kubernetes" },
      { id: "microservices", label: "Java Spring Boot Microservices" },
      { id: "caching", label: "Redis Caching & Queue servers" }
    ]
  },
  Mobile: {
    knowledgeOptions: [
      { id: "react_native_basics", label: "React Native UI Components" },
      { id: "expo_basics", label: "Expo framework CLI & SDKs" },
      { id: "mobile_flexbox", label: "Flexbox layout scaling rules" }
    ],
    masterOptions: [
      { id: "navigation", label: "Advanced React Navigation (Stacks, Tabs)" },
      { id: "hardware_apis", label: "Hardware APIs (GPS, Camera, Sensors)" },
      { id: "native_bridges", label: "Kotlin & Swift Native Bridges" },
      { id: "deployment", label: "App Store & Play Store deployment" }
    ]
  },
  AI: {
    knowledgeOptions: [
      { id: "python_basics", label: "Python language structure & modules" },
      { id: "pandas_numpy", label: "Pandas & Numpy data preprocessing" },
      { id: "basic_stats", label: "Probability & basic statistics math" }
    ],
    masterOptions: [
      { id: "pytorch", label: "Deep Learning (Neural Networks, PyTorch)" },
      { id: "transformers_nlp", label: "Natural Language Processing & LLMs" },
      { id: "mlops", label: "MLOps pipelines & AI model deployment" },
      { id: "llm_finetuning", label: "Fine-tuning & Retrieval (RAG)" }
    ]
  }
};

export function SurveyModal({ visible, isResurvey = false }: SurveyModalProps) {
  const store = useDashboardStore();
  
  // Multi-step state
  const [step, setStep] = useState<number>(1);

  // Selection states
  const [domain, setDomain] = useState<"Frontend" | "Backend" | "Mobile" | "AI">("Mobile");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [hours, setHours] = useState<number>(5);
  const [existingKnowledge, setExistingKnowledge] = useState<string[]>([]);
  const [targetGoal, setTargetGoal] = useState<string>("");

  const handleDomainChange = (selectedDomain: "Frontend" | "Backend" | "Mobile" | "AI") => {
    setDomain(selectedDomain);
    setExistingKnowledge([]);
    setTargetGoal("");
  };

  const handleToggleKnowledge = (id: string) => {
    setExistingKnowledge((prev) => 
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const answers: SurveyAnswers = {
      focusDomain: domain,
      proficiency: level,
      learningHours: hours,
      existingKnowledge,
      targetLearningGoal: targetGoal || undefined
    };
    store.submitSurvey(answers);
    setStep(1);
  };

  const handleDismiss = () => {
    if (isResurvey) {
      store.skipResurvey();
    } else {
      // Submit with current selections
      store.submitSurvey({
        focusDomain: domain,
        proficiency: level,
        learningHours: hours,
        existingKnowledge,
        targetLearningGoal: targetGoal || undefined
      });
    }
    setStep(1);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const currentQuestions = CONNECTING_QUESTIONS[domain];

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
                {isResurvey ? "Weekly Check-In" : `Step ${step} of 3`}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {isResurvey ? "Re-evaluate Your Learning Goals" : step === 1 ? "Customize Your Pathway" : step === 2 ? "Your Knowledge & Target" : "Configure Time Commitment"}
            </Text>
            <Text style={styles.headerDesc}>
              {isResurvey 
                ? "Let's update your focus to optimize your daily AI recommendation feeds."
                : step === 1 ? "Tell us your primary engineering domain and coding experience level."
                : step === 2 ? `Help us personalize suggestions based on your existing ${domain} skills.`
                : "Decide how much time you'd like to devote to these lessons."}
            </Text>
          </LinearGradient>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <>
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
                          onPress={() => handleDomainChange(item.id as any)}
                          style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        >
                          <Feather 
                            name={item.icon as any} 
                            size={18} 
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
                  <Text style={styles.questionTitle}>2. What is your current technical level?</Text>
                  <View style={styles.tierContainer}>
                    {[
                      { id: "Beginner", label: "Beginner", desc: "Starting out, no experience" },
                      { id: "Intermediate", label: "Intermediate", desc: "Worked on projects, know core syntax" },
                      { id: "Advanced", label: "Advanced", desc: "Senior developer building architectures" }
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
              </>
            )}

            {step === 2 && (
              <>
                {/* Dynamic Question: Existing Knowledge (Checkboxes) */}
                <View style={styles.questionSection}>
                  <Text style={styles.questionTitle}>What do you already know in {domain}?</Text>
                  <View style={styles.tierContainer}>
                    {currentQuestions.knowledgeOptions.map((item) => {
                      const isChecked = existingKnowledge.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.8}
                          onPress={() => handleToggleKnowledge(item.id)}
                          style={[styles.tierCard, isChecked && styles.tierCardSelected]}
                        >
                          <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                            {isChecked && <Feather name="check" size={10} color="#ffffff" />}
                          </View>
                          <View style={styles.tierTextColumn}>
                            <Text style={[styles.tierLabel, isChecked && styles.tierLabelSelected]}>
                              {item.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Dynamic Question: Goal Topic to master (Radio choices) */}
                <View style={styles.questionSection}>
                  <Text style={styles.questionTitle}>What specific topic do you want to learn next?</Text>
                  <View style={styles.tierContainer}>
                    {currentQuestions.masterOptions.map((item) => {
                      const isSelected = targetGoal === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.8}
                          onPress={() => setTargetGoal(item.id)}
                          style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                        >
                          <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
                          <View style={styles.tierTextColumn}>
                            <Text style={[styles.tierLabel, isSelected && styles.tierLabelSelected]}>
                              {item.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                {/* Question 3: Time Commitment */}
                <View style={styles.questionSection}>
                  <Text style={styles.questionTitle}>How many hours can you dedicate weekly?</Text>
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
              </>
            )}
          </ScrollView>

          {/* Action Row */}
          <View style={styles.footerRow}>
            {step > 1 ? (
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={handleBack} 
                style={styles.backButton}
              >
                <Feather name="arrow-left" size={14} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : isResurvey ? (
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={store.skipResurvey} 
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity 
              activeOpacity={0.85} 
              onPress={handleNext} 
              style={[styles.submitButton, (step === 1 && !isResurvey) && { width: "100%", flex: 1 }]}
            >
              <LinearGradient
                colors={["#8b5cf6", "#6366f1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientSubmit}
              >
                <Text style={styles.submitText}>
                  {step === 3 ? (isResurvey ? "Apply Settings" : "Start Learning") : "Continue"}
                </Text>
                <Feather name={step === 3 ? "check" : "arrow-right"} size={16} color="#ffffff" />
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
    backgroundColor: "rgba(15, 23, 42, 0.6)",
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
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 26,
  },
  headerDesc: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    lineHeight: 17,
  },
  scrollBody: {
    padding: 24,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 13,
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
    minWidth: 120,
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
    fontSize: 11,
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
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#94a3b8",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#6366f1",
  },
  tierTextColumn: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
  },
  tierLabelSelected: {
    color: "#4f46e5",
  },
  tierDesc: {
    fontSize: 10,
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
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: "600",
  },
  backButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
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
    fontSize: 13,
    fontWeight: "700",
  },
});
