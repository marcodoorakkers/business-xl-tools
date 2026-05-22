"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";
import ToolNav from "@/components/ToolNav";

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
  contractType: string;
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

const CONTRACT_LABELS: Record<string, { label: string; color: string }> = {
  freelance: { label: "Freelance / ZZP", color: "bg-purple-50 text-purple-700 border-purple-200" },
  contract:  { label: "Contract",         color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  permanent: { label: "Vast",             color: "bg-teal-50 text-teal-700 border-teal-200" },
  "part-time": { label: "Part-time",      color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

function contractLabel(type: string) {
  return CONTRACT_LABELS[type] ?? { label: type, color: "bg-gray-50 text-gray-600 border-gray-200" };
}

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
  const [activeContracts, setActiveContracts] = useState<Set<string>>(new Set());
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
      setActiveContracts(new Set());
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
    setActiveContracts(new Set());
  }

  function toggleContract(type: string) {
    setActiveContracts((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  // Derive unique contract types actually present in results
  const availableContractTypes = Array.from(new Set(vacancies.map((v) => v.contractType))).sort();

  const scopeFiltered = activeTab === "all" ? vacancies : vacancies.filter((v) => v.scope === activeTab);
  const filtered = activeContracts.size === 0
    ? scopeFiltered
    : scopeFiltered.filter((v) => activeContracts.has(v.contractType));

  const counts: Record<Tab, number> = {
    all: vacancies.length,
    nl: vacancies.filter((v) => v.scope === "nl").length,
    remote: vacancies.filter((v) => v.scope === "remote").length,
    international: vacancies.filter((v) => v.scope === "international").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="🔍 Vacaturezoeker" />

      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* ── SETUP ── */}
        {step === "setup" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Vacaturezoeker</h1>
              <p className="text-gray-500 text-sm">Plak je CV of omschrijf je ervaring. Wij zoeken actuele freelance/contract vacatures in NL, remote en internationaal. Kost 1 credit.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jouw CV of profiel</label>
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
              <button onClick={() => pdfInputRef.current?.click()} disabled={pdfLoading}
                className={`w-full py-3 mb-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors flex items-center justify-center gap-2
                  ${pdfName ? "border-green-400 text-green-600 bg-green-50" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 bg-white"}
                  ${pdfLoading ? "opacity-60 cursor-wait" : ""}`}>
                {pdfLoading ? (
                  <><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> PDF wordt ingelezen...</>
                ) : pdfName ? (
                  <>✓ {pdfName} — klik om ander bestand te kiezen</>
                ) : (
                  <>📄 Upload CV als PDF</>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">of plak tekst</span></div>
              </div>

              <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} rows={10}
                placeholder={"Naam: ...\nFunctie: Senior Developer\n\nOver mij:\n...\n\nWerkervaring:\n...\n\nSkills:\nReact, TypeScript, Node.js, ..."}
                className="w-full mt-3 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <p className="text-xs text-gray-400 mt-1">{profileText.length} tekens {profileText.length > 0 && profileText.length < 100 ? "— meer info geeft betere resultaten" : ""}</p>
            </div>

            {errorMsg && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}

            <button onClick={search} disabled={profileText.trim().length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors">
              Zoek vacatures
            </button>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {step === "analyzing" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Profiel analyseren en vacatures zoeken...</p>
            <p className="text-xs text-gray-400">Dit duurt 10–20 seconden</p>
          </div>
        )}

        {/* ── RESULTS ── */}
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

            {/* Filter bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Scope tabs */}
              <div className="flex gap-1 flex-wrap">
                {(["all", "nl", "remote", "international"] as Tab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {tab === "all" ? `Alle (${counts.all})` :
                     tab === "nl" ? `🇳🇱 NL (${counts.nl})` :
                     tab === "remote" ? `🌍 Remote (${counts.remote})` :
                     `🌐 Int'l (${counts.international})`}
                  </button>
                ))}
              </div>

              {/* Divider */}
              {availableContractTypes.length > 0 && (
                <div className="hidden sm:block w-px h-6 bg-gray-200 flex-shrink-0" />
              )}

              {/* Contract type filter */}
              {availableContractTypes.length > 0 && (
                <div className="flex gap-1.5 flex-wrap items-center">
                  <span className="text-xs text-gray-400 font-medium mr-0.5">Type:</span>
                  {activeContracts.size > 0 && (
                    <button onClick={() => setActiveContracts(new Set())}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      ✕ Alles
                    </button>
                  )}
                  {availableContractTypes.map((type) => {
                    const cl = contractLabel(type);
                    const active = activeContracts.has(type);
                    const countForType = scopeFiltered.filter((v) => v.contractType === type).length;
                    return (
                      <button key={type} onClick={() => toggleContract(type)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active ? `${cl.color} ring-2 ring-offset-1 ring-current` : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                        {cl.label} ({countForType})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Results count */}
            <p className="text-xs text-gray-400 px-1">
              {filtered.length} vacature{filtered.length !== 1 ? "s" : ""} gevonden
              {activeContracts.size > 0 && " (gefilterd)"}
            </p>

            {/* Vacancy grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg py-12 text-center">
                <p className="text-gray-400 text-sm">Geen vacatures gevonden met deze filters.</p>
                <button onClick={() => { setActiveTab("all"); setActiveContracts(new Set()); }}
                  className="mt-3 text-xs text-blue-600 hover:underline">Filters wissen</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((v) => {
                  const cl = contractLabel(v.contractType);
                  return (
                    <div key={v.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-2.5">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SCOPE_COLORS[v.scope]}`}>
                          {SCOPE_LABELS[v.scope]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cl.color}`}>
                          {cl.label}
                        </span>
                        {v.salary && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                            {v.salary}
                          </span>
                        )}
                      </div>

                      {/* Title + company */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{v.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{v.company} · {v.location}</p>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{v.description}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-300">{timeAgo(v.created)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              sessionStorage.setItem("cv-vacancy", JSON.stringify({
                                title: v.title,
                                company: v.company,
                                description: v.description,
                                url: v.url,
                              }));
                              window.location.href = "/tools/cv-builder";
                            }}
                            className="bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            CV aanpassen
                          </button>
                          <a href={v.url} target="_blank" rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            Bekijk →
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-1">
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

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
            <p className="text-red-600 font-medium">Er is iets misgegaan</p>
            <p className="text-sm text-gray-500 text-center">{errorMsg}</p>
            <button onClick={reset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm font-medium transition-colors">
              Probeer opnieuw
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
