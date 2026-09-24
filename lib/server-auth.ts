import { auth } from "@clerk/nextjs/server";
import { getAdminFirestore } from "@/lib/firebase-admin-core";
import { requirePremium } from "@/lib/entitlements";

export async function requireUser(options: { allowExpired?: boolean } = {}) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  const db = getAdminFirestore();
  if (!options.allowExpired) await requirePremium(db, userId);
  return { userId, db };
}

export function apiError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return { status: 401, message: "Sign in to continue." };
  }
  if (error instanceof Error && error.message === "TRIAL_EXPIRED") {
    return { status: 402, message: "Your 3-day Nouriva trial has ended. Upgrade to continue." };
  }
  if (error instanceof Error && error.message.startsWith("Missing Firebase Admin")) {
    return { status: 503, message: "Firebase Admin is not configured. Add server credentials to use this feature." };
  }
  if (error instanceof Error && error.message === "AI_PROVIDER_NOT_CONFIGURED") {
    return { status: 503, message: "Coach is not configured yet. Add the server-only OpenAI API key." };
  }
  if (error instanceof Error && error.message === "AI_PROVIDER_RATE_LIMITED") {
    return { status: 429, message: "Coach is temporarily unavailable because the OpenAI account has reached its usage limit. Check billing or usage limits and try again." };
  }
  if (error instanceof Error && (error.message === "AI_PROVIDER_FAILED" || error.message === "AI_PROVIDER_INVALID_RESPONSE")) {
    return { status: 503, message: "Coach could not respond right now. Please try again." };
  }
  return { status: 500, message: "Something went wrong. Please try again." };
}
