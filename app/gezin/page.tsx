import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";
import DemoSection from "./components/DemoSection";

export const metadata = {
  title: "NooitMeerPostKwijt — Digitaal archief voor ZZP'ers en kleine ondernemers",
  description: "Scan je zakelijke post en vind elk document terug in seconden. AI herkent wat het is, wat er moet gebeuren en bewaart het automatisch in jouw OneDrive of Dropbox.",
};

export default function GezinLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <NMMPKLogo href="/" size="lg" />
        <div className="flex gap-2 items-center">
          <Link href="/inloggen" className="hidden sm:block text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors px-3 py-2">
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
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-4">Voor ZZP&apos;ers en kleine ondernemers</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Ergens in<br />die stapel zit<br />wat je zoekt.
            </h1>
            <p className="text-lg text-gray-500 mb-6 leading-relaxed">
              Je boekhouder wil de aanslag VPB van vorig jaar. Je verzekeraar vraagt om het contract. Je bank wil bewijs van betaling. Elke keer opnieuw: spitten door een stapel papier en hopen dat het document ertussen zit.
            </p>
            <p className="text-base text-gray-700 font-medium mb-8 leading-relaxed">
              NooitMeerPostKwijt maakt een einde aan het zoeken. Scan je post zodra hij binnenkomt — de app herkent alles, slaat het op in jouw cloud en herinnert je aan deadlines.
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
            <p className="text-xs text-gray-400 mt-3">Eerste maand gratis · geen creditcard nodig · zakelijk aftrekbaar</p>
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
                icon: "🕐",
                title: "Uren kwijt aan zoeken",
                desc: "Minimaal twee keer per jaar een uur door papier spitten. Bij een uurtarief van €75 is dat €150 per jaar — alleen maar om iets terug te vinden.",
              },
              {
                icon: "😬",
                title: "Stress bij de aangifte",
                desc: "Je boekhouder vraagt om documenten die je nu niet kunt vinden. Je belt terug met \"ik stuur het nog even op\" — en dan begint het zoeken.",
              },
              {
                icon: "💸",
                title: "Gemiste deadlines",
                desc: "Een aanmaning die je niet hebt gezien. Een bezwaartermijn die is verlopen. Kwijtgeraakte post kost soms meer dan je denkt.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-5">
                <p className="text-2xl mb-3">{item.icon}</p>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">NooitMeerPostKwijt kost je <strong className="text-gray-600">€3,99 per maand</strong> — zakelijk aftrekbaar. En je bent nooit meer iets kwijt.</p>
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
                title: "AI analyseert",
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
              { title: "Personen én entiteiten", desc: "Koppel documenten aan jezelf, je BV, je eenmanszaak of je partner — elk in een eigen map." },
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

        {/* Pricing */}
        <div className="max-w-3xl mx-auto py-16 border-t border-gray-100 text-center">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2">Prijzen</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Minder dan één uur zoeken per jaar</h2>
          <p className="text-gray-500 text-sm mb-10">Eerste maand gratis, daarna €3,99/maand. Geen creditcard nodig om te starten. Zakelijk aftrekbaar.</p>

          <div className="bg-amber-500 rounded-2xl p-7 text-left text-white mb-5 relative shadow-md">
            <span className="absolute -top-3 left-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">Eerste maand gratis</span>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-1">Maandelijks abonnement</h3>
                <p className="text-amber-100 text-sm mb-4">50 scans per maand · geen creditcard nodig · opzegbaar wanneer je wil</p>
                <div className="text-sm text-amber-50 space-y-1">
                  <p>50 scans per maand</p>
                  <p>OneDrive &amp; Dropbox</p>
                  <p>Personen en entiteiten koppelen</p>
                  <p>Zakelijk aftrekbaar</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-extrabold">€3,99</p>
                  <p className="text-amber-200 text-sm">/maand na proefperiode</p>
                </div>
                <Link href="/aanmelden" className="bg-white text-amber-600 hover:bg-amber-50 font-bold py-2.5 px-6 rounded-xl text-sm transition-colors whitespace-nowrap">
                  Gratis starten →
                </Link>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">Betaal via iDEAL, creditcard of Bancontact · Opzegbaar wanneer je wil</p>
        </div>

        {/* Privacy */}
        <div className="max-w-2xl mx-auto mb-10 py-10 border-t border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">Jouw documenten, alleen voor jou</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Belastingaanslagen, contracten en facturen zijn vertrouwelijk. Daarom bewaren we niets op onze eigen servers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Documenten opgeslagen in jouw eigen OneDrive of Dropbox</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Scans worden tijdelijk verwerkt voor analyse, daarna verwijderd</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Alleen de analyse (categorie, acties) wordt opgeslagen</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Je kunt al je data op elk moment volledig verwijderen</p>
          </div>
        </div>

        {/* Knipoog */}
        <div className="max-w-2xl mx-auto mb-10 py-8 px-6 bg-amber-50 rounded-2xl border border-amber-100 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="text-lg mr-1">😉</span> Overigens ook gewoon handig thuis — voor iedereen die de stapel op de keukentafel wil opruimen.
          </p>
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
          <p className="text-xs text-gray-400 mt-3">Eerste maand gratis · geen creditcard nodig · zakelijk aftrekbaar</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 space-x-3">
        <span>© {new Date().getFullYear()} NooitMeerPostKwijt · Business XL · KvK 50418041</span>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-600 underline">Privacyverklaring</Link>
        <span>·</span>
        <Link href="/disclaimer" className="hover:text-gray-600 underline">Disclaimer</Link>
        <span>·</span>
        <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="hover:text-gray-600 underline">Contact</a>
      </footer>
    </div>
  );
}
