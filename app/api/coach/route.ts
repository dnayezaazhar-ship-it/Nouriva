import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { requireUser, apiError } from "@/lib/server-auth";
import { seedData } from "@/seed/data";
import type { MealPlan, CoachMessage, FoodLog } from "@/types";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const MAX_CONTEXT_MESSAGES = 12;
const defaultConversation = "default";
const responses: [RegExp, string][] = [
  [/energy/i, "For steadier energy, try pairing a fiber-rich carbohydrate with protein and a little fat. Think oats with yogurt and berries, or a grain bowl with beans and vegetables."],
  [/fiber/i, "A gentle way to add fiber is to make one small swap: add a piece of fruit, choose whole grains, or include beans or lentils. Increase gradually and drink fluids as feels right."],
  [/protein/i, "To build protein gently, include a source at each meal: yogurt or eggs at breakfast, beans, tofu, fish, chicken, or paneer at lunch and dinner, and edamame or nuts as a snack."],
  [/pakistani/i, "Try a balanced Pakistani plate such as chicken tikka or daal with roti, a generous side of salad or saag, and raita. Adjust portions to your hunger and preferences."],
  [/dinner|meal|eat today/i, "A simple dinner formula is: half colorful vegetables, a quarter protein, and a quarter satisfying carbohydrate. Add a sauce or seasoning you genuinely enjoy."],
];

function mondayFor(date: Date) {
  const result = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result.toISOString().slice(0, 10);
}

function safeConversation(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : defaultConversation;
}

function localReply(message: string, context: string) {
  const match = responses.find(([pattern]) => pattern.test(message));
  const suffix = context ? " I’ve also considered the preferences and recent activity you’ve shared with Nouriva." : "";
  return `${match?.[1] ?? "A helpful place to start is noticing what would feel supportive today. Try one small addition—some color, protein, or water—and see how it lands. What feels most doable?"}${suffix}`;
}

async function providerReply(message: string, context: string, history: CoachMessage[]) {
  const key = process.env.AI_PROVIDER_API_KEY;
  if (!key) return localReply(message, context);
  const endpoint = process.env.AI_PROVIDER_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini";
  const providerMessages = [
    { role: "system", content: "You are Nouriva's supportive nutrition and wellness coach. Give practical, non-judgmental guidance. Do not diagnose, prescribe, make unsupported medical claims, or handle emergencies. Encourage a qualified professional for medical conditions. Keep replies concise and actionable." },
    { role: "system", content: context ? `Relevant user context (use only when helpful):\n${context}` : "No user context is available." },
    ...history.slice(-MAX_CONTEXT_MESSAGES).map((item) => ({ role: item.role === "coach" ? "assistant" : "user", content: item.content })),
    { role: "user", content: message },
  ];
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: providerMessages, temperature: 0.4, max_tokens: 350 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("AI_PROVIDER_FAILED");
  const data = await response.json() as { choices?: { message?: { content?: unknown } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  return content.trim().slice(0, 2000);
}

async function userContext(db: Firestore, userId: string) {
  const userRef = db.collection("users").doc(userId);
  const [profileSnapshot, logsSnapshot, planSnapshot] = await Promise.all([
    userRef.get(),
    userRef.collection("foodLogs").get(),
    userRef.collection("mealPlans").doc(mondayFor(new Date())).get(),
  ]);
  const profile = profileSnapshot.data() ?? {};
  const goal = seedData.nutritionGoals.find((item) => item.id === profile.goalId);
  const logs = logsSnapshot.docs.map((doc) => doc.data() as FoodLog).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)).slice(0, 8);
  const plan = planSnapshot.exists ? planSnapshot.data() as MealPlan : undefined;
  const context = [
    profile.goalId ? `Goal: ${goal?.name ?? String(profile.goalId).replace("goal_", "").replaceAll("_", " ")}` : "",
    profile.dietaryPreference ? `Dietary preference: ${String(profile.dietaryPreference).slice(0, 40)}` : "",
    Array.isArray(profile.allergies) && profile.allergies.length ? `Allergies/intolerances: ${profile.allergies.slice(0, 10).map(String).join(", ")}` : "",
    logs.length ? `Recent logged foods: ${logs.map((log) => `${log.foodName} (${log.mealType}, ${log.servings} serving)`).join("; ")}` : "",
    plan?.meals?.length ? `Planned meals this week: ${plan.meals.slice(0, 12).map((meal) => `${meal.date} ${meal.mealType}: ${meal.itemName}`).join("; ")}` : "",
  ].filter(Boolean).join("\n");
  return { context, logs: logs.length, plannedMeals: plan?.meals?.length ?? 0 };
}

export async function GET(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const conversationId = safeConversation(new URL(request.url).searchParams.get("conversationId"));
    const snapshot = await db.collection("users").doc(userId).collection("coachMessages").where("conversationId", "==", conversationId).get();
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
    const body = await request.json() as { message?: unknown; conversationId?: unknown; history?: unknown };
    const message = typeof body.message === "string" ? body.message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH) : "";
    if (!message) return NextResponse.json({ message: "Ask a question to get started." }, { status: 400 });
    if (typeof body.message === "string" && body.message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ message: `Keep questions under ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
    }
    const conversationId = safeConversation(body.conversationId);
    const history = Array.isArray(body.history)
      ? body.history.filter((item): item is CoachMessage => {
        if (!item || typeof item !== "object") return false;
        const role = (item as CoachMessage).role;
        return role === "user" || role === "coach";
      }).slice(-MAX_CONTEXT_MESSAGES)
      : [];
    const { context } = await userContext(db, userId);
    let reply: string;
    try {
      reply = await providerReply(message, context, history);
    } catch {
      reply = localReply(message, context);
    }
    const createdAt = new Date().toISOString();
    const userMessage = { conversationId, role: "user" as const, content: message, createdAt };
    const coachMessage = { conversationId, role: "coach" as const, content: reply, createdAt: new Date().toISOString() };
    const collection = db.collection("users").doc(userId).collection("coachMessages");
    const [userRef, coachRef] = await Promise.all([collection.add(userMessage), collection.add(coachMessage)]);
    return NextResponse.json({ reply, messages: [{ id: userRef.id, ...userMessage }, { id: coachRef.id, ...coachMessage }] });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const conversationId = safeConversation(new URL(request.url).searchParams.get("conversationId"));
    const snapshot = await db.collection("users").doc(userId).collection("coachMessages").where("conversationId", "==", conversationId).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return NextResponse.json({ deleted: snapshot.size });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
