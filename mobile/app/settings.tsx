import { Link, Redirect, router } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { Text } from "react-native";
import { BackButton, Button, Card, Screen } from "@/src/components";
import { styles } from "@/src/theme";

export default function SettingsScreen() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  if (isLoaded && !isSignedIn) return <Redirect href="/auth" />;
  if (!isLoaded) return null;
  async function logout() { await signOut(); router.replace("/auth"); }
  return <Screen><BackButton /><Text style={styles.eyebrow}>NOURIVA SETTINGS</Text><Text style={styles.title}>Settings.</Text><Text style={styles.body}>Manage your account and choose where to review your Nouriva information.</Text>
    <Card><Text style={styles.sectionTitle}>Account</Text><Text style={styles.body}>{user?.primaryEmailAddress?.emailAddress ?? "Signed-in Nouriva account"}</Text><Button label="Sign out" variant="secondary" onPress={logout} /></Card>
    <Link href="/profile" style={styles.action}>Profile and preferences →</Link><Link href="/health-history" style={styles.action}>Health history →</Link><Link href="/(tabs)/more" style={styles.action}>Back to More →</Link>
  </Screen>;
}
