"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type DemoResult = {
  type: string;
  afzender: string;
  datum: string | null;
  onderwerp: string;
  samenvatting: string;
  actie: string | null;
  actie_deadline: string | null;
  mappad: string;
};

const TYPE_LABELS: Record<string, string> = {
  brief: "Brief",
  factuur: "Factuur",
  polisblad: "Polisblad",
  bankafschrift: "Bankafschrift",
  contract: "Contract",
  garantiebewijs: "Garantiebewijs",
  medisch: "Medisch",
  overig: "Overig",
};

export default function DemoSection() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/demo/scan", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analyse mislukt");
      setResult(data as DemoResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse mislukt");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-2xl mx-auto py-16 border-t border-gray-100">
      <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Probeer het zelf</p>
      <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">Upload een document en zie het live</h2>
      <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
        Geen account nodig. Upload een PDF of foto van een brief, factuur of aanslag — en zie binnen 10 seconden wat NooitMeerPostKwijt ervan maakt.
      </p>

      {/* Upload + button */}
      {!result && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !loading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              loading ? "opacity-50 cursor-default" : "cursor-pointer"
            } ${dragging ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-gray-50"}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <p className="text-3xl mb-3">📄</p>
            {file ? (
              <>
                <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">Klik om een ander bestand te kiezen</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-700 text-sm">Sleep een document hiernaartoe</p>
                <p className="text-xs text-gray-400 mt-1">of klik om te kiezen · PDF of foto · max 5 MB</p>
              </>
            )}
          </div>

          {file && !loading && (
            <button
              onClick={analyze}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Analyseer dit document →
            </button>
          )}

          {loading && (
            <div className="mt-6 text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-amber-600 font-medium text-sm">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyseren…
              </div>
              <p className="text-xs text-gray-400">Afzender herkennen · Type bepalen · Acties detecteren</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-300 text-center mt-4">
            Je bestand wordt alleen gebruikt voor deze analyse en daarna direct verwijderd.
          </p>
        </>
      )}

      {/* Resultaat */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                📁 {result.mappad}
              </span>
              {result.actie ? (
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                  ⚠️ Actie vereist
                </span>
              ) : (
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  ✓ Geen actie nodig
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex gap-3">
                <span className="text-gray-400 w-20 flex-shrink-0">Afzender</span>
                <span className="font-semibold text-gray-900">{result.afzender}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-400 w-20 flex-shrink-0">Type</span>
                <span className="text-gray-700">{TYPE_LABELS[result.type] ?? result.type}</span>
              </div>
              {result.datum && (
                <div className="flex gap-3">
                  <span className="text-gray-400 w-20 flex-shrink-0">Datum</span>
                  <span className="text-gray-700">{result.datum}</span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="text-gray-400 w-20 flex-shrink-0">Inhoud</span>
                <span className="text-gray-700 leading-relaxed">{result.samenvatting}</span>
              </div>
              {result.actie && (
                <div className="flex gap-3 pt-2.5 border-t border-gray-100 mt-2">
                  <span className="text-gray-400 w-20 flex-shrink-0 pt-0.5">Actie</span>
                  <div>
                    <p className="text-gray-900 font-medium">{result.actie}</p>
                    {result.actie_deadline && (
                      <p className="text-orange-600 text-xs mt-1 font-semibold">
                        Deadline: {result.actie_deadline}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-gray-800 mb-1">Dit werkt voor al je documenten</p>
            <p className="text-xs text-gray-500 mb-4">
              Automatisch gearchiveerd in jouw OneDrive of Dropbox. Eerste maand gratis.
            </p>
            <Link
              href="/aanmelden"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              Gratis beginnen →
            </Link>
          </div>

          <button
            onClick={reset}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Ander document proberen
          </button>
        </div>
      )}
    </div>
  );
}
