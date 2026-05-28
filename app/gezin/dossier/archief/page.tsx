"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Document {
  id: string;
  bestandsnaam: string;
  type: string | null;
  afzender: string | null;
  datum: string | null;
  onderwerp: string | null;
  mappad: string | null;
  gezinslid: string | null;
  samenvatting: string | null;
  file_url: string | null;
  storage: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  brief: "✉️",
  factuur: "🧾",
  polisblad: "🛡️",
  bankafschrift: "🏦",
  contract: "📝",
  garantiebewijs: "✅",
  medisch: "🏥",
  overig: "📄",
};

const TYPE_LABELS: Record<string, string> = {
  brief: "Brief",
  factuur: "Factuur",
  polisblad: "Polis",
  bankafschrift: "Bankafschrift",
  contract: "Contract",
  garantiebewijs: "Garantie",
  medisch: "Medisch",
  overig: "Overig",
};

const STORAGE_ICONS: Record<string, string> = {
  onedrive: "☁️",
  dropbox: "📦",
  local: "💻",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ArchiefPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterGezinslid, setFilterGezinslid] = useState("");
  const [filterType, setFilterType] = useState("");
  const [gezinsleden, setGezinsleden] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterGezinslid) params.set("gezinslid", filterGezinslid);
      if (filterType) params.set("type", filterType);
      const res = await fetch(`/api/tools/mijn-dossier/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [query, filterGezinslid, filterType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Haal gezinsleden op voor filter
  useEffect(() => {
    fetch("/api/tools/mijn-dossier/onedrive/family")
      .then((r) => r.json())
      .then((data: { familyMembers: { id: string; name: string }[] }) => {
        setGezinsleden((data.familyMembers ?? []).map((m) => m.name));
      })
      .catch(() => {});
  }, []);

  async function deleteDocument(id: string) {
    if (!confirm("Dit document verwijderen uit het archief?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/tools/mijn-dossier/documents?id=${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const uniqueTypes = Array.from(new Set(documents.map((d) => d.type).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-amber-700 text-lg">📬 NooitMeerPostKwijt</Link>
          <Link href="/dossier" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            ← Dossier
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Archief</h1>
          <p className="text-sm text-gray-500">Alle gescande en opgeslagen documenten.</p>
        </div>

        {/* Zoekbalk */}
        <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-4 flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op afzender, onderwerp of omschrijving..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {gezinsleden.length > 0 && (
              <select
                value={filterGezinslid}
                onChange={(e) => setFilterGezinslid(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">Alle gezinsleden</option>
                {gezinsleden.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
            {uniqueTypes.length > 0 && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">Alle types</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            )}
            {(query || filterGezinslid || filterType) && (
              <button
                onClick={() => { setQuery(""); setFilterGezinslid(""); setFilterType(""); }}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium px-3 py-2 rounded-xl border border-amber-200 transition-colors"
              >
                Wis filters
              </button>
            )}
          </div>
        </div>

        {/* Resultaten */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Laden…
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🗂</p>
            {query || filterGezinslid || filterType ? (
              <>
                <p className="text-gray-600 font-medium mb-1">Geen documenten gevonden</p>
                <p className="text-sm text-gray-400">Probeer een andere zoekterm of verwijder de filters.</p>
              </>
            ) : (
              <>
                <p className="text-gray-600 font-medium mb-1">Nog geen documenten in het archief</p>
                <p className="text-sm text-gray-400 mb-4">Scan een brief om te beginnen.</p>
                <Link href="/dossier"
                  className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
                  Eerste scan maken →
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{documents.length} document{documents.length !== 1 ? "en" : ""} gevonden</p>
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white border border-amber-100 rounded-2xl p-4 flex items-start gap-3 group">
                  {/* Type icon */}
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[doc.type ?? ""] ?? "📄"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
                          {doc.afzender ?? doc.bestandsnaam}
                        </p>
                        {doc.onderwerp && (
                          <p className="text-xs text-gray-500 truncate">{doc.onderwerp}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {formatDate(doc.datum ?? doc.created_at)}
                      </p>
                    </div>

                    {doc.samenvatting && (
                      <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">{doc.samenvatting}</p>
                    )}

                    {/* Badges + acties */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {doc.type && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {TYPE_LABELS[doc.type] ?? doc.type}
                        </span>
                      )}
                      {doc.gezinslid && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          👤 {doc.gezinslid}
                        </span>
                      )}
                      {doc.mappad && (
                        <span className="text-xs text-gray-400 truncate max-w-[140px]">
                          📁 {doc.mappad}
                        </span>
                      )}
                      {doc.storage && doc.storage !== "local" && (
                        <span className="text-xs text-gray-400">
                          {STORAGE_ICONS[doc.storage] ?? "☁️"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acties */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors whitespace-nowrap"
                      >
                        Openen →
                      </a>
                    )}
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Verwijder"
                    >
                      {deletingId === doc.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
