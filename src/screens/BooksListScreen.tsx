import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput } from "react-native";
import { Search, BookOpen, Lock } from "lucide-react-native";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { getPublishedBooks } from "../api/books";
import { assetUrl } from "../utils/assetUrl";

type Book = {
  id: string;
  title: string;
  author: string | null;
  coverImage: string | null;
  fileUrl: string | null;
  // true only for an anonymous/guest request on a non-free book --
  // never true for an authenticated user, same pattern the web app's
  // dars content uses (see DarsCards.jsx's own comment on this).
  locked: boolean;
};

export default function BooksListScreen({ navigation }: any) {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((q: string) => {
    setLoading(true);
    getPublishedBooks(q ? { search: q } : {})
      .then((res) => setBooks(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  function renderItem({ item }: { item: Book }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (item.locked) {
            navigation.navigate("Login");
            return;
          }
          navigation.navigate("BookReader", { id: item.id, title: item.title, fileUrl: item.fileUrl });
        }}
      >
        <View style={styles.cover}>
          {item.coverImage ? (
            <Image
              source={{ uri: assetUrl(item.coverImage) }}
              style={[styles.coverImage, item.locked && styles.coverLocked]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverFallback}>
              <BookOpen size={28} color={colors.gold400} />
            </View>
          )}
          {item.locked && (
            <View style={styles.lockOverlay}>
              <Lock size={18} color={colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {item.locked ? "Injira kugira ngo usome" : item.author || "—"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Isomero" />
      <View style={styles.searchBar}>
        <Search size={15} color={colors.inkSoft} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Shakisha igitabo..."
          placeholderTextColor={colors.inkSoft}
          style={styles.searchInput}
        />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !loading && books.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {search ? `Nta gitabo cyabonetse kuri "${search}".` : "Nta gitabo cyatangajwe kugeza ubu."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: "center" },
  listContent: { padding: 16 },
  row: { gap: 14 },
  card: { flex: 1, marginBottom: 20 },
  cover: { height: 160, borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  coverImage: { width: "100%", height: "100%" },
  coverLocked: { opacity: 0.5 },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverFallback: {
    flex: 1,
    backgroundColor: colors.green950,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.displayRegular, fontSize: 15, fontWeight: "700", color: colors.green950 },
  author: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
});
