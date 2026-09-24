"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage, VisionAnalysis } from "@/types";

const conversationKey = "nouriva-coach-conversation";

export default function CoachPage() {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState("");
  const [loggingAnalysis, setLoggingAnalysis] = useState("");
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(conversationKey);
    const id = stored && /^[A-Za-z0-9_-]{1,80}$/.test(stored) ? stored : "";
    fetch(`/api/coach${id ? `?conversationId=${encodeURIComponent(id)}` : "?latest=true"}`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load your conversation.");
        return response.json() as Promise<CoachMessage[] | { conversationId?: string; messages: CoachMessage[] }>;
      })
      .then((data) => {
        const history = Array.isArray(data) ? data : data.messages;
        const loadedId = Array.isArray(data) ? id : data.conversationId;
        const nextId = loadedId && /^[A-Za-z0-9_-]{1,80}$/.test(loadedId) ? loadedId : `conversation-${Date.now()}`;
        window.sessionStorage.setItem(conversationKey, nextId);
        setConversationId(nextId);
        setMessages(history);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load your conversation."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);
  useEffect(() => () => { if (attachmentPreview) URL.revokeObjectURL(attachmentPreview); }, [attachmentPreview]);

  async function createThumbnail(file: File) {
    const source = await createImageBitmap(file);
    const scale = Math.min(1, 480 / Math.max(source.width, source.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close();
    return canvas.toDataURL("image/jpeg", 0.72);
  }

  async function ask(value = input) {
    const message = value.replace(/\s+/g, " ").trim();
    if ((!message && !attachment) || sending || !conversationId) return;
    if (message.length > 500) { setError("Keep questions under 500 characters."); return; }
    if (attachment && !conversationId) return;
    setError(""); setRetry(""); setInput(""); setSending(true);
    try {
      if (attachment) {
        const form = new FormData();
        form.set("image", attachment);
        form.set("conversationId", conversationId);
        form.set("prompt", message || "Tell me the calories and give me a complete calorie and macro breakdown of this food.");
        if (attachmentPreview) form.set("thumbnail", await createThumbnail(attachment));
        const response = await fetch("/api/coach/vision", { method: "POST", body: form });
        if (!response.ok) throw new Error((await response.json()).message ?? "Unable to analyze this food image.");
        const data = await response.json() as { messages: CoachMessage[] };
        setMessages((current) => [...current, ...data.messages]);
        clearAttachment();
        return;
      }

      const response = await fetch("/api/coach", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, conversationId }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Your coach could not respond.");
      const data = await response.json() as { messages: CoachMessage[] };
      setMessages((current) => [...current, ...data.messages]);
    } catch (reason: unknown) {
      setInput(message);
      setRetry(message || "Tell me the calories and give me a complete calorie and macro breakdown of this food.");
      setError(reason instanceof Error ? reason.message : "Your coach could not respond. Try again.");
    } finally { setSending(false); }
  }

  function selectImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setAttachment(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setUploadMenuOpen(false);
  }

  function clearAttachment() {
    setAttachment(null);
    setAttachmentPreview((current) => { if (current) URL.revokeObjectURL(current); return ""; });
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function chooseImage(inputElement: HTMLInputElement | null) {
    setUploadMenuOpen(false);
    inputElement?.click();
  }

  async function addAnalysis(analysis: VisionAnalysis, messageId: string) {
    if (loggingAnalysis) return;
    setLoggingAnalysis(messageId); setError("");
    try {
      const response = await fetch("/api/coach/vision/log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(analysis) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to add these foods to your log.");
      const actionResponse = await fetch("/api/coach/action", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId, status: "logged" }) });
      if (!actionResponse.ok) throw new Error((await actionResponse.json()).message ?? "The meal was logged, but its coach action state could not be saved.");
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, analysis: { ...analysis, logged: true, actionStatus: "logged" }, content: `${message.content} All ${analysis.items.length} items were added to today's ${analysis.mealType} log.` } : message));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to add these foods to your log.");
    } finally { setLoggingAnalysis(""); }
  }

  async function declineAnalysis(messageId: string, analysis: VisionAnalysis) {
    if (analysis.actionStatus || analysis.logged || loggingAnalysis) return;
    setError("");
    const response = await fetch("/api/coach/action", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId, status: "declined" }) });
    if (!response.ok) {
      setError((await response.json()).message ?? "Unable to save your choice.");
      return;
    }
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, analysis: { ...analysis, actionStatus: "declined" } } : message));
  }

  async function newConversation() {
    if (!conversationId) return;
    setLoading(true); setError("");
    try {
      const next = `conversation-${Date.now()}`;
      window.sessionStorage.setItem(conversationKey, next);
      setConversationId(next); setMessages([]); clearAttachment();
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to start a new conversation."); }
    finally { setLoading(false); }
  }

  async function clearHistory() {
    if (!window.confirm("Clear all previous Coach chats? This cannot be undone.")) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/coach?all=true", { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to clear your Coach history.");
      const next = `conversation-${Date.now()}`;
      window.sessionStorage.setItem(conversationKey, next);
      setConversationId(next); setMessages([]); clearAttachment();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to clear your Coach history.");
    } finally { setLoading(false); }
  }

  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">A thoughtful second opinion</div><h1>Meet your AI coach.</h1><p>Practical, gentle nutrition guidance shaped around your Nouriva journey.</p></div><div className="coach-heading-actions"><button type="button" className="button button-ghost" onClick={newConversation} disabled={loading || sending}>New conversation</button><button type="button" className="button button-ghost" onClick={() => void clearHistory()} disabled={loading || sending}>Clear chat</button></div></div>
    <div className="coach-layout">
      <section className="app-card coach-chat" aria-label="Nouriva coach chat"><header className="coach-header"><span className="coach-avatar" aria-hidden="true">✦</span><div><b>Nouriva coach</b><small>Here to help, never to judge</small></div><span className="coach-status">● Ready</span></header>
        <div className="coach-messages" aria-live="polite">{loading ? <div className="loading-state">Loading your conversation…</div> : messages.length === 0 ? <div className="empty-state coach-empty"><strong>Upload a food image</strong><p>Ask for calories and a complete macro breakdown.</p></div> : messages.map((message) => <div className={`coach-message ${message.role}`} key={message.id}>{(message.imageUrl || message.image) && <img className="coach-message-image" src={message.imageUrl || message.image} alt="Food attached to this message" />}<span>{message.content}{message.analysis?.items.length ? <div className="coach-analysis"><div className="coach-analysis-heading"><b>Estimated calorie and macro breakdown</b><small>{message.analysis.mealType}</small></div>{message.analysis.items.map((item) => <div className="coach-analysis-item" key={`${message.id}-${item.name}`}><div><b>{item.name}</b><small>{item.portion} · {item.confidence} confidence</small>{item.notes && <small>{item.notes}</small>}</div><div><strong>{item.calories} kcal</strong><small>{item.protein}g protein · {item.carbohydrates}g carbs · {item.fat}g fat · {item.fiber}g fiber</small></div></div>)}{message.analysis.actionStatus === "logged" || message.analysis.logged ? <span className="coach-log-confirmation">✓ Meal logged</span> : message.analysis.actionStatus === "declined" ? <span className="coach-log-confirmation">✕ Meal declined</span> : <div className="coach-analysis-actions"><button type="button" className="button button-ghost" onClick={() => void declineAnalysis(message.id, message.analysis!)}>Decline</button><button type="button" className="button button-primary" onClick={() => void addAnalysis(message.analysis!, message.id)} disabled={loggingAnalysis === message.id}>{loggingAnalysis === message.id ? "Adding…" : "Log Meal"}</button></div>}</div> : null}</span></div>)}{sending && <div className="coach-message coach"><span>Thinking gently…</span></div>}<div ref={endRef} /></div>
        {error && <div className="error-box" role="alert">{error}{retry && <button type="button" className="text-link coach-retry" onClick={() => void ask(retry)}>Try again</button>}</div>}
        <form className="coach-form" onSubmit={(event) => { event.preventDefault(); void ask(); }}>
          <div className="coach-upload-menu">
            <button type="button" className="coach-plus-button" aria-label="Attach food image" aria-expanded={uploadMenuOpen} onClick={() => setUploadMenuOpen((open) => !open)} disabled={sending}>+</button>
            {uploadMenuOpen && <div className="coach-upload-popover" role="menu"><button type="button" role="menuitem" onClick={() => chooseImage(cameraInputRef.current)}>Take Photo</button><button type="button" role="menuitem" onClick={() => chooseImage(galleryInputRef.current)}>Upload Image</button></div>}
          </div>
          <label className="sr-only" htmlFor="coach-input">Message your coach</label><textarea id="coach-input" className="input coach-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask your coach anything…" maxLength={500} rows={2} disabled={sending} /><button type="submit" className="button button-primary" disabled={sending || (!input.trim() && !attachment)}>{sending ? "Sending…" : "Send"}</button>
        </form>
        {attachmentPreview && <div className="coach-attachment"><img src={attachmentPreview} alt="Selected food preview" /><span>{attachment?.name}</span><button type="button" onClick={clearAttachment} disabled={sending}>Remove</button></div>}
        <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => selectImage(event.target.files?.[0])} />
        <input ref={galleryInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} />
        <p className="coach-disclaimer">Wellness and nutrition education only — not diagnosis, treatment, or emergency care. For medical concerns, allergies, or eating-related distress, speak with a qualified professional.</p>
      </section>
      <aside className="app-card coach-side"><div className="coach-note"><b>Your privacy matters.</b><span>Your guidance uses only relevant Nouriva profile, log, and plan details. Your account data stays isolated.</span></div></aside>
    </div>
  </div>;
}
