import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = {
  title: "Founding members — NooitMeerPostKwijt",
  description: "6 maanden gratis als founding member. NooitMeerPostKwijt — digitaal archief voor ZZP'ers en kleine ondernemers.",
};

export const revalidate = 60;

export default async function LaunchPage() {

  const admin = createAdminClient();
  const { data: promo } = await admin
    .from("promo_codes")
    .select("uses, max_uses")
    .eq("code", "founding25")
    .single();

  const used = promo?.uses ?? 0;
  const max = promo?.max_uses ?? 25;
  const remaining = Math.max(0, max - used);
  const pct = Math.round((used / max) * 100);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto">
        <NMMPKLogo href="/" size="lg" />
        <Link href="/inloggen" className="text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors">
          Inloggen
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pb-20">

        {/* Founding banner */}
        {remaining > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
            <svg className="w-7 h-7 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Founding member — 6 maanden gratis
              </p>
              <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-amber-700 mt-1.5">
                {remaining === max
                  ? "Nog alle 25 plekken beschikbaar"
                  : `Nog ${remaining} van de ${max} plekken vrij`}
              </p>
            </div>
          </div>
        )}

        {/* Verhaal */}
        <div className="mt-12 space-y-6 text-gray-700 leading-relaxed">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Ontstaan uit ergernis. Gebouwd in de avonduren.
          </h1>

          <p>
            De tenaamstellingscode van de RDW — je hebt hem nodig als je je auto verkoopt. Die brief had er ergens moeten liggen. Na een halfuur zoeken door stapels papier: niet gevonden. Dus maar een nieuwe aangevraagd bij de RDW. Een paar euro, maar vooral: gewoon zonde.
          </p>

          <p>
            Als ZZP'er is je administratie niet ingewikkeld — maar wél verspreid. Brieven op het aanrecht, facturen in je mail, polissen in een map die je al maanden niet hebt geopend. Er was geen app die gewoon deed wat nodig was: <strong>scan een document, begrijp wat erin staat, sla het op de juiste plek op.</strong>
          </p>

          <p>
            Dus werd hij gebouwd. Sinds januari, stap voor stap, naast het gewone werk. NooitMeerPostKwijt is het resultaat.
          </p>

          <p>
            Je maakt een foto van een brief of stuurt een PDF door. De app herkent automatisch wat het is, of er iets van je verwacht wordt en wanneer. Het document gaat naar je eigen OneDrive of Dropbox, in de juiste map. Klaar.
          </p>
        </div>

        {/* Wat je krijgt */}
        <div className="mt-12 bg-gray-50 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">Wat je krijgt als founding member</h2>
          <ul className="space-y-4">
            {([
              {
                icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
                title: "6 maanden volledig gratis",
                desc: "Geen creditcard nodig. Daarna €3,99/maand — opzegbaar wanneer je wil.",
              },
              {
                icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 5l10 8 10-8"/></svg>,
                title: "Onbeperkt scannen",
                desc: "Via de app of door een document door te mailen naar je persoonlijke scanadres.",
              },
              {
                icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/><path d="M18 4l2 2-8 8-4-4 2-2 2 2z" style={{display:"none"}}/><polyline points="17 1 21 5 13 13 9 9"/></svg>,
                title: "Automatisch opslaan in OneDrive of Dropbox",
                desc: "In de juiste map, met de juiste naam.",
              },
              {
                icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
                title: "Actielijst met deadlines",
                desc: "Documenten waarbij iets van je verwacht wordt, verschijnen automatisch in je actielijst.",
              },
              {
                icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                title: "Directe lijn met de maker",
                desc: "Feedback? Er wordt actief mee gebouwd.",
              },
            ] as { icon: React.ReactNode; title: string; desc: string }[]).map(({ icon, title, desc }) => (
              <li key={title} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  {icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center space-y-4">
          {remaining > 0 ? (
            <>
              <Link
                href="/aanmelden?promo=founding25"
                className="inline-block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base px-8 py-4 rounded-2xl transition-colors shadow-sm"
              >
                Claim jouw plek — 6 maanden gratis →
              </Link>
              <p className="text-xs text-gray-400">
                Nog {remaining} {remaining === 1 ? "plek" : "plekken"} beschikbaar · geen creditcard nodig · zakelijk aftrekbaar
              </p>
            </>
          ) : (
            <>
              <Link
                href="/aanmelden"
                className="inline-block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base px-8 py-4 rounded-2xl transition-colors shadow-sm"
              >
                Gratis proberen — eerste maand cadeau →
              </Link>
              <p className="text-xs text-gray-400">
                De 25 founding-plekken zijn vergeven · eerste maand nog steeds gratis
              </p>
            </>
          )}
          <p className="text-xs text-gray-400">
            Al een account?{" "}
            <Link href="/inloggen" className="underline hover:text-gray-600">Inloggen</Link>
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center gap-6 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacyverklaring</Link>
          <Link href="/disclaimer" className="hover:text-gray-600 transition-colors">Disclaimer</Link>
          <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>

      </main>
    </div>
  );
}
