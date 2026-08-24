import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import * as DocumentPicker from "expo-document-picker";
import { BootstrapIcon } from "../components/ui/BootstrapIcon";

import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, themeColors } from "../lib/store";
import { supabase } from "../lib/supabase";
import { 
  fetchDBAllProfiles, 
  fetchDBAllRecommendations, 
  fetchDBConnections,
  sendDBConnectionRequest,
  updateDBConnectionStatus,
  fetchDBConversations,
  fetchDBMessagesPaged,
  sendDBMessage,
  markMessagesAsRead,
  getOrCreateConversation,
  deleteDBConnection,
  blockDBUser,
  blockDBUserDirect,
  fetchDBProfile,
  fetchDBConversationUnreadCounts
} from "../lib/supabase-db";

type PeerUser = {
  id: string;
  name: string;
  email: string;
  focusDomain: string;
  proficiency: string;
  currentCourse: string;
  initials: string;
  colors: string[];
};

type Connection = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

type Conversation = {
  id: string;
  peer: PeerUser;
};

export default function ChatScreen() {
  const store = useDashboardStore();
  const currentUserId = store.user?.id || "";
  const appTheme = store.appTheme || "light";
  const currentColors = themeColors[appTheme as "light" | "dark"] || themeColors.light;
  const isDark = appTheme === "dark";

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chats" | "connections">("chats");
  
  // Data States
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // Active Chat States
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [msgOffset, setMsgOffset] = useState(0);

  // Connection Menu & Analytics States
  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
  const [selectedPeerProfile, setSelectedPeerProfile] = useState<any>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const fileInputRef = useRef<any>(null);

  const handleAttachFile = async () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          await uploadAndSendFileMobile(asset.uri, asset.name, asset.mimeType || "application/octet-stream");
        }
      } catch (err) {
        console.warn("Document picker failed:", err);
        Alert.alert("Error", "Failed to select document.");
      }
    }
  };

  const uploadAndSendFileMobile = async (uri: string, name: string, mimeType: string) => {
    if (!activeConv) return;
    try {
      const fileExt = name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${activeConv.id}/${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      const sentMsg = await sendDBMessage(
        activeConv.id, 
        currentUserId, 
        `Shared a file: ${name}`, 
        publicUrl, 
        name
      );
      setMessages((prev) => [...prev, sentMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("File upload failed:", err);
      Alert.alert("Upload Error", "Failed to upload attachment.");
    }
  };

  const handleFileSelected = async (e: any) => {
    const file = e.target?.files?.[0];
    if (!file || !activeConv) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${activeConv.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      const sentMsg = await sendDBMessage(
        activeConv.id, 
        currentUserId, 
        `Shared a file: ${file.name}`, 
        publicUrl, 
        file.name
      );
      setMessages((prev) => [...prev, sentMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("File upload failed:", err);
      Alert.alert("Upload Error", "Failed to upload attachment.");
    }
  };

  const handleDisconnect = async (connId: string) => {
    try {
      await deleteDBConnection(connId);
      Alert.alert("Success", "Disconnected successfully.");
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Failed to disconnect.");
    }
  };

  const handleBlock = async (connId: string | null, peerId: string) => {
    try {
      if (connId) {
        await blockDBUser(connId);
      } else {
        await blockDBUserDirect(currentUserId, peerId);
      }
      Alert.alert("Success", "User blocked successfully.");
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Failed to block user.");
    }
  };

  const handleViewAnalytics = async (peerId: string) => {
    try {
      const profile = await fetchDBProfile(peerId);
      if (profile) {
        setSelectedPeerProfile(profile);
        setShowAnalyticsModal(true);
      } else {
        Alert.alert("No Data", "This user hasn't initialized their profile stats yet.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load peer analytics.");
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Initial Load of all Profiles, Recommendations, Connections, and Conversations
  async function loadInitialData() {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [profiles, recs, conns, convParts, counts] = await Promise.all([
        fetchDBAllProfiles(),
        fetchDBAllRecommendations(),
        fetchDBConnections(currentUserId),
        fetchDBConversations(currentUserId),
        fetchDBConversationUnreadCounts(currentUserId)
      ]);

      let profileList = profiles || [];
      if (profileList.filter(p => p.id !== currentUserId).length === 0) {
        profileList = [
          { id: "peer1", name: "Priya Sharma", email: "priya@edusync.ai", focus_domain: "Mobile", proficiency: "Intermediate", streak: 5, courses_completed: 2, career_fit_score: 84, xp: 1200 },
          { id: "peer2", name: "Rohit Kumar", email: "rohit@edusync.ai", focus_domain: "Frontend", proficiency: "Beginner", streak: 3, courses_completed: 1, career_fit_score: 72, xp: 850 },
          { id: "peer3", name: "Anjali Singh", email: "anjali@edusync.ai", focus_domain: "Backend", proficiency: "Advanced", streak: 12, courses_completed: 4, career_fit_score: 91, xp: 2400 },
          { id: "peer4", name: "Karan Talwar", email: "karan@edusync.ai", focus_domain: "AI", proficiency: "Beginner", streak: 1, courses_completed: 0, career_fit_score: 60, xp: 300 }
        ];
      }

      const colorsList = [
        ["#6366f1", "#818cf8"],
        ["#0ea5e9", "#38bdf8"],
        ["#0d9488", "#2dd4bf"],
        ["#f59e0b", "#fbbf24"],
        ["#a855f7", "#c084fc"]
      ];

      // Map profiles to peers
      const mappedPeers: PeerUser[] = profileList.map((p, index) => {
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
          currentCourse = p.focus_domain === "Frontend" ? "React State & Styling (12%)"
            : p.focus_domain === "Backend" ? "Dockerized Server Setup (40%)"
            : p.focus_domain === "Mobile" ? "App Navigation & Screen Mapping (60%)"
            : "PyTorch Data Loading (15%)";
        }

        const name = p.name || p.email?.split("@")[0] || "Peer Student";
        const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "PS";

        return {
          id: p.id,
          name,
          email: p.email,
          focusDomain: p.focus_domain || "Frontend",
          proficiency: p.proficiency || "Beginner",
          currentCourse,
          initials,
          colors: colorsList[index % colorsList.length]
        };
      });

      setPeers(mappedPeers);
      setConnections(conns);

      // Construct Conversations list based on accepted connection participants matching public profiles
      const activeConversations: Conversation[] = [];
      const seenPeerIds = new Set<string>();
      const grouped = convParts.reduce((acc: any, cp: any) => {
        acc[cp.conversation_id] = acc[cp.conversation_id] || [];
        acc[cp.conversation_id].push(cp.user_id);
        return acc;
      }, {});

      Object.keys(grouped).forEach(convId => {
        const members = grouped[convId];
        if (members.includes(currentUserId)) {
          const peerId = members.find((mId: string) => mId !== currentUserId);
          if (peerId && !seenPeerIds.has(peerId)) {
            const peerObj = mappedPeers.find(p => p.id === peerId);
            if (peerObj) {
              seenPeerIds.add(peerId);
              activeConversations.push({
                id: convId,
                peer: peerObj
              });
            }
          }
        }
      });

      setConversations(activeConversations);
      setUnreadCounts(counts || {});
    } catch (e) {
      console.warn("Failed loading chat structures:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [currentUserId]);

  // 2. Poll connections and unread states periodically in background
  useEffect(() => {
    if (!currentUserId) return;

    const pollUpdates = async () => {
      try {
        const [conns, convParts, unreadCountsMap] = await Promise.all([
          fetchDBConnections(currentUserId),
          fetchDBConversations(currentUserId),
          fetchDBConversationUnreadCounts(currentUserId)
        ]);

        setConnections(conns);
        setUnreadCounts(unreadCountsMap || {});

        const grouped = convParts.reduce((acc: any, cp: any) => {
          acc[cp.conversation_id] = acc[cp.conversation_id] || [];
          acc[cp.conversation_id].push(cp.user_id);
          return acc;
        }, {});

        const activeConversations: Conversation[] = [];
        const seenPeerIds = new Set<string>();
        Object.keys(grouped).forEach(convId => {
          const members = grouped[convId];
          if (members.includes(currentUserId)) {
            const peerId = members.find((mId: string) => mId !== currentUserId);
            if (peerId && !seenPeerIds.has(peerId)) {
              const peerObj = peers.find(p => p.id === peerId);
              if (peerObj) {
                seenPeerIds.add(peerId);
                activeConversations.push({
                  id: convId,
                  peer: peerObj
                });
              }
            }
          }
        });
        setConversations(activeConversations);
      } catch (err) {}
    };

    pollUpdates();
    const interval = setInterval(pollUpdates, 3000);

    // Global listener for realtime message indicators
    const channel = supabase
      .channel("global_messages_indicator")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "peer_messages" },
        () => {
          pollUpdates();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, peers]);

  // 3. Load active conversation messages and subscribe to Realtime
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    let active = true;

    async function getMessagesInit() {
      setMsgOffset(0);
      setHasMore(true);
      const initialMsgs = await fetchDBMessagesPaged(activeConv!.id, 30, 0);
      if (active) {
        setMessages(initialMsgs);
        if (initialMsgs.length < 30) {
          setHasMore(false);
        }
        await markMessagesAsRead(activeConv!.id, currentUserId);
      }
    }

    getMessagesInit();

    // Set up polling fallback for read status updates
    const readStatusInterval = setInterval(async () => {
      if (activeConv) {
        const paged = await fetchDBMessagesPaged(activeConv.id, 30, 0);
        if (active) {
          setMessages((prev) => {
            const next = [...prev];
            paged.forEach((updatedMsg) => {
              const idx = next.findIndex(m => m.id === updatedMsg.id);
              if (idx !== -1) {
                next[idx] = updatedMsg;
              } else {
                next.push(updatedMsg);
              }
            });
            return next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      }
    }, 1500);

    // Subscribe to realtime message inserts in conversation
    const channel = supabase
      .channel(`conversation_messages_${activeConv.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "peer_messages", filter: `conversation_id=eq.${activeConv.id}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (active) {
            setMessages((prev) => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Mark incoming messages as read instantly since user is actively viewing
            if (newMsg.sender_id !== currentUserId) {
              markMessagesAsRead(activeConv!.id, currentUserId);
            }
            // Auto scroll down
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(readStatusInterval);
      supabase.removeChannel(channel);
    };
  }, [activeConv]);

  // Auto scroll to end when active conversation loads
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [activeConv]);

  // Load older messages on upward scroll (pagination)
  const handleScroll = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (event.nativeEvent.contentOffset.y <= 5 && !loadingMore && hasMore && activeConv) {
      setLoadingMore(true);
      const nextOffset = msgOffset + 30;
      const olderMsgs = await fetchDBMessagesPaged(activeConv.id, 30, nextOffset);
      
      if (olderMsgs.length > 0) {
        setMessages((prev) => {
          const merged = [...olderMsgs];
          prev.forEach((m) => {
            if (!merged.find(x => x.id === m.id)) {
              merged.push(m);
            }
          });
          return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
        setMsgOffset(nextOffset);
        if (olderMsgs.length < 30) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }
  };

  // Connection Management Actions
  const handleSendRequest = async (receiverId: string) => {
    try {
      await sendDBConnectionRequest(currentUserId, receiverId);
      Alert.alert("Success", "Connection request sent!");
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Failed to send connection request.");
    }
  };

  const handleUpdateRequest = async (connId: string, status: "accepted" | "rejected", senderId: string) => {
    try {
      await updateDBConnectionStatus(connId, status, senderId, currentUserId);
      Alert.alert("Success", `Request ${status === "accepted" ? "accepted" : "rejected"}!`);
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Failed to process request.");
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeConv) return;
    const text = draft.trim();
    setDraft("");
    try {
      const sentMsg = await sendDBMessage(activeConv.id, currentUserId, text);
      setMessages((prev) => [...prev, sentMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      Alert.alert("Error", "Failed to send message.");
    }
  };

  // Search Results filtering for new connection discoveries
  const searchablePeers = peers.filter(p => 
    p.id !== currentUserId && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.loadingWrapper, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={[styles.loadingText, { color: currentColors.subtext }]}>Initializing Secure Messenger...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={[styles.container, { backgroundColor: currentColors.background }]}
    >
      {!activeConv ? (
        // Directory Panel
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollWrapper} showsVerticalScrollIndicator={false}>
            <Header />
            <Text style={[styles.paneTitle, { color: currentColors.text }]}>Student Chats</Text>

            {/* Sub-Tabs */}
            <View style={[styles.tabBar, { backgroundColor: isDark ? "#1f2937" : "#e2e8f0" }]}>
              <TouchableOpacity 
                onPress={() => setTab("chats")} 
                style={[styles.tabItem, tab === "chats" && styles.tabItemActive, tab === "chats" && { backgroundColor: currentColors.card }]}
              >
                <Text style={[styles.tabText, { color: currentColors.subtext }, tab === "chats" && [styles.tabTextActive, { color: currentColors.text }]]}>Chats ({conversations.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setTab("connections")} 
                style={[styles.tabItem, tab === "connections" && styles.tabItemActive, tab === "connections" && { backgroundColor: currentColors.card }]}
              >
                {/* Calculate pending incoming request counts */}
                {(() => {
                  const pendingCount = connections.filter(c => c.receiver_id === currentUserId && c.status === "pending").length;
                  return (
                    <Text style={[styles.tabText, { color: currentColors.subtext }, tab === "connections" && [styles.tabTextActive, { color: currentColors.text }]]}>
                      Connections {pendingCount > 0 ? `(${pendingCount} pending)` : ""}
                    </Text>
                  );
                })()}
              </TouchableOpacity>
            </View>

            {tab === "chats" ? (
              // 1. Accepted Conversations list
              <View style={styles.contactsList}>
                {conversations.length === 0 ? (
                  <View style={styles.emptyView}>
                    <MaterialCommunityIcons name="message-text-outline" size={48} color={currentColors.subtext} />
                    <Text style={[styles.emptyTitle, { color: isDark ? "#ffffff" : "#475569" }]}>No Chats Yet</Text>
                    <Text style={[styles.emptyDesc, { color: currentColors.subtext }]}>Head over to the Connections tab to find other student peers and request connections!</Text>
                  </View>
                ) : (
                  conversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.id}
                      onPress={() => setActiveConv(conv)}
                      style={[styles.contactItem, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}
                    >
                      <View style={styles.avatarContainer}>
                        <LinearGradient
                          colors={conv.peer.colors as any}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.chatAvatar}
                        >
                          <Text style={styles.chatAvatarText}>{conv.peer.initials}</Text>
                        </LinearGradient>
                      </View>

                      <View style={styles.contactDetails}>
                        <Text style={[styles.contactName, { color: currentColors.text }]}>{conv.peer.name}</Text>
                        <Text style={[styles.contactLastMsg, { color: currentColors.subtext }]} numberOfLines={1}>
                          Track: {conv.peer.focusDomain} ({conv.peer.proficiency})
                        </Text>
                        <Text style={styles.contactCourse} numberOfLines={1}>
                          📖 {conv.peer.currentCourse}
                        </Text>
                      </View>
                      {unreadCounts[conv.id] > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{unreadCounts[conv.id]}</Text>
                        </View>
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={18} color={currentColors.subtext} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : (
              // 2. Connection requests search and review page
              <View style={styles.connectionsPane}>
                {/* Search Registered Users */}
                <View style={[styles.searchBar, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                  <MaterialCommunityIcons name="magnify" size={16} color={currentColors.subtext} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search peers to connect with..."
                    placeholderTextColor={currentColors.subtext}
                    style={[styles.searchInput, { color: currentColors.text }]}
                  />
                </View>

                <View style={[styles.searchResults, { backgroundColor: currentColors.card, borderColor: currentColors.border }, menuVisibleId ? { zIndex: 50, position: "relative" } : null]}>
                  <Text style={[styles.sectionHeader, { color: currentColors.subtext }]}>
                    {searchQuery.trim().length > 0 ? "Search Results" : "Discover Peers"}
                  </Text>
                  {searchablePeers.length === 0 ? (
                    <Text style={[styles.emptyText, { color: currentColors.subtext }]}>
                      {searchQuery.trim().length > 0 ? "No users matched your search query." : "No peers available to discover."}
                    </Text>
                  ) : (
                    searchablePeers.map(p => {
                      const conn = connections.find(c => 
                        (c.sender_id === currentUserId && c.receiver_id === p.id) ||
                        (c.receiver_id === currentUserId && c.sender_id === p.id)
                      );

                      return (
                        <View key={p.id} style={[styles.searchItem, { borderBottomColor: currentColors.border }, menuVisibleId === 'discover-' + p.id ? { zIndex: 100, position: "relative" } : null]}>
                          <View style={styles.peerMeta}>
                            <Text style={[styles.peerName, { color: currentColors.text }]}>{p.name}</Text>
                            <Text style={[styles.peerTrack, { color: currentColors.subtext }]}>{p.focusDomain} · {p.proficiency}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {!conn ? (
                              <TouchableOpacity 
                                onPress={() => handleSendRequest(p.id)}
                                style={styles.actionBtn}
                              >
                                <Text style={styles.actionBtnText}>Connect</Text>
                              </TouchableOpacity>
                            ) : conn.status === "pending" ? (
                              conn.sender_id === currentUserId ? (
                                <Text style={[styles.statusLabel, { color: currentColors.subtext }]}>Pending Sent</Text>
                              ) : (
                                <View style={styles.rowButtons}>
                                  <TouchableOpacity 
                                    onPress={() => handleUpdateRequest(conn.id, "accepted", conn.sender_id)}
                                    style={[styles.smallBtn, { backgroundColor: "#10b981" }]}
                                  >
                                    <Text style={styles.smallBtnText}>Accept</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    onPress={() => handleUpdateRequest(conn.id, "rejected", conn.sender_id)}
                                    style={[styles.smallBtn, { backgroundColor: "#ef4444" }]}
                                  >
                                    <Text style={styles.smallBtnText}>Reject</Text>
                                  </TouchableOpacity>
                                </View>
                              )
                            ) : conn.status === "accepted" ? (
                              <TouchableOpacity 
                                onPress={async () => {
                                  try {
                                    const convId = await getOrCreateConversation(currentUserId, p.id);
                                    setActiveConv({
                                      id: convId,
                                      peer: p
                                    });
                                    setTab("chats");
                                  } catch (err) {
                                    Alert.alert("Error", "Failed to start conversation.");
                                  }
                                }}
                                style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                              >
                                <Text style={styles.actionBtnText}>Chat</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={[styles.statusLabel, { color: currentColors.subtext }]}>Rejected</Text>
                            )}

                            {(!conn || conn.status !== "blocked") && (
                              <TouchableOpacity 
                                onPress={() => setMenuVisibleId(menuVisibleId === 'discover-' + p.id ? null : 'discover-' + p.id)}
                                style={{ padding: 6 }}
                              >
                                <BootstrapIcon name="three-dots-vertical" size={18} color="#64748b" />
                              </TouchableOpacity>
                            )}
                          </View>

                          {menuVisibleId === 'discover-' + p.id && (
                            <View style={styles.dropdownMenu}>
                              {conn?.status === "accepted" && (
                                <TouchableOpacity 
                                  onPress={() => {
                                    setMenuVisibleId(null);
                                    handleDisconnect(conn.id);
                                  }}
                                  style={styles.menuItem}
                                >
                                  <BootstrapIcon name="person-x" size={14} color="#ef4444" style={styles.menuIcon} />
                                  <Text style={[styles.menuText, { color: "#ef4444" }]}>Disconnect</Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity 
                                onPress={() => {
                                  setMenuVisibleId(null);
                                  handleBlock(conn?.id || null, p.id);
                                }}
                                style={styles.menuItem}
                              >
                                <BootstrapIcon name="ban" size={14} color="#f59e0b" style={styles.menuIcon} />
                                <Text style={styles.menuText}>Block</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => {
                                  setMenuVisibleId(null);
                                  handleViewAnalytics(p.id);
                                }}
                                style={styles.menuItem}
                              >
                                <BootstrapIcon name="bar-chart-line" size={14} color="#6366f1" style={styles.menuIcon} />
                                <Text style={styles.menuText}>View Analytics</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* My Connections */}
                <View style={[styles.connBlock, { backgroundColor: currentColors.card, borderColor: currentColors.border }, menuVisibleId ? { zIndex: 40, position: "relative" } : null]}>
                  <Text style={[styles.sectionHeader, { color: currentColors.subtext }]}>My Connections</Text>
                  {(() => {
                    const acceptedConns = connections.filter(c => c.status === "accepted");
                    if (acceptedConns.length === 0) {
                      return <Text style={[styles.emptyText, { color: currentColors.subtext }]}>No active connections yet.</Text>;
                    }
                    return acceptedConns.map(c => {
                      const peerId = c.sender_id === currentUserId ? c.receiver_id : c.sender_id;
                      const peer = peers.find(p => p.id === peerId);
                      if (!peer) return null;
                      return (
                        <View key={c.id} style={[styles.searchItem, { borderBottomColor: currentColors.border }, menuVisibleId === 'myconns-' + peer.id ? { zIndex: 100, position: "relative" } : null]}>
                          <View style={styles.peerMeta}>
                            <Text style={[styles.peerName, { color: currentColors.text }]}>{peer.name}</Text>
                            <Text style={[styles.peerTrack, { color: currentColors.subtext }]}>{peer.focusDomain} · {peer.proficiency}</Text>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity 
                              onPress={async () => {
                                try {
                                  const convId = await getOrCreateConversation(currentUserId, peer.id);
                                  setActiveConv({
                                    id: convId,
                                    peer: peer
                                  });
                                  setTab("chats");
                                } catch (err) {
                                  Alert.alert("Error", "Failed to start conversation.");
                                }
                              }}
                              style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                            >
                              <Text style={styles.actionBtnText}>Chat</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                              onPress={() => setMenuVisibleId(menuVisibleId === 'myconns-' + peer.id ? null : 'myconns-' + peer.id)}
                              style={{ padding: 6 }}
                            >
                              <BootstrapIcon name="three-dots-vertical" size={18} color={currentColors.subtext} />
                            </TouchableOpacity>
                          </View>

                          {menuVisibleId === 'myconns-' + peer.id && (
                            <View style={[styles.dropdownMenu, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                              <TouchableOpacity 
                                onPress={() => {
                                  setMenuVisibleId(null);
                                  handleDisconnect(c.id);
                                }}
                                style={styles.menuItem}
                              >
                                <BootstrapIcon name="person-x" size={14} color="#ef4444" style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: "#ef4444" }]}>Disconnect</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => {
                                  setMenuVisibleId(null);
                                  handleBlock(c.id, peer.id);
                                }}
                                style={styles.menuItem}
                              >
                                <BootstrapIcon name="ban" size={14} color="#f59e0b" style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: currentColors.text }]}>Block</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => {
                                  setMenuVisibleId(null);
                                  handleViewAnalytics(peer.id);
                                }}
                                style={styles.menuItem}
                              >
                                <BootstrapIcon name="bar-chart-line" size={14} color="#6366f1" style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: currentColors.text }]}>View Analytics</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>

                {/* Incoming Pending Connections */}
                <View style={[styles.connBlock, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                  <Text style={[styles.sectionHeader, { color: currentColors.subtext }]}>Incoming Requests</Text>
                  {(() => {
                    const incoming = connections.filter(c => c.receiver_id === currentUserId && c.status === "pending");
                    if (incoming.length === 0) {
                      return <Text style={[styles.emptyText, { color: currentColors.subtext }]}>No incoming connection requests.</Text>;
                    }
                    return incoming.map(c => {
                      const sender = peers.find(p => p.id === c.sender_id);
                      if (!sender) return null;
                      return (
                        <View key={c.id} style={[styles.searchItem, { borderBottomColor: currentColors.border }]}>
                          <View style={styles.peerMeta}>
                            <Text style={[styles.peerName, { color: currentColors.text }]}>{sender.name}</Text>
                            <Text style={[styles.peerTrack, { color: currentColors.subtext }]}>{sender.focusDomain} · {sender.proficiency}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity 
                              onPress={() => handleUpdateRequest(c.id, "accepted", c.sender_id)}
                              style={[styles.smallBtn, { backgroundColor: "#10b981" }]}
                            >
                              <Text style={styles.smallBtnText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleUpdateRequest(c.id, "rejected", c.sender_id)}
                              style={[styles.smallBtn, { backgroundColor: "#ef4444" }]}
                            >
                              <Text style={styles.smallBtnText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>

                {/* Outgoing Pending Requests */}
                <View style={[styles.connBlock, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                  <Text style={[styles.sectionHeader, { color: currentColors.subtext }]}>Outgoing Requests</Text>
                  {(() => {
                    const outgoing = connections.filter(c => c.sender_id === currentUserId && c.status === "pending");
                    if (outgoing.length === 0) {
                      return <Text style={[styles.emptyText, { color: currentColors.subtext }]}>No outgoing requests sent.</Text>;
                    }
                    return outgoing.map(c => {
                      const receiver = peers.find(p => p.id === c.receiver_id);
                      if (!receiver) return null;
                      return (
                        <View key={c.id} style={[styles.searchItem, { borderBottomColor: currentColors.border }]}>
                          <View style={styles.peerMeta}>
                            <Text style={[styles.peerName, { color: currentColors.text }]}>{receiver.name}</Text>
                            <Text style={[styles.peerTrack, { color: currentColors.subtext }]}>{receiver.focusDomain} · {receiver.proficiency}</Text>
                          </View>
                          <Text style={[styles.statusLabel, { color: currentColors.subtext }]}>Pending Approval</Text>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        // Active Conversational Thread
        <View style={[styles.chatPane, { backgroundColor: currentColors.background }]}>
          {/* Header */}
          <View style={[styles.chatHeader, { backgroundColor: currentColors.card, borderBottomColor: currentColors.border }]}>
            <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={currentColors.text} />
            </TouchableOpacity>

            <View style={styles.chatHeaderAvatarWrapper}>
              <LinearGradient
                colors={activeConv.peer.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chatHeaderAvatar}
              >
                <Text style={styles.chatHeaderAvatarText}>{activeConv.peer.initials}</Text>
              </LinearGradient>
            </View>

            <View style={styles.chatHeaderMeta}>
              <Text style={[styles.headerName, { color: currentColors.text }]} numberOfLines={1}>{activeConv.peer.name}</Text>
              <Text style={[styles.headerSubtitle, { color: currentColors.subtext }]} numberOfLines={1}>
                Track: {activeConv.peer.focusDomain} · {activeConv.peer.currentCourse}
              </Text>
            </View>
          </View>

          {/* Conversation Message List */}
          <ScrollView 
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={[styles.messagesContainer, { backgroundColor: currentColors.background }]}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingMore && <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 8 }} />}
            
             {messages.map((m) => {
               const isMe = m.sender_id === currentUserId;
               return (
                 <View key={m.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                   <View style={[styles.bubble, isMe ? styles.bubbleMe : [styles.bubbleThem, { backgroundColor: currentColors.card, borderColor: currentColors.border }]]}>
                     <Text style={[styles.bubbleText, isMe ? styles.textWhite : [styles.textDark, { color: currentColors.text }]]}>
                       {m.message}
                     </Text>
                     {m.attachment_url && (
                       <TouchableOpacity 
                         onPress={() => window.open(m.attachment_url, "_blank")}
                         style={[styles.attachmentBadge, isMe ? styles.attachmentMe : [styles.attachmentThem, { backgroundColor: isDark ? "#1f2937" : "#f1f5f9", borderColor: currentColors.border }]]}
                       >
                         <MaterialCommunityIcons name="file-document-outline" size={14} color={isMe ? "#ffffff" : "#6366f1"} />
                         <Text style={[styles.attachmentText, isMe ? styles.textWhite : styles.textPrimary]} numberOfLines={1}>
                           {m.attachment_name || "Download File"}
                         </Text>
                       </TouchableOpacity>
                     )}
                     <View style={styles.msgMeta}>
                       <Text style={[styles.msgTime, isMe ? styles.timeMe : [styles.timeThem, { color: currentColors.subtext }]]}>
                         {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </Text>
                       {isMe && (
                         <MaterialCommunityIcons 
                           name={m.is_read ? "check-all" : "check"} 
                           size={12} 
                           color={m.is_read ? "#2dd4bf" : "rgba(255,255,255,0.7)"} 
                         />
                       )}
                     </View>
                   </View>
                 </View>
               );
             })}
           </ScrollView>
 
           {/* Hidden File Picker Input for Web */}
           {Platform.OS === "web" && (
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileSelected} 
               style={{ display: "none" }} 
             />
           )}
 
           {/* Footer Input Bar */}
           <View style={[styles.chatFooter, { backgroundColor: currentColors.card, borderTopColor: currentColors.border }]}>
             <TouchableOpacity 
               onPress={handleAttachFile} 
               style={styles.attachButton}
             >
               <MaterialCommunityIcons name="paperclip" size={20} color={currentColors.subtext} />
             </TouchableOpacity>
             <TextInput
               value={draft}
               onChangeText={setDraft}
               placeholder="Type your message..."
               placeholderTextColor={currentColors.subtext}
               style={[styles.input, { backgroundColor: isDark ? "#1f2937" : "#f1f5f9", color: currentColors.text }]}
             />
             <TouchableOpacity 
               onPress={handleSend} 
               disabled={!draft.trim()}
               style={[styles.sendButton, !draft.trim() && styles.disabledSendButton]}
             >
               <MaterialCommunityIcons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Peer Analytics Modal */}
      <Modal
        visible={showAnalyticsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.analyticsCard, { backgroundColor: currentColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: currentColors.border }]}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>Student Analytics</Text>
              <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                <MaterialCommunityIcons name="close" size={20} color={currentColors.subtext} />
              </TouchableOpacity>
            </View>

            {selectedPeerProfile && (
              <View>
                <View style={styles.profileSection}>
                  <View style={[styles.largeAvatar, { backgroundColor: "#6366f1" }]}>
                    <Text style={styles.largeAvatarText}>
                      {(selectedPeerProfile.name || "Student")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.profileName, { color: currentColors.text }]}>{selectedPeerProfile.name || "Student"}</Text>
                  <Text style={[styles.profileEmail, { color: currentColors.subtext }]}>{selectedPeerProfile.email}</Text>
                  <Text style={[styles.profileTrackBadge, { color: isDark ? "#818cf8" : "#6366f1", backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#e0e7ff" }]}>
                    {selectedPeerProfile.focus_domain || selectedPeerProfile.focusDomain || "Frontend"} Track
                  </Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: isDark ? "#1f2937" : "#f8fafc", borderColor: currentColors.border }]}>
                    <BootstrapIcon name="zap" size={16} color="#ef4444" />
                    <Text style={[styles.statVal, { color: currentColors.text }]}>{selectedPeerProfile.xp ?? 0} XP</Text>
                    <Text style={[styles.statLabel, { color: currentColors.subtext }]}>Total XP</Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: isDark ? "#1f2937" : "#f8fafc", borderColor: currentColors.border }]}>
                    <BootstrapIcon name="award" size={16} color="#f59e0b" />
                    <Text style={[styles.statVal, { color: currentColors.text }]}>{selectedPeerProfile.streak ?? 1} days</Text>
                    <Text style={[styles.statLabel, { color: currentColors.subtext }]}>Streak</Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: isDark ? "#1f2937" : "#f8fafc", borderColor: currentColors.border }]}>
                    <BootstrapIcon name="check-circle" size={16} color="#10b981" />
                    <Text style={[styles.statVal, { color: currentColors.text }]}>{selectedPeerProfile.courses_completed ?? selectedPeerProfile.coursesCompleted ?? 0}</Text>
                    <Text style={[styles.statLabel, { color: currentColors.subtext }]}>Completed</Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: isDark ? "#1f2937" : "#f8fafc", borderColor: currentColors.border }]}>
                    <BootstrapIcon name="graph-up-arrow" size={16} color="#6366f1" />
                    <Text style={[styles.statVal, { color: currentColors.text }]}>{selectedPeerProfile.career_fit_score ?? selectedPeerProfile.careerFitScore ?? 0}%</Text>
                    <Text style={[styles.statLabel, { color: currentColors.subtext }]}>Career Fit</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => setShowAnalyticsModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#0f172a",
    fontWeight: "700",
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
    paddingBottom: 32,
  },
  contactItem: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 12,
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
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
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
  connectionsPane: {
    paddingBottom: 40,
  },
  searchResults: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  searchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  peerMeta: {
    flex: 1,
  },
  peerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  peerTrack: {
    fontSize: 11,
    color: "#64748b",
  },
  actionBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  statusLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  rowButtons: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  connBlock: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  emptyView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#475569",
  },
  emptyDesc: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
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
  attachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  attachmentMe: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  attachmentThem: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  attachmentText: {
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 160,
  },
  textPrimary: {
    color: "#6366f1",
  },
  attachButton: {
    padding: 6,
  },
  dropdownMenu: {
    position: "absolute",
    right: 12,
    top: 40,
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
    paddingVertical: 8,
  },
  menuIcon: {
    marginRight: 8,
  },
  menuText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
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
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 4,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
});
