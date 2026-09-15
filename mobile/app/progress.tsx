import { useState } from "react";
import { Text } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
type Weight = { id: string; weight: number; unit: "kg" | "lb"; loggedAt: string };
export default function ProgressScreen() {
  const { getToken } = useAuth(); const [weight, setWeight] = useState(""); const [unit, setUnit] = useState<"kg" | "lb">("kg"); const [message, setMessage] = useState(""); const weights = useApi<Weight[]>("/api/weight");
  async function save() { try { await apiRequest("/api/weight", { method: "POST", token: await getToken(), body: JSON.stringify({ weight: Number(weight), unit }) }); setWeight(""); setMessage("Check-in saved."); await weights.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save weight."); } }
  async function remove(id: string) { await apiRequest(`/api/weight?id=${id}`, { method: "DELETE", token: await getToken() }); await weights.refresh(); }
  const latest = weights.data?.[0]; const previous = weights.data?.[1];
  return <Screen><Text style={styles.eyebrow}>NOTICE YOUR PATTERNS</Text><Text style={styles.title}>Your progress.</Text><Card><Text style={styles.caption}>Latest weight</Text><Text style={styles.metric}>{latest ? `${latest.weight} ${latest.unit}` : "—"}</Text>{latest && previous && <Text style={styles.caption}>{latest.weight - previous.weight > 0 ? "+" : ""}{(latest.weight - previous.weight).toFixed(1)} since previous check-in</Text>}</Card><TextField label="Weight" placeholder="Your weight" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" /><TextField label="Unit (kg or lb)" value={unit} onChangeText={(value) => setUnit(value === "lb" ? "lb" : "kg")} /><Button label="Save check-in" onPress={save} />{!!message && <Text style={styles.caption}>{message}</Text>}<Text style={styles.sectionTitle}>History</Text>{weights.loading && <EmptyState title="Loading history..." body="Fetching your real weight check-ins." />}{!weights.loading && !weights.data?.length && <EmptyState title="No check-ins yet" body="Add your first check-in above." />}{weights.data?.map((item) => <Card key={item.id}><Text style={styles.body}>{item.weight} {item.unit} · {new Date(item.loggedAt).toLocaleDateString()}</Text><Text onPress={() => remove(item.id)} style={styles.link}>Delete</Text></Card>)}<Link href="/(tabs)/more" style={styles.link}>More tools: grocery, reports, pricing →</Link></Screen>;
}
