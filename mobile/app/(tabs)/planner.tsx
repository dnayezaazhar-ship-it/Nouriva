import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
import type { Food, Meal } from "@/src/types";

type Plan = { weekStart: string; meals: Meal[] };
const monday = (offset = 0) => { const date = new Date(); const day = date.getUTCDay(); date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1) + offset * 7); return date.toISOString().slice(0, 10); };
const dates = (start: string) => Array.from({ length: 7 }, (_, index) => { const date = new Date(`${start}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + index); return date.toISOString().slice(0, 10); });
export default function PlannerScreen() {
  const { getToken } = useAuth(); const [offset, setOffset] = useState(0); const [selectedDate, setSelectedDate] = useState(""); const [mealType, setMealType] = useState("breakfast"); const [query, setQuery] = useState(""); const week = monday(offset);
  const plan = useApi<Plan>(`/api/meal-plans?weekStart=${week}`); const foods = useApi<Food[]>(`/api/foods${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const weekDays = useMemo(() => dates(week), [week]);
  async function saveMeal(food: Food) { const existing = plan.data?.meals.filter((meal) => !(meal.date === selectedDate && meal.mealType === mealType)) ?? []; const next = [...existing, { date: selectedDate, mealType, itemType: "food", itemId: food.id, servings: 1 }]; try { await apiRequest("/api/meal-plans", { method: "PUT", token: await getToken(), body: JSON.stringify({ weekStart: week, meals: next }) }); setSelectedDate(""); setQuery(""); await plan.refresh(); } catch { /* refresh exposes server errors through the hook */ } }
  async function remove(mealId: string) { await apiRequest(`/api/meal-plans?weekStart=${week}&mealId=${encodeURIComponent(mealId)}`, { method: "DELETE", token: await getToken() }); await plan.refresh(); }
  return <Screen><Text style={styles.eyebrow}>PLAN YOUR WEEK</Text><Text style={styles.title}>Meals that support you.</Text><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}><Button label="‹ Previous" variant="secondary" onPress={() => setOffset(offset - 1)} /><Button label="Next ›" variant="secondary" onPress={() => setOffset(offset + 1)} /></View>
    {plan.loading && <EmptyState title="Loading your plan..." body="Fetching the meals saved for this week." />}{plan.error && <Text style={styles.error}>{plan.error}</Text>}
    {weekDays.map((date) => <Card key={date}><Text style={styles.sectionTitle}>{date}</Text>{["breakfast", "lunch", "dinner", "snack"].map((type) => { const meal = plan.data?.meals.find((item) => item.date === date && item.mealType === type); return <View key={type} style={{ marginBottom: 8 }}><Text style={styles.caption}>{type.toUpperCase()}</Text>{meal ? <View><Text style={styles.body}>{meal.itemName} · {Math.round(meal.calories)} kcal</Text><Text onPress={() => remove(meal.id)} style={styles.link}>Remove</Text></View> : <Text onPress={() => { setSelectedDate(date); setMealType(type); }} style={styles.link}>+ Add meal</Text>}</View>; })}</Card>)}
    {!!selectedDate && <Card><Text style={styles.sectionTitle}>Add {mealType} for {selectedDate}</Text><TextField label="Search food" placeholder="Search the library" value={query} onChangeText={setQuery} />{foods.data?.slice(0, 6).map((food) => <Text key={food.id} onPress={() => saveMeal(food)} style={styles.action}>{food.name} · {food.calories} kcal</Text>)}<Button label="Cancel" variant="secondary" onPress={() => setSelectedDate("")} /></Card>}
  </Screen>;
}
