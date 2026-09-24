"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";
import HCaptcha from "@hcaptcha/react-hcaptcha";

type LoginStep = "credentials" | "mfa" | "biometric";

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";
const BIOMETRIC_KEY = "biometric_login_enabled";

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

  useEffect(() => {
    checkBiometricLogin();
  }, []);

  async function checkBiometricLogin() {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (localStorage.getItem(BIOMETRIC_KEY) !== "true") return;

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
      const { isAvailable } = await BiometricAuth.checkBiometry();
      if (!isAvailable) return;

      setStep("biometric");
      try {
        await BiometricAuth.authenticate({ reason: "Inloggen bij NooitMeerPostKwijt" });
        await redirectAfterLogin(supabase);
      } catch {
        setStep("credentials");
      }
    } catch {
      // Plugin niet beschikbaar of fout — gewone login tonen
    }
  }

  async function enableBiometricIfAvailable() {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
      const { isAvailable } = await BiometricAuth.checkBiometry();
      if (isAvailable) localStorage.setItem(BIOMETRIC_KEY, "true");
    } catch {
      // Niet beschikbaar
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (HCAPTCHA_SITE_KEY && !captchaToken) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken ?? undefined },
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

    await redirectAfterLogin(supabase, true);
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

    await redirectAfterLogin(supabase, true);
  }

  async function redirectAfterLogin(supabase: ReturnType<typeof createClient>, enableBiometric = false) {
    if (enableBiometric) await enableBiometricIfAvailable();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, credits")
        .eq("id", user.id)
        .single();
      const hasAccess =
        profile?.subscription_status === "active" ||
        profile?.subscription_status === "trialing" ||
        (profile?.credits ?? 0) > 0;
      router.push(hasAccess ? "/dossier" : "/account");
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
                <div className="text-center text-sm mt-1">
                  <Link href="/auth/forgot-password" className="text-gray-400 hover:text-amber-600">Wachtwoord vergeten?</Link>
                </div>
              </form>
            </>
          )}

          {step === "biometric" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="text-5xl">
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C9.38 2 7 3.56 7 6v1.09A5 5 0 0 0 7 17v.91C7 20.44 9.38 22 12 22s5-1.56 5-4.09V17a5 5 0 0 0 0-9.91V6c0-2.44-2.38-4-5-4z"/>
                  <path d="M12 8v8M9 11l3-3 3 3"/>
                </svg>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Face ID</h1>
                <p className="text-gray-500 text-sm">Bezig met inloggen…</p>
              </div>
              <button
                onClick={() => setStep("credentials")}
                className="text-sm text-gray-400 hover:text-gray-600 mt-2"
              >
                Wachtwoord gebruiken
              </button>
            </div>
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

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Nog geen account?{" "}
            <Link href="/aanmelden" className="text-amber-600 font-medium hover:underline">Gratis beginnen →</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
