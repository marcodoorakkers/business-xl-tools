"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ToolNav from "@/components/ToolNav";

interface Draft {
  id: string;
  subject: string;
  body: string;
  transcript: string | null;
  language: string;
  status: "new" | "copied" | "deleted";
  created_at: string;
}

export default function ConceptenPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/voice-mail/drafts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Fout ${res.status}`);
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function copyToClipboard(draft: Draft) {
    const text = `Onderwerp: ${draft.subject}\n\n${draft.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(draft.id);
    setTimeout(() => setCopied(null), 2000);

    // Mark as copied
    if (draft.status === "new") {
      setUpdating(draft.id);
      await fetch(`/api/tools/voice-mail/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "copied" }),
      });
      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: "copied" } : d));
      setUpdating(null);
    }
  }

  async function deleteDraft(id: string) {
    setUpdating(id);
    await fetch(`/api/tools/voice-mail/drafts/${id}`, { method: "DELETE" });
    setDrafts(prev => prev.filter(d => d.id !== id));
    setUpdating(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("nl-NL", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  const newCount = drafts.filter(d => d.status === "new").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="🎙️ Voice Mail Draft" />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mijn concepten</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {newCount > 0 ? `${newCount} nieuw concept${newCount === 1 ? "" : "en"} om te kopiëren` : "Alle concepten gekopieerd"}
            </p>
          </div>
          <Link href="/tools/voice-mail"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors">
            + Nieuw inspreken
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            Fout bij laden: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Laden…</div>
        ) : drafts.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-sm mb-4">Nog geen concepten — spreek je eerste mail in.</p>
            <Link href="/tools/voice-mail"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors">
              Inspreken →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-opacity ${
                  updating === draft.id ? "opacity-50" : ""
                } ${draft.status === "new" ? "border-blue-200" : "border-gray-100"}`}
              >
                {draft.status === "new" && <div className="h-1 w-full bg-blue-500" />}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {draft.status === "new" && (
                          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Nieuw</span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(draft.created_at)}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">{draft.subject}</p>
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === draft.id ? null : draft.id)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-1"
                    >
                      {expanded === draft.id ? "Inklappen" : "Bekijken"}
                    </button>
                  </div>

                  {expanded === draft.id && (
                    <div className="mt-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 font-sans">
                        {draft.body}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => copyToClipboard(draft)}
                      disabled={updating === draft.id}
                      className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      {copied === draft.id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Gekopieerd!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Kopieer naar klembord
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      disabled={updating === draft.id}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
