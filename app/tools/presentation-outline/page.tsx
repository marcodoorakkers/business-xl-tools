"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import ToolNav from "@/components/ToolNav";
import pptxgen from "pptxgenjs";

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

  async function downloadPptx() {
    if (!outline) return;
    const prs = new pptxgen();
    prs.layout = "LAYOUT_WIDE";

    const C = {
      navy:    "0F172A", blue:   "2563EB", indigo: "4F46E5",
      white:   "FFFFFF", green:  "065F46", dark:   "111827",
      lgray:   "E5E7EB", lblue:  "DBEAFE", lgreen: "A7F3D0",
      lpurp:   "C7D2FE", dindigo:"1E1B4B", dkblue: "1E3A8A",
      mblue:   "3B82F6", lnavy:  "1E293B",
    };

    const noLine = { color: "FFFFFF", size: 0 };

    for (const slide of outline.slides) {
      const s = prs.addSlide();

      /* ── TITEL ── */
      if (slide.type === "titel") {
        s.background = { color: C.navy };
        // Large decorative circle top-right (dark blue, subtle)
        s.addShape(prs.ShapeType.ellipse, {
          x: 9.5, y: -2.0, w: 6.0, h: 6.0,
          fill: { color: C.dkblue }, line: noLine,
        });
        // Smaller circle bottom-left
        s.addShape(prs.ShapeType.ellipse, {
          x: -1.8, y: 5.0, w: 4.0, h: 4.0,
          fill: { color: C.lnavy }, line: noLine,
        });
        // Accent line
        s.addShape(prs.ShapeType.rect, {
          x: 0.8, y: 2.85, w: 1.6, h: 0.07,
          fill: { color: C.blue }, line: noLine,
        });
        // Title
        s.addText(slide.title, {
          x: 0.8, y: 3.0, w: 10.5, h: 2.1,
          fontSize: 44, bold: true, color: C.white,
          fontFace: "Calibri Light", valign: "top",
        });
        // Subtitle
        if (slide.bullets.length > 0) {
          s.addText(slide.bullets[0], {
            x: 0.8, y: 5.2, w: 10.5, h: 0.85,
            fontSize: 20, color: C.lblue, fontFace: "Calibri",
          });
        }
        // Bottom bar
        s.addShape(prs.ShapeType.rect, {
          x: 0, y: 7.1, w: 13.33, h: 0.4,
          fill: { color: C.blue }, line: noLine,
        });
        s.addText(outline.title, {
          x: 7.0, y: 7.12, w: 6.0, h: 0.36,
          fontSize: 10, color: C.white, align: "right",
          fontFace: "Calibri", valign: "middle",
        });

      /* ── AGENDA ── */
      } else if (slide.type === "agenda") {
        s.background = { color: C.white };
        // Dark sidebar
        s.addShape(prs.ShapeType.rect, {
          x: 0, y: 0, w: 4.3, h: 7.5,
          fill: { color: C.navy }, line: noLine,
        });
        // Blue accent strip
        s.addShape(prs.ShapeType.rect, {
          x: 4.1, y: 0, w: 0.18, h: 7.5,
          fill: { color: C.blue }, line: noLine,
        });
        s.addText("AGENDA", {
          x: 0.35, y: 0.55, w: 3.7, h: 0.55,
          fontSize: 13, bold: true, color: C.blue,
          fontFace: "Calibri", charSpacing: 5,
        });
        s.addText(slide.title, {
          x: 0.35, y: 1.15, w: 3.7, h: 1.8,
          fontSize: 22, bold: true, color: C.white,
          fontFace: "Calibri Light",
        });
        // Numbered items
        slide.bullets.forEach((bullet, i) => {
          const yPos = 1.35 + i * 0.88;
          s.addShape(prs.ShapeType.ellipse, {
            x: 4.75, y: yPos, w: 0.46, h: 0.46,
            fill: { color: C.blue }, line: noLine,
          });
          s.addText(`${i + 1}`, {
            x: 4.75, y: yPos, w: 0.46, h: 0.46,
            fontSize: 12, bold: true, color: C.white,
            align: "center", valign: "middle", fontFace: "Calibri",
          });
          s.addText(bullet, {
            x: 5.38, y: yPos + 0.02, w: 7.6, h: 0.44,
            fontSize: 16, color: C.dark, fontFace: "Calibri", valign: "middle",
          });
          if (i < slide.bullets.length - 1) {
            s.addShape(prs.ShapeType.rect, {
              x: 4.75, y: yPos + 0.52, w: 8.2, h: 0.02,
              fill: { color: C.lgray }, line: noLine,
            });
          }
        });

      /* ── INHOUD ── */
      } else if (slide.type === "inhoud") {
        s.background = { color: C.white };
        // Top accent bar
        s.addShape(prs.ShapeType.rect, {
          x: 0, y: 0, w: 13.33, h: 0.1,
          fill: { color: C.blue }, line: noLine,
        });
        // Slide number circle
        s.addShape(prs.ShapeType.ellipse, {
          x: 0.42, y: 0.25, w: 0.5, h: 0.5,
          fill: { color: C.blue }, line: noLine,
        });
        s.addText(`${slide.number}`, {
          x: 0.42, y: 0.25, w: 0.5, h: 0.5,
          fontSize: 11, bold: true, color: C.white,
          align: "center", valign: "middle", fontFace: "Calibri",
        });
        // Title
        s.addText(slide.title, {
          x: 1.1, y: 0.22, w: 11.8, h: 0.72,
          fontSize: 26, bold: true, color: C.dark,
          fontFace: "Calibri Light",
        });
        // Divider
        s.addShape(prs.ShapeType.rect, {
          x: 0.42, y: 1.06, w: 12.5, h: 0.03,
          fill: { color: C.lgray }, line: noLine,
        });
        // Bullets with blue square markers
        slide.bullets.forEach((bullet, i) => {
          const yPos = 1.25 + i * 0.78;
          s.addShape(prs.ShapeType.rect, {
            x: 0.52, y: yPos + 0.16, w: 0.13, h: 0.13,
            fill: { color: C.blue }, line: noLine,
          });
          s.addText(bullet, {
            x: 0.82, y: yPos, w: 12.1, h: 0.68,
            fontSize: 17, color: C.dark, fontFace: "Calibri", valign: "middle",
          });
        });
        // Decorative corner circle
        s.addShape(prs.ShapeType.ellipse, {
          x: 11.9, y: 6.2, w: 1.8, h: 1.8,
          fill: { color: C.lblue }, line: noLine,
        });

      /* ── AFSLUITING ── */
      } else if (slide.type === "afsluiting") {
        s.background = { color: C.green };
        // Decorative circle top-right
        s.addShape(prs.ShapeType.ellipse, {
          x: 10.0, y: -1.3, w: 4.5, h: 4.5,
          fill: { color: "0D7A5A" }, line: noLine,
        });
        // Checkmark circle
        s.addShape(prs.ShapeType.ellipse, {
          x: 5.42, y: 0.9, w: 2.5, h: 2.5,
          fill: { color: "D1FAE5" }, line: noLine,
        });
        s.addText("✓", {
          x: 5.42, y: 0.9, w: 2.5, h: 2.5,
          fontSize: 52, bold: true, color: C.green,
          align: "center", valign: "middle", fontFace: "Calibri",
        });
        s.addText(slide.title, {
          x: 0.8, y: 3.65, w: 11.7, h: 1.35,
          fontSize: 38, bold: true, color: C.white,
          align: "center", fontFace: "Calibri Light",
        });
        if (slide.bullets.length > 0) {
          s.addText(slide.bullets.join("  ·  "), {
            x: 0.8, y: 5.15, w: 11.7, h: 0.75,
            fontSize: 16, color: C.lgreen,
            align: "center", fontFace: "Calibri",
          });
        }

      /* ── VRAGEN ── */
      } else if (slide.type === "vragen") {
        s.background = { color: C.dindigo };
        // Giant "?"
        s.addText("?", {
          x: 7.0, y: -0.8, w: 6.0, h: 8.5,
          fontSize: 280, bold: true, color: C.indigo,
          align: "left", fontFace: "Calibri",
        });
        s.addText(slide.title, {
          x: 0.8, y: 2.0, w: 7.8, h: 2.2,
          fontSize: 54, bold: true, color: C.white,
          fontFace: "Calibri Light",
        });
        if (slide.bullets.length > 0) {
          s.addText(slide.bullets[0], {
            x: 0.8, y: 4.4, w: 7.8, h: 0.85,
            fontSize: 20, color: C.lpurp, fontFace: "Calibri",
          });
        }
        s.addShape(prs.ShapeType.rect, {
          x: 0, y: 7.1, w: 13.33, h: 0.4,
          fill: { color: C.blue }, line: noLine,
        });

      /* ── FALLBACK ── */
      } else {
        s.background = { color: C.white };
        s.addShape(prs.ShapeType.rect, {
          x: 0, y: 0, w: 13.33, h: 0.1,
          fill: { color: C.blue }, line: noLine,
        });
        s.addText(slide.title, {
          x: 0.6, y: 0.3, w: 12.1, h: 0.9,
          fontSize: 26, bold: true, color: C.dark, fontFace: "Calibri Light",
        });
        if (slide.bullets.length > 0) {
          s.addText(
            slide.bullets.map((b) => ({ text: b, options: { bullet: { type: "bullet" } } })),
            { x: 0.6, y: 1.4, w: 12.1, h: 5.5, fontSize: 17, color: C.dark, fontFace: "Calibri" }
          );
        }
      }

      if (slide.speakerTip) s.addNotes(slide.speakerTip);
    }

    await prs.writeFile({ fileName: `${outline.title.replace(/[^a-z0-9 ]/gi, "").trim().replace(/\s+/g, "_")}.pptx` });
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
            <div className="flex gap-3 pb-4 flex-wrap">
              <button
                onClick={downloadPptx}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors text-white"
                style={{ background: "#7C3AED" }}
              >
                ⬇️ Download PowerPoint
              </button>
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
