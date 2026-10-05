import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from "react-native";
import RenderHTML from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, User, Clock } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { getPublishedIfaida } from "../api/ifaida";
import { assetUrl } from "../utils/assetUrl";

type IfaidaDetail = {
  id: string;
  title: string;
  authorName: string | null;
  coverImage: string | null;
  category: string | null;
  readingMinutes: number;
  publishedAt: string;
  content: string;
};

export default function IfaidaDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [post, setPost] = useState<IfaidaDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublishedIfaida(id)
      .then((res) => setPost(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."));
  }, [id]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !post ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.green700} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {post.category && <Text style={styles.category}>{post.category}</Text>}
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.metaRow}>
            {post.authorName && (
              <View style={styles.metaItem}>
                <User size={13} color={colors.inkSoft} />
                <Text style={styles.metaText}>{post.authorName}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.inkSoft} />
              <Text style={styles.metaText}>{post.readingMinutes} min</Text>
            </View>
            {post.publishedAt && (
              <Text style={styles.metaText}>{new Date(post.publishedAt).toLocaleDateString("rw-RW")}</Text>
            )}
          </View>

          {post.coverImage && (
            <Image source={{ uri: assetUrl(post.coverImage) }} style={styles.cover} resizeMode="cover" />
          )}

          <RenderHTML
            contentWidth={width - 40}
            source={{ html: post.content }}
            baseStyle={styles.htmlBase}
            tagsStyles={{
              p: { marginBottom: 14, lineHeight: 24 },
              h2: { fontFamily: fonts.display, color: colors.green950, marginTop: 20, marginBottom: 10 },
              h3: { fontFamily: fonts.display, color: colors.green950, marginTop: 16, marginBottom: 8 },
              a: { color: colors.green700 },
              blockquote: {
                borderLeftWidth: 3,
                borderLeftColor: colors.gold500,
                paddingLeft: 14,
                marginVertical: 12,
                fontStyle: "italic",
              },
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 14, paddingBottom: 10 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream2,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  scrollContent: { padding: 20, paddingTop: 4 },
  category: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.gold600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.green950, lineHeight: 34, marginBottom: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 18 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  cover: { width: "100%", height: 200, borderRadius: 16, marginBottom: 20 },
  htmlBase: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});
