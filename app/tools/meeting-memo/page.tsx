"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Step = "setup" | "settings" | "recording" | "processing" | "review" | "generating" | "result" | "error";
type Lang = "nl" | "en";
type Theme = "light" | "dark";

interface Notes {
  samenvatting?: string; summary?: string;
  aanwezigen?: string[]; attendees?: string[];
  besproken_punten?: string[]; topics?: string[];
  beslissingen?: string[]; decisions?: string[];
  actiepunten?: { actie: string; wie: string; wanneer: string }[];
  actions?: { action: string; who: string; when: string }[];
  volgende_vergadering?: string; next_meeting?: string;
  _meta?: { title: string; date: string; time: string };
}

export default function MeetingMemoPage() {
  const [step, setStep] = useState<Step>("setup");
  const [prevStep, setPrevStep] = useState<Step>("setup");
  const [lang, setLang] = useState<Lang>("nl");
  const [theme, setTheme] = useState<Theme>("light");
  const [meetingName, setMeetingName] = useState("");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [defaultAttendees, setDefaultAttendees] = useState<string[]>([]);
  const [defaultInput, setDefaultInput] = useState("");
  const [icsImported, setIcsImported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const icsInputRef = useRef<HTMLInputElement>(null);

  // Load theme + default attendees from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("mm-theme") as Theme | null;
    const savedDefaults = localStorage.getItem("mm-defaults");
    const savedLang = localStorage.getItem("mm-lang") as Lang | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedDefaults) {
      const defaults = JSON.parse(savedDefaults) as string[];
      setDefaultAttendees(defaults);
      setAttendees(defaults);
    }
    if (savedLang) setLang(savedLang);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("mm-theme", next);
  }

  function openSettings() {
    setPrevStep(step);
    setStep("settings");
  }

  function closeSettings() {
    setStep(prevStep);
  }

  function addDefaultAttendee() {
    const name = defaultInput.trim();
    if (name && !defaultAttendees.includes(name)) {
      const updated = [...defaultAttendees, name];
      setDefaultAttendees(updated);
      localStorage.setItem("mm-defaults", JSON.stringify(updated));
      setDefaultInput("");
    }
  }

  function removeDefaultAttendee(i: number) {
    const updated = defaultAttendees.filter((_, idx) => idx !== i);
    setDefaultAttendees(updated);
    localStorage.setItem("mm-defaults", JSON.stringify(updated));
  }

  function importICS(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const unfolded = text.replace(/\r?\n[ \t]/g, "");
      const lines = unfolded.split(/\r?\n/);
      const get = (key: string) => {
        const re = new RegExp(`^${key}(?:;[^:]*)?:(.*)`, "i");
        for (const l of lines) { const m = l.match(re); if (m) return m[1].trim(); }
        return "";
      };
      const summary = get("SUMMARY").replace(/\\,/g, ",").replace(/\\n/g, " ");
      const names = new Set<string>();
      for (const l of lines) {
        const m = l.match(/^(?:ATTENDEE|ORGANIZER)(?:;[^:]*)?CN="?([^";:]+)"?/i);
        if (m) { const name = m[1].trim(); if (name && !/mailto:/i.test(name)) names.add(name); }
      }
      if (summary) setMeetingName(summary);
      const newAttendees = [...attendees];
      names.forEach((name) => { if (!newAttendees.includes(name)) newAttendees.push(name); });
      setAttendees(newAttendees);
      setIcsImported(true);
    };
    reader.readAsText(file);
    if (icsInputRef.current) icsInputRef.current.value = "";
  }

  function addAttendee() {
    const name = attendeeInput.trim();
    if (name && !attendees.includes(name)) {
      setAttendees([...attendees, name]);
      setAttendeeInput("");
    }
  }

  function removeAttendee(i: number) {
    setAttendees(attendees.filter((_, idx) => idx !== i));
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
    mediaRecorder.current.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      await transcribeAudio(new Blob(audioChunks.current, { type: "audio/webm" }));
    };
    mediaRecorder.current.start();
    setRecordSeconds(0);
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    setStep("recording");
  }

  async function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorder.current?.stop();
    setStep("processing");
  }

  async function transcribeAudio(audioBlob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const res = await fetch("/api/tools/meeting-transcribe", { method: "POST", body: formData });
      const { text, error } = await res.json();
      if (error) throw new Error(error);
      setTranscript(text);
      setStep("review");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Transcriptie mislukt");
      setStep("error");
    }
  }

  async function generateNotes() {
    setStep("generating");
    try {
      const res = await fetch("/api/tools/meeting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, attendees, meetingName, lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNotes(data);
      setStep("result");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Notulen genereren mislukt");
      setStep("error");
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  function copyAll() {
    if (!notes) return;
    const isNl = lang === "nl";
    const lines = [
      `# ${notes._meta?.title}`, `${notes._meta?.date} · ${notes._meta?.time}`, "",
      `## ${isNl ? "Samenvatting" : "Summary"}`, notes.samenvatting || notes.summary || "", "",
      `## ${isNl ? "Aanwezigen" : "Attendees"}`,
      ...(notes.aanwezigen || notes.attendees || []).map((a) => `- ${a}`), "",
      `## ${isNl ? "Besproken punten" : "Topics"}`,
      ...(notes.besproken_punten || notes.topics || []).map((t) => `- ${t}`), "",
      `## ${isNl ? "Beslissingen" : "Decisions"}`,
      ...(notes.beslissingen || notes.decisions || []).map((d) => `- ${d}`), "",
      `## ${isNl ? "Actiepunten" : "Action items"}`,
      ...(notes.actiepunten || notes.actions || []).map((a) =>
        isNl ? `- ${(a as { actie: string; wie: string; wanneer: string }).actie} (${(a as { actie: string; wie: string; wanneer: string }).wie}, ${(a as { actie: string; wie: string; wanneer: string }).wanneer})`
             : `- ${(a as { action: string; who: string; when: string }).action} (${(a as { action: string; who: string; when: string }).who}, ${(a as { action: string; who: string; when: string }).when})`
      ), "",
      `## ${isNl ? "Volgende vergadering" : "Next meeting"}`,
      notes.volgende_vergadering || notes.next_meeting || "",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setStep("setup");
    setTranscript("");
    setNotes(null);
    setErrorMsg("");
    setRecordSeconds(0);
    setMeetingName("");
    setIcsImported(false);
    setAttendees([...defaultAttendees]);
  }

  const isNl = lang === "nl";
  const isDark = theme === "dark";

  const bg = isDark ? "bg-gray-900" : "bg-gray-50";
  const card = isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900";
  const input = isDark
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500";
  const label = isDark ? "text-gray-300" : "text-gray-700";
  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const chip = isDark ? "bg-blue-900 text-blue-200" : "bg-blue-50 text-blue-700";
  const btnSecondary = isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700";

  return (
    <div className={`min-h-screen ${bg}`}>
      <nav className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className={`${muted} hover:text-gray-900 text-sm`}>← Dashboard</Link>
          <span className={`${isDark ? "text-gray-600" : "text-gray-300"}`}>|</span>
          <span className={`font-semibold text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>📝 Meeting Memo</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`text-lg px-2 py-1 rounded-lg ${btnSecondary}`} title={isNl ? "Thema wisselen" : "Toggle theme"}>
            {isDark ? "☀️" : "🌙"}
          </button>
          {step !== "settings" && (
            <button onClick={openSettings} className={`text-lg px-2 py-1 rounded-lg ${btnSecondary}`} title={isNl ? "Instellingen" : "Settings"}>
              ⚙️
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className={`${card} rounded-2xl shadow-lg p-8`}>

          {/* SETUP */}
          {step === "setup" && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold mb-1">Meeting Memo</h1>
                <p className={`text-sm ${muted}`}>{isNl ? "Neem je vergadering op en ontvang automatisch notulen. Kost 1 credit." : "Record your meeting and receive automatic notes. Costs 1 credit."}</p>
              </div>

              <div className="flex gap-2">
                {(["nl", "en"] as Lang[]).map((l) => (
                  <button key={l} onClick={() => { setLang(l); localStorage.setItem("mm-lang", l); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${lang === l ? "bg-blue-600 text-white border-blue-600" : `${isDark ? "border-gray-600 text-gray-300 hover:border-blue-400" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}`}>
                    {l === "nl" ? "Nederlands" : "English"}
                  </button>
                ))}
              </div>

              {/* ICS import */}
              <div>
                <input ref={icsInputRef} type="file" accept=".ics" className="hidden" onChange={importICS} />
                <button onClick={() => icsInputRef.current?.click()}
                  className={`w-full py-2 rounded-lg text-sm font-medium border-2 border-dashed transition-colors ${isDark ? "border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-400" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"} ${icsImported ? "border-green-400 text-green-600" : ""}`}>
                  {icsImported ? `✓ ${isNl ? "Agenda geïmporteerd" : "Calendar imported"}` : `📅 ${isNl ? "Importeer .ics agenda bestand" : "Import .ics calendar file"}`}
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium ${label} mb-1`}>{isNl ? "Naam vergadering" : "Meeting name"}</label>
                <input type="text" value={meetingName} onChange={(e) => setMeetingName(e.target.value)}
                  placeholder={isNl ? "bijv. Teamoverleg mei" : "e.g. Team meeting May"}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`} />
              </div>

              <div>
                <label className={`block text-sm font-medium ${label} mb-1`}>{isNl ? "Deelnemers (optioneel)" : "Attendees (optional)"}</label>
                <div className="flex gap-2">
                  <input type="text" value={attendeeInput} onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAttendee()}
                    placeholder={isNl ? "Naam toevoegen..." : "Add name..."}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`} />
                  <button onClick={addAttendee} className={`${btnSecondary} rounded-lg px-3 py-2 text-sm font-medium`}>+</button>
                </div>
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attendees.map((a, i) => (
                      <span key={i} className={`${chip} text-xs px-3 py-1 rounded-full flex items-center gap-1`}>
                        {a}<button onClick={() => removeAttendee(i)} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={startRecording} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-medium transition-colors">
                {isNl ? "Start opname" : "Start recording"}
              </button>
            </div>
          )}

          {/* SETTINGS */}
          {step === "settings" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <button onClick={closeSettings} className={`text-sm ${muted} hover:text-blue-500`}>← {isNl ? "Terug" : "Back"}</button>
                <h2 className="text-lg font-bold">{isNl ? "Instellingen" : "Settings"}</h2>
              </div>

              <div>
                <label className={`block text-sm font-medium ${label} mb-2`}>{isNl ? "Standaard deelnemers" : "Default attendees"}</label>
                <p className={`text-xs ${muted} mb-3`}>{isNl ? "Deze deelnemers worden automatisch ingevuld bij elke vergadering." : "These attendees are automatically added to every meeting."}</p>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={defaultInput} onChange={(e) => setDefaultInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDefaultAttendee()}
                    placeholder={isNl ? "Naam toevoegen..." : "Add name..."}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`} />
                  <button onClick={addDefaultAttendee} className={`${btnSecondary} rounded-lg px-3 py-2 text-sm font-medium`}>+</button>
                </div>
                {defaultAttendees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {defaultAttendees.map((a, i) => (
                      <span key={i} className={`${chip} text-xs px-3 py-1 rounded-full flex items-center gap-1`}>
                        {a}<button onClick={() => removeDefaultAttendee(i)} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${label} mb-2`}>{isNl ? "Thema" : "Theme"}</label>
                <div className="flex gap-2">
                  {(["light", "dark"] as Theme[]).map((t) => (
                    <button key={t} onClick={() => { setTheme(t); localStorage.setItem("mm-theme", t); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${theme === t ? "bg-blue-600 text-white border-blue-600" : `${isDark ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600"}`}`}>
                      {t === "light" ? `☀️ ${isNl ? "Licht" : "Light"}` : `🌙 ${isNl ? "Donker" : "Dark"}`}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={closeSettings} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                {isNl ? "Opslaan & sluiten" : "Save & close"}
              </button>
            </div>
          )}

          {/* RECORDING */}
          {step === "recording" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <h2 className="text-lg font-bold">{isNl ? "Opname bezig..." : "Recording..."}</h2>
              <div className="w-24 h-24 rounded-full bg-red-500 animate-pulse flex items-center justify-center text-white text-2xl">🎙️</div>
              <p className="text-3xl font-mono">{formatTime(recordSeconds)}</p>
              <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-8 py-3 text-sm font-medium transition-colors">
                {isNl ? "Stop opname" : "Stop recording"}
              </button>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${muted}`}>{isNl ? "Audio wordt verwerkt..." : "Processing audio..."}</p>
            </div>
          )}

          {/* REVIEW */}
          {step === "review" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{isNl ? "Transcript controleren" : "Review transcript"}</h2>
              <p className={`text-sm ${muted}`}>{isNl ? "Pas het transcript aan indien nodig, daarna genereer je de notulen." : "Adjust the transcript if needed, then generate the notes."}</p>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={10}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${input}`} />
              <div className="flex gap-3">
                <button onClick={generateNotes} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {isNl ? "Genereer notulen" : "Generate notes"}
                </button>
                <button onClick={reset} className={`px-4 ${btnSecondary} rounded-lg py-2 text-sm font-medium transition-colors`}>
                  {isNl ? "Opnieuw" : "Reset"}
                </button>
              </div>
            </div>
          )}

          {/* GENERATING */}
          {step === "generating" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${muted}`}>{isNl ? "Notulen worden gegenereerd..." : "Generating notes..."}</p>
            </div>
          )}

          {/* RESULT */}
          {step === "result" && notes && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{notes._meta?.title}</h2>
                  <p className={`text-xs ${muted}`}>{notes._meta?.date} · {notes._meta?.time}</p>
                </div>
                <button onClick={copyAll} className={`text-sm px-3 py-1 rounded-lg border transition-colors ${copied ? "bg-green-50 text-green-600 border-green-200" : `${isDark ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}`}>
                  {copied ? "✓ Gekopieerd" : isNl ? "Kopieer alles" : "Copy all"}
                </button>
              </div>
              {(notes.samenvatting || notes.summary) && <Section icon="📋" title={isNl ? "Samenvatting" : "Summary"} color="blue" dark={isDark}><p>{notes.samenvatting || notes.summary}</p></Section>}
              {(notes.aanwezigen || notes.attendees || []).length > 0 && <Section icon="👥" title={isNl ? "Aanwezigen" : "Attendees"} color="purple" dark={isDark}><ul>{(notes.aanwezigen || notes.attendees || []).map((a, i) => <li key={i}>• {a}</li>)}</ul></Section>}
              {(notes.besproken_punten || notes.topics || []).length > 0 && <Section icon="💬" title={isNl ? "Besproken punten" : "Topics"} color="green" dark={isDark}><ul>{(notes.besproken_punten || notes.topics || []).map((t, i) => <li key={i}>• {t}</li>)}</ul></Section>}
              {(notes.beslissingen || notes.decisions || []).length > 0 && <Section icon="✅" title={isNl ? "Beslissingen" : "Decisions"} color="yellow" dark={isDark}><ul>{(notes.beslissingen || notes.decisions || []).map((d, i) => <li key={i}>• {d}</li>)}</ul></Section>}
              {(notes.actiepunten || notes.actions || []).length > 0 && (
                <Section icon="⚡" title={isNl ? "Actiepunten" : "Action items"} color="orange" dark={isDark}>
                  <ul>
                    {isNl ? (notes.actiepunten || []).map((a, i) => <li key={i}>• <strong>{a.wie}</strong>: {a.actie} <span className="opacity-60">({a.wanneer})</span></li>)
                          : (notes.actions || []).map((a, i) => <li key={i}>• <strong>{a.who}</strong>: {a.action} <span className="opacity-60">({a.when})</span></li>)}
                  </ul>
                </Section>
              )}
              {(notes.volgende_vergadering || notes.next_meeting) && <Section icon="📅" title={isNl ? "Volgende vergadering" : "Next meeting"} color="gray" dark={isDark}><p>{notes.volgende_vergadering || notes.next_meeting}</p></Section>}
              <button onClick={reset} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors mt-2">
                {isNl ? "Nieuwe vergadering" : "New meeting"}
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
              <p className="text-red-500 font-medium">{isNl ? "Er is iets misgegaan" : "Something went wrong"}</p>
              <p className={`text-sm ${muted}`}>{errorMsg}</p>
              <button onClick={reset} className={`${btnSecondary} rounded-lg px-6 py-2 text-sm font-medium transition-colors`}>
                {isNl ? "Probeer opnieuw" : "Try again"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ icon, title, color, dark, children }: { icon: string; title: string; color: string; dark: boolean; children: React.ReactNode }) {
  const light: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100 text-blue-800", purple: "bg-purple-50 border-purple-100 text-purple-800",
    green: "bg-green-50 border-green-100 text-green-800", yellow: "bg-yellow-50 border-yellow-100 text-yellow-800",
    orange: "bg-orange-50 border-orange-100 text-orange-800", gray: "bg-gray-50 border-gray-100 text-gray-700",
  };
  const darkColors: Record<string, string> = {
    blue: "bg-blue-900/30 border-blue-800 text-blue-200", purple: "bg-purple-900/30 border-purple-800 text-purple-200",
    green: "bg-green-900/30 border-green-800 text-green-200", yellow: "bg-yellow-900/30 border-yellow-800 text-yellow-200",
    orange: "bg-orange-900/30 border-orange-800 text-orange-200", gray: "bg-gray-700/30 border-gray-600 text-gray-300",
  };
  const cls = dark ? darkColors[color] : light[color];
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <h3 className="text-sm font-semibold mb-2">{icon} {title}</h3>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}
