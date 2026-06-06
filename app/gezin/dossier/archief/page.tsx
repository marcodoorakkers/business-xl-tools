"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DossierNav from "../components/DossierNav";

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

interface TreeNode {
  name: string;
  path: string;
  children: Record<string, TreeNode>;
  documents: Document[];
  totalCount: number;
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

function buildTree(documents: Document[]): TreeNode {
  const root: TreeNode = { name: "root", path: "", children: {}, documents: [], totalCount: 0 };
  for (const doc of documents) {
    root.totalCount++;
    if (!doc.mappad) {
      root.documents.push(doc);
      continue;
    }
    const parts = doc.mappad.split("/").filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const nodePath = parts.slice(0, i + 1).join("/");
      if (!current.children[part]) {
        current.children[part] = { name: part, path: nodePath, children: {}, documents: [], totalCount: 0 };
      }
      current.children[part].totalCount++;
      current = current.children[part];
    }
    current.documents.push(doc);
  }
  return root;
}

function getNodeAtPath(tree: TreeNode, path: string[]): TreeNode | null {
  if (path[0] === "__overig__") {
    return { name: "Overig", path: "__overig__", children: {}, documents: tree.documents, totalCount: tree.documents.length };
  }
  let current = tree;
  for (const segment of path) {
    if (!current.children[segment]) return null;
    current = current.children[segment];
  }
  return current;
}

function ArchiefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lijst view state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [filterGezinslid, setFilterGezinslid] = useState(() => searchParams.get("gezinslid") ?? "");
  const [filterType, setFilterType] = useState(() => searchParams.get("type") ?? "");
  const [gezinsleden, setGezinsleden] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Mappen view state
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [autoMappingLoading, setAutoMappingLoading] = useState(false);
  const [autoMappingDone, setAutoMappingDone] = useState<number | null>(null);
  const treeLoadingRef = useRef(false);

  const updateUrl = useCallback((q: string, gezinslid: string, type: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (gezinslid) params.set("gezinslid", gezinslid);
    if (type) params.set("type", type);
    const qs = params.toString();
    router.replace(qs ? `/dossier/archief?${qs}` : "/dossier/archief", { scroll: false });
  }, [router]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    setOffset(0);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterGezinslid) params.set("gezinslid", filterGezinslid);
      if (filterType) params.set("type", filterType);
      const res = await fetch(`/api/tools/mijn-dossier/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents ?? []);
      setHasMore(data.hasMore ?? false);
    } catch {
      setDocuments([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [query, filterGezinslid, filterType]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const newOffset = offset + 20;
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterGezinslid) params.set("gezinslid", filterGezinslid);
      if (filterType) params.set("type", filterType);
      params.set("offset", String(newOffset));
      const res = await fetch(`/api/tools/mijn-dossier/documents?${params}`);
      const data = await res.json();
      setDocuments(prev => [...prev, ...(data.documents ?? [])]);
      setHasMore(data.hasMore ?? false);
      setOffset(newOffset);
    } catch { /* stil falen */ }
    finally { setLoadingMore(false); }
  }, [query, filterGezinslid, filterType, offset]);

  const loadTree = useCallback(async () => {
    if (treeLoadingRef.current) return;
    treeLoadingRef.current = true;
    setTreeLoading(true);
    try {
      const res = await fetch("/api/tools/mijn-dossier/documents?all=1");
      const data = await res.json();
      setTreeData(buildTree(data.documents ?? []));
    } catch { /* stil */ }
    finally {
      setTreeLoading(false);
      treeLoadingRef.current = false;
    }
  }, []);

  const autoMappad = useCallback(async () => {
    setAutoMappingLoading(true);
    setAutoMappingDone(null);
    try {
      const res = await fetch("/api/tools/mijn-dossier/auto-mappad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (data.updated > 0) {
        setAutoMappingDone(data.updated);
        setTreeData(null);
        setDrillPath([]);
      }
    } catch { /* stil */ }
    finally { setAutoMappingLoading(false); }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (viewMode === "tree" && !treeData) loadTree();
  }, [viewMode, treeData, loadTree]);

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
      setTreeData(null);
      setDrillPath([]);
    } finally {
      setDeletingId(null);
    }
  }

  const uniqueTypes = Array.from(new Set(documents.map((d) => d.type).filter(Boolean))) as string[];

  // Huidige node in de drilldown
  const currentNode = treeData ? getNodeAtPath(treeData, drillPath) : null;
  const isRoot = drillPath.length === 0;
  const parentLabel = drillPath.length === 1 ? "Mappen" : drillPath[drillPath.length - 2];

  return (
    <div className="min-h-screen bg-white">
      <DossierNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Documenten</h1>
            <p className="text-sm text-gray-500">Alle gescande en opgeslagen documenten.</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0 mt-1">
            <button
              onClick={() => setViewMode("list")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Lijst
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === "tree" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mappen
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            {/* Zoekbalk */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); updateUrl(e.target.value, filterGezinslid, filterType); }}
                  placeholder="Zoek op afzender, onderwerp of omschrijving..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterGezinslid}
                  onChange={(e) => { setFilterGezinslid(e.target.value); updateUrl(query, e.target.value, filterType); }}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">Alle geadresseerden</option>
                  {gezinsleden.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {uniqueTypes.length > 0 && (
                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); updateUrl(query, filterGezinslid, e.target.value); }}
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
                    onClick={() => { setQuery(""); setFilterGezinslid(""); setFilterType(""); setHasSearched(false); setDocuments([]); updateUrl("", "", ""); }}
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
                Zoeken…
              </div>
            ) : documents.length === 0 && hasSearched ? (
              <div className="text-center py-16">
                <p className="text-gray-600 font-medium mb-1">Geen documenten gevonden</p>
                <p className="text-sm text-gray-400">Probeer een andere zoekterm of verwijder de filters.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{documents.length} document{documents.length !== 1 ? "en" : ""} gevonden</p>
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 group">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                        {TYPE_ICONS[doc.type ?? ""] ?? "📄"}
                      </div>
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

                {hasMore && (
                  <div className="text-center mt-6">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? "Laden…" : "Meer laden"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Mappen view — drilldown navigatie */
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {treeLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Mappen laden…
              </div>
            ) : !treeData || treeData.totalCount === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 font-medium mb-1">Nog geen documenten</p>
                <p className="text-sm text-gray-400">Scan een document om het hier te zien.</p>
              </div>
            ) : (
              <>
                {/* Terug-navigatie */}
                {!isRoot && (
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setDrillPath((p) => p.slice(0, -1))}
                      className="flex items-center gap-2 w-full px-4 py-3.5 text-sm font-medium text-amber-700 hover:bg-amber-50 active:bg-amber-100 transition-colors text-left"
                    >
                      <span className="text-base">‹</span>
                      <span>{parentLabel}</span>
                    </button>
                    {drillPath.length > 1 && (
                      <p className="text-xs text-gray-400 px-4 pb-2.5 -mt-1 truncate">
                        {drillPath.join(" › ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Submappen */}
                {currentNode && Object.keys(currentNode.children).length > 0 && (
                  <div>
                    {Object.values(currentNode.children)
                      .sort((a, b) => a.name.localeCompare(b.name, "nl"))
                      .map((child) => (
                        <button
                          key={child.path}
                          onClick={() => setDrillPath((p) => [...p, child.name])}
                          className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 text-left"
                        >
                          <span className="text-xl flex-shrink-0">📁</span>
                          <span className="flex-1 font-medium text-sm text-gray-800 truncate">{child.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">{child.totalCount}</span>
                          <span className="text-gray-300 flex-shrink-0 ml-1">›</span>
                        </button>
                      ))}
                  </div>
                )}

                {/* Documenten op huidig niveau */}
                {currentNode && currentNode.documents.length > 0 && (
                  <div>
                    {currentNode.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 group"
                      >
                        <span className="text-xl flex-shrink-0">{TYPE_ICONS[doc.type ?? ""] ?? "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {doc.afzender ?? doc.bestandsnaam}
                          </p>
                          {doc.datum && (
                            <p className="text-xs text-gray-400">{formatDate(doc.datum)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {doc.file_url && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-amber-600 hover:text-amber-800 font-medium whitespace-nowrap"
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
                )}

                {/* Auto-mappad banner + Overig (alleen op rootniveau) */}
                {isRoot && treeData.documents.length > 0 && (
                  <div className="p-3 border-t border-gray-50">
                    {autoMappingDone !== null && (
                      <p className="text-xs text-green-600 font-medium mb-2 px-1">
                        ✓ {autoMappingDone} {autoMappingDone === 1 ? "document" : "documenten"} ingedeeld
                      </p>
                    )}
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-1">
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">{treeData.documents.length}</span>{" "}
                        {treeData.documents.length === 1 ? "document" : "documenten"} zonder map
                      </p>
                      <button
                        onClick={autoMappad}
                        disabled={autoMappingLoading}
                        className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {autoMappingLoading && (
                          <span className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                        )}
                        {autoMappingLoading ? "Bezig…" : "Automatisch indelen →"}
                      </button>
                    </div>
                    <button
                      onClick={() => setDrillPath(["__overig__"])}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl text-left"
                    >
                      <span className="text-xl flex-shrink-0">📂</span>
                      <span className="flex-1 font-medium text-sm text-gray-500">Overig</span>
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">{treeData.documents.length}</span>
                      <span className="text-gray-300 flex-shrink-0 ml-1">›</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ArchiefPage() {
  return (
    <Suspense fallback={null}>
      <ArchiefContent />
    </Suspense>
  );
}
