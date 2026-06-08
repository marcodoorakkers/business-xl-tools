import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = { title: "Algemene Voorwaarden — NooitMeerPostKwijt" };

export default function GezinVoorwaardenPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <NMMPKLogo />
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Terug</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Algemene Voorwaarden</h1>
          <p className="text-gray-500">Versie 1.0 · Ingangsdatum: 27 mei 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Wie zijn wij</h2>
            <p>NooitMeerPostKwijt is een handelsnaam van Business XL, gevestigd in Nederland.</p>
            <div className="mt-3 bg-amber-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-medium">Handelsnaam:</span> NooitMeerPostKwijt</p>
              <p><span className="font-medium">Bedrijf:</span> Business XL</p>
              <p><span className="font-medium">Eigenaar:</span> Marco Doorakkers</p>
              <p><span className="font-medium">Adres:</span> Bosscheweg 44, 5056 KC Berkel-Enschot, Nederland</p>
              <p><span className="font-medium">KvK-nummer:</span> 50418041</p>
              <p><span className="font-medium">Btw-nummer:</span> NL822754435B01</p>
              <p><span className="font-medium">E-mail:</span> <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Definities</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><span className="font-medium text-gray-800">Dienst:</span> de webapplicatie NooitMeerPostKwijt, bereikbaar via nooitmeerpostkwijt.nl, inclusief alle bijbehorende functies.</li>
              <li><span className="font-medium text-gray-800">Gebruiker:</span> iedere natuurlijke persoon of rechtspersoon die een account aanmaakt en de dienst gebruikt.</li>
              <li><span className="font-medium text-gray-800">Abonnement:</span> de betaalde toegang tot de dienst op basis van een maandelijks terugkerende betaling.</li>
              <li><span className="font-medium text-gray-800">Proefperiode:</span> de gratis testperiode van 30 dagen (of langer bij acties) na aanmelding, zonder betalingsverplichting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Toepasselijkheid</h2>
            <p>Deze algemene voorwaarden zijn van toepassing op ieder gebruik van de dienst en op alle overeenkomsten tussen NooitMeerPostKwijt en de gebruiker. Door een account aan te maken ga je akkoord met deze voorwaarden.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Account en toegang</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Je bent verantwoordelijk voor het geheimhouden van je inloggegevens en voor alle activiteiten via jouw account.</li>
              <li>Vermoed je misbruik van je account? Meld dit direct via <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>.</li>
              <li>Je mag jouw account niet overdragen aan derden of toegang verlenen aan meerdere gebruikers tegelijk.</li>
              <li>Eén abonnement geldt voor één gebruiker. Gezinsgebruik binnen hetzelfde huishouden is toegestaan mits via hetzelfde account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Abonnement en betaling</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.1 Proefperiode</h3>
                <p className="text-sm text-gray-600">Na aanmelding ontvang je een gratis proefperiode van 30 dagen. Tijdens de proefperiode is geen betaling vereist en hoef je geen betaalgegevens in te voeren. Betaling gaat pas in nadat je zelf een betaalmethode hebt toegevoegd. Doe je dat niet, dan eindigt de toegang na de proefperiode automatisch zonder kosten.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.2 Tarief</h3>
                <p className="text-sm text-gray-600">Het abonnement kost €3,99 per maand inclusief btw. Het tarief wordt maandelijks vooraf in rekening gebracht via de door jou opgegeven betaalmethode.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.3 Facturatie</h3>
                <p className="text-sm text-gray-600">Facturen worden automatisch gegenereerd via Stripe en zijn inclusief btw. Je ontvangt een factuur per e-mail na elke betaling. Betaling geschiedt via iDEAL, creditcard of andere door Stripe aangeboden betaalmethoden.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.4 Mislukte betaling</h3>
                <p className="text-sm text-gray-600">Bij een mislukte betaling word je hierover geïnformeerd via e-mail. NooitMeerPostKwijt behoudt zich het recht voor de toegang tijdelijk te beperken totdat de betaling is voldaan.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.5 Tariefwijzigingen</h3>
                <p className="text-sm text-gray-600">Wij kunnen het abonnementstariefwijzigen. Je wordt minimaal 30 dagen van tevoren per e-mail geïnformeerd. Als je niet akkoord gaat, kun je je abonnement opzeggen vóór de ingangsdatum van de nieuwe prijs.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Opzegging</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Je kunt je abonnement op elk moment opzeggen via de accountpagina. Na opzegging heb je nog toegang tot de dienst tot het einde van de lopende betaalperiode. Er vindt geen restitutie plaats van reeds betaalde bedragen.</p>
              <p>Na het einde van de betaalperiode wordt je account inactief. Je gegevens worden bewaard conform de bewaartermijnen in de privacyverklaring, tenzij je uitdrukkelijk verzoekt om verwijdering.</p>
              <p>NooitMeerPostKwijt kan een abonnement beëindigen bij structureel misbruik of schending van deze voorwaarden, met inachtneming van een opzegtermijn van 30 dagen tenzij sprake is van ernstig misbruik.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Herroepingsrecht</h2>
            <p className="text-sm text-gray-600">Als consument heb je wettelijk het recht om binnen 14 dagen na aanmelding de overeenkomst zonder opgave van redenen te herroepen. Omdat wij een gratis proefperiode van 30 dagen hanteren zonder betalingsverplichting — en betaling pas ingaat nadat je zelf betaalgegevens hebt toegevoegd — kun je gedurende de volledige proefperiode kosteloos opzeggen via je accountpagina. Dat is ruimer dan het wettelijke minimum. Een formeel herroepingsverzoek is daarvoor niet nodig.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Gebruik van de dienst</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>De dienst is bedoeld voor persoonlijk en kleinzakelijk gebruik. Het is niet toegestaan om:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>de dienst te gebruiken voor geautomatiseerde bulk-uploads of scraping;</li>
                <li>toegang tot de dienst door te verkopen of over te dragen aan derden;</li>
                <li>de dienst te gebruiken voor onwettige doeleinden of het verwerken van documenten die je niet bevoegd bent te verwerken;</li>
                <li>de werking van de dienst te verstoren of te omzeilen.</li>
              </ul>
              <p className="mt-2">Bij overtreding behoudt NooitMeerPostKwijt zich het recht voor het account per direct te blokkeren of te beëindigen.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Beschikbaarheid en onderhoud</h2>
            <p className="text-sm text-gray-600">Wij streven naar een hoge beschikbaarheid van de dienst, maar geven geen garantie op ononderbroken toegang. Bij gepland onderhoud communiceren wij dit waar mogelijk vooraf. Storingen buiten onze invloedssfeer (bijv. bij Supabase, Anthropic of Stripe) vallen buiten onze verantwoordelijkheid.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Aansprakelijkheid</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>De dienst biedt AI-gegenereerde samenvattingen en suggesties als hulpmiddel. NooitMeerPostKwijt is niet aansprakelijk voor:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>onjuiste of onvolledige AI-uitkomsten;</li>
                <li>beslissingen die op basis van de app-uitkomsten worden genomen;</li>
                <li>verlies van gegevens door technische storingen;</li>
                <li>indirecte schade of gevolgschade.</li>
              </ul>
              <p className="mt-2">De totale aansprakelijkheid van NooitMeerPostKwijt voor directe schade is beperkt tot het bedrag dat je in de drie maanden voorafgaand aan de schadeveroorzakende gebeurtenis aan abonnementsgeld hebt betaald.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Intellectueel eigendom</h2>
            <p className="text-sm text-gray-600">Alle rechten op de dienst, de software, het ontwerp en de inhoud van NooitMeerPostKwijt berusten bij Business XL. Jouw documenten en gegevens blijven te allen tijde van jou. Je verleent NooitMeerPostKwijt uitsluitend de rechten die noodzakelijk zijn om de dienst te kunnen leveren (tijdelijke verwerking voor AI-analyse).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Privacy</h2>
            <p className="text-sm text-gray-600">Het gebruik van persoonsgegevens is geregeld in onze <Link href="/privacy" className="text-amber-600 hover:underline">privacyverklaring</Link>. Door gebruik te maken van de dienst ga je akkoord met de verwerking van je gegevens zoals beschreven in de privacyverklaring.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Klachten</h2>
            <p className="text-sm text-gray-600">Heb je een klacht? Stuur een e-mail naar <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>. Wij reageren binnen 5 werkdagen. Als we er samen niet uitkomen, kun je terecht bij de bevoegde rechter (zie artikel 14).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">14. Toepasselijk recht en geschillen</h2>
            <p className="text-sm text-gray-600">Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement Zeeland-West-Brabant, tenzij dwingend recht een andere rechter voorschrijft.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">15. Wijzigingen</h2>
            <p className="text-sm text-gray-600">Wij kunnen deze voorwaarden aanpassen. Bij wezenlijke wijzigingen ontvang je minimaal 30 dagen van tevoren een melding per e-mail. De meest actuele versie is altijd te vinden op <a href="https://www.nooitmeerpostkwijt.nl/voorwaarden" className="text-amber-600 hover:underline">www.nooitmeerpostkwijt.nl/voorwaarden</a>.</p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL (Marco Doorakkers) · KvK 50418041 · <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="underline hover:text-gray-600">nooitmeerpostkwijt@business-xl.nl</a>
        </p>
      </main>
    </div>
  );
}
