import Link from "next/link";
import BottomNav from "../components/BottomNav";

export const metadata = { title: "Aan de slag — NooitMeerPostKwijt" };

const steps = [
  {
    num: "1",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: "Koppel je cloudopslag",
    body: "Ga naar Instellingen en koppel OneDrive of Dropbox. Kies daarna je opslagvoorkeur. Documenten worden dan automatisch in de juiste map opgeslagen — jij hoeft er niets voor te doen.",
    cta: { label: "Naar Instellingen →", href: "/dossier/instellingen" },
    ctaSecondary: [
      { label: "Gratis OneDrive aanmaken →", href: "https://onedrive.live.com" },
      { label: "Gratis Dropbox aanmaken →", href: "https://www.dropbox.com/register" },
    ],
  },
  {
    num: "2",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "Scan je eerste document",
    body: "Maak een foto van een brief, factuur of aanslag — of upload een PDF. NooitMeerPostKwijt herkent automatisch wat het is, wie de afzender is, of er actie nodig is en voor wie het bestemd is.",
    cta: { label: "Document scannen →", href: "/dossier" },
  },
  {
    num: "3",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
    title: "Documenten terugvinden",
    body: "Al je gescande documenten staan in Documenten. Zoek op afzender, onderwerp of datum. Filter op geadresseerde — handig als je meerdere personen of entiteiten hebt.",
    cta: { label: "Naar Documenten →", href: "/dossier/archief" },
  },
  {
    num: "4",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 5l10 8 10-8"/>
      </svg>
    ),
    title: "Doorsturen via e-mail",
    body: "Ontvang je een factuur of brief digitaal? Forward hem naar je persoonlijke scanadres. Het document wordt automatisch verwerkt — zonder dat je de app hoeft te openen. Je scanadres vind je in Instellingen.",
    cta: { label: "Scanadres bekijken →", href: "/dossier/instellingen" },
  },
];

const tips = [
  {
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
    title: "Meerdere personen of bedrijven?",
    body: "Voeg ze toe als geadresseerden in Instellingen. NooitMeerPostKwijt koppelt documenten automatisch aan de juiste persoon op basis van naam of initialen.",
  },
  {
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    title: "Mapstructuur instellen",
    body: "Kies in Instellingen voor 'Per geadresseerde' als je documenten per persoon wil indelen — ideaal als je meerdere entiteiten hebt.",
  },
  {
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: "Acties en deadlines",
    body: "Documenten met een actie (betalen, reageren, aanvragen) verschijnen automatisch in je actielijst. Je krijgt een herinnering als de deadline nadert.",
  },
];

export default function AanDeSlagPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-6 py-10 pb-24 space-y-10">

        {/* Intro */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Aan de slag</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            In vier stappen je administratie op orde. Het kost je de eerste keer 5 minuten — daarna gaat alles automatisch.
          </p>
        </div>

        {/* Stappen */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-white border border-gray-100 rounded-2xl p-6 flex gap-5 shadow-sm">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-amber-400">{step.num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 mb-1.5">{step.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{step.body}</p>
                <Link
                  href={step.cta.href}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                >
                  {step.cta.label}
                </Link>
                {"ctaSecondary" in step && step.ctaSecondary && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    <p className="text-xs text-gray-400">Nog geen account?</p>
                    {(step.ctaSecondary as { label: string; href: string }[]).map((s) => (
                      <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-gray-400 hover:text-amber-600 transition-colors">
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Handige tips</h2>
          <div className="space-y-3">
            {tips.map((tip) => (
              <div key={tip.title} className="bg-gray-50 rounded-2xl px-5 py-4 flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">{tip.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{tip.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-gray-800 mb-1">Klaar om te beginnen?</p>
          <p className="text-xs text-gray-500 mb-4">Scan je eerste document en zie hoe het werkt.</p>
          <Link
            href="/dossier"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Document scannen →
          </Link>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}
