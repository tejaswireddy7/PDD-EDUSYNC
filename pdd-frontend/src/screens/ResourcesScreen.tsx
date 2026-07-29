import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, ActivityIndicator, Linking } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { useDashboardStore } from "../lib/store";
import { fetchDBResources } from "../lib/supabase-db";

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
};

const SUBJECTS = ["All", "Frontend", "Backend", "Mobile", "AI", "General"];
const LEVELS = ["All levels", "Beginner", "Intermediate", "Advanced"];
const TYPES = ["All types", "Notes", "PDF", "Slides", "Project"] as const;
const SORTS = ["Trending", "Top rated", "Most downloaded"] as const;

export default function ResourcesScreen() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const openResourceUrl = (title: string) => {
    const query = encodeURIComponent(title);
    let url = `https://www.google.com/search?q=${query}`;
    
    const lower = title.toLowerCase();
    if (lower.includes("next.js") || lower.includes("nextjs")) {
      url = "https://nextjs.org/docs";
    } else if (lower.includes("react native") || lower.includes("expo")) {
      url = "https://reactnative.dev/docs/getting-started";
    } else if (lower.includes("docker")) {
      url = "https://docs.docker.com/get-started/";
    } else if (lower.includes("pandas") || lower.includes("numpy")) {
      url = "https://pandas.pydata.org/docs/user_guide/index.html";
    } else if (lower.includes("postgresql") || lower.includes("sql")) {
      url = "https://www.postgresql.org/docs/";
    } else if (lower.includes("pytorch")) {
      url = "https://pytorch.org/docs/stable/index.html";
    } else if (lower.includes("spring boot")) {
      url = "https://spring.io/projects/spring-boot";
    } else if (lower.includes("node.js") || lower.includes("express")) {
      url = "https://nodejs.org/en/docs/";
    }
    
    Linking.openURL(url).catch((err) => console.warn("Failed to open URL:", err));
  };

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      try {
        const dbRes = await fetchDBResources(focusDomain, userProficiency);
        setResources(dbRes as any);
      } catch (err) {
        console.warn("Failed to load resources from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, [focusDomain, userProficiency]);

  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All levels");
  const [type, setType] = useState<(typeof TYPES)[number]>("All types");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Trending");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let r = resources.filter((x) =>
      (subject === "All" || x.subject === subject) &&
      (level === "All levels" || x.level === level) &&
      (type === "All types" || x.type === type) &&
      (q.trim() === "" || [x.title, x.subject, x.author].some((f) => f.toLowerCase().includes(q.toLowerCase())))
    );
    if (sort === "Top rated") r = [...r].sort((a, b) => b.rating - a.rating);
    else if (sort === "Most downloaded") r = [...r].sort((a, b) => b.downloads - a.downloads);
    else if (sort === "Trending") r = [...r].sort((a, b) => Number(b.trending) - Number(a.trending) || b.downloads - a.downloads);
    return r;
  }, [resources, q, subject, level, type, sort]);

  const activeFiltersCount = (subject !== "All" ? 1 : 0) + (level !== "All levels" ? 1 : 0) + (type !== "All types" ? 1 : 0);

  const toggleBookmark = (id: string) => {
    setBookmarks((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Header />

      {/* Main Intro */}
      <View style={styles.introBox}>
        <Text style={styles.introTitle}>Collaborative Resource Hub</Text>
        <Text style={styles.introSub}>Notes, PDFs and mini-projects shared by peers and mentors.</Text>
      </View>

      {/* Search and Filters Toggle Card */}
      <View style={styles.filterCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={14} color="#64748b" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by topic, subject, or author…"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            {q !== "" && (
              <TouchableOpacity onPress={() => setQ("")}>
                <Feather name="x" size={14} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          >
            <Feather name="sliders" size={14} color={showFilters ? "#6366f1" : "#64748b"} />
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
            <FilterGroup label="Type" options={TYPES as any} value={type} onChange={setType as any} />
            <FilterGroup label="Sort by" options={SORTS as any} value={sort} onChange={setSort as any} />
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsCount}>{results.length} resources found</Text>
        <Text style={styles.statsSort}>Sorted by: <Text style={styles.statsBold}>{sort}</Text></Text>
      </View>

      {/* Resources items list */}
      <View style={styles.list}>
        {results.map((r) => {
          const isBookmarked = bookmarks.has(r.id);
          return (
            <TouchableOpacity 
              key={r.id} 
              style={styles.resourceCard}
              onPress={() => openResourceUrl(r.title)}
              activeOpacity={0.85}
            >
              <View style={styles.resourceCardTop}>
                <View style={styles.iconBox}>
                  <Feather name="file-text" size={16} color="#6366f1" />
                </View>
                <TouchableOpacity onPress={() => toggleBookmark(r.id)}>
                  <Feather 
                    name="bookmark" 
                    size={16} 
                    color={isBookmarked ? "#6366f1" : "#64748b"} 
                    style={isBookmarked && styles.fillIcon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.resourceBadges}>
                <View style={[styles.badge, styles.bgPrimary]}>
                  <Text style={[styles.badgeText, styles.textPrimary]}>{r.subject}</Text>
                </View>
                <View style={[styles.badge, styles.bgMuted]}>
                  <Text style={[styles.badgeText, styles.textGray]}>{r.level}</Text>
                </View>
                <View style={[styles.badge, styles.bgAccent]}>
                  <Text style={[styles.badgeText, styles.textAccent]}>{r.type}</Text>
                </View>
                {r.trending && (
                  <View style={[styles.badge, styles.bgMint]}>
                    <Feather name="trending-up" size={10} color="#0d9488" />
                    <Text style={[styles.badgeText, styles.textMint]}>Trending</Text>
                  </View>
                )}
              </View>

              <Text style={styles.resourceTitle} numberOfLines={2}>{r.title}</Text>

              <View style={styles.resourceFooter}>
                <Text style={styles.author} numberOfLines={1}>by {r.author}</Text>
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <FontAwesome name="star" size={10} color="#0d9488" />
                    <Text style={styles.statText}>{r.rating}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Feather name="download" size={10} color="#64748b" />
                    <Text style={styles.statText}>
                      {r.downloads >= 1000 ? `${(r.downloads / 1000).toFixed(1)}k` : r.downloads}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {results.length === 0 && (
          <View style={styles.emptyCard}>
            <Feather name="info" size={24} color="#94a3b8" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              No resources match your filters. Try clearing them.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

// Subcomponent for filter tags group
function FilterGroup({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroupChips}>
        {options.map((o) => {
          const isActive = value === o;
          return (
            <TouchableOpacity
              key={o}
              onPress={() => onChange(o)}
              style={[styles.chipButton, isActive ? styles.chipButtonActive : styles.chipButtonInactive]}
            >
              <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                {o}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
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
  introBox: {
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  introSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    fontSize: 12,
    color: "#0f172a",
    flex: 1,
    padding: 0,
  },
  filterToggle: {
    height: 38,
    width: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterToggleActive: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  badgeCount: {
    position: "absolute",
    top: -4,
    right: -4,
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCountText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
  },
  drawer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  filterGroup: {
    gap: 6,
  },
  filterGroupLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterGroupChips: {
    gap: 6,
  },
  chipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  chipButtonInactive: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  chipText: {
    fontSize: 11,
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
    // React Native styles SVG check
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
    backgroundColor: "#fef3c7", // Beige/Amber type
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
    height: 36,
    marginBottom: 14,
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
});
