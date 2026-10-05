import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MoreVertical } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import MoreMenu from "./MoreMenu";

/**
 * The one top bar every screen in this app shares -- logo on the left,
 * a single vertical 3-dot menu on the right, deliberately nothing else
 * (no footer anywhere in this app, no bottom tab bar duplicating what
 * the 3-dot menu already covers). A subtle shadow instead of the web
 * navbar's flat bottom border -- small thing, but it's exactly the kind
 * of detail that makes the mobile app feel native rather than like the
 * website just squeezed into a phone frame.
 */
export default function TopBar({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.left}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={styles.menuButton}
          accessibilityLabel="Ibindi"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MoreVertical size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>
      <MoreMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 32, height: 32 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.green950 },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cream2,
    alignItems: "center",
    justifyContent: "center",
  },
});
