"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openCount, setOpenCount] = useState(0);
  const [hasOverdue, setHasOverdue] = useState(false);
  const [meerOpen, setMeerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tools/mijn-dossier/acties")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const open = data.filter((a: { status: string }) => a.status === "open");
        setOpenCount(open.length);
        setHasOverdue(open.some((a: { deadline: string | null }) =>
          a.deadline ? new Date(a.deadline).getTime() < Date.now() : false
        ));
      })
      .catch(() => {});
  }, [pathname]);

  const meerRoutes = ["/ideeen", "/dossier/instellingen", "/dossier/aan-de-slag", "/account", "/gezin/admin"];
  const meerActive = meerOpen || meerRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  function tabCls(active: boolean) {
    return `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
      active ? "text-amber-600" : "text-gray-400"
    }`;
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Scannen */}
        <Link
          href="/dossier"
          className={tabCls(pathname === "/dossier")}
          onClick={() => setMeerOpen(false)}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          <span className="text-[10px] font-medium">Scannen</span>
        </Link>

        {/* Documenten */}
        <Link
          href="/dossier/archief"
          className={tabCls(pathname === "/dossier/archief")}
          onClick={() => setMeerOpen(false)}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-[10px] font-medium">Documenten</span>
        </Link>

        {/* Acties */}
        <Link
          href="/acties"
          className={tabCls(pathname === "/acties" || pathname.startsWith("/acties/"))}
          onClick={() => setMeerOpen(false)}
        >
          <span className="relative">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {openCount > 0 && (
              <span className={`absolute -top-1 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full text-white ${
                hasOverdue ? "bg-red-500" : "bg-amber-400"
              }`}>
                {openCount > 9 ? "9+" : openCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">Acties</span>
        </Link>

        {/* Meer */}
        <button
          className={tabCls(meerActive)}
          onClick={() => setMeerOpen((v) => !v)}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
          </svg>
          <span className="text-[10px] font-medium">Meer</span>
        </button>
      </nav>

      {/* Meer bottom sheet */}
      {meerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setMeerOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4.5rem)" }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
            <div className="divide-y divide-gray-100">
              <SheetLink
                href="/ideeen"
                label="Ideeën"
                active={pathname === "/ideeen"}
                onClick={() => setMeerOpen(false)}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/>
                  </svg>
                }
              />
              <SheetLink
                href="/dossier/instellingen"
                label="Instellingen"
                active={pathname.startsWith("/dossier/instellingen")}
                onClick={() => setMeerOpen(false)}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                }
              />
              <SheetLink
                href="/account"
                label="Account"
                active={pathname === "/account"}
                onClick={() => setMeerOpen(false)}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                }
              />
              <SheetLink
                href="mailto:nooitmeerpostkwijt@business-xl.nl?subject=Feedback%20NooitMeerPostKwijt&body=Hoi%2C%0A%0AIk%20wil%20het%20volgende%20melden%3A%0A%0A"
                label="Feedback"
                active={false}
                onClick={() => setMeerOpen(false)}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                }
              />
            </div>
            <button
              onClick={async () => {
                setMeerOpen(false);
                await createClient().auth.signOut();
                router.push("/");
              }}
              className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="text-sm font-medium">Uitloggen</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

function SheetLink({
  href,
  label,
  active,
  onClick,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${
        active ? "text-amber-600" : "text-gray-700"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
    </Link>
  );
}
