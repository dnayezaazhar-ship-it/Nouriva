import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { requireUser, apiError } from "@/lib/server-auth";
import { canAccessPremium, getEntitlement } from "@/lib/entitlements";
import { seedData } from "@/seed/data";
import { calculateFoodLog } from "@/lib/nutrition";
import type { Food, MealPlan, CoachMessage, FoodLog, MealType, VisionAnalysis } from "@/types";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const MAX_CONTEXT_MESSAGES = 12;
const defaultConversation = "default";
function safeConversation(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : defaultConversation;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const loggingWords = /\b(?:log(?:ged|ging)?|record(?:ed|ing)?|eat(?:en|ing)?|ate|had|consumed)\b/i;
const workoutRequestWords = /\b(workout|exercise|training|routine|gym|strength|cardio|stretch|mobility|fitness)\b/i;

function normalizedFoodName(value: string) {
  return value.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function singularFoodName(value: string) {
  return value.split(" ").map((word) => word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word).join(" ");
}

function workoutLibraryMatches(profile: Record<string, unknown>, goalId: string | undefined) {
  const goalLabels: Record<string, string[]> = {
    goal_weight_loss: ["Weight Loss", "Fat Burn", "Cardio"],
    goal_fat_burn: ["Fat Burn", "Weight Loss", "Cardio"],
    goal_weight_gain: ["Muscle Gain", "Strength", "Full Body"],
    goal_muscle_gain: ["Muscle Gain", "Strength", "Full Body"],
    goal_high_protein: ["Muscle Gain", "Strength"],
    goal_high_fiber: ["Full Body", "Cardio"],
    goal_balanced_nutrition: ["Full Body", "Strength", "Cardio"],
    goal_weight_maintenance: ["Full Body", "Strength", "Cardio"],
  };
  const targetLabels = goalLabels[goalId ?? "goal_balanced_nutrition"] ?? ["Full Body", "Strength", "Cardio"];
  const beginner = profile.fitnessLevel === "beginner" || profile.activityLevel === "sedentary" || profile.activityLevel === "light";
  const home = profile.workoutPreference === "home" || profile.equipmentPreference === "home";
  return seedData.exercises
    .map((exercise) => {
      const goalMatch = exercise.goals.some((label) => targetLabels.includes(label));
      const preferenceMatch = home && exercise.homeSuitable;
      const difficultyMatch = beginner && exercise.difficulty === "beginner";
      return { exercise, score: Number(goalMatch) * 4 + Number(preferenceMatch) * 2 + Number(difficultyMatch) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, 10)
    .map(({ exercise }) => exercise);
}

function foodAliases(food: Food) {
  const aliases = [food.name, ...(food.tags ?? [])].map(normalizedFoodName).filter((value) => value.length > 2);
  if (normalizedFoodName(food.name) === "basmati rice" || normalizedFoodName(food.name) === "brown rice") aliases.push("rice");
  return Array.from(new Set(aliases)).sort((a, b) => b.length - a.length);
}

function parseMealType(message: string): MealType {
  const explicit = message.match(/\b(breakfast|lunch|dinner|snack)\b/i)?.[1]?.toLowerCase();
  if (explicit && mealTypes.includes(explicit as MealType)) return explicit as MealType;
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 18 && hour < 22) return "dinner";
  return "snack";
}

function parseMeal(message: string) {
  const foods = seedData.foods;
  const cleaned = normalizedFoodName(message)
    .replace(/\b(?:please|for|my|today s|meal|breakfast|lunch|dinner|snack|log|logged|logging|record|recorded|recording|eat|eaten|eating|ate|had|consumed|add|to|the|me)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const candidates = foods.flatMap((food) => foodAliases(food).map((alias) => ({ food, alias: singularFoodName(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const found: { food: Food; start: number; end: number }[] = [];
  candidates.forEach(({ food, alias }) => {
    const pattern = new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "g");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(cleaned))) {
      const start = match.index + match[1].length;
      const end = start + alias.length;
      if (!found.some((item) => start < item.end && end > item.start)) found.push({ food, start, end });
    }
  });
  const matches = found.sort((a, b) => a.start - b.start).map(({ food, start }) => {
    const quantity = cleaned.slice(Math.max(0, start - 8), start).match(/(\d+(?:\.\d+)?)\s*$/);
    return { food, servings: quantity ? Math.min(20, Math.max(0.25, Number(quantity[1]))) : 1 };
  });
  const isList = matches.length >= 2 && cleaned.length <= 120;
  if (!matches.length || (!loggingWords.test(message) && !isList)) return [];
  return matches;
}

async function logMealItems(db: Firestore, userId: string, message: string, loggedAt: string) {
  const items = parseMeal(message);
  if (!items.length) return [];
  const mealType = parseMealType(message);
  const userRef = db.collection("users").doc(userId);
  const batch = db.batch();
  const logs = items.map(({ food, servings }) => {
    const nutrition = calculateFoodLog(food, servings);
    const log = { ...nutrition, foodId: food.id, foodName: food.name, mealType, loggedAt, date: loggedAt.slice(0, 10), userId };
    const ref = userRef.collection("foodLogs").doc();
    batch.set(ref, log);
    return { id: ref.id, ...log };
  });
  await batch.commit();
  return logs;
}

async function providerReply(message: string, context: string, history: CoachMessage[]) {
  const key = process.env.OPENAI_API_KEY ?? process.env.AI_PROVIDER_API_KEY;
  if (!key) throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  const endpoint = process.env.OPENAI_API_URL ?? process.env.AI_PROVIDER_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL ?? process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini";
  const workoutInstruction = workoutRequestWords.test(message)
    ? "This is a workout/exercise request. You MUST recommend specific exercises from the provided Workout library shortlist, explain briefly why they fit the user's current goal/profile, and explicitly tell the user they can open the app's Workout section to find and start them. Never substitute generic exercises that are absent from the shortlist."
    : "";
  const providerMessages = [
    { role: "system", content: "You are Nouriva's supportive nutrition and wellness coach. Give practical, non-judgmental guidance. Do not diagnose, prescribe, make unsupported medical claims, or handle emergencies. Encourage a qualified professional for medical conditions. Keep replies concise and actionable. Treat factual statements made by the user in the saved conversation history as this user's personal memory. When asked about their name, preferences, or other personal facts, answer directly from that history. Do not invent facts and do not confuse the user's statements with the coach's replies. When recommending exercises, use the provided exercise-library matches for the user's current goal, profile, fitness level, activity level, equipment preference, and recent workouts. Do not claim an exercise exists in Nouriva unless it appears in the provided library context." },
    { role: "system", content: context ? `Private data belonging only to the authenticated user (use only when helpful):\n${context}` : "No saved user data is available." },
    ...(workoutInstruction ? [{ role: "system" as const, content: workoutInstruction }] : []),
    ...history.slice(-MAX_CONTEXT_MESSAGES).map((item) => ({ role: item.role === "coach" ? "assistant" : "user", content: item.content })),
    { role: "user", content: message },
  ];
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: providerMessages, temperature: 0.4, max_tokens: 350 }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error("AI_PROVIDER_FAILED");
  }
  if (response.status === 429) throw new Error("AI_PROVIDER_RATE_LIMITED");
  if (!response.ok) throw new Error("AI_PROVIDER_FAILED");
  const data = await response.json() as { choices?: { message?: { content?: unknown } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  return content.trim().slice(0, 2000);
}

async function userContext(db: Firestore, userId: string) {
  const userRef = db.collection("users").doc(userId);
  const [profileSnapshot, logsSnapshot, plansSnapshot, workoutsSnapshot, weightsSnapshot, chatsSnapshot] = await Promise.all([
    userRef.get(),
    userRef.collection("foodLogs").limit(100).get(),
    userRef.collection("mealPlans").limit(12).get(),
    userRef.collection("workoutCompletions").limit(100).get(),
    userRef.collection("weightLogs").limit(100).get(),
    userRef.collection("coachMessages").orderBy("createdAt", "desc").limit(100).get(),
  ]);
  const profile = profileSnapshot.data() ?? {};
  const goal = seedData.nutritionGoals.find((item) => item.id === profile.goalId);
  const logs = logsSnapshot.docs.map((doc) => doc.data() as FoodLog).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)).slice(0, 30);
  const plans = plansSnapshot.docs.map((doc) => doc.data() as MealPlan).slice(0, 12);
  const workouts = workoutsSnapshot.docs.map((doc) => doc.data()).sort((a, b) => String(b.completedAt ?? "").localeCompare(String(a.completedAt ?? ""))).slice(0, 30);
  const weights = weightsSnapshot.docs.map((doc) => doc.data()).sort((a, b) => String(b.loggedAt ?? "").localeCompare(String(a.loggedAt ?? ""))).slice(0, 30);
  const previousMessages = chatsSnapshot.docs.map((doc) => doc.data() as CoachMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-MAX_CONTEXT_MESSAGES);
  const goalExercises = workoutLibraryMatches(profile, typeof profile.goalId === "string" ? profile.goalId : undefined);
  const context = [
    profile.name ? `Name: ${String(profile.name).slice(0, 100)}` : "",
    profile.age ? `Age: ${String(profile.age).slice(0, 3)}` : "",
    profile.goalId ? `Goal: ${goal?.name ?? String(profile.goalId).replace("goal_", "").replaceAll("_", " ")}` : "",
    profile.dietaryPreference ? `Dietary preference: ${String(profile.dietaryPreference).slice(0, 40)}` : "",
    profile.activityLevel ? `Activity level: ${String(profile.activityLevel).slice(0, 40)}` : "",
    profile.fitnessLevel ? `Fitness level: ${String(profile.fitnessLevel).slice(0, 40)}` : "",
    profile.workoutPreference ? `Workout preference: ${String(profile.workoutPreference).slice(0, 40)}` : "",
    profile.equipmentPreference ? `Equipment preference: ${String(profile.equipmentPreference).slice(0, 40)}` : "",
    Array.isArray(profile.allergies) && profile.allergies.length ? `Allergies/intolerances: ${profile.allergies.slice(0, 10).map(String).join(", ")}` : "",
    logs.length ? `Recent logged foods: ${logs.map((log) => `${log.foodName} (${log.mealType}, ${log.servings} serving)`).join("; ")}` : "",
    plans.some((plan) => plan.meals?.length) ? `Planned meals: ${plans.flatMap((plan) => plan.meals ?? []).slice(0, 30).map((meal) => `${meal.date} ${meal.mealType}: ${meal.itemName}`).join("; ")}` : "",
    workouts.length ? `Completed workouts: ${workouts.map((workout) => `${workout.completedAt}: ${workout.workoutName ?? "workout"} (${workout.durationMinutes ?? 0} minutes)`).join("; ")}` : "",
    weights.length ? `Weight history: ${weights.map((weight) => `${weight.loggedAt}: ${weight.weight} ${weight.unit}`).join("; ")}` : "",
    `Workout library shortlist filtered from Nouriva's internal Workout section for the current goal (${goal?.name ?? "Balanced nutrition"}) and profile: ${goalExercises.length ? goalExercises.map((exercise) => `${exercise.name} [${exercise.id}] (${exercise.category}, ${exercise.difficulty}, ${exercise.duration} min, ${exercise.equipment.length ? exercise.equipment.join(", ") : "no equipment"})`).join("; ") : "No matching seeded exercises found."}`,
    previousMessages.length ? `Previous Coach messages:\n${previousMessages.map((item) => `${item.role}: ${item.content}`).join("\n")}` : "",
  ].filter(Boolean).join("\n").slice(0, 16000);
  return { context, history: previousMessages, logs: logs.length, plannedMeals: plans.reduce((sum, plan) => sum + (plan.meals?.length ?? 0), 0), workoutExercises: goalExercises };
}

export async function GET(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const params = new URL(request.url).searchParams;
    const requestedConversation = params.get("conversationId");
    if (!requestedConversation && params.get("latest") === "true") {
      const snapshot = await db.collection("users").doc(userId).collection("coachMessages").orderBy("createdAt", "desc").limit(100).get();
      const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CoachMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return NextResponse.json({ conversationId: messages[0]?.conversationId ?? "", messages });
    }
    const conversationId = safeConversation(requestedConversation);
    const snapshot = await db.collection("users").doc(userId).collection("coachMessages").where("conversationId", "==", conversationId).get();
    if (snapshot.empty) {
      const latestSnapshot = await db.collection("users").doc(userId).collection("coachMessages").orderBy("createdAt", "desc").limit(100).get();
      const latestMessages = latestSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CoachMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return NextResponse.json({ conversationId: latestMessages[0]?.conversationId ?? "", messages: latestMessages });
    }
    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CoachMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-100);
    return NextResponse.json(messages);
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const isPro = canAccessPremium(await getEntitlement(db, userId));
    if (!isPro) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const usage = await db.collection("users").doc(userId).collection("coachMessages").get();
      const usedToday = usage.docs.filter((doc) => {
        const data = doc.data();
        return data.role === "user" && typeof data.createdAt === "string" && data.createdAt >= startOfDay.toISOString();
      }).length;
      if (usedToday >= 5) return NextResponse.json({ message: "You have reached the Free plan limit of 5 Coach messages today. Upgrade to Nouriva+ for unlimited coaching." }, { status: 403 });
    }
    const body = await request.json() as { message?: unknown; conversationId?: unknown };
    const message = typeof body.message === "string" ? body.message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH) : "";
    if (!message) return NextResponse.json({ message: "Ask a question to get started." }, { status: 400 });
    if (typeof body.message === "string" && body.message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ message: `Keep questions under ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
    }
    const conversationId = safeConversation(body.conversationId);
    const createdAt = new Date().toISOString();
    const userMessage = { conversationId, role: "user" as const, content: message, createdAt };
    const collection = db.collection("users").doc(userId).collection("coachMessages");
    const userRef = await collection.add(userMessage);
    const loggedMeals = await logMealItems(db, userId, message, createdAt);
    const { context, history } = await userContext(db, userId);
    const providerResponse = await providerReply(message, context, history);
    const reply = loggedMeals.length
      ? `${providerResponse}\n\nLogged to today's ${loggedMeals[0].mealType}: ${loggedMeals.map((log) => `${log.foodName} (${log.servings} serving${log.servings === 1 ? "" : "s"})`).join(", ")}.`
      : providerResponse;
    const analysis: VisionAnalysis | undefined = loggedMeals.length ? {
      mode: "breakdown",
      logged: true,
      summary: "I added these items to today's food log.",
      mealType: loggedMeals[0].mealType,
      items: loggedMeals.map((log) => ({
        name: log.foodName,
        portion: `${log.servings} serving`,
        servings: log.servings,
        calories: log.calories,
        protein: log.protein,
        carbohydrates: log.carbohydrates,
        fat: log.fat,
        fiber: log.fiber,
        confidence: "high" as const,
      })),
    } : undefined;
    const coachMessage = { conversationId, role: "coach" as const, content: reply, createdAt: new Date().toISOString(), ...(analysis ? { analysis } : {}) };
    const coachRef = await collection.add(coachMessage);
    return NextResponse.json({ reply, loggedMeals, messages: [{ id: userRef.id, ...userMessage }, { id: coachRef.id, ...coachMessage }] });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const params = new URL(request.url).searchParams;
    const collection = db.collection("users").doc(userId).collection("coachMessages");
    const snapshot = params.get("all") === "true"
      ? await collection.get()
      : await collection.where("conversationId", "==", safeConversation(params.get("conversationId"))).get();
    const docs = snapshot.docs;
    for (let index = 0; index < docs.length; index += 450) {
      const batch = db.batch();
      docs.slice(index, index + 450).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    return NextResponse.json({ deleted: docs.length });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
