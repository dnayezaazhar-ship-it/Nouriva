import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { seedData } from "./data";
import type { Exercise, Food, MealTemplate, Recipe, SeedData, Workout } from "./types";

export type CollectionSeedSummary = {
  inserted: number;
  updated: number;
};

export type SeedSummary = Record<keyof SeedData, CollectionSeedSummary>;

const collectionNames: (keyof SeedData)[] = [
  "foods",
  "recipes",
  "nutritionGoals",
  "mealTemplates",
  "groceryItems",
  "exercises",
  "workouts",
];

const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const nutritionFields = ["calories", "protein", "carbohydrates", "fat", "fiber"] as const;

const validateNutrition = (record: Record<string, unknown>, owner: string): void => {
  const fields = nutritionFields;
  for (const field of fields) {
    if (!isFiniteNonNegative(record[field])) {
      throw new Error(`${owner}.${field} must be a finite non-negative number`);
    }
  }
};

const validateCollectionIds = (data: SeedData): void => {
  for (const collection of collectionNames) {
    const records = data[collection] as Array<{ id: string; name: string }>;
    const ids = new Set<string>();
    for (const record of records) {
      if (!record.id || !/^[a-z0-9_-]+$/.test(record.id)) {
        throw new Error(`${collection} contains an invalid deterministic id: ${record.id}`);
      }
      if (!record.name?.trim()) {
        throw new Error(`${collection}/${record.id} is missing a name`);
      }
      if (ids.has(record.id)) {
        throw new Error(`${collection} contains duplicate id ${record.id}`);
      }
      ids.add(record.id);
    }
  }
};

export function validateSeedData(data: SeedData = seedData): void {
  validateCollectionIds(data);

  const foods = new Set(data.foods.map((food) => food.id));
  const recipes = new Set(data.recipes.map((recipe) => recipe.id));
  const goals = new Set(data.nutritionGoals.map((goal) => goal.id));
  const exercises = new Set(data.exercises.map((exercise) => exercise.id));

  for (const food of data.foods) {
    if (!food.servingSize || !food.commonServingSizes.length || !food.cuisine || !food.tags) {
      throw new Error(`foods/${food.id} is missing serving, cuisine, or tag data`);
    }
    validateNutrition(food, `foods/${food.id}`);
  }

  for (const recipe of data.recipes) {
    if (!recipe.description || recipe.servings <= 0 || recipe.preparationTime < 0) {
      throw new Error(`recipes/${recipe.id} has invalid timing, servings, or description`);
    }
    if (!recipe.ingredients.length || !recipe.instructions.length) {
      throw new Error(`recipes/${recipe.id} must include ingredients and instructions`);
    }
    validateNutrition(recipe, `recipes/${recipe.id}`);
    for (const item of recipe.ingredients) {
      if (!foods.has(item.foodId) || !isFiniteNonNegative(item.quantity) || item.quantity <= 0 || !item.unit) {
        throw new Error(`recipes/${recipe.id} has an invalid food reference or ingredient quantity`);
      }
    }
  }

  for (const goal of data.nutritionGoals) {
    if (!goal.recommendedFocus.length || !goal.notes || Object.keys(goal.defaultMealStructure).length !== 4) {
      throw new Error(`nutritionGoals/${goal.id} is missing wellness guidance fields`);
    }
  }

  for (const template of data.mealTemplates) {
    if (!goals.has(template.goalId)) {
      throw new Error(`mealTemplates/${template.id} references missing goal ${template.goalId}`);
    }
    for (const exercise of data.exercises) {
      if (!exercise.instructions.length || !exercise.safetyNotes.length || exercise.duration <= 0 || exercise.sets <= 0) {
        throw new Error(`exercises/${exercise.id} is missing valid training details`);
      }
    }
    for (const workout of data.workouts) {
      if (!workout.exercises.length || workout.duration <= 0 || !workout.goalIds.every((goalId) => goals.has(goalId))) {
        throw new Error(`workouts/${workout.id} has invalid goals, duration, or exercise list`);
      }
      if (!workout.exercises.every((item) => exercises.has(item.exerciseId))) {
        throw new Error(`workouts/${workout.id} references a missing exercise`);
      }
    }
    for (const slots of [template.breakfast, template.lunch, template.snack, template.dinner]) {
      for (const slot of slots) {
        if (!recipes.has(slot.recipeId) || !isFiniteNonNegative(slot.servings) || slot.servings <= 0) {
          throw new Error(`mealTemplates/${template.id} references an invalid recipe or serving count`);
        }
      }
    }
  }
}

const chunks = <T>(values: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
};

export async function seedCollection<T extends { id: string }>(
  db: Firestore,
  collectionName: string,
  records: T[],
): Promise<CollectionSeedSummary> {
  let inserted = 0;
  let updated = 0;
  for (const group of chunks(records, 450)) {
    const references = group.map((record) => db.collection(collectionName).doc(record.id));
    const existing = await db.getAll(...references);
    const batch = db.batch();
    group.forEach((record, index) => {
      if (existing[index].exists) updated += 1;
      else inserted += 1;
      batch.set(references[index], record as DocumentData, { merge: true });
    });
    await batch.commit();
  }
  return { inserted, updated };
}

export async function seedAll(
  db: Firestore | undefined = undefined,
  data: SeedData = seedData,
): Promise<SeedSummary> {
  validateSeedData(data);
  const firestore = db ?? (await import("../lib/firebase-admin-core")).adminFirestore;
  const summary = {} as SeedSummary;
  for (const collection of collectionNames) {
    summary[collection] = await seedCollection(
      firestore,
      collection,
      data[collection] as Array<{ id: string }>,
    );
  }
  return summary;
}

export const expectedSeedCounts = {
  foods: seedData.foods.length,
  recipes: seedData.recipes.length,
  nutritionGoals: seedData.nutritionGoals.length,
  mealTemplates: seedData.mealTemplates.length,
  groceryItems: seedData.groceryItems.length,
  exercises: seedData.exercises.length,
  workouts: seedData.workouts.length,
};

export type { Food, MealTemplate, Recipe };
