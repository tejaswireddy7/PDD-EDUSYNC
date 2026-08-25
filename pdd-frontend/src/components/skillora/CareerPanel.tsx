import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../../lib/store";

export function CareerPanel() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";

  const domainCareerMap: Record<
    string,
    Array<{ role: string; match: number; skills: string[] }>
  > = {
    Frontend: [
      {
        role: "UI/UX Front-end Architect",
        match: 95,
        skills: ["React", "HTML5/CSS3", "Design Systems"],
      },
      { role: "Web Application Lead", match: 88, skills: ["TypeScript", "Next.js", "Redux"] },
      {
        role: "Product Developer",
        match: 82,
        skills: ["Core JS", "Tailwind", "Responsive Design"],
      },
    ],
    Backend: [
      { role: "Senior Backend Engineer", match: 94, skills: ["Node.js", "Express", "SQL & APIs"] },
      { role: "System & DB Architect", match: 88, skills: ["Prisma", "PostgreSQL", "Caching"] },
      {
        role: "Cloud Operations Specialist",
        match: 81,
        skills: ["Docker", "Deploy", "System Design"],
      },
    ],
    Mobile: [
      {
        role: "iOS & Android App Dev",
        match: 94,
        skills: ["React Native", "Expo Ecosystem", "Flexbox"],
      },
      {
        role: "Cross-Platform Architect",
        match: 87,
        skills: ["Hardware APIs", "Kotlin/Swift", "Navigation"],
      },
      {
        role: "Mobile Interface Designer",
        match: 80,
        skills: ["App Store Deploy", "UI Frameworks", "Bridges"],
      },
    ],
    AI: [
      {
        role: "Machine Learning Engineer",
        match: 96,
        skills: ["Python Dev", "Math Models", "PyTorch"],
      },
      {
        role: "Data Science Researcher",
        match: 88,
        skills: ["Pandas/Numpy", "Stats & Math", "Data Prep"],
      },
      {
        role: "NLP & LLM Specialist",
        match: 81,
        skills: ["Attention Models", "Transformers", "Data Wrangling"],
      },
    ],
  };

  const initialCareers = domainCareerMap[focusDomain] || domainCareerMap.Mobile;
  const [careers, setCareers] =
    React.useState<Array<{ role: string; match: number; skills: string[] }>>(initialCareers);

  React.useEffect(() => {
    async function loadCareers() {
      try {
        const { fetchDBCareerSuggestions } = await import("../../lib/supabase-db");
        const dbCareers = await fetchDBCareerSuggestions(focusDomain);

        const seen = new Set<string>();
        const uniqueCareers = dbCareers.filter((item) => {
          const normalized = item.role.trim().toLowerCase();
          if (seen.has(normalized)) return false;
          seen.add(normalized);
          return true;
        });

        setCareers(uniqueCareers);
      } catch (err) {
        console.warn("Failed to load career suggestions from Supabase:", err);
      }
    }
    loadCareers();
  }, [focusDomain]);

  return (
    <LinearGradient
      colors={["#0f172a", "#1e1b4b"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.panel}
    >
      <View style={styles.header}>
        <Feather name="compass" size={14} color="rgba(255,255,255,0.8)" />
        <Text style={styles.subText}>AI Career Suggestions</Text>
      </View>
      <Text style={styles.title}>Your top career match</Text>
      <Text style={styles.desc}>Based on 248 skill signals and 12-week trends.</Text>

      <View style={styles.list}>
        {careers.map((c, i) => {
          const isTop = i === 0;
          return (
            <TouchableOpacity
              key={c.role}
              onPress={() =>
                Linking.openURL(
                  "https://www.google.com/search?q=" + encodeURIComponent(c.role + " jobs"),
                ).catch((err) => console.warn(err))
              }
              activeOpacity={0.85}
              style={[styles.item, isTop ? styles.topItem : styles.otherItem]}
            >
              <View
                style={[styles.matchBadge, isTop ? styles.topMatchBadge : styles.otherMatchBadge]}
              >
                <Text
                  style={[styles.matchText, isTop ? styles.topMatchText : styles.otherMatchText]}
                >
                  {c.match}%
                </Text>
              </View>

              <View style={styles.details}>
                <View style={styles.roleRow}>
                  <Text style={[styles.roleName, isTop ? styles.textDark : styles.textLight]}>
                    {c.role}
                  </Text>
                  {isTop && (
                    <MaterialCommunityIcons
                      name={"sparkles" as any}
                      size={12}
                      color="#0d9488"
                      style={styles.sparkles}
                    />
                  )}
                </View>
                <Text style={[styles.skills, isTop ? styles.skillsDark : styles.skillsLight]}>
                  {c.skills.join("  •  ")}
                </Text>
              </View>

              <Feather
                name="arrow-up-right"
                size={16}
                color={isTop ? "#6366f1" : "rgba(255,255,255,0.7)"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const roadmapUrls: Record<string, string> = {
            Frontend: "https://roadmap.sh/frontend",
            Backend: "https://roadmap.sh/backend",
            Mobile: "https://roadmap.sh/react-native",
            AI: "https://roadmap.sh/ai-data-scientist",
          };
          const url = roadmapUrls[focusDomain] || "https://roadmap.sh";
          Linking.openURL(url).catch((err) => console.warn("Failed to open URL:", err));
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>View full career roadmap</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  subText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  desc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 16,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  item: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topItem: {
    backgroundColor: "#ffffff",
  },
  otherItem: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  matchBadge: {
    height: 38,
    width: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  topMatchBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  otherMatchBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  matchText: {
    fontSize: 12,
    fontWeight: "800",
  },
  topMatchText: {
    color: "#6366f1",
  },
  otherMatchText: {
    color: "#ffffff",
  },
  details: {
    flex: 1,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleName: {
    fontSize: 13,
    fontWeight: "700",
  },
  sparkles: {
    marginLeft: 4,
  },
  textDark: {
    color: "#0f172a",
  },
  textLight: {
    color: "#ffffff",
  },
  skills: {
    fontSize: 10,
    marginTop: 2,
  },
  skillsDark: {
    color: "#64748b",
  },
  skillsLight: {
    color: "rgba(255,255,255,0.6)",
  },
  button: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
