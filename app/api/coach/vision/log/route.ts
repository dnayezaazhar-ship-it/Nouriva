import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import type { MealType, VisionMealItem } from "@/types";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { mealType?: unknown; items?: unknown };
    const mealType = typeof body.mealType === "string" && mealTypes.includes(body.mealType as MealType) ? body.mealType as MealType : undefined;
    const items = Array.isArray(body.items) ? body.items : [];
    if (!mealType || items.length === 0 || items.length > 20) {
      return NextResponse.json({ message: "The food analysis is invalid or empty." }, { status: 400 });
    }
    const logs = items.map((value) => {
      const item = value as Partial<VisionMealItem>;
      const numeric = [item.servings, item.calories, item.protein, item.carbohydrates, item.fat, item.fiber].map(Number);
      if (typeof item.name !== "string" || typeof item.portion !== "string" || numeric.some((number) => !Number.isFinite(number) || number < 0)) {
        throw new Error("INVALID_ANALYSIS");
      }
      const loggedAt = new Date().toISOString();
      return {
        ...Object.fromEntries(["calories", "protein", "carbohydrates", "fat", "fiber"].map((key, index) => [key, numeric[index + 1]])),
        foodId: `vision_${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80)}`,
        foodName: item.name.trim().slice(0, 120),
        mealType,
        servings: Math.min(20, Math.max(0.25, numeric[0] || 1)),
        servingSize: item.portion.trim().slice(0, 80),
        loggedAt,
        date: loggedAt.slice(0, 10),
        userId,
        source: "coach-vision",
      };
    });
    const batch = db.batch();
    const refs = logs.map(() => db.collection("users").doc(userId).collection("foodLogs").doc());
    logs.forEach((log, index) => batch.set(refs[index], log));
    await batch.commit();
    return NextResponse.json({ logs: logs.map((log, index) => ({ id: refs[index].id, ...log })) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ANALYSIS") {
      return NextResponse.json({ message: "The food analysis contains invalid nutrition values." }, { status: 400 });
    }
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
