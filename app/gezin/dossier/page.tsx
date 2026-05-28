"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = "idle" | "staging" | "analyzing" | "suggestion" | "saving" | "done" | "error";

interface Analysis {
  type: string;
  afzender: string;
  datum: string | null;
  onderwerp: string;
  mappad: string;
  bestandsnaam: string;
  samenvatting: string;
  gezinslid?: string | null;
  actie?: string | null;
  actie_deadline?: string | null;
  actie_type?: string | null;
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

async function compressImage(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = 1920;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width >= height) { height = Math.round(height * maxSize / width); width = maxSize; }
        else { width = Math.round(width * maxSize / height); height = maxSize; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        else resolve(file);
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function imagesToPdf(imageFiles: File[], name: string): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297;
  for (let i = 0; i < imageFiles.length; i++) {
    if (i > 0) pdf.addPage();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as string);
      reader.readAsDataURL(imageFiles[i]);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img2 = new Image();
      img2.onload = () => resolve({ w: img2.naturalWidth, h: img2.naturalHeight });
      img2.onerror = reject;
      img2.src = dataUrl;
    });
    const iR = dims.w / dims.h, pR = PW / PH;
    let drawW = PW, drawH = PH;
    if (iR > pR) drawH = PW / iR; else drawW = PH * iR;
    pdf.addImage(dataUrl, "JPEG", (PW - drawW) / 2, (PH - drawH) / 2, drawW, drawH);
  }
  return new File([pdf.output("blob")], `${name}.pdf`, { type: "application/pdf" });
}

export default function GezinDossierPage() {
  const [step, setStep] = useState<Step>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mappad, setMappad] = useState("");
  const [bestandsnaam, setBestandsnaam] = useState("");
  const [gezinslid, setGezinslid] = useState("");
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [includeActie, setIncludeActie] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedInfo, setSavedInfo] = useState<{ pad: string; url?: string } | null>(null);
  const [oneDriveConnected, setOneDriveConnected] = useState(false);
  const [dropboxConnected, setDropboxConnected] = useState(false);
  const [archiveRoot, setArchiveRoot] = useState("Archief");
  const [storagePreference, setStoragePreference] = useState<"local" | "onedrive" | "dropbox">("local");
  const [credits, setCredits] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
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
        setFamilyMembers(data.familyMembers ?? []);
        setStoragePreference((data.storagePreference ?? "local") as "local" | "onedrive" | "dropbox");
      })
      .catch(() => {});

    supabase.from("profiles").select("credits").single().then(({ data }) => {
      if (data) setCredits(data.credits);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFile = useCallback((f: File) => {
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    } else {
      setPreviews(prev => [...prev, ""]);
    }
    setFiles(prev => {
      const next = [...prev, f];
      if (f.type === "application/pdf") {
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
    const compressed = await Promise.all(fs.map(compressImage));
    const formData = new FormData();
    compressed.forEach((f, i) => formData.append(`file_${i}`, f));
    formData.append("file_count", String(compressed.length));
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
      if (data.gezinslid && familyMembers.includes(data.gezinslid)) {
        setGezinslid(data.gezinslid);
      } else {
        setGezinslid("");
      }
      setStep("suggestion");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  async function saveActie(a: Analysis) {
    if (!a.actie) return;
    try {
      await fetch("/api/tools/mijn-dossier/acties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actie: a.actie,
          deadline: a.actie_deadline ?? null,
          actie_type: a.actie_type ?? null,
          document_naam: bestandsnaam,
          afzender: a.afzender,
          mappad,
        }),
      });
    } catch (err) {
      console.error("Kon actie niet opslaan:", err);
    }
  }

  async function handleSaveCloud() {
    if (!analysis) return;
    setStep("saving");
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    const pdfFiles = files.filter(f => f.type === "application/pdf");
    let uploadFile: File;
    if (imageFiles.length > 0) {
      const compressed = await Promise.all(imageFiles.map(compressImage));
      uploadFile = compressed.length === 1 ? compressed[0] : await imagesToPdf(compressed, bestandsnaam);
    } else {
      uploadFile = pdfFiles[0];
    }

    const endpoint = storagePreference === "dropbox"
      ? "/api/tools/mijn-dossier/dropbox/upload"
      : "/api/tools/mijn-dossier/onedrive/upload";

    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("mappad", `${archiveRoot}/${gezinslid ? `${gezinslid}/` : ""}${mappad}`);
    fd.append("bestandsnaam", bestandsnaam);

    const res = await fetch(endpoint, { method: "POST", body: fd });
    const data = await res.json();
    if (data.error) { setErrorMsg(data.error); setStep("error"); return; }

    if (includeActie && analysis.actie) await saveActie(analysis);
    setSavedInfo({ pad: data.path ?? mappad, url: data.webUrl });
    setStep("done");
  }

  async function handleSaveLocal() {
    if (!analysis) return;
    setStep("saving");
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    let saveFile: File;
    if (imageFiles.length > 0) {
      const compressed = await Promise.all(imageFiles.map(compressImage));
      saveFile = compressed.length === 1 ? compressed[0] : await imagesToPdf(compressed, bestandsnaam);
    } else {
      saveFile = files[0];
    }

    if (navigator.canShare?.({ files: [saveFile] })) {
      try { await navigator.share({ files: [saveFile], title: bestandsnaam }); } catch { /* cancelled */ }
    } else {
      const url = URL.createObjectURL(saveFile);
      const a = document.createElement("a");
      a.href = url; a.download = `${bestandsnaam}.${saveFile.type === "application/pdf" ? "pdf" : "jpg"}`;
      a.click(); URL.revokeObjectURL(url);
    }

    if (includeActie && analysis.actie) await saveActie(analysis);
    setSavedInfo({ pad: mappad });
    setStep("done");
  }

  function reset() {
    setStep("idle"); setFiles([]); setPreviews([]); setAnalysis(null);
    setMappad(""); setBestandsnaam(""); setGezinslid(""); setErrorMsg("");
    setSavedInfo(null); setIncludeActie(true);
  }

  const cloudConnected = storagePreference === "onedrive" ? oneDriveConnected : storagePreference === "dropbox" ? dropboxConnected : false;
  const cloudLabel = storagePreference === "dropbox" ? "Dropbox" : "OneDrive";

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-amber-700 text-lg">📬 NooitMeerPostKwijt</Link>
          <div className="flex items-center gap-4">
            <Link href="/acties" className="text-sm text-amber-700 font-medium hover:text-amber-500 transition-colors">
              📋 Acties
            </Link>
            <Link href="/dossier/instellingen" className="text-gray-400 hover:text-gray-600 transition-colors">
              ⚙️
            </Link>
            {credits !== null && (
              <span className="text-xs text-gray-400 font-medium">{credits} credits</span>
            )}
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">

        {/* IDLE — upload zone */}
        {step === "idle" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Post scannen</h1>
              <p className="text-gray-500 text-sm">Maak een foto of upload een PDF — AI regelt de rest.</p>
            </div>

            <div
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-amber-400 bg-amber-100" : "border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                Array.from(e.dataTransfer.files).forEach(addFile);
              }}
            >
              <div className="text-5xl mb-3">📸</div>
              <p className="font-semibold text-gray-700 mb-1">Tik om een foto te maken of te uploaden</p>
              <p className="text-xs text-gray-400">JPG, PNG of PDF • Meerdere pagina&apos;s mogelijk</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => Array.from(e.target.files ?? []).forEach(addFile)}
              />
            </div>

            {familyMembers.length === 0 && (
              <div className="mt-4 bg-amber-100 rounded-2xl px-4 py-3 text-sm text-amber-800">
                💡 <strong>Tip:</strong> Voeg gezinsleden toe in de{" "}
                <Link href="/dossier/instellingen" className="underline font-medium">instellingen</Link>{" "}
                zodat AI brieven automatisch aan het juiste gezinslid koppelt.
              </div>
            )}
          </div>
        )}

        {/* STAGING — meerdere pagina's toevoegen */}
        {step === "staging" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Pagina&apos;s toevoegen</h1>
              <p className="text-gray-500 text-sm">Voeg meer pagina&apos;s toe of analyseer direct.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
                  {src ? (
                    <img src={src} alt={`Pagina ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📄</div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >×</button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 rounded">{i + 1}</span>
                </div>
              ))}
              <button
                onClick={() => pageInputRef.current?.click()}
                className="aspect-[3/4] border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center text-amber-400 hover:border-amber-400 hover:bg-amber-50 transition-colors"
              >
                <span className="text-2xl">+</span>
                <span className="text-xs mt-1">Pagina toevoegen</span>
              </button>
            </div>
            <input
              ref={pageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => Array.from(e.target.files ?? []).forEach(addFile)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => analyzeFiles(files)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                Analyseren →
              </button>
              <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 px-4 transition-colors">
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* ANALYZING */}
        {step === "analyzing" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-bounce">🤖</div>
            <p className="font-semibold text-gray-700 text-lg mb-1">AI analyseert jullie post…</p>
            <p className="text-gray-400 text-sm">Even geduld — dit duurt maar een paar seconden.</p>
          </div>
        )}

        {/* SUGGESTION */}
        {step === "suggestion" && analysis && (
          <div>
            <div className="mb-5">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                {DOC_ICONS[analysis.type] ?? "📄"} {analysis.onderwerp}
              </h1>
              <p className="text-gray-500 text-sm">{analysis.samenvatting}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 mb-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mappad</label>
                <input
                  value={mappad}
                  onChange={(e) => setMappad(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bestandsnaam</label>
                <input
                  value={bestandsnaam}
                  onChange={(e) => setBestandsnaam(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              {familyMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gezinslid</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setGezinslid("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${gezinslid === "" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      Gezin
                    </button>
                    {familyMembers.map((m) => (
                      <button
                        key={m}
                        onClick={() => setGezinslid(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${gezinslid === m ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actie card */}
            {analysis.actie && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">⏳ Actie vereist</p>
                    <p className="text-sm font-semibold text-gray-900">{analysis.actie}</p>
                    {analysis.actie_deadline && (
                      <p className="text-xs text-amber-600 mt-1">
                        Vóór {new Date(analysis.actie_deadline).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIncludeActie(!includeActie)}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      includeActie ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {includeActie ? "Bijhouden ✓" : "Niet bijhouden"}
                  </button>
                </div>
              </div>
            )}

            {/* Opslaan buttons */}
            <div className="space-y-3">
              {cloudConnected && (
                <button
                  onClick={handleSaveCloud}
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  ☁️ Opslaan in {cloudLabel}
                </button>
              )}
              <button
                onClick={handleSaveLocal}
                className={`w-full ${cloudConnected ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-gray-900 hover:bg-gray-700 text-white"} font-semibold py-3.5 rounded-2xl transition-colors`}
              >
                💾 Downloaden / delen
              </button>
              {!cloudConnected && (
                <p className="text-center text-xs text-gray-400">
                  Verbind OneDrive of Dropbox in de{" "}
                  <Link href="/dossier/instellingen" className="underline text-amber-600">instellingen</Link>
                  {" "}voor automatisch opslaan.
                </p>
              )}
            </div>
          </div>
        )}

        {/* SAVING */}
        {step === "saving" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💾</div>
            <p className="font-semibold text-gray-700 text-lg">Opslaan…</p>
          </div>
        )}

        {/* DONE */}
        {step === "done" && savedInfo && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Opgeslagen!</h2>
            <p className="text-sm text-gray-500 font-mono mb-6">{savedInfo.pad}</p>
            {savedInfo.url && (
              <a href={savedInfo.url} target="_blank" rel="noopener noreferrer"
                className="inline-block text-sm text-amber-600 hover:underline mb-6">
                Bekijken in cloud →
              </a>
            )}
            {includeActie && analysis?.actie && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">Actie opgeslagen</p>
                <p className="text-sm text-gray-700">{analysis.actie}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                Nieuwe brief scannen
              </button>
              {includeActie && analysis?.actie && (
                <Link href="/acties" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Alle acties bekijken →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oeps, er ging iets mis</h2>
            <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
            <button
              onClick={reset}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-2xl transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
