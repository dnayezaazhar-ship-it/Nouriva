import { Redirect, Link } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { BackButton, Button, Card, EmptyState, Screen, SelectField, TextField } from "@/src/components";
import { styles } from "@/src/theme";

type Profile = { name?: string; age?: number; gender?: string; height?: number; weight?: number; goalId?: string; dietaryPreference?: string; activityLevel?: string; allergies?: string[]; completedOnboarding?: boolean };

const goals = [{ label: "Weight Loss", value: "goal_weight_loss" }, { label: "Weight Maintenance", value: "goal_weight_maintenance" }, { label: "Weight Gain", value: "goal_weight_gain" }, { label: "Fat Burn", value: "goal_fat_burn" }, { label: "Muscle Gain", value: "goal_muscle_gain" }, { label: "High Protein", value: "goal_high_protein" }, { label: "High Fiber", value: "goal_high_fiber" }, { label: "Balanced Nutrition", value: "goal_balanced_nutrition" }];
const genders = ["Female", "Male", "Non-binary", "Prefer not to say"].map((value) => ({ label: value, value }));
const activities = [{ label: "Sedentary", value: "sedentary" }, { label: "Light", value: "light" }, { label: "Moderate", value: "moderate" }, { label: "High", value: "high" }];
const preferences = [{ label: "No preference", value: "none" }, { label: "Vegetarian", value: "vegetarian" }, { label: "Vegan", value: "vegan" }, { label: "Halal", value: "halal" }];

export default function ProfileScreen() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const profile = useApi<Profile>("/api/profile");
  const [form, setForm] = useState({ name: "", age: "", gender: "Prefer not to say", height: "", weight: "", goalId: "goal_weight_maintenance", dietaryPreference: "none", activityLevel: "moderate", allergies: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const data = profile.data;
    if (data) setForm({ name: data.name ?? "", age: data.age ? String(data.age) : "", gender: data.gender ?? "Prefer not to say", height: data.height ? String(data.height) : "", weight: data.weight ? String(data.weight) : "", goalId: data.goalId ?? "goal_weight_maintenance", dietaryPreference: data.dietaryPreference ?? "none", activityLevel: data.activityLevel ?? "moderate", allergies: data.allergies?.join(", ") ?? "" });
  }, [profile.data]);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function save() {
    const age = Number(form.age); const height = Number(form.height); const weight = Number(form.weight);
    if (form.name.trim().length < 2 || !Number.isInteger(age) || age < 13 || age > 120 || !Number.isFinite(height) || height < 50 || height > 250 || !Number.isFinite(weight) || weight < 20 || weight > 500) { setMessage("Please enter valid profile details."); return; }
    setSaving(true); setMessage("");
    try {
      await apiRequest("/api/profile", { method: "POST", token: await getToken(), body: JSON.stringify({ ...form, age, height, weight, allergies: form.allergies.split(",").map((item) => item.trim()).filter(Boolean), completedOnboarding: true }) });
      setMessage("Profile updated."); await profile.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update your profile."); }
    finally { setSaving(false); }
  }
  if (isLoaded && !isSignedIn) return <Redirect href="/auth" />;
  if (!isLoaded || profile.loading) return <Screen centered><EmptyState title="Loading your profile..." body="Fetching your saved Nouriva details." /></Screen>;
  if (profile.error) return <Screen><Text style={styles.error}>{profile.error}</Text></Screen>;
  return <Screen><BackButton /><Text style={styles.eyebrow}>YOUR PROFILE</Text><Text style={styles.title}>{form.name || "Your Nouriva profile"}</Text><Text style={styles.body}>Keep your personal details and nutrition preferences up to date.</Text>
    <Card><Text style={styles.sectionTitle}>Personal details</Text><TextField label="Name" value={form.name} onChangeText={(value) => set("name", value)} /><TextField label="Age" value={form.age} onChangeText={(value) => set("age", value)} keyboardType="number-pad" /><SelectField label="Gender" value={form.gender} options={genders} onChange={(value) => set("gender", value)} /><TextField label="Height (cm)" value={form.height} onChangeText={(value) => set("height", value)} keyboardType="number-pad" /><TextField label="Current weight (kg)" value={form.weight} onChangeText={(value) => set("weight", value)} keyboardType="decimal-pad" /></Card>
    <Card><Text style={styles.sectionTitle}>Nutrition preferences</Text><SelectField label="Nutrition goal" value={form.goalId} options={goals} onChange={(value) => set("goalId", value)} /><SelectField label="Dietary preference" value={form.dietaryPreference} options={preferences} onChange={(value) => set("dietaryPreference", value)} /><SelectField label="Activity level" value={form.activityLevel} options={activities} onChange={(value) => set("activityLevel", value)} /><TextField label="Allergies or intolerances" placeholder="Separate with commas" value={form.allergies} onChangeText={(value) => set("allergies", value)} /><Button label={saving ? "Saving..." : "Save profile"} onPress={save} /></Card>
    {!!message && <Text style={message === "Profile updated." ? styles.success : styles.error}>{message}</Text>}
    <Link href="/health-history" style={styles.action}>Review health history →</Link>
  </Screen>;
}
