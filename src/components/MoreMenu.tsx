import { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Home, User, LogOut, BookOpen, MessageCircle, GraduationCap, PenLine, ClipboardList, Radio } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

type MenuItem = {
  key: string;
  label: string;
  icon: typeof Home;
  screen?: string;
  danger?: boolean;
};

// Library (books/ifaida), live class, and exams are their own
// substantial phases, each with real screens still to come -- this menu
// is deliberately honest about that: entries only appear once the
// screen behind them actually exists, rather than linking to a
// placeholder "coming soon" page. As each phase lands, its entry gets
// added here.
// Isomero (books) and Amasomo (audio/video) are both browsable by a
// guest -- individual locked items prompt a login when tapped, same as
// the web app, rather than hiding the whole section behind auth.
const BASE_ITEMS: MenuItem[] = [
  { key: "home", label: "Ahabanza", icon: Home, screen: "Home" },
  { key: "books", label: "Isomero", icon: BookOpen, screen: "Books" },
  { key: "amasomo", label: "Amasomo", icon: GraduationCap, screen: "Amasomo" },
  { key: "ifaida", label: "Inyandiko", icon: PenLine, screen: "Ifaida" },
  { key: "liveclass", label: "Live Class", icon: Radio, screen: "LiveClassList" },
];
// Chat requires an authenticated session on the backend -- shown only
// when logged in, same gating the web app applies to its own /chat route.
const AUTH_ITEMS: MenuItem[] = [
  { key: "chat", label: "Kwegereza Chat", icon: MessageCircle, screen: "Chat" },
  { key: "exams", label: "Ibizamini", icon: ClipboardList, screen: "Exams" },
];

export default function MoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [open, translateY, backdropOpacity]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 300, duration: 180, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(onClose);
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}
      >
        <View style={styles.handle} />

        {user ? (
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.fullName?.[0] ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userRole}>{user.email}</Text>
            </View>
          </View>
        ) : null}

        {[...BASE_ITEMS, ...(user ? AUTH_ITEMS : [])].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.row}
            onPress={() => {
              handleClose();
              if (item.screen) navigation.navigate(item.screen);
            }}
          >
            <item.icon size={19} color={colors.ink} />
            <Text style={styles.rowLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {user ? (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              handleClose();
              logout();
            }}
          >
            <LogOut size={19} color={colors.red600} />
            <Text style={[styles.rowLabel, { color: colors.red600 }]}>Sohoka</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              handleClose();
              navigation.navigate("Login");
            }}
          >
            <User size={19} color={colors.green700} />
            <Text style={[styles.rowLabel, { color: colors.green700 }]}>Injira</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cream2,
    alignSelf: "center",
    marginBottom: 14,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green900,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontFamily: fonts.bodyExtraBold, fontSize: 17 },
  userName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  userRole: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
});
