import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { assetUrl } from "../utils/assetUrl";
import { trackBookView } from "../api/books";

/**
 * Opens the PDF directly in a WebView rather than a dedicated PDF
 * library -- every real PDF-rendering library for React Native
 * (react-native-pdf, react-native-pdf-renderer, etc.) requires native
 * code and a custom development build, the same tradeoff as LiveKit.
 * WebView is a standard Expo-Go-compatible module, and both iOS's
 * WKWebView and Android's Chromium-based WebView render PDFs natively
 * when pointed at a PDF URL directly -- no extra library needed for
 * this to just work. The tradeoff: no custom in-app page-jump
 * controls or pinch-to-zoom beyond whatever the platform's own PDF
 * viewer provides. If that polish is ever wanted, it's the same
 * native-module decision as live-class: worth it, but needs its own
 * custom build.
 */
export default function BookReaderScreen({ route, navigation }: any) {
  const { id, title, fileUrl } = route.params;
  const insets = useSafeAreaInsets();
  const [webLoading, setWebLoading] = useState(true);

  useEffect(() => {
    trackBookView(id).catch(() => {});
  }, [id]);

  const uri = assetUrl(fileUrl);
  // Android's WebView needs Google Docs' viewer to render a remote PDF
  // reliably; iOS's WKWebView renders a direct PDF URL natively on its
  // own and doesn't need (or always play nicely with) that wrapper.
  const source = Platform.OS === "android" ? { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}` } : { uri };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.webviewWrap}>
        <WebView
          source={source}
          style={styles.webview}
          onLoadEnd={() => setWebLoading(false)}
          startInLoadingState
        />
        {webLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.green700} size="large" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
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
  title: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  webviewWrap: { flex: 1 },
  webview: { flex: 1, backgroundColor: colors.cream },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
  },
});
