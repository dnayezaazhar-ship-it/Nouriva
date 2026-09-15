export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodCategory =
  | "fruit"
  | "vegetable"
  | "grain"
  | "legume"
  | "protein"
  | "dairy"
  | "nuts-seeds"
  | "condiment"
  | "snack"
  | "beverage";

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

export type SeedData = {
  foods: Food[];
  recipes: Recipe[];
  nutritionGoals: NutritionGoal[];
  mealTemplates: MealTemplate[];
  groceryItems: GroceryItem[];
};
