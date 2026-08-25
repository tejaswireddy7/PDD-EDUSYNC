import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
  Modal,
  Pressable,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { useDashboardStore, themeColors } from "../lib/store";
import { fetchDBResources } from "../lib/supabase-db";
import { supabase } from "../lib/supabase";
import { WebView } from "react-native-webview";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

type Resource = {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: "Notes" | "PDF" | "Slides" | "Project";
  rating: number;
  downloads: number;
  trending: boolean;
  author: string;
  userId?: string;
};

function getResourceIcon(type: string): string {
  switch (type) {
    case "Notes":
      return "file-earmark-text";
    case "PDF":
      return "file-earmark-pdf";
    case "Slides":
      return "file-earmark-slides";
    case "Project":
      return "folder";
    default:
      return "file-earmark";
  }
}

function BootstrapIcon({
  name,
  size,
  color,
  style,
}: {
  name: string;
  size: number;
  color: string;
  style?: any;
}) {
  if (Platform.OS === "web") {
    const className = name.startsWith("bi-") ? name : `bi-${name}`;
    return (
      <i
        className={`bi ${className}`}
        style={{ fontSize: size, color: color, display: "inline-block", lineHeight: 1, ...style }}
      />
    );
  }

  let nativeName: any = "help-circle";
  let iconLibrary: "Feather" | "MaterialCommunityIcons" = "Feather";

  if (name.includes("plus")) {
    nativeName = "plus";
  } else if (name.includes("search")) {
    nativeName = "search";
  } else if (name.includes("x") || name.includes("close")) {
    nativeName = "x";
  } else if (name.includes("chevron-up")) {
    nativeName = "chevron-up";
  } else if (name.includes("chevron-down")) {
    nativeName = "chevron-down";
  } else if (name.includes("arrow-left")) {
    nativeName = "arrow-left";
  } else if (name.includes("arrow-right")) {
    nativeName = "arrow-right";
  } else if (name.includes("check")) {
    nativeName = "check";
  } else if (name.includes("star")) {
    nativeName = "star";
  } else if (name.includes("layers")) {
    nativeName = "layers";
  } else if (
    name.includes("journal-code") ||
    name.includes("notebook") ||
    name.includes("journal") ||
    name.includes("file-earmark-text") ||
    name.includes("file-earmark-pdf")
  ) {
    nativeName = "book-open";
  } else if (name.includes("clock")) {
    nativeName = "clock";
  } else if (name.includes("bullseye")) {
    nativeName = "target";
  } else if (name.includes("speedometer")) {
    nativeName = "gauge";
    iconLibrary = "MaterialCommunityIcons";
  } else if (name.includes("fire")) {
    nativeName = "fire";
    iconLibrary = "MaterialCommunityIcons";
  } else if (name.includes("graph") || name.includes("trending")) {
    nativeName = "trending-up";
  } else if (name.includes("award") || name.includes("trophy")) {
    nativeName = "award";
  } else if (name.includes("gear") || name.includes("settings")) {
    nativeName = "settings";
  } else if (name.includes("logout") || name.includes("box-arrow-right")) {
    nativeName = "log-out";
  } else if (name.includes("person-x") || name.includes("user-x")) {
    nativeName = "user-x";
  } else if (name.includes("checklist") || name.includes("list")) {
    nativeName = "list";
  } else if (name.includes("trash")) {
    nativeName = "trash-2";
  } else if (name.includes("paperclip")) {
    nativeName = "paperclip";
  } else if (name.includes("download")) {
    nativeName = "download";
  } else if (name.includes("sliders") || name.includes("filter")) {
    nativeName = "sliders";
  } else if (name.includes("folder") || name.includes("project")) {
    nativeName = "folder";
  } else if (name.includes("image")) {
    nativeName = "image";
  }

  if (iconLibrary === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={nativeName} size={size} color={color} style={style} />;
  }
  return <Feather name={nativeName} size={size} color={color} style={style} />;
}

const SUBJECTS = ["All", "Frontend", "Backend", "Mobile", "AI", "General"];
const LEVELS = ["All levels", "Beginner", "Intermediate", "Advanced"];
const TYPES = ["All types", "Notes", "PDF", "Slides", "Project"] as const;
const SORTS = ["Trending", "Top rated", "Most downloaded"] as const;

const RESOURCE_VIDEOS: Record<string, string> = {
  "HTML5, CSS3, & Modern Grid": "https://www.youtube.com/embed/Dp3c7G1Qhgo",
  "JavaScript Fundamentals & DOM": "https://www.youtube.com/embed/hdI2bqOjy3c",
  "Intro to React & Component States": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "Intro to Node.js & REST API": "https://www.youtube.com/embed/Oe421EPjeBE",
  "SQL Fundamentals & Relational DBs": "https://www.youtube.com/embed/HXTt1AjbTtc",
  "React Native & Expo Ecosystem": "https://www.youtube.com/embed/gvkqT_qiVxM",
  "Python Fundamentals & Packages": "https://www.youtube.com/embed/_uQrJ0TkZlc",
  "Neural Networks with PyTorch": "https://www.youtube.com/embed/V_xro1bcAuA",
  "React Router & Global Context": "https://www.youtube.com/embed/59IXY5IDYbA",
  "Tailwind CSS & Responsive Layouts": "https://www.youtube.com/embed/m7OWXtbiXX8",
  "TypeScript Essentials for Web": "https://www.youtube.com/embed/zQnOB4tV3MC",
  "Java Spring Boot Microservices": "https://www.youtube.com/embed/35EQXmHKZYs",
  "PostgreSQL Queries & Optimization": "https://www.youtube.com/embed/7VfZYMXZmeI",
  "SwiftUI Mastery for iOS Platforms": "https://www.youtube.com/embed/F2CznepmCg4",
  "Kotlin & Android Jetpack UI": "https://www.youtube.com/embed/Ch5QqJmOzCQ",
  "Pandas & Numpy Data Wrangling": "https://www.youtube.com/embed/F6kmIpWWEdU",
  "Basics of Routing & HTTP Methods": "https://www.youtube.com/embed/yQleTeoUskc",
  "Interactive CSS Flexbox Playground": "https://www.youtube.com/embed/Dp3c7G1Qhgo",
  "Next.js Core Web Vitals Optimization Guides": "https://www.youtube.com/embed/59IXY5IDYbA",
  "Tailwind UI Layout Best Practices": "https://www.youtube.com/embed/m7OWXtbiXX8",
  "System Design Interview Cheat Sheet": "https://www.youtube.com/embed/gvkqT_qiVxM",
  "PostgreSQL Window Functions Explained": "https://www.youtube.com/embed/7VfZYMXZmeI",
  "Docker Containerization Fundamentals": "https://www.youtube.com/embed/Oe421EPjeBE",
  "React Native Performance Debugging Tools": "https://www.youtube.com/embed/gvkqT_qiVxM",
  "Expo Router Dynamic Linking Manual": "https://www.youtube.com/embed/Ke90Tje7VS0",
  "iOS Native UI Optimization Principles": "https://www.youtube.com/embed/F2CznepmCg4",
  "Python OOP and Memory Structures": "https://www.youtube.com/embed/_uQrJ0TkZlc",
  "Calculus behind SGD Backpropagation": "https://www.youtube.com/embed/V_xro1bcAuA",
  "Hugging Face LLM Pipeline Integration Guides": "https://www.youtube.com/embed/_uQrJ0TkZlc",
};

const getResourceVideo = (title: string): string => {
  const matched = RESOURCE_VIDEOS[title];
  if (matched) return matched;
  const lower = title.toLowerCase();
  if (lower.includes("next.js") || lower.includes("nextjs") || lower.includes("ssr"))
    return "https://www.youtube.com/embed/Dp3c7G1Qhgo";
  if (lower.includes("react native") || lower.includes("expo") || lower.includes("mobile"))
    return "https://www.youtube.com/embed/gvkqT_qiVxM";
  if (
    lower.includes("react") ||
    lower.includes("frontend") ||
    lower.includes("html") ||
    lower.includes("css")
  )
    return "https://www.youtube.com/embed/Ke90Tje7VS0";
  if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("devops"))
    return "https://www.youtube.com/embed/Oe421EPjeBE";
  if (
    lower.includes("pandas") ||
    lower.includes("numpy") ||
    lower.includes("pytorch") ||
    lower.includes("ai") ||
    lower.includes("python")
  )
    return "https://www.youtube.com/embed/V_xro1bcAuA";
  if (lower.includes("sql") || lower.includes("database") || lower.includes("postgresql"))
    return "https://www.youtube.com/embed/HXTt1AjbTtc";
  return "https://www.youtube.com/embed/zjsYHGK6a4Q";
};

const ALL_COURSES = [
  "React Native & Expo Ecosystem",
  "HTML5, CSS3, & Modern Grid",
  "JavaScript Fundamentals & DOM",
  "Intro to React & Component States",
  "Python Fundamentals & Packages",
  "Neural Networks with PyTorch",
  "SQL Fundamentals & Relational DBs",
  "Intro to Node.js & REST API",
  "Pandas & Numpy Data Wrangling",
];

export default function ResourcesScreen() {
  const store = useDashboardStore();
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getActiveUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setActiveUserId(user.id);
      }
    }
    getActiveUser();
  }, []);

  // Video Player States
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");

  // Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Frontend");
  const [newLevel, setNewLevel] = useState("Beginner");
  const [newType, setNewType] = useState<"Notes" | "PDF" | "Slides" | "Project">("Notes");
  const [newFileName, setNewFileName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("React Native & Expo Ecosystem");

  const fileInputRef = useRef<any>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [viewingResource, setViewingResource] = useState<any | null>(null);

  const showNotice = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleDeleteResource = async (id: string) => {
    setResources((prev) => prev.filter((x) => x.id !== id));
    if (typeof window !== "undefined" && window.localStorage) {
      const local = window.localStorage.getItem("uploaded_resources");
      if (local) {
        const localItems = JSON.parse(local);
        const updated = localItems.filter((x: any) => x.id !== id);
        window.localStorage.setItem("uploaded_resources", JSON.stringify(updated));
      }
    }
    try {
      await supabase.from("resources").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete remote resource:", e);
    }
    showNotice("Success", "Your uploaded resource has been deleted successfully.");
  };

  const handleAttachClick = async () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          setNewFileName(file.name);
          const mime = file.mimeType || "application/octet-stream";
          setSelectedFileType(mime);

          if (mime.startsWith("text/")) {
            const content = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.UTF8,
            });
            setSelectedFileContent(content);
          } else {
            const base64 = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setSelectedFileContent(`data:${mime};base64,${base64}`);
          }
        }
      } catch (err) {
        console.warn("Document picker failed:", err);
      }
    }
  };

  const handleOpenResource = (r: any) => {
    store.cacheMaterial(r.title, "https://developer.mozilla.org/en-US/");
    if (store.lowDataMode) {
      showNotice(
        "Low-Data Cache Success",
        `"${r.title}" has been saved in local cache memory for offline revisiting without internet access.`,
      );
    }
    setViewingResource(r);
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      const dbRes = await fetchDBResources();
      const mapped = dbRes.map((x: any) => ({
        id: x.id,
        title: x.title,
        subject: x.subject,
        level: x.level,
        type: x.type,
        rating: x.rating || 5.0,
        downloads: x.downloads || 0,
        trending: x.trending || false,
        author: x.author || "Anonymous",
        fileName: x.file_name,
        fileType: x.file_type,
        fileContent: x.file_content,
        userId: x.user_id,
      }));
      setResources(mapped as any);
    } catch (err) {
      console.warn("Failed to load resources from Supabase:", err);
      let localItems: any[] = [];
      if (typeof window !== "undefined" && window.localStorage) {
        const local = window.localStorage.getItem("uploaded_resources");
        localItems = local ? JSON.parse(local) : [];
      }
      setResources(localItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All levels");
  const [type, setType] = useState<(typeof TYPES)[number]>("All types");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Trending");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let r = resources.filter(
      (x) =>
        (subject === "All" || x.subject === subject) &&
        (level === "All levels" || x.level === level) &&
        (type === "All types" || x.type === type) &&
        (q.trim() === "" ||
          [x.title, x.subject, x.author].some((f) => f.toLowerCase().includes(q.toLowerCase()))),
    );
    if (sort === "Top rated") r = [...r].sort((a, b) => b.rating - a.rating);
    else if (sort === "Most downloaded") r = [...r].sort((a, b) => b.downloads - a.downloads);
    else if (sort === "Trending")
      r = [...r].sort(
        (a, b) => Number(b.trending) - Number(a.trending) || b.downloads - a.downloads,
      );
    return r;
  }, [resources, q, subject, level, type, sort]);

  const activeFiltersCount =
    (subject !== "All" ? 1 : 0) + (level !== "All levels" ? 1 : 0) + (type !== "All types" ? 1 : 0);

  const toggleBookmark = (id: string) => {
    setBookmarks((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const handleUploadSubmit = async () => {
    if (!newTitle.trim()) {
      showNotice("Validation Error", "Please enter a resource title");
      return;
    }
    if (!newFileName) {
      showNotice("Validation Error", "Please attach a document before publishing.");
      return;
    }
    const uploadedResource: any = {
      id: `uploaded_${Date.now()}`,
      title: newTitle,
      subject: newSubject,
      level: newLevel,
      type: newType,
      rating: 5.0,
      downloads: 1,
      trending: true,
      author: store.user?.name || "Anonymous Learner",
      courseTitle: selectedCourse,
      fileName: newFileName,
      fileType: selectedFileType,
      fileContent: selectedFileContent,
      userId: activeUserId,
    };

    setResources((prev) => [uploadedResource, ...prev]);

    // Save to localStorage for instant offline access
    if (typeof window !== "undefined" && window.localStorage) {
      const local = window.localStorage.getItem("uploaded_resources");
      const localItems = local ? JSON.parse(local) : [];
      window.localStorage.setItem(
        "uploaded_resources",
        JSON.stringify([uploadedResource, ...localItems]),
      );
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const authorName = user?.user_metadata?.full_name || store.user?.name || "Anonymous Learner";

      const { error } = await supabase.from("resources").insert({
        id: uploadedResource.id,
        title: uploadedResource.title,
        subject: uploadedResource.subject,
        level: uploadedResource.level,
        type: uploadedResource.type,
        rating: uploadedResource.rating,
        downloads: uploadedResource.downloads,
        trending: uploadedResource.trending,
        author: authorName,
        focus_domain: uploadedResource.subject,
        course_title: uploadedResource.courseTitle,
        file_name: uploadedResource.fileName,
        file_type: uploadedResource.fileType,
        file_content: uploadedResource.fileContent,
        user_id: activeUserId,
      });
      if (error) {
        console.error("Database insert error:", error);
        showNotice("Database Error", `Failed to save resource to database: ${error.message}`);
      } else {
        showNotice("Success", "Resource has been successfully published to the database!");
        loadResources();
      }
    } catch (e: any) {
      console.warn("Failed to upload resource to Supabase:", e);
      showNotice("Upload Error", e.message || "Failed to upload resource.");
    }

    // Reset fields and close modal
    setNewTitle("");
    setNewSubject("Frontend");
    setNewLevel("Beginner");
    setNewType("Notes");
    setNewFileName("");
    setSelectedFileType(null);
    setSelectedFileContent(null);
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: currentColors.background,
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366f1"]} />
      }
    >
      <Header />

      {/* Main Intro */}
      <View style={styles.introBox}>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.introTitle, { color: currentColors.text }]}>
              Collaborative Resource Hub
            </Text>
            <Text style={[styles.introSub, { color: currentColors.subtext }]}>
              Notes, PDFs and mini-projects shared by peers and mentors.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setNewTitle("");
              setNewFileName("");
              setSelectedFileType(null);
              setSelectedFileContent(null);
              setShowUploadModal(true);
            }}
            style={styles.uploadBtn}
          >
            <BootstrapIcon name="plus-lg" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters Toggle Card */}
      <View
        style={[
          styles.filterCard,
          { backgroundColor: currentColors.card, borderColor: currentColors.border },
        ]}
      >
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? "#1f2937" : "#f1f5f9" }]}>
            <BootstrapIcon name="search" size={14} color={currentColors.subtext} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by topic, subject, or author…"
              placeholderTextColor={currentColors.subtext}
              style={[styles.searchInput, { color: currentColors.text }]}
            />
            {q !== "" && (
              <TouchableOpacity onPress={() => setQ("")}>
                <BootstrapIcon name="x-lg" size={14} color={currentColors.subtext} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={[
              styles.filterToggle,
              { backgroundColor: isDark ? "#1f2937" : "#f1f5f9" },
              showFilters && styles.filterToggleActive,
            ]}
          >
            <BootstrapIcon
              name="sliders"
              size={14}
              color={showFilters ? "#6366f1" : currentColors.subtext}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Expandable filters dropdown drawer */}
        {showFilters && (
          <View style={styles.drawer}>
            <FilterGroup label="Subject" options={SUBJECTS} value={subject} onChange={setSubject} />
            <FilterGroup label="Level" options={LEVELS} value={level} onChange={setLevel} />
            <FilterGroup
              label="Type"
              options={TYPES as any}
              value={type}
              onChange={setType as any}
            />
            <FilterGroup
              label="Sort by"
              options={SORTS as any}
              value={sort}
              onChange={setSort as any}
            />
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={[styles.statsCount, { color: currentColors.subtext }]}>
          {results.length} resources found
        </Text>
        <Text style={[styles.statsSort, { color: currentColors.subtext }]}>
          Sorted by: <Text style={[styles.statsBold, { color: currentColors.text }]}>{sort}</Text>
        </Text>
      </View>

      {/* Resources items list */}
      <View style={styles.list}>
        {results.map((r) => {
          const isBookmarked = bookmarks.has(r.id);
          return (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.resourceCard,
                { backgroundColor: currentColors.card, borderColor: currentColors.border },
              ]}
              onPress={() => handleOpenResource(r)}
              activeOpacity={0.85}
            >
              <View style={styles.resourceCardTop}>
                <View style={styles.iconBox}>
                  <BootstrapIcon name={getResourceIcon(r.type)} size={16} color="#6366f1" />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity onPress={() => toggleBookmark(r.id)}>
                    <BootstrapIcon
                      name={isBookmarked ? "bookmark-fill" : "bookmark"}
                      size={16}
                      color={isBookmarked ? "#6366f1" : currentColors.subtext}
                    />
                  </TouchableOpacity>
                  {r.userId === activeUserId && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteResource(r.id);
                      }}
                      style={styles.deleteResourceBtn}
                      activeOpacity={0.7}
                    >
                      <BootstrapIcon name="trash" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.resourceBadges}>
                <View style={[styles.badge, styles.bgPrimary]}>
                  <Text style={[styles.badgeText, styles.textPrimary]}>{r.subject}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    styles.bgMuted,
                    { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9" },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, styles.textGray, { color: currentColors.subtext }]}
                  >
                    {r.level}
                  </Text>
                </View>
                <View style={[styles.badge, styles.bgAccent]}>
                  <Text style={[styles.badgeText, styles.textAccent]}>{r.type}</Text>
                </View>
                {r.trending && (
                  <View style={[styles.badge, styles.bgMint]}>
                    <BootstrapIcon name="graph-up-arrow" size={10} color="#0d9488" />
                    <Text style={[styles.badgeText, styles.textMint]}>Trending</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.resourceTitle, { color: currentColors.text }]} numberOfLines={2}>
                {r.title}
              </Text>

              <View style={styles.resourceFooter}>
                <Text style={[styles.author, { color: currentColors.subtext }]} numberOfLines={1}>
                  by {r.author}
                </Text>
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <BootstrapIcon name="star-fill" size={10} color="#0d9488" />
                    <Text style={[styles.statText, { color: currentColors.subtext }]}>
                      {r.rating}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <BootstrapIcon name="download" size={10} color={currentColors.subtext} />
                    <Text style={[styles.statText, { color: currentColors.subtext }]}>
                      {r.downloads}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {results.length === 0 && (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: currentColors.card, borderColor: currentColors.border },
            ]}
          >
            <BootstrapIcon
              name="file-earmark-x"
              size={24}
              color={currentColors.subtext}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyText, { color: currentColors.subtext }]}>
              No matching study resources found for your filter criteria.
            </Text>
          </View>
        )}
      </View>

      {/* Resource Upload Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showUploadModal}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowUploadModal(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: currentColors.card, borderColor: currentColors.border },
            ]}
            onPress={(e: any) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>
                Upload Study Resource
              </Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <BootstrapIcon name="x-lg" size={18} color={currentColors.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: currentColors.subtext }]}>Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Next.js Routing Cheatsheet"
                placeholderTextColor={currentColors.subtext}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? "#1f2937" : "#f8fafc",
                    borderColor: currentColors.border,
                    color: currentColors.text,
                  },
                ]}
              />

              <Text style={[styles.inputLabel, { color: currentColors.subtext }]}>
                Associate with Course
              </Text>
              <View style={{ marginBottom: 12 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
                >
                  {ALL_COURSES.map((course) => {
                    const active = selectedCourse === course;
                    return (
                      <TouchableOpacity
                        key={course}
                        onPress={() => setSelectedCourse(course)}
                        style={[
                          styles.pickerChip,
                          active
                            ? styles.pickerChipActive
                            : {
                                backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                                borderColor: currentColors.border,
                              },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            active ? styles.pickerTextActive : { color: currentColors.subtext },
                            { fontSize: 10 },
                          ]}
                        >
                          {course}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={[styles.inputLabel, { color: currentColors.subtext }]}>
                Subject Focus
              </Text>
              <View style={styles.pickerRow}>
                {["Frontend", "Backend", "Mobile", "AI", "General"].map((sub) => {
                  const active = newSubject === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setNewSubject(sub)}
                      style={[
                        styles.pickerChip,
                        active
                          ? styles.pickerChipActive
                          : {
                              backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                              borderColor: currentColors.border,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          active ? styles.pickerTextActive : { color: currentColors.subtext },
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: currentColors.subtext }]}>
                Proficiency Level
              </Text>
              <View style={styles.pickerRow}>
                {["Beginner", "Intermediate", "Advanced"].map((lv) => {
                  const active = newLevel === lv;
                  return (
                    <TouchableOpacity
                      key={lv}
                      onPress={() => setNewLevel(lv)}
                      style={[
                        styles.pickerChip,
                        active
                          ? styles.pickerChipActive
                          : {
                              backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                              borderColor: currentColors.border,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          active ? styles.pickerTextActive : { color: currentColors.subtext },
                        ]}
                      >
                        {lv}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: currentColors.subtext }]}>
                Resource Type
              </Text>
              <View style={styles.pickerRow}>
                {["Notes", "PDF", "Slides", "Project"].map((tp) => {
                  const active = newType === tp;
                  return (
                    <TouchableOpacity
                      key={tp}
                      onPress={() => setNewType(tp as any)}
                      style={[
                        styles.pickerChip,
                        active
                          ? styles.pickerChipActive
                          : {
                              backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                              borderColor: currentColors.border,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          active ? styles.pickerTextActive : { color: currentColors.subtext },
                        ]}
                      >
                        {tp}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: currentColors.subtext }]}>
                Attach Document
              </Text>
              <TouchableOpacity
                style={[
                  styles.attachBox,
                  {
                    backgroundColor: isDark ? "#1f2937" : "#f8fafc",
                    borderColor: currentColors.border,
                  },
                ]}
                onPress={handleAttachClick}
              >
                <BootstrapIcon
                  name="paperclip"
                  size={16}
                  color={currentColors.subtext}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontSize: 12, color: currentColors.text }}>
                  {newFileName || "Choose image, PDF, or text notes file..."}
                </Text>
              </TouchableOpacity>

              {Platform.OS === "web" && (
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*,application/pdf,text/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewFileName(file.name);
                      setSelectedFileType(file.type);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSelectedFileContent(reader.result as string);
                      };
                      if (file.type.startsWith("text/")) {
                        reader.readAsText(file);
                      } else {
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: isDark ? "#1f2937" : "#f1f5f9" }]}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: currentColors.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.publishBtn} onPress={handleUploadSubmit}>
                <Text style={styles.publishBtnText}>Publish</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Video Overlay Player Modal */}
      {videoUrl && (
        <View style={styles.videoOverlay}>
          <View style={styles.videoModal}>
            <View style={styles.videoHeader}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {videoTitle}
              </Text>
              <TouchableOpacity onPress={() => setVideoUrl(null)} style={styles.closeBtn}>
                <BootstrapIcon name="x-lg" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoPlayerContainer}>
              {Platform.OS === "web" ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`${videoUrl}?autoplay=1`}
                  title={videoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ borderRadius: 16, border: "none" }}
                />
              ) : (
                <WebView
                  style={{ flex: 1, borderRadius: 16 }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
                            iframe { width: 100%; height: 100%; border: none; }
                          </style>
                        </head>
                        <body>
                          <iframe
                            src="${videoUrl}?autoplay=1&origin=https://google.com"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                            referrerpolicy="strict-origin-when-cross-origin"
                          ></iframe>
                        </body>
                      </html>
                    `,
                    baseUrl: "https://google.com",
                  }}
                />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Resource Viewer Modal */}
      <Modal
        visible={viewingResource !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingResource(null)}
      >
        <View style={styles.viewerOverlay}>
          <View style={[styles.viewerModal, { backgroundColor: currentColors.card }]}>
            <View style={styles.viewerHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.viewerTitle, { color: currentColors.text }]} numberOfLines={1}>
                  {viewingResource?.title}
                </Text>
                <Text style={[styles.viewerSubtitle, { color: currentColors.subtext }]}>
                  Uploaded by {viewingResource?.author} • {viewingResource?.type}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setViewingResource(null)}
                style={styles.viewerCloseBtn}
              >
                <BootstrapIcon name="x-lg" size={18} color={currentColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.viewerBody}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {viewingResource?.fileContent ? (
                <>
                  {viewingResource.fileType?.startsWith("image/") ? (
                    <Image
                      source={{ uri: viewingResource.fileContent }}
                      style={{
                        width: "100%",
                        height: 320,
                        borderRadius: 16,
                        backgroundColor: "#0f172a",
                      }}
                      resizeMode="contain"
                    />
                  ) : viewingResource.fileType?.includes("pdf") ? (
                    Platform.OS === "web" ? (
                      <iframe
                        src={viewingResource.fileContent}
                        style={{ width: "100%", height: 420, borderRadius: 16, border: "none" }}
                      />
                    ) : (
                      <View style={styles.pdfFallback}>
                        <BootstrapIcon name="file-earmark-pdf" size={48} color="#a5b4fc" />
                        <Text style={{ color: "#ffffff", marginTop: 12, textAlign: "center" }}>
                          PDF preview is only supported on Web.
                        </Text>
                      </View>
                    )
                  ) : (
                    // Plain text notes/files
                    <View
                      style={[
                        styles.notesTextContainer,
                        { backgroundColor: isDark ? "#1f2937" : "#0f172a" },
                      ]}
                    >
                      <Text
                        style={[styles.notesTextContent, { color: isDark ? "#f3f4f6" : "#cbd5e1" }]}
                      >
                        {viewingResource.fileContent}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                // Preseeded / fallback notes text content
                <View
                  style={[
                    styles.notesTextContainer,
                    { backgroundColor: isDark ? "#1f2937" : "#0f172a" },
                  ]}
                >
                  <Text
                    style={[styles.notesTextContent, { color: isDark ? "#f3f4f6" : "#cbd5e1" }]}
                  >
                    {viewingResource?.title} description and details:{"\n\n"}
                    This reference material has been prepared to help you study dynamic concepts
                    related to {viewingResource?.subject || focusDomain}.{"\n\n"}Revisit this guide
                    to prepare for checkpoints!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (x: any) => void;
}) {
  const store = useDashboardStore();
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: currentColors.subtext }]}>{label}:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupScroll}
      >
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
              style={[
                styles.chip,
                active
                  ? styles.chipActive
                  : [
                      styles.chipInactive,
                      {
                        backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                        borderColor: currentColors.border,
                      },
                    ],
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active
                    ? styles.chipTextActive
                    : [styles.chipTextInactive, { color: currentColors.subtext }],
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  introBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  introSub: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  uploadBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  uploadBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: "#0f172a",
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterToggleActive: {
    backgroundColor: "#e0e7ff",
  },
  badgeCount: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeCountText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  drawer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    gap: 12,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupLabel: {
    width: 60,
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  groupScroll: {
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: "#6366f1",
  },
  chipInactive: {
    backgroundColor: "#f1f5f9",
  },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  chipTextInactive: {
    color: "#64748b",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  statsCount: {
    fontSize: 11,
    color: "#64748b",
  },
  statsSort: {
    fontSize: 11,
    color: "#64748b",
  },
  statsBold: {
    fontWeight: "700",
    color: "#0f172a",
  },
  list: {
    gap: 12,
  },
  resourceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBox: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  fillIcon: {
    color: "#6366f1",
  },
  resourceBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  bgPrimary: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  bgMuted: {
    backgroundColor: "#f1f5f9",
  },
  bgAccent: {
    backgroundColor: "#fef3c7",
  },
  bgMint: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  textPrimary: {
    color: "#6366f1",
  },
  textGray: {
    color: "#64748b",
  },
  textAccent: {
    color: "#b45309",
  },
  textMint: {
    color: "#0d9488",
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 18,
    marginBottom: 10,
  },
  resourceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  author: {
    fontSize: 10,
    color: "#64748b",
    flex: 1,
    paddingRight: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statText: {
    fontSize: 10,
    color: "#64748b",
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  spacer: {
    height: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: "blur(8px)",
      },
    }),
  },
  modalCard: {
    width: "95%",
    maxWidth: 500,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#0f172a",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pickerChip: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pickerChipActive: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  pickerText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },
  pickerTextActive: {
    color: "#4f46e5",
    fontWeight: "700",
  },
  attachBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  publishBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#6366f1",
  },
  publishBtnText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700",
  },
  videoOverlay: {
    position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  videoModal: {
    width: "95%",
    maxWidth: 680,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    paddingRight: 12,
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
  },
  deleteResourceBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
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
    fontSize: 15,
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
    color: "#cbd5e1",
    lineHeight: 20,
  },
  pdfFallback: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
});
