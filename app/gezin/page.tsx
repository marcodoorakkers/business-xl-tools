import Link from "next/link";

export const metadata = {
  title: "NooitMeerPostKwijt — Nooit meer een brief mislopen",
  description: "Maak een foto van jullie post. AI analyseert het document, slaat het op en houdt acties bij. Voor het hele gezin.",
};

export default function GezinLandingPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <span className="font-extrabold text-xl text-amber-700">📬 NooitMeerPostKwijt</span>
        <div className="flex gap-3">
          <Link href="/inloggen" className="text-sm text-amber-800 font-medium hover:text-amber-600 transition-colors">
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

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6">
        <div className="text-center pt-16 pb-12">
          <div className="text-6xl mb-6">📬</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Nooit meer een brief kwijt
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Maak een foto van jullie post. AI leest het document, slaat het op in de juiste map en houdt bij welke acties er nodig zijn.
          </p>
          <Link
            href="/aanmelden"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-md"
          >
            Gratis beginnen →
          </Link>
          <p className="text-sm text-gray-400 mt-3">Geen creditcard nodig • 10 gratis scans</p>
        </div>

        {/* Hoe het werkt */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-12">
          {[
            {
              step: "1",
              icon: "📸",
              title: "Foto maken",
              desc: "Maak een foto van de brief of upload een PDF. Meerdere pagina's? Geen probleem.",
            },
            {
              step: "2",
              icon: "🤖",
              title: "AI analyseert",
              desc: "AI herkent wie de brief is, wat het inhoudt en of er iets gedaan moet worden.",
            },
            {
              step: "3",
              icon: "✅",
              title: "Bijhouden",
              desc: "Document wordt opgeslagen in de juiste map. Acties verschijnen in jullie to-do lijst.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-3xl p-7 text-center shadow-sm">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Voorbeeldscan */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">Zie hoe het werkt</h2>
          <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
            Eén foto van je brief. Binnen seconden weet je wat het is, voor wie het is en wat je moet doen. NooitMeerPostKwijt regelt de rest.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            {/* Input */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Brief van Belastingdienst</p>
                <p className="text-xs text-gray-400">Aanslag inkomstenbelasting 2025 · 2 pagina&apos;s</p>
              </div>
            </div>
            {/* Arrow */}
            <p className="text-center text-gray-400 text-sm my-3">↓ AI analyseert…</p>
            {/* Output */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">📁 Belastingen</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">👤 Papa</span>
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">⚠️ Actie vereist</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li>📌 <strong>Actie:</strong> Bezwaar indienen vóór 15 augustus 2025</li>
                <li>💰 <strong>Bedrag:</strong> €1.247 te betalen</li>
                <li>📅 <strong>Deadline toegevoegd aan je actielijst</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-3xl p-8 mb-12 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 text-center">Alles wat een gezin nodig heeft</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "👨‍👩‍👧‍👦", text: "Koppel brieven aan een gezinslid — voor mama, papa of de kinderen" },
              { icon: "📁", text: "Documenten worden automatisch in de juiste map gezet" },
              { icon: "⏰", text: "Deadlines en acties worden bijgehouden, zodat je niets mist" },
              { icon: "☁️", text: "Opslaan in OneDrive of Dropbox — altijd bij de hand" },
              { icon: "📱", text: "Werkt perfect op je telefoon — ideaal na de brievenbus" },
              { icon: "🔒", text: "Jouw documenten zijn alleen voor jou zichtbaar" },
            ].map((f) => (
              <div key={f.text} className="flex items-start gap-3">
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="max-w-2xl mx-auto mb-12 bg-blue-50 border border-blue-200 rounded-3xl p-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">🔒 Jouw post, alleen voor jou</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            We begrijpen dat brieven van de Belastingdienst, je zorgverzekeraar of je bank privé zijn. Daarom:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Jouw documenten worden <strong>nooit gebruikt om AI te trainen</strong></li>
            <li>✅ Opslag gebeurt op <strong>Europese servers</strong> (EU-wetgeving van toepassing)</li>
            <li>✅ Alleen jij — en wie jij uitnodigt — heeft toegang tot jouw documenten</li>
            <li>✅ Je kunt al je data op elk moment <strong>volledig verwijderen</strong></li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center pb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Klaar om te beginnen?</h2>
          <p className="text-gray-500 text-sm mb-6">Maak een gratis account aan en scan jullie eerste brief.</p>
          <Link
            href="/aanmelden"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-md"
          >
            Gratis account aanmaken →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 py-6 text-center text-xs text-gray-400 space-x-3">
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
