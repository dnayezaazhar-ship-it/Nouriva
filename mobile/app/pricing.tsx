import { useState } from "react";
import { Text, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { BackButton, Button, Card, EmptyState, Screen } from "@/src/components";
import { styles } from "@/src/theme";
type BillingPlan = { id: string; name: string; price: number; description?: string; features: string[] };
type Billing = { configured: boolean; plan: string; status: string; trialEndAt?: string; plansConfigured?: { plus?: boolean; together?: boolean }; plans: BillingPlan[] | Record<string, BillingPlan> };
export default function PricingScreen() {
  const { getToken } = useAuth(); const billing = useApi<Billing>("/api/billing"); const [message, setMessage] = useState("");
  const { checkout: checkoutState } = useLocalSearchParams<{ checkout?: string }>();
  async function checkout(action: "checkout" | "portal", plan = "plus") { try { const result = await apiRequest<{ url: string }>("/api/billing", { method: "POST", token: await getToken(), body: JSON.stringify({ action, plan }) }); await Linking.openURL(result.url); } catch (err) { setMessage(err instanceof Error ? err.message : "Billing is unavailable."); } }
  const planList = billing.data ? (Array.isArray(billing.data.plans) ? billing.data.plans : Object.values(billing.data.plans)) : [];
  function planAction(plan: BillingPlan) {
    if (plan.id === billing.data?.plan) return <Button label="Current plan" variant="secondary" onPress={() => undefined} />;
    if (plan.id === "plus" || plan.id === "together") return <Button label="Upgrade securely" onPress={() => checkout("checkout", plan.id)} />;
    return <Button label="Contact support" variant="secondary" onPress={() => setMessage("Together plan support is coming soon. Nouriva+ is available now.")} />;
  }
  return <Screen contentStyle={styles.pricingContent}><BackButton /><Text style={styles.eyebrow}>NOURIVA PLANS</Text><Text style={styles.title}>Choose support that fits.</Text>{checkoutState === "success" && <Text style={styles.success}>Checkout completed. Your Pro access will activate after Stripe confirms payment.</Text>}{checkoutState === "cancelled" && <Text style={styles.caption}>Checkout was cancelled. You can upgrade whenever you are ready.</Text>}{billing.loading && <EmptyState title="Loading plans..." body="Checking your account subscription." />}{billing.error && <Text style={styles.error}>{billing.error}</Text>}{billing.data && <><Card><Text style={styles.sectionTitle}>Current plan: {billing.data.plan}</Text><Text style={styles.body}>Status: {billing.data.status}</Text></Card>{planList.map((plan) => <Card key={plan.id} style={styles.pricingCard}><Text style={styles.sectionTitle}>{plan.name}</Text><Text style={styles.price}>{plan.price === 0 ? "Free" : `$${plan.price}/month`}</Text>{plan.description && <Text style={styles.body}>{plan.description}</Text>}<Text style={styles.caption}>{plan.features.join(" · ")}</Text>{planAction(plan)}</Card>)}{billing.data.status !== "free" && <Button label="Manage subscription" variant="secondary" onPress={() => checkout("portal")} />}</>}{!!message && <Text style={styles.error}>{message}</Text>}</Screen>;
}
