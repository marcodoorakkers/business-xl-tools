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
  },
  {
    name: "Meeting Memo",
    description: "Neem je vergadering op en ontvang automatisch gestructureerde notulen.",
    href: "/tools/meeting-memo",
    credits: 1,
    icon: "📝",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar credits={credits} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Jouw tools</h1>
        <p className="text-gray-500 text-sm mb-8">Kies een tool om te starten. Elke actie kost 1 credit.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col gap-2"
            >
              <span className="text-3xl">{tool.icon}</span>
              <h2 className="font-semibold text-gray-900">{tool.name}</h2>
              <p className="text-sm text-gray-500">{tool.description}</p>
              <span className="text-xs text-blue-600 font-medium mt-1">{tool.credits} credit per gebruik</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
