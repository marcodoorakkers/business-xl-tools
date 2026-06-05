"use client";

import { useEffect, useState, useCallback } from "react";

export default function AutoCheckout({ priceId }: { priceId: string }) {
  const [status, setStatus] = useState<"loading" | "error" | "manual">("loading");
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const promoCode = new URLSearchParams(window.location.search).get("promo")
        ?? localStorage.getItem("nmpk_promo")
        ?? undefined;

      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, promoCode }),
      });
      const data = await res.json();
      if (data.url) {
        if (promoCode) localStorage.removeItem("nmpk_promo");
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Onbekende fout.");
        setStatus("error");
      }
    } catch {
      setError("Verbindingsfout.");
      setStatus("error");
    }
  }, [priceId]);

  useEffect(() => {
    startCheckout();
    // Timeout: als na 10s nog geen redirect, toon handmatige knop
    const t = setTimeout(() => setStatus((s) => s === "loading" ? "manual" : s), 10000);
    return () => clearTimeout(t);
  }, [startCheckout]);

  if (status === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 space-y-2">
        <p><strong>Activatie mislukt:</strong> {error}</p>
        <button onClick={startCheckout} className="underline font-medium">
          Opnieuw proberen
        </button>
      </div>
    );
  }

  if (status === "manual") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-amber-900">Activeer je 6 maanden gratis</p>
        <p className="text-xs text-amber-700">De doorstuur ging niet automatisch. Klik hieronder om verder te gaan.</p>
        <button
          onClick={startCheckout}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3 rounded-xl transition-colors"
        >
          Abonnement starten →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
      <div className="flex justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm font-semibold text-amber-900">Je 6 maanden gratis worden geactiveerd…</p>
      <p className="text-xs text-amber-700">Je wordt doorgestuurd naar de betalingspagina. Geen creditcard nodig.</p>
    </div>
  );
}
