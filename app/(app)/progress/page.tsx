"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeightLog } from "@/types";

const ranges = [{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "all", label: "All" }];

export default function ProgressPage() {
  const [weight, setWeight] = useState(""); const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [logs, setLogs] = useState<WeightLog[]>([]); const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const response = await fetch("/api/weight"); if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load weight history."); setLogs(await response.json() as WeightLog[]); }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to load weight history."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const response = await fetch("/api/weight", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ weight: Number(weight), unit }) }); const data = await response.json() as WeightLog & { message?: string }; if (!response.ok) throw new Error(data.message ?? "Unable to save check-in."); setLogs((current) => [data, ...current]); setWeight(""); setMessage("Weight check-in saved."); }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to save check-in."); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Remove this weight entry?")) return;
    try { const response = await fetch(`/api/weight?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) throw new Error((await response.json()).message ?? "Unable to remove entry."); setLogs((current) => current.filter((log) => log.id !== id)); }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to remove entry."); }
  }
  const visible = useMemo(() => range === "all" ? logs : logs.filter((log) => Date.now() - new Date(log.loggedAt).getTime() <= Number(range) * 86400000), [logs, range]);
  const chronological = [...visible].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const latest = logs[0]; const previous = logs[1]; const change = latest && previous && latest.unit === previous.unit ? latest.weight - previous.weight : null;
  const max = Math.max(...chronological.map((log) => log.weight), 1); const min = Math.min(...chronological.map((log) => log.weight), max);
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">Notice your patterns</div><h1>Your progress.</h1><p>Progress is more than a number. This is your space to notice what&apos;s changing.</p></div></div>
    {message && <div className="toast" role="status">{message}</div>}{error && <div className="error-box" role="alert">{error}</div>}
    <div className="stats-grid"><div className="app-card stat-card"><small>Latest weight</small><strong>{latest ? `${latest.weight} ${latest.unit}` : "—"}</strong><span>{latest ? new Date(latest.loggedAt).toLocaleDateString() : "No check-ins yet"}</span></div><div className="app-card stat-card"><small>Change from previous</small><strong>{change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} ${latest?.unit}`}</strong><span>{change === null ? "Add another check-in to compare" : "Not a target or medical measure"}</span></div></div>
    <div className="dashboard-two"><section className="app-card"><h2 className="section-title">Weight check-ins</h2><form onSubmit={save} className="toolbar"><input required min="1" max="1000" className="input" type="number" step=".1" placeholder="Your weight" value={weight} onChange={(e) => setWeight(e.target.value)} /><select className="select" value={unit} onChange={(e) => setUnit(e.target.value as "kg" | "lb")}><option value="kg">kg</option><option value="lb">lb</option></select><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save check-in"}</button></form><div className="toolbar"><span className="page-copy" style={{ margin: 0 }}>Show:</span>{ranges.map((item) => <button type="button" className={`button ${range === item.value ? "button-primary" : "button-ghost"}`} key={item.value} onClick={() => setRange(item.value)}>{item.label}</button>)}</div>{loading ? <div className="loading-state">Loading weight history…</div> : visible.length === 0 ? <div className="empty-state"><strong>No check-ins in this range</strong><span>Log a check-in to start seeing your trend.</span></div> : <div className="logged-list">{visible.map((log) => <div className="logged-item" key={log.id}><div><b>{log.weight} {log.unit}</b><small>{new Date(log.loggedAt).toLocaleDateString()}</small></div><button type="button" className="delete-button" onClick={() => void remove(log.id)}>Remove</button></div>)}</div>}</section>
      <section className="app-card"><h2 className="section-title">Weight trend</h2>{chronological.length > 1 ? <><div className="report-chart" aria-label="Weight trend chart">{chronological.map((log) => <div className="report-bar" key={log.id} style={{ height: `${Math.max(15, ((log.weight - min + (max === min ? 1 : 0)) / (max - min + (max === min ? 1 : 0))) * 85 + 15)}%` }}><strong>{new Date(log.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong></div>)}</div><p className="page-copy" style={{ marginTop: 30 }}>Showing {chronological.length} actual check-ins from the {range === "all" ? "full history" : `last ${range} days`}.</p></> : <div className="empty-state"><strong>Your trend will appear here</strong><span>Log at least two check-ins to see a chart.</span></div>}<div className="goal-unavailable" style={{ marginTop: 18 }}>No target weight is shown because none is set in your profile.</div></section></div></div>;
}
