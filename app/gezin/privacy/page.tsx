import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = { title: "Privacyverklaring — NooitMeerPostKwijt" };

export default function GezinPrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <NMMPKLogo />
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Terug</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Privacyverklaring</h1>
          <p className="text-gray-500 text-sm">Versie 1.1 · Ingangsdatum: 14 juni 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-10 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">1. Wie zijn wij</h2>
            <p>NooitMeerPostKwijt is een handelsnaam van Business XL, gevestigd in Nederland en ingeschreven bij de Kamer van Koophandel.</p>
            <div className="mt-3 bg-amber-50 rounded-xl p-4 space-y-1">
              <p><span className="font-medium text-gray-800">Handelsnaam:</span> NooitMeerPostKwijt</p>
              <p><span className="font-medium text-gray-800">Bedrijf:</span> Business XL</p>
              <p><span className="font-medium text-gray-800">Adres:</span> Bosscheweg 44, 5056 KC Berkel-Enschot, Nederland</p>
              <p><span className="font-medium text-gray-800">KvK-nummer:</span> 50418041</p>
              <p><span className="font-medium text-gray-800">E-mail:</span> <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a></p>
              <p><span className="font-medium text-gray-800">Website:</span> <a href="https://www.nooitmeerpostkwijt.nl" className="text-amber-600 hover:underline">www.nooitmeerpostkwijt.nl</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">2. Welke persoonsgegevens verwerken wij</h2>
            <p className="mb-4">Wij verwerken alleen gegevens die strikt noodzakelijk zijn voor het leveren van onze diensten:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.1 Accountgegevens</h3>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>E-mailadres</li>
                  <li>Wachtwoord (versleuteld opgeslagen)</li>
                  <li>Datum van registratie</li>
                  <li>Factuurgegevens (naam en adres) — alleen bij het afsluiten van een betaald abonnement, opgeslagen bij Stripe</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.2 Gebruik van de app</h3>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Abonnementsstatus</li>
                  <li>Tijdstip van gebruik</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.3 Geüploade documenten</h3>
                <p className="mb-2">Om AI-analyse mogelijk te maken, verwerken wij tijdelijk de foto&apos;s of PDF&apos;s die jij uploadt of via e-mail doorstuurt. Dit kunnen documenten zijn zoals brieven, facturen of polissen. Deze bestanden worden:</p>
                <ul className="list-disc list-inside space-y-0.5 mb-2">
                  <li>Via een beveiligde verbinding naar Anthropic verzonden voor analyse</li>
                  <li>Niet permanent opgeslagen op onze servers na verwerking</li>
                </ul>
                <p className="mb-2">Als je documenten doorstuurt via e-mail, verwerken wij tijdelijk het afzenderadres van die e-mail om de analyse te kunnen uitvoeren. Dit adres wordt niet opgeslagen na verwerking.</p>
                <p>Documenten die jij zelf opslaat in OneDrive, Dropbox of Google Drive worden door jou beheerd — niet door ons.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.4 Analyseresultaten en privacy-instelling</h3>
                <p className="mb-2">Na de AI-analyse slaan wij het resultaat op in onze beveiligde database. Welke velden worden bewaard, is afhankelijk van jouw privacyinstelling (te wijzigen via Instellingen → Privacy):</p>
                <div className="overflow-hidden rounded-xl border border-gray-100 mt-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="px-3 py-2 text-left font-semibold">Instelling</th>
                        <th className="px-3 py-2 text-left font-semibold">Wat wordt opgeslagen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">Alles bijhouden (standaard)</td>
                        <td className="px-3 py-2">Afzender, type, datum, samenvatting, acties en deadlines</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 font-medium text-gray-800">Acties bijhouden, geen samenvattingen</td>
                        <td className="px-3 py-2">Afzender, type, datum, acties en deadlines — geen samenvatting</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">Niets bijhouden</td>
                        <td className="px-3 py-2">Alleen afzender, type en datum — geen samenvatting, geen acties</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2">Instellingen zoals geadresseerden en opslagvoorkeur worden altijd opgeslagen, ongeacht de privacyinstelling.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.5 Technische gegevens</h3>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>IP-adres</li>
                  <li>Browsertype en -versie</li>
                  <li>Apparaatinformatie</li>
                  <li>Loggegevens van je sessie</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">3. Op welke grondslag verwerken wij jouw gegevens</h2>
            <p className="mb-3">Wij verwerken jouw persoonsgegevens op basis van de volgende grondslagen (AVG artikel 6):</p>
            <ul className="space-y-2">
              <li><span className="font-medium text-gray-800">Uitvoering van de overeenkomst:</span> om je account te beheren en de app beschikbaar te stellen.</li>
              <li><span className="font-medium text-gray-800">Gerechtvaardigd belang:</span> voor beveiliging, fraudepreventie en verbetering van de dienst.</li>
              <li><span className="font-medium text-gray-800">Wettelijke verplichting:</span> voor het bewaren van administratieve gegevens (fiscale bewaarplicht).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">4. Gebruik van kunstmatige intelligentie</h2>
            <p className="mb-2">NooitMeerPostKwijt maakt gebruik van AI-technologie van Anthropic (Claude). De door jou geüploade documenten worden via een beveiligde verbinding naar Anthropic verzonden voor analyse.</p>
            <p className="mb-2">NooitMeerPostKwijt is de verwerkingsverantwoordelijke; Anthropic treedt op als verwerker ten behoeve van NooitMeerPostKwijt. Het consumentenprivacybeleid van Anthropic is niet van toepassing — Anthropic verwerkt de gegevens uitsluitend in opdracht van NooitMeerPostKwijt conform hun API-gebruiksvoorwaarden. Documenten die via de API worden verwerkt, worden door Anthropic niet gebruikt voor modeltraining.</p>
            <p>Meer informatie: <a href="https://www.anthropic.com/legal" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">www.anthropic.com/legal</a></p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">5. Cookies</h2>
            <p className="mb-2">Wij maken uitsluitend gebruik van functionele cookies die noodzakelijk zijn voor het goed functioneren van de app:</p>
            <ul className="list-disc list-inside space-y-0.5 mb-2">
              <li>Inlogcookies (sessiebeheer)</li>
              <li>Voorkeursinstellingen</li>
            </ul>
            <p>Wij maken geen gebruik van tracking- of advertentiecookies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">6. Bewaartermijnen</h2>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full">
                <tbody>
                  {[
                    ["Accountgegevens", "Zolang je account actief is, plus 12 maanden na verwijdering"],
                    ["Geüploade documenten (AI-verwerking)", "Worden na verwerking niet opgeslagen op onze servers"],
                    ["Analyseresultaten (afzender, type, datum)", "Zolang je account actief is, tenzij je ze zelf verwijdert"],
                    ["Samenvatting en acties", "Afhankelijk van je privacyinstelling — kan ook helemaal niet worden opgeslagen"],
                    ["Instellingen en geadresseerden", "Zolang je account actief is"],
                    ["Betalingsgegevens", "7 jaar (wettelijke fiscale bewaarplicht)"],
                    ["Loggegevens", "Maximaal 90 dagen"],
                  ].map(([type, period], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 font-medium text-gray-800 w-1/2">{type}</td>
                      <td className="px-4 py-3">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">7. Delen met derden</h2>
            <p className="mb-3">Wij verkopen jouw gegevens nooit aan derden. Wij werken uitsluitend samen met partijen die noodzakelijk zijn voor het leveren van onze diensten:</p>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-2 text-left font-semibold">Partij</th>
                    <th className="px-4 py-2 text-left font-semibold">Doel</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Anthropic", "AI-analyse van documenten (zie artikel 4)"],
                    ["Supabase", "Database en authenticatie"],
                    ["Stripe", "Betalingsverwerking"],
                    ["Vercel", "Hosting van de website"],
                    ["Resend", "Verzenden van transactionele e-mails"],
                    ["Cloudflare", "Domeinbeveiliging en verwerking van inkomende e-mails (scan via e-mail)"],
                    ["Microsoft OneDrive", "Cloudopslag (alleen als je kiest voor OneDrive-opslag)"],
                    ["Dropbox", "Cloudopslag (alleen als je kiest voor Dropbox-opslag)"],
                    ["Google Drive", "Cloudopslag (alleen als je kiest voor Google Drive-opslag)"],
                  ].map(([party, purpose], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 font-medium text-gray-800">{party}</td>
                      <td className="px-4 py-3">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">8. Jouw rechten</h2>
            <p className="mb-3">Op basis van de AVG heb jij de volgende rechten:</p>
            <ul className="space-y-2">
              {[
                ["Recht op inzage", "je kunt opvragen welke gegevens wij van je bewaren."],
                ["Recht op rectificatie", "je kunt onjuiste gegevens laten corrigeren."],
                ["Recht op verwijdering", "je kunt vragen om verwijdering van jouw gegevens."],
                ["Recht op beperking", "je kunt de verwerking tijdelijk laten stoppen."],
                ["Recht op dataportabiliteit", "je kunt jouw gegevens opvragen in een leesbaar formaat."],
                ["Recht van bezwaar", "je kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang."],
              ].map(([right, desc]) => (
                <li key={right}><span className="font-medium text-gray-800">{right}:</span> {desc}</li>
              ))}
            </ul>
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-gray-800">Zelf regelen via de app</p>
              <p>Via je accountpagina kun je zonder tussenkomst van ons:</p>
              <ul className="list-disc list-inside space-y-0.5 mt-1">
                <li><span className="font-medium">Gegevens bekijken &amp; downloaden</span> — een overzicht van alles wat wij van je opslaan, op te slaan als PDF (recht op inzage + dataportabiliteit)</li>
                <li><span className="font-medium">Samenvattingen en acties wissen</span> — verwijdert gevoelige tekstinhoud, bewaard structuurdata</li>
                <li><span className="font-medium">Alle documenten en acties verwijderen</span> — volledig opruimen van je archief</li>
                <li><span className="font-medium">Account verwijderen</span> — verwijdert je account en alle bijbehorende gegevens</li>
              </ul>
            </div>
            <p className="mt-3">Voor overige verzoeken: <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>. Wij reageren binnen 30 dagen.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">9. Beveiliging</h2>
            <p className="mb-2">Wij nemen passende technische en organisatorische maatregelen om jouw gegevens te beschermen:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Versleutelde verbindingen (HTTPS/TLS)</li>
              <li>Versleutelde opslag van wachtwoorden</li>
              <li>Versleutelde opslag van cloudopslagtokens (AES-256-GCM)</li>
              <li>Beperkte toegang tot persoonsgegevens</li>
              <li>Row-level security: andere gebruikers kunnen jouw gegevens nooit inzien</li>
              <li>Beheerderstoegang is beperkt tot scan-metadata voor ondersteuning en AVG-verzoeken — werkelijke bestanden zijn voor ons nooit toegankelijk</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">10. Klacht indienen</h2>
            <p className="mb-2">Ben je niet tevreden? Neem dan eerst contact met ons op via <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>.</p>
            <p>Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens:<br />
              Website: <a href="https://www.autoriteitpersoonsgegevens.nl" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">www.autoriteitpersoonsgegevens.nl</a><br />
              Telefoon: 088 - 1805 250
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">11. Wijzigingen</h2>
            <p>Wij kunnen deze privacyverklaring aanpassen. Bij wezenlijke wijzigingen ontvang je een melding via e-mail of via de website. De meest actuele versie is altijd te vinden op <a href="https://www.nooitmeerpostkwijt.nl/privacy" className="text-amber-600 hover:underline">www.nooitmeerpostkwijt.nl/privacy</a>.</p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL · KvK 50418041 · <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="underline hover:text-gray-600">nooitmeerpostkwijt@business-xl.nl</a>
        </p>
      </main>
    </div>
  );
}
