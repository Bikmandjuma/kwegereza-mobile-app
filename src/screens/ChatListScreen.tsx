import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Users, MessageCircleOff } from "lucide-react-native";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { listConversations } from "../api/chat";
import { timeAgo } from "../utils/timeAgo";
import { useAuth } from "../context/AuthContext";

type ConversationItem = {
  id: string;
  isGenderRoom: boolean;
  genderRoomLabel: string | null;
  participantCount?: number;
  otherUser: { id: string; fullName: string; role: string } | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};

export default function ChatListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await listConversations();
      setConversations(res.data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Habaye ikibazo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time this screen gains focus -- not just on mount --
  // so returning from a conversation thread shows its updated last
  // message/unread state immediately, matching what someone would
  // expect from switching tabs in WhatsApp.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function renderItem({ item }: { item: ConversationItem }) {
    const title = item.isGenderRoom ? item.genderRoomLabel ?? "Ikiganiro" : item.otherUser?.fullName ?? "Umuntu";
    const subtitle = item.lastMessage
      ? `${item.lastMessage.senderId === user?.id ? "Wowe: " : ""}${item.lastMessage.body}`
      : "Nta butumwa buriho ubu";

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("ChatThread", { conversationId: item.id, title })}
      >
        <View style={styles.avatar}>
          {item.isGenderRoom ? (
            <Users size={20} color={colors.white} />
          ) : (
            <Text style={styles.avatarText}>{title[0]}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {title}
              {item.isGenderRoom && item.participantCount ? ` (${item.participantCount})` : ""}
            </Text>
            {item.lastMessage && <Text style={styles.time}>{timeAgo(item.lastMessage.createdAt)}</Text>}
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.preview} numberOfLines={1}>
              {subtitle}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount > 9 ? "9+" : item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Kwegereza Chat" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !loading && conversations.length === 0 ? (
        <View style={styles.center}>
          <MessageCircleOff size={32} color={colors.inkSoft} />
          <Text style={styles.emptyText}>Nta kiganiro uriho ubu.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green900,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontFamily: fonts.bodyExtraBold, fontSize: 18 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, flex: 1, marginRight: 8 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, flexShrink: 0 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  preview: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, flex: 1, marginRight: 8 },
  unreadBadge: {
    backgroundColor: colors.green700,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 11 },
  separator: { height: 1, backgroundColor: colors.line, marginLeft: 78 },
});
