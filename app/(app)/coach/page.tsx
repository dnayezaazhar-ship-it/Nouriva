"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage } from "@/types";

const prompts = ["What should I eat today?", "Review my food intake", "Help me improve my protein intake", "Suggest a Pakistani healthy meal"];
const conversationKey = "nouriva-coach-conversation";

export default function CoachPage() {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(conversationKey);
    const id = stored && /^[A-Za-z0-9_-]{1,80}$/.test(stored) ? stored : `conversation-${Date.now()}`;
    window.sessionStorage.setItem(conversationKey, id);
    setConversationId(id);
    fetch(`/api/coach?conversationId=${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load your conversation.");
        return response.json() as Promise<CoachMessage[]>;
      })
      .then(setMessages)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load your conversation."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function ask(value = input) {
    const message = value.replace(/\s+/g, " ").trim();
    if (!message || sending || !conversationId) return;
    if (message.length > 500) { setError("Keep questions under 500 characters."); return; }
    setError(""); setRetry(""); setInput(""); setSending(true);
    try {
      const response = await fetch("/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, conversationId, history: messages }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Your coach could not respond.");
      const data = await response.json() as { messages: CoachMessage[] };
      setMessages((current) => [...current, ...data.messages]);
    } catch (reason: unknown) {
      setInput(message);
      setRetry(message);
      setError(reason instanceof Error ? reason.message : "Your coach could not respond. Try again.");
    } finally { setSending(false); }
  }

  async function newConversation() {
    if (!conversationId) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/coach?conversationId=${encodeURIComponent(conversationId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to start a new conversation.");
      const next = `conversation-${Date.now()}`;
      window.sessionStorage.setItem(conversationKey, next);
      setConversationId(next); setMessages([]);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to start a new conversation."); }
    finally { setLoading(false); }
  }

  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">A thoughtful second opinion</div><h1>Meet your AI coach.</h1><p>Practical, gentle nutrition guidance shaped around your Nouriva journey.</p></div><button type="button" className="button button-ghost" onClick={newConversation} disabled={loading || sending}>New conversation</button></div>
    <div className="coach-layout">
      <section className="app-card coach-chat" aria-label="Nouriva coach chat"><header className="coach-header"><span className="coach-avatar" aria-hidden="true">✦</span><div><b>Nouriva coach</b><small>Here to help, never to judge</small></div><span className="coach-status">● Ready</span></header>
        <div className="coach-messages" aria-live="polite">{loading ? <div className="loading-state">Loading your conversation…</div> : messages.length === 0 ? <div className="empty-state coach-empty"><strong>What&apos;s on your mind?</strong><p>Choose a prompt or ask your own question.</p><div className="coach-prompts">{prompts.map((prompt) => <button type="button" className="button button-ghost" key={prompt} onClick={() => void ask(prompt)} disabled={sending}>{prompt}</button>)}</div></div> : messages.map((message) => <div className={`coach-message ${message.role}`} key={message.id}><span>{message.content}</span></div>)}{sending && <div className="coach-message coach"><span>Thinking gently…</span></div>}<div ref={endRef} /></div>
        {error && <div className="error-box" role="alert">{error}{retry && <button type="button" className="text-link coach-retry" onClick={() => void ask(retry)}>Try again</button>}</div>}
        <form className="coach-form" onSubmit={(event) => { event.preventDefault(); void ask(); }}><label className="sr-only" htmlFor="coach-input">Message your coach</label><textarea id="coach-input" className="input coach-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask your coach anything…" maxLength={500} rows={2} disabled={sending} /><button type="submit" className="button button-primary" disabled={sending || !input.trim()}>{sending ? "Sending…" : "Send"}</button></form>
        <p className="coach-disclaimer">Wellness and nutrition education only — not diagnosis, treatment, or emergency care. For medical concerns, allergies, or eating-related distress, speak with a qualified professional.</p>
      </section>
      <aside className="app-card coach-side"><h2 className="section-title">Try asking</h2>{prompts.map((prompt) => <button type="button" className="coach-suggestion" key={prompt} onClick={() => void ask(prompt)} disabled={sending}><span>↗</span>{prompt}</button>)}<div className="coach-note"><b>Your privacy matters.</b><span>Your guidance uses only relevant Nouriva profile, log, and plan details. Your account data stays isolated.</span></div></aside>
    </div>
  </div>;
}
