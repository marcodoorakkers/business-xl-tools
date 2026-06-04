"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NMMPKLogo from "@/components/NMMPKLogo";
import { createClient } from "@/lib/supabase/client";

export default function DossierNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active ? "text-amber-600" : "text-gray-500 hover:text-amber-500"
        }`}
      >
        {label}
      </Link>
    );
  };

  const iconLink = (href: string, title: string, icon: React.ReactNode) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        title={title}
        className={`transition-colors ${active ? "text-amber-500" : "text-gray-400 hover:text-gray-600"}`}
      >
        {icon}
      </Link>
    );
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <NMMPKLogo iconOnly />
        <div className="flex items-center gap-4">
          {navLink("/acties", "Acties")}
          {navLink("/dossier/archief", "Documenten")}
          {navLink("/ideeen", "💡 Ideeën")}
          {iconLink("/dossier/aan-de-slag", "Aan de slag",
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          )}
          {iconLink("/dossier/instellingen", "Instellingen",
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
          {iconLink("/account", "Account",
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          )}
          <a
            href="mailto:nooitmeerpostkwijt@business-xl.nl?subject=Feedback%20NooitMeerPostKwijt&body=Hoi%2C%0A%0AIk%20wil%20het%20volgende%20melden%3A%0A%0A"
            className="text-xs text-gray-400 hover:text-amber-500 transition-colors"
            title="Feedback of probleem melden"
          >
            Feedback
          </a>
          <button
            onClick={async () => { await createClient().auth.signOut(); router.push("/"); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Uitloggen
          </button>
        </div>
      </div>
    </header>
  );
}
