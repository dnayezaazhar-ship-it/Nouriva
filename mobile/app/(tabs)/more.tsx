import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { Screen } from "@/src/components";
import { styles } from "@/src/theme";

const links = [["Progress", "/progress"], ["Grocery", "/grocery"], ["Reports", "/reports"], ["Pricing", "/pricing"], ["Log food", "/log"]] as const;
export default function MoreScreen() {
  const { signOut } = useAuth();
  return <Screen><Text style={styles.eyebrow}>YOUR NOURIVA SPACE</Text><Text style={styles.title}>More tools.</Text><View style={styles.stack}>{links.map(([label, href]) => <Link key={href} href={href} style={styles.action}>{label} →</Link>)}<Text onPress={() => signOut()} style={styles.action}>Sign out</Text></View></Screen>;
}
