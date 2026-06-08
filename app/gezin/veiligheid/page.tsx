import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = { title: "Veiligheid & Privacy — NooitMeerPostKwijt" };

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Wie kan mijn documenten zien?",
    a: "Alleen jij. Documenten zijn per gebruiker afgeschermd via row-level security op databaseniveau — een technische maatregel die voorkomt dat iemand anders, ook wij als beheerder, bij jouw gegevens kan.",
  },
  {
    q: "Worden mijn documenten opgeslagen op jullie servers?",
    a: "Nee. De inhoud van je foto's en PDF's wordt verwerkt voor AI-analyse en daarna niet bewaard op onze servers. Wat we wél opslaan is de geëxtraheerde metadata: afzender, onderwerp, samenvatting, actiepunten en datum. De bestanden zelf sla jij op in je eigen OneDrive of Dropbox.",
  },
  {
    q: "Gaan mijn documenten naar de Verenigde Staten?",
    a: "Tijdelijk, ja. Voor de AI-analyse worden documenten via een beveiligde verbinding (HTTPS/TLS) doorgestuurd naar Anthropic, een Amerikaans bedrijf. Dit is onvermijdelijk zolang we AI gebruiken voor de analyse. Anthropic verwerkt de gegevens uitsluitend in onze opdracht conform hun API-gebruiksvoorwaarden — NooitMeerPostKwijt is de verwerkingsverantwoordelijke, niet Anthropic.",
  },
  {
    q: "Wat doet Anthropic met mijn documenten?",
    a: "Anthropic verwerkt je documenten uitsluitend om het AI-antwoord te genereren. Volgens hun beleid worden via de API ingediende documenten niet gebruikt om modellen te trainen, tenzij je daar expliciet toestemming voor geeft. Dit is een expliciet onderscheid dat Anthropic maakt tussen API-gebruik en hun consumentenproducten.",
  },
  {
    q: "Traint de AI op mijn persoonlijke documenten?",
    a: (
      <>
        Nee. Documenten die via de API worden ingediend — wat wij doen — worden niet standaard gebruikt voor modeltraining door Anthropic. Meer informatie vind je op{" "}
        <a href="https://www.anthropic.com/legal" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">anthropic.com/legal</a>.
      </>
    ),
  },
  {
    q: "Is mijn verbinding beveiligd?",
    a: "Ja. Alle communicatie tussen jouw browser of app en onze servers verloopt via HTTPS met TLS-versleuteling. Dit geldt ook voor de verbinding tussen onze servers en Anthropic.",
  },
  {
    q: "Hoe zijn mijn wachtwoord en inloggegevens beveiligd?",
    a: "Wachtwoorden worden nooit in leesbare vorm opgeslagen. We gebruiken Supabase Auth, dat wachtwoorden versleutelt met bcrypt. Wij kunnen jouw wachtwoord niet inzien.",
  },
  {
    q: "Staat mijn data in Europa?",
    a: "Onze database draait op Supabase in een EU-datacenterregio. Anthropic (AI-verwerking) en Resend (e-mail) zijn Amerikaanse bedrijven. Zij verwerken gegevens uitsluitend in onze opdracht conform hun API-voorwaarden.",
  },
  {
    q: "Wat is de CLOUD Act en is mijn data hierdoor kwetsbaar?",
    a: "De CLOUD Act is een Amerikaanse wet waarmee Amerikaanse overheidsinstanties data kunnen opvragen bij Amerikaanse bedrijven, ook als die data in Europa staat. Dit geldt in theorie voor Anthropic. In de praktijk vereist dit een gerechtelijk bevel en is het gericht op ernstige criminaliteit — niet op persoonlijke documenten van particulieren. Bovendien slaat Anthropic je documenten niet op na verwerking, waardoor er feitelijk niets op te vragen valt.",
  },
  {
    q: "Zijn jullie AVG/GDPR-compliant?",
    a: (
      <>
        Ja. We verwerken alleen gegevens die noodzakelijk zijn voor de dienst, op geldige grondslagen (uitvoering overeenkomst, gerechtvaardigd belang). We hebben een{" "}
        <Link href="/privacy" className="text-amber-600 hover:underline">privacyverklaring</Link> gepubliceerd, afspraken gemaakt met verwerkers over verantwoord datagebruik, en passende technische maatregelen getroffen zoals versleutelde verbindingen en row-level security.
      </>
    ),
  },
  {
    q: "Hebben jullie een privacyverklaring?",
    a: (
      <>
        Ja, gepubliceerd op{" "}
        <Link href="/privacy" className="text-amber-600 hover:underline">nooitmeerpostkwijt.nl/privacy</Link>. Hierin staat welke gegevens we verwerken, waarom, hoe lang we ze bewaren, en met welke partijen we samenwerken.
      </>
    ),
  },
  {
    q: "Hebben jullie algemene voorwaarden?",
    a: (
      <>
        Ja, gepubliceerd op{" "}
        <Link href="/voorwaarden" className="text-amber-600 hover:underline">nooitmeerpostkwijt.nl/voorwaarden</Link>. Hierin staan de contractuele condities, het abonnement, de proefperiode, opzegging en aansprakelijkheid.
      </>
    ),
  },
  {
    q: "Welke cookies gebruiken jullie?",
    a: "Alleen functionele cookies die strikt noodzakelijk zijn voor het werken van de app: inlogcookies voor sessiebeheer en voorkeursinstellingen. Geen tracking- of advertentiecookies.",
  },
  {
    q: "Deelt NooitMeerPostKwijt mijn gegevens met andere bedrijven voor marketing?",
    a: (
      <>
        Nee. We verkopen nooit gegevens aan derden en gebruiken ze niet voor marketing van andere bedrijven. We delen gegevens alleen met partijen die noodzakelijk zijn voor het leveren van onze dienst. Een volledig overzicht staat in de{" "}
        <Link href="/privacy" className="text-amber-600 hover:underline">privacyverklaring</Link>.
      </>
    ),
  },
  {
    q: "Kan ik mijn gegevens opvragen of exporteren?",
    a: "Ja, dit is een recht onder de AVG. Stuur een verzoek naar nooitmeerpostkwijt@business-xl.nl — we reageren binnen 30 dagen met een overzicht van alle gegevens die we van je bewaren. Een geautomatiseerde exportfunctie staat op de roadmap.",
  },
  {
    q: "Kan ik mijn account en gegevens laten verwijderen?",
    a: "Ja. Je kunt je account zelf verwijderen via de accountpagina. Dit verwijdert je profielgegevens, actiepunten en instellingen permanent. Betalingsgegevens bewaren we 7 jaar op basis van de fiscale bewaarplicht — dat is wettelijk verplicht.",
  },
  {
    q: "Wat als er een datalek is?",
    a: "Als er een datalek plaatsvindt waarbij persoonsgegevens zijn getroffen, melden we dit binnen 72 uur bij de Autoriteit Persoonsgegevens. Betrokken gebruikers worden geïnformeerd als er een hoog risico voor hen is. We nemen passende maatregelen om datalekken te voorkomen via HTTPS, versleutelde opslag en row-level security.",
  },
  {
    q: "Heeft de app tweefactorauthenticatie (2FA)?",
    a: "Nog niet. Dit staat op de roadmap. Op dit moment beveiligen we accounts via versleutelde wachtwoorden en veilig sessiebeheer. We raden je aan een sterk, uniek wachtwoord te gebruiken.",
  },
  {
    q: "Wat gebeurt er met mijn data als ik stop met het abonnement?",
    a: (
      <>
        Je account blijft actief tot het einde van de betaalperiode. Daarna wordt je toegang geblokkeerd maar je gegevens worden bewaard conform de bewaartermijnen in de{" "}
        <Link href="/privacy" className="text-amber-600 hover:underline">privacyverklaring</Link> — accountgegevens 12 maanden na verwijdering, betalingsgegevens 7 jaar. Je kunt altijd verwijdering verzoeken via nooitmeerpostkwijt@business-xl.nl.
      </>
    ),
  },
  {
    q: "Kunnen medewerkers van NooitMeerPostKwijt mijn documenten lezen?",
    a: "Nee. Door de row-level security op databaseniveau zijn individuele documenten ook voor ons als beheerder niet zomaar toegankelijk. We hebben geen reden en geen procedure om individuele documenten in te zien. De enige uitzondering zou een gerechtelijk bevel zijn.",
  },
];

export default function VeiligheidPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <NMMPKLogo />
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Terug</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Veiligheid &amp; Privacy</h1>
          <p className="text-lg text-gray-500">Veelgestelde vragen over hoe we omgaan met jouw gegevens.</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">{q}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">Nog een vraag?</p>
          <p>Stuur een e-mail naar <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="underline hover:text-amber-900">nooitmeerpostkwijt@business-xl.nl</a>. We reageren zo snel mogelijk.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-10 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 underline">Privacyverklaring</Link>
          <span>·</span>
          <Link href="/voorwaarden" className="hover:text-gray-600 underline">Algemene Voorwaarden</Link>
          <span>·</span>
          <Link href="/disclaimer" className="hover:text-gray-600 underline">Disclaimer</Link>
        </div>

        <p className="text-center text-xs text-gray-300 mt-3">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL · KvK 50418041
        </p>
      </main>
    </div>
  );
}
