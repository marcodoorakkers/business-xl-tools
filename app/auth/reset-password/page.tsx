"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset(e: React.FormEvent) {
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
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (error.message.toLowerCase().includes("weak")) {
        setError("Wachtwoord is te zwak. Gebruik hoofdletters, cijfers en leestekens.");
      } else if (error.message.toLowerCase().includes("same password")) {
        setError("Nieuw wachtwoord mag niet hetzelfde zijn als het huidige.");
      } else {
        setError("Er ging iets mis. Probeer het opnieuw.");
      }
      setLoading(false);
      return;
    }

    // Redirect op basis van accounttype
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      router.push(profile?.subscription_status ? "/dossier" : "/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <AuthCard title="Nieuw wachtwoord instellen">
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nieuw wachtwoord</label>
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
          {loading ? "Bezig..." : "Wachtwoord opslaan"}
        </button>
      </form>
    </AuthCard>
  );
}
