import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { apiRequest } from "@/src/services/api";
import { Button, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";

export default function OnboardingScreen() {
  const { getToken } = useAuth(); const [form, setForm] = useState({ name: "", age: "", gender: "Prefer not to say", height: "", weight: "", activityLevel: "moderate", goalId: "goal_balanced_nutrition", dietaryPreference: "none", allergies: "" }); const [message, setMessage] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function save() { try { setMessage(""); await apiRequest("/api/profile", { method: "POST", token: await getToken(), body: JSON.stringify({ ...form, age: Number(form.age), height: Number(form.height), weight: Number(form.weight), allergies: form.allergies.split(",").map((item) => item.trim()).filter(Boolean), completedOnboarding: true }) }); router.replace("/"); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save your profile."); } }
  return <Screen><Text style={styles.eyebrow}>A FEW DETAILS</Text><Text style={styles.title}>Make Nouriva yours.</Text><Text style={styles.body}>These details personalize nutrition guidance. You can update them later.</Text>
    <TextField label="Name" placeholder="Your name" value={form.name} onChangeText={(value) => set("name", value)} /><TextField label="Age" placeholder="Your age" value={form.age} onChangeText={(value) => set("age", value)} keyboardType="number-pad" /><TextField label="Gender" value={form.gender} onChangeText={(value) => set("gender", value)} /><TextField label="Height (cm)" value={form.height} onChangeText={(value) => set("height", value)} keyboardType="decimal-pad" /><TextField label="Weight (kg)" value={form.weight} onChangeText={(value) => set("weight", value)} keyboardType="decimal-pad" /><TextField label="Activity (sedentary/light/moderate/high)" value={form.activityLevel} onChangeText={(value) => set("activityLevel", value)} /><TextField label="Nutrition goal ID" value={form.goalId} onChangeText={(value) => set("goalId", value)} /><TextField label="Dietary preference (none/vegetarian/vegan/halal)" value={form.dietaryPreference} onChangeText={(value) => set("dietaryPreference", value)} /><TextField label="Allergies/intolerances (comma separated)" value={form.allergies} onChangeText={(value) => set("allergies", value)} />
    {!!message && <Text style={styles.error}>{message}</Text>}<Button label="Save profile" onPress={save} /></Screen>;
}
