import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { 
  fetchDBAllProfiles, 
  fetchDBAllRecommendations, 
  fetchDBPeerMessages, 
  sendDBPeerMessage,
  blockUser,
  unblockUser,
  fetchBlockedUsers
} from "../lib/supabase-db";

type PeerUser = {
  id: string;
  name: string;
  email: string;
  focusDomain: string;
  proficiency: string;
  streak: number;
  coursesCompleted: number;
  careerFitScore: number;
  xp: number;
  currentCourse: string;
  initials: string;
  colors: string[];
};

type PeerMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
};

// Profanity list for filtering offensive words
const OFFENSIVE_WORDS = ["badword1", "badword2", "offensive", "abuse", "hate", "fuck", "shit", "bitch", "asshole"];

function filterOffensiveWords(text: string): string {
  let cleaned = text;
  OFFENSIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, "***");
  });
  return cleaned;
}

export default function ChatScreen() {
  const store = useDashboardStore();
  const currentUserId = store.user ? store.user.email : "guest"; // fallback to mock identifier

  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"list" | "chat">("list");
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load registered users & matching recommendations
  useEffect(() => {
    async function loadMessengerData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let dbProfiles: any[] = [];
        let recs: any[] = [];
        let blocks: string[] = [];

        if (user) {
          try {
            dbProfiles = await fetchDBAllProfiles();
          } catch (e) {
            console.warn("fetchDBAllProfiles failed, using fallbacks:", e);
          }

          try {
            recs = await fetchDBAllRecommendations();
          } catch (e) {
            console.warn("fetchDBAllRecommendations failed, using fallbacks:", e);
          }

          try {
            blocks = await fetchBlockedUsers(user.id);
            setBlockedUserIds(blocks);
          } catch (e) {
            console.warn("fetchBlockedUsers failed, using fallbacks:", e);
          }
        }

        // If no profiles could be loaded from the database, fallback to seed data so the page renders instantly
        if (dbProfiles.length === 0) {
          dbProfiles = [
            { id: "peer1", name: "Priya Sharma", email: "priya@edusync.ai", focus_domain: "Mobile", proficiency: "Intermediate", streak: 5, courses_completed: 2, career_fit_score: 84, xp: 1200 },
            { id: "peer2", name: "Rohit Kumar", email: "rohit@edusync.ai", focus_domain: "Frontend", proficiency: "Beginner", streak: 3, courses_completed: 1, career_fit_score: 72, xp: 850 },
            { id: "peer3", name: "Anjali Singh", email: "anjali@edusync.ai", focus_domain: "Backend", proficiency: "Advanced", streak: 12, courses_completed: 4, career_fit_score: 91, xp: 2400 },
            { id: "peer4", name: "Karan Talwar", email: "karan@edusync.ai", focus_domain: "AI", proficiency: "Beginner", streak: 1, courses_completed: 0, career_fit_score: 60, xp: 300 }
          ];
        }

        // Map profiles to peers with their current active courses
        const colorsList = [
          ["#6366f1", "#818cf8"],
          ["#0ea5e9", "#38bdf8"],
          ["#0d9488", "#2dd4bf"],
          ["#f59e0b", "#fbbf24"],
          ["#a855f7", "#c084fc"]
        ];

        const mapped: PeerUser[] = dbProfiles.map((p, index) => {
          const userRec = recs.find(r => r.userId === p.id || r.user_id === p.id);
          let currentCourse = "Getting Started";
          if (userRec && userRec.courses) {
            const courseList = typeof userRec.courses === "string" ? JSON.parse(userRec.courses) : userRec.courses;
            if (Array.isArray(courseList) && courseList.length > 0) {
              const active = courseList.find((c: any) => c.progress > 0 && c.progress < 100) || courseList[0];
              if (active) {
                currentCourse = `${active.title} (${active.progress ?? 0}%)`;
              }
            }
          } else {
            // Dynamically assign realistic courses based on their track and name hash
            const hash = index + (p.name?.charCodeAt(0) || 7);
            const progress = 15 + (hash * 13) % 70; // dynamic progress
            const track = p.focus_domain || "Mobile";

            if (track === "Frontend") {
              const list = ["HTML5, CSS3, & Modern Grid", "JavaScript Fundamentals & DOM", "Intro to React & Component States"];
              currentCourse = `${list[hash % list.length]} (${progress}%)`;
            } else if (track === "Backend") {
              const list = ["Intro to Node.js & REST API", "SQL Fundamentals & Relational DBs", "PostgreSQL Queries & Optimization"];
              currentCourse = `${list[hash % list.length]} (${progress}%)`;
            } else if (track === "Mobile") {
              const list = ["React Native & Expo Ecosystem", "Flexbox Layouts in Mobile Screens", "Navigation Containers & Tabs"];
              currentCourse = `${list[hash % list.length]} (${progress}%)`;
            } else {
              const list = ["Python Fundamentals & Packages", "Pandas & Numpy Data Wrangling", "Neural Networks with PyTorch"];
              currentCourse = `${list[hash % list.length]} (${progress}%)`;
            }
          }

          let name = p.name || p.email?.split("@")[0] || "Peer Student";
          if (p.id === user.id) {
            name = `${name} (You)`;
          }
          const initials = name.replace(" (You)", "").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "PS";

          return {
            id: p.id,
            name,
            email: p.email,
            focusDomain: p.focus_domain || "Frontend",
            proficiency: p.proficiency || "Beginner",
            streak: p.streak || 0,
            coursesCompleted: p.courses_completed || 0,
            careerFitScore: p.career_fit_score || 0,
            xp: p.xp || 0,
            currentCourse,
            initials,
            colors: colorsList[index % colorsList.length]
          };
        });

        setPeers(mapped);
        if (mapped.length > 0) {
          setActivePeerId(mapped[0].id);
        }
      } catch (err) {
        console.warn("Failed to load messenger details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMessengerData();
  }, [currentUserId]);
  // Load Peer Messages & Background Polling
  useEffect(() => {
    if (!activePeerId) return;

    let active = true;

    async function loadMessages() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dbMsgs = await fetchDBPeerMessages(user.id, activePeerId!);
          if (!active) return;
          
          setMessages((prev) => {
            // Keep local mock messages if they are not yet in the DB
            const merged = [...dbMsgs];
            prev.forEach((localMsg) => {
              if (!merged.find(m => m.id === localMsg.id || (m.text === localMsg.text && Math.abs(new Date(m.created_at).getTime() - new Date(localMsg.created_at).getTime()) < 5000))) {
                merged.push(localMsg);
              }
            });
            return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });

          // Mark messages as read by updating last_read_time
          localStorage.setItem(`last_read_time_${activePeerId}`, new Date().toISOString());
        }
      } catch (err) {
        console.warn("Failed to load peer messages:", err);
      }
    }

    loadMessages();

    // Set up 1-second polling interval
    const interval = setInterval(loadMessages, 1000);

    // Subscribe to real-time message inserts
    const channel = supabase
      .channel(`peer_messages_channel_${activePeerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "peer_messages" },
        (payload) => {
          const newMsg = payload.new as PeerMessage;
          setMessages((prev) => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Update read timestamp since user is actively viewing
          localStorage.setItem(`last_read_time_${activePeerId}`, new Date().toISOString());
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [activePeerId]);

  // Auto Scroll to bottom when messages update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, viewState]);

  const activePeer = peers.find((p) => p.id === activePeerId) || peers[0] || null;
  const filteredPeers = peers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const isActiveBlocked = activePeer ? blockedUserIds.includes(activePeer.id) : false;

  const handleSend = async () => {
    if (!draft.trim() || !activePeerId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isActiveBlocked) {
      Alert.alert("Blocked Connection", "You cannot send messages to blocked peers. Unblock them first.");
      return;
    }

    const filteredText = filterOffensiveWords(draft.trim());
    setDraft("");

    try {
      const newMsg = await sendDBPeerMessage(user.id, activePeerId, filteredText);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn("Failed to send peer message:", err);
    }
  };

  const handleBlockAction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activePeer) return;

    try {
      if (isActiveBlocked) {
        await unblockUser(user.id, activePeer.id);
        setBlockedUserIds(prev => prev.filter(id => id !== activePeer.id));
        Alert.alert("Unblocked", `You have successfully unblocked ${activePeer.name}.`);
      } else {
        await blockUser(user.id, activePeer.id);
        setBlockedUserIds(prev => [...prev, activePeer.id]);
        Alert.alert("Blocked", `${activePeer.name} has been blocked.`);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setShowMenu(false);
    }
  };

  if (loading || !activePeer) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Messenger...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.container}
    >
      {viewState === "list" ? (
        // 1. Messenger Connections Directory
        <View style={styles.pane}>
          <ScrollView style={styles.scrollWrapper} showsVerticalScrollIndicator={false}>
            <Header />
            <Text style={styles.paneTitle}>Student Messenger</Text>
            
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Feather name="search" size={14} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search peers by name"
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
            </View>

            {/* Peer List */}
            <View style={styles.contactsList}>
              {filteredPeers.map((p) => {
                const isPeerBlocked = blockedUserIds.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setActivePeerId(p.id);
                      setViewState("chat");
                    }}
                    style={[styles.contactItem, p.id === activePeerId && styles.activeContactItem]}
                  >
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={p.colors as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chatAvatar}
                      >
                        <Text style={styles.chatAvatarText}>{p.initials}</Text>
                      </LinearGradient>
                      <View style={[styles.onlineBadge, { backgroundColor: isPeerBlocked ? "#ef4444" : "#10b981" }]} />
                    </View>

                    <View style={styles.contactDetails}>
                      <View style={styles.contactHeaderRow}>
                        <Text style={styles.contactName} numberOfLines={1}>{p.name}</Text>
                        {isPeerBlocked && (
                          <View style={styles.blockedBadge}>
                            <Text style={styles.blockedBadgeText}>Blocked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.contactLastMsg} numberOfLines={1}>
                        Active Track: {p.focusDomain} ({p.proficiency})
                      </Text>
                      <Text style={styles.contactCourse} numberOfLines={1}>
                        📖 {p.currentCourse}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : (
        // 2. Active Chat & Details
        <View style={styles.chatPane}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setViewState("list")} style={styles.backButton}>
              <Feather name="arrow-left" size={18} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.chatHeaderAvatarWrapper}>
              <LinearGradient
                colors={activePeer.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chatHeaderAvatar}
              >
                <Text style={styles.chatHeaderAvatarText}>{activePeer.initials}</Text>
              </LinearGradient>
              <View style={[styles.headerOnlineBadge, { backgroundColor: isActiveBlocked ? "#ef4444" : "#10b981" }]} />
            </View>

            <View style={styles.chatHeaderMeta}>
              <Text style={styles.headerName} numberOfLines={1}>{activePeer.name}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {isActiveBlocked ? "Blocked" : `Track: ${activePeer.focusDomain}`} · {activePeer.currentCourse}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.moreButton}>
              <Feather name="more-vertical" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* Dropdown Menu (Three dots) */}
            {showMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  onPress={handleBlockAction} 
                  style={styles.menuItem}
                >
                  <Feather name="slash" size={14} color="#ef4444" style={styles.menuIcon} />
                  <Text style={[styles.menuText, { color: "#ef4444" }]}>
                    {isActiveBlocked ? "Unblock Peer" : "Block Peer"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setShowMenu(false);
                    setShowAnalyticsModal(true);
                  }} 
                  style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: "#e2e8f0" }]}
                >
                  <Feather name="bar-chart-2" size={14} color="#6366f1" style={styles.menuIcon} />
                  <Text style={styles.menuText}>View Analytics</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef} 
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isMe = m.sender_id !== activePeer.id;
              
              return (
                <View key={m.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, isMe ? styles.textWhite : styles.textDark]}>
                      {m.text}
                    </Text>
                    <View style={styles.msgMeta}>
                      <Text style={[styles.msgTime, isMe ? styles.timeMe : styles.timeThem]}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Input Bar */}
          <View style={styles.chatFooter}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={isActiveBlocked ? "Unblock peer to start messaging..." : "Type your message..."}
              placeholderTextColor="#94a3b8"
              editable={!isActiveBlocked}
              style={[styles.input, isActiveBlocked && styles.disabledInput]}
            />
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={isActiveBlocked || !draft.trim()}
              style={[styles.sendButton, (isActiveBlocked || !draft.trim()) && styles.disabledSendButton]}
            >
              <Feather name="send" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PUBLIC ANALYTICS MODAL */}
      <Modal
        visible={showAnalyticsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.analyticsCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Public Learning Profile</Text>
              <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileSection}>
              <LinearGradient
                colors={activePeer.colors as any}
                style={styles.largeAvatar}
              >
                <Text style={styles.largeAvatarText}>{activePeer.initials}</Text>
              </LinearGradient>
              <Text style={styles.profileName}>{activePeer.name}</Text>
              <Text style={styles.profileEmail}>{activePeer.email}</Text>
              <Text style={styles.profileTrackBadge}>
                {activePeer.focusDomain} · {activePeer.proficiency}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Feather name="zap" size={18} color="#f59e0b" />
                <Text style={styles.statVal}>{activePeer.streak} days</Text>
                <Text style={styles.statLabel}>Active Streak</Text>
              </View>

              <View style={styles.statBox}>
                <Feather name="award" size={18} color="#10b981" />
                <Text style={styles.statVal}>{activePeer.coursesCompleted}</Text>
                <Text style={styles.statLabel}>Completed Courses</Text>
              </View>

              <View style={styles.statBox}>
                <Feather name="star" size={18} color="#6366f1" />
                <Text style={styles.statVal}>{activePeer.xp}</Text>
                <Text style={styles.statLabel}>XP Earned</Text>
              </View>

              <View style={styles.statBox}>
                <Feather name="trending-up" size={18} color="#a855f7" />
                <Text style={styles.statVal}>{activePeer.careerFitScore}%</Text>
                <Text style={styles.statLabel}>Career Readiness</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setShowAnalyticsModal(false)}
              style={styles.closeModalBtn}
            >
              <Text style={styles.closeModalText}>Close Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600"
  },
  pane: {
    flex: 1,
  },
  scrollWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  paneTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },
  contactsList: {
    gap: 12,
    paddingBottom: 24,
  },
  contactItem: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  activeContactItem: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.02)",
  },
  avatarContainer: {
    position: "relative",
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  onlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  contactDetails: {
    flex: 1,
    justifyContent: "center",
  },
  contactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  blockedBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blockedBadgeText: {
    color: "#ef4444",
    fontSize: 9,
    fontWeight: "700",
  },
  contactLastMsg: {
    fontSize: 11,
    color: "#64748b",
  },
  contactCourse: {
    fontSize: 11,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 2,
  },
  chatPane: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    position: "relative",
    zIndex: 10,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  chatHeaderAvatarWrapper: {
    position: "relative",
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderAvatarText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  headerOnlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  chatHeaderMeta: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  moreButton: {
    padding: 6,
  },
  dropdownMenu: {
    position: "absolute",
    right: 12,
    top: 56,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    paddingVertical: 4,
    width: 140,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuIcon: {
    marginRight: 8,
  },
  menuText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  msgRow: {
    flexDirection: "row",
    width: "100%",
  },
  msgRowMe: {
    justifyContent: "flex-end",
  },
  msgRowThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: "#6366f1",
    borderTopRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textWhite: {
    color: "#ffffff",
  },
  textDark: {
    color: "#0f172a",
  },
  msgMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  msgTime: {
    fontSize: 9,
  },
  timeMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  timeThem: {
    color: "#94a3b8",
  },
  chatFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#0f172a",
  },
  disabledInput: {
    backgroundColor: "#f8fafc",
    color: "#94a3b8",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledSendButton: {
    backgroundColor: "#cbd5e1",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  analyticsCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  largeAvatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  profileEmail: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
  },
  profileTrackBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  statVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  closeModalBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
