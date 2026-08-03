import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/skillora/Header";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { fetchDBContacts, fetchDBMessages, sendDBMessage, saveDBReply } from "../lib/supabase-db";

type Contact = {
  id: string; name: string; role: string; initials: string; online: boolean; last: string; unread: number; colors: string[];
};

type Msg = { id: string; from: "me" | "them"; text: string; time: string; read?: boolean };

export default function ChatScreen() {
  const store = useDashboardStore();
  const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"list" | "chat">("list");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      try {
        const dbContacts = await fetchDBContacts(focusDomain);
        setContacts(dbContacts as any);
        if (dbContacts.length > 0) {
          setActiveId((prev) => dbContacts.find((c) => c.id === prev) ? prev : dbContacts[0].id);
        }
      } catch (err) {
        console.warn("Failed to load contacts from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, [focusDomain]);

  useEffect(() => {
    if (!activeId || contacts.length === 0) return;
    async function loadMessages() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const activeContact = contacts.find((c) => c.id === activeId);
          const welcomeMsg = activeContact?.last || "Hello!";
          const dbMsgs = await fetchDBMessages(user.id, activeId!, welcomeMsg);
          setMessages(dbMsgs);
        }
      } catch (err) {
        console.warn("Failed to load messages from Supabase:", err);
      }
    }
    loadMessages();
  }, [activeId, contacts]);

  const active = contacts.find((c) => c.id === activeId) || contacts[0] || null;
  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    // Auto Scroll to bottom when keyboard opens or a new message arrives
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, typing, activeId, viewState]);

  const send = async () => {
    if (!draft.trim() || !activeId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const text = draft.trim();
    setDraft("");
    setTyping(true);

    try {
      const newMsg = await sendDBMessage(user.id, activeId, text);
      setMessages((prev) => [...prev, newMsg]);

      // Simulate AI Mentor reply
      setTimeout(async () => {
        try {
          const { generateAICoachResponse } = await import("../lib/ai-coach");
          const historyPlain = messages.map(m => ({ from: m.from, text: m.text }));
          historyPlain.push({ from: "me", text });

          const replyText = generateAICoachResponse(
            text,
            historyPlain,
            active?.role || "Mentor",
            focusDomain
          );

          const replyMsg = await saveDBReply(user.id, activeId, replyText);
          setMessages((prev) => [...prev, replyMsg]);
        } catch (err) {
          console.warn("Failed to save AI reply to Supabase:", err);
        } finally {
          setTyping(false);
        }
      }, 1000);
    } catch (err) {
      console.warn("Failed to send message:", err);
      setTyping(false);
    }
  };

  const handleContactPress = (id: string) => {
    setActiveId(id);
    setViewState("chat");
  };

  if (loading || !active) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#6366f1" />
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
        // 1. Contacts List Pane
        <View style={styles.pane}>
          <ScrollView style={styles.scrollWrapper} showsVerticalScrollIndicator={false}>
            <Header />
            <Text style={styles.paneTitle}>Messages</Text>
            
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Feather name="search" size={14} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search connections"
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
            </View>

            {/* Contacts Grid */}
            <View style={styles.contactsList}>
              {filtered.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleContactPress(c.id)}
                  style={[styles.contactItem, c.id === activeId && styles.activeContactItem]}
                >
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={c.colors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.chatAvatar}
                    >
                      <Text style={styles.chatAvatarText}>{c.initials}</Text>
                    </LinearGradient>
                    {c.online && <View style={styles.onlineBadge} />}
                  </View>

                  <View style={styles.contactDetails}>
                    <View style={styles.contactHeaderRow}>
                      <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
                      {c.unread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{c.unread}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.contactLastMsg} numberOfLines={1}>{c.last}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        // 2. Active Chat Detail Pane
        <View style={styles.chatPane}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setViewState("list")} style={styles.backButton}>
              <Feather name="arrow-left" size={18} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.chatHeaderAvatarWrapper}>
              <LinearGradient
                colors={active.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chatHeaderAvatar}
              >
                <Text style={styles.chatHeaderAvatarText}>{active.initials}</Text>
              </LinearGradient>
              {active.online && <View style={styles.headerOnlineBadge} />}
            </View>

            <View style={styles.chatHeaderMeta}>
              <Text style={styles.headerName} numberOfLines={1}>{active.name}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {active.online ? "Active now" : "Offline"} · {active.role}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.moreButton}>
              <Feather name="more-vertical" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.warningStrip}>
            <Text style={styles.warningText}>
              Connection approved · Contact details hidden to protect privacy
            </Text>
          </View>

          {showInfo ? (
            // Auxiliary Contact Info Panel inside the messaging thread on mobile
            <View style={styles.infoOverlay}>
              <LinearGradient
                colors={active.colors as any}
                style={styles.infoOverlayAvatar}
              >
                <Text style={styles.infoOverlayAvatarText}>{active.initials}</Text>
              </LinearGradient>
              <Text style={styles.infoOverlayName}>{active.name}</Text>
              <Text style={styles.infoOverlayRole}>{active.role}</Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Connection Status</Text>
                <Text style={styles.infoBoxValue}>Approved · Mar 12, 2026</Text>
              </View>

              <TouchableOpacity style={styles.reportBtn}>
                <Feather name="alert-circle" size={14} color="#64748b" />
                <Text style={styles.reportBtnText}>Report User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.blockBtn}>
                <Feather name="slash" size={14} color="#ef4444" />
                <Text style={styles.blockBtnText}>Block Connection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowInfo(false)} style={styles.closeInfoBtn}>
                <Text style={styles.closeInfoText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Message List
            <ScrollView 
              ref={scrollViewRef} 
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => {
                const isMe = m.from === "me";
                return (
                  <View key={m.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                      <Text style={[styles.bubbleText, isMe ? styles.textWhite : styles.textDark]}>
                        {m.text}
                      </Text>
                      <View style={styles.msgMeta}>
                        <Text style={[styles.msgTime, isMe ? styles.timeMe : styles.timeThem]}>
                          {m.time}
                        </Text>
                        {isMe && <Feather name="check" size={10} color="rgba(255,255,255,0.7)" />}
                      </View>
                    </View>
                  </View>
                );
              })}

              {typing && (
                <View style={styles.typingContainer}>
                  <View style={styles.typingBubble}>
                    <View style={styles.typingDot} />
                    <View style={[styles.typingDot, styles.typingDelay1]} />
                    <View style={[styles.typingDot, styles.typingDelay2]} />
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Typing area */}
          {!showInfo && (
            <View style={styles.inputBar}>
              <TouchableOpacity style={styles.attachBtn}>
                <Feather name="paperclip" size={16} color="#64748b" />
              </TouchableOpacity>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message…"
                placeholderTextColor="#94a3b8"
                style={styles.messageInput}
              />
              <TouchableOpacity 
                onPress={send} 
                disabled={!draft.trim()}
                style={[styles.sendBtn, !draft.trim() && styles.disabledSendBtn]}
              >
                <Feather name="send" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  pane: {
    flex: 1,
  },
  scrollWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  paneTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 12,
    color: "#0f172a",
    flex: 1,
    padding: 0,
  },
  contactsList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 12,
  },
  activeContactItem: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  avatarContainer: {
    position: "relative",
  },
  chatAvatar: {
    height: 42,
    width: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  chatAvatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  onlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#0d9488",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  contactDetails: {
    flex: 1,
    minWidth: 0,
  },
  contactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  unreadBadge: {
    height: 18,
    minWidth: 18,
    borderRadius: 9,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  contactLastMsg: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  chatPane: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    marginRight: 10,
    padding: 2,
  },
  chatHeaderAvatarWrapper: {
    position: "relative",
  },
  chatHeaderAvatar: {
    height: 36,
    width: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  chatHeaderAvatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  headerOnlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    height: 9,
    width: 9,
    borderRadius: 4.5,
    backgroundColor: "#0d9488",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  chatHeaderMeta: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  headerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  moreButton: {
    padding: 4,
  },
  warningStrip: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  warningText: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
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
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    backgroundColor: "#6366f1",
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 16,
  },
  textWhite: {
    color: "#ffffff",
  },
  textDark: {
    color: "#0f172a",
  },
  msgMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  msgTime: {
    fontSize: 8,
  },
  timeMe: {
    color: "rgba(255,255,255,0.7)",
  },
  timeThem: {
    color: "#94a3b8",
  },
  typingContainer: {
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typingDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: "#94a3b8",
  },
  typingDelay1: {
    opacity: 0.6,
  },
  typingDelay2: {
    opacity: 0.3,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    gap: 8,
  },
  attachBtn: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  messageInput: {
    flex: 1,
    fontSize: 12,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxHeight: 72,
  },
  sendBtn: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSendBtn: {
    opacity: 0.5,
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    padding: 24,
  },
  infoOverlayAvatar: {
    height: 72,
    width: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  infoOverlayAvatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 24,
  },
  infoOverlayName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  infoOverlayRole: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    marginBottom: 16,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  infoBoxValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 2,
  },
  reportBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 8,
  },
  reportBtnText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  blockBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 16,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 20,
  },
  blockBtnText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  closeInfoBtn: {
    padding: 6,
  },
  closeInfoText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "700",
  },
});
