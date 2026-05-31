import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const tools = [
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
    name: "Voice Mail Draft",
    description: "Spreek in wat je wilt mailen. Ontvang binnen seconden een kant-en-klaar concept.",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    name: "Meeting Memo",
    description: "Neem je vergadering op en ontvang automatisch gestructureerde notulen.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    name: "Vacaturezoeker",
    description: "Plak je CV of profiel en vind direct actuele freelance & contract vacatures wereldwijd.",
    color: "from-green-500 to-teal-500",
    bg: "bg-green-50",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    name: "CV Builder",
    description: "Upload je CV als PDF en ontvang een professioneel CV op maat — kies uit 6 templates en download als Word.",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
  },
  {
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44z"/></svg>,
    name: "Document Opmaken",
    description: "Upload een Word-document en ontvang een professioneel opgemaakte versie met inhoudsopgave, koppen en paginanummers.",
    color: "from-teal-500 to-cyan-500",
    bg: "bg-teal-50",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span className="font-bold text-gray-900 text-lg">TimeSaver<span className="text-blue-600">Tools</span></span>
        </div>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              Naar mijn tools →
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Inloggen
              </Link>
              <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                Gratis starten
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          Voor ZZP&apos;ers en MKB
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          De admin die je vertraagt.<br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Wij nemen hem over.
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Spreek je mail in en ontvang hem kant-en-klaar. Neem een vergadering op, laat de notulen uitwerken. Upload je CV, ontvang een bijgewerkte versie. Alles in seconden.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200">
              Naar mijn tools →
            </Link>
          ) : (
            <>
              <Link href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200">
                Begin gratis →
              </Link>
              <Link href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5 rounded-2xl text-base transition-colors border border-gray-200 hover:border-gray-300">
                Al een account? Log in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Tools */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Wat kun je ermee?</h2>
          <p className="text-gray-500">Steeds meer tools, elk ontworpen om jou tijd te besparen.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <div key={tool.name} className={`${tool.bg} rounded-3xl p-7 flex flex-col gap-4`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                {tool.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">In drie stappen klaar</h2>
            <p className="text-gray-500">Geen installatie, geen handleiding.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Stap 1</div>
              <h3 className="font-bold text-gray-900 mb-2">Gratis account maken</h3>
              <p className="text-gray-500 text-sm">Direct 10 credits — geen creditcard nodig.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Stap 2</div>
              <h3 className="font-bold text-gray-900 mb-2">Tool kiezen en invullen</h3>
              <p className="text-gray-500 text-sm">Kies wat je nodig hebt, typ of spreek je input in.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Stap 3</div>
              <h3 className="font-bold text-gray-900 mb-2">Resultaat ontvangen</h3>
              <p className="text-gray-500 text-sm">Kopieer, download of mail direct — soms duurt het letterlijk 10 seconden.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simpele prijzen</h2>
          <p className="text-gray-500">Begin gratis of kies het Maandelijks abonnement voor de beste waarde.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Gratis */}
          <div className="relative rounded-3xl p-7 flex flex-col gap-4 bg-gray-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Gratis</p>
              <p className="text-4xl font-extrabold text-gray-900">€0</p>
              <p className="text-sm mt-1 text-gray-500">10 credits bij registratie</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              10 <span className="text-base font-normal text-gray-500">credits</span>
            </div>
            <Link href="/auth/register"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700">
              Begin gratis →
            </Link>
          </div>

          {/* Maandelijks */}
          <div className="relative rounded-3xl p-7 flex flex-col gap-4 bg-amber-500 text-white shadow-xl shadow-amber-200 scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-amber-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              ⭐ Aanbevolen
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-amber-100">Maandelijks</p>
              <p className="text-4xl font-extrabold text-white">€3,99</p>
              <p className="text-sm mt-1 text-amber-100">/maand</p>
            </div>
            <div className="text-3xl font-bold text-white">
              50 <span className="text-base font-normal text-amber-100">credits/maand</span>
            </div>
            <p className="text-xs text-amber-100">Ongebruikte credits vervallen elke maand · opzegbaar wanneer je wil</p>
            <Link href="/account"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-white text-amber-600 hover:bg-amber-50">
              Start Maandelijks →
            </Link>
          </div>

          {/* 50 credits */}
          <div className="relative rounded-3xl p-7 flex flex-col gap-4 bg-gray-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">50 credits</p>
              <p className="text-4xl font-extrabold text-gray-900">€7,49</p>
              <p className="text-sm mt-1 text-gray-500">Voor af en toe gebruik</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              50 <span className="text-base font-normal text-gray-500">credits</span>
            </div>
            <p className="text-xs text-gray-400">€0,15 per credit · vervallen nooit</p>
            <Link href="/auth/register"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700">
              Koop credits →
            </Link>
          </div>

          {/* 200 credits */}
          <div className="relative rounded-3xl p-7 flex flex-col gap-4 bg-gray-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">200 credits</p>
              <p className="text-4xl font-extrabold text-gray-900">€19,99</p>
              <p className="text-sm mt-1 text-gray-500">Voor regelmatig gebruik</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              200 <span className="text-base font-normal text-gray-500">credits</span>
            </div>
            <p className="text-xs text-gray-400">€0,10 per credit · vervallen nooit</p>
            <Link href="/auth/register"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700">
              Koop credits →
            </Link>
          </div>

        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Alle prijzen zijn excl. BTW · Betalen via iDEAL, creditcard of Bancontact · Abonnementscredits vervallen maandelijks · Gekochte credits vervallen nooit</p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Probeer het gratis</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Geen creditcard nodig. Begin met 10 gratis credits en ervaar hoe snel het werkt.
          </p>
          {loggedIn ? (
            <Link href="/dashboard"
              className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-lg">
              Naar mijn tools →
            </Link>
          ) : (
            <Link href="/auth/register"
              className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-lg">
              Gratis starten →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4 text-xs text-gray-400">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span className="font-medium text-gray-500">TimeSaverTools</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <p>Resultaten worden gegenereerd door AI · Verantwoordelijkheid voor gebruik ligt bij de gebruiker</p>
              <Link href="/disclaimer" className="hover:text-gray-600 underline underline-offset-2 whitespace-nowrap">Meer info</Link>
            <Link href="/privacy" className="hover:text-gray-600 underline underline-offset-2 whitespace-nowrap">Privacyverklaring</Link>
            </div>
            <p>© {new Date().getFullYear()} TimeSaverTools · Alle rechten voorbehouden</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-gray-300">
            <span>Business XL · Bosscheweg 44, 5056 KC Berkel-Enschot · KvK 50418041</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
