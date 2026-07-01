"use client";

import { useEffect, useState } from "react";
import AutoCheckoutWrapper from "./AutoCheckoutWrapper";
import SubscribeButton from "@/app/account/SubscribeButton";

export default function NativeSubscribeSection({ priceId }: { priceId: string }) {
  const [isNative, setIsNative] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    import("@capacitor/core")
      .then(({ Capacitor }) => { setIsNative(Capacitor.isNativePlatform()); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  if (isNative) {
    return (
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span>⭐</span>
          <h2 className="font-bold text-gray-900 text-lg">Maandelijks abonnement</h2>
        </div>
        <p className="text-gray-500 text-sm mb-1">Onbeperkt scannen · opzegbaar wanneer je wil</p>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl font-extrabold text-gray-900">€3,99</span>
          <span className="text-gray-400 text-sm">/maand na proefperiode</span>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-medium mb-1">Aanmelden via browser</p>
          <p className="text-amber-700 text-sm">
            Ga naar <span className="font-semibold">nooitmeerpostkwijt.nl</span> in Safari om een gratis proefmaand te starten. Daarna kun je de app direct gebruiken.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AutoCheckoutWrapper priceId={priceId} />
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span>⭐</span>
          <h2 className="font-bold text-gray-900 text-lg">Maandelijks abonnement</h2>
        </div>
        <p className="text-gray-500 text-sm mb-1">Onbeperkt scannen · opzegbaar wanneer je wil</p>
        <p className="text-amber-600 text-sm font-semibold mb-4">Eerste maand gratis — geen creditcard nodig</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-extrabold text-gray-900">€3,99</span>
            <span className="text-gray-400 text-sm ml-1">/maand na proefperiode</span>
          </div>
          <SubscribeButton priceId={priceId} />
        </div>
      </div>
    </>
  );
}
