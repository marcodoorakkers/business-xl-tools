"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";

type Style = "zakelijk" | "minimaal" | "modern";

const STYLES: { id: Style; label: string; description: string; preview: string }[] = [
  {
    id: "zakelijk",
    label: "Zakelijk",
    description: "Professioneel blauw, geschikt voor rapporten en offertes",
    preview: "🔵",
  },
  {
    id: "minimaal",
    label: "Minimaal",
    description: "Zwart-wit, clean — ideaal voor juridische of academische teksten",
    preview: "⚫",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Groen accent, fris en eigentijds",
    preview: "🟢",
  },
];

export default function WordFormatterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [style, setStyle] = useState<Style>("zakelijk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".docx")) {
      setError("Alleen .docx bestanden worden ondersteund.");
      return;
    }
    setFile(f);
    setError("");
    setDone(false);
  }

  function handleTemplatePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".docx")) {
      setError("De bedrijfstemplate moet ook een .docx bestand zijn.");
      return;
    }
    setTemplate(f);
    setError("");
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("style", style);
      if (template) formData.append("template", template);

      const res = await fetch("/api/tools/word-formatter", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = "Er is een fout opgetreden.";
        try { msg = JSON.parse(text).error ?? msg; } catch { /* ignore */ }
        throw new Error(msg);
      }

      // Download the returned DOCX
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? "document_opgemaakt.docx";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setTemplate(null);
    setError("");
    setDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (templateInputRef.current) templateInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-blue-500 text-sm">
          &larr; Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-sm text-gray-900">✨ Document Opmaken</span>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">

          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Document Opmaken</h1>
            <p className="text-sm text-gray-500">
              Upload een Word-document en ontvang een professioneel opgemaakt versie
              met inhoudsopgave, koppen en paginanummers. Kost 2 credits.
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word-document (.docx)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={handleFilePick}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-10 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center gap-2 ${
                file
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500"
              }`}
            >
              <span className="text-3xl">{file ? "📄" : "📂"}</span>
              <span className="text-sm font-medium">
                {file ? file.name : "Klik om een .docx bestand te kiezen"}
              </span>
              {file && (
                <span className="text-xs text-blue-500">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              )}
            </button>
          </div>

          {/* Template upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrijfstemplate <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Upload een bestaand Word-document met jullie huisstijl. De kleuren en lettertypen worden automatisch overgenomen.
            </p>
            <input
              ref={templateInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={handleTemplatePick}
            />
            <button
              onClick={() => templateInputRef.current?.click()}
              className={`w-full py-3 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center gap-2 text-sm ${
                template
                  ? "border-teal-400 bg-teal-50 text-teal-700"
                  : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
              }`}
            >
              {template ? (
                <>
                  <span>✅</span>
                  <span className="font-medium">{template.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTemplate(null); if (templateInputRef.current) templateInputRef.current.value = ""; }}
                    className="ml-1 text-teal-500 hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <span>🏢</span>
                  <span>Klik om een bedrijfstemplate te uploaden</span>
                </>
              )}
            </button>
          </div>

          {/* Style picker — only shown when no template */}
          {!template && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opmaakstijl
              </label>
              <div className="grid grid-cols-3 gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      style === s.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl mb-1">{s.preview}</div>
                    <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {template && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700">
              🎨 Kleuren en lettertypen worden overgenomen uit de bedrijfstemplate.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Document opgemaakt en gedownload! Open het in Word en klik op de inhoudsopgave om deze bij te werken.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Bezig met opmaken...
                </span>
              ) : (
                "✨ Document opmaken"
              )}
            </button>
            {(file || done) && (
              <button
                onClick={reset}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Nieuw
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Na het downloaden: open in Word en klik met rechts op de inhoudsopgave &rarr; &ldquo;Veld bijwerken&rdquo; voor de paginanummers.
          </p>
        </div>
      </main>
    </div>
  );
}
