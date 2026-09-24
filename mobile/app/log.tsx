import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { BackButton, Button, Card, EmptyState, Screen, SelectField, TextField } from "@/src/components";
import { styles } from "@/src/theme";
import type { Food, FoodLog } from "@/src/types";

const mealOptions = [{ label: "Breakfast", value: "breakfast" }, { label: "Lunch", value: "lunch" }, { label: "Dinner", value: "dinner" }, { label: "Snack", value: "snack" }];
const totalsFor = (logs: FoodLog[]) => logs.reduce((sum, log) => ({ calories: sum.calories + log.calories, protein: sum.protein + log.protein, carbohydrates: sum.carbohydrates + log.carbohydrates, fat: sum.fat + log.fat, fiber: sum.fiber + log.fiber }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
const scaled = (food: Food, servings: number) => ({ calories: Math.round(food.calories * servings), protein: food.protein * servings, carbohydrates: food.carbohydrates * servings, fat: food.fat * servings, fiber: food.fiber * servings });

export default function LogScreen() {
  const { getToken } = useAuth();
  const { food: requestedFood } = useLocalSearchParams<{ food?: string }>();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(String(requestedFood ?? ""));
  const [servings, setServings] = useState("1");
  const [mealType, setMealType] = useState("lunch");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const foods = useApi<Food[]>(`/api/foods${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const logs = useApi<FoodLog[]>(`/api/logs?date=${new Date().toISOString().slice(0, 10)}`);
  const selected = (foods.data ?? []).find((food) => food.id === selectedId) ?? null;
  const filtered = useMemo(() => (foods.data ?? []).filter((food) => `${food.name} ${food.cuisine}`.toLowerCase().includes(query.toLowerCase())), [foods.data, query]);
  const preview = selected ? scaled(selected, Math.max(0, Number(servings) || 0)) : null;
  async function save() {
    const amount = Number(servings);
    if (!selected || !Number.isFinite(amount) || amount < 0.25 || amount > 20) { setMessage("Choose a food and enter between 0.25 and 20 servings."); return; }
    setSaving(true); setMessage("");
    try {
      await apiRequest("/api/logs", { method: "POST", token: await getToken(), body: JSON.stringify({ foodId: selected.id, servings: amount, mealType }) });
      setSelectedId(""); setQuery(""); setServings("1"); setMessage(`${selected.name} was added to today's log.`); await logs.refresh();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save this log."); } finally { setSaving(false); }
  }
  async function remove(id: string) { try { await apiRequest(`/api/logs?id=${encodeURIComponent(id)}`, { method: "DELETE", token: await getToken() }); await logs.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not remove this log."); } }
  const totals = totalsFor(logs.data ?? []);
  return <Screen><BackButton /><Text style={styles.eyebrow}>FOOD LOG</Text><Text style={styles.title}>Add something nourishing.</Text><Text style={styles.body}>Today's entries are saved securely and remain after navigating away or refreshing.</Text>
    {message && <Text style={styles.success}>{message}</Text>}
    <Card><Text style={styles.sectionTitle}>Log a food</Text><TextField label="Search foods" placeholder="Search by name or cuisine" value={query} onChangeText={setQuery} />{!selected && query.length > 0 && filtered.slice(0, 8).map((food) => <Text key={food.id} onPress={() => { setSelectedId(food.id); setQuery(""); }} style={styles.action}>{food.name} · {food.calories} kcal / {food.servingSize}</Text>)}{selected && <><Text style={styles.strong}>{selected.name}</Text><Text style={styles.caption}>{selected.calories} kcal per {selected.servingSize}</Text><TextField label="Servings" value={servings} onChangeText={setServings} keyboardType="decimal-pad" /><SelectField label="Meal" value={mealType} options={mealOptions} onChange={setMealType} />{preview && <View style={styles.previewCard}><Text style={styles.caption}>Preview</Text><Text style={styles.body}>{preview.calories} kcal · {preview.protein.toFixed(1)}g protein · {preview.carbohydrates.toFixed(1)}g carbs · {preview.fat.toFixed(1)}g fat · {preview.fiber.toFixed(1)}g fiber</Text></View>}<Button label={saving ? "Saving..." : "Add to today's log"} onPress={save} disabled={saving} /></>}</Card>
    <Card><Text style={styles.sectionTitle}>Today's totals</Text><Text style={styles.metric}>{Math.round(totals.calories)} <Text style={styles.caption}>kcal</Text></Text><Text style={styles.body}>{totals.protein.toFixed(1)}g protein · {totals.carbohydrates.toFixed(1)}g carbs · {totals.fat.toFixed(1)}g fat · {totals.fiber.toFixed(1)}g fiber</Text><Text style={styles.sectionTitle}>Logged foods</Text>{logs.loading && <EmptyState title="Loading today's log..." body="Fetching your saved entries." />}{!logs.loading && !(logs.data ?? []).length && <EmptyState title="No meals logged yet" body="Search for a food above to begin." />}{(logs.data ?? []).map((log) => <View key={log.id} style={styles.loggedRow}><View><Text style={styles.strong}>{log.foodName}</Text><Text style={styles.caption}>{log.mealType} · {log.servings} serving{log.servings === 1 ? "" : "s"}</Text></View><View><Text style={styles.strong}>{log.calories} kcal</Text><Text onPress={() => remove(log.id)} style={styles.link}>Remove</Text></View></View>)}</Card>
  </Screen>;
}
