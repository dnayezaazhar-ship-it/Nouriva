import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
type Item = { id: string; name: string; quantity: string; category: string; checked: boolean }; type List = { weekStart: string; items: Item[] };
const week = () => { const date = new Date(); const day = date.getUTCDay(); date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1)); return date.toISOString().slice(0, 10); };
export default function GroceryScreen() {
  const { getToken } = useAuth(); const weekStart = week(); const [name, setName] = useState(""); const [quantity, setQuantity] = useState("1"); const [message, setMessage] = useState(""); const list = useApi<List>(`/api/grocery?weekStart=${weekStart}`);
  async function save(items: Item[]) { const data = await apiRequest<List>("/api/grocery", { method: "PUT", token: await getToken(), body: JSON.stringify({ weekStart, items }) }); list.refresh(); return data; }
  async function add() { if (!name.trim()) return; try { await save([...(list.data?.items ?? []), { id: `mobile_${Date.now()}`, name: name.trim(), quantity, category: "pantry", checked: false }]); setName(""); setQuantity("1"); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not add item."); } }
  async function toggle(item: Item) { await apiRequest("/api/grocery", { method: "PATCH", token: await getToken(), body: JSON.stringify({ weekStart, id: item.id, checked: !item.checked }) }); await list.refresh(); }
  async function clear() { await apiRequest(`/api/grocery?weekStart=${weekStart}&clearCompleted=true`, { method: "DELETE", token: await getToken() }); await list.refresh(); }
  async function generate() { try { await apiRequest("/api/grocery", { method: "POST", token: await getToken(), body: JSON.stringify({ weekStart }) }); await list.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not generate the list."); } }
  return <Screen><Text style={styles.eyebrow}>TAKE IT TO THE STORE</Text><Text style={styles.title}>Your grocery list.</Text><Text style={styles.body}>Items are saved to your current meal-plan week.</Text><TextField label="Add an item" placeholder="For example: spinach" value={name} onChangeText={setName} /><TextField label="Quantity" value={quantity} onChangeText={setQuantity} /><Button label="Add item" onPress={add} /><Button label="Generate from meal plan" variant="secondary" onPress={generate} /><Button label="Clear completed" variant="secondary" onPress={clear} />{!!message && <Text style={styles.error}>{message}</Text>}{list.loading && <EmptyState title="Loading list..." body="Fetching your saved groceries." />}{!list.loading && !list.data?.items?.length && <EmptyState title="Your list is empty" body="Add an item or generate one from your meal plan." />}{list.data?.items?.map((item) => <Card key={item.id}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text onPress={() => toggle(item)} style={[styles.body, item.checked && { textDecorationLine: "line-through" }]}>{item.checked ? "✓ " : "○ "}{item.name}</Text><Text style={styles.caption}>{item.quantity}</Text></View></Card>)}</Screen>;
}
