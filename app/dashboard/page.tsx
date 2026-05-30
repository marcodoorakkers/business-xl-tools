import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits ?? 0;
  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  const categories = [
    {
      label: "Communicatie & Vergaderen",
      tools: [
        {
          name: "Voice Mail Draft",
          description: "Spreek in wat je wilt mailen — de app maakt er een concept mail van.",
          href: "/tools/voice-mail",
          credits: 2,
          icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
          color: "from-purple-500 to-indigo-500",
          bg: "bg-purple-50",
        },
        {
          name: "Meeting Memo",
          description: "Neem je vergadering op of upload notulen en ontvang automatisch gestructureerde notulen.",
          href: "/tools/meeting-memo",
          credits: 2,
          icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
          color: "from-blue-500 to-cyan-500",
          bg: "bg-blue-50",
        },
      ],
    },
    {
      label: "Documenten & Presentaties",
      tools: [
        {
          name: "Document Opmaken",
          description: "Upload een Word-document en ontvang een professioneel opgemaakt versie met inhoudsopgave, koppen en paginanummers.",
          href: "/tools/word-formatter",
          credits: 2,
          icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44z"/></svg>,
          color: "from-teal-500 to-cyan-500",
          bg: "bg-teal-50",
        },
        {
          name: "Presentatie Outline",
          description: "Geef je onderwerp en duur op en ontvang direct een complete slideopbouw met spreektips.",
          href: "/tools/presentation-outline",
          credits: 1,
          icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
          color: "from-violet-500 to-purple-500",
          bg: "bg-violet-50",
        },
        ...(process.env.MIJN_DOSSIER_ENABLED === "true" ? [{
          name: "MijnDossier",
          description: "Maak een foto van een brief of document. NooitMeerPostKwijt analyseert het en houdt bij welke acties er nodig zijn.",
          href: "/tools/mijn-dossier",
          credits: 1,
          icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 5l10 8 10-8"/></svg>,
          color: "from-sky-500 to-blue-600",
          bg: "bg-sky-50",
        }] : []),
      ],
    },
    {
      label: "Loopbaan",
      tools: [
        {
          name: "CV & Vacatures",
          description: "Upload je CV, krijg een professioneel opgemaakt CV en ontdek direct passende vacatures. Pas je CV automatisch aan op een specifieke functie.",
          href: "/tools/loopbaan",
          credits: 2,
          icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
          color: "from-blue-500 to-indigo-500",
          bg: "bg-blue-50",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar credits={credits} isAdmin={isAdmin} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Jouw tools</h1>
          <p className="text-gray-500 text-sm">Kies een tool om te starten. Eenvoudige tools kosten 1 credit, uitgebreidere tools 2 credits.</p>
        </div>

        <div className="flex flex-col gap-10">
          {categories.map((cat) => (
            <div key={cat.label}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {cat.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`${tool.bg} rounded-3xl p-7 flex flex-col gap-4 hover:shadow-md transition-shadow`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">{tool.credits} {tool.credits === 1 ? "credit" : "credits"} per gebruik →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile tip */}
        <Link href="/mobiel" className="mt-10 flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all group">
          <svg className="w-5 h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Gebruik je TimeSaverTools ook op je telefoon?</p>
            <p className="text-xs text-gray-500">Voeg het toe aan je beginscherm — werkt als een echte app.</p>
          </div>
          <span className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm">→</span>
        </Link>
      </main>
    </div>
  );
}
