"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import ToolNav from "@/components/ToolNav";

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
  const styles: Record<Idea["status"], { background: string; color: string }> = {
    nieuw: { background: "#F3F4F6", color: "#6B7280" },
    overweging: { background: "#FEF3C7", color: "#92400E" },
    ontwikkeling: { background: "#DBEAFE", color: "#1E40AF" },
    live: { background: "#D1FAE5", color: "#065F46" },
  };

  const labels: Record<Idea["status"], string> = {
    nieuw: "Nieuw",
    overweging: "In overweging",
    ontwikkeling: "In ontwikkeling",
    live: "🎉 Live",
  };

  const style = styles[status];

  return (
    <span
      style={{
        backgroundColor: style.background,
        color: style.color,
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
      }}
    >
      {labels[status]}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 animate-pulse">
      <div className="flex flex-col items-center gap-1 min-w-[48px]">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="w-6 h-4 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function IdeeënbordPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    } catch {
      // not logged in
    }
  }

  async function fetchIdeas() {
    try {
      const res = await fetch("/api/ideas");
      if (res.ok) {
        const data: Idea[] = await res.json();
        setIdeas(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(idea: Idea) {
    // Optimistic update
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === idea.id
          ? {
              ...i,
              hasVoted: !i.hasVoted,
              votes: i.hasVoted ? i.votes - 1 : i.votes + 1,
            }
          : i
      )
    );

    try {
      const res = await fetch(`/api/ideas/${idea.id}/vote`, { method: "POST" });
      if (res.ok) {
        const data: { voted: boolean; votes: number } = await res.json();
        setIdeas((prev) =>
          prev
            .map((i) =>
              i.id === idea.id ? { ...i, hasVoted: data.voted, votes: data.votes } : i
            )
            .sort((a, b) => b.votes - a.votes)
        );
      } else {
        // Revert on error
        setIdeas((prev) =>
          prev.map((i) =>
            i.id === idea.id
              ? {
                  ...i,
                  hasVoted: idea.hasVoted,
                  votes: idea.votes,
                }
              : i
          )
        );
      }
    } catch {
      // Revert on network error
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id
            ? { ...i, hasVoted: idea.hasVoted, votes: idea.votes }
            : i
        )
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
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
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="💡 Ideeënbord" />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💡 Ideeënbord</h1>
            <p className="text-gray-500 text-sm mt-1">
              Deel je ideeën en stem op wat jij het nuttigst vindt. We bouwen wat er het meest toe doet.
            </p>
          </div>
          <button
            onClick={() => setFormOpen((prev) => !prev)}
            className="ml-4 shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Idee indienen
          </button>
        </div>

        {/* Submit form */}
        {formOpen && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 mt-4">
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right">{description.length}/500</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  {submitting ? "Indienen..." : "Indienen"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setTitle("");
                    setDescription("");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ideas list */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : ideas.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">💡</div>
              <p className="text-gray-500 font-medium mb-1">Nog geen ideeën ingediend</p>
              <p className="text-gray-400 text-sm mb-5">Wees de eerste en deel jouw idee!</p>
              <button
                onClick={() => setFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                + Idee indienen
              </button>
            </div>
          ) : (
            ideas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:border-gray-200 transition-colors"
              >
                {/* Vote button */}
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                  <button
                    onClick={() => handleVote(idea)}
                    style={
                      idea.hasVoted
                        ? { backgroundColor: "#2563EB", color: "#ffffff", border: "none" }
                        : { backgroundColor: "transparent", color: "#9CA3AF", border: "1px solid #D1D5DB" }
                    }
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold transition-all hover:opacity-80 cursor-pointer"
                    aria-label={idea.hasVoted ? "Stem intrekken" : "Stem"}
                  >
                    ▲
                  </button>
                  <span className="text-sm font-semibold text-gray-700">{idea.votes}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm leading-snug">{idea.title}</span>
                    {currentUserId && idea.user_id === currentUserId && (
                      <span
                        style={{
                          backgroundColor: "#EFF6FF",
                          color: "#1D4ED8",
                          padding: "1px 7px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Jouw idee
                      </span>
                    )}
                  </div>
                  {idea.description && (
                    <p
                      className="text-gray-500 text-sm mb-2"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {idea.description}
                    </p>
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
    </div>
  );
}
