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
const TRIAL_CLAIM_ID = "nouriva-free-trial";

/**
 * Trial creation is deliberately separate from entitlement reads. This prevents
 * an existing account with legacy data from receiving a trial just because its
 * profile does not yet have entitlement fields.
 */
export async function initializeTrialForNewAccount(db: Firestore, userId: string) {
  const userRef = db.collection("users").doc(userId);
  const claimRef = db.collection("trialClaims").doc(TRIAL_CLAIM_ID);
  const now = new Date();
  const trialStartAt = now.toISOString();
  const trialEndAt = new Date(now.getTime() + TRIAL_DURATION_MS).toISOString();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (snapshot.exists) return;
    const claim = await transaction.get(claimRef);
    const priorTrial = claim.exists
      ? undefined
      : await transaction.get(db.collection("users").where("trialStartAt", ">", "").limit(1));
    if (!claim.exists && priorTrial && !priorTrial.empty) {
      const priorData = priorTrial.docs[0].data();
      transaction.set(claimRef, {
        userId: priorTrial.docs[0].id,
        claimedAt: priorData.trialStartAt,
        trialStartAt: priorData.trialStartAt,
        trialEndAt: priorData.trialEndAt,
      });
    }
    if (!claim.exists && priorTrial?.empty) {
      transaction.set(claimRef, {
        userId,
        claimedAt: trialStartAt,
        trialStartAt,
        trialEndAt,
      });
      transaction.set(userRef, {
        userId,
        createdAt: trialStartAt,
        trialStartAt,
        trialEndAt,
        subscriptionStatus: "trial",
        subscriptionPlan: "free",
      });
      return;
    }
    transaction.set(userRef, {
      userId,
      createdAt: trialStartAt,
      trialStartAt: null,
      trialEndAt: null,
      subscriptionStatus: "expired",
      subscriptionPlan: "free",
    });
  });
}

export async function getEntitlement(db: Firestore, userId: string): Promise<Entitlement> {
  const ref = db.collection("users").doc(userId);
  const snapshot = await ref.get();
  const data = snapshot.data() ?? {};
  const now = Date.now();
  const trialStartAt = typeof data.trialStartAt === "string" && !Number.isNaN(Date.parse(data.trialStartAt)) ? data.trialStartAt : null;
  const trialEndAt = trialStartAt ? new Date(Date.parse(trialStartAt) + TRIAL_DURATION_MS).toISOString() : null;
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
