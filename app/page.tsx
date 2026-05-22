import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const tools = [
  {
    icon: "🎙️",
    name: "Voice Mail Draft",
    description: "Spreek in wat je wilt mailen. Ontvang binnen seconden een kant-en-klaar concept.",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
  },
  {
    icon: "📝",
    name: "Meeting Memo",
    description: "Neem je vergadering op en ontvang automatisch gestructureerde notulen.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    icon: "🍽️",
    name: "Weekmenu Planner",
    description: "Geef je voorkeuren op en ontvang een weekmenu met recepten en boodschappenlijst.",
    color: "from-orange-400 to-pink-500",
    bg: "bg-orange-50",
  },
  {
    icon: "🔍",
    name: "Vacaturezoeker",
    description: "Plak je CV of profiel en vind direct actuele freelance & contract vacatures wereldwijd.",
    color: "from-green-500 to-teal-500",
    bg: "bg-green-50",
  },
  {
    icon: "📋",
    name: "CV Builder",
    description: "Upload je CV als PDF en ontvang een professioneel CV op maat — kies uit 6 templates en download als Word.",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
  },
  {
    icon: "🎯",
    name: "Presentatie Outline",
    description: "Geef je onderwerp en duur op en ontvang direct een complete slideopbouw met spreektips.",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
  },
  {
    icon: "✨",
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
          <span className="text-2xl">⚡</span>
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
          ✨ Slimme tools voor iedereen
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Doe meer in<br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            minder tijd
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Een groeiende collectie tools die dagelijkse klusjes van je overnemen. Jij doet de leuke dingen, wij de rest.
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
              <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-2xl shadow-md`}>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Hoe werkt het?</h2>
            <p className="text-gray-500">Zo simpel is het.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Maak een account", desc: "Registreer gratis en ontvang direct 10 credits.", icon: "👤" },
              { step: "2", title: "Kies een tool", desc: "Kies wat je nodig hebt en vul in wat gevraagd wordt.", icon: "🛠️" },
              { step: "3", title: "Ontvang je resultaat", desc: "Binnen seconden klaar — kopiëren, downloaden of mailen.", icon: "🎉" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Stap {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simpele prijzen</h2>
          <p className="text-gray-500">Begin gratis of kies het Maandelijks abonnement voor de beste waarde.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
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
              <p className="text-4xl font-extrabold text-white">€4,99</p>
              <p className="text-sm mt-1 text-amber-100">/maand</p>
            </div>
            <div className="text-3xl font-bold text-white">
              50 <span className="text-base font-normal text-amber-100">credits/maand</span>
            </div>
            <p className="text-xs text-amber-100">Maandelijks opzegbaar</p>
            <Link href="/account"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-white text-amber-600 hover:bg-amber-50">
              Start Maandelijks →
            </Link>
          </div>

          {/* Starter */}
          <div className="relative rounded-3xl p-7 flex flex-col gap-4 bg-gray-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Starter</p>
              <p className="text-4xl font-extrabold text-gray-900">€9,99</p>
              <p className="text-sm mt-1 text-gray-500">Voor af en toe gebruik</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              50 <span className="text-base font-normal text-gray-500">credits</span>
            </div>
            <p className="text-xs text-gray-400">€0,20 per credit</p>
            <Link href="/auth/register"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700">
              Koop credits →
            </Link>
          </div>

          {/* Populair */}
          <div className="relative rounded-3xl p-7 flex flex-col gap-4 bg-gray-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Populair</p>
              <p className="text-4xl font-extrabold text-gray-900">€29,99</p>
              <p className="text-sm mt-1 text-gray-500">Voor regelmatig gebruik</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              200 <span className="text-base font-normal text-gray-500">credits</span>
            </div>
            <p className="text-xs text-gray-400">€0,15 per credit</p>
            <Link href="/auth/register"
              className="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700">
              Koop credits →
            </Link>
          </div>

        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Alle prijzen zijn excl. BTW · Betalen via iDEAL, creditcard of Bancontact · Credits vervallen niet</p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Klaar om tijd te besparen?</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Maak vandaag nog een gratis account en ontdek hoe makkelijk het is.
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
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>TimeSaverTools</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-gray-400">
            <p>Resultaten worden gegenereerd door AI · Verantwoordelijkheid voor gebruik ligt bij de gebruiker</p>
            <Link href="/disclaimer" className="hover:text-gray-600 underline underline-offset-2 whitespace-nowrap">Meer info</Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} TimeSaverTools · Alle rechten voorbehouden</p>
        </div>
      </footer>
    </div>
  );
}
