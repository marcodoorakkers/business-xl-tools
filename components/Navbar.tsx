"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar({ credits, isAdmin = false }: { credits: number; isAdmin?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-bold text-gray-900 text-lg">Business XL Tools</Link>
      <div className="flex items-center gap-4">
        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
          {credits} credits
        </span>
        {isAdmin && (
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
        )}
        <Link href="/account" className="text-sm text-gray-600 hover:text-gray-900">Account</Link>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">Uitloggen</button>
      </div>
    </nav>
  );
}
