"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });
    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="Mail verstuurd" subtitle="Controleer je inbox">
        <p className="text-sm text-gray-600">Als dit e-mailadres bij ons bekend is, ontvang je een link om je wachtwoord te resetten.</p>
        <Link href="/auth/login" className="block mt-4 text-center text-sm text-blue-600 hover:underline">Terug naar inloggen</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Wachtwoord vergeten" subtitle="We sturen je een resetlink">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? "Bezig..." : "Resetlink versturen"}
        </button>
        <Link href="/auth/login" className="text-center text-sm text-gray-500 hover:text-blue-600">Terug naar inloggen</Link>
      </form>
    </AuthCard>
  );
}
