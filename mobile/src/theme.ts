import { StyleSheet } from "react-native";

export const colors = { ink: "#19332e", muted: "#6e817b", cream: "#fbfaf5", sage: "#dfeee6", green: "#2f6f5d", coral: "#e4856c", line: "#dfe7e2", white: "#ffffff" };
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, content: { padding: 24, paddingBottom: 48 },
  centered: { justifyContent: "center" }, eyebrow: { color: colors.green, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10 },
  heroTitle: { color: colors.ink, fontSize: 38, lineHeight: 43, fontWeight: "600", marginBottom: 14 }, title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: "600", marginBottom: 10 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "600", marginBottom: 8 }, body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 20 }, caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 14 }, metric: { color: colors.ink, fontSize: 25, fontWeight: "700", marginTop: 8 }, price: { color: colors.ink, fontSize: 32, fontWeight: "700", marginBottom: 8 },
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: "700", marginBottom: 7 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 10, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 46, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 15 },
  button: { alignItems: "center", backgroundColor: colors.green, borderRadius: 24, minHeight: 46, justifyContent: "center", paddingHorizontal: 18, marginBottom: 12 }, buttonSecondary: { backgroundColor: colors.sage }, buttonText: { color: colors.white, fontSize: 14, fontWeight: "700" }, buttonSecondaryText: { color: colors.green },
  link: { color: colors.green, fontSize: 14, fontWeight: "700", marginTop: 12 }, centerText: { textAlign: "center" }, empty: { alignItems: "center", paddingVertical: 38 }, emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "600", marginBottom: 6, textAlign: "center" }, emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }, stack: { gap: 10 }, action: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.green, fontSize: 14, fontWeight: "700", padding: 16 },   disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 14 }, error: { color: "#b84d42", fontSize: 13, lineHeight: 19, marginBottom: 12 },
});
