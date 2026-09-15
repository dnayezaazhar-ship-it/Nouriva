/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateFoodLog, formatNumber, mealTypes, nutritionTotals } from "@/lib/nutrition";
import type { Food, FoodLog } from "@/types";

export default function LogPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [foodId, setFoodId] = useState("");
  const [query, setQuery] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [servings, setServings] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [foodResponse, logResponse] = await Promise.all([fetch("/api/foods"), fetch("/api/logs")]);
      if (!foodResponse.ok) throw new Error((await foodResponse.json()).message ?? "Unable to load foods.");
      if (!logResponse.ok) throw new Error((await logResponse.json()).message ?? "Unable to load today's logs.");
      const foodData = await foodResponse.json() as Food[];
      setFoods(foodData); setLogs(await logResponse.json() as FoodLog[]);
      const requested = new URLSearchParams(window.location.search).get("food");
      setFoodId(requested && foodData.some((food) => food.id === requested) ? requested : foodData[0]?.id ?? "");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to load food logging."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filteredFoods = useMemo(() => foods.filter((food) => `${food.name} ${food.cuisine}`.toLowerCase().includes(query.toLowerCase())), [foods, query]);
  const food = foods.find((item) => item.id === foodId);
  const preview = food ? calculateFoodLog(food, Number(servings)) : null;
  const totals = nutritionTotals(logs);

  async function save() {
    if (!food || !preview || !Number.isFinite(Number(servings)) || Number(servings) < 0.25) { setError("Choose a food and enter at least 0.25 servings."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/logs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ foodId, mealType, servings: Number(servings) }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to save this food log.");
      const created = await response.json() as FoodLog;
      setLogs((current) => [created, ...current]); setMessage(`${food.name} was added to today's log.`); setServings("1");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to save this food log."); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Remove this food from today's log?")) return;
    setDeleting(id); setError("");
    try {
      const response = await fetch(`/api/logs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to delete this log.");
      setLogs((current) => current.filter((log) => log.id !== id));
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to delete this log."); }
    finally { setDeleting(""); }
  }

  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">Food log</div><h1>Add something nourishing.</h1><p>Today's entries are saved securely to your account and remain after refresh.</p></div><Link href="/foods" className="button button-ghost">Browse foods</Link></div>
    {message && <div className="toast" role="status">{message}</div>}{error && <div className="error-box" role="alert">{error}</div>}
    {loading ? <div className="app-card loading-state">Loading today's food log…</div> : <div className="log-layout"><section className="app-card"><h2 className="section-title">Log a food</h2><div className="form-grid"><div className="form-field full"><label htmlFor="log-search">Search foods</label><input id="log-search" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or cuisine" /></div><div className="form-field full"><label htmlFor="log-food">Food</label><select id="log-food" className="select" value={foodId} onChange={(event) => setFoodId(event.target.value)}>{filteredFoods.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.calories} kcal / {item.servingSize}</option>)}</select></div><div className="form-field"><label htmlFor="log-meal">Meal</label><select id="log-meal" className="select" value={mealType} onChange={(event) => setMealType(event.target.value)}>{mealTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className="form-field"><label htmlFor="log-servings">Servings</label><input id="log-servings" className="input" min="0.25" max="20" step="0.25" type="number" value={servings} onChange={(event) => setServings(event.target.value)} /></div></div>{food && preview && <div className="preview-card"><span className="pill">Preview · {food.name}</span><div className="food-meta"><span>{preview.calories} kcal</span><span>{formatNumber(preview.protein)}g protein</span><span>{formatNumber(preview.carbohydrates)}g carbs</span><span>{formatNumber(preview.fat)}g fat</span><span>{formatNumber(preview.fiber)}g fiber</span></div></div>}<button className="button button-primary full-button" type="button" onClick={save} disabled={saving || !food}>{saving ? "Saving…" : "Add to today's log →"}</button></section>
      <aside className="app-card"><h2 className="section-title">Today's totals</h2><div className="today-totals"><b>{totals.calories}<small> kcal</small></b><span>{formatNumber(totals.protein)}g protein</span><span>{formatNumber(totals.carbohydrates)}g carbs</span><span>{formatNumber(totals.fat)}g fat</span><span>{formatNumber(totals.fiber)}g fiber</span></div><h2 className="section-title" style={{ marginTop: 28 }}>Logged foods</h2>{logs.length === 0 ? <div className="empty-state compact"><strong>No meals logged yet.</strong><span>Add your first food above.</span></div> : <div className="logged-list">{logs.map((log) => <div className="logged-item" key={log.id}><div><b>{log.foodName}</b><small>{log.mealType} · {log.servings} serving{log.servings === 1 ? "" : "s"}</small></div><div><strong>{log.calories} kcal</strong><button type="button" className="delete-button" onClick={() => remove(log.id)} disabled={deleting === log.id}>{deleting === log.id ? "…" : "Remove"}</button></div></div>)}</div>}</aside>
    </div>}
  </div>;
}
