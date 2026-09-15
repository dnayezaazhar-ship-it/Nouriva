import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
type Message = { id: string; role: "user" | "coach"; content: string };
export default function CoachScreen() {
  const { getToken } = useAuth(); const [input, setInput] = useState(""); const [conversationId, setConversationId] = useState(`mobile_${Date.now()}`); const [message, setMessage] = useState("");
  const history = useApi<Message[]>(`/api/coach?conversationId=${conversationId}`);
  async function send(text = input) { if (!text.trim()) return; setMessage(""); try { await apiRequest("/api/coach", { method: "POST", token: await getToken(), body: JSON.stringify({ message: text.trim(), conversationId, history: history.data ?? [] }) }); setInput(""); await history.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Coach is unavailable right now."); } }
  function newConversation() { setConversationId(`mobile_${Date.now()}`); setMessage(""); }
  return <Screen><Text style={styles.eyebrow}>NOURIVA COACH</Text><Text style={styles.title}>A supportive next step.</Text><Text style={styles.body}>Wellness guidance, not diagnosis or emergency medical care.</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{["What should I eat today?", "Review my food intake", "Help me improve my protein intake", "Suggest a Pakistani healthy meal"].map((prompt) => <Text key={prompt} onPress={() => send(prompt)} style={styles.action}>{prompt}</Text>)}</View>{history.loading && <EmptyState title="Loading conversation..." body="Your saved coach messages are coming up." />}{history.data?.map((item) => <Card key={item.id}><Text style={styles.caption}>{item.role === "user" ? "YOU" : "COACH"}</Text><Text style={styles.body}>{item.content}</Text></Card>)}{!!message && <Text style={styles.error}>{message}</Text>}<TextField label="Your question" placeholder="Ask about food or habits..." value={input} onChangeText={setInput} multiline /><Button label="Send" onPress={() => send()} /><Button label="New conversation" variant="secondary" onPress={newConversation} /></Screen>;
}
