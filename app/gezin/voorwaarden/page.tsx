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
          <p className="text-sm text-gray-500">Versie 2.0 · Ingangsdatum: 9 september 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-10 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">1. Wie zijn wij</h2>
            <p>NooitMeerPostKwijt is een handelsnaam van Business XL, gevestigd in Nederland.</p>
            <div className="mt-3 bg-amber-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-medium text-gray-800">Handelsnaam:</span> NooitMeerPostKwijt</p>
              <p><span className="font-medium text-gray-800">Bedrijf:</span> Business XL</p>
              <p><span className="font-medium text-gray-800">Adres:</span> Bosscheweg 44, 5056 KC Berkel-Enschot, Nederland</p>
              <p><span className="font-medium text-gray-800">KvK-nummer:</span> 50418041</p>
              <p><span className="font-medium text-gray-800">Btw-nummer:</span> NL822754435B01</p>
              <p><span className="font-medium text-gray-800">E-mail:</span> <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">2. Definities</h2>
            <ul className="space-y-2">
              <li><span className="font-medium text-gray-800">Dienst:</span> de webapplicatie NooitMeerPostKwijt, bereikbaar via nooitmeerpostkwijt.nl, inclusief alle bijbehorende functies.</li>
              <li><span className="font-medium text-gray-800">Gebruiker:</span> iedere natuurlijke persoon of rechtspersoon die een account aanmaakt en de dienst gebruikt.</li>
              <li><span className="font-medium text-gray-800">Scan-credits:</span> eenheden die recht geven op het uitvoeren van scans via de dienst. Credits vervallen nooit en zijn gekoppeld aan het account.</li>
              <li><span className="font-medium text-gray-800">Gratis credits:</span> 10 scan-credits die automatisch worden bijgeschreven bij aanmelding, zonder betalingsverplichting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">3. Toepasselijkheid</h2>
            <p>Deze algemene voorwaarden zijn van toepassing op ieder gebruik van de dienst en op alle overeenkomsten tussen NooitMeerPostKwijt en de gebruiker. Door een account aan te maken ga je akkoord met deze voorwaarden.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">4. Account en toegang</h2>
            <ul className="space-y-2">
              <li>Je bent verantwoordelijk voor het geheimhouden van je inloggegevens en voor alle activiteiten via jouw account.</li>
              <li>Vermoed je misbruik van je account? Meld dit direct via <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>.</li>
              <li>Je mag jouw account niet overdragen aan derden of toegang verlenen aan meerdere gebruikers tegelijk.</li>
              <li>Scan-credits zijn gekoppeld aan één account en mogen niet worden gedeeld of overgedragen. Gezinsgebruik binnen hetzelfde huishouden is toegestaan mits via hetzelfde account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">5. Credits en betaling</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.1 Gratis credits bij aanmelding</h3>
                <p>Na aanmelding ontvang je automatisch 10 gratis scan-credits. Er is geen betaling vereist en je hoeft geen betaalgegevens in te voeren om te starten.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.2 Tarieven</h3>
                <p>Aanvullende credits kun je kopen in de volgende bundels (prijzen inclusief btw):</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>25 scans — €2,49</li>
                  <li>100 scans — €7,99</li>
                  <li>300 scans — €19,99</li>
                </ul>
                <p className="mt-2">Credits vervallen nooit en zijn niet gebonden aan een abonnementsperiode.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.3 Facturatie</h3>
                <p>Aankopen zijn eenmalige betalingen. Facturen worden automatisch gegenereerd via Stripe en zijn inclusief btw. Je ontvangt een factuur per e-mail na elke betaling. Betaling geschiedt via iDEAL, creditcard of andere door Stripe aangeboden betaalmethoden.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.4 Mislukte betaling</h3>
                <p>Bij een mislukte betaling ontvang je hierover een melding. Credits worden pas bijgeschreven na succesvolle betaling.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5.5 Tariefwijzigingen</h3>
                <p>Wij kunnen de prijzen van creditbundels wijzigen. Reeds gekochte credits worden niet in waarde aangepast. Bij wezenlijke prijswijzigingen communiceren wij dit vooraf via de website of per e-mail.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">6. Restitutie en beëindiging</h2>
            <div className="space-y-3">
              <p>Gekochte credits worden niet terugbetaald, tenzij sprake is van een aantoonbare technische fout aan onze zijde waardoor credits onterecht zijn afgeschreven.</p>
              <p>Bij het verwijderen van je account vervallen eventuele resterende credits. Je gegevens worden bewaard conform de bewaartermijnen in de privacyverklaring, tenzij je uitdrukkelijk verzoekt om verwijdering.</p>
              <p>NooitMeerPostKwijt kan een account beëindigen bij structureel misbruik of schending van deze voorwaarden, met inachtneming van een opzegtermijn van 30 dagen tenzij sprake is van ernstig misbruik.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">7. Herroepingsrecht</h2>
            <p>Als consument heb je wettelijk het recht om binnen 14 dagen na een aankoop de overeenkomst zonder opgave van redenen te herroepen, mits de dienst nog niet volledig is uitgevoerd. Omdat scan-credits direct inzetbaar zijn na aankoop, geldt het herroepingsrecht niet voor credits die al zijn gebruikt. Voor ongebruikte credits kun je binnen 14 dagen na aankoop contact opnemen via <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">8. Gebruik van de dienst</h2>
            <div className="space-y-2">
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
            <h2 className="text-base font-bold text-gray-900 mb-3">9. Beschikbaarheid en onderhoud</h2>
            <p>Wij streven naar een hoge beschikbaarheid van de dienst, maar geven geen garantie op ononderbroken toegang. Bij gepland onderhoud communiceren wij dit waar mogelijk vooraf. Storingen buiten onze invloedssfeer (bijv. bij Supabase, Anthropic of Stripe) vallen buiten onze verantwoordelijkheid.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">10. Aansprakelijkheid</h2>
            <div className="space-y-3">
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
            <h2 className="text-base font-bold text-gray-900 mb-3">11. Intellectueel eigendom</h2>
            <p>Alle rechten op de dienst, de software, het ontwerp en de inhoud van NooitMeerPostKwijt berusten bij Business XL. Jouw documenten en gegevens blijven te allen tijde van jou. Je verleent NooitMeerPostKwijt uitsluitend de rechten die noodzakelijk zijn om de dienst te kunnen leveren (tijdelijke verwerking voor AI-analyse).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">12. Privacy</h2>
            <p>Het gebruik van persoonsgegevens is geregeld in onze <Link href="/privacy" className="text-amber-600 hover:underline">privacyverklaring</Link>. Door gebruik te maken van de dienst ga je akkoord met de verwerking van je gegevens zoals beschreven in de privacyverklaring.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">13. Klachten</h2>
            <p>Heb je een klacht? Stuur een e-mail naar <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>. Wij reageren binnen 5 werkdagen. Als we er samen niet uitkomen, kun je terecht bij de bevoegde rechter (zie artikel 14).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">14. Toepasselijk recht en geschillen</h2>
            <p>Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement Zeeland-West-Brabant, tenzij dwingend recht een andere rechter voorschrijft.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">15. Wijzigingen</h2>
            <p>Wij kunnen deze voorwaarden aanpassen. Bij wezenlijke wijzigingen ontvang je minimaal 30 dagen van tevoren een melding per e-mail. De meest actuele versie is altijd te vinden op <a href="https://www.nooitmeerpostkwijt.nl/voorwaarden" className="text-amber-600 hover:underline">www.nooitmeerpostkwijt.nl/voorwaarden</a>.</p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL · KvK 50418041 · <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="underline hover:text-gray-600">nooitmeerpostkwijt@business-xl.nl</a>
        </p>
      </main>
    </div>
  );
}
