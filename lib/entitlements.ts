import type { Firestore } from "firebase-admin/firestore";

export type Entitlement = {
  trialStartAt: string | null;
  trialEndAt: string | null;
  subscriptionStatus: "trial" | "active" | "expired" | "cancelled" | "past_due";
  subscriptionPlan: string;
  stripeCustomerId?: string;
  daysRemaining: number;
};

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
const PAID_STATUSES = new Set(["active", "trialing"]);

/**
 * Trial creation is idempotent and scoped to the user. Existing users keep their
 * stored trial dates and subscription state across logout/login.
 */
export async function initializeTrialForNewAccount(db: Firestore, userId: string) {
  const userRef = db.collection("users").doc(userId);
  const now = new Date();
  const trialStartAt = now.toISOString();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data() ?? {};
    const storedStartAt = typeof data.trialStartAt === "string" && !Number.isNaN(Date.parse(data.trialStartAt))
      ? data.trialStartAt
      : null;
    const storedEndAt = typeof data.trialEndAt === "string" && !Number.isNaN(Date.parse(data.trialEndAt))
      ? data.trialEndAt
      : null;

    if (storedStartAt && storedEndAt) return;
    if (storedStartAt) {
      transaction.set(userRef, {
        trialEndAt: new Date(Date.parse(storedStartAt) + TRIAL_DURATION_MS).toISOString(),
      }, { merge: true });
      return;
    }

    // An older initialization path could create a new user as expired without
    // trial dates. Recover only that incomplete state; preserve real statuses.
    const subscriptionStatus = typeof data.subscriptionStatus === "string" ? data.subscriptionStatus : null;
    if (snapshot.exists && subscriptionStatus && !["trial", "expired"].includes(subscriptionStatus)) return;

    const accountCreatedAt = typeof data.createdAt === "string" && !Number.isNaN(Date.parse(data.createdAt))
      ? data.createdAt
      : trialStartAt;
    transaction.set(userRef, {
      userId,
      createdAt: data.createdAt ?? accountCreatedAt,
      trialStartAt: accountCreatedAt,
      trialEndAt: new Date(Date.parse(accountCreatedAt) + TRIAL_DURATION_MS).toISOString(),
      subscriptionStatus: "trial",
      subscriptionPlan: "free",
    }, { merge: true });
  });
}

export async function getEntitlement(db: Firestore, userId: string): Promise<Entitlement> {
  const ref = db.collection("users").doc(userId);
  const snapshot = await ref.get();
  const data = snapshot.data() ?? {};
  const now = Date.now();
  const trialStartAt = typeof data.trialStartAt === "string" && !Number.isNaN(Date.parse(data.trialStartAt)) ? data.trialStartAt : null;
  const storedTrialEndAt = typeof data.trialEndAt === "string" && !Number.isNaN(Date.parse(data.trialEndAt)) ? data.trialEndAt : null;
  const trialEndAt = storedTrialEndAt ?? (trialStartAt ? new Date(Date.parse(trialStartAt) + TRIAL_DURATION_MS).toISOString() : null);
  const storedStatus = String(data.subscriptionStatus ?? "");
  const subscriptionPlan = typeof data.subscriptionPlan === "string" ? data.subscriptionPlan : "free";
  const paid = PAID_STATUSES.has(storedStatus) && ["plus", "together"].includes(subscriptionPlan);
  const trialActive = Boolean(trialEndAt && now < Date.parse(trialEndAt) && storedStatus === "trial");
  const status: Entitlement["subscriptionStatus"] = paid
    ? storedStatus === "trialing" ? "active" : storedStatus as Entitlement["subscriptionStatus"]
    : trialActive ? "trial" : storedStatus === "cancelled" ? "cancelled" : "expired";
  const daysRemaining = trialActive && trialEndAt
    ? Math.max(1, Math.ceil((Date.parse(trialEndAt) - now) / 86400000))
    : 0;
  const result = {
    trialStartAt,
    trialEndAt,
    subscriptionStatus: status,
    subscriptionPlan: paid ? subscriptionPlan : "free",
    daysRemaining,
    ...(typeof data.stripeCustomerId === "string" ? { stripeCustomerId: data.stripeCustomerId } : {}),
  };
  if (data.subscriptionStatus === "trial" && status === "expired") {
    await ref.set({ subscriptionStatus: "expired", subscriptionPlan: "free" }, { merge: true });
  }
  return result;
}

export function canAccessPremium(entitlement: Entitlement) {
  return entitlement.subscriptionStatus === "trial" || entitlement.subscriptionStatus === "active" || entitlement.subscriptionStatus === "past_due";
}

export async function requirePremium(db: Firestore, userId: string) {
  const entitlement = await getEntitlement(db, userId);
  if (!canAccessPremium(entitlement)) {
    const error = new Error("TRIAL_EXPIRED");
    throw error;
  }
  return entitlement;
}
