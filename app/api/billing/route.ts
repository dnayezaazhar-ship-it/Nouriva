import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser, apiError } from "@/lib/server-auth";
import { plans } from "@/lib/plans";
import { getEntitlement } from "@/lib/entitlements";
import {
  getStripeClient,
  missingStripeConfiguration,
  STRIPE_CONNECT_ACCOUNT_ID,
  type PaidPlan,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

function planPriceId(plan: PaidPlan) {
  return plan === "together" ? process.env.STRIPE_TOGETHER_PRICE_ID : process.env.STRIPE_PLUS_PRICE_ID;
}

function configurationMessage(missing: string[]) {
  return `Stripe TEST Checkout is not configured. Set ${missing.join(", ")} in the server environment (for local development, add them to .env.local).`;
}

function isValidMonthlyPrice(price: Stripe.Price, plan: PaidPlan) {
  const expectedAmount = plan === "plus" ? 900 : 1600;
  return price.active
    && price.currency === "usd"
    && price.unit_amount === expectedAmount
    && price.recurring?.interval === "month"
    && price.recurring.interval_count === 1;
}

export async function GET() {
  try {
    const { userId, db } = await requireUser({ allowExpired: true });
    const entitlement = await getEntitlement(db, userId);
    const missingConfiguration = {
      plus: missingStripeConfiguration("plus"),
      together: missingStripeConfiguration("together"),
    };
    return NextResponse.json({
      configured: missingConfiguration.plus.length === 0,
      plansConfigured: {
        plus: missingConfiguration.plus.length === 0,
        together: missingConfiguration.together.length === 0,
      },
      missingConfiguration,
      plan: entitlement.subscriptionPlan,
      status: entitlement.subscriptionStatus,
      trialStartAt: entitlement.trialStartAt,
      trialEndAt: entitlement.trialEndAt,
      plans,
    });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser({ allowExpired: true });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Billing request must contain valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Invalid billing request." }, { status: 400 });
    }

    const input = body as { action?: unknown; plan?: unknown };
    const action = input.action;
    const plan = input.plan;
    if (action !== "checkout" && action !== "portal") {
      return NextResponse.json({ message: "Choose a valid billing action." }, { status: 400 });
    }
    if (action === "checkout" && plan !== "plus" && plan !== "together") {
      return NextResponse.json({ message: "Choose a valid plan." }, { status: 400 });
    }

    const paidPlan: PaidPlan | undefined = action === "checkout"
      ? plan === "together" ? "together" : "plus"
      : undefined;
    const missing = missingStripeConfiguration(paidPlan);
    if (missing.length) {
      return NextResponse.json({ message: configurationMessage(missing), missingVariables: missing }, { status: 503 });
    }

    const profileRef = db.collection("users").doc(userId);
    const profile = await profileRef.get();
    const data = profile.data() ?? {};
    const customerId = typeof data.stripeCustomerId === "string" ? data.stripeCustomerId : null;

    if (action === "checkout" && ["active", "past_due"].includes(String(data.subscriptionStatus))) {
      return NextResponse.json({ message: "You already have an active Nouriva subscription. Use the customer portal to manage it." }, { status: 409 });
    }
    const stripe = getStripeClient();
    const stripeOptions = { stripeAccount: STRIPE_CONNECT_ACCOUNT_ID };
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

    if (action === "portal") {
      if (!customerId) {
        return NextResponse.json({ message: "No Stripe customer is linked to this account yet." }, { status: 400 });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/pricing`,
      }, stripeOptions);
      return NextResponse.json({ url: session.url });
    }

    if (!paidPlan) return NextResponse.json({ message: "Choose a valid plan." }, { status: 400 });
    const selectedPlan = paidPlan;
    const priceId = planPriceId(selectedPlan);
    if (!priceId) {
      const variable = selectedPlan === "together" ? "STRIPE_TOGETHER_PRICE_ID" : "STRIPE_PLUS_PRICE_ID";
      return NextResponse.json({ message: configurationMessage([variable]), missingVariables: [variable] }, { status: 503 });
    }
    const price = await stripe.prices.retrieve(priceId, {}, stripeOptions);
    if (!isValidMonthlyPrice(price, selectedPlan)) {
      return NextResponse.json({
        message: `${selectedPlan === "plus" ? "STRIPE_PLUS_PRICE_ID" : "STRIPE_TOGETHER_PRICE_ID"} must reference an active USD monthly price of $${selectedPlan === "plus" ? "9.00" : "16.00"} on the configured connected account.`,
      }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan: selectedPlan },
      subscription_data: { metadata: { userId, plan: selectedPlan } },
      ...(customerId ? { customer: customerId } : {}),
    }, stripeOptions);

    if (!session.url) {
      return NextResponse.json({ message: "Stripe created a Checkout Session without a redirect URL." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ message: `Stripe could not complete this billing request: ${error.message}` }, { status: 502 });
    }
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
