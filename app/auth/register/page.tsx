"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";

export default function RegisterPage() {
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
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
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
      <AuthCard title="Controleer je inbox" subtitle="We hebben je een bevestigingsmail gestuurd.">
        <p className="text-sm text-gray-600">Klik op de link in de mail om je account te activeren. Je ontvangt daarna automatisch 10 gratis credits.</p>
        <Link href="/auth/login" className="block mt-4 text-center text-sm text-blue-600 hover:underline">Terug naar inloggen</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Account aanmaken" subtitle="Start met 10 gratis credits">
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? "Bezig..." : "Account aanmaken"}
        </button>
        <p className="text-center text-sm text-gray-500">
          Al een account? <Link href="/auth/login" className="text-blue-600 hover:underline">Inloggen</Link>
        </p>
      </form>
    </AuthCard>
  );
}
