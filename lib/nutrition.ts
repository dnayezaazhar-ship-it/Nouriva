import type { Food, FoodLog, MealType } from "@/types";

export const mealTypes: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export function calculateFoodLog(food: Food, servings: number): Omit<FoodLog, "id" | "userId" | "loggedAt" | "mealType" | "foodId" | "foodName"> {
  const safeServings = Math.max(0, Number(servings) || 0);
  return {
    calories: Math.round(food.calories * safeServings),
    protein: Math.round(food.protein * safeServings * 10) / 10,
    carbohydrates: Math.round(food.carbohydrates * safeServings * 10) / 10,
    fat: Math.round(food.fat * safeServings * 10) / 10,
    fiber: Math.round(food.fiber * safeServings * 10) / 10,
    servings: safeServings,
  };
}

export function nutritionTotals(logs: Pick<FoodLog, "calories" | "protein" | "carbohydrates" | "fat" | "fiber">[]) {
  return logs.reduce(
    (total, log) => ({
      calories: total.calories + log.calories,
      protein: total.protein + log.protein,
      carbohydrates: total.carbohydrates + log.carbohydrates,
      fat: total.fat + log.fat,
      fiber: total.fiber + log.fiber,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
  );
}

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
