import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = {
  title: "Support & FAQ — NooitMeerPostKwijt",
  description: "Antwoorden op veelgestelde vragen over NooitMeerPostKwijt. Kom je er niet uit? Neem contact op via e-mail.",
};

const faq = [
  {
    q: "Hoe werken scan-credits?",
    a: "Elke keer dat je een document scant, wordt er 1 credit afgeschreven van je saldo. Bij aanmelding ontvang je automatisch 10 gratis credits — geen creditcard nodig. Als je meer credits nodig hebt, koop je een creditbundel via je accountpagina.",
  },
  {
    q: "Vervallen credits?",
    a: "Nee. Credits vervallen nooit en zijn niet gebonden aan een abonnementsperiode. Je kunt ze gebruiken wanneer je wilt.",
  },
  {
    q: "Welke cloudopslag wordt ondersteund?",
    a: "NooitMeerPostKwijt ondersteunt OneDrive, Dropbox en Google Drive. Je koppelt je opslagdienst eenmalig via Instellingen. Documenten worden daarna automatisch naar de juiste map gestuurd.",
  },
  {
    q: "Wat gebeurt er met mijn document na het scannen?",
    a: "De foto of PDF wordt via een beveiligde verbinding naar de AI gestuurd voor analyse en daarna automatisch verwijderd — bij ons én bij Anthropic. Wij slaan nooit de afbeelding zelf op, alleen het analyseresultaat (afzender, type, datum en eventueel een samenvatting).",
  },
  {
    q: "Kan ik documenten ook via e-mail insturen?",
    a: "Ja. Elke gebruiker heeft een persoonlijk scanadres. Je vindt het in Instellingen → Scan-e-mailadres. Stuur een e-mail met een PDF of afbeelding als bijlage naar dat adres — de app verwerkt het automatisch.",
  },
  {
    q: "Hoe koppel ik OneDrive, Dropbox of Google Drive?",
    a: "Ga naar Instellingen → Cloudopslag en kies je opslagdienst. Je wordt doorgestuurd naar de inlogpagina van de betreffende dienst. Na autorisatie worden documenten automatisch opgeslagen in een map naar keuze.",
  },
  {
    q: "Kan ik documenten koppelen aan verschillende personen?",
    a: "Ja. Via Instellingen → Geadresseerden voeg je personen of entiteiten toe (bijv. jezelf, je partner of je BV). Bij het scannen herkent de app automatisch aan wie het document is gericht.",
  },
  {
    q: "Hoe wijzig ik mijn privacyinstellingen?",
    a: "Via Instellingen → Privacy kies je wat er wordt opgeslagen: alles (afzender, type, datum, samenvatting en acties), alleen acties, of alleen afzender en type. Je kunt dit op elk moment aanpassen.",
  },
  {
    q: "Hoe verwijder ik mijn account?",
    a: "Ga naar je accountpagina en scroll naar onderen. Daar vind je de optie om je account te verwijderen. Al je gegevens worden daarna gewist.",
  },
  {
    q: "Ik heb een vraag die hier niet bij staat — wat nu?",
    a: "Stuur een e-mail naar nooitmeerpostkwijt@business-xl.nl. We reageren binnen 2 werkdagen.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <NMMPKLogo />
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Terug</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Support & FAQ</h1>
          <p className="text-sm text-gray-500">Antwoorden op de meest gestelde vragen. Kom je er niet uit? Stuur ons een e-mail.</p>
        </div>

        <div className="flex flex-col gap-4 mb-12">
          {faq.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-sm mb-2">{item.q}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 rounded-2xl p-6 text-center">
          <h2 className="font-bold text-gray-900 mb-2">Nog een vraag?</h2>
          <p className="text-sm text-gray-600 mb-4">We helpen je graag. Stuur een e-mail en we reageren binnen 2 werkdagen.</p>
          <a
            href="mailto:nooitmeerpostkwijt@business-xl.nl"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            nooitmeerpostkwijt@business-xl.nl
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL ·{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacyverklaring</Link>
          {" · "}
          <Link href="/voorwaarden" className="underline hover:text-gray-600">Algemene Voorwaarden</Link>
        </p>
      </main>
    </div>
  );
}
