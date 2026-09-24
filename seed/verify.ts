import type { Firestore } from "firebase-admin/firestore";
import { seedData } from "./data";
import { validateSeedData } from "./seed";
import type { SeedData } from "./types";

export type VerificationSummary = {
  counts: Record<keyof SeedData, number>;
  expected: Record<keyof SeedData, number>;
  missing: Record<keyof SeedData, string[]>;
  valid: boolean;
};

export async function verifySeed(
  db: Firestore | undefined = undefined,
  data: SeedData = seedData,
): Promise<VerificationSummary> {
  validateSeedData(data);
  const firestore = db ?? (await import("../lib/firebase-admin-core")).adminFirestore;
  const counts = {} as VerificationSummary["counts"];
  const missing = {} as VerificationSummary["missing"];
  for (const collection of Object.keys(data) as (keyof SeedData)[]) {
    const snapshot = await firestore.collection(collection).count().get();
    counts[collection] = snapshot.data().count;
    const records = data[collection] as Array<{ id: string }>;
    const references = records.map((record) => firestore.collection(collection).doc(record.id));
    const documents = await firestore.getAll(...references);
    missing[collection] = records
      .filter((_, index) => !documents[index].exists)
      .map((record) => record.id);
  }
  const expected = {
    foods: data.foods.length,
    recipes: data.recipes.length,
    nutritionGoals: data.nutritionGoals.length,
    mealTemplates: data.mealTemplates.length,
    groceryItems: data.groceryItems.length,
    exercises: data.exercises.length,
    workouts: data.workouts.length,
  };
  return {
    counts,
    expected,
    missing,
    valid: (Object.keys(expected) as (keyof SeedData)[]).every(
      (collection) => counts[collection] >= expected[collection] && missing[collection].length === 0,
    ),
  };
}

export function formatVerification(summary: VerificationSummary): string {
  const lines = ["Firebase seed verification"];
  for (const collection of Object.keys(summary.expected) as (keyof SeedData)[]) {
    const missing = summary.missing[collection].length
      ? `; missing ${summary.missing[collection].length}`
      : "";
    lines.push(`  ${collection}: ${summary.counts[collection]} (seeded ${summary.expected[collection]}${missing})`);
  }
  lines.push(`  status: ${summary.valid ? "ok" : "incomplete"}`);
  return lines.join("\n");
}
