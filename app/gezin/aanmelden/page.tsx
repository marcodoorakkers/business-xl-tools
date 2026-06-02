"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export default function GezinRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }

    setLoading(true);
    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `https://nooitmeerpostkwijt.nl/dossier` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <NMMPKLogo size="lg" />
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Controleer je inbox</h1>
            <p className="text-sm text-gray-600 mb-4">We hebben je een bevestigingsmail gestuurd. Klik op de link om je account te activeren — je eerste maand is gratis.</p>
            <Link href="/inloggen" className="text-sm text-amber-600 hover:underline font-medium">Terug naar inloggen</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <NMMPKLogo href="/" size="lg" />
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Account aanmaken</h1>
          <p className="text-gray-500 text-sm mb-6">Eerste maand gratis · geen creditcard nodig</p>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Minimaal 8 tekens"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig wachtwoord</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              {loading ? "Bezig..." : "Account aanmaken"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Al een account?{" "}
              <Link href="/inloggen" className="text-amber-600 hover:underline">Inloggen</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
