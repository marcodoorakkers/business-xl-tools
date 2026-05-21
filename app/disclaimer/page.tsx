import Link from "next/link";

export const metadata = { title: "Disclaimer — TimeSaverTools" };

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold text-gray-900">TimeSaver<span className="text-blue-600">Tools</span></span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Terug</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Hoe onze tools werken</h1>
        <p className="text-gray-500 mb-10 text-lg">Een kort en eerlijk verhaal over wat je van ons kunt verwachten.</p>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Wij gebruiken AI</h2>
            <p>
              Alle tools op TimeSaverTools maken gebruik van kunstmatige intelligentie om resultaten te genereren — denk aan CV&apos;s, vergadernotulen, weekmenu&apos;s en e-mailconcepten. We werken hiervoor samen met <strong>Anthropic Claude</strong>, een van de meest betrouwbare AI-modellen op dit moment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">AI maakt fouten</h2>
            <p>
              Hoe goed AI ook is, het kan fouten maken, dingen verzinnen of nuance missen. Gegenereerde teksten, CV&apos;s of planningen kunnen onjuistheden bevatten. Controleer resultaten daarom altijd even voordat je ze gebruikt, verstuurt of inlevert.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Jij bent eindverantwoordelijk</h2>
            <p>
              TimeSaverTools levert een hulpmiddel, geen beslissing. De verantwoordelijkheid voor hoe je de gegenereerde content gebruikt, ligt altijd bij jou. TimeSaverTools is niet aansprakelijk voor gevolgen die voortvloeien uit het gebruik van gegenereerde resultaten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Jouw gegevens</h2>
            <p>
              De informatie die je invoert (zoals je CV of vergaderopname) wordt alleen gebruikt om jouw resultaat te genereren. We slaan deze gegevens niet op en delen ze niet met derden, anders dan wat strikt nodig is om de AI-verwerking mogelijk te maken.
            </p>
          </section>

          <div className="bg-blue-50 rounded-xl px-6 py-4 text-sm text-blue-700">
            <strong>Kort samengevat:</strong> onze tools zijn er om je te helpen sneller te werken. Gebruik ze als een slimme assistent — niet als een onfeilbaar orakel. Jij houdt altijd het laatste woord.
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Vragen? Neem contact op via <a href="mailto:info@timesavertools.nl" className="underline hover:text-gray-600">info@timesavertools.nl</a>
        </p>
      </main>
    </div>
  );
}
