"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Kon portal niet openen");
      }
    } catch {
      setError("Verbindingsfout — probeer opnieuw");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleManage}
        disabled={loading}
        className="mt-3 bg-white border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-gray-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
      >
        {loading ? "Laden..." : "Abonnement beheren →"}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
