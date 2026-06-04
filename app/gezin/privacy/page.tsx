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
          <p className="text-gray-500">Versie 1.0 · Ingangsdatum: 27 mei 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Wie zijn wij</h2>
            <p>NooitMeerPostKwijt is een handelsnaam van Business XL, gevestigd in Nederland en ingeschreven bij de Kamer van Koophandel.</p>
            <div className="mt-3 bg-amber-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-medium">Handelsnaam:</span> NooitMeerPostKwijt</p>
              <p><span className="font-medium">Bedrijf:</span> Business XL</p>
              <p><span className="font-medium">Eigenaar:</span> Marco Doorakkers</p>
              <p><span className="font-medium">Adres:</span> Bosscheweg 44, 5056 KC Berkel-Enschot, Nederland</p>
              <p><span className="font-medium">KvK-nummer:</span> 50418041</p>
              <p><span className="font-medium">E-mail:</span> <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a></p>
              <p><span className="font-medium">Website:</span> <a href="https://www.nooitmeerpostkwijt.nl" className="text-amber-600 hover:underline">www.nooitmeerpostkwijt.nl</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Welke persoonsgegevens verwerken wij</h2>
            <p className="mb-3">Wij verwerken alleen gegevens die strikt noodzakelijk zijn voor het leveren van onze diensten:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.1 Accountgegevens</h3>
                <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
                  <li>E-mailadres</li>
                  <li>Wachtwoord (versleuteld opgeslagen)</li>
                  <li>Datum van registratie</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.2 Gebruik van de app</h3>
                <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
                  <li>Abonnementsstatus</li>
                  <li>Tijdstip van gebruik</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.3 Geüploade documenten</h3>
                <p className="text-sm text-gray-600 mb-1">Om AI-analyse mogelijk te maken, verwerken wij tijdelijk de foto&apos;s of PDF&apos;s die jij uploadt of via e-mail doorstuurt. Dit kunnen documenten zijn zoals brieven, facturen of polissen. Deze bestanden worden:</p>
                <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
                  <li>Via een beveiligde verbinding naar Anthropic verzonden voor analyse</li>
                  <li>Niet permanent opgeslagen op onze servers na verwerking</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">Als je documenten doorstuurt via e-mail, verwerken wij tijdelijk het afzenderadres van die e-mail om de analyse te kunnen uitvoeren. Dit adres wordt niet opgeslagen na verwerking.</p>
                <p className="text-sm text-gray-500 mt-1">Documenten die jij zelf opslaat in OneDrive of Dropbox worden door jou beheerd — niet door ons.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.4 Acties en instellingen</h3>
                <p className="text-sm text-gray-600">Actiepunten die je bijhoudt en instellingen zoals geadresseerden worden opgeslagen in onze beveiligde database, gekoppeld aan jouw account.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.5 Technische gegevens</h3>
                <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
                  <li>IP-adres</li>
                  <li>Browsertype en -versie</li>
                  <li>Apparaatinformatie</li>
                  <li>Loggegevens van je sessie</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Op welke grondslag verwerken wij jouw gegevens</h2>
            <p className="mb-3">Wij verwerken jouw persoonsgegevens op basis van de volgende grondslagen (AVG artikel 6):</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><span className="font-medium text-gray-800">Uitvoering van de overeenkomst:</span> om je account te beheren en de app beschikbaar te stellen.</li>
              <li><span className="font-medium text-gray-800">Gerechtvaardigd belang:</span> voor beveiliging, fraudepreventie en verbetering van de dienst.</li>
              <li><span className="font-medium text-gray-800">Wettelijke verplichting:</span> voor het bewaren van administratieve gegevens (fiscale bewaarplicht).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Gebruik van kunstmatige intelligentie</h2>
            <p className="mb-2">NooitMeerPostKwijt maakt gebruik van AI-technologie van Anthropic (Claude). De door jou geüploade documenten worden via een beveiligde verbinding naar Anthropic verzonden om het resultaat te genereren.</p>
            <p className="mb-2">Anthropic treedt op als verwerker en is NooitMeerPostKwijt de verwerkingsverantwoordelijke. Met Anthropic is een verwerkersovereenkomst (Data Processing Agreement) gesloten conform de vereisten van de AVG.</p>
            <p className="text-sm text-gray-500">Meer informatie: <a href="https://www.anthropic.com/privacy" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">www.anthropic.com/privacy</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cookies</h2>
            <p className="mb-2">Wij maken uitsluitend gebruik van functionele cookies die noodzakelijk zijn voor het goed functioneren van de app:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600 mb-2">
              <li>Inlogcookies (sessiebeheer)</li>
              <li>Voorkeursinstellingen</li>
            </ul>
            <p className="text-sm text-gray-600">Wij maken geen gebruik van tracking- of advertentiecookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Bewaartermijnen</h2>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Accountgegevens", "Zolang je account actief is, plus 12 maanden na verwijdering"],
                    ["Geüploade documenten (AI-verwerking)", "Worden na verwerking niet opgeslagen op onze servers"],
                    ["Actiepunten en instellingen", "Zolang je account actief is"],
                    ["Betalingsgegevens", "7 jaar (wettelijke fiscale bewaarplicht)"],
                    ["Loggegevens", "Maximaal 90 dagen"],
                  ].map(([type, period], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 font-medium text-gray-800 w-1/2">{type}</td>
                      <td className="px-4 py-3 text-gray-600">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Delen met derden</h2>
            <p className="mb-3">Wij verkopen jouw gegevens nooit aan derden. Wij werken uitsluitend samen met partijen die noodzakelijk zijn voor het leveren van onze diensten:</p>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
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
                  ].map(([party, purpose], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 font-medium text-gray-800">{party}</td>
                      <td className="px-4 py-3 text-gray-600">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Jouw rechten</h2>
            <p className="mb-3">Op basis van de AVG heb jij de volgende rechten:</p>
            <ul className="space-y-2 text-sm text-gray-600">
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
            <p className="mt-3 text-sm">Stuur een verzoek naar <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>. Wij reageren binnen 30 dagen.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Beveiliging</h2>
            <p className="mb-2">Wij nemen passende technische en organisatorische maatregelen om jouw gegevens te beschermen:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
              <li>Versleutelde verbindingen (HTTPS/TLS)</li>
              <li>Versleutelde opslag van wachtwoorden</li>
              <li>Beperkte toegang tot persoonsgegevens</li>
              <li>Row-level security: jouw gegevens zijn alleen voor jou zichtbaar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Klacht indienen</h2>
            <p className="mb-2">Ben je niet tevreden? Neem dan eerst contact met ons op via <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-amber-600 hover:underline">nooitmeerpostkwijt@business-xl.nl</a>.</p>
            <p className="text-sm text-gray-600">Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens:<br />
              Website: <a href="https://www.autoriteitpersoonsgegevens.nl" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">www.autoriteitpersoonsgegevens.nl</a><br />
              Telefoon: 088 - 1805 250
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Wijzigingen</h2>
            <p>Wij kunnen deze privacyverklaring aanpassen. Bij wezenlijke wijzigingen ontvang je een melding via e-mail of via de website. De meest actuele versie is altijd te vinden op <a href="https://www.nooitmeerpostkwijt.nl/privacy" className="text-amber-600 hover:underline">www.nooitmeerpostkwijt.nl/privacy</a>.</p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} NooitMeerPostKwijt · Business XL (Marco Doorakkers) · KvK 50418041 · <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="underline hover:text-gray-600">nooitmeerpostkwijt@business-xl.nl</a>
        </p>
      </main>
    </div>
  );
}
