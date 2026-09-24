import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { apiRequest } from "@/src/services/api";
import { Button, Screen, SelectField, TextField } from "@/src/components";
import { styles } from "@/src/theme";

export default function OnboardingScreen() {
  const { getToken } = useAuth(); const [form, setForm] = useState({ name: "", age: "", gender: "Prefer not to say", height: "", weight: "", activityLevel: "moderate", goalId: "goal_balanced_nutrition", dietaryPreference: "none", allergies: "" }); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false); const savingRef = useRef(false);
  useEffect(() => { void (async () => { const profile = await apiRequest<Record<string, unknown>>("/api/profile", { token: await getToken() }); setForm((current) => ({ ...current, name: typeof profile.name === "string" ? profile.name : current.name, age: profile.age ? String(profile.age) : current.age, gender: typeof profile.gender === "string" ? profile.gender : current.gender, height: profile.height ? String(profile.height) : current.height, weight: profile.weight ? String(profile.weight) : current.weight, activityLevel: typeof profile.activityLevel === "string" ? profile.activityLevel : current.activityLevel, goalId: typeof profile.goalId === "string" ? profile.goalId : current.goalId, dietaryPreference: typeof profile.dietaryPreference === "string" ? profile.dietaryPreference : current.dietaryPreference, allergies: Array.isArray(profile.allergies) ? profile.allergies.join(", ") : current.allergies })); })().catch(() => undefined); }, [getToken]);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const genderOptions = ["Female", "Male", "Non-binary", "Prefer not to say"].map((value) => ({ label: value, value }));
  async function save() {
    if (savingRef.current) return;
    const age = Number(form.age); const height = Number(form.height); const weight = Number(form.weight);
    if (!form.name.trim() || !Number.isInteger(age) || age < 13 || age > 120 || !Number.isFinite(height) || height <= 0 || !Number.isFinite(weight) || weight <= 0 || !form.gender) { setMessage("Please complete your name, age, gender, height, and weight."); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      setMessage("");
      await apiRequest("/api/profile", { method: "POST", token: await getToken(), body: JSON.stringify({ ...form, age: Number(form.age), height: Number(form.height), weight: Number(form.weight), allergies: form.allergies.split(",").map((item) => item.trim()).filter(Boolean), completedOnboarding: true }) });
      await router.replace("/");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save your profile.");
      savingRef.current = false;
      setSaving(false);
    }
  }
  return <Screen><Text style={styles.eyebrow}>STEP 2 OF 2</Text><Text style={styles.title}>Make Nouriva yours.</Text><Text style={styles.body}>Add a few details to personalize your nutrition guidance.</Text>
    <TextField label="Name" placeholder="Your name" value={form.name} onChangeText={(value) => set("name", value)} /><TextField label="Age" placeholder="Your age" value={form.age} onChangeText={(value) => set("age", value)} keyboardType="number-pad" /><SelectField label="Gender" value={form.gender} options={genderOptions} onChange={(value) => set("gender", value)} /><TextField label="Height (in cm)" placeholder="e.g. 170" value={form.height} onChangeText={(value) => set("height", value)} keyboardType="number-pad" /><TextField label="Weight (kg)" value={form.weight} onChangeText={(value) => set("weight", value)} keyboardType="decimal-pad" /><TextField label="Allergies/intolerances (comma separated)" value={form.allergies} onChangeText={(value) => set("allergies", value)} />{!!message && <Text style={styles.error}>{message}</Text>}<Button label={saving ? "Saving..." : "Save profile"} onPress={save} />
  </Screen>;
}
