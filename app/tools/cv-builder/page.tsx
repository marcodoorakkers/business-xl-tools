"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";

type Step = "setup" | "generating" | "result" | "error";
type Lang = "nl" | "en";
type Style = "compact" | "full" | "targeted";

interface CV {
  name: string;
  title: string;
  contact: { email?: string; phone?: string; location?: string; linkedin?: string };
  summary: string;
  experience: { title: string; company: string; period: string; description: string[] }[];
  education: { degree: string; institution: string; period: string }[];
  skills: string[];
  languages: string[];
  certifications?: string[];
}

export default function CVBuilderPage() {
  const [step, setStep] = useState<Step>("setup");
  const [lang, setLang] = useState<Lang>("nl");
  const [style, setStyle] = useState<Style>("full");
  const [profileText, setProfileText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cv, setCv] = useState<CV | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  async function handlePdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfName(file.name);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/tools/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProfileText(data.text);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "PDF verwerken mislukt");
      setPdfName("");
    } finally {
      setPdfLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  async function generate() {
    if (!profileText.trim()) return;
    setErrorMsg("");
    setStep("generating");
    try {
      const res = await fetch("/api/tools/cv-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText, lang, style, jobDescription }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCv(data);
      setStep("result");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  async function exportToDocx() {
    if (!cv) return;
    const { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } = await import("docx");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    // Name & title
    children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 36 })], spacing: { after: 60 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "2563EB" })], spacing: { after: 100 } }));

    // Contact
    const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone, cv.contact.linkedin].filter(Boolean);
    if (contactParts.length > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join(" · "), size: 18, color: "6B7280" })], spacing: { after: 200 } }));
    }

    // Summary
    children.push(new Paragraph({ text: lang === "nl" ? "Profiel" : "Profile", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    children.push(new Paragraph({ text: cv.summary, spacing: { after: 200 } }));

    // Experience
    if (cv.experience.length > 0) {
      children.push(new Paragraph({ text: lang === "nl" ? "Werkervaring" : "Experience", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
      for (const exp of cv.experience) {
        children.push(new Paragraph({ children: [new TextRun({ text: exp.title, bold: true }), new TextRun({ text: ` · ${exp.company}` }), new TextRun({ text: `  ${exp.period}`, color: "6B7280", size: 18 })], spacing: { before: 120 } }));
        for (const bullet of exp.description) {
          children.push(new Paragraph({ text: bullet, bullet: { level: 0 }, spacing: { after: 40 } }));
        }
      }
    }

    // Education
    if (cv.education.length > 0) {
      children.push(new Paragraph({ text: lang === "nl" ? "Opleiding" : "Education", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
      for (const edu of cv.education) {
        children.push(new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true }), new TextRun({ text: ` · ${edu.institution}` }), new TextRun({ text: `  ${edu.period}`, color: "6B7280", size: 18 })], spacing: { before: 80, after: 40 } }));
      }
    }

    // Skills
    if (cv.skills.length > 0) {
      children.push(new Paragraph({ text: lang === "nl" ? "Vaardigheden" : "Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
      children.push(new Paragraph({ text: cv.skills.join(" · "), spacing: { after: 100 } }));
    }

    // Languages
    if (cv.languages.length > 0) {
      children.push(new Paragraph({ text: lang === "nl" ? "Talen" : "Languages", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
      children.push(new Paragraph({ text: cv.languages.join(" · "), spacing: { after: 100 } }));
    }

    // Certifications
    if (cv.certifications && cv.certifications.length > 0) {
      children.push(new Paragraph({ text: lang === "nl" ? "Certificaten" : "Certifications", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
      for (const cert of cv.certifications) {
        children.push(new Paragraph({ text: cert, bullet: { level: 0 } }));
      }
    }

    // Suppress unused import warning
    void Table; void TableRow; void TableCell; void WidthType; void BorderStyle;

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CV_${cv.name.replace(/\s+/g, "_")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStep("setup");
    setCv(null);
    setErrorMsg("");
  }

  const styleOptions: { value: Style; label: string; desc: string; icon: string }[] = [
    { value: "compact", label: lang === "nl" ? "Compact" : "Compact", desc: lang === "nl" ? "1 pagina, alleen highlights" : "1 page, highlights only", icon: "⚡" },
    { value: "full", label: lang === "nl" ? "Uitgebreid" : "Full", desc: lang === "nl" ? "2 pagina's, alle ervaring" : "2 pages, all experience", icon: "📄" },
    { value: "targeted", label: lang === "nl" ? "Gericht op vacature" : "Job targeted", desc: lang === "nl" ? "Aangepast op een specifieke functie" : "Tailored to a specific role", icon: "🎯" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">📋 CV Builder</span>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* SETUP */}
        {step === "setup" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">CV Builder</h1>
              <p className="text-gray-500 text-sm">Upload je CV of LinkedIn PDF en ontvang een professioneel CV in Word. Kost 1 credit.</p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taal van het CV</label>
              <div className="flex gap-2">
                {(["nl", "en"] as Lang[]).map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${lang === l ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}>
                    {l === "nl" ? "🇳🇱 Nederlands" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type CV</label>
              <div className="flex flex-col gap-2">
                {styleOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setStyle(opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${style === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Job description (only for targeted) */}
            {style === "targeted" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === "nl" ? "Vacaturetekst" : "Job description"}
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                  placeholder={lang === "nl" ? "Plak hier de vacaturetekst..." : "Paste the job description here..."}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* PDF upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CV of LinkedIn profiel</label>
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
              <button onClick={() => pdfInputRef.current?.click()} disabled={pdfLoading}
                className={`w-full py-3 mb-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors flex items-center justify-center gap-2
                  ${pdfName ? "border-green-400 text-green-600 bg-green-50" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"}
                  ${pdfLoading ? "opacity-60 cursor-wait" : ""}`}>
                {pdfLoading ? (
                  <><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> PDF wordt ingelezen...</>
                ) : pdfName ? (
                  <>✓ {pdfName} — klik om ander bestand te kiezen</>
                ) : (
                  <>📄 Upload PDF <span className="text-gray-400 font-normal">(bestaand CV of LinkedIn → Meer → Profiel opslaan als PDF)</span></>
                )}
              </button>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">of plak tekst</span></div>
              </div>

              <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} rows={6}
                placeholder="Plak je CV of LinkedIn profiel tekst hier..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {errorMsg && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}

            <button onClick={generate} disabled={!profileText.trim() || (style === "targeted" && !jobDescription.trim())}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors">
              {lang === "nl" ? "Genereer CV →" : "Generate CV →"}
            </button>
          </div>
        )}

        {/* GENERATING */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{lang === "nl" ? "CV wordt gegenereerd..." : "Generating your CV..."}</p>
            <p className="text-xs text-gray-400">Dit duurt 10–20 seconden</p>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && cv && (
          <div className="flex flex-col gap-4">
            {/* Header card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">CV gegenereerd</p>
              <h2 className="text-2xl font-bold mb-1">{cv.name}</h2>
              <p className="text-blue-200 text-sm mb-3">{cv.title}</p>
              <div className="flex flex-wrap gap-2 text-xs text-blue-100">
                {cv.contact.location && <span>📍 {cv.contact.location}</span>}
                {cv.contact.email && <span>✉️ {cv.contact.email}</span>}
                {cv.contact.phone && <span>📞 {cv.contact.phone}</span>}
              </div>
            </div>

            {/* CV content */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-5">

              {/* Summary */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Profiel" : "Profile"}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{cv.summary}</p>
              </div>

              {/* Experience */}
              {cv.experience.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{lang === "nl" ? "Werkervaring" : "Experience"}</h3>
                  <div className="flex flex-col gap-4">
                    {cv.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                            <p className="text-sm text-blue-600">{exp.company}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{exp.period}</span>
                        </div>
                        <ul className="mt-2 flex flex-col gap-1">
                          {exp.description.map((d, j) => (
                            <li key={j} className="text-xs text-gray-600 flex gap-2"><span className="text-gray-300 mt-0.5">•</span>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {cv.education.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{lang === "nl" ? "Opleiding" : "Education"}</h3>
                  <div className="flex flex-col gap-2">
                    {cv.education.map((edu, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{edu.degree}</p>
                          <p className="text-xs text-gray-500">{edu.institution}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{edu.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {cv.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Vaardigheden" : "Skills"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cv.skills.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {cv.languages.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Talen" : "Languages"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cv.languages.map((l, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {cv.certifications && cv.certifications.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Certificaten" : "Certifications"}</h3>
                  <ul className="flex flex-col gap-1">
                    {cv.certifications.map((c, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-gray-300">•</span>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={exportToDocx}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-lg shadow-blue-100">
                📥 Download als Word
              </button>
              <button onClick={reset}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                Opnieuw
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
            <p className="text-red-600 font-medium">Er is iets misgegaan</p>
            <p className="text-sm text-gray-500 text-center">{errorMsg}</p>
            <button onClick={reset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm font-medium">
              Probeer opnieuw
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
