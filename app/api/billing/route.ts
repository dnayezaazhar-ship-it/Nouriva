import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { plans } from "@/lib/plans";

export const dynamic = "force-dynamic";

function configured(action: "checkout" | "portal") {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && (action === "portal" || process.env.STRIPE_PLUS_PRICE_ID));
}

export async function GET() {
  try {
    const { userId, db } = await requireUser();
    const profile = await db.collection("users").doc(userId).get();
    const data = profile.data() ?? {};
    return NextResponse.json({ configured: configured("checkout"), plan: data.subscriptionPlan ?? "free", status: data.subscriptionStatus ?? "free", plans });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { action?: unknown; plan?: unknown };
    const action = body.action === "portal" ? "portal" : "checkout";
    const plan = body.plan === "plus" ? "plus" : null;
    if (!configured(action)) return NextResponse.json({ message: "Billing is not configured yet. Add the server-only Stripe credentials and price ID." }, { status: 503 });
    if (action === "checkout" && !plan) return NextResponse.json({ message: "Choose a valid plan." }, { status: 400 });
    const profileRef = db.collection("users").doc(userId);
    const profile = await profileRef.get();
    const data = profile.data() ?? {};
    if (action === "checkout" && ["active", "past_due"].includes(String(data.subscriptionStatus))) {
      return NextResponse.json({ message: "You already have an active Nouriva+ subscription. Use the customer portal to manage it." }, { status: 409 });
    }
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    if (action === "portal" && typeof data.stripeCustomerId !== "string") {
      return NextResponse.json({ message: "No Stripe customer is linked to this account yet." }, { status: 400 });
    }
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${origin}/pricing?checkout=success`);
    params.set("cancel_url", `${origin}/pricing?checkout=cancelled`);
    params.set("client_reference_id", userId);
    params.set("line_items[0][price]", process.env.STRIPE_PLUS_PRICE_ID!);
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[userId]", userId);
    params.set("metadata[plan]", "plus");
    params.set("subscription_data[metadata][userId]", userId);
    params.set("subscription_data[metadata][plan]", "plus");
    if (data.stripeCustomerId) params.set("customer", String(data.stripeCustomerId));
    const stripeResponse = await fetch(action === "portal"
      ? "https://api.stripe.com/v1/billing_portal/sessions"
      : "https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
      body: action === "portal"
        ? new URLSearchParams({ customer: String(data.stripeCustomerId ?? ""), return_url: `${origin}/pricing` })
        : params,
    });
    const stripeData = await stripeResponse.json() as { url?: string; error?: { message?: string } };
    if (!stripeResponse.ok || !stripeData.url) return NextResponse.json({ message: stripeData.error?.message ?? "Unable to start Stripe checkout." }, { status: 502 });
    return NextResponse.json({ url: stripeData.url });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
