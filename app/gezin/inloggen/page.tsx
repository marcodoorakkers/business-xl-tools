"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";
import HCaptcha from "@hcaptcha/react-hcaptcha";

type LoginStep = "credentials" | "mfa";

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

export default function GezinLoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!captchaToken) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);

    if (signInError) {
      setError("E-mailadres of wachtwoord is onjuist.");
      setLoading(false);
      return;
    }

    // Check of MFA vereist is
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        setFactorId(totp.id);
        setStep("mfa");
        setLoading(false);
        return;
      }
    }

    await redirectAfterLogin(supabase);
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || mfaCode.length !== 6) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: mfaCode });
    if (error) {
      setError("Code onjuist — probeer opnieuw.");
      setMfaCode("");
      setLoading(false);
      return;
    }

    await redirectAfterLogin(supabase);
  }

  async function redirectAfterLogin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      router.push(profile?.subscription_status ? "/dossier" : "/account");
    } else {
      router.push("/dossier");
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <NMMPKLogo size="lg" />
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-8">

          {step === "credentials" && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Inloggen</h1>
              <p className="text-gray-500 text-sm mb-6">Welkom terug!</p>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="jij@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {HCAPTCHA_SITE_KEY && (
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                    theme="light"
                  />
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || (!!HCAPTCHA_SITE_KEY && !captchaToken)}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  {loading ? "Bezig..." : "Inloggen"}
                </button>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <Link href="/auth/forgot-password" className="hover:text-amber-600">Wachtwoord vergeten?</Link>
                  <Link href="/aanmelden" className="hover:text-amber-600">Account aanmaken</Link>
                </div>
              </form>
            </>
          )}

          {step === "mfa" && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => { setStep("credentials"); setError(""); }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Terug</button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Verificatie</h1>
              <p className="text-gray-500 text-sm mb-6">Voer de 6-cijferige code in uit je authenticator-app.</p>
              <form onSubmit={handleMfa} className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  {loading ? "Controleren..." : "Bevestigen"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
