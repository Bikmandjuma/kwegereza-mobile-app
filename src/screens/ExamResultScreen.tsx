import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, XCircle, Award } from "lucide-react-native";
import { colors, fonts } from "../theme/colors";
import { getAttemptResult } from "../api/exams";

type AnswerReview = {
  questionId: string;
  prompt: string;
  isCorrect: boolean;
  yourSelectedOptionText: string | null;
  yourTextAnswer: string | null;
  correctOptions: string[];
  pointsAwarded: number;
  points: number;
};
type Result = {
  examTitle: string;
  passed: boolean;
  scorePercent: number;
  earnedPoints: number;
  totalPoints: number;
  answers: AnswerReview[];
};

export default function ExamResultScreen({ route, navigation }: any) {
  const { attemptId } = route.params;
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAttemptResult(attemptId)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."));
  }, [attemptId]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!result) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green700} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.scoreCard}>
        <View style={[styles.badge, result.passed ? styles.badgePassed : styles.badgeFailed]}>
          <Award size={24} color={result.passed ? colors.emerald600 : colors.red600} />
        </View>
        <Text style={styles.examTitle}>{result.examTitle}</Text>
        <Text style={styles.verdict}>{result.passed ? "Watsinze iki kizamini!" : "Ntiwatsinze iki kizamini."}</Text>
        <Text style={styles.scorePercent}>{result.scorePercent}%</Text>
        <Text style={styles.points}>
          {result.earnedPoints} / {result.totalPoints} pts
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Isesengura ry'ibibazo</Text>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {result.answers.map((a, i) => (
          <View key={a.questionId} style={[styles.answerCard, { borderLeftColor: a.isCorrect ? colors.emerald600 : colors.red600 }]}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerPrompt}>
                {i + 1}. {a.prompt}
              </Text>
              {a.isCorrect ? (
                <CheckCircle2 size={16} color={colors.emerald600} />
              ) : (
                <XCircle size={16} color={colors.red600} />
              )}
            </View>
            <Text style={styles.answerMeta}>
              Igisubizo wawe: <Text style={styles.answerMetaBold}>{a.yourSelectedOptionText ?? a.yourTextAnswer ?? "—"}</Text>
            </Text>
            {!a.isCorrect && (
              <Text style={styles.correctAnswer}>Igisubizo cy'ukuri: {a.correctOptions.join(", ")}</Text>
            )}
            <Text style={styles.pointsAwarded}>
              {a.pointsAwarded}/{a.points} pt
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Exams")}>
        <Text style={styles.backButtonText}>Subira ku bizamini</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  scoreCard: { marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 24 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  badgePassed: { backgroundColor: "#D1FAE5" },
  badgeFailed: { backgroundColor: "#FEE2E2" },
  examTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.green950, textAlign: "center" },
  verdict: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 4, marginBottom: 14 },
  scorePercent: { fontFamily: fonts.display, fontSize: 40, color: colors.green950 },
  points: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.green950, marginHorizontal: 20, marginBottom: 12 },
  answerCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  answerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 },
  answerPrompt: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green950 },
  answerMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  answerMetaBold: { fontFamily: fonts.bodyBold, color: colors.ink },
  correctAnswer: { fontFamily: fonts.body, fontSize: 12, color: colors.emerald600, marginTop: 3 },
  pointsAwarded: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 4 },
  backButton: { marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  backButtonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.green950 },
});
