"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { seedData } from "@/seed/data";

type OnboardingForm = {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  goalId: string;
  dietaryPreference: string;
  allergies: string;
};

const initialForm: OnboardingForm = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  activityLevel: "moderate",
  goalId: "goal_balanced_nutrition",
  dietaryPreference: "none",
  allergies: "",
};

export default function OnboardingPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load your profile.");
        return response.json();
      })
      .then((profile) => {
        if (!active) return;
        if (profile.completedOnboarding) {
          router.replace("/dashboard");
          return;
        }
        setForm((current) => ({
          ...current,
          ...Object.fromEntries(
            Object.keys(current).map((key) => [key, typeof profile[key] === "string" ? profile[key] : current[key as keyof OnboardingForm]]),
          ),
          allergies: Array.isArray(profile.allergies) ? profile.allergies.join(", ") : current.allergies,
        }));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  function update(field: keyof OnboardingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function save() {
    const age = Number(form.age);
    const height = Number(form.height);
    const weight = Number(form.weight);
    if (!form.name.trim() || !Number.isInteger(age) || age < 13 || age > 120 || !Number.isFinite(height) || height <= 0 || !Number.isFinite(weight) || weight <= 0 || !form.gender || !form.activityLevel || !form.goalId) {
      setError("Please complete your name, age, gender, height, weight, activity level, and nutrition goal.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          age,
          height,
          weight,
          allergies: form.allergies.split(",").map((item) => item.trim()).filter(Boolean),
          completedOnboarding: true,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to save your onboarding.");
      setSuccess("Your Nouriva profile is ready. Redirecting to your dashboard…");
      window.setTimeout(() => router.replace("/dashboard"), 600);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to save your onboarding.");
      setSaving(false);
    }
  }

  if (loading) return <main className="auth-page"><div className="app-card loading-state">Loading your onboarding…</div></main>;

  return (
    <main className="auth-page">
      <div className="auth-brand"><span className="brand-mark">N</span> nouriva</div>
      <section className="onboarding-card">
        <div className="eyebrow">A few details</div>
        <h1>Make Nouriva yours.</h1>
        <p className="page-copy">We use this information to personalize your wellness experience. You can update it later.</p>
        {error && <div className="error-box" role="alert">{error}</div>}
        {success && <div className="toast" role="status">{success}</div>}
        <div className="form-grid">
          <div className="form-field full"><label htmlFor="name">Name</label><input id="name" className="input" value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" /></div>
          <div className="form-field"><label htmlFor="age">Age</label><input id="age" className="input" type="number" min="13" max="120" value={form.age} onChange={(event) => update("age", event.target.value)} /></div>
          <div className="form-field"><label htmlFor="gender">Gender</label><select id="gender" className="select" value={form.gender} onChange={(event) => update("gender", event.target.value)}><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></div>
          <div className="form-field"><label htmlFor="height">Height (cm)</label><input id="height" className="input" type="number" min="50" max="250" value={form.height} onChange={(event) => update("height", event.target.value)} /></div>
          <div className="form-field"><label htmlFor="weight">Weight (kg)</label><input id="weight" className="input" type="number" min="20" max="500" step="0.1" value={form.weight} onChange={(event) => update("weight", event.target.value)} /></div>
          <div className="form-field"><label htmlFor="activityLevel">Activity level</label><select id="activityLevel" className="select" value={form.activityLevel} onChange={(event) => update("activityLevel", event.target.value)}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="high">High</option></select></div>
          <div className="form-field"><label htmlFor="goalId">Nutrition goal</label><select id="goalId" className="select" value={form.goalId} onChange={(event) => update("goalId", event.target.value)}>{seedData.nutritionGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></div>
          <div className="form-field"><label htmlFor="dietaryPreference">Dietary preference</label><select id="dietaryPreference" className="select" value={form.dietaryPreference} onChange={(event) => update("dietaryPreference", event.target.value)}><option value="none">No preference</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="halal">Halal</option></select></div>
          <div className="form-field full"><label htmlFor="allergies">Allergies or intolerances <span className="optional">(optional, separate with commas)</span></label><input id="allergies" className="input" value={form.allergies} onChange={(event) => update("allergies", event.target.value)} placeholder="For example: peanuts, lactose" /></div>
        </div>
        <p className="disclaimer">Nouriva is a nutrition and wellness tool, not a replacement for a doctor or qualified dietitian. Health information is stored privately with your account.</p>
        <button className="button button-primary full-button" type="button" onClick={save} disabled={saving}>{saving ? "Saving your profile…" : "Continue to Nouriva →"}</button>
      </section>
    </main>
  );
}
