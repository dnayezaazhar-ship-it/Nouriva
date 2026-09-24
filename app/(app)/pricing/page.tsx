"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { plans, type PlanId } from "@/lib/plans";

export default function PricingPage() {
  const [current, setCurrent] = useState<{ plan: PlanId; status: string; configured: boolean; trialEndAt?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing")
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load billing status.");
        return response.json() as Promise<{ plan: PlanId; status: string; configured: boolean }>;
      })
      .then(setCurrent)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load billing status."))
      .finally(() => setLoading(false));
  }, []);

  async function billing(action: "checkout" | "portal", plan: PlanId = "plus") {
    setBusy(action); setError("");
    try {
      const response = await fetch("/api/billing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, plan }) });
      const data = await response.json() as { url?: string; message?: string };
      if (!response.ok || !data.url) throw new Error(data.message ?? "Unable to open billing.");
      window.location.assign(data.url);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to open billing."); setBusy(""); }
  }

  const checkoutPending = current !== null && !current.configured;
  const cards: { id: PlanId; badge: string; action: React.ReactNode }[] = [
    { id: "free", badge: "Start here", action: <Link href="/dashboard" className="button button-ghost">Stay with free</Link> },
    { id: "plus", badge: "Most nourishing", action: current?.status === "active" ? <button className="button button-ghost" type="button" onClick={() => void billing("portal")} disabled={busy === "portal"}>{busy === "portal" ? "Opening…" : "Manage subscription"}</button> : checkoutPending ? <span className="button button-ghost" aria-disabled="true">Checkout coming soon</span> : <button className="button button-primary" type="button" onClick={() => void billing("checkout")} disabled={loading || busy === "checkout"}>{busy === "checkout" ? "Opening…" : "Start Nouriva+ →"}</button> },
    { id: "together", badge: "For families", action: checkoutPending ? <span className="button button-ghost" aria-disabled="true">Checkout coming soon</span> : <button className="button button-primary" type="button" onClick={() => void billing("checkout", "together")} disabled={loading || busy === "checkout"}>{busy === "checkout" ? "Opening…" : "Upgrade securely →"}</button> },
  ];

  return <div className="page-wrap"><div className="page-heading" style={{ display: "block", textAlign: "center" }}><div className="eyebrow" style={{ justifyContent: "center" }}>A plan that grows with you</div><h1>Invest in feeling good.</h1><p>Start gently. Go deeper when you&apos;re ready.</p></div>{checkoutPending && <div className="goal-unavailable" role="status" style={{ textAlign: "center" }}>Subscription purchasing is pending future payment integration. No payment has been taken.</div>}{error && <div className="error-box" role="alert">{error}</div>}<div className="pricing-grid">{cards.map(({ id, badge, action }) => { const plan = plans[id]; const selected = current?.plan === id && (id === "free" || current.status === "active"); return <div className={`app-card price-card ${id === "plus" ? "featured" : ""}`} key={id}><span className="pill">{badge}</span><h2 className="section-title">{plan.name}</h2><div className="price">${plan.price} <small>{plan.interval === "forever" ? "forever" : `/ ${plan.interval}`}</small></div><ul className="check-list">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>{selected && <span className="pill">Current plan · {current.status}</span>}{action}</div>; })}</div><p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 35 }}>Plans are designed for education and wellbeing, not medical treatment. Cancel any time.</p></div>;
}
