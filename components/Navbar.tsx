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
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-xl">⚡</span>
        <span className="font-bold text-gray-900 text-lg">TimeSaver<span className="text-blue-600">Tools</span></span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
          ⚡ {credits} credits
        </span>
        {isAdmin && (
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">Admin</Link>
        )}
        <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">Account</Link>
        <button onClick={handleLogout} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-xl transition-colors">Uitloggen</button>
      </div>
    </nav>
  );
}
