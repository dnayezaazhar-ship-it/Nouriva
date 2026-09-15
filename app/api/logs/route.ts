import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { seedData } from "@/seed/data";
import { calculateFoodLog } from "@/lib/nutrition";
import type { MealType } from "@/types";

export const dynamic = "force-dynamic";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function dayRange(dateValue: string | null) {
  const date = dateValue ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_DATE");
  const start = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new Error("INVALID_DATE");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { date, start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const { start, end } = dayRange(new URL(request.url).searchParams.get("date"));
    const snapshot = await db.collection("users").doc(userId).collection("foodLogs")
      .where("loggedAt", ">=", start).where("loggedAt", "<", end).orderBy("loggedAt", "desc").get();
    return NextResponse.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    if (error instanceof Error && (error.message === "INVALID_DATE" || error.message === "UNAUTHORIZED")) {
      const result = error.message === "UNAUTHORIZED" ? apiError(error) : { status: 400, message: "Use a valid date in YYYY-MM-DD format." };
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { foodId?: unknown; mealType?: unknown; servings?: unknown };
    const food = typeof body.foodId === "string" ? seedData.foods.find((item) => item.id === body.foodId) : undefined;
    const servings = typeof body.servings === "number" ? body.servings : Number(body.servings);
    if (!food || typeof body.mealType !== "string" || !mealTypes.includes(body.mealType as MealType) || !Number.isFinite(servings) || servings < 0.25 || servings > 20) {
      return NextResponse.json({ message: "Food, meal type, and servings are invalid." }, { status: 400 });
    }
    const nutrition = calculateFoodLog(food, servings);
    const loggedAt = new Date().toISOString();
    const log = { ...nutrition, foodId: food.id, foodName: food.name, mealType: body.mealType, loggedAt, date: loggedAt.slice(0, 10), userId };
    const ref = await db.collection("users").doc(userId).collection("foodLogs").add(log);
    return NextResponse.json({ id: ref.id, ...log }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[A-Za-z0-9_-]{1,150}$/.test(id)) {
      return NextResponse.json({ message: "A valid log ID is required." }, { status: 400 });
    }
    const ref = db.collection("users").doc(userId).collection("foodLogs").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ message: "Food log not found." }, { status: 404 });
    await ref.delete();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
