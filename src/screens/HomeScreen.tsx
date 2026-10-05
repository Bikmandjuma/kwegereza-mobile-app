import { View, Text, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

/**
 * This phase's landing screen -- deliberately simple. The real content
 * (library/PDF reading, chat, live class, exams) are each their own
 * phase still to come; this screen exists to prove the foundation
 * (navigation, the unified TopBar, auth state) all genuinely works
 * end-to-end before building on top of it.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  // Called here (not in App.tsx) deliberately -- it needs useNavigation
  // for tap-to-navigate, which only works inside NavigationContainer;
  // Home is the first screen a session actually reaches, whether just
  // logged in or arriving as a guest.
  usePushNotifications();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>{user ? `Murakaza neza, ${user.fullName.split(" ")[0]}` : "Murakaza neza"}</Text>
        <Text style={styles.note}>
          Uru ni urufatiro rw'iyi porogaramu (foundation phase). Ibindi bice -- Isomero (ibitabo/PDF/amajwi),
          Kwegereza Chat, Live Class, n'Ibizamini -- bizakurikiraho, kimwe kimwe.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24 },
  greeting: { fontFamily: fonts.display, fontSize: 24, color: colors.green950, marginBottom: 10 },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 21 },
});
