import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { colors, fonts } from "../theme/colors";

export default function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Kwegereza{"\n"}Islam Umuryango</Text>
        <Text style={styles.subtitle}>
          Ikizi cy'ubumenyi bw'idini ya Islamu bushingiye kuri Qur'an na Sunnah, mu buryo bworoshye, bwiza kandi
          bunoze.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryButtonText}>Injira (Login)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.secondaryButtonText}>Komeza nk'umushyitsi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green950,
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  hero: { alignItems: "center", marginTop: 40 },
  logo: { width: 86, height: 86, marginBottom: 20 },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.white,
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  actions: { gap: 12 },
  primaryButton: {
    backgroundColor: colors.gold500,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: colors.green950 },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
});
