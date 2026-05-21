"use client";

import { useState } from "react";

export default function CancelSubscriptionButton({ periodEnd }: { periodEnd?: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/cancel-subscription", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-gray-700">
        <p className="mb-3">
          Weet je het zeker? Je credits blijven staan maar je ontvangt geen nieuwe credits meer
          {formattedDate ? ` na ${formattedDate}` : ""}.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {loading ? "Bezig..." : "Ja, opzeggen"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-gray-600 hover:text-gray-900 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors mt-3 underline underline-offset-2"
    >
      Abonnement opzeggen
    </button>
  );
}
