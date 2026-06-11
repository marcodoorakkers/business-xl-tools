"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }

    setLoading(true);
    const { error } = await createClient().auth.updateUser({
      password,
      nonce: current,
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("same password")) {
        setError("Nieuw wachtwoord mag niet hetzelfde zijn als het huidige.");
      } else if (error.message.toLowerCase().includes("weak")) {
        setError("Wachtwoord is te zwak. Gebruik hoofdletters, cijfers en leestekens.");
      } else if (error.message.toLowerCase().includes("reauthentication")) {
        setError("Je sessie is verlopen. Log opnieuw in en probeer het opnieuw.");
      } else if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("incorrect")) {
        setError("Huidig wachtwoord is onjuist.");
      } else {
        setError("Er ging iets mis. Probeer het opnieuw.");
      }
    } else {
      setSuccess(true);
      setCurrent("");
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Huidig wachtwoord"
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nieuw wachtwoord (min. 8 tekens)"
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Bevestig nieuw wachtwoord"
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">Wachtwoord succesvol gewijzigd!</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
      >
        {loading ? "Bezig..." : "Wachtwoord wijzigen"}
      </button>
    </form>
  );
}
