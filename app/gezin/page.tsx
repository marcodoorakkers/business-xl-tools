import Link from "next/link";

export const metadata = {
  title: "NooitMeerPostKwijt — Nooit meer een brief kwijt",
  description: "Scan je post. NooitMeerPostKwijt analyseert het document, herkent wat er moet gebeuren en houdt je acties bij.",
};

export default function GezinLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="font-extrabold text-xl text-amber-700">📬 NooitMeerPostKwijt</span>
        <div className="flex gap-3 items-center">
          <Link href="/inloggen" className="text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors">
            Inloggen
          </Link>
          <Link
            href="/aanmelden"
            className="text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Gratis proberen
          </Link>
        </div>
      </nav>

      {/* Hero — split layout */}
      <main className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 pt-12 pb-16">
          {/* Tekst */}
          <div className="flex-1 max-w-xl">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-4">Ken je dit moment?</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Nooit meer<br />een brief kwijt
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              De tenaamstellingscode van je auto. Het polisnummer van je zorgverzekeraar. De garantiebrief die je nú nodig hebt. Scan je post — NooitMeerPostKwijt herkent wat er in staat en bewaart alles automatisch op de juiste plek.
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
            <p className="text-xs text-gray-400 mt-3">Geen creditcard nodig · 10 gratis scans</p>
          </div>

          {/* Foto */}
          <div className="flex-1 w-full max-w-lg">
            <img
              src="https://images.unsplash.com/photo-1758523419018-b3a112f7f770?w=700&q=80&auto=format&fit=crop"
              alt="Iemand die post leest aan de keukentafel"
              className="w-full rounded-3xl shadow-lg object-cover aspect-[4/3]"
            />
            <p className="text-xs text-gray-300 mt-1.5 text-right">Foto: Vitaly Gariev / Unsplash</p>
          </div>
        </div>

        {/* Hoe het werkt */}
        <div className="py-16 border-t border-gray-100">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Zo werkt het</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">Drie stappen, klaar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Foto maken",
                desc: "Maak een foto van de brief of upload een PDF. Meerdere pagina's? Geen probleem.",
              },
              {
                num: "02",
                title: "Slim analyseren",
                desc: "NooitMeerPostKwijt leest het document, herkent de afzender en ziet of er iets gedaan moet worden.",
              },
              {
                num: "03",
                title: "Bijhouden",
                desc: "Het document gaat naar je eigen cloud. Acties verschijnen automatisch in jouw actielijst.",
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

        {/* Voorbeeldscan */}
        <div className="max-w-2xl mx-auto py-12 border-t border-gray-100">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Voorbeeld</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">Zie hoe het werkt</h2>
          <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
            Eén foto van je brief. Binnen seconden weet je wat het is en wat je moet doen.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Brief van Belastingdienst</p>
                <p className="text-xs text-gray-400">Aanslag inkomstenbelasting 2025 · 2 pagina&apos;s</p>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm my-3">↓ NooitMeerPostKwijt analyseert…</p>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">📁 Belastingen</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">👤 M. de Vries</span>
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">⚠️ Actie vereist</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li>— <strong>Actie:</strong> Bezwaar indienen vóór 15 augustus 2025</li>
                <li>— <strong>Bedrag:</strong> €1.247 te betalen</li>
                <li>— <strong>Deadline toegevoegd aan je actielijst</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-16 border-t border-gray-100">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Mogelijkheden</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">Altijd grip op je post</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6 max-w-3xl mx-auto">
            {[
              { title: "Automatisch archiveren", desc: "Documenten gaan direct naar de juiste map in je OneDrive of Dropbox." },
              { title: "Acties bijhouden", desc: "Deadlines en to-do's worden automatisch herkend en bijgehouden." },
              { title: "Meerdere personen", desc: "Koppel documenten aan een persoon — handig voor thuis of een klein bedrijf." },
              { title: "Werkt op je telefoon", desc: "Geen app te installeren — voeg de site toe aan je beginscherm en scan direct vanuit je broekzak.", link: "/mobiel" },
              { title: "Jouw cloud, jouw data", desc: "Documenten staan in je eigen OneDrive of Dropbox — niet op onze servers." },
              { title: "Zoeken en terugvinden", desc: "Vind elk document terug via het archief — zoek op afzender, onderwerp of datum." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-amber-400 font-bold mt-0.5 flex-shrink-0">—</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{f.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  {"link" in f && f.link && (
                    <Link href={f.link} className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors">
                      Zo werkt dat →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-3xl mx-auto py-16 border-t border-gray-100 text-center">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2">Prijzen</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Eenvoudig en transparant</h2>
          <p className="text-gray-500 text-sm mb-10">Start gratis. Kies een abonnement of koop scans wanneer je ze nodig hebt.</p>

          {/* Maandelijks abonnement */}
          <div className="bg-amber-500 rounded-2xl p-7 text-left text-white mb-5 relative shadow-md">
            <span className="absolute -top-3 left-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">Meest flexibel</span>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-1">Maandelijks abonnement</h3>
                <p className="text-amber-100 text-sm mb-4">50 scans per maand · automatisch verlengd · opzegbaar wanneer je wil</p>
                <div className="text-sm text-amber-50 space-y-1">
                  <p>50 scans elke maand</p>
                  <p>OneDrive &amp; Dropbox</p>
                  <p>Meerdere personen koppelen</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-extrabold">€3,99</p>
                  <p className="text-amber-200 text-sm">/maand</p>
                </div>
                <Link href="/aanmelden" className="bg-white text-amber-600 hover:bg-amber-50 font-bold py-2.5 px-6 rounded-xl text-sm transition-colors whitespace-nowrap">
                  Starten →
                </Link>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">Of koop scans eenmalig — verlopen nooit</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Gratis</h3>
              <p className="text-xs text-gray-400 mb-4">Probeer het uit</p>
              <p className="text-3xl font-extrabold text-gray-900 mb-4">€0</p>
              <div className="text-sm text-gray-500 space-y-1 mb-6">
                <p>10 scans bij aanmelding</p>
                <p>Slimme analyse</p>
                <p>Acties bijhouden</p>
              </div>
              <Link href="/aanmelden" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Gratis beginnen
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left">
              <h3 className="font-bold text-gray-900 text-lg mb-1">50 scans</h3>
              <p className="text-xs text-gray-400 mb-4">Genoeg voor een vol jaar</p>
              <p className="text-3xl font-extrabold text-gray-900 mb-0.5">€7,49</p>
              <p className="text-xs text-gray-400 mb-4">€0,15 per scan</p>
              <div className="text-sm text-gray-500 space-y-1 mb-6">
                <p>Verlopen nooit</p>
                <p>Alle functies</p>
                <p>OneDrive &amp; Dropbox</p>
              </div>
              <Link href="/account" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Kopen
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left relative">
              <span className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Beste prijs</span>
              <h3 className="font-bold text-gray-900 text-lg mb-1">200 scans</h3>
              <p className="text-xs text-gray-400 mb-4">Voor wie veel post ontvangt</p>
              <p className="text-3xl font-extrabold text-gray-900 mb-0.5">€19,99</p>
              <p className="text-xs text-gray-400 mb-4">€0,10 per scan</p>
              <div className="text-sm text-gray-500 space-y-1 mb-6">
                <p>Verlopen nooit</p>
                <p>Alle functies</p>
                <p>OneDrive &amp; Dropbox</p>
              </div>
              <Link href="/account" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Kopen
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-5">Betaal via iDEAL, creditcard of Bancontact.</p>
        </div>

        {/* Sociaal bewijs */}
        <div className="max-w-2xl mx-auto py-14 border-t border-gray-100 text-center">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-8">Wat gebruikers zeggen</p>
          <blockquote className="text-lg text-gray-700 font-medium leading-relaxed mb-4">
            &ldquo;Eindelijk weet ik waar al mijn belangrijke brieven zijn. Die ene brief van het RDW die ik al maanden zocht? Gevonden in twee seconden.&rdquo;
          </blockquote>
          <p className="text-sm text-gray-400">— Early adopter, gezin met 2 kinderen</p>
        </div>

        {/* Privacy */}
        <div className="max-w-2xl mx-auto mb-16 py-10 border-t border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">Jouw post, alleen voor jou</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Brieven van de Belastingdienst, je zorgverzekeraar of je bank zijn privé. Daarom bewaren we niets op onze eigen servers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Documenten opgeslagen in jouw eigen OneDrive of Dropbox</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Foto&apos;s worden tijdelijk verwerkt voor analyse, daarna verwijderd</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Alleen de analyse (categorie, acties) wordt opgeslagen</p>
            <p className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">—</span>Je kunt al je data op elk moment volledig verwijderen</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-20 border-t border-gray-100 pt-14">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Klaar om te beginnen?</h2>
          <p className="text-gray-500 text-sm mb-7">Maak een gratis account aan en scan je eerste brief.</p>
          <Link
            href="/aanmelden"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-sm"
          >
            Gratis account aanmaken →
          </Link>
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
        <a href="mailto:info@nooitmeerpostkwijt.nl" className="hover:text-gray-600 underline">Contact</a>
      </footer>
    </div>
  );
}
