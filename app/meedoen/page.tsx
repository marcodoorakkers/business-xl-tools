import Link from "next/link";

export const metadata = { title: "Bouw mee — TimeSaverTools" };

const steps = [
  {
    icon: "💡",
    step: "1",
    title: "Dien je idee in",
    desc: "Heb je een idee voor een handige tool? Deel het in twee zinnen. Klein of groot — alles is welkom.",
  },
  {
    icon: "👍",
    step: "2",
    title: "Community stemt",
    desc: "Andere gebruikers stemmen op ideeën die zij ook nuttig vinden. De beste ideeën drijven vanzelf naar boven.",
  },
  {
    icon: "🛠️",
    step: "3",
    title: "Wij bouwen het",
    desc: "Ideeën met de meeste stemmen pakken we op. Je kunt de status volgen: in overweging → in ontwikkeling → live.",
  },
  {
    icon: "🎁",
    step: "4",
    title: "Jij verdient credits",
    desc: "Gaat jouw idee live? Dan krijg je automatisch 100 gratis credits op je account bijgeschreven.",
  },
];

export default function MeedoenPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-gray-900 text-lg">TimeSaver<span className="text-blue-600">Tools</span></span>
        </Link>
        <Link href="/ideas" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
          Bekijk alle ideeën →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          🎁 Verdien 100 credits als jouw idee live gaat
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Help ons bouwen wat<br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            jij nodig hebt
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          TimeSaverTools groeit door jullie ideeën. Dien een idee in, laat de community stemmen en zie hoe jouw tool werkelijkheid wordt.
        </p>
        <Link
          href="/ideas"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200"
        >
          💡 Dien jouw idee in →
        </Link>
      </section>

      {/* Incentive banner */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 sm:p-10 text-white text-center shadow-xl shadow-orange-100">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">100 gratis credits</h2>
          <p className="text-orange-100 text-lg max-w-xl mx-auto">
            Wordt jouw idee daadwerkelijk gebouwd en live gezet? Dan schrijven we automatisch <strong className="text-white">100 credits</strong> bij op jouw account — zonder dat je er iets voor hoeft te doen.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Hoe werkt het?</h2>
            <p className="text-gray-500">Van idee tot live tool — in vier stappen.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Stap {item.step}</div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Rules */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Veelgestelde vragen</h2>
        <div className="flex flex-col gap-4">
          {[
            {
              q: "Welke ideeën hebben de meeste kans?",
              a: "Ideeën die goed passen bij de stijl van TimeSaverTools: tools die dagelijkse taken automatiseren en voor een breed publiek nuttig zijn. Houd het praktisch en concreet.",
            },
            {
              q: "Wanneer ontvang ik mijn 100 credits?",
              a: "Zodra we jouw idee als 'Live' markeren in ons systeem, worden de credits automatisch bijgeschreven. Je ziet dit direct terug op je account.",
            },
            {
              q: "Kan ik meerdere ideeën indienen?",
              a: "Ja, je kunt zoveel ideeën indienen als je wilt. Voor elk idee dat live gaat ontvang je 100 credits.",
            },
            {
              q: "Kan ik ook stemmen op ideeën van anderen?",
              a: "Absoluut. Juist dat helpt ons prioriteren. Stem op alles wat jij ook graag zou willen zien.",
            },
          ].map((item) => (
            <div key={item.q} className="bg-gray-50 rounded-2xl px-6 py-5">
              <p className="font-semibold text-gray-900 mb-1">{item.q}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-5xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Jouw idee staat er nog niet bij?</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Dien het in en wie weet zit het er over een paar weken wel bij — met jouw naam eraan.
          </p>
          <Link
            href="/ideas"
            className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-lg"
          >
            💡 Naar het ideeënbord →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>TimeSaverTools</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} TimeSaverTools · Alle rechten voorbehouden</p>
        </div>
      </footer>
    </div>
  );
}
