"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";

type Step = "setup" | "analyzing" | "results" | "error";
type Tab = "all" | "nl" | "remote" | "international";

interface ProfileData {
  titles: string[];
  skills: string[];
  experience: string;
  summary: string;
}

interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  created: string;
  scope: "nl" | "remote" | "international";
}

const SCOPE_LABELS: Record<Vacancy["scope"], string> = {
  nl: "🇳🇱 Nederland",
  remote: "🌍 Remote",
  international: "🌐 Internationaal",
};

const SCOPE_COLORS: Record<Vacancy["scope"], string> = {
  nl: "bg-orange-50 text-orange-700 border-orange-200",
  remote: "bg-green-50 text-green-700 border-green-200",
  international: "bg-blue-50 text-blue-700 border-blue-200",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "vandaag";
  if (days === 1) return "gisteren";
  if (days < 7) return `${days} dagen geleden`;
  if (days < 30) return `${Math.floor(days / 7)} weken geleden`;
  return `${Math.floor(days / 30)} maanden geleden`;
}

export default function VacancyFinderPage() {
  const [step, setStep] = useState<Step>("setup");
  const [profileText, setProfileText] = useState("");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("all");
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

  async function search() {
    if (!profileText.trim()) return;
    setErrorMsg("");
    setStep("analyzing");
    try {
      const res = await fetch("/api/tools/vacancy-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProfileData(data.profile);
      setVacancies(data.vacancies);
      setActiveTab("all");
      setStep("results");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  function reset() {
    setStep("setup");
    setProfileData(null);
    setVacancies([]);
    setErrorMsg("");
  }

  const filtered = activeTab === "all" ? vacancies : vacancies.filter((v) => v.scope === activeTab);
  const counts: Record<Tab, number> = {
    all: vacancies.length,
    nl: vacancies.filter((v) => v.scope === "nl").length,
    remote: vacancies.filter((v) => v.scope === "remote").length,
    international: vacancies.filter((v) => v.scope === "international").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">🔍 Vacaturezoeker</span>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* SETUP */}
        {step === "setup" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Vacaturezoeker</h1>
              <p className="text-gray-500 text-sm">Plak je LinkedIn profiel of omschrijf je ervaring. Wij zoeken actuele freelance/contract vacatures in NL, remote en internationaal. Kost 1 credit.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jouw LinkedIn profiel of CV
              </label>

              {/* PDF upload */}
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfLoading}
                className={`w-full py-3 mb-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors flex items-center justify-center gap-2
                  ${pdfName ? "border-green-400 text-green-600 bg-green-50" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 bg-white"}
                  ${pdfLoading ? "opacity-60 cursor-wait" : ""}`}
              >
                {pdfLoading ? (
                  <><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> PDF wordt ingelezen...</>
                ) : pdfName ? (
                  <>✓ {pdfName} — klik om ander bestand te kiezen</>
                ) : (
                  <>📄 Upload LinkedIn PDF <span className="text-gray-400 font-normal">(LinkedIn → Meer → Profiel opslaan als PDF)</span></>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">of plak tekst</span></div>
              </div>

              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={10}
                placeholder={"Naam: ...\nFunctie: Senior Developer\n\nOver mij:\n...\n\nWerkervaring:\n...\n\nSkills:\nReact, TypeScript, Node.js, ..."}
                className="w-full mt-3 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{profileText.length} tekens {profileText.length < 50 && profileText.length > 0 ? "— voeg meer toe voor betere resultaten" : ""}</p>
            </div>

            {errorMsg && step === "setup" && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
            )}

            <button
              onClick={search}
              disabled={profileText.trim().length < 50}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors"
            >
              Zoek freelance vacatures
            </button>
          </div>
        )}

        {/* ANALYZING */}
        {step === "analyzing" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Profiel analyseren en vacatures zoeken...</p>
            <p className="text-xs text-gray-400">Dit duurt 10–20 seconden</p>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && profileData && (
          <div className="flex flex-col gap-4">

            {/* Profile card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">Profiel geanalyseerd</p>
              <p className="font-medium text-sm mb-3">{profileData.summary}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {profileData.titles.map((t, i) => (
                  <span key={i} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">{t}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profileData.skills.map((s, i) => (
                  <span key={i} className="bg-white/10 text-blue-100 text-xs px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {profileData.experience && (
                  <span className="bg-white/10 text-blue-100 text-xs px-2 py-0.5 rounded-full">⏱ {profileData.experience}</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(["all", "nl", "remote", "international"] as Tab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
                    {tab === "all" ? `Alle (${counts.all})` :
                     tab === "nl" ? `🇳🇱 NL (${counts.nl})` :
                     tab === "remote" ? `🌍 Remote (${counts.remote})` :
                     `🌐 Int'l (${counts.international})`}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm">Geen vacatures gevonden in deze categorie.</p>
                  <p className="text-gray-300 text-xs mt-1">Probeer je profiel aan te vullen met meer details.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map((v) => (
                    <div key={v.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SCOPE_COLORS[v.scope]}`}>
                              {SCOPE_LABELS[v.scope]}
                            </span>
                            {v.salary && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                                {v.salary}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{v.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{v.company} · {v.location}</p>
                          <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{v.description}</p>
                          <p className="text-xs text-gray-300 mt-1">{timeAgo(v.created)}</p>
                        </div>
                        <a href={v.url} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          Bekijk →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-2.5 text-sm font-medium transition-colors shadow-sm">
                Nieuw profiel zoeken
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Vacatures via Adzuna · Klik op "Bekijk →" om direct naar de vacature te gaan
            </p>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
            <p className="text-red-600 font-medium">Er is iets misgegaan</p>
            <p className="text-sm text-gray-500 text-center">{errorMsg}</p>
            <button onClick={reset}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm font-medium transition-colors">
              Probeer opnieuw
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
