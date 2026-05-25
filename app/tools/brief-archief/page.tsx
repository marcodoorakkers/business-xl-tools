"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import ToolNav from "@/components/ToolNav";

type Step = "idle" | "analyzing" | "suggestion" | "saving" | "done" | "error";

interface Analysis {
  type: string;
  afzender: string;
  datum: string | null;
  onderwerp: string;
  mappad: string;
  bestandsnaam: string;
  samenvatting: string;
}

const DOC_ICONS: Record<string, string> = {
  brief: "✉️",
  factuur: "🧾",
  polisblad: "🛡️",
  bankafschrift: "🏦",
  contract: "📜",
  garantiebewijs: "✅",
  medisch: "🏥",
  overig: "📄",
};

const DB_NAME = "brief-archief-db";
const STORE_NAME = "handles";

async function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveArchiveHandle(handle: FileSystemDirectoryHandle) {
  const db = await openHandleDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, "root");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadArchiveHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get("root");
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

type FSHandle = FileSystemDirectoryHandle & {
  queryPermission(opts: { mode: string }): Promise<string>;
  requestPermission(opts: { mode: string }): Promise<string>;
};

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as FSHandle;
  const opts = { mode: "readwrite" };
  if ((await h.queryPermission(opts)) === "granted") return true;
  return (await h.requestPermission(opts)) === "granted";
}

async function saveToArchive(
  handle: FileSystemDirectoryHandle,
  folderPath: string,
  fileName: string,
  fileBlob: Blob,
  ext: string
): Promise<string> {
  const parts = folderPath.split("/").map((p) => p.trim()).filter(Boolean);
  let current = handle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  const fullName = `${fileName}${ext}`;
  const fileHandle = await current.getFileHandle(fullName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(fileBlob);
  await writable.close();
  return `${handle.name}/${parts.join("/")}/${fullName}`;
}

export default function BriefArchiefPage() {
  const [step, setStep] = useState<Step>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mappad, setMappad] = useState("");
  const [bestandsnaam, setBestandsnaam] = useState("");
  const [savedPath, setSavedPath] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [archiveHandle, setArchiveHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [archiveName, setArchiveName] = useState<string | null>(null);
  const [fsApiSupported, setFsApiSupported] = useState(true);
  const [shareApiSupported, setShareApiSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!("showDirectoryPicker" in window) || !(window as any).showDirectoryPicker) {
      setFsApiSupported(false);
      // Check if Web Share API with files is available (iOS Safari)
      if (navigator.canShare?.({ files: [new File([], "test")] })) {
        setShareApiSupported(true);
      }
      return;
    }
    loadArchiveHandle().then((handle) => {
      if (handle) {
        setArchiveHandle(handle);
        setArchiveName(handle.name);
      }
    });
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
    analyze(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function analyze(f: File) {
    setStep("analyzing");
    setErrorMsg("");
    const formData = new FormData();
    formData.append("file", f);
    try {
      const res = await fetch("/api/tools/brief-archief", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setMappad(data.mappad ?? "");
      setBestandsnaam(data.bestandsnaam ?? "");
      setStep("suggestion");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  async function pickArchiveFolder() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" }) as FileSystemDirectoryHandle;
      await saveArchiveHandle(handle);
      setArchiveHandle(handle);
      setArchiveName(handle.name);
      return handle;
    } catch {
      return null;
    }
  }

  async function handleSave() {
    if (!file || !analysis) return;
    setStep("saving");

    if (!fsApiSupported) {
      const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
      const fullName = `${bestandsnaam}${ext}`;
      const shareFile = new File([file], fullName, { type: file.type });

      if (shareApiSupported && navigator.canShare?.({ files: [shareFile] })) {
        try {
          await navigator.share({ files: [shareFile], title: fullName });
          setSavedPath(`${mappad}/${fullName}`);
          setStep("done");
        } catch (err: unknown) {
          // User cancelled share sheet — go back to suggestion
          if (err instanceof Error && err.name !== "AbortError") {
            setErrorMsg(err.message);
            setStep("error");
          } else {
            setStep("suggestion");
          }
        }
      } else {
        // Plain download fallback
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = fullName;
        a.click();
        URL.revokeObjectURL(url);
        setSavedPath(`${mappad}/${fullName} (gedownload)`);
        setStep("done");
      }
      return;
    }

    let handle = archiveHandle;
    if (!handle) {
      handle = await pickArchiveFolder();
      if (!handle) {
        setStep("suggestion");
        return;
      }
    }

    const permitted = await verifyPermission(handle);
    if (!permitted) {
      handle = await pickArchiveFolder();
      if (!handle) {
        setStep("suggestion");
        return;
      }
    }

    try {
      const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
      const path = await saveToArchive(handle, mappad, bestandsnaam, file, ext);
      setSavedPath(path);
      setStep("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Opslaan mislukt");
      setStep("error");
    }
  }

  function reset() {
    setStep("idle");
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setMappad("");
    setBestandsnaam("");
    setSavedPath("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const docIcon = analysis ? (DOC_ICONS[analysis.type?.toLowerCase()] ?? "📄") : "📄";

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="Brief Archief" />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Brief Archief</h1>
          <p className="text-gray-500 text-sm">
            Upload een scan of foto van een brief. AI analyseert het document en plaatst het in de juiste map.
          </p>
        </div>

        {/* Folder info bar */}
        {fsApiSupported && (
          <div className="mb-6 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <span className="text-lg">🗂️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Archiefmap</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {archiveName ?? "Nog niet ingesteld"}
              </p>
            </div>
            <button
              onClick={pickArchiveFolder}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
            >
              {archiveName ? "Wijzigen" : "Instellen"}
            </button>
          </div>
        )}

        {/* STEP: idle */}
        {step === "idle" && (
          <div
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
          >
            <div className="text-5xl mb-4">📬</div>
            <p className="font-semibold text-gray-800 mb-1">Sleep een bestand hierheen</p>
            <p className="text-sm text-gray-500 mb-4">of klik om te bladeren</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP of PDF · max 20 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* STEP: analyzing */}
        {step === "analyzing" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            {preview && (
              <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-xl mb-6 object-contain shadow" />
            )}
            {!preview && (
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📄</div>
            )}
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Document wordt geanalyseerd…
            </div>
          </div>
        )}

        {/* STEP: suggestion */}
        {step === "suggestion" && analysis && (
          <div className="space-y-4">
            {/* Document summary card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                {preview ? (
                  <img src={preview} alt="preview" className="w-16 h-20 object-cover rounded-xl shadow shrink-0" />
                ) : (
                  <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl shrink-0">{docIcon}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{docIcon}</span>
                    <span className="font-bold text-gray-900 capitalize">{analysis.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-gray-400">Van:</span> {analysis.afzender}
                  </p>
                  {analysis.datum && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-gray-400">Datum:</span>{" "}
                      {new Date(analysis.datum).toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2 italic">{analysis.samenvatting}</p>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Opslaan als</h2>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mappad</label>
                <input
                  type="text"
                  value={mappad}
                  onChange={(e) => setMappad(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="bijv. Financiën/Belasting/2024"
                />
                <p className="text-xs text-gray-400 mt-1">Submappen worden automatisch aangemaakt.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bestandsnaam</label>
                <input
                  type="text"
                  value={bestandsnaam}
                  onChange={(e) => setBestandsnaam(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="bijv. 2024-03-15_factuur_belastingdienst"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Extensie ({file?.name.split(".").pop()}) wordt automatisch toegevoegd.
                </p>
              </div>
            </div>

            {!fsApiSupported && !shareApiSupported && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
                Jouw browser ondersteunt direct opslaan niet. Het bestand wordt gedownload — plaats het zelf in de juiste map.
              </div>
            )}

            {shareApiSupported && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-800">
                Tik op <strong>Delen</strong> en kies <strong>Opslaan in Bestanden</strong> om het bestand in de juiste map te plaatsen.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
              >
                {fsApiSupported ? "Opslaan in archief" : shareApiSupported ? "Delen / Opslaan in Bestanden" : "Downloaden"}
              </button>
              <button
                onClick={reset}
                className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* STEP: saving */}
        {step === "saving" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Bestand wordt opgeslagen…
            </div>
          </div>
        )}

        {/* STEP: done */}
        {step === "done" && (
          <div className="bg-white border border-green-200 rounded-3xl p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">Opgeslagen!</h2>
              <p className="text-sm text-gray-500 font-mono bg-gray-50 rounded-xl px-4 py-2 break-all">{savedPath}</p>
            </div>
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-2xl transition-colors"
            >
              Nieuw document archiveren
            </button>
          </div>
        )}

        {/* STEP: error */}
        {step === "error" && (
          <div className="bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">Er is iets misgegaan</h2>
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
            <button
              onClick={reset}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-2xl transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
