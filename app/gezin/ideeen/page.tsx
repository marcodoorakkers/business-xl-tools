"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import BottomNav from "../dossier/components/BottomNav";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: "nieuw" | "overweging" | "ontwikkeling" | "live";
  votes: number;
  hasVoted: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "vandaag";
  if (days === 1) return "gisteren";
  if (days < 7) return `${days} dagen geleden`;
  if (days < 30) return `${Math.floor(days / 7)} weken geleden`;
  return `${Math.floor(days / 30)} maanden geleden`;
}

function StatusBadge({ status }: { status: Idea["status"] }) {
  const config: Record<Idea["status"], { bg: string; text: string; label: string }> = {
    nieuw:        { bg: "bg-gray-100",   text: "text-gray-500",   label: "Nieuw" },
    overweging:   { bg: "bg-amber-100",  text: "text-amber-800",  label: "In overweging" },
    ontwikkeling: { bg: "bg-blue-100",   text: "text-blue-800",   label: "In ontwikkeling" },
    live:         { bg: "bg-green-100",  text: "text-green-800",  label: "🎉 Live" },
  };
  const { bg, text, label } = config[status];
  return (
    <span className={`${bg} ${text} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
      {label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 animate-pulse">
      <div className="flex flex-col items-center gap-1 min-w-[48px]">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="w-6 h-4 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function NMMPKIdeeënPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
    fetchCurrentUser();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchCurrentUser() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    } catch { /* niet ingelogd */ }
  }

  async function fetchIdeas() {
    try {
      const res = await fetch("/api/gezin/ideas");
      if (res.ok) setIdeas(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(idea: Idea) {
    if (!currentUserId) { showToast("Log in om te stemmen."); return; }
    setIdeas((prev) => prev.map((i) =>
      i.id === idea.id
        ? { ...i, hasVoted: !i.hasVoted, votes: i.hasVoted ? i.votes - 1 : i.votes + 1 }
        : i
    ));
    try {
      const res = await fetch(`/api/ideas/${idea.id}/vote`, { method: "POST" });
      if (res.ok) {
        const data: { voted: boolean; votes: number } = await res.json();
        setIdeas((prev) =>
          prev.map((i) => i.id === idea.id ? { ...i, hasVoted: data.voted, votes: data.votes } : i)
            .sort((a, b) => b.votes - a.votes)
        );
      } else {
        setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, hasVoted: idea.hasVoted, votes: idea.votes } : i));
      }
    } catch {
      setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, hasVoted: idea.hasVoted, votes: idea.votes } : i));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!currentUserId) { showToast("Log in om een idee in te dienen."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/gezin/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      if (res.ok) {
        const newIdea: Idea = await res.json();
        setIdeas((prev) => [newIdea, ...prev]);
        setTitle("");
        setDescription("");
        setFormOpen(false);
        showToast("Idee ingediend! We nemen het mee. 🙌");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 md:pt-14">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8 pb-24">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/></svg>
            <h1 className="text-2xl font-extrabold text-gray-900">Ideeënbord</h1>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Wat zou NooitMeerPostKwijt nóg beter maken? Deel je idee of stem op dat van een ander.
          </p>
        </div>

        {/* Incentive banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex gap-4 items-start">
          <span className="flex-shrink-0 w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Win een bol.com cadeaukaart van €15</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Elke maand kiezen we het beste nieuwe idee. De indiener krijgt een bol.com cadeaukaart van €15 — gewoon als bedankje voor het meedenken.
            </p>
          </div>
        </div>

        {/* Indienen knop */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setFormOpen((p) => !p)}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Idee indienen
          </button>
        </div>

        {/* Formulier */}
        {formOpen && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="font-semibold text-gray-900 mb-4">Nieuw idee</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder="Kort en duidelijk omschreven"
                  maxLength={100}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right">{title.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toelichting <span className="text-gray-400 font-normal">(optioneel)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Meer context over je idee..."
                  maxLength={500}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right">{description.length}/500</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  {submitting ? "Indienen..." : "Indienen"}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); setTitle(""); setDescription(""); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ideeënlijst */}
        <div className="space-y-3">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : ideas.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-3">
                <span className="w-14 h-14 bg-amber-50 text-amber-400 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/></svg>
                </span>
              </div>
              <p className="text-gray-600 font-semibold mb-1">Nog geen ideeën ingediend</p>
              <p className="text-gray-400 text-sm mb-5">Wees de eerste — en maak kans op de cadeaukaart.</p>
              <button
                onClick={() => setFormOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                + Idee indienen
              </button>
            </div>
          ) : (
            ideas.map((idea) => (
              <div key={idea.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:border-amber-200 transition-colors">
                {/* Stem */}
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                  <button
                    onClick={() => handleVote(idea)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all ${
                      idea.hasVoted
                        ? "bg-amber-500 text-white"
                        : "border border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-500"
                    }`}
                    aria-label={idea.hasVoted ? "Stem intrekken" : "Stem"}
                  >
                    ▲
                  </button>
                  <span className="text-sm font-semibold text-gray-700">{idea.votes}</span>
                </div>

                {/* Inhoud */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm leading-snug">{idea.title}</span>
                    {currentUserId && idea.user_id === currentUserId && (
                      <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                        Jouw idee
                      </span>
                    )}
                  </div>
                  {idea.description && (
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2">{idea.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={idea.status} />
                    <span className="text-gray-400 text-xs">{timeAgo(idea.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
