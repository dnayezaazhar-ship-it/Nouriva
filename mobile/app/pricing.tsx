import { useState } from "react";
import { Text, Linking } from "react-native";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen } from "@/src/components";
import { styles } from "@/src/theme";
type Billing = { configured: boolean; plan: string; status: string; plans: { id: string; name: string; price: string; description: string; features: string[] }[] };
export default function PricingScreen() {
  const { getToken } = useAuth(); const billing = useApi<Billing>("/api/billing"); const [message, setMessage] = useState("");
  async function checkout(action: "checkout" | "portal") { try { const result = await apiRequest<{ url: string }>("/api/billing", { method: "POST", token: await getToken(), body: JSON.stringify({ action, plan: "plus" }) }); await Linking.openURL(result.url); } catch (err) { setMessage(err instanceof Error ? err.message : "Billing is unavailable."); } }
  return <Screen><Text style={styles.eyebrow}>NOURIVA PLANS</Text><Text style={styles.title}>Choose support that fits.</Text>{billing.loading && <EmptyState title="Loading plans..." body="Checking your account subscription." />}{billing.data && <><Card><Text style={styles.sectionTitle}>Current plan: {billing.data.plan}</Text><Text style={styles.body}>Status: {billing.data.status}</Text></Card>{billing.data.plans.map((plan) => <Card key={plan.id}><Text style={styles.sectionTitle}>{plan.name}</Text><Text style={styles.price}>{plan.price}</Text><Text style={styles.body}>{plan.description}</Text><Text style={styles.caption}>{plan.features?.join(" · ")}</Text>{plan.id === "plus" && <Button label="Upgrade securely" onPress={() => checkout("checkout")} />}</Card>)}{billing.data.status !== "free" && <Button label="Manage subscription" variant="secondary" onPress={() => checkout("portal")} />}</>}{!!message && <Text style={styles.error}>{message}</Text>}</Screen>;
}
