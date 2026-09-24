"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Food } from "@/types";
import { formatNumber } from "@/lib/nutrition";

const categories = ["all", "Pakistani / Desi", "Indian", "Chinese", "Middle Eastern", "Mediterranean", "Western / Continental", "Japanese", "Korean", "Mexican", "Fruits", "Vegetables", "Grains", "Snacks", "Beverages"];

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [selected, setSelected] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category !== "all") params.set("category", category);
      if (cuisine !== "all") params.set("cuisine", cuisine);
      fetch(`/api/foods?${params}`)
        .then(async (response) => {
          if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load foods.");
          return response.json() as Promise<Food[]>;
        })
        .then((data) => { if (active) { setFoods(data); setError(""); } })
        .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load foods."); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, category, cuisine]);

  const cuisines = useMemo(() => ["all", ...Array.from(new Set(foods.map((food) => food.cuisine))).sort()], [foods]);
  function clearFilters() { setQuery(""); setCategory("all"); setCuisine("all"); }

  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">Food library</div><h1>Find your food.</h1><p>Explore global foods with practical, approximate nutrition reference values.</p></div><Link href="/log" className="button button-primary">+ Log a meal</Link></div>
    <div className="toolbar">
      <label className="sr-only" htmlFor="food-search">Search foods</label><input id="food-search" className="input search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods, ingredients, or cuisines…" />
      <label className="sr-only" htmlFor="food-category">Filter by category</label><select id="food-category" className="select" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>)}</select>
      <label className="sr-only" htmlFor="food-cuisine">Filter by cuisine</label><select id="food-cuisine" className="select" value={cuisine} onChange={(event) => setCuisine(event.target.value)}>{cuisines.map((item) => <option key={item} value={item}>{item === "all" ? "All cuisines" : item}</option>)}</select>
      {(query || category !== "all" || cuisine !== "all") && <button type="button" className="button button-ghost" onClick={clearFilters}>Clear</button>}
    </div>
    {loading && <div className="app-card loading-state">Loading the food library…</div>}
    {error && <div className="error-box" role="alert">{error}</div>}
    {!loading && !error && foods.length === 0 && <div className="app-card empty-state"><strong>No foods found</strong><span>Try a different search or clear your filters.</span></div>}
    {!loading && !error && foods.length > 0 && <div className="food-grid">{foods.map((food) => <article className="app-card food-card" key={food.id}><span className="pill">{food.category}</span><h3>{food.name}</h3><p>{food.servingSize} • {food.category === "Fruits" ? "fruit" : food.category === "Vegetables" ? "vegetable" : food.category}</p><div className="food-meta"><span>{food.calories} kcal</span><span>{formatNumber(food.protein)}g protein</span><span>{formatNumber(food.carbohydrates)}g carbs</span><span>{formatNumber(food.fat)}g fat</span><span>{formatNumber(food.fiber)}g fiber</span></div><div className="food-card-actions"><button type="button" className="text-link" onClick={() => setSelected(food)}>View details</button><Link className="text-link" href={`/log?food=${food.id}`}>Log food →</Link></div></article>)}</div>}
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="food-detail-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Close food details" onClick={() => setSelected(null)}>×</button><span className="pill">{selected.category}</span><h2 id="food-detail-title">{selected.name}</h2><p>{selected.cuisine} cuisine · reference serving: {selected.servingSize}</p><div className="nutrition-detail">{[["Calories", `${selected.calories} kcal`], ["Protein", `${formatNumber(selected.protein)} g`], ["Carbohydrates", `${formatNumber(selected.carbohydrates)} g`], ["Fat", `${formatNumber(selected.fat)} g`], ["Fiber", `${formatNumber(selected.fiber)} g`]].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div><p className="disclaimer">Nutrition values are approximate reference data and are not medical-grade measurements.</p><Link className="button button-primary" href={`/log?food=${selected.id}`}>Log this food</Link></div></div>}
  </div>;
}
