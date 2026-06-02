"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ToolNav from "@/components/ToolNav";

type Step = "setup" | "generating" | "result" | "sending" | "done" | "error";
type CookTime = "snel" | "normaal" | "geen";

interface Ingredient { item: string; category: string; }
interface DayPlan { day: string; dish: string; description: string; time: string; recipe: string; ingredients: Ingredient[]; }
interface WeekPlan { week: DayPlan[]; }

const ALL_DAYS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
const DIETARY_OPTIONS = ["Vegetarisch", "Veganistisch", "Glutenvrij", "Lactosevrij", "Halal", "Geen varkensvlees"];
const CATEGORIES = ["Groenten & fruit", "Vlees, vis & vleesvervanger", "Zuivel & eieren", "Droogwaren & conserven", "Sauzen, kruiden & oliën", "Brood & bakkerij", "Overig"];

export default function DinnerPlannerPage() {
  const [step, setStep] = useState<Step>("setup");
  const [persons, setPersons] = useState(2);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cookTime, setCookTime] = useState<CookTime>("geen");
  const [fridge, setFridge] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(ALL_DAYS);
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  function toggleDietary(item: string) {
    setDietary((prev) => prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]);
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  function toggleActiveDay(day: string) {
    setActiveDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  function removeItem(item: string) {
    setRemovedItems((prev) => new Set([...prev, item.toLowerCase()]));
  }

  // Compute shopping list dynamically from active days minus removed items
  const shoppingList = useMemo(() => {
    if (!plan) return {} as Record<string, string[]>;
    const result: Record<string, string[]> = {};
    const seen = new Set<string>();
    for (const cat of CATEGORIES) result[cat] = [];
    for (const day of plan.week) {
      if (!activeDays.includes(day.day)) continue;
      for (const ing of day.ingredients) {
        const key = ing.item.toLowerCase();
        if (removedItems.has(key) || seen.has(key)) continue;
        seen.add(key);
        const cat = CATEGORIES.includes(ing.category) ? ing.category : "Overig";
        result[cat].push(ing.item);
      }
    }
    return result;
  }, [plan, activeDays, removedItems]);

  async function generatePlan() {
    if (selectedDays.length === 0) return;
    setStep("generating");
    try {
      // Sort days in week order
      const orderedDays = ALL_DAYS.filter((d) => selectedDays.includes(d));
      const res = await fetch("/api/tools/dinner-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persons, dietary, cookTime, fridge, days: orderedDays }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
      setActiveDays(data.week.map((d: DayPlan) => d.day));
      setRemovedItems(new Set());
      setExpandedDay(null);
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
      const filteredShoppingList: Record<string, string[]> = {};
      for (const [cat, items] of Object.entries(shoppingList)) {
        if (items.length > 0) filteredShoppingList[cat] = items;
      }
      const res = await fetch("/api/tools/send-dinner-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          activeDays: plan.week.filter((d) => activeDays.includes(d.day)),
          shopping_list: filteredShoppingList,
        }),
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
    setActiveDays([]);
    setRemovedItems(new Set());
    setExpandedDay(null);
    setErrorMsg("");
    setFridge("");
    setDietary([]);
    setSelectedDays(ALL_DAYS);
  }

  const hasShoppingItems = Object.values(shoppingList).some((items) => items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="🍽️ Weekmenu Planner" />

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* SETUP */}
          {step === "setup" && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Weekmenu Planner</h1>
                <p className="text-gray-500 text-sm">Vul je voorkeuren in en ontvang een weekmenu met boodschappenlijst. Kost 1 credit.</p>
              </div>

              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voor welke dagen?</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <button key={day} onClick={() => toggleDay(day)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${selectedDays.includes(day) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-500 hover:border-blue-400 bg-white"}`}>
                      {day.slice(0, 2)}
                    </button>
                  ))}
                  <button onClick={() => setSelectedDays(selectedDays.length === ALL_DAYS.length ? [] : ALL_DAYS)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-500 hover:border-blue-400 bg-white transition-colors">
                    {selectedDays.length === ALL_DAYS.length ? "Geen" : "Alle"}
                  </button>
                </div>
                {selectedDays.length === 0 && <p className="text-xs text-red-500 mt-1">Selecteer minimaal 1 dag.</p>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Wat heb je al in huis? <span className="text-gray-400 font-normal">(optioneel)</span></label>
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

              <button onClick={generatePlan} disabled={!email || selectedDays.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg py-3 text-sm font-medium transition-colors">
                Maak weekmenu voor {selectedDays.length} {selectedDays.length === 1 ? "dag" : "dagen"}
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
                <p className="text-sm text-gray-500">Schakel dagen uit om ze van de boodschappenlijst te halen.</p>
              </div>

              {/* Week plan */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Weekoverzicht</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {plan.week.map((d, i) => {
                    const isActive = activeDays.includes(d.day);
                    const isExpanded = expandedDay === d.day;
                    return (
                      <div key={i} className={`border-b border-gray-100 last:border-b-0 transition-colors ${isActive ? "" : "opacity-50 bg-gray-50"}`}>
                        <div className="flex items-start gap-3 px-4 py-3">
                          {/* Toggle day */}
                          <button onClick={() => toggleActiveDay(d.day)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"}`}>
                            {isActive && <span className="text-xs leading-none">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-semibold text-gray-500">{d.day}</span>
                                <p className="text-sm font-semibold text-gray-900">{d.dish}</p>
                                <p className="text-xs text-gray-500">{d.description} · ⏱ {d.time}</p>
                              </div>
                              <button onClick={() => setExpandedDay(isExpanded ? null : d.day)}
                                className="text-xs text-blue-500 hover:text-blue-700 shrink-0 mt-1 whitespace-nowrap">
                                {isExpanded ? "▲ recept" : "▼ recept"}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <p className="text-xs font-semibold text-blue-700 mb-1.5">Bereiding</p>
                                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{d.recipe}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shopping list */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">🛒 Boodschappenlijst</h3>
                <p className="text-xs text-gray-400 mb-3">Klik op × om items die je al in huis hebt te verwijderen.</p>
                {hasShoppingItems ? (
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-4">
                    {CATEGORIES.map((cat) => {
                      const items = shoppingList[cat];
                      if (!items || items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-gray-600 mb-1.5">{cat}</p>
                          <ul className="space-y-1">
                            {items.map((item, idx) => (
                              <li key={idx} className="flex items-center justify-between gap-2 group">
                                <span className="text-sm text-gray-700 flex items-start gap-1.5">
                                  <span className="text-gray-400 mt-0.5">•</span>{item}
                                </span>
                                <button onClick={() => removeItem(item)}
                                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none shrink-0"
                                  title="Verwijder uit lijst">×</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">Geen dagen geselecteerd of alle items verwijderd.</p>
                )}

                {removedItems.size > 0 && (
                  <button onClick={() => setRemovedItems(new Set())} className="mt-2 text-xs text-blue-500 hover:underline">
                    ↩ Verwijderde items terugzetten ({removedItems.size})
                  </button>
                )}
              </div>

              {/* Email + actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stuur naar</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                <div className="flex gap-3">
                  <button onClick={sendPlan} disabled={!email || !hasShoppingItems}
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
              <p className="text-sm text-gray-500 text-center">Weekoverzicht met recepten en boodschappenlijst staan netjes in je inbox.</p>
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
