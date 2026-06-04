"use client";

import { useEffect, useState } from "react";

export default function PromoActiveerBanner() {
  const [promo, setPromo] = useState<string | null>(null);

  useEffect(() => {
    // Promo uit URL param (via e-mailbevestigingslink) of localStorage
    const urlPromo = new URLSearchParams(window.location.search).get("promo");
    if (urlPromo) {
      localStorage.setItem("nmpk_promo", urlPromo);
      setPromo(urlPromo);
    } else {
      setPromo(localStorage.getItem("nmpk_promo"));
    }
  }, []);

  if (promo !== "founding25") return null;

  return (
    <div className="bg-amber-500 text-white rounded-2xl p-5 flex gap-4 items-start">
      <span className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      </span>
      <div>
        <p className="font-bold text-sm">Activeer je 6 maanden gratis</p>
        <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
          Je Founding Member korting staat klaar — klik hieronder op <strong>&quot;Abonnement starten&quot;</strong> om hem te activeren. Geen creditcard nodig.
        </p>
      </div>
    </div>
  );
}
