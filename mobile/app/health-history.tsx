import { Link, Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { Text, View } from "react-native";
import { useApi } from "@/src/hooks";
import { BackButton, Card, EmptyState, Screen } from "@/src/components";
import { styles } from "@/src/theme";

type Profile = { height?: number; weight?: number; age?: number };
type Weight = { id: string; weight: number; unit: string; loggedAt: string };

export default function HealthHistoryScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const profile = useApi<Profile>("/api/profile");
  const weights = useApi<Weight[]>("/api/weight");
  if (isLoaded && !isSignedIn) return <Redirect href="/auth" />;
  if (!isLoaded || profile.loading || weights.loading) return <Screen centered><EmptyState title="Loading health history..." body="Fetching your saved wellness information." /></Screen>;
  if (profile.error || weights.error) return <Screen><Text style={styles.error}>{profile.error || weights.error}</Text></Screen>;
  const entries = weights.data ?? [];
  return <Screen><BackButton /><Text style={styles.eyebrow}>YOUR WELLNESS RECORD</Text><Text style={styles.title}>Health history.</Text><Text style={styles.body}>A private, simple view of the information you have shared with Nouriva. This is not a medical record.</Text>
    <Card><Text style={styles.sectionTitle}>Baseline information</Text><View style={styles.loggedRow}><Text style={styles.caption}>Age</Text><Text style={styles.strong}>{profile.data?.age ?? "—"}</Text></View><View style={styles.loggedRow}><Text style={styles.caption}>Height</Text><Text style={styles.strong}>{profile.data?.height ? `${profile.data.height} cm` : "—"}</Text></View><View style={styles.loggedRow}><Text style={styles.caption}>Starting weight</Text><Text style={styles.strong}>{profile.data?.weight ? `${profile.data.weight} kg` : "—"}</Text></View></Card>
    <Card><Text style={styles.sectionTitle}>Weight check-ins</Text>{!entries.length ? <EmptyState title="No check-ins yet" body="Your saved check-ins will appear here after you add one in Progress." /> : entries.map((item) => <View key={item.id} style={styles.loggedRow}><View><Text style={styles.strong}>{item.weight} {item.unit}</Text><Text style={styles.caption}>{new Date(item.loggedAt).toLocaleDateString()}</Text></View><Text style={styles.caption}>Check-in</Text></View>)}</Card>
    <Link href="/progress" style={styles.action}>Add or manage check-ins in Progress →</Link>
  </Screen>;
}
