"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  created_at: string;
  credits: number;
  total_usage: number;
}

interface NmmpkUser {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string | null;
  promo_code: string | null;
  storage_preference: string | null;
  doc_count: number;
}

interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: string;
  votes: number;
  created_at: string;
  user_id: string;
}

interface ToolStat {
  tool: string;
  count: number;
  credits: number;
}

interface DayStat {
  date: string;
  count: number;
}

interface Stats {
  totalUsers: number;
  totalUsage: number;
  creditsSpent: number;
  creditsSold: number;
  byTool: ToolStat[];
  byDay: DayStat[];
}

const TOOL_NAMES: Record<string, string> = {
  "voice-mail": "Voice Mail Draft",
  "meeting-notes": "Meeting Memo",
  "dinner-plan": "Weekmenu Planner",
  "vacancy-finder": "Vacaturezoeker",
  "cv-builder": "CV Builder",
  "credits_purchase": "Losse credits gekocht",
  "subscription_start": "Maandelijks abonnement gestart",
  "subscription_renewal": "Maandelijks verlengd",
};

const STATUS_OPTIONS = ["nieuw", "overweging", "ontwikkeling", "live"] as const;
type Status = typeof STATUS_OPTIONS[number];

const STATUS_STYLES: Record<Status, { label: string; bg: string; color: string }> = {
  nieuw:        { label: "Nieuw",           bg: "#F3F4F6", color: "#6B7280" },
  overweging:   { label: "In overweging",   bg: "#FEF3C7", color: "#D97706" },
  ontwikkeling: { label: "In ontwikkeling", bg: "#DBEAFE", color: "#2563EB" },
  live:         { label: "Live! 🎉",        bg: "#D1FAE5", color: "#059669" },
};

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "ideas" | "stats" | "testdata">("users");

  // — Users state —
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "set">("add");
  const [saving, setSaving] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // — Ideas state —
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // — Stats state —
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // — Testdata state —
  const [nmmpkUsers, setNmmpkUsers] = useState<NmmpkUser[]>([]);
  const [loadingNmmpk, setLoadingNmmpk] = useState(false);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ userId: string; docsDeleted: number; actiesDeleted: number } | null>(null);

  const [error, setError] = useState("");

  async function loadUsers() {
    setLoadingUsers(true);
    const res = await fetch("/api/admin/users");
    if (res.status === 401) { setError("Geen toegang."); setLoadingUsers(false); return; }
    const data = await res.json();
    setUsers(data.users || []);
    setLoadingUsers(false);
  }

  async function loadIdeas() {
    setLoadingIdeas(true);
    const res = await fetch("/api/admin/ideas");
    if (res.status === 401) { setError("Geen toegang."); setLoadingIdeas(false); return; }
    const data = await res.json();
    setIdeas(data.ideas || []);
    setLoadingIdeas(false);
  }

  async function loadStats() {
    setLoadingStats(true);
    const res = await fetch("/api/admin/stats");
    if (res.status === 401) { setError("Geen toegang."); setLoadingStats(false); return; }
    const data = await res.json();
    setStats(data);
    setLoadingStats(false);
  }

  async function loadNmmpkUsers() {
    setLoadingNmmpk(true);
    const res = await fetch("/api/admin/nmmpk-users");
    if (res.status === 401) { setError("Geen toegang."); setLoadingNmmpk(false); return; }
    const data = await res.json();
    setNmmpkUsers(data.users ?? []);
    setLoadingNmmpk(false);
  }

  async function resetUserData(userId: string) {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset-user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(`Fout: ${data.error}`); return; }
      setResetResult({ userId, docsDeleted: data.docsDeleted, actiesDeleted: data.actiesDeleted });
      setNmmpkUsers((prev) => prev.map((u) => u.id === userId ? { ...u, doc_count: 0 } : u));
      setConfirmResetId(null);
    } catch {
      setError("Netwerkfout bij wissen.");
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (tab === "ideas" && ideas.length === 0) loadIdeas(); }, [tab]);
  useEffect(() => { if (tab === "stats" && !stats) loadStats(); }, [tab]);
  useEffect(() => { if (tab === "testdata" && nmmpkUsers.length === 0) loadNmmpkUsers(); }, [tab]);

  async function saveCredits(userId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: Number(amount), mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Fout: ${data.error || res.status}`);
      } else if (data.success) {
        setUsers(users.map((u) => u.id === userId ? { ...u, credits: data.newCredits } : u));
        setSuccessId(userId);
        setTimeout(() => setSuccessId(null), 2000);
        setEditId(null);
        setAmount("");
        setError("");
      }
    } catch {
      setError("Netwerkfout bij opslaan.");
    }
    setSaving(false);
  }

  async function updateStatus(ideaId: string, status: Status) {
    setUpdatingId(ideaId);
    setError("");
    try {
      const res = await fetch("/api/admin/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ideaId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(ideas.map((i) => i.id === ideaId ? { ...i, status } : i));
        if (data.creditsAwarded) {
          setError("✅ Status bijgewerkt en 100 credits toegekend aan de indiener!");
          setTimeout(() => setError(""), 4000);
        }
      } else {
        setError(`Fout: ${data.error}`);
      }
    } catch {
      setError("Netwerkfout bij opslaan.");
    }
    setUpdatingId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">⚙️ Admin</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("users")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "users"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            👥 Gebruikers
          </button>
          <button
            onClick={() => setTab("ideas")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "ideas"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            💡 Ideeën
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "stats"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            📊 Rapportage
          </button>
          <button
            onClick={() => setTab("testdata")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "testdata"
                ? "bg-red-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            🧹 Testdata
          </button>
        </div>

        {error && (
          <div className={`border rounded-xl p-4 mb-6 ${error.startsWith("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
            {error}
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === "users" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gebruikersbeheer</h1>
            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">E-mail</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Aangemeld</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Credits</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Gebruik</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Actie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900">{user.email}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(user.created_at).toLocaleDateString("nl-NL")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {successId === user.id ? (
                            <span className="text-green-600 font-semibold">✓ {user.credits}</span>
                          ) : (
                            <span className={`font-semibold ${user.credits === 0 ? "text-red-500" : "text-blue-600"}`}>
                              {user.credits}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{user.total_usage}x</td>
                        <td className="px-4 py-3 text-right">
                          {editId === user.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as "add" | "set")}
                                className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                              >
                                <option value="add">Toevoegen</option>
                                <option value="set">Instellen op</option>
                              </select>
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() => saveCredits(user.id)}
                                disabled={saving || !amount}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-3 py-1 text-xs font-medium"
                              >
                                {saving ? "..." : "Opslaan"}
                              </button>
                              <button
                                onClick={() => { setEditId(null); setAmount(""); }}
                                className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                              >
                                Annuleer
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditId(user.id); setAmount(""); setMode("add"); }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Credits aanpassen
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Nog geen gebruikers.</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Stats tab ── */}
        {tab === "stats" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Rapportage</h1>
              <button
                onClick={loadStats}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
              >
                ↻ Verversen
              </button>
            </div>

            {loadingStats ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stats ? (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Totaal gebruikers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Tool-gebruik (acties)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsage}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Credits gebruikt</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.creditsSpent}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Credits verkocht</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.creditsSold}</p>
                  </div>
                </div>

                {/* Tool usage table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900 text-sm">Gebruik per tool</h2>
                  </div>
                  {stats.byTool.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">Nog geen gebruik geregistreerd.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Tool</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-600">Aantal keer gebruikt</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-600">Credits gebruikt</th>
                          <th className="px-4 py-3 w-40"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          const maxCount = Math.max(...stats.byTool.map((t) => t.count), 1);
                          return stats.byTool.map((t) => (
                            <tr key={t.tool} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-900 font-medium">
                                {TOOL_NAMES[t.tool] ?? t.tool}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">{t.count}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{t.credits}</td>
                              <td className="px-4 py-3">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${Math.round((t.count / maxCount) * 100)}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Daily bar chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900 text-sm mb-4">Gebruik afgelopen 30 dagen</h2>
                  {stats.byDay.every((d) => d.count === 0) ? (
                    <p className="text-center text-gray-400 py-8 text-sm">Geen gebruik in de afgelopen 30 dagen.</p>
                  ) : (
                    <div className="flex items-end gap-1" style={{ height: 120 }}>
                      {(() => {
                        const maxCount = Math.max(...stats.byDay.map((d) => d.count), 1);
                        return stats.byDay.map((d, i) => {
                          const heightPct = Math.round((d.count / maxCount) * 100);
                          const date = new Date(d.date + "T12:00:00");
                          const showLabel = i % 5 === 0;
                          const label = date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
                          return (
                            <div key={d.date} className="flex flex-col items-center flex-1 min-w-0" title={`${d.date}: ${d.count}`}>
                              <div className="w-full flex items-end" style={{ height: 100 }}>
                                <div
                                  className="w-full rounded-t bg-blue-500"
                                  style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? 2 : 0 }}
                                />
                              </div>
                              <div className="text-gray-400 mt-1 overflow-hidden text-center" style={{ fontSize: 9, height: 16 }}>
                                {showLabel ? label : ""}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 py-12 text-sm">Kon statistieken niet laden.</p>
            )}
          </>
        )}

        {/* ── Ideas tab ── */}
        {tab === "ideas" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Ideeënbeheer</h1>
              <button
                onClick={loadIdeas}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
              >
                ↻ Verversen
              </button>
            </div>

            {loadingIdeas ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {ideas.map((idea) => {
                  const s = STATUS_STYLES[idea.status as Status] ?? STATUS_STYLES.nieuw;
                  return (
                    <div
                      key={idea.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4"
                    >
                      {/* vote count */}
                      <div className="flex flex-col items-center min-w-[40px] pt-0.5">
                        <span className="text-lg font-bold text-gray-700">▲</span>
                        <span className="text-sm font-semibold text-gray-900">{idea.votes}</span>
                      </div>

                      {/* content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm mb-0.5">{idea.title}</p>
                        {idea.description && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{idea.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(idea.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      {/* status badge + dropdown */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                        <select
                          value={idea.status}
                          disabled={updatingId === idea.id}
                          onChange={(e) => updateStatus(idea.id, e.target.value as Status)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
                          ))}
                        </select>
                        {updatingId === idea.id && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {ideas.length === 0 && (
                  <p className="text-center text-gray-400 py-12 text-sm">Nog geen ideeën ingediend.</p>
                )}
              </div>
            )}
          </>
        )}
        {/* ── Testdata tab ── */}
        {tab === "testdata" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Testdata wissen</h1>
                <p className="text-sm text-gray-500 mt-1">Verwijdert alle documenten en acties van een gebruiker. Alleen voor testdoeleinden.</p>
              </div>
              <button
                onClick={loadNmmpkUsers}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
              >
                ↻ Verversen
              </button>
            </div>

            {resetResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-center justify-between">
                <span>✓ Gewist: {resetResult.docsDeleted} documenten, {resetResult.actiesDeleted} acties</span>
                <button onClick={() => setResetResult(null)} className="text-green-500 hover:text-green-700 text-xs">✕</button>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
              ⚠️ Deze actie is onomkeerbaar. Gebruik alleen op testaccounts.
            </div>

            {loadingNmmpk ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">E-mail</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Docs</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Actie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nmmpkUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            u.subscription_status === "active" ? "bg-green-100 text-green-700" :
                            u.subscription_status === "trialing" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {u.subscription_status ?? "geen"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 font-medium">{u.doc_count}</td>
                        <td className="px-4 py-3 text-right">
                          {confirmResetId === u.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-gray-600">Zeker weten?</span>
                              <button
                                onClick={() => resetUserData(u.id)}
                                disabled={resetting}
                                className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg font-medium"
                              >
                                {resetting ? "Bezig…" : "Ja, wis alles"}
                              </button>
                              <button
                                onClick={() => setConfirmResetId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                              >
                                Annuleer
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setConfirmResetId(u.id); setResetResult(null); }}
                              disabled={u.doc_count === 0}
                              className="text-xs text-red-600 hover:text-red-800 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                              Wis testdata
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {nmmpkUsers.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Geen NMMPK-gebruikers gevonden.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
