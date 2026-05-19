"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Step = "setup" | "generating" | "result" | "sending" | "done" | "error";
type CookTime = "snel" | "normaal" | "geen";

interface DayPlan { day: string; dish: string; description: string; time: string; }
interface WeekPlan { week: DayPlan[]; shopping_list: Record<string, string[]>; }

const DIETARY_OPTIONS = ["Vegetarisch", "Veganistisch", "Glutenvrij", "Lactosevrij", "Halal", "Geen varkensvlees"];

export default function DinnerPlannerPage() {
  const [step, setStep] = useState<Step>("setup");
  const [persons, setPersons] = useState(2);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cookTime, setCookTime] = useState<CookTime>("geen");
  const [fridge, setFridge] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  function toggleDietary(item: string) {
    setDietary((prev) => prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]);
  }

  async function generatePlan() {
    setStep("generating");
    try {
      const res = await fetch("/api/tools/dinner-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persons, dietary, cookTime, fridge }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
      setStep("result");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  async function sendPlan() {
    if (!plan) return;
    setStep("sending");
    try {
      const res = await fetch("/api/tools/send-dinner-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, plan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStep("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Versturen mislukt");
      setStep("error");
    }
  }

  function reset() {
    setStep("setup");
    setPlan(null);
    setErrorMsg("");
    setFridge("");
    setDietary([]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">🍽️ Weekmenu Planner</span>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* SETUP */}
          {step === "setup" && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Weekmenu Planner</h1>
                <p className="text-gray-500 text-sm">Vul je voorkeuren in en ontvang een compleet weekmenu met boodschappenlijst. Kost 1 credit.</p>
              </div>

              {/* Persons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aantal personen</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button key={n} onClick={() => setPersons(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-colors ${persons === n ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}>
                      {n === 6 ? "6+" : n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dieetwensen <span className="text-gray-400 font-normal">(optioneel)</span></label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => toggleDietary(opt)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${dietary.includes(opt) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400 bg-white"}`}>
                      {dietary.includes(opt) ? "✓ " : ""}{opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cook time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kooktijd voorkeur</label>
                <div className="flex gap-2">
                  {([["snel", "⚡ Snel (<30 min)"], ["normaal", "🍳 Normaal (~45 min)"], ["geen", "🎲 Maakt niet uit"]] as [CookTime, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setCookTime(val)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${cookTime === val ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fridge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wat heb je al in huis? <span className="text-gray-400 font-normal">(optioneel)</span>
                </label>
                <textarea value={fridge} onChange={(e) => setFridge(e.target.value)} rows={2}
                  placeholder="bijv. kipfilet, rijst, courgette..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stuur weekmenu naar</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="jij@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button onClick={generatePlan} disabled={!email}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg py-3 text-sm font-medium transition-colors">
                Maak weekmenu
              </button>
            </div>
          )}

          {/* GENERATING */}
          {step === "generating" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Weekmenu wordt samengesteld...</p>
            </div>
          )}

          {/* RESULT */}
          {step === "result" && plan && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Jouw weekmenu</h2>
                <p className="text-sm text-gray-500">Controleer het menu en stuur het naar je mailbox.</p>
              </div>

              {/* Week table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Weekoverzicht</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {plan.week.map((d, i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < plan.week.length - 1 ? "border-b border-gray-100" : ""}`}>
                      <span className="text-xs font-semibold text-gray-500 w-20 shrink-0 pt-0.5">{d.day}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{d.dish}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 pt-0.5 whitespace-nowrap">⏱ {d.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping list */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🛒 Boodschappenlijst</h3>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-4">
                  {Object.entries(plan.shopping_list).filter(([, items]) => items.length > 0).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">{cat}</p>
                      <ul className="space-y-1">
                        {items.map((item, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">•</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email field + actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stuur naar</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                <div className="flex gap-3">
                  <button onClick={sendPlan} disabled={!email}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                    Stuur naar mijn mailbox
                  </button>
                  <button onClick={reset}
                    className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">
                    Opnieuw
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SENDING */}
          {step === "sending" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Weekmenu wordt verstuurd...</p>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
              <p className="text-gray-700 font-medium">Weekmenu verstuurd naar je mailbox!</p>
              <p className="text-sm text-gray-500 text-center">Je ontvangt het weekmenu en de boodschappenlijst mooi opgemaakt in je inbox.</p>
              <button onClick={reset}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors">
                Nieuw weekmenu
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
              <p className="text-red-600 font-medium">Er is iets misgegaan</p>
              <p className="text-sm text-gray-500">{errorMsg}</p>
              <button onClick={reset}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm font-medium transition-colors">
                Probeer opnieuw
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
