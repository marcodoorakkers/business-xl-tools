"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DocumentAction {
  id: string;
  actie: string;
  deadline: string | null;
  actie_type: string | null;
  status: "open" | "gedaan" | "overgeslagen";
  document_naam: string | null;
  afzender: string | null;
  mappad: string | null;
  file_url: string | null;
  created_at: string;
}

function deadlineInfo(deadline: string | null) {
  if (!deadline) return { label: "Geen deadline", urgency: "none" as const };
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)} dag${Math.abs(days) === 1 ? "" : "en"} te laat`, urgency: "overdue" as const };
  if (days === 0) return { label: "Vandaag", urgency: "today" as const };
  if (days <= 7) return { label: `Over ${days} dag${days === 1 ? "" : "en"}`, urgency: "soon" as const };
  const date = new Date(deadline).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  return { label: date, urgency: "later" as const };
}

const URGENCY_STYLES = {
  overdue: "bg-red-50 border-red-200 text-red-700",
  today: "bg-red-50 border-red-200 text-red-700",
  soon: "bg-orange-50 border-orange-200 text-orange-700",
  later: "bg-green-50 border-green-200 text-green-700",
  none: "bg-gray-50 border-gray-200 text-gray-500",
};

export default function GezinActiesPage() {
  const [actions, setActions] = useState<DocumentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "gedaan" | "overgeslagen">("open");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/tools/mijn-dossier/acties");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? `Fout ${res.status}`);
        setActions([]);
      } else {
        setActions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Onbekende fout");
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadActions(); }, [loadActions]);

  async function updateStatus(id: string, status: "gedaan" | "overgeslagen" | "open") {
    setUpdating(id);
    try {
      await fetch(`/api/tools/mijn-dossier/acties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } finally {
      setUpdating(null);
    }
  }

  async function deleteAction(id: string) {
    setUpdating(id);
    try {
      await fetch(`/api/tools/mijn-dossier/acties/${id}`, { method: "DELETE" });
      setActions(prev => prev.filter(a => a.id !== id));
    } finally {
      setUpdating(null);
    }
  }

  const filtered = actions.filter(a => a.status === filter);
  const openCount = actions.filter(a => a.status === "open").length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-amber-700 text-lg">📬 NooitMeerPostKwijt</Link>
          <Link href="/dossier" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            ← Terug
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Acties</h1>
          <p className="text-gray-500 text-sm">
            {openCount === 0
              ? "Geen openstaande acties"
              : `${openCount} openstaande actie${openCount === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["open", "gedaan", "overgeslagen"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "open" ? `Open${openCount > 0 ? ` (${openCount})` : ""}` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
            Fout bij laden: {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Laden…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
            <p className="text-gray-500 text-sm">
              {filter === "open"
                ? "Geen openstaande acties — scan een brief om acties te ontdekken."
                : `Geen ${filter} acties.`}
            </p>
            {filter === "open" && (
              <Link href="/dossier" className="inline-block mt-4 text-sm text-amber-600 hover:text-amber-800 font-medium">
                Brief scannen →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((action) => {
              const dl = deadlineInfo(action.deadline);
              const isUpdating = updating === action.id;

              return (
                <div
                  key={action.id}
                  className={`bg-white border border-gray-100 rounded-2xl overflow-hidden transition-opacity ${isUpdating ? "opacity-50" : ""}`}
                >
                  {filter === "open" && (
                    <div className={`h-1.5 w-full ${
                      dl.urgency === "overdue" || dl.urgency === "today" ? "bg-red-400" :
                      dl.urgency === "soon" ? "bg-orange-400" : "bg-amber-400"
                    }`} />
                  )}

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {filter === "open" ? (
                        <button
                          onClick={() => updateStatus(action.id, "gedaan")}
                          disabled={isUpdating}
                          title="Markeer als gedaan"
                          className="mt-0.5 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-amber-500 hover:bg-amber-50 shrink-0 transition-colors"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-gray-100 shrink-0 mt-0.5 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}

                      <div className="flex-1 min-w-0">
                        {filter === "open" && (
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${
                            dl.urgency === "overdue" || dl.urgency === "today" ? "bg-red-100 text-red-700" :
                            dl.urgency === "soon" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {dl.urgency === "overdue" ? "⚠️ Te laat" : "⏳ Te doen"}
                          </span>
                        )}

                        <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{action.actie}</p>
                        {action.afzender && (
                          <p className="text-xs text-gray-500">Van: {action.afzender}</p>
                        )}
                        {action.file_url && (
                          <a
                            href={action.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-amber-600 hover:text-amber-800 font-medium mt-0.5 transition-colors"
                          >
                            Document openen →
                          </a>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {action.deadline && (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${URGENCY_STYLES[dl.urgency]}`}>
                              {dl.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {filter === "open" && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => updateStatus(action.id, "gedaan")}
                          disabled={isUpdating}
                          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                        >
                          <span>✓</span> Markeer als gedaan
                        </button>
                        <button
                          onClick={() => updateStatus(action.id, "overgeslagen")}
                          disabled={isUpdating}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Overslaan
                        </button>
                      </div>
                    )}
                    {filter !== "open" && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => updateStatus(action.id, "open")}
                          disabled={isUpdating}
                          className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                        >
                          Heropen
                        </button>
                        <button
                          onClick={() => deleteAction(action.id)}
                          disabled={isUpdating}
                          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors ml-auto"
                        >
                          Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
