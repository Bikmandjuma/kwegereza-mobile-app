import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { youtubeVideoId } from "../utils/youtube";
import { trackDarsPlay } from "../api/dars";

/**
 * All video lessons are YouTube-hosted (see the web app's own
 * VideoWatch.jsx), so this plays them the same way the website does --
 * the YouTube IFrame embed -- just inside a WebView's own minimal HTML
 * page instead of a browser tab. A dedicated native YouTube player
 * library would need its own native module and custom build, same
 * tradeoff as everything else in this phase; the plain iframe embed
 * works today with no such requirement.
 */
export default function VideoWatchScreen({ route, navigation }: any) {
  const { id, title, youtubeUrl } = route.params;
  const insets = useSafeAreaInsets();
  const tracked = useRef(false);

  const videoId = youtubeVideoId(youtubeUrl);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackDarsPlay(id).catch(() => {});
  }, [id]);

  const html = `
    <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0;background:#000;">
      <iframe
        width="100%" height="100%"
        style="position:fixed;top:0;left:0;width:100%;height:100%;border:0;"
        src="https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0"
        allow="autoplay; encrypted-media"
        allowfullscreen
      ></iframe>
    </body></html>
  `;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {videoId ? (
        <WebView
          source={{ html }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.errorText}>Iyi video ntiboneka.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.green950 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
  webview: { flex: 1, backgroundColor: colors.green950 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.white },
});
