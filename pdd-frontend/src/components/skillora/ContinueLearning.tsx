import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigate } from "@tanstack/react-router";
import { useNavigation } from "@react-navigation/native";
import { useDashboardStore, themeColors } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { fetchDBCourses } from "../../lib/supabase-db";
import { BootstrapIcon } from "../ui/BootstrapIcon";

const COURSE_IMAGES: Record<string, string> = {
  Frontend:
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop",
  Backend: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop",
  Mobile: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&auto=format&fit=crop",
  AI: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop",
  "Web Basics":
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop",
  "JS Core":
    "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&auto=format&fit=crop",
  "React Framework":
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&auto=format&fit=crop",
  "Cross-Platform":
    "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&auto=format&fit=crop",
  "Python Dev":
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop",
  Databases: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&auto=format&fit=crop",
};

function getCourseImage(subject: string, title: string): string {
  if (COURSE_IMAGES[subject]) return COURSE_IMAGES[subject];
  if (title.toLowerCase().includes("react")) return COURSE_IMAGES["React Framework"];
  if (title.toLowerCase().includes("python") || title.toLowerCase().includes("numpy"))
    return COURSE_IMAGES["Python Dev"];
  if (
    title.toLowerCase().includes("db") ||
    title.toLowerCase().includes("sql") ||
    title.toLowerCase().includes("postgres")
  )
    return COURSE_IMAGES["Databases"];
  return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop";
}

export function ContinueLearning() {
  const store = useDashboardStore();
  const navigate = useNavigate();
  let nativeNavigation: any;
  try {
    nativeNavigation = useNavigation();
  } catch (e) {
    // Fail-safe
  }

  const allCourses = store.recommendations?.courses || [];
  const enrolled = store.enrolledCourses || [];
  const suggested = store.suggestedCourses || [];
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  React.useEffect(() => {
    if (store.surveyCompleted && enrolled.length === 0 && suggested.length === 0) {
      store.fetchRecommendations();
    }
  }, [store.surveyCompleted]);

  const [showAllCoursesModal, setShowAllCoursesModal] = React.useState(false);
  const [modalTab, setModalTab] = React.useState<"my" | "all">("my");

  const modalCourses = allCourses;
  const listToRender = modalTab === "my" ? enrolled : modalCourses;

  const handleOpenAllCourses = () => {
    setShowAllCoursesModal(true);
    setModalTab("my");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentColors.text }]}>Continue Learning</Text>
        <TouchableOpacity onPress={handleOpenAllCourses}>
          <Text style={[styles.viewAll, { color: currentColors.primary }]}>View all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContainer}
      >
        {enrolled.length === 0 ? (
          <View
            style={[
              styles.emptyEnrolledCard,
              { backgroundColor: currentColors.card, borderColor: currentColors.border },
            ]}
          >
            <BootstrapIcon
              name="book"
              size={24}
              color={currentColors.subtext}
              style={{ marginBottom: 6 }}
            />
            <Text style={[styles.emptyEnrolledTitle, { color: currentColors.text }]}>
              No Enrolled Courses
            </Text>
            <Text style={[styles.emptyEnrolledText, { color: currentColors.subtext }]}>
              Select a suggested course below and click Enroll to start learning!
            </Text>
          </View>
        ) : (
          enrolled.map((c) => (
            <TouchableOpacity
              key={c.title}
              style={[
                styles.card,
                { backgroundColor: currentColors.card, borderColor: currentColors.border },
              ]}
              activeOpacity={0.9}
              onPress={() => {
                if (Platform.OS === "web") {
                  navigate({ to: "/course-learn", search: { course: c.title } });
                } else if (nativeNavigation) {
                  nativeNavigation.navigate("CourseLearn", { course: c.title });
                }
              }}
            >
              <View style={styles.cardHeader}>
                <Image
                  source={{ uri: getCourseImage(c.subject, c.title) }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(15, 23, 42, 0.45)", "rgba(15, 23, 42, 0.1)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.badgeRow}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{c.subject}</Text>
                  </View>
                  {c.ai && (
                    <View style={styles.aiBadge}>
                      <BootstrapIcon name="sparkles" size={10} color="#6366f1" />
                      <Text style={styles.aiText}>AI Pick</Text>
                    </View>
                  )}
                </View>
                <View style={styles.playButton}>
                  <BootstrapIcon name="play" size={16} color="#6366f1" style={styles.playIcon} />
                </View>
              </View>
              <View style={[styles.cardBody, { backgroundColor: currentColors.card }]}>
                <View style={styles.metaRow}>
                  <BootstrapIcon name="clock" size={12} color={currentColors.subtext} />
                  <Text style={[styles.metaText, { color: currentColors.subtext }]}>{c.time}</Text>
                  <View style={[styles.dot, { backgroundColor: currentColors.border }]} />
                  <Text style={[styles.metaText, { color: currentColors.subtext }]}>
                    {c.difficulty}
                  </Text>
                </View>
                <Text style={[styles.courseTitle, { color: currentColors.text }]} numberOfLines={2}>
                  {c.title}
                </Text>
                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: currentColors.divider }]}>
                    <View style={[styles.progressBar, { width: `${c.progress}%` }]} />
                  </View>
                  <Text style={[styles.progressText, { color: currentColors.primary }]}>
                    {c.progress}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Suggested Courses Section */}
      {suggested.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentColors.text }]}>Suggested Courses</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContainer}
          >
            {suggested.map((c) => (
              <View
                key={c.title}
                style={[
                  styles.card,
                  { backgroundColor: currentColors.card, borderColor: currentColors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Image
                    source={{ uri: getCourseImage(c.subject, c.title) }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["rgba(15, 23, 42, 0.45)", "rgba(15, 23, 42, 0.1)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.badgeRow}>
                    <View style={styles.subjectBadge}>
                      <Text style={styles.subjectText}>{c.subject}</Text>
                    </View>
                    {c.ai && (
                      <View style={styles.aiBadge}>
                        <BootstrapIcon name="sparkles" size={10} color="#6366f1" />
                        <Text style={styles.aiText}>AI Pick</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={[styles.cardBody, { backgroundColor: currentColors.card }]}>
                  <View style={styles.metaRow}>
                    <BootstrapIcon name="clock" size={12} color={currentColors.subtext} />
                    <Text style={[styles.metaText, { color: currentColors.subtext }]}>
                      {c.time}
                    </Text>
                    <View style={[styles.dot, { backgroundColor: currentColors.border }]} />
                    <Text style={[styles.metaText, { color: currentColors.subtext }]}>
                      {c.difficulty}
                    </Text>
                  </View>
                  <Text
                    style={[styles.courseTitle, { color: currentColors.text }]}
                    numberOfLines={2}
                  >
                    {c.title}
                  </Text>

                  <TouchableOpacity
                    style={styles.enrollBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      const idOrTitle = c.id || c.title;
                      if (idOrTitle) {
                        store.enrollInCourse(idOrTitle);
                        Alert.alert(
                          "Enrolled Successfully!",
                          `You have enrolled in "${c.title}". It is now in your Continue Learning panel.`,
                        );
                      }
                    }}
                  >
                    <BootstrapIcon
                      name="plus-circle"
                      size={14}
                      color="#ffffff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.enrollBtnText}>Enroll Course</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* View All Courses Modal */}
      <Modal
        visible={showAllCoursesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllCoursesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: currentColors.divider }]}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>
                {store.surveyAnswers?.focusDomain || "Mobile"} Pathway Courses
              </Text>
              <TouchableOpacity
                onPress={() => setShowAllCoursesModal(false)}
                style={styles.closeButton}
              >
                <BootstrapIcon name="x" size={20} color={currentColors.subtext} />
              </TouchableOpacity>
            </View>

            {/* Modal Tabs Toggles */}
            <View style={[styles.modalTabs, { borderBottomColor: currentColors.divider }]}>
              <TouchableOpacity
                style={[styles.modalTabBtn, modalTab === "my" && styles.modalTabBtnActive]}
                onPress={() => setModalTab("my")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalTabBtnText,
                    { color: modalTab === "my" ? "#6366f1" : currentColors.subtext },
                  ]}
                >
                  My Courses ({enrolled.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTabBtn, modalTab === "all" && styles.modalTabBtnActive]}
                onPress={() => setModalTab("all")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalTabBtnText,
                    { color: modalTab === "all" ? "#6366f1" : currentColors.subtext },
                  ]}
                >
                  Explore All ({modalCourses.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {listToRender.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <BootstrapIcon
                    name="book"
                    size={40}
                    color={currentColors.subtext}
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={[styles.modalEmptyText, { color: currentColors.text }]}>
                    No active courses yet
                  </Text>
                  <Text style={[styles.modalEmptySubText, { color: currentColors.subtext }]}>
                    You haven't started any lessons. Switch to "Explore All" to begin your pathway!
                  </Text>
                </View>
              ) : (
                listToRender.map((c) => (
                  <TouchableOpacity
                    key={c.title}
                    style={[
                      styles.modalCard,
                      {
                        backgroundColor: currentColors.background,
                        borderColor: currentColors.border,
                      },
                    ]}
                    onPress={() => {
                      if (!enrolled.some((ec) => ec.title === c.title)) {
                        Alert.alert(
                          "Enroll Required",
                          "Please click the 'Enroll' button to add this course to your learning pathway first.",
                        );
                        return;
                      }
                      setShowAllCoursesModal(false);
                      if (Platform.OS === "web") {
                        navigate({ to: "/course-learn", search: { course: c.title } });
                      } else if (nativeNavigation) {
                        nativeNavigation.navigate("CourseLearn", { course: c.title });
                      }
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={styles.modalCardGradient}>
                      <Image
                        source={{ uri: getCourseImage(c.subject, c.title) }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["rgba(15, 23, 42, 0.5)", "rgba(15, 23, 42, 0.1)"]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.modalCardLeft}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{c.difficulty || "Beginner"}</Text>
                        </View>
                        <Text style={[styles.modalCardTitle, { color: "#ffffff" }]}>{c.title}</Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            marginTop: 4,
                          }}
                        >
                          <Text style={styles.modalCardDuration}>
                            <BootstrapIcon name="clock" size={12} color="#ffffffaa" />{" "}
                            {c.time || "10 hrs"}
                          </Text>
                          {c.progress > 0 && (
                            <Text
                              style={[
                                styles.modalCardDuration,
                                { fontWeight: "700", color: "#2dd4bf" },
                              ]}
                            >
                              Progress: {c.progress}%
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.modalCardRight}>
                        {enrolled.some((ec) => ec.title === c.title) ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <TouchableOpacity
                              style={[
                                styles.modalEnrollBtn,
                                { backgroundColor: "#ef4444", minWidth: 60 },
                              ]}
                              activeOpacity={0.8}
                              onPress={(e) => {
                                e.stopPropagation();
                                const idOrTitle = c.id || c.title;
                                if (idOrTitle) {
                                  (store as any).unenrollFromCourse(idOrTitle);
                                  Alert.alert(
                                    "Unenrolled",
                                    `You have unenrolled from "${c.title}".`,
                                  );
                                }
                              }}
                            >
                              <Text style={styles.modalEnrollText}>Drop</Text>
                            </TouchableOpacity>
                            <BootstrapIcon name="play" size={32} color="#ffffff" />
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.modalEnrollBtn}
                            activeOpacity={0.8}
                            onPress={(e) => {
                              e.stopPropagation();
                              const idOrTitle = c.id || c.title;
                              if (idOrTitle) {
                                store.enrollInCourse(idOrTitle);
                                Alert.alert(
                                  "Enrolled Successfully!",
                                  `You have enrolled in "${c.title}". It is now in your Continue Learning panel.`,
                                );
                              }
                            }}
                          >
                            <Text style={styles.modalEnrollText}>Enroll</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;
const cardWidth = screenWidth * 0.72; // Premium sliding cards

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  viewAll: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
  },
  scrollContainer: {
    gap: 12,
    paddingHorizontal: 4,
  },
  card: {
    width: cardWidth,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    height: 100,
    padding: 12,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  subjectText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aiBadge: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  aiText: {
    color: "#6366f1",
    fontSize: 9,
    fontWeight: "700",
  },
  playButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  playIcon: {
    marginLeft: 2,
  },
  cardBody: {
    padding: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: 4,
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: "#94a3b8",
    marginHorizontal: 6,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 18,
    height: 36,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  videoModal: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      },
    }),
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 12,
  },
  watchOnYTBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  watchOnYTText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  materialsSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  materialsSection: {
    marginTop: 8,
    marginBottom: 18,
  },
  materialsHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
  },
  materialsList: {
    gap: 8,
  },
  materialItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  materialLabel: {
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 14,
    alignItems: "stretch",
  },
  quizBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 14,
  },
  quizBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionsContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 14,
  },
  sectionsHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  sectionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  sectionPlayPart: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  sectionPlayIconCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionItemTitle: {
    fontSize: 12,
    color: "#f1f5f9",
    fontWeight: "600",
  },
  sectionItemDuration: {
    fontSize: 10,
    color: "#38bdf8",
    marginTop: 1,
    fontWeight: "500",
  },
  sectionQuizBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sectionQuizBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  peerSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  peerHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14b8a6",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyUploadsCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderStyle: "dashed",
  },
  emptyUploadsText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
  materialItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  peerIconBox: {
    height: 28,
    width: 28,
    borderRadius: 8,
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deletePeerBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  // Viewer styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 10000,
  },
  viewerModal: {
    width: "95%",
    maxWidth: 620,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 12,
    marginBottom: 14,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  viewerSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  viewerCloseBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBody: {
    maxHeight: 480,
  },
  notesTextContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  notesTextContent: {
    fontSize: 13,
    color: "#f1f5f9",
    lineHeight: 20,
  },
  pdfFallback: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {
    padding: 4,
  },
  modalLoading: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  modalList: {
    paddingVertical: 4,
  },
  modalCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalCardGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  modalCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginVertical: 6,
  },
  modalCardDuration: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  modalCardRight: {
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  modalTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTabBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalTabBtnText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  modalTabBtnTextActive: {
    color: "#6366f1",
  },
  modalEmptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  modalEmptySubText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 16,
  },
  enrollBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  enrollBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyEnrolledCard: {
    width: cardWidth,
    height: 190,
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyEnrolledTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  emptyEnrolledText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 15,
  },
  modalEnrollBtn: {
    backgroundColor: "#2dd4bf",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalEnrollText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
