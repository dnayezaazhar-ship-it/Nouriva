import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import type { CoachMessage, MealType, VisionAnalysis, VisionMealItem } from "@/types";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_ITEMS = 20;
const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function safeConversation(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : "default";
}

function parseAnalysis(value: unknown): VisionAnalysis {
  if (!value || typeof value !== "object") throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  const raw = value as { mode?: unknown; summary?: unknown; answer?: unknown; mealType?: unknown; items?: unknown };
  const mode = raw.mode === "focused" || raw.mode === "breakdown" ? raw.mode : "breakdown";
  const mealType = typeof raw.mealType === "string" && mealTypes.includes(raw.mealType as MealType) ? raw.mealType as MealType : "snack";
  if (typeof raw.summary !== "string" || (mode === "focused" && typeof raw.answer !== "string") || !Array.isArray(raw.items) || raw.items.length > MAX_ITEMS || (mode === "breakdown" && raw.items.length === 0)) {
    throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  }
  const items = raw.items.map((item): VisionMealItem => {
    if (!item || typeof item !== "object") throw new Error("AI_PROVIDER_INVALID_RESPONSE");
    const row = item as Record<string, unknown>;
    const numeric = ["servings", "calories", "protein", "carbohydrates", "fat", "fiber"].map((key) => Number(row[key]));
    if (typeof row.name !== "string" || typeof row.portion !== "string" || numeric.some((number) => !Number.isFinite(number) || number < 0)) {
      throw new Error("AI_PROVIDER_INVALID_RESPONSE");
    }
    const confidence = row.confidence === "high" || row.confidence === "medium" || row.confidence === "low" ? row.confidence : "medium";
    return {
      name: row.name.trim().slice(0, 120),
      portion: row.portion.trim().slice(0, 80),
      servings: Math.min(20, Math.max(0.25, numeric[0] || 1)),
      calories: Math.round(numeric[1]),
      protein: Math.round(numeric[2] * 10) / 10,
      carbohydrates: Math.round(numeric[3] * 10) / 10,
      fat: Math.round(numeric[4] * 10) / 10,
      fiber: Math.round(numeric[5] * 10) / 10,
      confidence,
      notes: typeof row.notes === "string" ? row.notes.trim().slice(0, 240) : undefined,
    };
  });
  return { mode, summary: raw.summary.trim().slice(0, 1000), answer: typeof raw.answer === "string" ? raw.answer.trim().slice(0, 2000) : undefined, mealType, items };
}

async function analyzeImage(dataUrl: string, prompt: string) {
  const key = process.env.OPENAI_API_KEY ?? process.env.AI_PROVIDER_API_KEY;
  if (!key) throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  const endpoint = process.env.OPENAI_API_URL ?? process.env.AI_PROVIDER_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_VISION_MODEL ?? process.env.AI_PROVIDER_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image for Nouriva and answer the user's prompt: "${prompt || "Give me a complete breakdown of this plate, including calories, serving sizes, and macros."}"
Return ONLY valid JSON with this shape:
{"mode":"focused|breakdown","summary":"brief visual summary","answer":"direct conversational answer when mode is focused","mealType":"breakfast|lunch|dinner|snack","items":[{"name":"food name","portion":"estimated grams, cups, or serving description","servings":1,"calories":0,"protein":0,"carbohydrates":0,"fat":0,"fiber":0,"confidence":"high|medium|low","notes":"optional uncertainty"}]}
Always identify every visible food item and provide item-level calories, protein, carbohydrates, fat, fiber, portion, and confidence, even when the user asks a focused question such as calories. Use answer for the direct conversational answer and summary for a brief visual summary. Use mode breakdown for image nutrition requests. Estimate portions conservatively from visual evidence. Nutrition values are estimates, not medical advice. Use mealType snack when uncertain. Never invent precision: mark uncertain items low confidence and explain why in notes.`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        }],
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error("AI_PROVIDER_FAILED");
  }
  if (response.status === 429) throw new Error("AI_PROVIDER_RATE_LIMITED");
  if (!response.ok) throw new Error("AI_PROVIDER_FAILED");
  const data = await response.json() as { choices?: { message?: { content?: unknown } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  try {
    return parseAnalysis(JSON.parse(content));
  } catch (error) {
    if (error instanceof Error && error.message === "AI_PROVIDER_INVALID_RESPONSE") throw error;
    throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || !imageTypes.has(file.type) || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ message: "Choose a JPEG, PNG, WebP, HEIC, or HEIF image up to 10 MB." }, { status: 400 });
    }
    const conversationId = safeConversation(form.get("conversationId"));
    const promptValue = form.get("prompt");
    const prompt = typeof promptValue === "string" ? promptValue.replace(/\s+/g, " ").trim().slice(0, 500) : "";
    const analysisPrompt = prompt || "Tell me the calories and give me a complete calorie and macro breakdown of this food.";
    const thumbnailValue = form.get("thumbnail");
    const imageUrl = typeof thumbnailValue === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(thumbnailValue) && thumbnailValue.length <= 450000
      ? thumbnailValue
      : undefined;
    const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const analysis = await analyzeImage(dataUrl, analysisPrompt);
    const createdAt = new Date().toISOString();
    const collection = db.collection("users").doc(userId).collection("coachMessages");
    const userMessage: Omit<CoachMessage, "id"> = { conversationId, role: "user", content: `${analysisPrompt} (food image attached)`, createdAt, ...(imageUrl ? { imageUrl, image: imageUrl } : {}) };
    const coachMessage: Omit<CoachMessage, "id"> = {
      conversationId,
      role: "coach",
      content: analysis.mode === "focused" ? (analysis.answer ?? analysis.summary) : `${analysis.summary} I found ${analysis.items.length} item${analysis.items.length === 1 ? "" : "s"} with estimated portions and nutrition below.`,
      createdAt: new Date().toISOString(),
      analysis,
    };
    const [userRef, coachRef] = await Promise.all([collection.add(userMessage), collection.add(coachMessage)]);
    return NextResponse.json({ messages: [{ id: userRef.id, ...userMessage }, { id: coachRef.id, ...coachMessage }] });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
