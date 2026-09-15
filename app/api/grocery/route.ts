import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { seedData } from "@/seed/data";
import type { GroceryCategory } from "@/seed/types";
import type { Firestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
const categories: GroceryCategory[] = ["produce", "protein", "dairy", "grains", "pantry", "snacks", "spices", "frozen", "beverages"];
const defaultWeek = () => { const date = new Date(); const day = date.getUTCDay(); date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1)); return date.toISOString().slice(0, 10); };
const listRef = (db: Firestore, userId: string, week: string) => db.collection("users").doc(userId).collection("groceryLists").doc(week);
const validWeek = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function GET(request: Request) {
  try { const { userId, db } = await requireUser(); const week = new URL(request.url).searchParams.get("weekStart") ?? defaultWeek(); if (!validWeek(week)) return NextResponse.json({ message: "Invalid week." }, { status: 400 }); const snapshot = await listRef(db, userId, week).get(); return NextResponse.json(snapshot.exists ? snapshot.data() : { weekStart: week, items: [] }); }
  catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}

function normalizeItems(rawItems: unknown[]) {
  return rawItems.map((raw) => { const item = raw as Record<string, unknown>; const category = categories.includes(item.category as GroceryCategory) ? item.category : "pantry"; return { id: typeof item.id === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(item.id) ? item.id : crypto.randomUUID(), name: typeof item.name === "string" ? item.name.trim().slice(0, 120) : "", category, quantity: typeof item.quantity === "string" ? item.quantity.trim().slice(0, 40) : "1", checked: item.checked === true }; }).filter((item) => item.name);
}

export async function PUT(request: Request) {
  try { const { userId, db } = await requireUser(); const body = await request.json() as { weekStart?: unknown; items?: unknown }; if (!validWeek(body.weekStart) || !Array.isArray(body.items) || body.items.length > 300) return NextResponse.json({ message: "A valid week and grocery items are required." }, { status: 400 }); const data = { weekStart: body.weekStart, items: normalizeItems(body.items), updatedAt: new Date().toISOString() }; await listRef(db, userId, body.weekStart).set(data, { merge: true }); return NextResponse.json(data); }
  catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser(); const body = await request.json() as { weekStart?: unknown }; const week = body.weekStart ?? defaultWeek(); if (!validWeek(week)) return NextResponse.json({ message: "Invalid week." }, { status: 400 });
    const plan = await db.collection("users").doc(userId).collection("mealPlans").doc(week).get(); const recipes = new Map(seedData.recipes.map((recipe) => [recipe.id, recipe])); const foods = new Map(seedData.foods.map((food) => [food.id, food])); const totals = new Map<string, { id: string; name: string; category: string; quantity: number; unit: string; checked: boolean }>();
    for (const meal of (plan.data()?.meals ?? []) as { itemType: string; itemId: string; servings: number }[]) {
      if (meal.itemType === "food") {
        const food = foods.get(meal.itemId);
        if (food) totals.set(food.id, { id: food.id, name: food.name, category: food.category === "fruit" || food.category === "vegetable" ? "produce" : food.category === "dairy" ? "dairy" : food.category === "protein" ? "protein" : "pantry", quantity: meal.servings, unit: food.servingSize, checked: false });
        continue;
      }
      const recipe = recipes.get(meal.itemId); if (!recipe) continue;
      for (const ingredient of recipe.ingredients) { const food = foods.get(ingredient.foodId); if (!food) continue; const existing = totals.get(food.id); if (existing) existing.quantity += ingredient.quantity * meal.servings; else totals.set(food.id, { id: food.id, name: food.name, category: food.category === "fruit" || food.category === "vegetable" ? "produce" : food.category === "dairy" ? "dairy" : food.category === "protein" ? "protein" : "pantry", quantity: ingredient.quantity * meal.servings, unit: ingredient.unit, checked: false }); }
    }
    const data = { weekStart: week, items: Array.from(totals.values()).map((item) => ({ ...item, quantity: `${Math.round(item.quantity * 100) / 100} ${item.unit}` })), updatedAt: new Date().toISOString() }; await listRef(db, userId, week).set(data); return NextResponse.json(data);
  } catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}

export async function PATCH(request: Request) {
  try { const { userId, db } = await requireUser(); const body = await request.json() as Record<string, unknown>; if (!validWeek(body.weekStart) || typeof body.id !== "string") return NextResponse.json({ message: "A valid week and item ID are required." }, { status: 400 }); const ref = listRef(db, userId, body.weekStart); const snapshot = await ref.get(); if (!snapshot.exists) return NextResponse.json({ message: "Grocery list not found." }, { status: 404 }); const data = snapshot.data() as { items?: Array<Record<string, unknown>> }; const items = data.items ?? []; const index = items.findIndex((item) => item.id === body.id); if (index < 0) return NextResponse.json({ message: "Grocery item not found." }, { status: 404 }); const current = items[index]; const next = { ...current, ...(typeof body.name === "string" ? { name: body.name.trim().slice(0, 120) } : {}), ...(typeof body.quantity === "string" ? { quantity: body.quantity.trim().slice(0, 40) } : {}), ...(typeof body.category === "string" && categories.includes(body.category as GroceryCategory) ? { category: body.category } : {}), ...(typeof body.checked === "boolean" ? { checked: body.checked } : {}) }; if (!String(next.name ?? "").trim()) return NextResponse.json({ message: "Item name cannot be empty." }, { status: 400 }); items[index] = next; const updated = { weekStart: body.weekStart, items, updatedAt: new Date().toISOString() }; await ref.set(updated, { merge: true }); return NextResponse.json(updated); }
  catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}

export async function DELETE(request: Request) {
  try { const { userId, db } = await requireUser(); const params = new URL(request.url).searchParams; const week = params.get("weekStart") ?? defaultWeek(); const id = params.get("id"); const clear = params.get("clearCompleted") === "true"; if (!validWeek(week) || (!id && !clear) || (id && !/^[A-Za-z0-9_-]{1,120}$/.test(id))) return NextResponse.json({ message: "A valid item or clear-completed request is required." }, { status: 400 }); const ref = listRef(db, userId, week); const snapshot = await ref.get(); if (!snapshot.exists) return NextResponse.json({ message: "Grocery list not found." }, { status: 404 }); const data = snapshot.data() as { items?: Array<Record<string, unknown>> }; const items = (data.items ?? []).filter((item) => clear ? item.checked !== true : item.id !== id); const updated = { weekStart: week, items, updatedAt: new Date().toISOString() }; await ref.set(updated, { merge: true }); return NextResponse.json(updated); }
  catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}
