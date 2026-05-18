"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";

type Step = "setup" | "recording" | "processing" | "review" | "generating" | "result" | "error";
type Lang = "nl" | "en";

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
  const [lang, setLang] = useState<Lang>("nl");
  const [meetingName, setMeetingName] = useState("");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    mediaRecorder.current.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      await transcribeAudio(audioBlob);
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
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function copyAll() {
    if (!notes) return;
    const isNl = lang === "nl";
    const lines = [
      `# ${notes._meta?.title}`,
      `${notes._meta?.date} · ${notes._meta?.time}`,
      "",
      `## ${isNl ? "Samenvatting" : "Summary"}`,
      notes.samenvatting || notes.summary || "",
      "",
      `## ${isNl ? "Aanwezigen" : "Attendees"}`,
      ...(notes.aanwezigen || notes.attendees || []).map((a) => `- ${a}`),
      "",
      `## ${isNl ? "Besproken punten" : "Topics"}`,
      ...(notes.besproken_punten || notes.topics || []).map((t) => `- ${t}`),
      "",
      `## ${isNl ? "Beslissingen" : "Decisions"}`,
      ...(notes.beslissingen || notes.decisions || []).map((d) => `- ${d}`),
      "",
      `## ${isNl ? "Actiepunten" : "Action items"}`,
      ...(notes.actiepunten || notes.actions || []).map((a) =>
        isNl ? `- ${(a as { actie: string; wie: string; wanneer: string }).actie} (${(a as { actie: string; wie: string; wanneer: string }).wie}, ${(a as { actie: string; wie: string; wanneer: string }).wanneer})` : `- ${(a as { action: string; who: string; when: string }).action} (${(a as { action: string; who: string; when: string }).who}, ${(a as { action: string; who: string; when: string }).when})`
      ),
      "",
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
    setAttendees([]);
  }

  const isNl = lang === "nl";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">📝 Meeting Memo</span>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* SETUP */}
          {step === "setup" && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Meeting Memo</h1>
                <p className="text-sm text-gray-500">Neem je vergadering op en ontvang automatisch notulen. Kost 1 credit.</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setLang("nl")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${lang === "nl" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>Nederlands</button>
                <button onClick={() => setLang("en")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${lang === "en" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>English</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isNl ? "Naam vergadering" : "Meeting name"}</label>
                <input
                  type="text"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  placeholder={isNl ? "bijv. Teamoverleg mei" : "e.g. Team meeting May"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isNl ? "Deelnemers (optioneel)" : "Attendees (optional)"}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAttendee()}
                    placeholder={isNl ? "Naam toevoegen..." : "Add name..."}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addAttendee} className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium">+</button>
                </div>
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attendees.map((a, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        {a}
                        <button onClick={() => removeAttendee(i)} className="hover:text-red-500">×</button>
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

          {/* RECORDING */}
          {step === "recording" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">{isNl ? "Opname bezig..." : "Recording..."}</h2>
              <div className="w-24 h-24 rounded-full bg-red-500 animate-pulse flex items-center justify-center text-white text-2xl">🎙️</div>
              <p className="text-3xl font-mono text-gray-700">{formatTime(recordSeconds)}</p>
              <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-8 py-3 text-sm font-medium transition-colors">
                {isNl ? "Stop opname" : "Stop recording"}
              </button>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{isNl ? "Audio wordt verwerkt..." : "Processing audio..."}</p>
            </div>
          )}

          {/* REVIEW */}
          {step === "review" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-gray-900">{isNl ? "Transcript controleren" : "Review transcript"}</h2>
              <p className="text-sm text-gray-500">{isNl ? "Pas het transcript aan indien nodig, daarna genereer je de notulen." : "Adjust the transcript if needed, then generate the notes."}</p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={generateNotes} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {isNl ? "Genereer notulen" : "Generate notes"}
                </button>
                <button onClick={reset} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">
                  {isNl ? "Opnieuw" : "Reset"}
                </button>
              </div>
            </div>
          )}

          {/* GENERATING */}
          {step === "generating" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{isNl ? "Notulen worden gegenereerd..." : "Generating notes..."}</p>
            </div>
          )}

          {/* RESULT */}
          {step === "result" && notes && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{notes._meta?.title}</h2>
                  <p className="text-xs text-gray-400">{notes._meta?.date} · {notes._meta?.time}</p>
                </div>
                <button onClick={copyAll} className={`text-sm px-3 py-1 rounded-lg border transition-colors ${copied ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
                  {copied ? "✓ Gekopieerd" : "Kopieer alles"}
                </button>
              </div>

              {(notes.samenvatting || notes.summary) && (
                <Section icon="📋" title={isNl ? "Samenvatting" : "Summary"} color="blue">
                  <p>{notes.samenvatting || notes.summary}</p>
                </Section>
              )}

              {(notes.aanwezigen || notes.attendees || []).length > 0 && (
                <Section icon="👥" title={isNl ? "Aanwezigen" : "Attendees"} color="purple">
                  <ul>{(notes.aanwezigen || notes.attendees || []).map((a, i) => <li key={i}>• {a}</li>)}</ul>
                </Section>
              )}

              {(notes.besproken_punten || notes.topics || []).length > 0 && (
                <Section icon="💬" title={isNl ? "Besproken punten" : "Topics"} color="green">
                  <ul>{(notes.besproken_punten || notes.topics || []).map((t, i) => <li key={i}>• {t}</li>)}</ul>
                </Section>
              )}

              {(notes.beslissingen || notes.decisions || []).length > 0 && (
                <Section icon="✅" title={isNl ? "Beslissingen" : "Decisions"} color="yellow">
                  <ul>{(notes.beslissingen || notes.decisions || []).map((d, i) => <li key={i}>• {d}</li>)}</ul>
                </Section>
              )}

              {(notes.actiepunten || notes.actions || []).length > 0 && (
                <Section icon="⚡" title={isNl ? "Actiepunten" : "Action items"} color="orange">
                  <ul>
                    {isNl
                      ? (notes.actiepunten || []).map((a, i) => <li key={i}>• <strong>{a.wie}</strong>: {a.actie} <span className="text-gray-400">({a.wanneer})</span></li>)
                      : (notes.actions || []).map((a, i) => <li key={i}>• <strong>{a.who}</strong>: {a.action} <span className="text-gray-400">({a.when})</span></li>)
                    }
                  </ul>
                </Section>
              )}

              {(notes.volgende_vergadering || notes.next_meeting) && (
                <Section icon="📅" title={isNl ? "Volgende vergadering" : "Next meeting"} color="gray">
                  <p>{notes.volgende_vergadering || notes.next_meeting}</p>
                </Section>
              )}

              <button onClick={reset} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors mt-2">
                {isNl ? "Nieuwe vergadering" : "New meeting"}
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
              <p className="text-red-600 font-medium">{isNl ? "Er is iets misgegaan" : "Something went wrong"}</p>
              <p className="text-sm text-gray-500">{errorMsg}</p>
              <button onClick={reset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm font-medium transition-colors">
                {isNl ? "Probeer opnieuw" : "Try again"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100", purple: "bg-purple-50 border-purple-100",
    green: "bg-green-50 border-green-100", yellow: "bg-yellow-50 border-yellow-100",
    orange: "bg-orange-50 border-orange-100", gray: "bg-gray-50 border-gray-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.gray}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{icon} {title}</h3>
      <div className="text-sm text-gray-600 space-y-1">{children}</div>
    </div>
  );
}
