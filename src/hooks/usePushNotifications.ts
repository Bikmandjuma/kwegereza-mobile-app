import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useNavigation } from "@react-navigation/native";
import { registerExpoPushToken } from "../api/push";
import { useAuth } from "../context/AuthContext";

// Foreground behavior: a push that arrives while the app is already
// open still shows a real banner + plays a sound, rather than silently
// updating in-app state with nothing visible -- "a new announcement"
// should look like a notification whether the app is open or not.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers this device for push the moment a session exists, and
 * wires up tap-to-navigate. Every real notification this backend sends
 * (see notify.ts) includes a `url` matching the WEB app's own route
 * (e.g. "/chat") -- mapURLToScreen below is a deliberately small,
 * honest mapping covering only the screens that actually exist in this
 * app so far; an unrecognized url falls back to Home rather than
 * crashing on an unknown route name.
 *
 * Known, real limitation worth stating plainly rather than glossing
 * over: getExpoPushTokenAsync() needs an EAS project id (normally read
 * automatically from app.json's extra.eas.projectId), which requires
 * running `eas init` with a real Expo account -- something I can't do
 * from this environment. Until that's set up, this fails gracefully
 * (logs a warning, does nothing further) rather than crashing the rest
 * of the app. Also real: Android has required a development build for
 * remote push since Expo SDK 53 (iOS still works in plain Expo Go) --
 * this isn't a bug in this code, it's Expo's own current platform
 * split.
 */
function mapUrlToScreen(url?: string): { screen: string; params?: Record<string, unknown> } {
  if (!url) return { screen: "Home" };
  if (url.startsWith("/chat")) return { screen: "Chat" };
  if (url.startsWith("/ibizamini")) return { screen: "Home" }; // exams: not yet a mobile screen
  if (url.startsWith("/live-class")) return { screen: "Home" }; // live class: not yet a mobile screen
  return { screen: "Home" };
}

export function usePushNotifications() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;

    (async () => {
      if (!Device.isDevice) {
        if (__DEV__) console.warn("[push] Simulators/emulators can't generate a real push token; skipping.");
        return;
      }
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (cancelled) return;
        registeredTokenRef.current = token;
        await registerExpoPushToken(token);
      } catch (err) {
        // See this function's own doc comment above: most commonly an
        // EAS project id that hasn't been set up yet, not a bug in
        // this registration logic itself.
        if (__DEV__) console.warn("[push] token registration skipped:", err);
      }
    })();

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      const { screen, params } = mapUrlToScreen(url);
      navigation.navigate(screen, params);
    });

    return () => {
      cancelled = true;
      responseSub.remove();
    };
  }, [user, navigation]);
}
