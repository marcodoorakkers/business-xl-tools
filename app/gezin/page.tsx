import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = {
  title: "NooitMeerPostKwijt — Digitaal archief voor ZZP'ers en kleine ondernemers",
  description: "Scan je zakelijke post en vind elk document terug in seconden. NooitMeerPostKwijt herkent wat het is, wat er moet gebeuren en bewaart het automatisch in jouw OneDrive of Dropbox.",
};

export const revalidate = 60; // teller elke minuut vers

export default async function GezinLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dossier");

  // Live teller founding25
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
            <span className="text-2xl">🎉</span>
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

        {/* Persoonlijk verhaal */}
        <div className="mt-12 space-y-6 text-gray-700 leading-relaxed">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Hoe één verloren brief van de RDW leidde tot dit.
          </h1>

          <p>
            Begin januari ontving ik een brief van de RDW. Tenminste — dat bleek later. Ik had hem ergens neergelegd, vergeten, en drie weken later een boete in de bus. Voor iets wat ik had kunnen voorkomen als ik die brief op tijd had gezien.
          </p>

          <p>
            Ik ben ZZP'er. Mijn administratie is niet ingewikkeld, maar wél verspreid. Brieven op het aanrecht, facturen in mijn mail, polissen ergens in een map die ik al maanden niet heb geopend. Ik zocht een app die gewoon deed wat ik nodig had: <strong>scan een document, weet wat erin staat, en vergeet het verder.</strong>
          </p>

          <p>
            Die app bestond niet. Dus bouwde ik hem zelf — elke avond na mijn werk, in de avonduren. Vijf maanden later is NooitMeerPostKwijt er.
          </p>

          <p>
            Je maakt een foto van een brief of stuurt een PDF door. De app herkent automatisch wat het is, wie de afzender is, of er iets van je verwacht wordt en wanneer. Het document wordt opgeslagen in jouw eigen OneDrive of Dropbox, in de juiste map. Klaar.
          </p>

          <p className="text-gray-500 italic">
            — Marco Doorakkers, maker van NooitMeerPostKwijt
          </p>
        </div>

        {/* Wat je krijgt */}
        <div className="mt-12 bg-gray-50 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">Wat je krijgt als founding member</h2>
          <ul className="space-y-3">
            {[
              ["🎁", "6 maanden volledig gratis", "Geen creditcard nodig. Daarna €3,99/maand — opzegbaar wanneer je wil."],
              ["📬", "Onbeperkt scannen", "Via de app of door een document door te mailen naar je persoonlijke scanadres."],
              ["☁️", "Automatisch opslaan in OneDrive of Dropbox", "In de juiste map, met de juiste naam."],
              ["✅", "Actielijst", "Documenten waarbij iets van je verwacht wordt, verschijnen automatisch in je actielijst."],
              ["💬", "Directe lijn met de maker", "Feedback? Ik lees alles zelf en bouw actief door op wat ik hoor."],
            ].map(([icon, title, desc]) => (
              <li key={title as string} className="flex gap-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title as string}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc as string}</p>
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
