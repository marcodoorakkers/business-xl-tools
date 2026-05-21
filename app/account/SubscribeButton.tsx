"use client";

import { useState } from "react";

export default function SubscribeButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
    >
      {loading ? "Laden..." : "Maandelijks starten voor €4,99/mnd →"}
    </button>
  );
}
