"use client";

import { useEffect, useState } from "react";
import type { PurchasesStoreProduct } from "@revenuecat/purchases-typescript-internal-esm";

interface Props {
  priceId25: string;
  priceId100: string;
  priceId300: string;
}

const PRODUCT_IDS = [
  { id: "nl.nooitmeerpostkwijt.credits.25",  label: "25 scans",  description: "Af en toe een document", popular: false },
  { id: "nl.nooitmeerpostkwijt.credits.100", label: "100 scans", description: "Regelmatig gebruik",     popular: true  },
  { id: "nl.nooitmeerpostkwijt.credits.300", label: "300 scans", description: "Intensief gebruik",      popular: false },
];

export default function NativeBuyCreditsSection({ priceId25, priceId100, priceId300 }: Props) {
  const [isNative, setIsNative] = useState(false);
  const [checked, setChecked] = useState(false);
  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState("nl.nooitmeerpostkwijt.credits.100");

  const webPriceIds = { priceId25, priceId100, priceId300 };

  useEffect(() => {
    let native = false;
    import("@capacitor/core")
      .then(({ Capacitor }) => { native = Capacitor.isNativePlatform(); setIsNative(native); })
      .catch(() => {})
      .finally(async () => {
        setChecked(true);
        if (!native) return;
        try {
          const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
          await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
          await Purchases.configure({
            apiKey: process.env.NEXT_PUBLIC_REVENUECAT_API_KEY!,
          });
          const { products: storeProducts } = await Purchases.getProducts({
            productIdentifiers: PRODUCT_IDS.map(p => p.id),
          });
          setProducts(storeProducts);
        } catch (e) {
          console.error("RevenueCat init error", e);
        }
      });
  }, []);

  async function handleIAPBuy(productId: string) {
    setLoading(productId);
    setError(null);
    setSuccess(null);
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const storeProduct = products.find(p => p.identifier === productId)!;
      const { customerInfo } = await Purchases.purchaseStoreProduct({
        product: storeProduct,
      });
      // Notify our server to credit the user
      const res = await fetch("/api/iap/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          originalAppUserId: customerInfo.originalAppUserId,
        }),
      });
      if (res.ok) {
        const credits = productId.endsWith(".25") ? 25 : productId.endsWith(".100") ? 100 : 300;
        setSuccess(`${credits} credits bijgeschreven!`);
        // Refresh the page to show new credit balance
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError("Aankoop geslaagd, maar credits konden niet worden bijgeschreven. Neem contact op.");
      }
    } catch (e: unknown) {
      const msg = (e as { userCancelled?: boolean })?.userCancelled ? null : "Aankoop mislukt. Probeer het opnieuw.";
      if (msg) setError(msg);
    } finally {
      setLoading(null);
    }
  }

  async function handleWebBuy(priceId: string) {
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-gray-900 mb-1">Credits kopen</h2>
        <p className="text-sm text-gray-500 mb-4">Credits vervallen nooit.</p>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {PRODUCT_IDS.map((p) => {
            const storeProduct = products.find(sp => sp.identifier === p.id);
            const priceLabel = storeProduct?.priceString ?? "…";
            const isSelected = selected === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${isSelected ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-gray-50"}`}
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.description}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleIAPBuy(p.id); }}
                  disabled={!storeProduct || loading === p.id}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                >
                  {loading === p.id ? "…" : priceLabel}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">Betaling via Apple. Credits worden direct bijgeschreven.</p>
      </div>
    );
  }

  // Web / browser: Stripe checkout
  const webBundles = [
    { label: "25 scans",  description: "Af en toe een document", priceId: webPriceIds.priceId25,  price: "€2,99" },
    { label: "100 scans", description: "Regelmatig gebruik",     priceId: webPriceIds.priceId100, price: "€7,99" },
    { label: "300 scans", description: "Intensief gebruik",      priceId: webPriceIds.priceId300, price: "€19,99" },
  ];
  const webSelected = selected === "nl.nooitmeerpostkwijt.credits.25" ? webPriceIds.priceId25
    : selected === "nl.nooitmeerpostkwijt.credits.300" ? webPriceIds.priceId300
    : webPriceIds.priceId100;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="font-bold text-gray-900 mb-1">Credits kopen</h2>
      <p className="text-sm text-gray-500 mb-4">Credits vervallen nooit.</p>
      <div className="flex flex-col gap-3">
        {webBundles.map((b) => {
          const isSelected = webSelected === b.priceId;
          return (
            <div
              key={b.priceId}
              onClick={() => {
                const id = b.priceId === webPriceIds.priceId25 ? "nl.nooitmeerpostkwijt.credits.25"
                  : b.priceId === webPriceIds.priceId300 ? "nl.nooitmeerpostkwijt.credits.300"
                  : "nl.nooitmeerpostkwijt.credits.100";
                setSelected(id);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${isSelected ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-gray-50"}`}
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
                <p className="text-xs text-gray-500">{b.description}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleWebBuy(b.priceId); }}
                disabled={!b.priceId || loading === b.priceId}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                {loading === b.priceId ? "…" : b.price}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
