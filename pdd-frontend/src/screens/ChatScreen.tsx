import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../lib/store";
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
  markMessagesAsRead
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
  status: "pending" | "accepted" | "rejected";
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

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chats" | "connections">("chats");
  
  // Data States
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Active Chat States
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [msgOffset, setMsgOffset] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Initial Load of all Profiles, Recommendations, Connections, and Conversations
  async function loadInitialData() {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [profiles, recs, conns, convParts] = await Promise.all([
        fetchDBAllProfiles(),
        fetchDBAllRecommendations(),
        fetchDBConnections(currentUserId),
        fetchDBConversations(currentUserId)
      ]);

      const colorsList = [
        ["#6366f1", "#818cf8"],
        ["#0ea5e9", "#38bdf8"],
        ["#0d9488", "#2dd4bf"],
        ["#f59e0b", "#fbbf24"],
        ["#a855f7", "#c084fc"]
      ];

      // Map profiles to peers
      const mappedPeers: PeerUser[] = profiles.map((p, index) => {
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
      const grouped = convParts.reduce((acc: any, cp: any) => {
        acc[cp.conversation_id] = acc[cp.conversation_id] || [];
        acc[cp.conversation_id].push(cp.user_id);
        return acc;
      }, {});

      Object.keys(grouped).forEach(convId => {
        const members = grouped[convId];
        if (members.includes(currentUserId)) {
          const peerId = members.find((mId: string) => mId !== currentUserId);
          const peerObj = mappedPeers.find(p => p.id === peerId);
          if (peerObj) {
            activeConversations.push({
              id: convId,
              peer: peerObj
            });
          }
        }
      });

      setConversations(activeConversations);
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
    const interval = setInterval(async () => {
      try {
        const conns = await fetchDBConnections(currentUserId);
        setConnections(conns);

        // Also update conversations list
        const convParts = await fetchDBConversations(currentUserId);
        const grouped = convParts.reduce((acc: any, cp: any) => {
          acc[cp.conversation_id] = acc[cp.conversation_id] || [];
          acc[cp.conversation_id].push(cp.user_id);
          return acc;
        }, {});

        const activeConversations: Conversation[] = [];
        Object.keys(grouped).forEach(convId => {
          const members = grouped[convId];
          if (members.includes(currentUserId)) {
            const peerId = members.find((mId: string) => mId !== currentUserId);
            const peerObj = peers.find(p => p.id === peerId);
            if (peerObj) {
              activeConversations.push({
                id: convId,
                peer: peerObj
              });
            }
          }
        });
        setConversations(activeConversations);
      } catch (err) {}
    }, 3000);

    return () => clearInterval(interval);
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
      Alert.alert("Success", "Connection request sent successfully!");
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Failed to send request.");
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
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing Secure Messenger...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.container}
    >
      {!activeConv ? (
        // Directory Panel
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollWrapper} showsVerticalScrollIndicator={false}>
            <Header />
            <Text style={styles.paneTitle}>Student Chats</Text>

            {/* Sub-Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity 
                onPress={() => setTab("chats")} 
                style={[styles.tabItem, tab === "chats" && styles.tabItemActive]}
              >
                <Text style={[styles.tabText, tab === "chats" && styles.tabTextActive]}>Chats ({conversations.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setTab("connections")} 
                style={[styles.tabItem, tab === "connections" && styles.tabItemActive]}
              >
                {/* Calculate pending incoming request counts */}
                {(() => {
                  const pendingCount = connections.filter(c => c.receiver_id === currentUserId && c.status === "pending").length;
                  return (
                    <Text style={[styles.tabText, tab === "connections" && styles.tabTextActive]}>
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
                    <MaterialCommunityIcons name="message-text-outline" size={48} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Chats Yet</Text>
                    <Text style={styles.emptyDesc}>Head over to the Connections tab to find other student peers and request connections!</Text>
                  </View>
                ) : (
                  conversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.id}
                      onPress={() => setActiveConv(conv)}
                      style={styles.contactItem}
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
                        <Text style={styles.contactName}>{conv.peer.name}</Text>
                        <Text style={styles.contactLastMsg} numberOfLines={1}>
                          Track: {conv.peer.focusDomain} ({conv.peer.proficiency})
                        </Text>
                        <Text style={styles.contactCourse} numberOfLines={1}>
                          📖 {conv.peer.currentCourse}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : (
              // 2. Connection requests search and review page
              <View style={styles.connectionsPane}>
                {/* Search Registered Users */}
                <View style={styles.searchBar}>
                  <Feather name="search" size={14} color="#64748b" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search peers to connect with..."
                    placeholderTextColor="#94a3b8"
                    style={styles.searchInput}
                  />
                </View>

                <View style={styles.searchResults}>
                  <Text style={styles.sectionHeader}>
                    {searchQuery.trim().length > 0 ? "Search Results" : "Discover Peers"}
                  </Text>
                  {searchablePeers.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {searchQuery.trim().length > 0 ? "No users matched your search query." : "No peers available to discover."}
                    </Text>
                  ) : (
                    searchablePeers.map(p => {
                      const conn = connections.find(c => 
                        (c.sender_id === currentUserId && c.receiver_id === p.id) ||
                        (c.receiver_id === currentUserId && c.sender_id === p.id)
                      );

                      return (
                        <View key={p.id} style={styles.searchItem}>
                          <View style={styles.peerMeta}>
                            <Text style={styles.peerName}>{p.name}</Text>
                            <Text style={styles.peerTrack}>{p.focusDomain} · {p.proficiency}</Text>
                          </View>

                          {!conn ? (
                            <TouchableOpacity 
                              onPress={() => handleSendRequest(p.id)}
                              style={styles.actionBtn}
                            >
                              <Text style={styles.actionBtnText}>Connect</Text>
                            </TouchableOpacity>
                          ) : conn.status === "pending" ? (
                            conn.sender_id === currentUserId ? (
                              <Text style={styles.statusLabel}>Pending Sent</Text>
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
                              onPress={() => {
                                const conv = conversations.find(c => c.peer.id === p.id);
                                if (conv) {
                                  setActiveConv(conv);
                                  setTab("chats");
                                } else {
                                  Alert.alert("Initializing Chat", "Chat session is being initialized, please try again in a moment.");
                                }
                              }}
                              style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                            >
                              <Text style={styles.actionBtnText}>Chat</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.statusLabel}>Rejected</Text>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* Incoming Pending Connections */}
                <View style={styles.connBlock}>
                  <Text style={styles.sectionHeader}>Incoming Requests</Text>
                  {(() => {
                    const incoming = connections.filter(c => c.receiver_id === currentUserId && c.status === "pending");
                    if (incoming.length === 0) {
                      return <Text style={styles.emptyText}>No incoming connection requests.</Text>;
                    }
                    return incoming.map(c => {
                      const sender = peers.find(p => p.id === c.sender_id);
                      if (!sender) return null;
                      return (
                        <View key={c.id} style={styles.searchItem}>
                          <View style={styles.peerMeta}>
                            <Text style={styles.peerName}>{sender.name}</Text>
                            <Text style={styles.peerTrack}>{sender.focusDomain} · {sender.proficiency}</Text>
                          </View>
                          <View style={styles.rowButtons}>
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
                <View style={styles.connBlock}>
                  <Text style={styles.sectionHeader}>Outgoing Requests</Text>
                  {(() => {
                    const outgoing = connections.filter(c => c.sender_id === currentUserId && c.status === "pending");
                    if (outgoing.length === 0) {
                      return <Text style={styles.emptyText}>No outgoing requests sent.</Text>;
                    }
                    return outgoing.map(c => {
                      const receiver = peers.find(p => p.id === c.receiver_id);
                      if (!receiver) return null;
                      return (
                        <View key={c.id} style={styles.searchItem}>
                          <View style={styles.peerMeta}>
                            <Text style={styles.peerName}>{receiver.name}</Text>
                            <Text style={styles.peerTrack}>{receiver.focusDomain} · {receiver.proficiency}</Text>
                          </View>
                          <Text style={styles.statusLabel}>Pending Approval</Text>
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
        <View style={styles.chatPane}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.backButton}>
              <Feather name="arrow-left" size={18} color="#0f172a" />
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
              <Text style={styles.headerName} numberOfLines={1}>{activeConv.peer.name}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Track: {activeConv.peer.focusDomain} · {activeConv.peer.currentCourse}
              </Text>
            </View>
          </View>

          {/* Conversation Message List */}
          <ScrollView 
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingMore && <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 8 }} />}
            
            {messages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              return (
                <View key={m.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, isMe ? styles.textWhite : styles.textDark]}>
                      {m.message}
                    </Text>
                    <View style={styles.msgMeta}>
                      <Text style={[styles.msgTime, isMe ? styles.timeMe : styles.timeThem]}>
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

          {/* Footer Input Bar */}
          <View style={styles.chatFooter}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your message..."
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={!draft.trim()}
              style={[styles.sendButton, !draft.trim() && styles.disabledSendButton]}
            >
              <Feather name="send" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
});
