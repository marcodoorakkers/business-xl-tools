"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import ToolNav from "@/components/ToolNav";

type Step = "idle" | "staging" | "analyzing" | "suggestion" | "saving" | "done" | "error";
type FolderStatus = "idle" | "loading" | "exists" | "new";
type StorageOption = "local" | "onedrive" | "dropbox";

interface Analysis {
  type: string;
  afzender: string;
  datum: string | null;
  onderwerp: string;
  mappad: string;
  bestandsnaam: string;
  samenvatting: string;
  gezinslid?: string | null;
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

const DB_NAME = "mijn-dossier-db";
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mappad, setMappad] = useState("");
  const [bestandsnaam, setBestandsnaam] = useState("");
  const [gezinslid, setGezinslid] = useState("");
  const [savedPath, setSavedPath] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [archiveHandle, setArchiveHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [archiveName, setArchiveName] = useState<string | null>(null);
  const [fsApiSupported, setFsApiSupported] = useState(true);
  const [shareApiSupported, setShareApiSupported] = useState(false);
  const [oneDriveConnected, setOneDriveConnected] = useState(false);
  const [dropboxConnected, setDropboxConnected] = useState(false);
  const [archiveRoot, setArchiveRoot] = useState("Archief");
  const [dropboxArchiveRoot, setDropboxArchiveRoot] = useState("Archief");
  const [storagePreference, setStoragePreference] = useState<StorageOption>("local");
  const [selectedStorage, setSelectedStorage] = useState<StorageOption>("local");
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [folderStatus, setFolderStatus] = useState<FolderStatus>("idle");
  const [folderCheckPath, setFolderCheckPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const folderCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!("showDirectoryPicker" in window) || !(window as any).showDirectoryPicker) {
      setFsApiSupported(false);
      if (navigator.canShare?.({ files: [new File([], "test")] })) {
        setShareApiSupported(true);
      }
    } else {
      loadArchiveHandle().then((handle) => {
        if (handle) {
          setArchiveHandle(handle);
          setArchiveName(handle.name);
        }
      });
    }

    fetch("/api/tools/mijn-dossier/onedrive/status")
      .then((r) => r.json())
      .then((data: {
        connected: boolean;
        archiveRoot: string;
        familyMembers: string[];
        dropboxConnected: boolean;
        dropboxArchiveRoot: string;
        storagePreference: string;
      }) => {
        setOneDriveConnected(data.connected);
        setDropboxConnected(data.dropboxConnected);
        setArchiveRoot(data.archiveRoot ?? "Archief");
        setDropboxArchiveRoot(data.dropboxArchiveRoot ?? "Archief");
        setFamilyMembers(data.familyMembers ?? []);
        const pref = (data.storagePreference ?? "local") as StorageOption;
        setStoragePreference(pref);
        if (pref === "onedrive" && data.connected) {
          setSelectedStorage("onedrive");
        } else if (pref === "dropbox" && data.dropboxConnected) {
          setSelectedStorage("dropbox");
        } else {
          setSelectedStorage("local");
        }
      })
      .catch(() => {});
  }, []);

  const cloudConnected = selectedStorage === "onedrive" ? oneDriveConnected : selectedStorage === "dropbox" ? dropboxConnected : false;
  const effectiveArchiveRoot = selectedStorage === "dropbox" ? dropboxArchiveRoot : archiveRoot;

  useEffect(() => {
    if (step !== "suggestion" || selectedStorage === "local") return;
    if (!cloudConnected) return;
    if (!mappad && !gezinslid) {
      setFolderStatus("idle");
      return;
    }

    if (folderCheckTimer.current) clearTimeout(folderCheckTimer.current);
    setFolderStatus("loading");

    const endpoint = selectedStorage === "dropbox"
      ? "/api/tools/mijn-dossier/dropbox/check-folder"
      : "/api/tools/mijn-dossier/onedrive/check-folder";

    folderCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyMember: gezinslid, mappad }),
        });
        const data = await res.json();
        setFolderCheckPath(data.fullPath ?? "");
        setFolderStatus(data.exists ? "exists" : "new");
      } catch {
        setFolderStatus("idle");
      }
    }, 600);

    return () => {
      if (folderCheckTimer.current) clearTimeout(folderCheckTimer.current);
    };
  }, [mappad, gezinslid, step, selectedStorage, cloudConnected]);

  const addFile = useCallback((f: File) => {
    const isPdf = f.type === "application/pdf";
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(f);
    } else {
      setPreviews(prev => [...prev, ""]);
    }
    setFiles(prev => {
      const next = [...prev, f];
      if (isPdf) {
        // PDFs zijn al meerdere pagina's — direct analyseren
        setTimeout(() => analyzeFiles(next), 0);
      } else {
        setStep("staging");
      }
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(next);
    if (next.length === 0) setStep("idle");
  }

  async function analyzeFiles(fs: File[]) {
    setStep("analyzing");
    setErrorMsg("");
    const formData = new FormData();
    fs.forEach((f, i) => formData.append(`file_${i}`, f));
    formData.append("file_count", String(fs.length));
    if (familyMembers.length > 0) {
      formData.append("family_members", JSON.stringify(familyMembers));
    }
    try {
      const res = await fetch("/api/tools/mijn-dossier", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setMappad(data.mappad ?? "");
      setBestandsnaam(data.bestandsnaam ?? "");
      const aiGezinslid = data.gezinslid ?? null;
      if (aiGezinslid && familyMembers.includes(aiGezinslid)) {
        setGezinslid(aiGezinslid);
      } else {
        setGezinslid("");
      }
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

  async function handleUploadCloud() {
    if (!files.length || !analysis) return;
    setStep("saving");

    const endpoint = selectedStorage === "dropbox"
      ? "/api/tools/mijn-dossier/dropbox/upload"
      : "/api/tools/mijn-dossier/onedrive/upload";

    try {
      const filesToUpload = files.map((f, i) => ({
        file: f,
        name: files.length === 1 ? bestandsnaam : `${bestandsnaam}_p${i + 1}`,
      }));

      let lastPath = "";
      let lastUrl: string | null = null;

      for (const { file, name } of filesToUpload) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("familyMember", gezinslid);
        fd.append("mappad", mappad);
        fd.append("bestandsnaam", name);
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload mislukt");
        lastPath = data.path;
        lastUrl = data.webUrl || null;
      }

      setSavedPath(files.length > 1 ? `${mappad} (${files.length} pagina's opgeslagen)` : lastPath);
      setSavedUrl(lastUrl);
      setStep("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload mislukt");
      setStep("error");
    }
  }

  async function handleSaveLocal() {
    if (!files.length || !analysis) return;
    setStep("saving");

    if (!fsApiSupported) {
      const filesToSave = files.map((f, i) => {
        const ext = f.name.includes(".") ? "." + f.name.split(".").pop() : "";
        const name = files.length === 1 ? `${bestandsnaam}${ext}` : `${bestandsnaam}_p${i + 1}${ext}`;
        return new File([f], name, { type: f.type });
      });

      if (shareApiSupported && navigator.canShare?.({ files: filesToSave })) {
        try {
          await navigator.share({ files: filesToSave, title: filesToSave[0].name });
          setSavedPath(`${mappad}/${filesToSave[0].name}`);
          setSavedUrl(null);
          setStep("done");
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            setErrorMsg(err.message);
            setStep("error");
          } else {
            setStep("suggestion");
          }
        }
      } else {
        for (const f of filesToSave) {
          const url = URL.createObjectURL(f);
          const a = document.createElement("a");
          a.href = url;
          a.download = f.name;
          a.click();
          URL.revokeObjectURL(url);
        }
        setSavedPath(`${mappad} (${filesToSave.length > 1 ? filesToSave.length + " bestanden gedownload" : filesToSave[0].name + " gedownload"})`);
        setSavedUrl(null);
        setStep("done");
      }
      return;
    }

    let handle = archiveHandle;
    if (!handle) {
      handle = await pickArchiveFolder();
      if (!handle) { setStep("suggestion"); return; }
    }

    const permitted = await verifyPermission(handle);
    if (!permitted) {
      handle = await pickArchiveFolder();
      if (!handle) { setStep("suggestion"); return; }
    }

    try {
      let lastPath = "";
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = f.name.includes(".") ? "." + f.name.split(".").pop() : "";
        const name = files.length === 1 ? bestandsnaam : `${bestandsnaam}_p${i + 1}`;
        lastPath = await saveToArchive(handle, mappad, name, f, ext);
      }
      setSavedPath(files.length > 1 ? `${mappad} (${files.length} pagina's opgeslagen)` : lastPath);
      setSavedUrl(null);
      setStep("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Opslaan mislukt");
      setStep("error");
    }
  }

  function reset() {
    setStep("idle");
    setFiles([]);
    setPreviews([]);
    setAnalysis(null);
    setMappad("");
    setBestandsnaam("");
    setGezinslid("");
    setSavedPath("");
    setSavedUrl(null);
    setErrorMsg("");
    setFolderStatus("idle");
    setFolderCheckPath("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (pageInputRef.current) pageInputRef.current.value = "";
  }

  const docIcon = analysis ? (DOC_ICONS[analysis.type?.toLowerCase()] ?? "📄") : "📄";
  const ext = files[0]?.name.includes(".") ? "." + files[0].name.split(".").pop() : "";
  const cloudPath = cloudConnected
    ? [effectiveArchiveRoot, gezinslid, mappad, bestandsnaam ? `${bestandsnaam}${ext}` : ""]
        .filter(Boolean)
        .join(" / ")
    : null;

  const availableStorageOptions: { value: StorageOption; label: string; icon: string }[] = [
    ...(oneDriveConnected ? [{ value: "onedrive" as StorageOption, label: "OneDrive", icon: "☁️" }] : []),
    ...(dropboxConnected ? [{ value: "dropbox" as StorageOption, label: "Dropbox", icon: "📦" }] : []),
    { value: "local" as StorageOption, label: "Lokaal", icon: "💻" },
  ];

  const primaryButtonLabel =
    selectedStorage === "onedrive"
      ? "Uploaden naar OneDrive"
      : selectedStorage === "dropbox"
      ? "Uploaden naar Dropbox"
      : fsApiSupported
      ? "Opslaan in archief"
      : shareApiSupported
      ? "Delen / Opslaan in Bestanden"
      : "Downloaden";

  const isCloudSelected = selectedStorage === "onedrive" || selectedStorage === "dropbox";

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="MijnDossier" />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">MijnDossier</h1>
            <p className="text-gray-500 text-sm">
              Upload een scan of foto van een brief. AI analyseert het document en plaatst het in de juiste map.
            </p>
          </div>
          <Link
            href="/tools/mijn-dossier/instellingen"
            className="shrink-0 ml-4 text-gray-400 hover:text-gray-700 transition-colors"
            title="Instellingen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {fsApiSupported && !oneDriveConnected && !dropboxConnected && (
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
              if (f) addFile(f);
            }}
          >
            <div className="text-5xl mb-4">📬</div>
            <p className="font-semibold text-gray-800 mb-1">Sleep een bestand hierheen</p>
            <p className="text-sm text-gray-500 mb-4">of klik om te bladeren</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP of PDF · max 20 MB</p>
            {!oneDriveConnected && !dropboxConnected && (
              <p className="text-xs text-gray-400 mt-3">
                <Link href="/tools/mijn-dossier/instellingen" className="text-blue-500 hover:text-blue-700">
                  Cloudopslag koppelen →
                </Link>
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); }}
            />
          </div>
        )}

        {step === "staging" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900">
                {files.length === 1 ? "1 pagina" : `${files.length} pagina's`}
              </h2>
              <span className="text-xs text-gray-400">Voeg meer pagina's toe of analyseer direct</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {files.map((f, i) => (
                <div key={i} className="relative group">
                  {previews[i] ? (
                    <img
                      src={previews[i]}
                      alt={`Pagina ${i + 1}`}
                      className="w-full aspect-[3/4] object-cover rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-3xl">
                      📄
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs rounded px-1.5 py-0.5">
                    p{i + 1}
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={() => pageInputRef.current?.click()}
                className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <span className="text-2xl mb-1">+</span>
                <span className="text-xs">Pagina</span>
              </button>
            </div>

            <input
              ref={pageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); if (pageInputRef.current) pageInputRef.current.value = ""; }}
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => analyzeFiles(files)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                Analyseren →
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

        {step === "analyzing" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            {previews[0] ? (
              <div className="flex gap-2 justify-center mb-6">
                {previews.slice(0, 3).map((p, i) => p ? (
                  <img key={i} src={p} alt={`p${i+1}`} className="h-24 rounded-lg object-cover shadow" />
                ) : (
                  <div key={i} className="h-24 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl shadow">📄</div>
                ))}
                {previews.length > 3 && (
                  <div className="h-24 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 shadow">
                    +{previews.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📄</div>
            )}
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {files.length > 1 ? `${files.length} pagina's worden geanalyseerd…` : "Document wordt geanalyseerd…"}
            </div>
          </div>
        )}

        {step === "suggestion" && analysis && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                {previews[0] ? (
                  <img src={previews[0]} alt="preview" className="w-16 h-20 object-cover rounded-xl shadow shrink-0" />
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

            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Opslaan als</h2>

              {availableStorageOptions.length > 1 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Opslaan naar</label>
                  <div className="flex gap-2">
                    {availableStorageOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSelectedStorage(opt.value);
                          setFolderStatus("idle");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                          selectedStorage === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {familyMembers.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Gezinslid</label>
                  <select
                    value={gezinslid}
                    onChange={(e) => setGezinslid(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Geen / Gezamenlijk</option>
                    {familyMembers.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mappad</label>
                <input
                  type="text"
                  value={mappad}
                  onChange={(e) => setMappad(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="bijv. Financiën/Belasting/2024"
                />
                {selectedStorage === "local" && (
                  <p className="text-xs text-gray-400 mt-1">Submappen worden automatisch aangemaakt.</p>
                )}
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
                  Extensie ({files[0]?.name.split(".").pop()}) wordt automatisch toegevoegd.
                </p>
              </div>

              {isCloudSelected && cloudConnected && (
                <div className="pt-2 space-y-2">
                  {folderStatus === "loading" && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Map controleren…
                    </div>
                  )}
                  {folderStatus === "exists" && (
                    <p className="text-xs text-green-600 font-medium">✓ Map bestaat al</p>
                  )}
                  {folderStatus === "new" && (
                    <p className="text-xs text-blue-600 font-medium">✨ Nieuwe map wordt aangemaakt</p>
                  )}
                  {cloudPath && (
                    <p className="text-xs text-gray-400 font-mono break-all">{cloudPath}</p>
                  )}
                </div>
              )}
            </div>

            {selectedStorage === "local" && !fsApiSupported && !shareApiSupported && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
                Jouw browser ondersteunt direct opslaan niet. Het bestand wordt gedownload — plaats het zelf in de juiste map.
              </div>
            )}

            {selectedStorage === "local" && shareApiSupported && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-800">
                Tik op <strong>Delen</strong> en kies <strong>Opslaan in Bestanden</strong> om het bestand in de juiste map te plaatsen.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={isCloudSelected ? handleUploadCloud : handleSaveLocal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
                >
                  {primaryButtonLabel}
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Annuleren
                </button>
              </div>
              {isCloudSelected && fsApiSupported && (
                <button
                  onClick={handleSaveLocal}
                  className="text-xs text-gray-500 hover:text-gray-700 text-center py-1 transition-colors"
                >
                  Opslaan lokaal
                </button>
              )}
            </div>

            {!oneDriveConnected && !dropboxConnected && (
              <p className="text-center text-xs text-gray-400">
                <Link href="/tools/mijn-dossier/instellingen" className="text-blue-500 hover:text-blue-700">
                  Cloudopslag koppelen →
                </Link>
              </p>
            )}
          </div>
        )}

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

        {step === "done" && (
          <div className="bg-white border border-green-200 rounded-3xl p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">Opgeslagen!</h2>
              <p className="text-sm text-gray-500 font-mono bg-gray-50 rounded-xl px-4 py-2 break-all">{savedPath}</p>
              {savedUrl && (
                <a
                  href={savedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Openen in OneDrive →
                </a>
              )}
            </div>
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-2xl transition-colors"
            >
              Nieuw document archiveren
            </button>
          </div>
        )}

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
