import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock, LogOut, Mail } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";

export default function PendingScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const email = route.params?.email;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.badge}>
        <Clock size={30} color={colors.white} />
      </View>
      <Text style={styles.title}>Amakuru yawe yoherejwe neza!</Text>
      <Text style={styles.paragraph}>
        Turi bukumenyeshe kuri email/whatsapp yawe niba ubuyobozi bwemeye ko wiga. Mugihe uzemererwa, uzabona
        ubutumwa kuri (email/whatsapp) bufite uburyo bwo kwinjira kuri konti yawe.
      </Text>

      <View style={styles.card}>
        {email && (
          <View style={styles.row}>
            <Mail size={16} color={colors.gold600} />
            <Text style={styles.rowText}>
              Email: <Text style={styles.rowTextBold}>{email}</Text>
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Clock size={16} color={colors.gold600} />
          <Text style={styles.rowText}>
            Uko byifashe ubu: <Text style={styles.rowTextAmber}>Butegereje w'ihanganye</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Home")}>
        <LogOut size={16} color={colors.green950} />
        <Text style={styles.buttonText}>Subira ku rubuga</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 28, alignItems: "center" },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green900,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.green950, textAlign: "center", marginBottom: 12 },
  paragraph: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  card: { width: "100%", backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12, marginBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, flexShrink: 1 },
  rowTextBold: { fontFamily: fonts.bodyBold, color: colors.green950 },
  rowTextAmber: { fontFamily: fonts.bodyBold, color: "#B45309" },
  button: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.green900, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green950 },
});
