"use client";

import { useState } from "react";

export default function SubscribeButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Onbekende fout — probeer opnieuw");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verbindingsfout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
      >
        {loading ? "Laden..." : "Starten →"}
      </button>
      {error && <p className="text-red-500 text-xs text-right">{error}</p>}
    </div>
  );
}
