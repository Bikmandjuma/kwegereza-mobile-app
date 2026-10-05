import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, BookOpen, Send, ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { registerRequest } from "../api/auth";

const AGE_RANGES = ["Hagati ya 12 na 20", "Hagati ya 21 na 30", "Hagati ya 31 na 45", "46 kuzamura"];
const QURAN_OPTIONS: { key: "KNOWS" | "TRYING" | "NONE"; label: string }[] = [
  { key: "KNOWS", label: "Nzi gusoma gusa" },
  { key: "TRYING", label: "Ngerageza gusoma" },
  { key: "NONE", label: "Ntabyo nzi" },
];
const LEVEL_BY_ANSWER: Record<string, string> = { KNOWS: "LEVEL_1", TRYING: "LEVEL_2", NONE: "LEVEL_3" };
const SECTION_TITLE_BY_LEVEL: Record<string, string> = {
  LEVEL_1: "ICYICIRO CYA MBERE",
  LEVEL_2: "ICYICIRO CYA KABIRI",
  LEVEL_3: "ICYICIRO CYA GATATU",
};
const TOTAL_STEPS = 4;

type Form = {
  fullName: string;
  kunia: string;
  ageRange: string;
  gender: "MALE" | "FEMALE" | "";
  phone: string;
  email: string;
  location: string;
  quranReading: "KNOWS" | "TRYING" | "NONE" | "";
  agreedToRules: "YEGO" | "HOYA" | "";
  availableDays: string;
  availableHours: string;
  registrationNote: string;
};

const EMPTY_FORM: Form = {
  fullName: "",
  kunia: "",
  ageRange: "",
  gender: "",
  phone: "",
  email: "",
  location: "",
  quranReading: "",
  agreedToRules: "",
  availableDays: "",
  availableHours: "",
  registrationNote: "",
};

/**
 * Ported from the web app's RegisterPage.jsx, same 4 steps and same
 * validation rules. Deliberately NOT carried over: Google sign-up (a
 * separate native-auth integration, its own scope decision) -- email +
 * the fields below is the only path here for now. One detail that
 * matters and is easy to miss: there is no password field anywhere in
 * this form on purpose -- the backend hashes the student's own phone
 * number as their password (communicated to them by email once
 * approved), so asking for a separate password here would contradict
 * how login actually works.
 */
export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [gateAnswer, setGateAnswer] = useState("");
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Form>(field: K, value: Form[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const level = LEVEL_BY_ANSWER[form.quranReading];
  const sectionTitle = SECTION_TITLE_BY_LEVEL[level] ?? "ICYICIRO";

  function validateStep(i: number) {
    if (i === 0) return gateAnswer === "YEGO";
    if (i === 1) {
      return Boolean(
        form.fullName.trim() && form.ageRange && form.gender && form.phone.trim() && form.email.trim() && form.location.trim()
      );
    }
    if (i === 2) return Boolean(form.quranReading);
    if (i === 3) return form.agreedToRules === "YEGO" && form.availableDays.trim() && form.availableHours.trim();
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) {
      setError(
        step === 0
          ? "Ugomba gusoma ibisabwa mbere yo gukomeza, hanyuma uhitemo YEGO."
          : "Uzuza ibisabwa byose byanditse * mbere yo gukomeza."
      );
      return;
    }
    setError("");
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }

  function handleBack() {
    setError("");
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    if (!validateStep(3)) {
      setError("Uzuza ibisabwa byose byanditse * mbere yo kohereza.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await registerRequest({
        fullName: form.fullName,
        kunia: form.kunia || undefined,
        ageRange: form.ageRange,
        gender: form.gender as "MALE" | "FEMALE",
        phone: form.phone,
        email: form.email,
        location: form.location,
        quranReading: form.quranReading as "KNOWS" | "TRYING" | "NONE",
        availableDays: form.availableDays,
        availableHours: form.availableHours,
        registrationNote: form.registrationNote || undefined,
        agreedToRequirements: true,
        agreedToRules: true,
      });
      navigation.replace("Pending", { email: form.email });
    } catch (err: any) {
      setError(err.message || "Habaye ikibazo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Urupapuro {step + 1} / {TOTAL_STEPS}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 0 && (
          <View style={{ gap: 14 }}>
            <View style={styles.stepTitleRow}>
              <BookOpen size={18} color={colors.green950} />
              <Text style={styles.stepTitle}>Ibijyanye n'aya masomo</Text>
            </View>
            <Text style={styles.paragraph}>
              Aya ni amasomo azajya atangirwa kuri murandasi (Online Class) hifashishijwe Telefone cyangwa Computer
              bijyanye na buri wese, akaba ategurwa na Kwegereza Islam Umuryango kugirango afashe buri wese wifuza
              kumenya Imana (Allah) ye n'idini rye muri rusange, mu buryo bworoshye.
            </Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Ibisabwa ku biyandikisha:</Text>
              <Text style={styles.infoBoxBody}>
                Kwitabira amasomo yose, kugira ibitabo bikenewe, no kubahiriza amategeko y'iki cyiciro.
              </Text>
            </View>
            <Text style={styles.label}>Wasomye ibisabwa hejuru? *</Text>
            <View style={styles.choiceRow}>
              {["YEGO", "HOYA"].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.choiceButton, gateAnswer === v && styles.choiceButtonActive]}
                  onPress={() => setGateAnswer(v)}
                >
                  <Text style={[styles.choiceButtonText, gateAnswer === v && styles.choiceButtonTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: 14 }}>
            <View>
              <Text style={styles.label}>Amazina yawe *</Text>
              <TextInput value={form.fullName} onChangeText={(t) => set("fullName", t)} placeholder="Ex: Aisha Uwimana" placeholderTextColor={colors.inkSoft} style={styles.input} />
            </View>
            <View>
              <Text style={styles.label}>Kunia (si ngombwa)</Text>
              <TextInput value={form.kunia} onChangeText={(t) => set("kunia", t)} placeholder="Ex: Umm-Raslan" placeholderTextColor={colors.inkSoft} style={styles.input} />
            </View>
            <View>
              <Text style={styles.label}>Imyaka *</Text>
              <View style={styles.gridTwo}>
                {AGE_RANGES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.gridButton, form.ageRange === r && styles.choiceButtonActive]}
                    onPress={() => set("ageRange", r)}
                  >
                    <Text style={[styles.gridButtonText, form.ageRange === r && styles.choiceButtonTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Igitsina *</Text>
              <View style={styles.choiceRow}>
                {[{ v: "MALE" as const, l: "GABO" }, { v: "FEMALE" as const, l: "GORE" }].map((g) => (
                  <TouchableOpacity
                    key={g.v}
                    style={[styles.choiceButton, form.gender === g.v && styles.choiceButtonActive]}
                    onPress={() => set("gender", g.v)}
                  >
                    <Text style={[styles.choiceButtonText, form.gender === g.v && styles.choiceButtonTextActive]}>{g.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Nimero za WhatsApp *</Text>
              <TextInput value={form.phone} onChangeText={(t) => set("phone", t)} placeholder="+250723061482" placeholderTextColor={colors.inkSoft} keyboardType="phone-pad" style={styles.input} />
              <Text style={styles.hint}>Iyi nimero izaba ari ijambo ry'ibanga (password) yawe mugize uzaba wemerewe kwiga.</Text>
            </View>
            <View>
              <Text style={styles.label}>Imeili yawe *</Text>
              <TextInput value={form.email} onChangeText={(t) => set("email", t)} placeholder="wowe@example.com" placeholderTextColor={colors.inkSoft} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
            </View>
            <View>
              <Text style={styles.label}>Aho utuye *</Text>
              <TextInput value={form.location} onChangeText={(t) => set("location", t)} placeholder="Rwanda/Kigali..." placeholderTextColor={colors.inkSoft} style={styles.input} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 14 }}>
            <Text style={styles.stepTitle}>Ese uzi gusoma Qur'aan ureba? *</Text>
            <Text style={styles.hintAmber}>Ibyo uhitamo aha nibyo bizadufasha kumenya icyiciro ugomba kuherwaho In Shaa Allah.</Text>
            <View style={{ gap: 8 }}>
              {QURAN_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.option, form.quranReading === o.key && styles.optionSelected]}
                  onPress={() => set("quranReading", o.key)}
                >
                  <View style={[styles.radio, form.quranReading === o.key && styles.radioSelected]} />
                  <Text style={styles.optionText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{sectionTitle}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Amategeko y'ingenzi agenga iyi gahunda:</Text>
              <Text style={styles.infoBoxBody}>
                1. Agomba kwitabira amasomo yose yigishwa bijyanye n'icyiciro arimo.{"\n"}
                2. Umunyeshuri ategetswe kuba afite ibitabo byigishwa bijyanye n'icyiciro arimo.{"\n"}
                3. Gusiba ntibyemewe igihe bibayeho hatangwa impamvu.
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Ese wasomye amategeko ajyanye n'amasomo? *</Text>
              <View style={styles.choiceRow}>
                {(["YEGO", "HOYA"] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.choiceButton, form.agreedToRules === v && styles.choiceButtonActive]}
                    onPress={() => set("agreedToRules", v)}
                  >
                    <Text style={[styles.choiceButtonText, form.agreedToRules === v && styles.choiceButtonTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Andika iminsi ubona umwanya *</Text>
              <Text style={styles.hint}>Urugero: Kuwa mbere, Kuwa kabiri, Kuwa gatatu...</Text>
              <TextInput value={form.availableDays} onChangeText={(t) => set("availableDays", t)} style={styles.input} placeholderTextColor={colors.inkSoft} />
            </View>
            <View>
              <Text style={styles.label}>Andika amasaha ubona umwanya kuri ayo minsi *</Text>
              <Text style={styles.hint}>Urugero: Saa 20:00 kugeza Saa 21:00 mu masaha yo mu Rwanda</Text>
              <TextInput value={form.availableHours} onChangeText={(t) => set("availableHours", t)} style={styles.input} placeholderTextColor={colors.inkSoft} />
            </View>
            <View>
              <Text style={styles.label}>Duhe igitekerezo cyawe cyangwa icyifuzo</Text>
              <TextInput
                value={form.registrationNote}
                onChangeText={(t) => set("registrationNote", t)}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                placeholderTextColor={colors.inkSoft}
              />
            </View>
          </View>
        )}

        <View style={styles.navRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.navBack} onPress={handleBack}>
              <ArrowLeft size={15} color={colors.green950} />
              <Text style={styles.navBackText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity style={styles.navNext} onPress={handleNext}>
              <Text style={styles.navNextText}>Next</Text>
              <ArrowRight size={15} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navNext} onPress={handleSubmit} disabled={busy}>
              <Send size={15} color={colors.white} />
              <Text style={styles.navNextText}>{busy ? "Turimo kohereza..." : "Submit"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cream2, alignItems: "center", justifyContent: "center" },
  progressTrack: { height: 6, backgroundColor: colors.cream2, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.gold500, borderRadius: 3 },
  progressLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft, textAlign: "center", marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.red600, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 16 },
  stepTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.green950 },
  paragraph: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 20 },
  infoBox: { backgroundColor: colors.cream2, borderRadius: 14, padding: 14 },
  infoBoxTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green950, marginBottom: 6 },
  infoBoxBody: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 19 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft, marginBottom: 6 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, opacity: 0.8, marginTop: 4 },
  hintAmber: { fontFamily: fonts.body, fontSize: 11, color: "#B45309" },
  choiceRow: { flexDirection: "row", gap: 8 },
  choiceButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: "center" },
  choiceButtonActive: { backgroundColor: colors.green950, borderColor: colors.green950 },
  choiceButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  choiceButtonTextActive: { color: colors.white },
  gridTwo: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridButton: { width: "48%", paddingVertical: 11, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  gridButtonText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14, color: colors.ink, backgroundColor: colors.surface },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  option: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
  optionSelected: { borderColor: colors.gold500, backgroundColor: colors.gold100 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.line },
  radioSelected: { borderColor: colors.gold500, backgroundColor: colors.gold500 },
  optionText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  sectionBadge: { backgroundColor: colors.green950, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start" },
  sectionBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  navRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  navBack: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13 },
  navBackText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green950 },
  navNext: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.gold500, borderRadius: 14, paddingVertical: 13 },
  navNextText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: colors.white },
});
