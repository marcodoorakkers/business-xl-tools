import Link from "next/link";

export const metadata = { title: "Disclaimer — NooitMeerPostKwijt" };

export default function GezinDisclaimerPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-white border-b border-amber-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-extrabold text-amber-700 text-lg">📬 NooitMeerPostKwijt</Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Terug</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Hoe de app werkt</h1>
        <p className="text-gray-500 mb-10 text-lg">Een eerlijk verhaal over wat je van ons kunt verwachten.</p>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Wij gebruiken AI</h2>
            <p>
              NooitMeerPostKwijt maakt gebruik van kunstmatige intelligentie om documenten te herkennen en analyseren. We werken hiervoor samen met <strong>Anthropic Claude</strong>, een van de meest betrouwbare AI-modellen op dit moment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">AI maakt fouten</h2>
            <p className="mb-2">
              Hoewel de AI in de meeste gevallen nauwkeurig is, kan het voorkomen dat een document verkeerd wordt herkend, een mapnaam niet klopt of een actie wordt gemist. Controleer daarom altijd het voorstel voordat je opslaat.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
              💡 Bij twijfel over een deadline of bedrag: raadpleeg altijd het originele document.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Jouw documenten zijn van jou</h2>
            <p>
              Wij slaan de inhoud van jouw documenten niet permanent op op onze servers. Foto&apos;s en PDF&apos;s worden uitsluitend tijdelijk verwerkt voor de AI-analyse. Jij bepaalt zelf waar het document wordt opgeslagen — op je eigen computer, in OneDrive of in Dropbox.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Geen juridisch of financieel advies</h2>
            <p>
              De samenvattingen, actiesuggesties en mapindelingen die de app genereert zijn bedoeld als hulpmiddel, niet als advies. Wij zijn niet aansprakelijk voor beslissingen die op basis van de app-uitkomsten worden genomen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Beschikbaarheid</h2>
            <p>
              Wij streven naar een zo hoog mogelijke uptime, maar kunnen geen garantie geven op ononderbroken beschikbaarheid. Bij gepland onderhoud communiceren wij dit vooraf waar mogelijk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
            <p>
              Heb je vragen of opmerkingen? Stuur een e-mail naar{" "}
              <a href="mailto:info@nooitmeerpostkwijt.nl" className="text-amber-600 hover:underline">
                info@nooitmeerpostkwijt.nl
              </a>. Wij reageren zo snel mogelijk.
            </p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL (Marco Doorakkers) · KvK 50418041
        </p>
      </main>
    </div>
  );
}
