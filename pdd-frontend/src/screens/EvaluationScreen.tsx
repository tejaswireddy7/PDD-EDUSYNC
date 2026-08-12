import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { fetchDBEvaluation, DBEvaluation } from "../lib/supabase-db";

export default function EvaluationScreen() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";
  const assessmentTitle = store.recommendations?.nextAssessment || `Introduction to ${focusDomain}`;

  const [evaluation, setEvaluation] = useState<DBEvaluation | null>(null);
  const [loading, setLoading] = useState(false);

  const [submittedId, setSubmittedId] = useState<string | null>(store.submittedAssessmentId);
  const [submittedTitle, setSubmittedTitle] = useState<string>(assessmentTitle);
  const [submissionNumber, setSubmissionNumber] = useState<number>(1);
  const [submittedAssessments, setSubmittedAssessments] = useState<any[]>([]);

  useEffect(() => {
    async function checkSubmissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { fetchDBAssessments } = await import("../lib/supabase-db");
          const dbAssessments = await fetchDBAssessments(user.id, focusDomain, userProficiency);
          
          const submitted = dbAssessments.filter((a) => a.status === "submitted");
          setSubmittedAssessments(submitted);

          // Compute the submission number based on the order of assessments sorted by ID
          const sorted = [...submitted].sort((a, b) => a.id.localeCompare(b.id));

          if (store.submittedAssessmentId) {
            setSubmittedId(store.submittedAssessmentId);
            const currentAsset = dbAssessments.find(a => a.id === store.submittedAssessmentId);
            if (currentAsset) {
              setSubmittedTitle(currentAsset.title);
            }
            const idx = sorted.findIndex(a => a.id === store.submittedAssessmentId);
            setSubmissionNumber(idx !== -1 ? idx + 1 : 1);
          } else {
            const firstSubmitted = submitted[0];
            if (firstSubmitted) {
              setSubmittedId(firstSubmitted.id);
              setSubmittedTitle(firstSubmitted.title);
              setSubmissionNumber(1);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check submissions from Supabase:", err);
      }
    }
    checkSubmissions();
  }, [store.submittedAssessmentId, focusDomain, userProficiency]);

  useEffect(() => {
    if (!submittedId) return;
    async function loadEvaluation() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dbEval = await fetchDBEvaluation(
            user.id,
            submittedId!,
            submittedTitle,
            focusDomain,
            userProficiency
          );
          setEvaluation(dbEval);
        }
      } catch (err) {
        console.warn("Failed to load evaluation from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvaluation();
  }, [submittedId, focusDomain, userProficiency, submittedTitle]);



  if (!submittedId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Header hideSurvey={true} />
        <View style={styles.emptyStateCard}>
          <LinearGradient
            colors={["rgba(99, 102, 241, 0.05)", "rgba(13, 148, 136, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyStateGradient}
          >
            <View style={styles.emptyIconCircle}>
              <Feather name="award" size={32} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>AI Gradebook Ready</Text>
            <Text style={styles.emptyDescription}>
              You haven't submitted any projects or coding challenges for evaluation yet! 
              Once you upload your first task under the <Text style={{fontWeight: "700", color: "#6366f1"}}>Assessments</Text> tab, 
              your dynamically calculated scores, verified mentor feedback, transparent rubrics, and response metrics will display right here.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    );
  }

  if (loading || !evaluation) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const rubric = evaluation.rubric;
  const dynamicAnswers = evaluation.answers;
  const dynamicSubjects = evaluation.subjects;
  const total = rubric.reduce((s, r) => s + r.score, 0);
  const max = rubric.reduce((s, r) => s + r.max, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Header hideSurvey={true} />

      {/* Selector Row */}
      {submittedAssessments.length > 1 && (
        <View style={styles.selectorCard}>
          <Text style={styles.selectorLabel}>Select Assessment Analytics:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
            {submittedAssessments.map((a, idx) => {
              const isSel = a.id === submittedId;
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => {
                    setSubmittedId(a.id);
                    setSubmittedTitle(a.title);
                    setSubmissionNumber(idx + 1);
                  }}
                  style={[styles.selectorPill, isSel && styles.activeSelectorPill]}
                >
                  <Text style={[styles.selectorPillText, isSel && styles.activeSelectorPillText]}>
                    {a.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Score Overview Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreMetaText}>Evaluated · Submission #{submissionNumber}</Text>
            <Text style={styles.scoreTitle}>{submittedTitle}</Text>
            <Text style={styles.scoreMentor}>Reviewed by AI · {evaluation.mentor}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <View style={styles.scoreIconWrapper}>
              <Feather name="award" size={18} color="#0d9488" />
            </View>
            <View style={styles.scoreTextWrapper}>
              <Text style={styles.scoreNumberText}>
                {total}<Text style={styles.scoreMaxText}>/{max}</Text>
              </Text>
              <Text style={styles.scoreLabelText}>Score</Text>
            </View>
          </View>
        </View>
        
        {/* AI generated feedback banner */}
        <View style={styles.feedbackBanner}>
          <MaterialCommunityIcons name="creation" size={16} color="#6366f1" style={styles.feedbackIcon} />
          <View style={styles.feedbackDetails}>
            <Text style={styles.feedbackTitle}>AI-generated feedback</Text>
            <Text style={styles.feedbackText}>
              {evaluation.ai_feedback}
            </Text>
          </View>
        </View>

        {/* Rubric list */}
        <Text style={styles.rubricTitle}>Transparent rubric breakdown</Text>
        <View style={styles.rubricList}>
          {rubric.map((r) => {
            const ratio = r.score / r.max;
            const barColors = ratio >= 0.8 ? ["#0d9488", "#2dd4bf"] : ["#6366f1", "#818cf8"];
            return (
              <View key={r.criterion} style={styles.rubricRow}>
                <View style={styles.rubricLabelRow}>
                  <Text style={styles.rubricLabel}>{r.criterion}</Text>
                  <Text style={styles.rubricScore}>{r.score}/{r.max}</Text>
                </View>
                <View style={styles.rubricBarTrack}>
                  <LinearGradient
                    colors={barColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.rubricBar, { width: `${ratio * 100}%` }]}
                  />
                </View>
                <Text style={styles.rubricNote}>{r.note}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Answer Sheet Card */}
      <View style={styles.rubricBreakdownCard}>
        <View style={styles.cardHeader}>
          <Feather name="file-text" size={16} color="#6366f1" />
          <Text style={styles.cardTitle}>Evaluated Answer Sheet</Text>
        </View>
        
        <View style={styles.answersList}>
          {dynamicAnswers.map((a, i) => {
            const isCorrect = a.verdict === "correct";
            const isPartial = a.verdict === "partial";
            const icon = isCorrect ? "check-circle" : isPartial ? "alert-circle" : "x-circle";
            const tintColor = isCorrect ? "#0d9488" : isPartial ? "#6366f1" : "#ef4444";
            const bgClass = isCorrect ? styles.bgMint : isPartial ? styles.bgPrimary : styles.bgDestructive;

            return (
              <View key={i} style={styles.answerItem}>
                <View style={styles.answerHeader}>
                  <View style={[styles.answerIconBox, bgClass]}>
                    <Feather name={icon} size={14} color={tintColor} />
                  </View>
                  <Text style={styles.answerQuestion}>{a.q}</Text>
                  <Text style={styles.answerMarks}>{a.marks}</Text>
                </View>
                <Text style={styles.answerText}>{a.student}</Text>
                {"feedback" in a && a.feedback && (
                  <View style={styles.answerFeedbackBox}>
                    <Text style={styles.feedbackLabel}>Feedback: </Text>
                    <Text style={styles.feedbackVal}>{a.feedback}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>


      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  scoreMeta: {
    flex: 1,
    paddingRight: 8,
  },
  scoreMetaText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  scoreMentor: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.15)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scoreIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  scoreTextWrapper: {
    justifyContent: "center",
  },
  scoreNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0d9488",
    lineHeight: 18,
  },
  scoreMaxText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  scoreLabelText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#0d9488",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 0,
  },
  feedbackBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.12)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  feedbackIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  feedbackDetails: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  feedbackText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 15,
    marginTop: 4,
  },
  rubricTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  rubricList: {
    gap: 12,
  },
  rubricRow: {
    gap: 4,
  },
  rubricLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rubricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  rubricScore: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  rubricBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  rubricBar: {
    height: "100%",
  },
  rubricNote: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  rubricBreakdownCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  answersList: {
    gap: 10,
  },
  answerItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  answerIconBox: {
    height: 28,
    width: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bgMint: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  bgDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  answerQuestion: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  answerMarks: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  answerText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 15,
  },
  answerFeedbackBox: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
    flexWrap: "wrap",
  },
  feedbackLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0f172a",
  },
  feedbackVal: {
    fontSize: 10,
    color: "#64748b",
  },
  subjectsList: {
    gap: 12,
  },
  subjectRow: {
    gap: 4,
  },
  subjectMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subjectName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  subjectRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  trendText: {
    fontSize: 10,
    fontWeight: "700",
  },
  trendUp: {
    color: "#0d9488",
  },
  trendDown: {
    color: "#ef4444",
  },
  subjectScore: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  subjectTrack: {
    height: 5,
    backgroundColor: "#f1f5f9",
    borderRadius: 2.5,
    overflow: "hidden",
  },
  subjectBar: {
    height: "100%",
  },
  heroPanel: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  heroIcon: {
    marginBottom: 8,
  },
  heroRankLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroRankValue: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
  },
  heroRankDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  grievanceDesc: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 12,
  },
  successAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  successAlertText: {
    fontSize: 12,
    color: "#0d9488",
    fontWeight: "600",
  },
  formContainer: {
    gap: 10,
  },
  formInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0f172a",
    textAlignVertical: "top",
    height: 72,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  spacer: {
    height: 40,
  },
  emptyStateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginTop: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateGradient: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 290,
  },
  selectorCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectorScroll: {
    flexDirection: "row",
    gap: 8,
  },
  selectorPill: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeSelectorPill: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderColor: "#6366f1",
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  activeSelectorPillText: {
    color: "#6366f1",
    fontWeight: "700",
  },
});
