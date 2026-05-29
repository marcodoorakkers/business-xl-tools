import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";

export const metadata = { title: "Gebruik op je telefoon — NooitMeerPostKwijt" };

const iphoneSteps = [
  { step: "1", text: "Open Safari op je iPhone (niet Chrome of een andere browser)." },
  { step: "2", text: "Ga naar nooitmeerpostkwijt.nl en log in." },
  { step: "3", text: "Tik onderaan op het Deel-icoon — het vierkantje met een pijltje omhoog." },
  { step: "4", text: "Scroll omlaag in het menu en tik op 'Zet op beginscherm'." },
  { step: "5", text: "Geef het eventueel een naam en tik rechtsboven op 'Voeg toe'." },
];

const androidSteps = [
  { step: "1", text: "Open Chrome op je Android of Samsung telefoon." },
  { step: "2", text: "Ga naar nooitmeerpostkwijt.nl en log in." },
  { step: "3", text: "Tik op de drie puntjes rechtsboven in Chrome." },
  { step: "4", text: "Tik op 'Toevoegen aan beginscherm' of 'App installeren'." },
  { step: "5", text: "Bevestig met 'Toevoegen' of 'Installeren'." },
];

export default function GezinMobielPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-extrabold text-amber-700 text-lg">
          <NMMPKLogo />
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Terug
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Gebruik op je telefoon</h1>
        <p className="text-gray-500 text-lg mb-10">
          Voeg NooitMeerPostKwijt toe aan je beginscherm — dan scan je je post direct vanuit je broekzak, net als een echte app. Geen download nodig.
        </p>

        <div className="flex flex-col gap-8">

          {/* iPhone */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl"></span>
              <h2 className="text-xl font-bold text-gray-900">iPhone (Safari)</h2>
            </div>
            <ol className="flex flex-col gap-4">
              {iphoneSteps.map((s) => (
                <li key={s.step} className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <p className="text-gray-700 text-sm leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800">
              <strong>Let op:</strong> gebruik altijd <strong>Safari</strong> op iPhone. Vanuit Chrome of andere browsers werkt toevoegen aan beginscherm niet.
            </div>
          </div>

          {/* Android */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🤖</span>
              <h2 className="text-xl font-bold text-gray-900">Android / Samsung (Chrome)</h2>
            </div>
            <ol className="flex flex-col gap-4">
              {androidSteps.map((s) => (
                <li key={s.step} className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <p className="text-gray-700 text-sm leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800">
              <strong>Samsung Internet?</strong> Tik op het menu-icoon onderaan en kies &apos;Pagina toevoegen aan&apos; &rarr; &apos;Beginscherm&apos;.
            </div>
          </div>

          {/* Result */}
          <div className="bg-gray-900 rounded-2xl p-8 text-white text-center">
            <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 5l10 8 10-8" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Klaar!</h3>
            <p className="text-gray-400 text-sm">
              NooitMeerPostKwijt verschijnt nu als icoontje op je beginscherm. Tik erop, maak een foto van je post en je bent klaar — geen browser, geen zoeken.
            </p>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Vragen? Mail naar{" "}
          <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="underline hover:text-gray-600">
            nooitmeerpostkwijt@business-xl.nl
          </a>
        </p>
      </main>
    </div>
  );
}
