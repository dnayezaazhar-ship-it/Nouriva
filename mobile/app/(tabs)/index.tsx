import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useUser } from "@clerk/expo";
import { Card, EmptyState, Screen } from "@/src/components";
import { styles } from "@/src/theme";
import { useApi } from "@/src/hooks";
import type { FoodLog } from "@/src/types";

type Report = { totals: { calories: number; protein: number; carbohydrates: number; fat: number; fiber: number }; meals: number };
export default function DashboardScreen() {
  const { user } = useUser();
  const { data: report, loading, error, refresh } = useApi<Report>("/api/reports?days=1");
  const { data: profile } = useApi<{ name?: string; goalId?: string; completedOnboarding?: boolean }>("/api/profile");
  const totals = report?.totals;
  return <Screen>
    <Text style={styles.eyebrow}>YOUR NOURISHMENT TODAY</Text><Text style={styles.title}>Good to see you, {profile?.name ?? user?.firstName ?? "there"}.</Text>
    <Text style={styles.body}>Your dashboard reflects meals you have actually logged today.</Text>
    {loading && <EmptyState title="Loading your day..." body="Fetching your latest nutrition activity." />}
    {!!error && <View><Text style={styles.error}>{error}</Text><Text onPress={refresh} style={styles.link}>Try again</Text></View>}
    {!loading && !error && <><View style={styles.metricGrid}>{[["Calories", totals?.calories ?? 0, "kcal"], ["Protein", totals?.protein ?? 0, "g"], ["Carbs", totals?.carbohydrates ?? 0, "g"], ["Fat", totals?.fat ?? 0, "g"]].map(([label, value, unit]) => <Card key={String(label)}><Text style={styles.caption}>{label}</Text><Text style={styles.metric}>{Math.round(Number(value))}</Text><Text style={styles.caption}>{unit}</Text></Card>)}</View><Card><Text style={styles.sectionTitle}>Today</Text><Text style={styles.body}>{report?.meals ? `${report.meals} logged meal${report.meals === 1 ? "" : "s"} so far.` : "No meals logged yet. Start with something you enjoyed."}</Text></Card></>}
    <Text style={styles.sectionTitle}>Quick actions</Text><View style={styles.stack}><Link href="/log" style={styles.action}>Log food →</Link><Link href="/(tabs)/planner" style={styles.action}>Plan a meal →</Link><Link href="/grocery" style={styles.action}>Open grocery list →</Link></View>
  </Screen>;
}
