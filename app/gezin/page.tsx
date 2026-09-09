import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";
import DemoSection from "./components/DemoSection";

export const metadata = {
  title: "NooitMeerPostKwijt — Nooit meer een document kwijt",
  description: "Scan een brief, factuur of aanslag en vind elk document terug in seconden. NooitMeerPostKwijt herkent wat het is, wat er gedaan moet worden en bewaart het automatisch in jouw OneDrive, Dropbox of Google Drive.",
};

export const revalidate = 60;

export default async function GezinLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dossier");

  const admin = createAdminClient();
  const { count: foundingCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("promo_code", "founding25");

  const max = 25;
  const used = foundingCount ?? 0;
  const remaining = Math.max(0, max - used);

  return (
    <div className="min-h-screen bg-white">
      {/* Launch banner */}
      {remaining > 0 && (
        <div className="bg-amber-500 text-white text-sm text-center px-4 py-2.5 font-medium">
          🎉 Founding members krijgen 6 maanden gratis —{" "}
          <Link href="/launch" className="underline font-semibold hover:text-amber-100 transition-colors">
            nog {remaining} van de 25 plekken vrij →
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <NMMPKLogo href="/" size="lg" />
        <div className="flex gap-2 items-center">
          <Link href="/inloggen" className="text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            Inloggen
          </Link>
          <Link
            href="/aanmelden"
            className="text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Gratis proberen
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="flex flex-col lg:flex-row items-center gap-12 pt-12 pb-16">
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Nooit meer<br />een document<br />kwijt.
            </h1>
            <p className="text-lg text-gray-500 mb-6 leading-relaxed">
              Scan een brief, factuur of aanslag. NooitMeerPostKwijt herkent automatisch wat het is en wat je moet doen — inclusief deadline. Alles altijd terugvindbaar in je eigen cloud.
            </p>
            <p className="text-base text-gray-700 font-medium mb-8 leading-relaxed">
              En die stapel papier in je kast? Scan hem één keer en je vindt elk document terug in seconden.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/aanmelden"
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors shadow-sm text-center"
              >
                Gratis beginnen →
              </Link>
              <Link
                href="/inloggen"
                className="inline-block text-gray-600 hover:text-gray-900 font-medium text-base px-7 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-center"
              >
                Inloggen
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-3">Eerste maand gratis · geen creditcard nodig · opzegbaar wanneer je wil</p>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&q=80&auto=format&fit=crop"
              alt="Bureau met stapels papieren en documenten"
              className="w-full rounded-3xl shadow-lg object-cover aspect-[4/3]"
            />
          </div>
        </div>

        {/* Pijn — wat kost het je? */}
        <div className="py-14 border-t border-gray-100">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Herkenbaar?</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">Wat kost je het als je niets doet?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title: "Tijd kwijt aan zoeken",
                desc: "Een halve avond door een stapel papier spitten om één document te vinden. Garantiebewijs, polis, brief — je weet dat je het ergens hebt.",
              },
              {
                icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                title: "Stress als je iets nodig hebt",
                desc: "Je hebt een document nodig en weet niet meer waar het is. Verzekeringspolissen, contracten, correspondentie — het kost altijd meer tijd dan het zou moeten.",
              },
              {
                icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                title: "Gemiste deadlines",
                desc: "Een aanmaning die je niet hebt gezien. Een bezwaartermijn die is verlopen. Kwijtgeraakte post kost soms meer dan je denkt.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-5">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">Start gratis met <strong className="text-gray-600">10 scans</strong> — credits koop je bij als je ze nodig hebt.</p>
        </div>

        {/* Hoe het werkt */}
        <div className="py-16 border-t border-gray-100">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Zo werkt het</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">Drie stappen, klaar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Scan of forward",
                desc: "Maak een foto van de brief, upload een PDF, of forward een e-mail met bijlage rechtstreeks naar je persoonlijke scanadres.",
              },
              {
                num: "02",
                title: "NooitMeerPostKwijt analyseert",
                desc: "NooitMeerPostKwijt leest het document, herkent de afzender, het type en of er iets gedaan moet worden — inclusief deadline.",
              },
              {
                num: "03",
                title: "Altijd terugvindbaar",
                desc: "Het document gaat naar de juiste map in jouw OneDrive of Dropbox. Zoek later op afzender, datum of onderwerp — in seconden.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-5">
                <span className="text-3xl font-extrabold text-amber-200 leading-none select-none">{item.num}</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <img src="/process-flow.svg" alt="Zo werkt NooitMeerPostKwijt: upload, AI-analyse, resultaat, cloud-opslag" className="w-full max-w-4xl mx-auto block" />
          </div>
        </div>

        {/* Interactieve demo */}
        <DemoSection />

        {/* Features */}
        <div className="py-16 border-t border-gray-100">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Mogelijkheden</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">Alles wat je nodig hebt</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6 max-w-3xl mx-auto">
            {[
              { title: "Automatisch archiveren", desc: "Documenten gaan direct naar de juiste map in je OneDrive of Dropbox — ingedeeld per entiteit en onderwerp." },
              { title: "Acties en deadlines bijhouden", desc: "Deadlines en openstaande acties worden automatisch herkend en bijgehouden in je actielijst." },
              { title: "Meerdere personen", desc: "Koppel documenten aan jezelf, je partner of andere huisgenoten — elk in een eigen map." },
              { title: "Doorsturen via e-mail", desc: "Forward een factuur of brief rechtstreeks naar je persoonlijke scanadres — werkt ook vanuit Gmail of Outlook.", },
              { title: "Jouw cloud, jouw data", desc: "Documenten staan in je eigen OneDrive of Dropbox — niet op onze servers. Privé en veilig." },
              { title: "Zoeken en terugvinden", desc: "Vind elk document terug via het archief. Zoek op afzender, onderwerp of datum — in seconden.", link: undefined },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-amber-400 font-bold mt-0.5 flex-shrink-0">—</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{f.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-12 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <blockquote className="bg-gray-50 rounded-2xl p-6 relative">
              <span className="text-5xl text-amber-200 font-serif leading-none absolute -top-3 left-4 select-none">&ldquo;</span>
              <p className="text-sm text-gray-700 leading-relaxed italic pt-3">
                Mijn boekhouder vroeg om de oorspronkelijke aanslag VPB. Vroeger betekende dat een uur spitten door een stapel papier in mijn kast. Nu zoek ik het op en heb het in tien seconden.
              </p>
              <footer className="mt-4 text-xs text-gray-400 font-medium not-italic">
                — Marco, eigenaar van een BV
              </footer>
            </blockquote>

            <blockquote className="bg-gray-50 rounded-2xl p-6 relative">
              <span className="text-5xl text-amber-200 font-serif leading-none absolute -top-3 left-4 select-none">&ldquo;</span>
              <p className="text-sm text-gray-700 leading-relaxed italic pt-3">
                Ik ging mijn auto verkopen en kon de brief van het RDW met de tenaamstellingscode niet snel genoeg vinden. Uiteindelijk heb ik maar een nieuwe code aangeschaft bij het RDW. Achteraf zo zonde.
              </p>
              <footer className="mt-4 text-xs text-gray-400 font-medium not-italic">
                — Marco, eigenaar van een BV
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-3xl mx-auto py-16 border-t border-gray-100 text-center">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2">Prijzen</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Betaal alleen wat je gebruikt</h2>
          <p className="text-gray-500 text-sm mb-10">10 gratis scans bij aanmelding — geen creditcard nodig. Daarna credits kopen als je meer nodig hebt. Credits vervallen nooit.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-left">
            {[
              { label: "25 scans", price: "€2,49", per: "€0,10 per scan", desc: "Af en toe een document" },
              { label: "100 scans", price: "€7,99", per: "€0,08 per scan", desc: "Regelmatig gebruik", popular: true },
              { label: "300 scans", price: "€19,99", per: "€0,07 per scan", desc: "Intensief gebruik" },
            ].map((b) => (
              <div key={b.label} className={`rounded-2xl p-5 relative ${b.popular ? "bg-amber-500 text-white shadow-md" : "bg-gray-50 text-gray-900"}`}>
                {b.popular && <span className="absolute -top-3 left-5 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">Meest gekozen</span>}
                <p className={`font-bold text-xl mb-0.5 ${b.popular ? "text-white" : "text-gray-900"}`}>{b.price}</p>
                <p className={`text-sm font-semibold mb-1 ${b.popular ? "text-amber-100" : "text-amber-600"}`}>{b.label}</p>
                <p className={`text-xs mb-2 ${b.popular ? "text-amber-200" : "text-gray-400"}`}>{b.per}</p>
                <p className={`text-sm ${b.popular ? "text-amber-50" : "text-gray-500"}`}>{b.desc}</p>
              </div>
            ))}
          </div>

          <Link href="/aanmelden" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors">
            Gratis starten met 10 scans →
          </Link>
          <p className="text-xs text-gray-400 mt-4">Betaal via iDEAL, creditcard of Bancontact · Prijzen incl. BTW</p>
        </div>

        {/* Privacy */}
        <div className="max-w-2xl mx-auto mb-10 py-10 border-t border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">Jouw documenten, alleen voor jou</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Belastingaanslagen, contracten en facturen zijn vertrouwelijk. Je foto wordt naar de analyse-API gestuurd, verwerkt, en daarna door zowel ons als Anthropic automatisch verwijderd. Anthropic gebruikt API-verzoeken nooit voor training. Wat wij bewaren is alleen het resultaat — nooit de afbeelding zelf, en nooit specifieke bedragen of rekeningnummers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Documenten opgeslagen in jouw eigen OneDrive of Dropbox</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>De foto verdwijnt na de analyse — bij ons én bij Anthropic</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Geen bedragen of rekeningnummers in de database — alleen afzender, type en datum</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Download of wis al je data zelf — geen e-mail aan ons nodig</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-20 border-t border-gray-100 pt-14">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Stop met zoeken. Begin vandaag.</h2>
          <p className="text-gray-500 text-sm mb-7">Maak een gratis account aan en scan je eerste document.</p>
          <Link
            href="/aanmelden"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-sm"
          >
            Gratis account aanmaken →
          </Link>
          <p className="text-xs text-gray-400 mt-3">Eerste maand gratis · geen creditcard nodig · opzegbaar wanneer je wil</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 space-x-3">
        <span>© {new Date().getFullYear()} NooitMeerPostKwijt · Business XL · KvK 50418041</span>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-600 underline">Privacyverklaring</Link>
        <span>·</span>
        <Link href="/veiligheid" className="hover:text-gray-600 underline">Veiligheid &amp; Privacy FAQ</Link>
        <span>·</span>
        <Link href="/disclaimer" className="hover:text-gray-600 underline">Disclaimer</Link>
        <span>·</span>
        <Link href="/voorwaarden" className="hover:text-gray-600 underline">Algemene Voorwaarden</Link>
        <span>·</span>
        <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="hover:text-gray-600 underline">Contact</a>
      </footer>
    </div>
  );
}
