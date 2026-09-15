import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
import type { Food, FoodLog } from "@/src/types";

export default function LogScreen() {
  const { getToken } = useAuth(); const [query, setQuery] = useState(""); const [selected, setSelected] = useState<Food | null>(null); const [servings, setServings] = useState("1"); const [mealType, setMealType] = useState("breakfast"); const [message, setMessage] = useState("");
  const foods = useApi<Food[]>(`/api/foods${query ? `?q=${encodeURIComponent(query)}` : ""}`); const logs = useApi<FoodLog[]>(`/api/logs?date=${new Date().toISOString().slice(0, 10)}`);
  async function save() { if (!selected) { setMessage("Choose a food first."); return; } try { setMessage(""); await apiRequest("/api/logs", { method: "POST", token: await getToken(), body: JSON.stringify({ foodId: selected.id, servings: Number(servings), mealType }) }); setSelected(null); setQuery(""); setMessage("Food logged."); await logs.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save this log."); } }
  async function remove(id: string) { try { await apiRequest(`/api/logs?id=${id}`, { method: "DELETE", token: await getToken() }); await logs.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not delete the log."); } }
  return <Screen><Text style={styles.eyebrow}>FOOD LOG</Text><Text style={styles.title}>Log something eaten.</Text><Text style={styles.body}>Your logged foods are separate from planned meals.</Text><TextField label="Search food" placeholder="Search the library" value={query} onChangeText={setQuery} />
    {!selected && query.length > 1 && foods.data?.slice(0, 8).map((food) => <Text key={food.id} onPress={() => setSelected(food)} style={styles.action}>{food.name} · {food.calories} kcal</Text>)}
    {selected && <Card><Text style={styles.sectionTitle}>{selected.name}</Text><Text style={styles.caption}>{selected.calories} kcal per {selected.servingSize}</Text><TextField label="Servings" value={servings} onChangeText={setServings} keyboardType="decimal-pad" /><TextField label="Meal type" value={mealType} onChangeText={setMealType} placeholder="breakfast, lunch, dinner, or snack" /><Button label="Save log" onPress={save} /></Card>}
    {!!message && <Text style={styles.caption}>{message}</Text>}<Text style={styles.sectionTitle}>Today's logs</Text>{logs.loading && <EmptyState title="Loading logs..." body="Fetching today's entries." />}{!logs.loading && !logs.data?.length && <EmptyState title="Nothing logged yet" body="Search for a food above to begin." />}{logs.data?.map((log) => <Card key={log.id}><Text style={styles.sectionTitle}>{log.foodName}</Text><Text style={styles.caption}>{log.mealType} · {log.servings} servings · {Math.round(log.calories)} kcal</Text><Text onPress={() => remove(log.id)} style={styles.link}>Delete</Text></Card>)}</Screen>;
}
