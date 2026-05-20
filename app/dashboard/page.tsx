import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const tools = [
  {
    name: "Voice Mail Draft",
    description: "Spreek in wat je wilt mailen — de app maakt er een concept mail van.",
    href: "/tools/voice-mail",
    credits: 1,
    icon: "🎙️",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
  },
  {
    name: "Meeting Memo",
    description: "Neem je vergadering op en ontvang automatisch gestructureerde notulen.",
    href: "/tools/meeting-memo",
    credits: 1,
    icon: "📝",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    name: "Weekmenu Planner",
    description: "Geef je voorkeuren op en ontvang een weekmenu voor 7 avondmaaltijden met boodschappenlijst.",
    href: "/tools/dinner-planner",
    credits: 1,
    icon: "🍽️",
    color: "from-orange-400 to-pink-500",
    bg: "bg-orange-50",
  },
  {
    name: "Vacaturezoeker",
    description: "Plak je LinkedIn profiel en vind actuele freelance & contract vacatures in NL, remote en internationaal.",
    href: "/tools/vacancy-finder",
    credits: 1,
    icon: "🔍",
    color: "from-green-500 to-teal-500",
    bg: "bg-green-50",
  },
];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar credits={credits} isAdmin={isAdmin} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Jouw tools</h1>
          <p className="text-gray-500 text-sm">Kies een tool om te starten. Elke actie kost 1 credit.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`${tool.bg} rounded-3xl p-7 flex flex-col gap-4 hover:shadow-md transition-shadow`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-2xl shadow-md`}>
                {tool.icon}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
              </div>
              <span className="text-xs text-blue-600 font-semibold">{tool.credits} credit per gebruik →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
