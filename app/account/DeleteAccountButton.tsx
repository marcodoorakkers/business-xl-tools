"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/account/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        Account verwijderen
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-red-600 font-medium">Weet je het zeker? Dit kan niet ongedaan worden gemaakt.</p>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {loading ? "Bezig..." : "Ja, verwijder mijn account"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
