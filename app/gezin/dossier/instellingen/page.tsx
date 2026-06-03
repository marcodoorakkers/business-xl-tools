"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

interface StatusData {
  connected: boolean;
  archiveRoot: string;
  familyMembers: string[];
  dropboxConnected: boolean;
  dropboxArchiveRoot: string;
  storagePreference: string;
  folderStructure: string;
}

interface FamilyMember {
  id: string;
  name: string;
  full_name?: string | null;
}

function InstellingenContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [archiveRoot, setArchiveRoot] = useState("Archief");
  const [dropboxArchiveRoot, setDropboxArchiveRoot] = useState("Archief");
  const [storagePreference, setStoragePreference] = useState("local");
  const [folderStructure, setFolderStructure] = useState("by_subject");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberFullName, setNewMemberFullName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [savingRoot, setSavingRoot] = useState(false);
  const [savingDropboxRoot, setSavingDropboxRoot] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [scanEmail, setScanEmail] = useState<string | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const dropboxConnected = searchParams.get("dropbox_connected");
    const error = searchParams.get("error");
    if (connected === "1") showToast("success", "OneDrive succesvol gekoppeld!");
    else if (dropboxConnected === "1") showToast("success", "Dropbox succesvol gekoppeld!");
    else if (error === "auth_failed") showToast("error", "Koppeling mislukt. Probeer opnieuw.");
  }, [searchParams, showToast]);

  useEffect(() => {
    fetch("/api/tools/mijn-dossier/onedrive/status")
      .then((r) => r.json())
      .then((data: StatusData) => {
        setStatus(data);
        setArchiveRoot(data.archiveRoot);
        setDropboxArchiveRoot(data.dropboxArchiveRoot);
        setStoragePreference(data.storagePreference);
        setFolderStructure(data.folderStructure ?? "by_subject");
      });

    fetch("/api/tools/mijn-dossier/onedrive/family")
      .then((r) => r.json())
      .then((data: { familyMembers: FamilyMember[] }) => {
        setFamilyMembers(data.familyMembers ?? []);
      });

    fetch("/api/tools/mijn-dossier/scan-email/token")
      .then((r) => r.json())
      .then((data: { email?: string }) => {
        if (data.email) setScanEmail(data.email);
      });
  }, []);

  async function saveFolderStructure(value: string) {
    setFolderStructure(value);
    try {
      await fetch("/api/tools/mijn-dossier/onedrive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderStructure: value }),
      });
    } catch {
      showToast("error", "Opslaan mislukt.");
    }
  }

  async function saveStoragePreference(value: string) {
    setStoragePreference(value);
    try {
      await fetch("/api/tools/mijn-dossier/onedrive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePreference: value }),
      });
    } catch {
      showToast("error", "Voorkeur opslaan mislukt.");
    }
  }

  async function saveArchiveRoot() {
    setSavingRoot(true);
    try {
      const res = await fetch("/api/tools/mijn-dossier/onedrive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveRoot }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Archiefmap naam opgeslagen.");
    } catch {
      showToast("error", "Opslaan mislukt.");
    } finally {
      setSavingRoot(false);
    }
  }

  async function saveDropboxArchiveRoot() {
    setSavingDropboxRoot(true);
    try {
      const res = await fetch("/api/tools/mijn-dossier/onedrive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropboxArchiveRoot }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Dropbox archiefmap naam opgeslagen.");
    } catch {
      showToast("error", "Opslaan mislukt.");
    } finally {
      setSavingDropboxRoot(false);
    }
  }

  async function addMember() {
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    try {
      const res = await fetch("/api/tools/mijn-dossier/onedrive/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName.trim(), full_name: newMemberFullName.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const member: FamilyMember = await res.json();
      setFamilyMembers((prev) => [...prev, member]);
      setNewMemberName("");
      setNewMemberFullName("");
    } catch {
      showToast("error", "Toevoegen mislukt.");
    } finally {
      setAddingMember(false);
    }
  }

  async function saveFullName(id: string) {
    try {
      const res = await fetch("/api/tools/mijn-dossier/onedrive/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, full_name: editFullName.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const updated: FamilyMember = await res.json();
      setFamilyMembers((prev) => prev.map((m) => m.id === id ? updated : m));
      setEditingId(null);
    } catch {
      showToast("error", "Opslaan mislukt.");
    }
  }

  async function deleteMember(id: string) {
    try {
      const res = await fetch("/api/tools/mijn-dossier/onedrive/family", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      showToast("error", "Verwijderen mislukt.");
    }
  }

  const storageOptions = [
    { value: "local", label: "Lokale pc", icon: "💻", connected: true },
    { value: "onedrive", label: "OneDrive", icon: "☁️", connected: status?.connected ?? false },
    { value: "dropbox", label: "Dropbox", icon: "📦", connected: status?.dropboxConnected ?? false },
  ];

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <NMMPKLogo iconOnly />
          <Link href="/dossier" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            ← Scannen
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-5">
        <div className="mb-2">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Instellingen</h1>
          <p className="text-gray-500 text-sm">Beheer je opslagvoorkeur, koppelingen en geadresseerden.</p>
        </div>

        {/* Opslagvoorkeur */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Opslaglocatie</h2>
            <p className="text-xs text-gray-500 mt-1">Kies hier eenmalig waar documenten worden opgeslagen. Dit geldt voor alle scans.</p>
          </div>
          <div className="flex gap-2">
            {storageOptions.map((opt) => {
              const isSelected = storagePreference === opt.value;
              const needsConnection = opt.value !== "local" && !opt.connected;
              return (
                <button
                  key={opt.value}
                  onClick={() => saveStoragePreference(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs">{opt.label}</span>
                  {opt.value !== "local" && (
                    <span className={`text-xs font-medium ${opt.connected ? "text-green-600" : "text-gray-400"}`}>
                      {opt.connected ? "✓ Gekoppeld" : "Niet gekoppeld"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {storagePreference !== "local" && !(storagePreference === "onedrive" ? status?.connected : status?.dropboxConnected) && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              ⚠️ {storagePreference === "onedrive" ? "OneDrive" : "Dropbox"} is nog niet gekoppeld — koppel hieronder om te kunnen opslaan.
            </p>
          )}
        </div>

        {/* Mapstructuur */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Mapstructuur</h2>
          <p className="text-xs text-gray-500">
            Bepaal hoe documenten worden ingedeeld in je cloudopslag.
          </p>
          <div className="space-y-2">
            {[
              { value: "by_subject", label: "Per onderwerp", example: "Archief / Financiën / Belasting" },
              { value: "by_person", label: "Per geadresseerde", example: "Archief / Marco / Financiën / Belasting" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => saveFolderStructure(opt.value)}
                className={`w-full flex items-start gap-3 rounded-xl px-4 py-3 border transition-colors text-left ${
                  folderStructure === opt.value
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  folderStructure === opt.value ? "border-amber-500" : "border-gray-300"
                }`}>
                  {folderStructure === opt.value && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.example}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* OneDrive */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">OneDrive koppeling</h2>
          {status === null ? (
            <div className="text-sm text-gray-400">Laden…</div>
          ) : status.connected ? (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span className="text-sm font-medium text-gray-900">OneDrive is gekoppeld</span>
              <a href="/api/tools/mijn-dossier/onedrive/auth"
                className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium border border-amber-200 rounded-xl px-3 py-1.5 transition-colors">
                Opnieuw koppelen
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 inline-block flex-shrink-0" />
              <span className="text-sm text-gray-600">OneDrive is nog niet gekoppeld</span>
              <a href="/api/tools/mijn-dossier/onedrive/auth"
                className="ml-auto bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                OneDrive koppelen
              </a>
            </div>
          )}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs text-gray-500 block">Dossiermap naam</label>
            <div className="flex gap-2">
              <input type="text" value={archiveRoot} onChange={(e) => setArchiveRoot(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="MijnDossier" />
              <button onClick={saveArchiveRoot} disabled={savingRoot}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {savingRoot ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
            <p className="text-xs text-gray-400">De naam van de hoofdmap in je OneDrive (standaard: MijnDossier).</p>
          </div>
        </div>

        {/* Dropbox */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Dropbox koppeling</h2>
          {status === null ? (
            <div className="text-sm text-gray-400">Laden…</div>
          ) : status.dropboxConnected ? (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span className="text-sm font-medium text-gray-900">Dropbox is gekoppeld</span>
              <a href="/api/tools/mijn-dossier/dropbox/auth"
                className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium border border-amber-200 rounded-xl px-3 py-1.5 transition-colors">
                Opnieuw koppelen
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 inline-block flex-shrink-0" />
              <span className="text-sm text-gray-600">Dropbox is nog niet gekoppeld</span>
              <a href="/api/tools/mijn-dossier/dropbox/auth"
                className="ml-auto bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                Dropbox koppelen
              </a>
            </div>
          )}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs text-gray-500 block">Dossiermap naam</label>
            <div className="flex gap-2">
              <input type="text" value={dropboxArchiveRoot} onChange={(e) => setDropboxArchiveRoot(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="MijnDossier" />
              <button onClick={saveDropboxArchiveRoot} disabled={savingDropboxRoot}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {savingDropboxRoot ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
            <p className="text-xs text-gray-400">De naam van de hoofdmap in je Dropbox (standaard: MijnDossier).</p>
          </div>
        </div>

        {/* Scan via e-mail */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Scan via e-mail</h2>
          <p className="text-xs text-gray-500">
            Stuur of forward een e-mail met PDF-bijlage naar jouw persoonlijke scan-adres. De bijlage wordt automatisch geanalyseerd en toegevoegd aan je dossier.
          </p>
          {scanEmail ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="text-sm font-mono text-amber-800 break-all flex-1">{scanEmail}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(scanEmail); showToast("success", "E-mailadres gekopieerd!"); }}
                  className="shrink-0 text-xs text-amber-600 hover:text-amber-800 font-medium border border-amber-300 rounded-lg px-2.5 py-1 transition-colors"
                >
                  Kopieer
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Dit adres is persoonlijk — deel het niet. Documenten worden direct verwerkt en nooit permanent op onze servers opgeslagen.
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Laden…</div>
          )}
        </div>

        {/* Gezinsleden */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Geadresseerden</h2>
          <p className="text-xs text-gray-500">
            Voeg personen of entiteiten toe zodat documenten automatisch aan de juiste naam worden gekoppeld.
          </p>
          <ul className="space-y-2">
            {familyMembers.map((m) => (
              <li key={m.id} className="bg-gray-50 rounded-xl px-4 py-2">
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                    <div className="flex gap-2">
                      <input type="text" value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveFullName(m.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        placeholder="bijv. J. de Vries" />
                      <button onClick={() => saveFullName(m.id)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        Opslaan
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors">
                        Annuleer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-800">{m.name}</span>
                      {m.full_name && <span className="text-xs text-gray-400 ml-2">{m.full_name}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingId(m.id); setEditFullName(m.full_name ?? ""); }}
                        className="text-xs text-gray-400 hover:text-amber-500 transition-colors"
                        aria-label="Volledige naam instellen">
                        {m.full_name ? "✎" : "+ naam"}
                      </button>
                      <button onClick={() => deleteMember(m.id)}
                        className="text-gray-400 hover:text-red-500 text-lg leading-none transition-colors"
                        aria-label="Verwijderen">×</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {familyMembers.length === 0 && (
              <li className="text-sm text-gray-400 italic">Nog geen geadresseerden toegevoegd.</li>
            )}
          </ul>
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              <input type="text" value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Roepnaam (bijv. Jan)" />
              <button onClick={addMember} disabled={addingMember || !newMemberName.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {addingMember ? "Toevoegen…" : "Toevoegen"}
              </button>
            </div>
            <input type="text" value={newMemberFullName}
              onChange={(e) => setNewMemberFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Volledige naam optioneel (bijv. J. de Vries)" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GezinInstellingenPage() {
  return (
    <Suspense>
      <InstellingenContent />
    </Suspense>
  );
}
