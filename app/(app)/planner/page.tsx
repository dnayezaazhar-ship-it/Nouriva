"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatNumber, mealTypes, nutritionTotals } from "@/lib/nutrition";
import type { Food, MealPlan, MealType, PlannedMeal, PlannedMealItemType, Recipe } from "@/types";

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function mondayFor(date: Date) {
  const result = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result.toISOString().slice(0, 10);
}

function shiftWeek(weekStart: string, amount: number) {
  const date = new Date(`${weekStart}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount * 7);
  return date.toISOString().slice(0, 10);
}

function weekDates(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date;
  });
}

export default function PlannerPage() {
  const [weekStart, setWeekStart] = useState(() => mondayFor(new Date()));
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null);
  const [itemType, setItemType] = useState<PlannedMealItemType>("recipe");
  const [itemId, setItemId] = useState("");
  const [servings, setServings] = useState("1");
  const [query, setQuery] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/foods"), fetch("/api/recipes")])
      .then(async ([foodResponse, recipeResponse]) => {
        if (!foodResponse.ok) throw new Error((await foodResponse.json()).message ?? "Unable to load foods.");
        if (!recipeResponse.ok) throw new Error((await recipeResponse.json()).message ?? "Unable to load recipes.");
        return { foodData: await foodResponse.json() as Food[], recipeData: await recipeResponse.json() as Recipe[] };
      })
      .then(({ foodData, recipeData }) => {
        setFoods(foodData); setRecipes(recipeData);
        setItemId(recipeData[0]?.id ?? foodData[0]?.id ?? "");
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load planner items."))
      .finally(() => setLibraryLoading(false));
  }, []);

  useEffect(() => {
    setPlanLoading(true);
    fetch(`/api/meal-plans?weekStart=${weekStart}`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load this meal plan.");
        return response.json() as Promise<MealPlan>;
      })
      .then((data) => { setPlan(data); setError(""); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load this meal plan."))
      .finally(() => setPlanLoading(false));
  }, [weekStart]);

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const items = itemType === "food" ? foods : recipes;
  const filteredItems = items.filter((item) => `${item.name} ${itemType === "food" ? (item as Food).cuisine : (item as Recipe).description}`.toLowerCase().includes(query.toLowerCase()));
  const meals = plan?.meals ?? [];
  const total = nutritionTotals(meals);
  const loading = libraryLoading || planLoading;

  async function persist(nextMeals: PlannedMeal[], successMessage: string) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/meal-plans", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekStart, meals: nextMeals.map((meal) => ({ date: meal.date, mealType: meal.mealType, itemType: meal.itemType, itemId: meal.itemId, servings: meal.servings })) }),
      });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to save this meal plan.");
      setPlan(await response.json() as MealPlan);
      setSelectedSlot(null);
      setMessage(successMessage);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to save this meal plan.");
    } finally { setSaving(false); }
  }

  function openSlot(date: string, mealType: MealType, existing?: PlannedMeal) {
    setSelectedSlot({ date, mealType });
    setItemType(existing?.itemType ?? "recipe");
    setItemId(existing?.itemId ?? (recipes[0]?.id ?? foods[0]?.id ?? ""));
    setServings(String(existing?.servings ?? 1));
    setQuery("");
  }

  function saveSlot() {
    if (!selectedSlot || !itemId || !Number.isFinite(Number(servings)) || Number(servings) < 0.25) {
      setError("Choose a food or recipe and enter at least 0.25 servings.");
      return;
    }
    const nextMeals = meals.filter((meal) => meal.id !== `${selectedSlot.date}:${selectedSlot.mealType}`);
    nextMeals.push({ id: `${selectedSlot.date}:${selectedSlot.mealType}`, ...selectedSlot, itemType, itemId, itemName: "", servings: Number(servings), calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
    void persist(nextMeals, "Meal plan saved.");
  }

  function removeMeal(meal: PlannedMeal) {
    void persist(meals.filter((item) => item.id !== meal.id), `${meal.itemName} removed from your plan.`);
  }

  const mealFor = (date: Date, mealType: MealType) => meals.find((meal) => meal.date === date.toISOString().slice(0, 10) && meal.mealType === mealType);
  const isCurrentWeek = weekStart === mondayFor(new Date());

  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">Plan with ease</div><h1>Your meal planner.</h1><p>Build a flexible week from Nouriva&apos;s food and recipe library.</p></div><Link href="/log" className="button button-primary">+ Log something eaten</Link></div>
    {message && <div className="toast" role="status">{message}</div>}
    {error && <div className="error-box" role="alert">{error}</div>}
    <section className="app-card planner-overview">
      <div><span className="pill">{isCurrentWeek ? "Current week" : "Planned week"}</span><h2 className="section-title">Your week at a glance</h2><p>Planned meals are separate from your food log. Add, replace, or remove them whenever your day changes.</p></div>
      <div className="week-controls"><button type="button" className="button button-ghost" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>← Previous</button><b>{dayFormatter.format(dates[0])} – {dayFormatter.format(dates[6])}</b><button type="button" className="button button-ghost" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>Next →</button>{!isCurrentWeek && <button type="button" className="text-link" onClick={() => setWeekStart(mondayFor(new Date()))}>Back to this week</button>}</div>
    </section>
    {loading ? <div className="app-card loading-state">Loading your meal plan…</div> : <><div className="planner-grid">{dates.map((date) => <article className="app-card planner-day" key={date.toISOString()}><header><b>{dayFormatter.format(date)}</b><span>{nutritionTotals(meals.filter((meal) => meal.date === date.toISOString().slice(0, 10))).calories} kcal</span></header>{mealTypes.map(({ value, label }) => { const meal = mealFor(date, value); return <div className="planner-slot" key={value}><div className="planner-slot-label"><span>{value === "breakfast" ? "☀️" : value === "lunch" ? "🥗" : value === "dinner" ? "🍲" : "🍎"}</span><small>{label}</small></div>{meal ? <div className="planned-meal"><div><b>{meal.itemName}</b><small>{meal.itemType} · {meal.servings} serving{meal.servings === 1 ? "" : "s"} · {meal.calories} kcal</small></div><div className="slot-actions"><button type="button" className="text-link" onClick={() => openSlot(meal.date, meal.mealType, meal)}>Replace</button><button type="button" className="delete-button" onClick={() => removeMeal(meal)} disabled={saving}>Remove</button></div></div> : <button type="button" className="planner-add" onClick={() => openSlot(date.toISOString().slice(0, 10), value)}>+ Add {label.toLowerCase()}</button>}</div>; })}</article>)}</div><section className="app-card planner-total"><div><span className="pill">Weekly overview</span><h2 className="section-title">Planned nutrition</h2></div><div className="planner-total-metrics">{[["Calories", `${total.calories} kcal`], ["Protein", `${formatNumber(total.protein)}g`], ["Carbohydrates", `${formatNumber(total.carbohydrates)}g`], ["Fat", `${formatNumber(total.fat)}g`], ["Fiber", `${formatNumber(total.fiber)}g`]].map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div></section></>}
    {selectedSlot && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedSlot(null)}><div className="detail-modal planner-modal" role="dialog" aria-modal="true" aria-labelledby="planner-modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Close meal editor" onClick={() => setSelectedSlot(null)}>×</button><span className="pill">{title(selectedSlot.mealType)} · {dayFormatter.format(new Date(`${selectedSlot.date}T00:00:00.000Z`))}</span><h2 id="planner-modal-title">Choose a meal</h2><p>Pick from the existing library and set the portion you expect to eat.</p><div className="form-grid"><div className="form-field"><label htmlFor="planner-type">Type</label><select id="planner-type" className="select" value={itemType} onChange={(event) => { const nextType = event.target.value as PlannedMealItemType; setItemType(nextType); setItemId((nextType === "recipe" ? recipes[0]?.id : foods[0]?.id) ?? ""); }}><option value="recipe">Recipe</option><option value="food">Food</option></select></div><div className="form-field"><label htmlFor="planner-servings">Servings</label><input id="planner-servings" className="input" type="number" min="0.25" max="20" step="0.25" value={servings} onChange={(event) => setServings(event.target.value)} /></div><div className="form-field full"><label htmlFor="planner-search">Search {itemType}s</label><input id="planner-search" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or description" /></div><div className="form-field full"><label htmlFor="planner-item">Meal</label><select id="planner-item" className="select" value={itemId} onChange={(event) => setItemId(event.target.value)}>{filteredItems.map((item) => <option key={item.id} value={item.id}>{item.name}{itemType === "food" ? ` · ${(item as Food).calories} kcal / ${(item as Food).servingSize}` : ` · ${(item as Recipe).calories} kcal per serving`}</option>)}</select></div></div><button type="button" className="button button-primary full-button" onClick={saveSlot} disabled={saving || !itemId}>{saving ? "Saving…" : "Save to planner →"}</button></div></div>}
  </div>;
}
