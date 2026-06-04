"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import DossierNav from "../dossier/components/DossierNav";

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

  useEffect(() => {
    fetch("/api/admin/nmmpk-users")
      .then((r) => {
        if (r.status === 401) throw new Error("Geen toegang");
        return r.json();
      })
      .then((d) => setUsers(d.users ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const founding = users.filter((u) => u.promo_code === "founding25");
  const trialing = users.filter((u) => u.subscription_status === "trialing");
  const active   = users.filter((u) => u.subscription_status === "active");

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DossierNav />

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-800 font-medium max-w-[200px] truncate">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.subscription_status} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.subscription_period_end)}</td>
                      <td className="px-4 py-3 text-gray-500">{u.storage_preference ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">{u.doc_count}</td>
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
      </div>
    </div>
  );
}
