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

const themeColors = {
  light: { primary: "#64748b" },
  indigo: { primary: "#6366f1" },
  dark: { primary: "#0d9488" },
};

const themeGradients = {
  light: ["#94a3b8", "#64748b"] as const,
  indigo: ["#8b5cf6", "#6366f1"] as const,
  dark: ["#14b8a6", "#0d9488"] as const,
};

function BootstrapIcon({ name, size, color, style }: { name: string; size: number; color: string; style?: any }) {
  if (Platform.OS === "web") {
    return <i className={`bi bi-${name}`} style={{ fontSize: size, color: color, display: "inline-block", lineHeight: 1, ...style }} />;
  }
  return <Feather name="help-circle" size={size} color={color} style={style} />;
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

const DOMAIN_OPTIONS = [
  { id: "Frontend", label: "Frontend Dev" },
  { id: "Backend", label: "Backend Systems" },
  { id: "Mobile", label: "Mobile Apps" },
  { id: "AI", label: "AI & Data Science" }
];

const SUB_COURSES = {
  Frontend: [
    { id: "react_basics", label: "React Basics" },
    { id: "state_management", label: "State Management (Redux/Zustand)" },
    { id: "ssr_nextjs", label: "Next.js & Server Components" },
    { id: "tailwind_styling", label: "Tailwind CSS & Styling systems" },
    { id: "performance", label: "Performance & Core Web Vitals" },
    { id: "html_css", label: "HTML5/CSS3 Layouts (Flexbox, Grid)" },
    { id: "js_basics", label: "JavaScript fundamentals & ES6" },
  ],
  Backend: [
    { id: "node_basics", label: "Node.js runtime & npm package basics" },
    { id: "express_apis", label: "REST APIs & Express routing" },
    { id: "basic_sql", label: "Relational databases & SQL queries" },
    { id: "db_prisma", label: "Database relations & Prisma ORM" },
    { id: "docker", label: "Docker containerization & Kubernetes" },
    { id: "microservices", label: "Java Spring Boot Microservices" },
    { id: "caching", label: "Redis Caching & Queue servers" }
  ],
  Mobile: [
    { id: "react_native_basics", label: "React Native UI Components" },
    { id: "expo_basics", label: "Expo framework CLI & SDKs" },
    { id: "mobile_flexbox", label: "Flexbox layout scaling rules" },
    { id: "navigation", label: "Advanced React Navigation" },
    { id: "hardware_apis", label: "Hardware APIs (GPS, Camera, Sensors)" },
    { id: "native_bridges", label: "Kotlin & Swift Native Bridges" },
    { id: "deployment", label: "App Store & Play Store deployment" }
  ],
  AI: [
    { id: "python_basics", label: "Python language structure & modules" },
    { id: "pandas_numpy", label: "Pandas & Numpy data preprocessing" },
    { id: "basic_stats", label: "Probability & basic statistics math" },
    { id: "pytorch", label: "Deep Learning (Neural Networks, PyTorch)" },
    { id: "transformers_nlp", label: "Natural Language Processing & LLMs" },
    { id: "mlops", label: "MLOps pipelines & AI model deployment" },
    { id: "llm_finetuning", label: "Fine-tuning & Retrieval (RAG)" }
  ]
};

function CustomDropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  icon = "chevron-down",
  themeColor,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
  placeholder?: string;
  icon?: string;
  themeColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsOpen(!isOpen)}
        style={[
          styles.dropdownTrigger,
          isOpen && { borderColor: themeColor }
        ]}
      >
        <View style={styles.dropdownTriggerLeft}>
          <BootstrapIcon name={icon} size={14} color={selectedOption ? themeColor : "#64748b"} style={{ marginRight: 8 }} />
          <Text style={[styles.dropdownTriggerText, selectedOption ? styles.dropdownSelectedText : styles.dropdownPlaceholderText]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <BootstrapIcon name={isOpen ? "chevron-up" : "chevron-down"} size={12} color="#64748b" />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownOptionsContainer}>
          {options.map((opt, index) => {
            const isSelected = opt.id === value;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(opt.id);
                  setIsOpen(false);
                }}
                style={[
                  styles.dropdownOptionItem,
                  isSelected && { backgroundColor: `${themeColor}14` },
                  index === options.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  isSelected && { color: themeColor, fontWeight: "700" }
                ]}>
                  {opt.label}
                </Text>
                {isSelected && (
                  <BootstrapIcon name="check" size={14} color={themeColor} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function SurveyModal({ visible, isResurvey = false }: SurveyModalProps) {
  const store = useDashboardStore();
  
  // Multi-step state
  const [step, setStep] = useState<number>(1);

  // Selection states
  const [domain, setDomain] = useState<"Frontend" | "Backend" | "Mobile" | "AI">("Frontend");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [hours, setHours] = useState<number>(5);
  const [existingKnowledge, setExistingKnowledge] = useState<string[]>([]);
  const [targetGoal, setTargetGoal] = useState<string>("react_basics");

  const appTheme = store.appTheme || "indigo";
  const currentColors = themeColors[appTheme] || themeColors.indigo;
  const currentGradient = themeGradients[appTheme] || themeGradients.indigo;

  React.useEffect(() => {
    if (visible && store.surveyAnswers) {
      const focusDom = store.surveyAnswers.focusDomain || "Frontend";
      setDomain(focusDom);
      setLevel(store.surveyAnswers.proficiency || "Beginner");
      setHours(store.surveyAnswers.learningHours || 5);
      setExistingKnowledge(store.surveyAnswers.existingKnowledge || []);
      setTargetGoal(store.surveyAnswers.targetLearningGoal || (SUB_COURSES[focusDom]?.[0]?.id || "react_basics"));
    }
  }, [visible, store.surveyAnswers]);

  const handleDomainChange = (selectedDomain: "Frontend" | "Backend" | "Mobile" | "AI") => {
    setDomain(selectedDomain);
    setExistingKnowledge([]);
    const defaultSub = SUB_COURSES[selectedDomain][0].id;
    setTargetGoal(defaultSub);
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
            colors={currentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={styles.sparkleRow}>
              <BootstrapIcon name="star-fill" size={16} color="#ffffff" />
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
                {/* Question 1: Focus path and Sub-course dropdowns */}
                <CustomDropdown
                  label="1. Choose your focus path"
                  value={domain}
                  options={DOMAIN_OPTIONS}
                  onSelect={(id) => handleDomainChange(id as any)}
                  placeholder="Select Focus Type"
                  icon="layers"
                  themeColor={currentColors.primary}
                />

                <CustomDropdown
                  label="2. Select target sub-course"
                  value={targetGoal}
                  options={SUB_COURSES[domain]}
                  onSelect={(id) => setTargetGoal(id)}
                  placeholder="Select Sub Course"
                  icon="journal-code"
                  themeColor={currentColors.primary}
                />

                {/* Question 2: Proficiency */}
                <View style={styles.questionSection}>
                  <Text style={styles.questionTitle}>3. What is your current technical level?</Text>
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
                          style={[
                            styles.tierCard, 
                            isSelected && { borderColor: currentColors.primary, backgroundColor: `${currentColors.primary}14` }
                          ]}
                        >
                          <View style={[
                            styles.radioDot, 
                            isSelected && { borderColor: currentColors.primary, backgroundColor: currentColors.primary }
                          ]} />
                          <View style={styles.tierTextColumn}>
                            <Text style={[
                              styles.tierLabel, 
                              isSelected && { color: currentColors.primary, fontWeight: "700" }
                            ]}>
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
                          style={[
                            styles.tierCard, 
                            isChecked && { borderColor: currentColors.primary, backgroundColor: `${currentColors.primary}14` }
                          ]}
                        >
                          <View style={[
                            styles.checkbox, 
                            isChecked && { borderColor: currentColors.primary, backgroundColor: currentColors.primary }
                          ]}>
                            {isChecked && <BootstrapIcon name="check-lg" size={10} color="#ffffff" />}
                          </View>
                          <View style={styles.tierTextColumn}>
                            <Text style={[
                              styles.tierLabel, 
                              isChecked && { color: currentColors.primary, fontWeight: "700" }
                            ]}>
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
                          style={[
                            styles.hourPill, 
                            isSelected && { borderColor: currentColors.primary, backgroundColor: `${currentColors.primary}14` }
                          ]}
                        >
                          <Text style={[
                            styles.hourText, 
                            isSelected && { color: currentColors.primary, fontWeight: "700" }
                          ]}>
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
                <BootstrapIcon name="arrow-left" size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : isResurvey ? (
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={store.skipResurvey} 
                style={styles.skipButton}
              >
                <BootstrapIcon name="x-lg" size={12} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity 
              activeOpacity={0.85} 
              onPress={handleNext} 
              style={[styles.submitButton, (step === 1 && !isResurvey) && { width: "100%", flex: 1 }]}
            >
              <LinearGradient
                colors={currentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientSubmit}
              >
                <Text style={[styles.submitText, { textAlign: "center" }]}>
                  {step === 3 ? (isResurvey ? "Apply Settings" : "Start Learning") : "Continue"}
                </Text>
                <View style={{ position: "absolute", right: 20 }}>
                  <BootstrapIcon name={step === 3 ? "check-lg" : "arrow-right"} size={14} color="#ffffff" />
                </View>
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
    width: "100%",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownContainer: {
    marginBottom: 20,
    width: "100%",
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  dropdownTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownSelectedText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  dropdownPlaceholderText: {
    color: "#94a3b8",
  },
  dropdownOptionsContainer: {
    marginTop: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
});
