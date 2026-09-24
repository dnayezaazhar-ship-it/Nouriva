export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodCategory =
  | "Pakistani / Desi"
  | "Indian"
  | "Chinese"
  | "Middle Eastern"
  | "Mediterranean"
  | "Western / Continental"
  | "Japanese"
  | "Korean"
  | "Mexican"
  | "Fruits"
  | "Vegetables"
  | "Grains"
  | "Snacks"
  | "Beverages";

export type Food = {
  id: string;
  name: string;
  category: FoodCategory;
  cuisine: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  commonServingSizes: string[];
  tags: string[];
};

export type RecipeIngredient = {
  foodId: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  mealType: MealType;
  preparationTime: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  tags: string[];
};

export type NutritionGoal = {
  id: string;
  name: string;
  description: string;
  recommendedFocus: string[];
  defaultMealStructure: Record<MealType, string>;
  notes: string;
};

export type MealTemplateSlot = {
  recipeId: string;
  servings: number;
};

export type MealTemplate = {
  id: string;
  name: string;
  goalId: string;
  description: string;
  breakfast: MealTemplateSlot[];
  lunch: MealTemplateSlot[];
  snack: MealTemplateSlot[];
  dinner: MealTemplateSlot[];
};

export type GroceryCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "grains"
  | "pantry"
  | "snacks"
  | "spices"
  | "frozen"
  | "beverages";

export type GroceryItem = {
  id: string;
  name: string;
  category: GroceryCategory;
  defaultUnit: string;
  tags: string[];
};

export type Exercise = {
  id: string;
  name: string;
  description?: string;
  category: string;
  librarySection: "Fat Burn & Cardio" | "Legs Exercises" | "Back Exercises" | "Chest Exercises" | "Weight Loss / Weight Gain routines";
  goals: string[];
  muscleGroup: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  homeSuitable: boolean;
  noEquipment: boolean;
  duration: number;
  sets: number;
  reps?: number;
  rest: number;
  instructions: string[];
  safetyNotes: string[];
  image?: string;
  videoUrl?: string;
  caloriesEstimate?: number;
  tags: string[];
};

export type WorkoutExercise = { exerciseId: string; sets?: number; reps?: number; duration?: number; rest?: number };
export type Workout = {
  id: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  image?: string;
  equipment: string[];
  description: string;
  exercises: WorkoutExercise[];
  goalIds: string[];
  categories: string[];
  tags: string[];
};

export type SeedData = {
  foods: Food[];
  recipes: Recipe[];
  nutritionGoals: NutritionGoal[];
  mealTemplates: MealTemplate[];
  groceryItems: GroceryItem[];
  exercises: Exercise[];
  workouts: Workout[];
};
