"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type State = "loading" | "disabled" | "enrolling" | "verifying" | "enabled" | "unenrolling";

export default function TwoFactorSection() {
  const [state, setState] = useState<State>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setState("enabled");
      } else {
        setState("disabled");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startEnroll() {
    setState("enrolling");
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "NooitMeerPostKwijt",
    });
    if (error || !data) { setError("Inschrijven mislukt."); setState("disabled"); return; }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setState("verifying");
  }

  async function verifyEnroll() {
    if (!factorId || code.length !== 6) return;
    setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) { setError("Code onjuist — probeer opnieuw."); setCode(""); return; }
    setState("enabled");
    setQrCode(null);
    setSecret(null);
    setCode("");
  }

  async function unenroll() {
    if (!factorId) return;
    setState("unenrolling");
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { setError("Uitschakelen mislukt."); setState("enabled"); return; }
    setFactorId(null);
    setState("disabled");
  }

  if (state === "loading") return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-900">Twee-staps verificatie</h2>
        {state === "enabled" && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Aan</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Gebruik een authenticator-app (zoals Google Authenticator of Authy) als extra beveiligingslaag bij het inloggen.
      </p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {state === "disabled" && (
        <button
          onClick={startEnroll}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          2FA inschakelen
        </button>
      )}

      {state === "verifying" && qrCode && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Scan de QR-code met je authenticator-app:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="2FA QR-code" className="w-40 h-40 border border-gray-200 rounded-xl" />
          {secret && (
            <p className="text-xs text-gray-400">
              Of voer handmatig in: <span className="font-mono text-gray-600 select-all">{secret}</span>
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Bevestig met code uit de app</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") verifyEnroll(); }}
                placeholder="123456"
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
              />
              <button
                onClick={verifyEnroll}
                disabled={code.length !== 6}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Bevestigen
              </button>
              <button
                onClick={() => { setState("disabled"); setQrCode(null); setCode(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 px-2 transition-colors"
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {state === "enabled" && (
        <button
          onClick={unenroll}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          2FA uitschakelen
        </button>
      )}

      {state === "unenrolling" && (
        <p className="text-sm text-gray-400">Bezig met uitschakelen…</p>
      )}
    </div>
  );
}
