import "server-only";
import Stripe from "stripe";

export const STRIPE_CONNECT_ACCOUNT_ID = process.env.STRIPE_CONNECT_ACCOUNT_ID ?? "";

export type PaidPlan = "plus" | "together";

export function missingStripeConfiguration(plan?: PaidPlan) {
  const missing: string[] = [];
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const priceId = plan === "together"
    ? process.env.STRIPE_TOGETHER_PRICE_ID
    : process.env.STRIPE_PLUS_PRICE_ID;

  if (!secretKey?.startsWith("sk_test_")) missing.push("STRIPE_SECRET_KEY");
  if (!webhookSecret?.startsWith("whsec_")) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!STRIPE_CONNECT_ACCOUNT_ID.startsWith("acct_")) missing.push("STRIPE_CONNECT_ACCOUNT_ID");
  if (plan && !priceId?.startsWith("price_")) {
    missing.push(plan === "together" ? "STRIPE_TOGETHER_PRICE_ID" : "STRIPE_PLUS_PRICE_ID");
  }

  return missing;
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error("Stripe TEST mode requires STRIPE_SECRET_KEY to contain a test-mode secret key.");
  }
  return new Stripe(secretKey);
}
