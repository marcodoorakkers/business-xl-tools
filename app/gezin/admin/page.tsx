"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import BottomNav from "../dossier/components/BottomNav";

interface NMUser {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string | null;
  subscription_period_end: string | null;
  promo_code: string | null;
  storage_preference: string | null;
  doc_count: number;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const config: Record<string, { bg: string; text: string }> = {
    trialing:    { bg: "bg-amber-100",  text: "text-amber-800" },
    active:      { bg: "bg-green-100",  text: "text-green-800" },
    cancelling:  { bg: "bg-orange-100", text: "text-orange-800" },
  };
  const { bg, text } = config[status] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`${bg} ${text} text-xs font-medium px-2 py-0.5 rounded-full`}>
      {status}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function NMMPKAdminPage() {
  const [users, setUsers] = useState<NMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vriendActive, setVriendActive] = useState<boolean | null>(null);
  const [togglingVriend, setTogglingVriend] = useState(false);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ userId: string; docsDeleted: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/nmmpk-users")
      .then((r) => {
        if (r.status === 401) throw new Error("Geen toegang");
        return r.json();
      })
      .then((d) => setUsers(d.users ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetch("/api/admin/promo")
      .then((r) => r.json())
      .then((d) => setVriendActive(d.promo?.active ?? false));
  }, []);

  async function resetUserData(userId: string) {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset-user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResetResult({ userId, docsDeleted: data.docsDeleted });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, doc_count: 0 } : u));
      setConfirmResetId(null);
    } catch {
      setError("Netwerkfout bij wissen.");
    } finally {
      setResetting(false);
    }
  }

  async function toggleVriend() {
    setTogglingVriend(true);
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !vriendActive }),
    });
    const d = await res.json();
    setVriendActive(d.active);
    setTogglingVriend(false);
  }

  const founding = users.filter((u) => u.promo_code === "founding25");
  const vrienden = users.filter((u) => u.promo_code === "vriendenvan");
  const trialing = users.filter((u) => u.subscription_status === "trialing");
  const active   = users.filter((u) => u.subscription_status === "active");

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 md:pt-14">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Admin — NooitMeerPostKwijt</h1>
          <p className="text-gray-500 text-sm">Alleen zichtbaar voor jou.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Totaal gebruikers", value: users.length, icon: "👤" },
            { label: "Founding members", value: founding.length, icon: "⭐" },
            { label: "In proefperiode", value: trialing.length, icon: "⏳" },
            { label: "Actief betaald", value: active.length, icon: "✓" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-extrabold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Gebruikerslijst */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Gebruikers</h2>
            <span className="text-xs text-gray-400">{users.length} totaal</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Laden…</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Geen gebruikers gevonden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">E-mail</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Aangemeld</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Einde periode</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Opslag</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Docs</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Founding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resetResult && (
                    <tr>
                      <td colSpan={8} className="px-5 py-2 bg-green-50 text-green-700 text-xs font-medium">
                        ✓ {resetResult.docsDeleted} documenten gewist
                        <button onClick={() => setResetResult(null)} className="ml-3 text-green-500 hover:text-green-700">✕</button>
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-800 font-medium max-w-[200px] truncate">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.subscription_status} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.subscription_period_end)}</td>
                      <td className="px-4 py-3 text-gray-500">{u.storage_preference ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-semibold">{u.doc_count}</span>
                          {confirmResetId === u.id ? (
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <button
                                onClick={() => resetUserData(u.id)}
                                disabled={resetting}
                                className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-1.5 py-0.5 rounded font-medium"
                              >
                                {resetting ? "…" : "Ja"}
                              </button>
                              <button onClick={() => setConfirmResetId(null)} className="text-xs text-gray-400 hover:text-gray-600">Nee</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setConfirmResetId(u.id); setResetResult(null); }}
                              disabled={u.doc_count === 0}
                              className="text-xs text-red-400 hover:text-red-700 disabled:text-gray-200 disabled:cursor-not-allowed"
                              title="Testdata wissen"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.promo_code === "founding25" ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            <span className="text-xs font-medium text-amber-700">Founding</span>
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Founding members detail */}
        {founding.length > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Founding members ({founding.length}/25)
            </h2>
            <div className="space-y-2">
              {founding.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-800 font-medium">{u.email}</span>
                  <span className="text-amber-600 text-xs">tot {formatDate(u.subscription_period_end)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-3">{25 - founding.length} plekken nog vrij</p>
          </div>
        )}

        {/* Vriend van */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Vriend van ({vrienden.length})
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-600 font-medium">
                {vriendActive === null ? "…" : vriendActive ? "Link actief" : "Link uitgeschakeld"}
              </span>
              <button
                onClick={toggleVriend}
                disabled={togglingVriend || vriendActive === null}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  vriendActive ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  vriendActive ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>

          {!vriendActive && (
            <p className="text-xs text-blue-700 bg-blue-100 rounded-xl px-3 py-2 mb-3">
              ⚠️ De uitnodigingslink is uitgeschakeld — nieuwe aanmeldingen via <code>?promo=vriendenvan</code> krijgen geen 6 maanden gratis.
            </p>
          )}

          <p className="text-xs text-blue-600 mb-3 font-mono select-all">
            nooitmeerpostkwijt.nl/aanmelden?promo=vriendenvan
          </p>

          {vrienden.length === 0 ? (
            <p className="text-xs text-blue-400 italic">Nog niemand via deze link aangemeld.</p>
          ) : (
            <div className="space-y-2">
              {vrienden.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">{u.email}</span>
                  <div className="flex items-center gap-3 text-xs text-blue-500">
                    <span>{formatDate(u.created_at)}</span>
                    <span>tot {formatDate(u.subscription_period_end)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
