import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Send, Clock } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { getExamForTaking, startAttempt, submitAttempt, SubmittedAnswer } from "../api/exams";

type Option = { id: string; text: string };
type Question = { id: string; prompt: string; type: "MULTIPLE_CHOICE" | string; options: Option[]; points: number };
type Exam = {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  durationMinutes: number | null;
  passingScorePercent: number;
  questions: Question[];
};

/**
 * No proctoring on mobile -- deliberately, not an oversight. The web
 * app's proctoring records the student's shared browser tab, which has
 * no equivalent concept on a native mobile app (there's no "tab" to
 * share). A camera-based alternative is possible but is a genuinely
 * separate, substantial feature (permission flow, recording, upload)
 * that deserves its own explicit decision rather than being silently
 * bolted on here. Submission itself doesn't require a recording either
 * way -- the web app's own upload is already best-effort and never
 * blocks the real score, so skipping it here doesn't put anything at
 * risk server-side.
 */
export default function ExamTakeScreen({ route, navigation }: any) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; textAnswer?: string }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    getExamForTaking(id)
      .then((res) => setExam(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStart() {
    if (!exam) return;
    setStarting(true);
    try {
      const res = await startAttempt(id);
      setAttemptId(res.data.attemptId);
      if (exam.durationMinutes) {
        const deadline = new Date(res.data.startedAt).getTime() + exam.durationMinutes * 60000;
        setRemainingSeconds(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
      }
    } catch (err: any) {
      setError(err.message || "Habaye ikibazo.");
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload: SubmittedAnswer[] = Object.entries(answers).map(([questionId, a]) => ({ questionId, ...a }));
      await submitAttempt(attemptId, payload);
      navigation.replace("ExamResult", { attemptId });
    } catch (err: any) {
      setError(err.message || "Habaye ikibazo.");
      submittedRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (remainingSeconds === null) return undefined;
    if (remainingSeconds <= 0) {
      handleSubmit();
      return undefined;
    }
    const t = setTimeout(() => setRemainingSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green700} />
      </View>
    );
  }
  if (error && !exam) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!exam) return null;

  if (!attemptId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <View style={styles.startCard}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          {exam.description && <Text style={styles.examDescription}>{exam.description}</Text>}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{exam.questionCount} ibibazo</Text>
            {exam.durationMinutes && <Text style={styles.meta}>· {exam.durationMinutes} min.</Text>}
            <Text style={styles.meta}>· Gutsinda: {exam.passingScorePercent}%</Text>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.startButton} onPress={handleStart} disabled={starting}>
            <Text style={styles.startButtonText}>{starting ? "Turatangira..." : "Tangira ikizamini"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const question = exam.questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === exam.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const minutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : null;
  const seconds = remainingSeconds !== null ? remainingSeconds % 60 : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 14 }]}>
      <View style={styles.header}>
        <Text style={styles.progress}>
          {answeredCount}/{exam.questions.length} wasubije
        </Text>
        {remainingSeconds !== null && (
          <View style={[styles.timer, remainingSeconds < 60 && styles.timerUrgent]}>
            <Clock size={13} color={remainingSeconds < 60 ? colors.red600 : colors.inkSoft} />
            <Text style={[styles.timerText, remainingSeconds < 60 && styles.timerTextUrgent]}>
              {minutes}:{String(seconds).padStart(2, "0")}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.questionCard}>
          <Text style={styles.questionMeta}>
            Ikibazo {currentIndex + 1} / {exam.questions.length} · {question.points} pt
          </Text>
          <Text style={styles.questionPrompt}>{question.prompt}</Text>

          {question.type === "MULTIPLE_CHOICE" ? (
            <View style={{ gap: 8 }}>
              {question.options.map((o) => {
                const selected = answers[question.id]?.selectedOptionId === o.id;
                return (
                  <TouchableOpacity
                    key={o.id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: { selectedOptionId: o.id } }))}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                    <Text style={styles.optionText}>{o.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput
              value={answers[question.id]?.textAnswer ?? ""}
              onChangeText={(text) => setAnswers((prev) => ({ ...prev, [question.id]: { textAnswer: text } }))}
              placeholder="Andika igisubizo cyawe..."
              placeholderTextColor={colors.inkSoft}
              style={styles.textInput}
            />
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.navButton, isFirst && styles.navButtonDisabled]}
          onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
        >
          <ChevronLeft size={16} color={isFirst ? colors.inkSoft : colors.green950} />
          <Text style={[styles.navButtonText, isFirst && styles.navButtonTextDisabled]}>Ibanziriza</Text>
        </TouchableOpacity>
        {isLast ? (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            <Send size={15} color={colors.white} />
            <Text style={styles.submitButtonText}>{submitting ? "Turimo kohereza..." : "Ohereza ikizamini"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
          >
            <Text style={styles.submitButtonText}>Ikurikira</Text>
            <ChevronRight size={16} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center", marginBottom: 12 },
  startCard: { margin: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: "center" },
  examTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.green950, textAlign: "center", marginBottom: 8 },
  examDescription: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: "center", marginBottom: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4, marginBottom: 20 },
  meta: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  startButton: { backgroundColor: colors.gold500, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 32, width: "100%", alignItems: "center" },
  startButtonText: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: colors.green950 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 8 },
  progress: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
  timer: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.cream2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  timerUrgent: { backgroundColor: "#FEE2E2" },
  timerText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  timerTextUrgent: { color: colors.red600 },

  scrollContent: { padding: 20, paddingBottom: 100 },
  questionCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18 },
  questionMeta: { fontFamily: fonts.bodyExtraBold, fontSize: 10, color: colors.gold600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  questionPrompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.green950, marginBottom: 16, lineHeight: 22 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
  optionSelected: { borderColor: colors.gold500, backgroundColor: colors.gold100 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.line },
  radioSelected: { borderColor: colors.gold500, backgroundColor: colors.gold500 },
  optionText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  textInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: fonts.body, fontSize: 14, color: colors.ink, backgroundColor: colors.surface },

  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.cream },
  navButton: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green950 },
  navButtonTextDisabled: { color: colors.inkSoft },
  submitButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.gold500, borderRadius: 14, paddingVertical: 13 },
  submitButtonText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: colors.white },
});
