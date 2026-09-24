import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useApi } from "@/src/hooks";
import { ApiError, apiRequest } from "@/src/services/api";
import { Button, Card, EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
type Message = { id: string; role: "user" | "coach"; content: string };
export default function CoachScreen() {
  const { getToken } = useAuth(); const [input, setInput] = useState(""); const [conversationId, setConversationId] = useState(""); const [message, setMessage] = useState("");
  useEffect(() => { void AsyncStorage.getItem("nouriva-coach-conversation").then((stored) => { const id = stored && /^[A-Za-z0-9_-]{1,80}$/.test(stored) ? stored : `mobile_${Date.now()}`; setConversationId(id); return AsyncStorage.setItem("nouriva-coach-conversation", id); }); }, []);
  const history = useApi<Message[]>(`/api/coach?conversationId=${conversationId}`);
  async function send(text = input) { if (!conversationId || !text.trim()) return; if (text.trim().length > 500) { setMessage("Keep questions under 500 characters."); return; } setMessage(""); try { await apiRequest("/api/coach", { method: "POST", token: await getToken(), body: JSON.stringify({ message: text.trim(), conversationId }) }); setInput(""); await history.refresh(); } catch (err) { if (err instanceof ApiError && err.status === 403) setMessage("Coach is temporarily unavailable. Please try again."); else setMessage(err instanceof Error ? err.message : "Coach is unavailable right now."); } }
  async function newConversation() { if (conversationId) { try { await apiRequest(`/api/coach?conversationId=${encodeURIComponent(conversationId)}`, { method: "DELETE", token: await getToken() }); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not start a new conversation."); return; } } const next = `mobile_${Date.now()}`; setConversationId(next); setMessage(""); setInput(""); await AsyncStorage.setItem("nouriva-coach-conversation", next); }
  return <Screen><Text style={styles.eyebrow}>NOURIVA COACH</Text><Text style={styles.title}>A supportive next step.</Text><Text style={styles.body}>Wellness guidance, not diagnosis or emergency medical care.</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{["What should I eat today?", "Review my food intake", "Help me improve my protein intake", "Suggest a Pakistani healthy meal"].map((prompt) => <Text key={prompt} onPress={() => send(prompt)} style={styles.action}>{prompt}</Text>)}</View>{history.loading && <EmptyState title="Loading conversation..." body="Your saved coach messages are coming up." />}{history.data?.map((item) => <Card key={item.id}><Text style={styles.caption}>{item.role === "user" ? "YOU" : "COACH"}</Text><Text style={styles.body}>{item.content}</Text></Card>)}{!!message && <Text style={styles.error}>{message}</Text>}<TextField label="Your question" placeholder="Ask about food or habits..." value={input} onChangeText={setInput} multiline /><Button label="Send" onPress={() => send()} /><Button label="New conversation" variant="secondary" onPress={newConversation} /></Screen>;
}
