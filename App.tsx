import { useCallback } from "react";
import { View } from "react-native";
import * as SplashScreenNative from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts as useManrope, Manrope_400Regular, Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { useFonts as useCormorant, CormorantGaramond_400Regular, CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Keeps Expo's own native splash (just the logo, shown instantly before
// any JS has even run) up until fonts finish loading -- the custom,
// deliberately-5-second branded SplashScreen component takes over right
// after, so there's never a gap of blank white screen between "native
// splash disappears" and "our own splash appears".
SplashScreenNative.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [manropeLoaded] = useManrope({ Manrope_400Regular, Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold });
  const [cormorantLoaded] = useCormorant({ CormorantGaramond_400Regular, CormorantGaramond_700Bold });
  const fontsReady = manropeLoaded && cormorantLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (fontsReady) await SplashScreenNative.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <RootNavigator />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
