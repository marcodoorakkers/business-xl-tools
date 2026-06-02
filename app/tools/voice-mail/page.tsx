"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ToolNav from "@/components/ToolNav";

type Step = "idle" | "recording" | "processing" | "preview" | "translating" | "saving" | "saved" | "error";

const LANGUAGES = [
  { code: "nl", label: "🇳🇱 Nederlands" },
  { code: "en", label: "🇬🇧 English" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "es", label: "🇪🇸 Español" },
];

export default function VoiceMailPage() {
  const [step, setStep] = useState<Step>("idle");
  const [language, setLanguage] = useState("nl");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [transcript, setTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    mediaRecorder.current = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 32000,
    });
    audioChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    mediaRecorder.current.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const audioBlob = new Blob(audioChunks.current, { type: mimeType || "audio/webm" });
      await processAudio(audioBlob);
    };
    mediaRecorder.current.start(1000);
    setStep("recording");
  }

  function stopRecording() {
    mediaRecorder.current?.stop();
    setStep("processing");
  }

  async function processAudio(audioBlob: Blob) {
    try {
      const ext = audioBlob.type.includes("mp4") ? "mp4" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording.${ext}`);

      const transcribeRes = await fetch("/api/tools/transcribe", { method: "POST", body: formData });
      const { text, error: transcribeError } = await transcribeRes.json();
      if (transcribeError) throw new Error(transcribeError);
      setTranscript(text);

      const generateRes = await fetch("/api/tools/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, language }),
      });
      const { subject: s, body: b, error: generateError } = await generateRes.json();
      if (generateError) throw new Error(generateError);

      setSubject(s);
      setBody(b);
      setStep("preview");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  async function retranslate(newLanguage: string) {
    if (newLanguage === language) return;
    setLanguage(newLanguage);
    setStep("translating");
    try {
      const res = await fetch("/api/tools/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language: newLanguage, retranslate: true }),
      });
      const { subject: s, body: b, error: generateError } = await res.json();
      if (generateError) throw new Error(generateError);
      setSubject(s);
      setBody(b);
      setStep("preview");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Vertalen mislukt");
      setStep("error");
    }
  }

  async function saveDraft() {
    setStep("saving");
    try {
      const res = await fetch("/api/tools/voice-mail/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, transcript, language }),
      });
      const { error } = await res.json();
      if (error) throw new Error(error);
      setStep("saved");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Opslaan mislukt");
      setStep("error");
    }
  }

  function reset() {
    setStep("idle");
    setSubject("");
    setBody("");
    setTranscript("");
    setErrorMsg("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolNav label="🎙️ Voice Mail Draft" />

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-xl font-bold text-gray-900">Voice Mail Draft</h1>
            <Link href="/tools/voice-mail/concepten" className="text-xs text-blue-600 hover:underline font-medium">
              Mijn concepten →
            </Link>
          </div>
          <p className="text-gray-500 text-sm mb-6">Spreek in wat je wilt mailen — het concept wordt opgeslagen in je account. Kost 2 credits.</p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uitvoertaal van de mail
              {step === "preview" && (
                <span className="ml-2 text-xs font-normal text-blue-500">— kies een andere taal om opnieuw te genereren</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => step === "preview" ? retranslate(lang.code) : setLanguage(lang.code)}
                  disabled={step === "recording" || step === "processing" || step === "translating" || step === "saving"}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 ${
                    language === lang.code
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {(step === "idle" || step === "recording") && (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={step === "idle" ? startRecording : stopRecording}
                className={`w-24 h-24 rounded-full text-white font-semibold text-sm shadow-md transition-all
                  ${step === "recording"
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {step === "recording" ? "Stop" : "Inspreken"}
              </button>
              {step === "recording" && (
                <p className="text-sm text-red-500">Opname bezig... klik op Stop als je klaar bent.</p>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Bezig met verwerken...</p>
            </div>
          )}

          {step === "preview" && (
            <div className="flex flex-col gap-4">
              <div>
                <button onClick={() => setShowTranscript(!showTranscript)} className="text-xs text-blue-500 hover:underline mb-2">
                  {showTranscript ? "Verberg transcriptie" : "Toon ruwe transcriptie"}
                </button>
                {showTranscript && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">{transcript}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onderwerp</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bericht</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={saveDraft}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  Opslaan als concept
                </button>
                <button onClick={reset}
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">
                  Opnieuw
                </button>
              </div>
            </div>
          )}

          {step === "translating" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Mail vertalen...</p>
            </div>
          )}

          {step === "saving" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Concept opslaan...</p>
            </div>
          )}

          {step === "saved" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-800 font-semibold">Concept opgeslagen</p>
              <p className="text-sm text-gray-500">Kopieer hem straks vanuit je conceptenlijst naar je mailprogramma.</p>
              <div className="flex gap-3 mt-2">
                <button onClick={reset}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
                  Nog een inspreken
                </button>
                <Link href="/tools/voice-mail/concepten"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-5 py-2 text-sm font-medium transition-colors">
                  Naar concepten →
                </Link>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
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
