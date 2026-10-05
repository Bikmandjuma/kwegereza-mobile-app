import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { PenLine, Clock } from "lucide-react-native";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { listPublishedIfaida } from "../api/ifaida";
import { assetUrl } from "../utils/assetUrl";

type IfaidaPost = {
  id: string;
  title: string;
  authorName: string | null;
  coverImage: string | null;
  category: string | null;
  readingMinutes: number;
  publishedAt: string;
};

export default function IfaidaListScreen({ navigation }: any) {
  const [posts, setPosts] = useState<IfaidaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listPublishedIfaida()
      .then((res) => setPosts(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."))
      .finally(() => setLoading(false));
  }, []);

  function renderItem({ item }: { item: IfaidaPost }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("IfaidaDetail", { id: item.id, title: item.title })}
      >
        <View style={styles.cover}>
          {item.coverImage ? (
            <Image source={{ uri: assetUrl(item.coverImage) }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverFallback}>
              <PenLine size={32} color="rgba(255,255,255,0.35)" />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          {item.category && <Text style={styles.category}>{item.category}</Text>}
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            {item.authorName && (
              <Text style={styles.meta} numberOfLines={1}>
                Yanditswe na <Text style={styles.metaBold}>{item.authorName}</Text>
              </Text>
            )}
            <View style={styles.readingTime}>
              <Clock size={11} color={colors.inkSoft} />
              <Text style={styles.readingTimeText}>{item.readingMinutes} min</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Inyandiko" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !loading && posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nta nyandiko yatangajwe kugeza ubu.</Text>
        </View>
      ) : (
        <FlatList data={posts} keyExtractor={(p) => p.id} renderItem={renderItem} contentContainerStyle={styles.listContent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: "center" },
  listContent: { padding: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  cover: { height: 150 },
  coverImage: { width: "100%", height: "100%" },
  coverFallback: { flex: 1, backgroundColor: colors.green950, alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 14 },
  category: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.gold600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.green950, lineHeight: 24, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, flex: 1 },
  metaBold: { fontFamily: fonts.bodyBold, color: colors.green900 },
  readingTime: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
  readingTimeText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
});
