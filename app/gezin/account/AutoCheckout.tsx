"use client";

import { useEffect, useState } from "react";

export default function AutoCheckout({ priceId }: { priceId: string }) {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCheckout() {
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
          setError(data.error ?? "Onbekende fout — probeer opnieuw.");
          setStatus("error");
        }
      } catch {
        setError("Verbindingsfout — probeer opnieuw.");
        setStatus("error");
      }
    }

    startCheckout();
  }, [priceId]);

  if (status === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
        {error}
        <button
          onClick={() => { setStatus("loading"); setError(null); }}
          className="ml-3 underline font-medium"
        >
          Opnieuw proberen
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
