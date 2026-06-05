"use client";

import { useEffect, useState } from "react";
import AutoCheckout from "./AutoCheckout";

export default function AutoCheckoutWrapper({ priceId }: { priceId: string }) {
  const [hasPromo, setHasPromo] = useState(false);

  useEffect(() => {
    const urlPromo = new URLSearchParams(window.location.search).get("promo");
    const localPromo = localStorage.getItem("nmpk_promo");
    if (urlPromo || localPromo) setHasPromo(true);
  }, []);

  if (!hasPromo) return null;
  return <AutoCheckout priceId={priceId} />;
}
