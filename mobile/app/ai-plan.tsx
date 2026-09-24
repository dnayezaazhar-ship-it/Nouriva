import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useAuth } from "@clerk/expo";
import { apiRequest } from "@/src/services/api";
import { BackButton, Button, Card, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";

type PlanItem = { name: string; portion: string; calories: number; protein: number; carbohydrates: number; fat: number };
type PlanSection = { mealType: string; items: PlanItem[] };
type PlanDay = { day: number; sections?: PlanSection[]; totals?: { calories: number; protein: number; carbohydrates: number; fat: number }; calorieGoal?: number; waterTarget?: number };
type Plan = { goal: string; days: number; plan?: PlanDay[] };

export default function AiPlanScreen() {
  const { getToken } = useAuth();
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState("1");
  const [result, setResult] = useState<Plan | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [water, setWater] = useState(0);

  useEffect(() => {
    void AsyncStorage.getItem("nouriva-ai-plan-water").then((stored) => {
      if (stored) setWater(Math.max(0, Number(stored) || 0));
    });
  }, []);

  async function generate() {
    const requestedDays = Number(days);
    if (loading) return;
    if (!Number.isInteger(requestedDays) || requestedDays < 1 || requestedDays > 7) {
      setMessage("Choose between 1 and 7 days.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      setResult(await apiRequest<Plan>("/api/ai-plan", {
        method: "POST",
        token: await getToken(),
        body: JSON.stringify({ goal, days: requestedDays }),
      }));
      setWater(0);
      await AsyncStorage.setItem("nouriva-ai-plan-water", "0");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate your plan.");
    } finally {
      setLoading(false);
    }
  }

  return <Screen>
    <BackButton />
    <Text style={styles.eyebrow}>AI DIET PLAN</Text>
    <Text style={styles.title}>Plan around your goals.</Text>
    <Text style={styles.body}>Your plan uses your Nouriva profile, dietary preference, allergies, and health goal.</Text>
    <TextField label="Personal health goal" placeholder="e.g. eat more balanced meals" value={goal} onChangeText={setGoal} />
    <TextField label="Number of days" value={days} onChangeText={(value) => setDays(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" />
    <Button label={loading ? "Generating..." : "Generate plan"} onPress={() => void generate()} disabled={loading} />
    {!!message && <Text style={styles.error}>{message}</Text>}
    {(result?.plan ?? []).map((day) => <Card key={day.day}>
      <Text style={styles.planDayTitle}>Day {day.day}</Text>
      {(day.sections ?? []).map((section) => <Card key={section.mealType}>
        <Text style={styles.mealHeading}>{section.mealType}</Text>
        {section.items.map((item) => <Text key={`${section.mealType}-${item.name}`} style={styles.planItem}>{item.name} — {item.portion} — {item.calories} kcal{"\n"}Protein: {item.protein}g | Carbs: {item.carbohydrates}g | Fat: {item.fat}g</Text>)}
      </Card>)}
      <Card><Text style={styles.totalTitle}>TOTAL DAILY NUTRITION</Text><Text style={styles.totalText}>Target: {day.calorieGoal ?? 0} kcal{"\n"}Actual: {Math.round(day.totals?.calories ?? 0)} kcal · Protein: {day.totals?.protein ?? 0}g · Carbs: {day.totals?.carbohydrates ?? 0}g · Fat: {day.totals?.fat ?? 0}g</Text></Card>
      <Card><Text style={styles.waterTitle}>WATER INTAKE</Text><Text style={styles.body}>Recommended: {day.waterTarget ?? 8} glasses · Logged: {water}/{day.waterTarget ?? 8}</Text><Button label={water >= (day.waterTarget ?? 8) ? "Water goal complete" : "Log one glass"} variant="secondary" onPress={() => { const next = Math.min(day.waterTarget ?? 8, water + 1); setWater(next); void AsyncStorage.setItem("nouriva-ai-plan-water", String(next)); }} /></Card>
    </Card>)}
  </Screen>;
}
