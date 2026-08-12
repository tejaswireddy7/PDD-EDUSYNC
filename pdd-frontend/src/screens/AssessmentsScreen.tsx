import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Alert, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { fetchDBAssessments, updateDBAssessment } from "../lib/supabase-db";
import { useNavigate } from "@tanstack/react-router";

type Status = "open" | "in-progress" | "submitted";
type Assessment = {
  id: string;
  title: string;
  type: "Project" | "Coding" | "Lab" | "Essay";
  subject: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  deadline: string;
  skills: string[];
  progress: number;
  status: Status;
  questions?: Array<{ question: string; options: string[]; correctAnswer: number }> | null;
  responses?: any;
  start_date?: string;
  due_date?: string;
  last_penalized_at?: string;
};

const typeIcon = {
  Project: "file-text",
  Coding: "code",
  Lab: "flask",
  Essay: "edit-3",
};

const tintByStatus: Record<Status, string> = {
  open: "bgMuted",
  "in-progress": "bgPrimary",
  submitted: "bgMint",
};

const tintTextByStatus: Record<Status, string> = {
  open: "textGray",
  "in-progress": "textPrimary",
  submitted: "textMint",
};

const isLate = (a: { status: string; due_date?: string }) => {
  if (a.status === "submitted" || !a.due_date) return false;
  return new Date() > new Date(a.due_date);
};

const getXpLost = (a: { status: string; due_date?: string }) => {
  if (a.status === "submitted" || !a.due_date) return 0;
  const dueDate = new Date(a.due_date);
  const now = new Date();
  if (now <= dueDate) return 0;
  const msLate = now.getTime() - dueDate.getTime();
  const daysLate = Math.floor(msLate / (24 * 60 * 60 * 1000));
  return Math.max(50, daysLate * 50);
};

export default function AssessmentsScreen() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";

  const [items, setItems] = useState<Assessment[]>([]);
  const [active, setActive] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dbAssessments = await fetchDBAssessments(user.id, focusDomain, userProficiency);
          setItems(dbAssessments as any);
          if (dbAssessments.length > 0) {
            setActive((prev) => dbAssessments.find((a) => a.id === prev?.id) || dbAssessments[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load assessments from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [focusDomain, userProficiency]);

  useEffect(() => {
    if (active) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [active]);

  const current = items.find((i) => i.id === active?.id) ?? items[0] ?? null;

  const handleUpdate = async (patch: Partial<Assessment>) => {
    if (!current) return;
    setItems((prev) => prev.map((i) => (i.id === current.id ? { ...i, ...patch } : i)));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateDBAssessment(user.id, current.id, patch as any);
      }
    } catch (err) {
      console.warn("Failed to update assessment in Supabase:", err);
    }
    if (patch.status === "submitted") {
      store.submitAssessment(current.id);
    }
  };

  if (loading || !current) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Header />

      {/* 1. Filterable Assessments List */}
      <AssessmentList items={items} activeId={current.id} onPick={setActive} />

      {/* 2. Submission & Upload Panel */}
      <SubmissionPanel assessment={current} onUpdate={handleUpdate} />

      <View style={styles.spacer} />
    </ScrollView>
  );
}

// 2. Submission Panel Component
type Uploaded = { name: string; size: number };

const QUIZ_QUESTIONS: Record<string, Array<{ question: string; options: string[]; correctAnswer: number }>> = {
  Frontend: [
    {
      question: "Which React hook is used to perform side effects in functional components?",
      options: ["useState", "useEffect", "useContext", "useMemo"],
      correctAnswer: 1,
    },
    {
      question: "What is the default layout direction of Flexbox in CSS?",
      options: ["row", "column", "grid", "inline"],
      correctAnswer: 0,
    },
    {
      question: "What does semantic HTML primarily improve?",
      options: ["SEO and Accessibility", "Page load speed", "JavaScript execution time", "Database security"],
      correctAnswer: 0,
    },
    {
      question: "What is the main purpose of the Virtual DOM in React?",
      options: [
        "To directly modify the browser's DOM for speed",
        "To synchronize local state with cloud databases",
        "To compute UI updates in memory before updating the real DOM",
        "To style web pages using CSS variables"
      ],
      correctAnswer: 2,
    }
  ],
  Backend: [
    {
      question: "Which HTTP status code represents a successful resource creation?",
      options: ["200 OK", "201 Created", "400 Bad Request", "500 Server Error"],
      correctAnswer: 1,
    },
    {
      question: "In REST API design, which HTTP method should be used to update an existing resource completely?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correctAnswer: 2,
    },
    {
      question: "What is the primary purpose of database indexing?",
      options: [
        "To encrypt credentials",
        "To optimize query search and data retrieval speeds",
        "To eliminate duplicate table rows",
        "To transform relational data to JSON automatically"
      ],
      correctAnswer: 1,
    },
    {
      question: "What is the core benefit of containerizing backend apps with Docker?",
      options: [
        "To generate random secret keys",
        "To package code and all its dependencies into a portable, isolated container",
        "To compile TypeScript into optimized JavaScript bundles",
        "To automatically write API documentation"
      ],
      correctAnswer: 1,
    }
  ],
  Mobile: [
    {
      question: "In React Native, which component is best suited for rendering long, scrollable lists efficiently?",
      options: ["ScrollView", "FlatList", "View", "SafeAreaView"],
      correctAnswer: 1,
    },
    {
      question: "Which React Native hook reactively returns the current screen width and height?",
      options: ["useWindowDimensions", "useEffect", "useDimensions", "useStyle"],
      correctAnswer: 0,
    },
    {
      question: "What layout system is used by React Native for positioning components?",
      options: ["CSS Grid", "Floats & Absolute layout", "Flexbox", "Table columns"],
      correctAnswer: 2,
    },
    {
      question: "How is routing and navigation usually handled in modern Expo apps?",
      options: ["HTML anchor links", "Expo Router or React Navigation", "Window location redirects", "Conditional view rendering only"],
      correctAnswer: 1,
    }
  ],
  AI: [
    {
      question: "What is the process of adjusting network parameters to minimize the loss function called?",
      options: ["Validation", "Regularization", "Optimization (e.g. Gradient Descent)", "Data augmentation"],
      correctAnswer: 2,
    },
    {
      question: "Which data structure does PyTorch use to represent multi-dimensional arrays?",
      options: ["Dataframes", "Tensors", "Matrices", "Numpy Lists"],
      correctAnswer: 1,
    },
    {
      question: "Which activation function is most widely used in hidden layers of deep neural networks?",
      options: ["Linear", "ReLU (Rectified Linear Unit)", "Softmax", "Sigmoid"],
      correctAnswer: 1,
    },
    {
      question: "What is the main goal when training a machine learning model?",
      options: [
        "To minimize memory storage sizes",
        "To memorize all training samples exactly",
        "To generalize effectively to new, unseen data",
        "To execute network training as fast as possible"
      ],
      correctAnswer: 2,
    }
  ]
};

const PROJECT_TEMPLATES: Record<string, Array<{ title: string; files: string[] }>> = {
  Frontend: [
    { title: "React Vite Dashboard template", files: ["src/App.tsx", "package.json", "vite.config.ts", "index.html"] },
    { title: "Tailwind Portfolio Starter", files: ["index.html", "tailwind.config.js", "src/main.css", "package.json"] },
    { title: "Next.js E-Commerce Landing Page", files: ["app/page.tsx", "app/layout.tsx", "package.json", "next.config.js"] }
  ],
  Backend: [
    { title: "Express.js PostgreSQL API Boilerplate", files: ["src/index.js", "src/db.js", "package.json", "docker-compose.yml"] },
    { title: "Fastify Redis Cache Server", files: ["server.js", "config.js", "package.json", "README.md"] },
    { title: "Django Dockerized Microservice", files: ["manage.py", "requirements.txt", "Dockerfile", "docker-compose.yml"] }
  ],
  Mobile: [
    { title: "Expo Router Tab Navigation App", files: ["App.tsx", "package.json", "app/_layout.tsx", "app/index.tsx"] },
    { title: "React Native Maps Integration Starter", files: ["App.tsx", "package.json", "src/components/Map.tsx"] },
    { title: "Mobile Health Tracker template", files: ["App.tsx", "package.json", "src/store/health.ts"] }
  ],
  AI: [
    { title: "PyTorch Image Classifier Pipeline", files: ["train.py", "model.py", "dataset.py", "requirements.txt"] },
    { title: "HuggingFace LLM Chat API Wrapper", files: ["app.py", "config.py", "requirements.txt", "Dockerfile"] },
    { title: "Pandas Data Processing Sandbox", files: ["analyze.py", "data.csv", "requirements.txt"] }
  ]
};

function SubmissionPanel({ assessment, onUpdate }: { assessment: Assessment; onUpdate: (patch: Partial<Assessment>) => void }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [note, setNote] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customFileText, setCustomFileText] = useState("");

  // Quiz specific states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const isAdvanced = assessment.difficulty === "Advanced";

  const subjectKey = (assessment.subject || "Mobile") as keyof typeof QUIZ_QUESTIONS;
  const questions = assessment.questions || QUIZ_QUESTIONS[subjectKey] || QUIZ_QUESTIONS["Mobile"];
  const templates = PROJECT_TEMPLATES[subjectKey] || PROJECT_TEMPLATES["Mobile"];

  // Reset inputs when changing active assessment
  useEffect(() => {
    setFiles([]);
    setNote("");
    setGithubUrl("");
    setSelectedTemplate("");
    setCustomFileText("");
    setSelectedAnswers(assessment.responses || {});
    setQuizScore(null);
    setProgress(0);
    setUploading(false);
    setValidationError("");
  }, [assessment.id]);

  // Handle template selection
  const selectTemplate = (title: string, templateFiles: string[]) => {
    setSelectedTemplate(title);
    setValidationError("");
    const initialFiles = templateFiles.map(f => ({
      name: f,
      size: (Math.floor(Math.random() * 80) + 12) * 1024
    }));
    setFiles(initialFiles);
  };

  // Toggle template file inclusion
  const toggleTemplateFile = (fileName: string) => {
    if (files.some(f => f.name === fileName)) {
      setFiles(prev => prev.filter(f => f.name !== fileName));
    } else {
      const size = (Math.floor(Math.random() * 80) + 12) * 1024;
      setFiles(prev => [...prev, { name: fileName, size }]);
    }
  };

  // Add custom file name manually
  const handleAddCustomFile = () => {
    if (!customFileText.trim()) return;
    const name = customFileText.trim();
    if (files.some(f => f.name === name)) {
      Alert.alert("Duplicate File", "This file is already added.");
      return;
    }
    const size = (Math.floor(Math.random() * 80) + 12) * 1024;
    setFiles(prev => [...prev, { name, size }]);
    setCustomFileText("");
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectQuizAnswer = (qIdx: number, oIdx: number) => {
    const updated = {
      ...selectedAnswers,
      [qIdx]: oIdx
    };
    setSelectedAnswers(updated);
    setValidationError("");
    onUpdate({ responses: updated });
  };

  const submitProject = () => {
    if (!selectedTemplate) {
      setValidationError("Please select a project template.");
      return;
    }
    if (!githubUrl.trim() || !githubUrl.toLowerCase().includes("github.com")) {
      setValidationError("Please enter a valid GitHub repository URL.");
      return;
    }
    if (files.length === 0) {
      setValidationError("Please include at least one source file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          onUpdate({
            status: "submitted",
            progress: 100,
            responses: {
              githubUrl,
              selectedTemplate,
              files
            }
          });
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  const submitQuiz = () => {
    // Validate that all questions are answered
    if (Object.keys(selectedAnswers).length < questions.length) {
      setValidationError(`Please answer all ${questions.length} quiz questions before submitting.`);
      return;
    }

    // Compute score
    let scoreCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        scoreCount++;
      }
    });

    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setQuizScore(scoreCount);
          onUpdate({ status: "submitted", progress: 100 });
          return 100;
        }
        return p + 20;
      });
    }, 150);
  };

  const isLateAssessment = isLate(assessment);
  const statusBg = isLateAssessment ? "bgRed" : tintByStatus[assessment.status];
  const statusText = isLateAssessment ? "textRed" : tintTextByStatus[assessment.status];
  const statusLabel = isLateAssessment ? "LATE" : (assessment.status === "in-progress" ? "in progress" : assessment.status);

  // SUBMITTED STATE VIEW
  if (assessment.status === "submitted" && progress === 0) {
    return (
      <View style={styles.panelCard}>
        <View style={styles.successCard}>
          <View style={styles.successIconBox}>
            <Feather name="check-circle" size={24} color="#0d9488" />
          </View>
          <Text style={styles.successTitle}>Assessment Submitted!</Text>

          {isAdvanced ? (
            <Text style={styles.successDesc}>
              Your project "{selectedTemplate || "Source Code Submission"}" has been submitted for AI feedback. Detailed rubric mapping is ready in the Gradebook.
            </Text>
          ) : (
            <Text style={styles.successDesc}>
              Interactive quiz completed successfully! Earned +800 XP and streak bonus. Check your transparent rubric scoring details in the Gradebook.
            </Text>
          )}

          <TouchableOpacity
            onPress={() => navigate({ to: "/evaluation" })}
            style={styles.successButton}
          >
            <MaterialCommunityIcons name="creation" size={16} color="#ffffff" />
            <Text style={styles.successButtonText}>View AI Gradebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <Text style={styles.panelCategory}>
            {assessment.type} · {assessment.subject}
          </Text>
          <Text style={styles.panelTitle}>{assessment.title}</Text>
        </View>
        <View style={[styles.statusBadge, styles[statusBg as keyof typeof styles]]}>
          <Text style={[styles.statusBadgeText, styles[statusText as keyof typeof styles]]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        {assessment.skills.map((s) => (
          <View key={s} style={[styles.statusBadge, styles.bgMint]}>
            <Text style={[styles.statusBadgeText, styles.textMint]}>{s}</Text>
          </View>
        ))}
        <View style={[styles.statusBadge, styles.bgMuted]}>
          <Text style={[styles.statusBadgeText, styles.textGray]}>{assessment.difficulty}</Text>
        </View>
      </View>

      <View style={[
        styles.deadlineBox, 
        isLateAssessment && { backgroundColor: '#fef2f2', borderColor: '#fee2e2', borderWidth: 1 }
      ]}>
        <Feather name="clock" size={14} color={isLateAssessment ? "#ef4444" : "#6366f1"} />
        <View style={{ flex: 1 }}>
          <Text style={styles.deadlineLabel}>Deadline</Text>
          <Text style={[styles.deadlineValue, isLateAssessment && { color: '#ef4444', fontWeight: 'bold' }]}>
            {assessment.deadline}
          </Text>
          {isLateAssessment && (
            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>
              Late Penalty: -{getXpLost(assessment)} XP
            </Text>
          )}
        </View>
      </View>

      {/* RENDER INTERACTIVE QUIZ FOR BEGINNER / INTERMEDIATE */}
      {!isAdvanced && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.quizTitle}>Interactive Knowledge Check</Text>
          {questions.map((q, qIdx) => (
            <View key={qIdx} style={styles.quizCard}>
              <Text style={styles.quizQuestionText}>
                {qIdx + 1}. {q.question}
              </Text>
              {q.options.map((opt, oIdx) => {
                const isSel = selectedAnswers[qIdx] === oIdx;
                return (
                  <TouchableOpacity
                    key={oIdx}
                    onPress={() => handleSelectQuizAnswer(qIdx, oIdx)}
                    style={[styles.optionButton, isSel && styles.selectedOptionButton]}
                  >
                    <View style={[styles.optionCircle, isSel && styles.selectedOptionCircle]}>
                      {isSel && <View style={styles.selectedOptionInnerCircle} />}
                    </View>
                    <Text style={[styles.optionText, isSel && styles.selectedOptionText]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* RENDER PROJECT SUBMISSION FOR ADVANCED */}
      {isAdvanced && (
        <View style={{ marginBottom: 12 }}>
          {/* Template Selection */}
          <Text style={styles.templateSectionTitle}>Choose a Project Template</Text>
          <View style={styles.templateList}>
            {templates.map((t) => {
              const isSel = selectedTemplate === t.title;
              return (
                <TouchableOpacity
                  key={t.title}
                  onPress={() => selectTemplate(t.title, t.files)}
                  style={[styles.templateCard, isSel && styles.selectedTemplateCard]}
                >
                  <Text style={styles.templateTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.templateDesc}>{t.files.length} boilerplate files</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Template files selector (Only visible once a template is chosen) */}
          {selectedTemplate !== "" && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.fileTogglesTitle}>Project Files Configuration</Text>
              <View style={styles.fileTogglesContainer}>
                {templates.find(t => t.title === selectedTemplate)?.files.map((fileName) => {
                  const included = files.some(f => f.name === fileName);
                  return (
                    <TouchableOpacity
                      key={fileName}
                      onPress={() => toggleTemplateFile(fileName)}
                      style={styles.fileToggleRow}
                    >
                      <View style={styles.fileToggleLeft}>
                        <Feather name="file" size={12} color="#64748b" />
                        <Text style={styles.fileToggleText}>{fileName}</Text>
                      </View>
                      <Feather
                        name={included ? "check-square" : "square"}
                        size={14}
                        color={included ? "#6366f1" : "#94a3b8"}
                      />
                    </TouchableOpacity>
                  );
                })}

                {/* Custom File Adder Row */}
                <View style={styles.fileAddRow}>
                  <TextInput
                    value={customFileText}
                    onChangeText={setCustomFileText}
                    placeholder="Add custom file name (e.g. index.js)"
                    placeholderTextColor="#94a3b8"
                    style={styles.fileAddInput}
                  />
                  <TouchableOpacity onPress={handleAddCustomFile} style={styles.fileAddBtn}>
                    <Text style={styles.fileAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Custom attached files summary */}
          {files.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.fileTogglesTitle}>Included Submission Files</Text>
              <View style={styles.filesList}>
                {files.map((f, idx) => (
                  <View key={idx} style={styles.fileItem}>
                    <Feather name="file-text" size={14} color="#6366f1" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                      <Text style={styles.fileSize}>{(f.size / 1024).toFixed(1)} KB</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFile(idx)}>
                      <Feather name="x" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* GitHub Repository URL */}
          <Text style={styles.inputLabel}>GitHub Repository URL</Text>
          <TextInput
            style={[styles.notesInput, { height: 40, marginBottom: 12, paddingVertical: 8 }]}
            value={githubUrl}
            onChangeText={(text) => {
              setGithubUrl(text);
              setValidationError("");
            }}
            placeholder="https://github.com/username/project"
            placeholderTextColor="#94a3b8"
          />

          {/* Note for Evaluator */}
          <Text style={styles.inputLabel}>Additional Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
            placeholder="Notes for evaluator (optional)…"
            placeholderTextColor="#94a3b8"
          />
        </View>
      )}

      {/* Validation Error Message */}
      {validationError !== "" && (
        <Text style={styles.errorText}>{validationError}</Text>
      )}

      {/* Uploading progress bar */}
      {(uploading || progress === 100) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {progress === 100 ? "Submitted" : isAdvanced ? "Uploading files..." : "Evaluating answers..."}
            </Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={isAdvanced ? submitProject : submitQuiz}
        disabled={uploading}
        style={[styles.submitButton, uploading && styles.disabledBtn]}
      >
        <MaterialCommunityIcons name="creation" size={16} color="#ffffff" />
        <Text style={styles.submitBtnText}>
          {isAdvanced ? "Submit project for AI evaluation" : "Submit answers for scoring"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.evaluationTime}>AI feedback within 60s · Transparent rubric scoring</Text>
    </View>
  );
}

function AssessmentList({ items, activeId, onPick }: { items: Assessment[]; activeId: string; onPick: (a: Assessment) => void }) {
  const [filter, setFilter] = useState<"all" | Status | "late">("all");
  const filtered = filter === "all" ? items 
    : filter === "late" ? items.filter(i => isLate(i))
    : filter === "open" ? items.filter(i => i.status === "open" && !isLate(i))
    : items.filter((i) => i.status === filter);
  const tabs: Array<{ k: "all" | Status | "late"; label: string }> = [
    { k: "all", label: "All" }, { k: "open", label: "Open" }, { k: "late", label: "Late" }, { k: "submitted", label: "Submitted" },
  ];

  return (
    <View style={styles.listCard}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>All Assessments</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
          {tabs.map((t) => {
            const isActive = filter === t.k;
            return (
              <TouchableOpacity
                key={t.k}
                onPress={() => setFilter(t.k)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.itemsWrapper}>
        {filtered.map((a) => {
          const icon = typeIcon[a.type] || "file";
          const isActive = a.id === activeId;
          const isLateAssessment = isLate(a);
          const statusBg = isLateAssessment ? "bgRed" : tintByStatus[a.status];
          const statusText = isLateAssessment ? "textRed" : tintTextByStatus[a.status];
          const statusLabel = isLateAssessment ? "LATE" : (a.status === "in-progress" ? "in progress" : a.status);
          return (
            <TouchableOpacity
              key={a.id}
              onPress={() => onPick(a)}
              style={[
                styles.listItem, 
                isActive ? styles.activeListItem : styles.inactiveListItem,
                isLateAssessment && { backgroundColor: '#fff5f5' },
                isLateAssessment && isActive && { borderColor: '#ef4444' },
                isLateAssessment && !isActive && { borderColor: '#fca5a5' }
              ]}
            >
              <View style={styles.listItemIconBox}>
                <Feather name={icon as any} size={16} color="#6366f1" />
              </View>
              <View style={styles.listItemDetails}>
                <View style={styles.listItemRow}>
                  <Text style={styles.listItemTitle} numberOfLines={1}>{a.title}</Text>
                  <View style={[styles.statusBadge, styles[statusBg as keyof typeof styles]]}>
                    <Text style={[styles.statusBadgeText, styles[statusText as keyof typeof styles]]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemSubRow}>
                  <Text style={styles.listItemMetaText}>{a.subject}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.listItemMetaText}>{a.difficulty}</Text>
                  <View style={styles.dot} />
                  <Feather name="clock" size={10} color={isLateAssessment ? "#ef4444" : "#94a3b8"} />
                  <Text style={[
                    styles.listItemMetaText, 
                    isLateAssessment && { color: '#ef4444', fontWeight: 'bold' }
                  ]} numberOfLines={1}>
                    {a.deadline}
                  </Text>
                </View>

                {isLateAssessment && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Feather name="alert-triangle" size={12} color="#ef4444" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>
                      Overdue Penalty: -{getXpLost(a)} XP
                    </Text>
                  </View>
                )}

                {/* Mobile progress display */}
                <View style={styles.listItemProgressRow}>
                  <Text style={styles.listItemProgressText}>{a.progress}% complete</Text>
                  <View style={styles.listItemProgressTrack}>
                    <View style={[styles.listItemProgressBar, { width: `${a.progress}%` }]} />
                  </View>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94a3b8" style={styles.chevron} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;
const upcomingCardWidth = screenWidth * 0.58;

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  horizontalScroll: {
    gap: 12,
  },
  upcomingCard: {
    width: upcomingCardWidth,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  activeBorder: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  inactiveBorder: {
    borderColor: "#e2e8f0",
  },
  upcomingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  upcomingIconContainer: {
    height: 28,
    width: 28,
    borderRadius: 8,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 16,
    height: 32,
    marginBottom: 8,
  },
  upcomingDeadline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upcomingDeadlineText: {
    fontSize: 10,
    color: "#64748b",
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  textPrimary: {
    color: "#6366f1",
  },
  bgMint: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  textMint: {
    color: "#0d9488",
  },
  bgMuted: {
    backgroundColor: "#f1f5f9",
  },
  textGray: {
    color: "#64748b",
  },
  bgRed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  textRed: {
    color: "#ef4444",
  },
  panelCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  panelHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  panelCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 14,
  },
  deadlineBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 16,
    gap: 10,
    marginBottom: 14,
  },
  deadlineLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  deadlineValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    marginBottom: 12,
  },
  uploadIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  uploadDesc: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
    textAlign: "center",
  },
  filesList: {
    gap: 8,
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  fileSize: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
  },
  notesInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#0f172a",
    textAlignVertical: "top",
    marginBottom: 14,
    height: 72,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  progressPercent: {
    fontSize: 11,
    color: "#64748b",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0d9488", // Mint progress bar
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    borderRadius: 18,
    paddingVertical: 12,
    gap: 6,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  evaluationTime: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 3,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#0f172a",
  },
  itemsWrapper: {
    gap: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
  },
  activeListItem: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  inactiveListItem: {
    borderColor: "transparent",
  },
  listItemIconBox: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  listItemDetails: {
    flex: 1,
    minWidth: 0,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  listItemSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  listItemMetaText: {
    fontSize: 10,
    color: "#64748b",
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: "#94a3b8",
  },
  listItemProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  listItemProgressText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
  },
  listItemProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 2,
    overflow: "hidden",
  },
  listItemProgressBar: {
    height: "100%",
    backgroundColor: "#6366f1",
  },
  chevron: {
    marginLeft: 6,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    marginTop: 12,
  },
  quizCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  quizQuestionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  selectedOptionButton: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.04)",
  },
  optionCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#94a3b8",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedOptionCircle: {
    borderColor: "#6366f1",
  },
  selectedOptionInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  optionText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  templateSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 10,
  },
  templateList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  templateCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
  },
  selectedTemplateCard: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  templateTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  templateDesc: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  fileTogglesTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  fileTogglesContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    padding: 10,
    marginBottom: 12,
  },
  fileToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  fileToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fileToggleText: {
    fontSize: 11,
    color: "#334155",
  },
  fileAddRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  fileAddInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: "#0f172a",
  },
  fileAddBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fileAddBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  successCard: {
    alignItems: "center",
    paddingVertical: 10,
  },
  successIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  successDesc: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d9488",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  successButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 6,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 10,
  },
  spacer: {
    height: 40,
  },
});
