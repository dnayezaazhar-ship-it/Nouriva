import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { seedData } from "@/seed/data";

export const dynamic = "force-dynamic";

type PlanItem = { name: string; portion: string; calories: number; protein: number; carbohydrates: number; fat: number };

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { days?: unknown; goal?: unknown };
    const days = typeof body.days === "number" ? body.days : Number(body.days);
    const goal = typeof body.goal === "string" ? body.goal.trim().slice(0, 160) : "";
    if (!Number.isInteger(days) || days < 1 || days > 7 || !goal) return NextResponse.json({ message: "Enter a goal and choose between 1 and 7 days." }, { status: 400 });
    const profile = (await db.collection("users").doc(userId).get()).data() ?? {};
    const allergies = Array.isArray(profile.allergies) ? profile.allergies.map((item) => String(item).toLowerCase()) : [];
    const preference = String(profile.dietaryPreference ?? "none").toLowerCase();
    const blocked = (name: string) => allergies.some((allergy) => allergy && name.toLowerCase().includes(allergy));
    const allowed = (name: string) => {
      if (blocked(name)) return false;
      if (preference === "vegan" && ["yogurt", "chicken", "salmon", "egg", "milk", "cheese"].some((term) => name.toLowerCase().includes(term))) return false;
      if (preference === "vegetarian" && ["chicken", "salmon", "beef", "lamb", "egg"].some((term) => name.toLowerCase().includes(term))) return false;
      return true;
    };
    const food = (name: string, portion: string): PlanItem => {
      const found = seedData.foods.find((item) => item.name.toLowerCase() === name.toLowerCase() && allowed(item.name))
        ?? seedData.foods.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (!found) throw new Error(`Missing seeded food: ${name}`);
      return { name: found.name, portion, calories: found.calories, protein: found.protein, carbohydrates: found.carbohydrates, fat: found.fat };
    };
    const weight = Number(profile.weight) || 70;
    const height = Number(profile.height) || 170;
    const age = Number(profile.age) || 30;
    const genderOffset = profile.gender === "Male" ? 5 : profile.gender === "Female" ? -161 : -78;
    const activityFactor = profile.activityLevel === "high" ? 1.7 : profile.activityLevel === "moderate" ? 1.55 : profile.activityLevel === "light" ? 1.375 : 1.2;
    const maintenanceCalories = Math.round((10 * weight + 6.25 * height - 5 * age + genderOffset) * activityFactor);
    const calorieGoal = Math.max(1200, maintenanceCalories + (String(profile.goalId).includes("loss") ? -300 : String(profile.goalId).includes("gain") ? 300 : 0));
    const createDay = () => {
      const vegan = preference === "vegan";
      const vegetarian = preference === "vegetarian";
      const protein = vegan ? food("Tofu", "1 serving") : vegetarian ? food("Paneer", "1 serving") : food("Chicken breast", "1 serving");
      const breakfast = [food("Rolled oats", "1 serving"), vegan ? food("Almonds", "1 serving") : food("Greek yogurt", "1 serving"), food("Banana", "1 medium")];
      const snackMorning = [food("Apple", "1 medium"), food("Almonds", "1 serving")];
      const lunch = [protein, food("Brown rice", "1 serving"), food("Spinach", "1 cup")];
      const snackAfternoon = [food("Strawberries", "1/2 cup"), food("Orange", "1 medium")];
      const dinner = [vegan ? food("Chickpeas", "1 serving") : vegetarian ? food("Paneer", "1 serving") : food("Salmon", "1 serving"), food("Quinoa", "1 serving"), food("Broccoli", "1 cup")];
      const sections = [
        { mealType: "BREAKFAST", items: breakfast },
        { mealType: "SNACK 1 (Morning)", items: snackMorning },
        { mealType: "LUNCH", items: lunch },
        { mealType: "SNACK 2 (Afternoon)", items: snackAfternoon },
        { mealType: "DINNER", items: dinner },
      ];
      const totals = sections.flatMap((section) => section.items).reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, carbohydrates: sum.carbohydrates + item.carbohydrates, fat: sum.fat + item.fat }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
      return { sections, totals, calorieGoal, waterTarget: 8 };
    };
    return NextResponse.json({ goal, days, plan: Array.from({ length: days }, (_, index) => ({ day: index + 1, ...createDay() })) });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
