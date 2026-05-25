"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ToolNav from "@/components/ToolNav";

interface StatusData {
  connected: boolean;
  archiveRoot: string;
  familyMembers: string[];
  dropboxConnected: boolean;
  dropboxArchiveRoot: string;
  storagePreference: string;
}

interface FamilyMember {
  id: string;
  name: string;
}

function InstellingenContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [archiveRoot, setArchiveRoot] = useState("Archief");
  const [dropboxArchiveRoot, setDropboxArchiveRoot] = useState("Archief");
  const [storagePreference, setStoragePreference] = useState("local");
  const [newMemberName, setNewMemberName] = useState("");
  const [savingRoot, setSavingRoot] = useState(false);
  const [savingDropboxRoot, setSavingDropboxRoot] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    fetch("/api/tools/brief-archief/onedrive/status")
      .then((r) => r.json())
      .then((data: StatusData) => {
        setStatus(data);
        setArchiveRoot(data.archiveRoot);
        setDropboxArchiveRoot(data.dropboxArchiveRoot);
        setStoragePreference(data.storagePreference);
      });

    fetch("/api/tools/brief-archief/onedrive/family")
      .then((r) => r.json())
      .then((data: { familyMembers: FamilyMember[] }) => {
        setFamilyMembers(data.familyMembers ?? []);
      });
  }, []);

  async function saveStoragePreference(value: string) {
    setStoragePreference(value);
    try {
      await fetch("/api/tools/brief-archief/onedrive/status", {
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
      const res = await fetch("/api/tools/brief-archief/onedrive/status", {
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
      const res = await fetch("/api/tools/brief-archief/onedrive/status", {
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
      const res = await fetch("/api/tools/brief-archief/onedrive/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });
      if (!res.ok) throw new Error();
      const member: FamilyMember = await res.json();
      setFamilyMembers((prev) => [...prev, member]);
      setNewMemberName("");
    } catch {
      showToast("error", "Toevoegen mislukt.");
    } finally {
      setAddingMember(false);
    }
  }

  async function deleteMember(id: string) {
    try {
      const res = await fetch("/api/tools/brief-archief/onedrive/family", {
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
    { value: "local", label: "Lokale pc", icon: "💻" },
    { value: "onedrive", label: "OneDrive", icon: "☁️" },
    { value: "dropbox", label: "Dropbox", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="Brief Archief — Instellingen" />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Instellingen</h1>
          <p className="text-gray-500 text-sm">Beheer je opslagvoorkeur, koppelingen en gezinsleden.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Opslagvoorkeur</h2>
          <div className="flex gap-2">
            {storageOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => saveStoragePreference(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-sm font-medium transition-colors ${
                  storagePreference === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">OneDrive koppeling</h2>

          {status === null ? (
            <div className="text-sm text-gray-400">Laden…</div>
          ) : status.connected ? (
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <span className="text-sm font-medium text-gray-900">OneDrive is gekoppeld</span>
              <a
                href="/api/tools/brief-archief/onedrive/auth"
                className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-xl px-3 py-1.5 transition-colors"
              >
                Vernieuwen / Opnieuw koppelen
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xl">○</span>
              <span className="text-sm text-gray-600">OneDrive is nog niet gekoppeld</span>
              <a
                href="/api/tools/brief-archief/onedrive/auth"
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                OneDrive koppelen
              </a>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs text-gray-500 block">Archiefmap naam</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={archiveRoot}
                onChange={(e) => setArchiveRoot(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Archief"
              />
              <button
                onClick={saveArchiveRoot}
                disabled={savingRoot}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                {savingRoot ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
            <p className="text-xs text-gray-400">De naam van de hoofdmap in je OneDrive (standaard: Archief).</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Dropbox koppeling</h2>

          {status === null ? (
            <div className="text-sm text-gray-400">Laden…</div>
          ) : status.dropboxConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <span className="text-sm font-medium text-gray-900">Dropbox is gekoppeld</span>
              <a
                href="/api/tools/brief-archief/dropbox/auth"
                className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-xl px-3 py-1.5 transition-colors"
              >
                Opnieuw koppelen
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xl">○</span>
              <span className="text-sm text-gray-600">Dropbox is nog niet gekoppeld</span>
              <a
                href="/api/tools/brief-archief/dropbox/auth"
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Dropbox koppelen
              </a>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs text-gray-500 block">Archiefmap naam</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dropboxArchiveRoot}
                onChange={(e) => setDropboxArchiveRoot(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Archief"
              />
              <button
                onClick={saveDropboxArchiveRoot}
                disabled={savingDropboxRoot}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                {savingDropboxRoot ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
            <p className="text-xs text-gray-400">De naam van de hoofdmap in je Dropbox (standaard: Archief).</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Gezinsleden</h2>
          <p className="text-xs text-gray-500">
            De AI gebruikt deze namen om documenten aan het juiste gezinslid toe te wijzen.
          </p>

          <ul className="space-y-2">
            {familyMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-sm text-gray-800">{m.name}</span>
                <button
                  onClick={() => deleteMember(m.id)}
                  className="text-gray-400 hover:text-red-500 text-lg leading-none transition-colors"
                  aria-label="Verwijderen"
                >
                  ×
                </button>
              </li>
            ))}
            {familyMembers.length === 0 && (
              <li className="text-sm text-gray-400 italic">Nog geen gezinsleden toegevoegd.</li>
            )}
          </ul>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Naam gezinslid"
            />
            <button
              onClick={addMember}
              disabled={addingMember || !newMemberName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {addingMember ? "Toevoegen…" : "Toevoegen"}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/tools/brief-archief"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Terug naar Brief Archief
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function InstellingenPage() {
  return (
    <Suspense>
      <InstellingenContent />
    </Suspense>
  );
}
