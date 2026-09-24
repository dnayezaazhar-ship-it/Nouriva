import type { Food, MealType, Recipe } from "../seed/types";
export type { Exercise, Food, FoodCategory, MealType, Recipe, Workout, WorkoutExercise } from "../seed/types";

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FirestoreDocument<T> = T & {
  id: string;
};

export type UserPreferences = {
  goalId: string;
  dietaryPreferences: string[];
  allergies: string[];
  activityLevel: "sedentary" | "light" | "moderate" | "high";
  completedOnboarding: boolean;
};

export type FoodLog = {
  id: string;
  userId: string;
  foodId: string;
  foodName: string;
  mealType: MealType;
  servings: number;
  loggedAt: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

export type WeightLog = {
  id: string;
  userId: string;
  weight: number;
  unit: "kg" | "lb";
  loggedAt: string;
  note?: string;
};

export type GroceryListItem = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
};

export type PlannedMealItemType = "food" | "recipe";

export type PlannedMeal = {
  id: string;
  date: string;
  mealType: MealType;
  itemType: PlannedMealItemType;
  itemId: string;
  itemName: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

export type MealPlan = {
  id: string;
  weekStart: string;
  meals: PlannedMeal[];
  createdAt: string;
  updatedAt: string;
};

export type PlannerItem = Food | Recipe;

export type CoachMessage = {
  id: string;
  conversationId: string;
  role: "user" | "coach";
  content: string;
  createdAt: string;
  image?: string;
  imageUrl?: string;
  analysis?: VisionAnalysis;
};

export type VisionMealItem = {
  name: string;
  portion: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  confidence: "high" | "medium" | "low";
  notes?: string;
};

export type VisionAnalysis = {
  mode: "focused" | "breakdown";
  logged?: boolean;
  actionStatus?: "logged" | "declined";
  summary: string;
  answer?: string;
  mealType: MealType;
  items: VisionMealItem[];
};
