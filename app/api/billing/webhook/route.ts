import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getAdminFirestore } from "@/lib/firebase-admin-core";
import { missingStripeConfiguration, STRIPE_CONNECT_ACCOUNT_ID } from "@/lib/stripe";

export const runtime = "nodejs";

function signatureValid(payload: string, signature: string, secret: string) {
  const timestamp = signature.split(",").find((part) => part.startsWith("t="))?.slice(2);
  const values = signature.split(",").filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !values.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return values.some((value) => value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected)));
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const missing = missingStripeConfiguration();
  if (missing.length) {
    return NextResponse.json({
      message: `Stripe webhook is not configured. Set ${missing.join(", ")} in the server environment (for local development, add them to .env.local).`,
      missingVariables: missing,
    }, { status: 503 });
  }
  if (!secret || !signature) {
    return NextResponse.json({ message: "Stripe webhook is missing its signing secret or Stripe-Signature header." }, { status: 400 });
  }
  const payload = await request.text();
  if (!signatureValid(payload, signature, secret)) return NextResponse.json({ message: "Invalid Stripe signature." }, { status: 400 });
  try {
    const event = JSON.parse(payload) as { type?: string; account?: string; data?: { object?: Record<string, unknown> } };
    if (event.account && event.account !== STRIPE_CONNECT_ACCOUNT_ID) {
      return NextResponse.json({ message: "Webhook event belongs to a different connected account." }, { status: 400 });
    }
    const object = event.data?.object ?? {};
    const metadata = (object.metadata ?? {}) as Record<string, unknown>;
    const customer = typeof object.customer === "string" ? object.customer : "";
    let userId = typeof metadata.userId === "string" ? metadata.userId : "";
    if (!userId && customer) {
      const match = await getAdminFirestore().collection("users").where("stripeCustomerId", "==", customer).limit(1).get();
      userId = match.docs[0]?.id ?? "";
    }
    if (!userId || !["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_failed"].includes(event.type ?? "")) {
      return NextResponse.json({ received: true });
    }
    const status = event.type === "checkout.session.completed" ? "active"
      : event.type === "customer.subscription.deleted" ? "canceled"
      : event.type === "invoice.payment_failed" ? "past_due"
      : String(object.status ?? "active");
    const plan = metadata.plan === "together" ? "together" : "plus";
    const update = {
      subscriptionPlan: status === "active" ? plan : "free",
      subscriptionStatus: status,
      subscriptionUpdatedAt: new Date().toISOString(),
      ...(customer ? { stripeCustomerId: customer } : {}),
    };
    await getAdminFirestore().collection("users").doc(userId).set(update, { merge: true });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ message: "Invalid webhook payload." }, { status: 400 });
  }
}
