import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { useAuth, ApiError } from "../context/AuthContext";

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Uzuza email na password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      // No explicit navigation call needed here -- RootNavigator
      // switches its whole stack the moment AuthContext's `user`
      // becomes non-null, the same pattern that takes someone straight
      // to Home after a successful login on the web app.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Habaye ikibazo. Ongera ugerageze.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>

        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Murakaza neza</Text>
        <Text style={styles.subtitle}>Injira kugira ngo ukomeze</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Injira</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerHint}>
            Nta konti ufite? <Text style={styles.registerLink}>Iyandikishe hano</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1, paddingHorizontal: 28 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cream2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: { width: 56, height: 56, marginBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.green950 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 4, marginBottom: 24 },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.red600,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  submit: {
    backgroundColor: colors.green900,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: colors.white },
  registerHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
  registerLink: { fontFamily: fonts.bodyExtraBold, color: colors.gold600 },
});
