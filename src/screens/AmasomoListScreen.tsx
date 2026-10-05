import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Headphones, Video, Play, Pause, Lock, PlayCircle } from "lucide-react-native";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { getPublishedDarsat, trackDarsPlay } from "../api/dars";
import { assetUrl } from "../utils/assetUrl";

type Dars = {
  id: string;
  title: string;
  description: string | null;
  type: "AUDIO" | "VIDEO";
  thumbnail: string | null;
  audio: string | null;
  youtubeUrl: string | null;
  teacherName: string | null;
  plays: number;
  locked: boolean;
};

const TABS: { key: "AUDIO" | "VIDEO"; label: string; icon: typeof Headphones }[] = [
  { key: "AUDIO", label: "Amasomo y'amajwi", icon: Headphones },
  { key: "VIDEO", label: "Amasomo ya amashusho", icon: Video },
];

/** One row = one audio lesson, with its own inline play/pause and a
 * single shared player instance passed down so only one lesson plays
 * at a time (starting a second one stops whatever was already playing,
 * the behavior anyone would expect). */
function AudioRow({
  dars,
  isActive,
  onPlay,
  player,
}: {
  dars: Dars;
  isActive: boolean;
  onPlay: (dars: Dars) => void;
  player: ReturnType<typeof useAudioPlayer>;
}) {
  const status = useAudioPlayerStatus(player);
  const playing = isActive && status.playing;

  if (dars.locked) {
    return (
      <View style={[styles.audioRow, styles.audioRowLocked]}>
        <View style={styles.playButton}>
          <Lock size={16} color={colors.inkSoft} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            {dars.title}
          </Text>
          <Text style={styles.audioMeta}>Injira kugira ngo wumve</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.audioRow}>
      <TouchableOpacity
        style={[styles.playButton, playing && styles.playButtonActive]}
        onPress={() => onPlay(dars)}
      >
        {playing ? <Pause size={16} color={colors.white} /> : <Play size={16} color={colors.white} />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.audioTitle} numberOfLines={1}>
          {dars.title}
        </Text>
        <Text style={styles.audioMeta} numberOfLines={1}>
          {dars.teacherName || "—"} · {dars.plays} abumvise
        </Text>
        {isActive && status.duration > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(status.currentTime / status.duration) * 100}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function AmasomoListScreen({ navigation }: any) {
  const [tab, setTab] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [darsat, setDarsat] = useState<Dars[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const trackedPlayIds = useRef(new Set<string>());

  // One shared player instance: switching which lesson is "active" just
  // replaces its source, rather than juggling a separate player per row
  // (which would mean carefully stopping the previous one every time).
  const player = useAudioPlayer(null);

  useEffect(() => {
    setLoading(true);
    getPublishedDarsat({ type: tab })
      .then((res) => setDarsat(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."))
      .finally(() => setLoading(false));
  }, [tab]);

  const handlePlayAudio = useCallback(
    (dars: Dars) => {
      if (activeAudioId === dars.id) {
        if (player.playing) player.pause();
        else player.play();
        return;
      }
      player.replace({ uri: assetUrl(dars.audio) });
      player.play();
      setActiveAudioId(dars.id);
      if (!trackedPlayIds.current.has(dars.id)) {
        trackedPlayIds.current.add(dars.id);
        trackDarsPlay(dars.id).catch(() => {});
      }
    },
    [activeAudioId, player]
  );

  function renderItem({ item }: { item: Dars }) {
    if (tab === "AUDIO") {
      return <AudioRow dars={item} isActive={activeAudioId === item.id} onPlay={handlePlayAudio} player={player} />;
    }
    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => {
          if (item.locked) {
            navigation.navigate("Login");
            return;
          }
          navigation.navigate("VideoWatch", { id: item.id, title: item.title, youtubeUrl: item.youtubeUrl });
        }}
      >
        <View style={styles.videoThumb}>
          {item.thumbnail ? (
            <Image
              source={{ uri: assetUrl(item.thumbnail) }}
              style={[styles.videoThumbImage, item.locked && styles.lockedImage]}
            />
          ) : (
            <View style={styles.videoThumbFallback}>
              <Video size={24} color={colors.gold400} />
            </View>
          )}
          <View style={styles.videoThumbOverlay}>
            {item.locked ? <Lock size={20} color={colors.white} /> : <PlayCircle size={28} color="rgba(255,255,255,0.9)" />}
          </View>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.videoMeta} numberOfLines={1}>
          {item.locked ? "Injira kugira ngo urebe" : item.teacherName || "—"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Amasomo" />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => {
              setTab(t.key);
              setActiveAudioId(null);
              player.pause();
            }}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <t.icon size={15} color={tab === t.key ? colors.white : colors.inkSoft} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !loading && darsat.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nta somo ryatangajwe kugeza ubu muri iki cyiciro.</Text>
        </View>
      ) : tab === "AUDIO" ? (
        <FlatList data={darsat} keyExtractor={(d) => d.id} renderItem={renderItem} contentContainerStyle={styles.listContent} />
      ) : (
        <FlatList
          data={darsat}
          keyExtractor={(d) => d.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  tabActive: { backgroundColor: colors.green950 },
  tabLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  tabLabelActive: { color: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: "center" },
  listContent: { padding: 16 },
  row: { gap: 14 },

  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  audioRowLocked: { opacity: 0.7 },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.gold500,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonActive: { backgroundColor: colors.green700 },
  audioTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  audioMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: colors.cream2, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.green700, borderRadius: 2 },

  videoCard: { flex: 1, marginBottom: 20 },
  videoThumb: { height: 110, borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  videoThumbImage: { width: "100%", height: "100%" },
  lockedImage: { opacity: 0.5 },
  videoThumbFallback: { flex: 1, backgroundColor: colors.green950, alignItems: "center", justifyContent: "center" },
  videoThumbOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  videoTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green950, lineHeight: 17 },
  videoMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
});
