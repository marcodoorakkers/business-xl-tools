"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import ToolNav from "@/components/ToolNav";

type SlideType = "titel" | "agenda" | "inhoud" | "afsluiting" | "vragen";

interface Slide {
  number: number;
  type: SlideType;
  title: string;
  bullets: string[];
  speakerTip: string;
}

interface Outline {
  title: string;
  totalSlides: number;
  estimatedMinutes: number;
  slides: Slide[];
}

const TYPE_COLORS: Record<SlideType, { bg: string; text: string; label: string }> = {
  titel: { bg: "#7C3AED", text: "#fff", label: "Titel" },
  agenda: { bg: "#2563EB", text: "#fff", label: "Agenda" },
  inhoud: { bg: "#6B7280", text: "#fff", label: "Inhoud" },
  afsluiting: { bg: "#059669", text: "#fff", label: "Afsluiting" },
  vragen: { bg: "#D97706", text: "#fff", label: "Vragen" },
};

function buildCopyText(outline: Outline): string {
  const lines: string[] = [];
  lines.push(`[${outline.title}]`);
  lines.push("");
  for (const slide of outline.slides) {
    lines.push(`Slide ${slide.number}: ${slide.title}`);
    for (const bullet of slide.bullets) {
      lines.push(`• ${bullet}`);
    }
    if (slide.speakerTip) {
      lines.push(`💡 ${slide.speakerTip}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export default function PresentationOutlinePage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState<number>(20);
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/tools/presentation-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          duration,
          audience: audience.trim() || undefined,
          goal: goal || undefined,
          style: style || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutline(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setOutline(null);
    setErrorMsg("");
    setCopied(false);
  }

  async function copyAll() {
    if (!outline) return;
    await navigator.clipboard.writeText(buildCopyText(outline));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="🎯 Presentatie Outline" />

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* FORM */}
        {!outline && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Presentatie Outline</h1>
              <p className="text-gray-500 text-sm">Geef je onderwerp en duur op — ontvang een complete slideopbouw. Kost 1 credit.</p>
            </div>

            {/* Onderwerp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Onderwerp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Bijv. Introductie van onze nieuwe strategie"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Duur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duur <span className="text-red-500">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value={10}>10 minuten</option>
                <option value={15}>15 minuten</option>
                <option value={20}>20 minuten</option>
                <option value={30}>30 minuten</option>
                <option value={45}>45 minuten</option>
                <option value={60}>60 minuten</option>
              </select>
            </div>

            {/* Doelgroep */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doelgroep <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Bijv. management, klanten, studenten"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Doel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doel <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">— Selecteer doel —</option>
                <option value="Informeren">Informeren</option>
                <option value="Overtuigen">Overtuigen</option>
                <option value="Inspireren">Inspireren</option>
                <option value="Trainen">Trainen</option>
              </select>
            </div>

            {/* Stijl */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stijl <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">— Selecteer stijl —</option>
                <option value="Formeel">Formeel</option>
                <option value="Informeel">Informeel</option>
              </select>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
            )}

            <button
              onClick={generate}
              disabled={!topic.trim() || loading}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Outline wordt gegenereerd...
                </>
              ) : (
                "Outline genereren →"
              )}
            </button>
          </div>
        )}

        {/* RESULT */}
        {outline && (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{outline.title}</h1>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={copyAll}
                    className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    style={{ color: copied ? "#059669" : "#374151" }}
                  >
                    {copied ? "✓ Gekopieerd!" : "Kopiëren"}
                  </button>
                  <button
                    onClick={reset}
                    className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Opnieuw
                  </button>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">
                {outline.totalSlides} slides · {outline.estimatedMinutes} minuten
              </span>
            </div>

            {/* Slide cards */}
            <div className="flex flex-col gap-3">
              {outline.slides.map((slide) => {
                const typeColor = TYPE_COLORS[slide.type] ?? TYPE_COLORS.inhoud;
                return (
                  <div key={slide.number} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: typeColor.bg, color: typeColor.text }}
                      >
                        {slide.number}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-md"
                        style={{ background: typeColor.bg + "20", color: typeColor.bg }}
                      >
                        {typeColor.label}
                      </span>
                    </div>

                    <h2 className="font-bold text-gray-900 text-base leading-snug">{slide.title}</h2>

                    {slide.bullets.length > 0 && (
                      <ul className="flex flex-col gap-1">
                        {slide.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-0.5 flex-shrink-0 text-gray-400">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {slide.speakerTip && (
                      <div className="rounded-xl px-4 py-3" style={{ background: "#FFFBEB" }}>
                        <p className="text-sm text-amber-800 italic">
                          <span className="not-italic">💡</span> {slide.speakerTip}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3 pb-4">
              <button
                onClick={copyAll}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                style={{ color: copied ? "#059669" : "#374151" }}
              >
                {copied ? "✓ Gekopieerd!" : "📋 Kopieer als tekst"}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700"
              >
                Opnieuw
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
