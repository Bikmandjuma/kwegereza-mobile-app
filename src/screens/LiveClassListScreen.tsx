import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Radio, Calendar, Lock } from "lucide-react-native";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { listActiveLiveClasses, listUpcomingLiveClasses, createLiveClass, startScheduledLiveClass } from "../api/liveClasses";
import { useAuth } from "../context/AuthContext";
import { hasPermission, isAdminTier } from "../utils/roles";

type LiveClassSummary = {
  id: string;
  title: string;
  hostName: string;
  hostId: string;
  locked?: boolean;
  scheduledFor?: string;
};

export default function LiveClassListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [active, setActive] = useState<LiveClassSummary[]>([]);
  const [upcoming, setUpcoming] = useState<LiveClassSummary[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const canHost = isAdminTier(user?.role) || hasPermission(user, "classroom.host");

  const load = useCallback(() => {
    Promise.all([listActiveLiveClasses(), listUpcomingLiveClasses()])
      .then(([liveRes, upcomingRes]) => {
        setActive(liveRes.data);
        setUpcoming(upcomingRes.data);
      })
      .catch((err) => setError(err.message || "Habaye ikibazo."));
  }, []);

  useFocusEffect(load);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await createLiveClass(newTitle.trim(), null);
      setNewTitle("");
      navigation.navigate("LiveClass", { id: res.data.liveClass.id, title: res.data.liveClass.title });
    } catch (err: any) {
      setError(err.message || "Habaye ikibazo.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStartScheduled(item: LiveClassSummary) {
    try {
      await startScheduledLiveClass(item.id);
      navigation.navigate("LiveClass", { id: item.id, title: item.title });
    } catch (err: any) {
      setError(err.message || "Habaye ikibazo.");
    }
  }

  return (
    <View style={styles.container}>
      <TopBar title="Live Class" />
      <FlatList
        data={[]}
        keyExtractor={() => "x"}
        renderItem={null}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {canHost && (
              <View style={styles.createCard}>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Umutwe w'isomo..."
                  placeholderTextColor={colors.inkSoft}
                  style={styles.createInput}
                />
                <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={creating}>
                  <Radio size={15} color={colors.white} />
                  <Text style={styles.createButtonText}>{creating ? "Turatangira..." : "Tangira Isomo"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.sectionTitle}>Ariho ubu</Text>
            {active.length === 0 ? (
              <Text style={styles.emptyText}>Nta somo riri live ubu.</Text>
            ) : (
              active.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.classRow}
                  onPress={() => navigation.navigate("LiveClass", { id: c.id, title: c.title })}
                >
                  <View style={styles.liveDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={styles.classMeta}>{c.hostName}</Text>
                  </View>
                  {c.locked && <Lock size={14} color={colors.inkSoft} />}
                </TouchableOpacity>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ateganyijwe</Text>
            {upcoming.length === 0 ? (
              <Text style={styles.emptyText}>Nta somo riteganyijwe ubu.</Text>
            ) : (
              upcoming.map((c) => (
                <View key={c.id} style={styles.classRow}>
                  <Calendar size={16} color={colors.gold600} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={styles.classMeta}>{c.hostName}</Text>
                  </View>
                  {c.hostId === user?.id && (
                    <TouchableOpacity style={styles.startNowButton} onPress={() => handleStartScheduled(c)}>
                      <Text style={styles.startNowText}>Tangira ubu</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  createCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 18, gap: 10 },
  createInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  createButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.gold500, borderRadius: 12, paddingVertical: 12 },
  createButtonText: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: colors.white },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.red600, marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 11, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  emptyText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginBottom: 8 },
  classRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.red600 },
  classTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  classMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 1 },
  startNowButton: { backgroundColor: colors.gold500, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  startNowText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.white },
});
