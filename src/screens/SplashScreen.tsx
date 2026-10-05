import { useEffect, useRef } from "react";
import { View, Image, Text, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { colors, fonts } from "../theme/colors";

const MIN_SPLASH_MS = 5000;

/**
 * Shown for a minimum of 5 seconds on every cold launch, exactly as
 * specified -- not a moment less, even on a fast device/network, and
 * not longer than necessary either: if the auth check (which runs
 * concurrently, see RootNavigator) takes longer than 5s on a slow
 * connection, RootNavigator waits for BOTH to finish before handing
 * off, so the app never flashes a logged-out welcome screen for
 * someone who's actually already signed in.
 */
export default function SplashScreen({ onElapsed }: { onElapsed: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 120 }),
    ]).start();
    const t = setTimeout(onElapsed, MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [fade, scale, onElapsed]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: "center" }}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Kwegereza</Text>
        <Text style={styles.subtitle}>Islam Umuryango</Text>
      </Animated.View>
      <ActivityIndicator size="small" color={colors.gold500} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green950,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 110, height: 110 },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.white, marginTop: 18 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.gold400, marginTop: 2, letterSpacing: 1 },
  spinner: { position: "absolute", bottom: 70 },
});
