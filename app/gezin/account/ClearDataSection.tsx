"use client";

import { useEffect, useState } from "react";

type Confirm = "metadata" | "all" | null;

export default function ClearDataSection() {
  const [counts, setCounts] = useState<{ documents: number; actions: number } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<Confirm>(null);

  useEffect(() => {
    fetch("/api/gezin/clear-data")
      .then((r) => r.json())
      .then(setCounts);
  }, []);

  async function execute(type: "metadata" | "all") {
    setLoading(true);
    try {
      const res = await fetch("/api/gezin/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      setDone(type);
      setConfirm(null);
      setCounts(type === "all" ? { documents: 0, actions: 0 } : (c) => c ? { ...c, actions: 0 } : c);
    } catch {
      // show nothing — button resets
    } finally {
      setLoading(false);
    }
  }

  if (!counts) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">Gegevens wissen</h2>
        <p className="text-sm text-gray-500">
          Je hebt <strong>{counts.documents}</strong> {counts.documents === 1 ? "document" : "documenten"} en <strong>{counts.actions}</strong> {counts.actions === 1 ? "actie" : "acties"} opgeslagen.
        </p>
      </div>

      {done === "metadata" && (
        <p className="text-sm text-green-600 font-medium">✓ Samenvattingen en acties gewist.</p>
      )}
      {done === "all" && (
        <p className="text-sm text-green-600 font-medium">✓ Alle documenten en acties verwijderd.</p>
      )}

      <div className="space-y-2">
        {/* Wis metadata */}
        {confirm === "metadata" ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800 flex-1">Samenvattingen en acties wissen bij alle {counts.documents} documenten?</p>
            <button
              onClick={() => execute("metadata")}
              disabled={loading}
              className="text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loading ? "Bezig…" : "Ja, wis"}
            </button>
            <button onClick={() => setConfirm(null)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Nee</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm("metadata")}
            disabled={counts.documents === 0 && counts.actions === 0}
            className="w-full flex items-center gap-2 text-sm text-gray-600 font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 disabled:opacity-40 px-4 py-2.5 rounded-xl transition-colors text-left"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Wis samenvattingen en acties
            <span className="ml-auto text-xs text-gray-400">Documenten blijven</span>
          </button>
        )}

        {/* Verwijder alles */}
        {confirm === "all" ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-800 flex-1">Alle {counts.documents} documenten en {counts.actions} acties permanent verwijderen?</p>
            <button
              onClick={() => execute("all")}
              disabled={loading}
              className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loading ? "Bezig…" : "Ja, verwijder"}
            </button>
            <button onClick={() => setConfirm(null)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Nee</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm("all")}
            disabled={counts.documents === 0 && counts.actions === 0}
            className="w-full flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 hover:bg-red-100 border border-red-100 disabled:opacity-40 px-4 py-2.5 rounded-xl transition-colors text-left"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Verwijder alle documenten en acties
            <span className="ml-auto text-xs text-red-400">Niet terug te draaien</span>
          </button>
        )}
      </div>
    </div>
  );
}
