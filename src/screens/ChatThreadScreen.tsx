import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Send } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useChatSocket, ChatMessage } from "../hooks/useChatSocket";
import { getToken } from "../api/client";
import { listMessages, markConversationRead } from "../api/chat";
import { dateDividerLabel, isNewDay } from "../utils/dateDivider";
import { timeAgo } from "../utils/timeAgo";

export default function ChatThreadScreen({ route, navigation }: any) {
  const { conversationId, title } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    getToken().then(setToken);
  }, []);
  const rt = useChatSocket(token);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listMessages(conversationId)
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!rt.connected) return undefined;
    rt.joinConversation(conversationId).catch(() => {});
    const offMessage = rt.onNewMessage((msg) => {
      if (msg.conversationId !== conversationId) return;
      // Dedup by id -- the sender's own optimistic/ack path and this
      // broadcast can both try to add the same message; same reasoning
      // as the web app's chat (see its own ChatPage.jsx comments on
      // this exact race).
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      markConversationRead(conversationId).catch(() => {});
    });
    const offTyping = rt.onTyping((payload: any) => {
      if (payload.conversationId !== conversationId || payload.userId === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (payload.isTyping) next.add(payload.userId);
        else next.delete(payload.userId);
        return next;
      });
    });
    return () => {
      offMessage();
      offTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt.connected, conversationId]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    rt.emitTyping(conversationId, false);
    try {
      const ack: any = await rt.sendMessage(conversationId, body);
      // Own message isn't optimistically added here -- the server
      // always echoes message:new back to the sender too (they're a
      // room member), so there's exactly one code path that adds a
      // bubble to the screen, same as the web app.
      void ack;
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  function handleDraftChange(text: string) {
    setDraft(text);
    rt.emitTyping(conversationId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => rt.emitTyping(conversationId, false), 1500);
  }

  // FlatList is rendered `inverted`, so the data array itself needs
  // reversing (newest first) -- this also makes the date-divider logic
  // below compare against the NEXT item (chronologically later,
  // appearing visually above in inverted order) rather than the
  // previous one.
  const reversed = [...messages].reverse();

  function renderItem({ item, index }: { item: ChatMessage; index: number }) {
    const mine = item.senderId === user?.id;
    const chronologicallyNext = reversed[index - 1];
    const showDivider = isNewDay(item.createdAt, chronologicallyNext?.createdAt ?? null);
    return (
      <View>
        <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body as string}</Text>
            <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        {showDivider && (
          <View style={styles.divider}>
            <Text style={styles.dividerText}>{dateDividerLabel(item.createdAt)}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {typingUsers.size > 0 && <Text style={styles.typingText}>Arandika...</Text>}
        </View>
      </View>

      <FlatList
        data={reversed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.listContent}
        style={{ flex: 1 }}
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          value={draft}
          onChangeText={handleDraftChange}
          placeholder="Andika ubutumwa..."
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
        >
          <Send size={17} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  typingText: { fontFamily: fonts.body, fontSize: 12, color: colors.green700, marginTop: 1 },
  listContent: { paddingHorizontal: 14, paddingVertical: 10 },
  bubbleRow: { marginVertical: 2 },
  bubbleRowMine: { alignItems: "flex-end" },
  bubbleRowTheirs: { alignItems: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: colors.green700, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.line },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { fontFamily: fonts.body, fontSize: 10, color: colors.inkSoft, marginTop: 3, alignSelf: "flex-end" },
  bubbleTimeMine: { color: "rgba(255,255,255,0.75)" },
  divider: { alignItems: "center", marginVertical: 10 },
  dividerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    backgroundColor: colors.cream2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green700,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
});
