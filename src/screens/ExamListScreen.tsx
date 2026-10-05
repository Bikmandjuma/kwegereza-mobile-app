import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Clock, ClipboardList, ChevronRight } from "lucide-react-native";
import TopBar from "../components/TopBar";
import { colors, fonts } from "../theme/colors";
import { getPublishedExams } from "../api/exams";

type Exam = {
  id: string;
  title: string;
  questionCount: number;
  durationMinutes: number | null;
  passingScorePercent: number;
};

export default function ExamListScreen({ navigation }: any) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublishedExams()
      .then((res) => setExams(res.data))
      .catch((err) => setError(err.message || "Habaye ikibazo."))
      .finally(() => setLoading(false));
  }, []);

  function renderItem({ item }: { item: Exam }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ExamTake", { id: item.id })}>
        <View style={styles.iconWrap}>
          <ClipboardList size={20} color={colors.gold600} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{item.questionCount} ibibazo</Text>
            {item.durationMinutes && (
              <View style={styles.metaItem}>
                <Clock size={11} color={colors.inkSoft} />
                <Text style={styles.meta}>{item.durationMinutes} min.</Text>
              </View>
            )}
            <Text style={styles.meta}>Gutsinda: {item.passingScorePercent}%</Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.inkSoft} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Ibizamini" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !loading && exams.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nta kizamini gitangajwe kugeza ubu.</Text>
        </View>
      ) : (
        <FlatList data={exams} keyExtractor={(e) => e.id} renderItem={renderItem} contentContainerStyle={styles.listContent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.red600, textAlign: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: "center" },
  listContent: { padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.gold100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.green950, marginBottom: 4 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
});
