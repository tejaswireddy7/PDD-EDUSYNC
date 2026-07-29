import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Circle, Text as SvgText } from "react-native-svg";
import { useDashboardStore } from "../../lib/store";

export function PerformanceChart() {
  const store = useDashboardStore();
  const userProficiency = store.surveyAnswers?.proficiency || "Beginner";

  const [data, setData] = React.useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  React.useEffect(() => {
    async function loadTrends() {
      try {
        const { fetchDBPerformanceTrends } = await import("../../lib/supabase-db");
        const { supabase } = await import("../../lib/supabase");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dbData = await fetchDBPerformanceTrends(user.id, userProficiency);
          setData(dbData);
        }
      } catch (err) {
        console.warn("Failed to load performance trends from Supabase:", err);
      }
    }
    loadTrends();
  }, [userProficiency]);

  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const avgScore = data.length > 0 ? Math.round(data.reduce((s, v) => s + v, 0) / data.length) : (userProficiency === "Beginner" ? 61 : userProficiency === "Intermediate" ? 74 : 88);

  const [activeTab, setActiveTab] = useState("Month");
  const max = 100;

  // Chart dimensions matching standard screen widths safely
  const screenWidth = Dimensions.get("window").width;
  const w = Math.max(screenWidth - 48, 380); // Responsive SVG canvas
  const h = 200;
  const pad = 20;

  const stepX = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => [
    pad + i * stepX,
    h - pad - 20 - (v / max) * (h - pad * 2 - 20)
  ] as const);

  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${points[points.length - 1][0]},${h - pad - 10} L${points[0][0]},${h - pad - 10} Z`;

  return (
    <View style={styles.chartCard}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Performance Trends</Text>
          <Text style={styles.subTitle}>Subject-wise score evolution</Text>
        </View>
        <View style={styles.tabs}>
          {["Week", "Month", "Year"].map((t) => {
            const isActive = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.average}>
        {avgScore}<Text style={styles.averageSub}>/100 avg</Text>
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.svgWrapper}>
        <Svg width={w} height={h}>
          <Defs>
            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => {
            const y = pad + i * ((h - pad * 2 - 20) / 3);
            return (
              <Line
                key={i}
                x1={pad}
                y1={y}
                x2={w - pad}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Shaded Area */}
          <Path d={area} fill="url(#areaGrad)" />

          {/* Main Line */}
          <Path
            d={path}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Circles */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={i === points.length - 1 ? 5 : 3.5}
              fill="#ffffff"
              stroke="#6366f1"
              strokeWidth="2.5"
            />
          ))}

          {/* X Axis Labels */}
          {labels.map((l, i) => (
            <SvgText
              key={l}
              x={pad + i * stepX}
              y={h - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
              fontWeight="600"
            >
              {l}
            </SvgText>
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  subTitle: {
    fontSize: 11,
    color: "#64748b",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 3,
  },
  tabButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
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
  average: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
  },
  averageSub: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748b",
  },
  svgWrapper: {
    paddingVertical: 10,
  },
});
