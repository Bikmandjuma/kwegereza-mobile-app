import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiveKitRoom, AudioSession } from "@livekit/react-native";
import { useLocalParticipant, useRemoteParticipants, useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Mic, MicOff, Hand, PhoneOff, Users, Lock, Unlock } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useLiveClass } from "../hooks/useLiveClass";
import { getToken } from "../api/client";

type Participant = {
  userId: string;
  fullName: string;
  role: "HOST" | "STUDENT";
  micState: "HOST" | "MUTED" | "APPROVED";
  handRaised: boolean;
};
type SelfState = { userId: string; role: "HOST" | "STUDENT"; micState: string; handRaised: boolean };

const MIC_LABEL: Record<string, string> = { HOST: "Umuyobozi", MUTED: "Yacecetse", APPROVED: "Yemerewe kuvuga" };

/**
 * Everything LiveKit-specific (useLocalParticipant, useRemoteParticipants)
 * only works INSIDE <LiveKitRoom>'s context -- this inner component is
 * what actually renders once connected; the outer ClassroomJoinGate
 * below handles the join handshake (getting a livekitUrl/token from the
 * backend) before this ever mounts.
 */
function InClassroom({
  liveClassId,
  title,
  rt,
  onLeave,
}: {
  liveClassId: string;
  title: string;
  rt: ReturnType<typeof useLiveClass>;
  onLeave: () => void;
}) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const [self, setSelf] = useState<SelfState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [locked, setLocked] = useState(false);

  const isHost = self?.role === "HOST";

  useEffect(() => {
    const offJoined = rt.onParticipantJoined((p: Participant) =>
      setParticipants((prev) => (prev.some((x) => x.userId === p.userId) ? prev : [...prev, p]))
    );
    const offUpdated = rt.onParticipantUpdated((p: Participant) => {
      setParticipants((prev) => prev.map((x) => (x.userId === p.userId ? p : x)));
      if (p.userId === user?.id) setSelf((s) => (s ? { ...s, ...p } : s));
    });
    const offBulk = rt.onParticipantsBulkUpdate((list: Participant[]) => setParticipants(list));
    const offLeft = rt.onParticipantLeft(({ userId }: { userId: string }) =>
      setParticipants((prev) => prev.filter((x) => x.userId !== userId))
    );
    const offHandRaised = rt.onHandRaised(({ userId }: { userId: string }) =>
      setParticipants((prev) => prev.map((x) => (x.userId === userId ? { ...x, handRaised: true } : x)))
    );
    const offApproved = rt.onSpeakerApproved(() =>
      setSelf((s) => (s ? { ...s, micState: "APPROVED", handRaised: false } : s))
    );
    const offRevoked = rt.onSpeakerRevoked(() => {
      setSelf((s) => (s ? { ...s, micState: "MUTED" } : s));
      localParticipant.setMicrophoneEnabled(false).catch(() => {});
    });
    const offMutedAll = rt.onMutedAll(() => {
      if (self?.role !== "HOST") localParticipant.setMicrophoneEnabled(false).catch(() => {});
    });
    const offLocked = rt.onLocked(() => setLocked(true));
    const offUnlocked = rt.onUnlocked(() => setLocked(false));
    const offRemoved = rt.onRemoved(() => onLeave());
    const offEnded = rt.onClassEnded(() => onLeave());

    return () => {
      offJoined();
      offUpdated();
      offBulk();
      offLeft();
      offHandRaised();
      offApproved();
      offRevoked();
      offMutedAll();
      offLocked();
      offUnlocked();
      offRemoved();
      offEnded();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [self?.role]);

  async function handleToggleMic() {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      /* permission denied or similar -- LiveKit surfaces this via lastMicrophoneError if needed later */
    }
  }

  const otherParticipants = participants.filter((p) => p.userId !== user?.id);
  const connected = connectionState === ConnectionState.Connected;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? colors.emerald600 : colors.gold500 }]} />
            <Text style={styles.statusText}>{connected ? "Connected" : "Turahuza..."}</Text>
            {locked && <Lock size={11} color={colors.inkSoft} />}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => (isHost ? rt.endClass(liveClassId) : onLeave())}
          style={styles.leaveButton}
        >
          <PhoneOff size={15} color={colors.white} />
          <Text style={styles.leaveButtonText}>{isHost ? "Soza" : "Sohoka"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.speakerCard}>
        <View style={styles.speakerAvatar}>
          <Text style={styles.speakerAvatarText}>{title[0]}</Text>
        </View>
        <Text style={styles.participantCount}>
          <Users size={12} color={colors.inkSoft} /> {participants.length} Abahari
        </Text>
      </View>

      {!isHost && self?.micState !== "APPROVED" && (
        <View style={styles.handBanner}>
          <Text style={styles.handBannerText}>
            Uzavuga gusa umuyobozi amaze kukwemerera cyangwa uzamura ukuboko.
          </Text>
          {self?.handRaised ? (
            <TouchableOpacity style={styles.handButtonActive} onPress={() => rt.lowerHand(liveClassId)}>
              <Hand size={14} color={colors.gold600} />
              <Text style={styles.handButtonActiveText}>Manura ukuboko</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.handButton} onPress={() => rt.raiseHand(liveClassId)}>
              <Hand size={14} color={colors.white} />
              <Text style={styles.handButtonText}>Zamura ukuboko</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={otherParticipants}
        keyExtractor={(p) => p.userId}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 10 }}
        ListHeaderComponent={<Text style={styles.listHeader}>ABARI KURI INTERINETI</Text>}
        renderItem={({ item }) => (
          <View style={styles.participantRow}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantAvatarText}>{item.fullName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.participantName}>{item.fullName}</Text>
              <Text style={styles.participantMeta}>{MIC_LABEL[item.micState] ?? item.micState}</Text>
            </View>
            {item.handRaised && <Hand size={14} color={colors.gold600} />}
            {isHost && (
              <TouchableOpacity
                onPress={() =>
                  item.handRaised || item.micState === "MUTED"
                    ? rt.approveSpeaker(liveClassId, item.userId)
                    : rt.revokeSpeaker(liveClassId, item.userId)
                }
                style={styles.hostActionButton}
              >
                <Text style={styles.hostActionText}>
                  {item.handRaised || item.micState === "MUTED" ? "Emerera" : "Hagarika"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {isHost && (
          <TouchableOpacity style={styles.footerIconButton} onPress={() => rt.muteAll(liveClassId)}>
            <MicOff size={18} color={colors.white} />
          </TouchableOpacity>
        )}
        {isHost && (
          <TouchableOpacity
            style={styles.footerIconButton}
            onPress={() => (locked ? rt.unlockClass(liveClassId) : rt.lockClass(liveClassId))}
          >
            {locked ? <Unlock size={18} color={colors.white} /> : <Lock size={18} color={colors.white} />}
          </TouchableOpacity>
        )}
        {(isHost || self?.micState === "APPROVED") && (
          <TouchableOpacity
            style={[styles.micButton, isMicrophoneEnabled && styles.micButtonActive]}
            onPress={handleToggleMic}
          >
            {isMicrophoneEnabled ? <Mic size={18} color={colors.white} /> : <MicOff size={18} color={colors.white} />}
            <Text style={styles.micButtonText}>{isMicrophoneEnabled ? "Hagarika Mikoro" : "Fungura Mikoro"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Handles the join handshake (Socket.IO classroom:join, which returns
 * this specific user's LiveKit token/url for THIS room) before handing
 * off to <LiveKitRoom>. Same two-layer architecture as the website:
 * Socket.IO decides who's allowed to do what; LiveKit just carries the
 * audio once that's settled.
 */
export default function LiveClassScreen({ route, navigation }: any) {
  const { id, title } = route.params;
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    getToken().then(setToken);
  }, []);
  const rt = useLiveClass(token);

  const [joinError, setJoinError] = useState("");
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!rt.connected || joinedRef.current) return;
    joinedRef.current = true;
    rt.joinClass(id)
      .then((ack: any) => {
        setLivekitUrl(ack.livekitUrl);
        setLivekitToken(ack.livekitToken);
      })
      .catch((err: Error) => setJoinError(err.message));
  }, [rt.connected, id, rt]);

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  function handleLeave() {
    navigation.goBack();
  }

  if (joinError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{joinError}</Text>
      </View>
    );
  }
  if (!livekitUrl || !livekitToken) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green700} />
        <Text style={styles.loadingText}>Turi kwinjira mu isomo...</Text>
      </View>
    );
  }

  return (
    <LiveKitRoom serverUrl={livekitUrl} token={livekitToken} audio={false} connect onDisconnected={handleLeave}>
      <InClassroom liveClassId={id} title={title} rt={rt} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, gap: 10, paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.green950 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  leaveButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.red600, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  leaveButtonText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  speakerCard: { alignItems: "center", paddingVertical: 20 },
  speakerAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.green900, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  speakerAvatarText: { fontFamily: fonts.displayRegular, fontWeight: "700", fontSize: 28, color: colors.white },
  participantCount: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  handBanner: { marginHorizontal: 16, backgroundColor: "#EFF6FF", borderRadius: 14, padding: 14, marginBottom: 8 },
  handBannerText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginBottom: 10 },
  handButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 10 },
  handButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  handButtonActive: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.gold100, borderRadius: 12, paddingVertical: 10 },
  handButtonActiveText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold600 },
  listHeader: { fontFamily: fonts.bodyExtraBold, fontSize: 10, color: colors.inkSoft, letterSpacing: 0.5, marginBottom: 8 },
  participantRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: 14, padding: 10, marginBottom: 8 },
  participantAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.green900, alignItems: "center", justifyContent: "center" },
  participantAvatarText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
  participantName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  participantMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 1 },
  hostActionButton: { backgroundColor: colors.cream2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  hostActionText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.green950 },
  footerIconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  micButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.gold500, borderRadius: 14, paddingVertical: 12 },
  micButtonActive: { backgroundColor: "rgba(16,185,129,0.9)" },
  micButtonText: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: colors.white },
});
