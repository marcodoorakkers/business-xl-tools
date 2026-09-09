"use client";

import { useEffect, useState } from "react";

interface Props {
  priceId25: string;
  priceId100: string;
  priceId300: string;
}

const bundles = [
  { label: "25 scans", price: "€2,49", description: "Af en toe een document", priceKey: "priceId25" as const },
  { label: "100 scans", price: "€7,99", description: "Regelmatig gebruik", priceKey: "priceId100" as const, popular: true },
  { label: "300 scans", price: "€19,99", description: "Intensief gebruik", priceKey: "priceId300" as const },
];

export default function NativeBuyCreditsSection({ priceId25, priceId100, priceId300 }: Props) {
  const [isNative, setIsNative] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const priceIds = { priceId25, priceId100, priceId300 };

  useEffect(() => {
    import("@capacitor/core")
      .then(({ Capacitor }) => { setIsNative(Capacitor.isNativePlatform()); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  async function handleBuy(priceId: string) {
    setLoading(priceId);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  if (!checked) return null;

  if (isNative) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-amber-800 text-sm font-medium mb-1">Credits kopen via browser</p>
        <p className="text-amber-700 text-sm">
          Ga naar <span className="font-semibold">nooitmeerpostkwijt.nl</span> in Safari om scan-credits te kopen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="font-bold text-gray-900 mb-1">Credits kopen</h2>
      <p className="text-sm text-gray-500 mb-4">Credits vervallen nooit.</p>
      <div className="flex flex-col gap-3">
        {bundles.map((b) => {
          const priceId = priceIds[b.priceKey];
          return (
            <div
              key={b.priceKey}
              className={`flex items-center justify-between p-4 rounded-xl border ${b.popular ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-gray-50"}`}
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
                <p className="text-xs text-gray-500">{b.description}</p>
              </div>
              <button
                onClick={() => handleBuy(priceId)}
                disabled={!priceId || loading === priceId}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                {loading === priceId ? "…" : b.price}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
