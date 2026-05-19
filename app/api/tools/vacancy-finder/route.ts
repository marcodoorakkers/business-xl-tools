import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
  contract_type?: string;
}

interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  created: string;
  scope: "nl" | "remote" | "international";
}

async function searchAdzuna(country: string, what: string, where?: string): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what,
    results_per_page: "8",
    contract: "1",
    sort_by: "date",
  });
  if (where) params.set("where", where);

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
      { headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) => n >= 1000 ? `€${Math.round(n / 1000)}k` : `€${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `vanaf ${fmt(min)}`;
  if (max) return `t/m ${fmt(max)}`;
}

function mapJobs(jobs: AdzunaJob[], scope: Vacancy["scope"]): Vacancy[] {
  return jobs.map((j) => ({
    id: `${scope}-${j.id}`,
    title: j.title,
    company: j.company?.display_name ?? "Onbekend",
    location: j.location?.display_name ?? "",
    description: j.description?.slice(0, 200) ?? "",
    url: j.redirect_url,
    salary: formatSalary(j.salary_min, j.salary_max),
    created: j.created,
    scope,
  }));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 1) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    return NextResponse.json({ error: "Vacaturezoeker is nog niet geconfigureerd. Voeg ADZUNA_APP_ID en ADZUNA_APP_KEY toe in Vercel." }, { status: 503 });
  }

  const { profileText } = await req.json();
  if (!profileText?.trim()) return NextResponse.json({ error: "Geen profiel opgegeven" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Step 1: analyze profile
  const analysis = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Analyseer dit LinkedIn profiel/CV en extraheer de meest relevante informatie voor een vacaturezoeker.
Geef ALLEEN een JSON object terug, zonder extra tekst of markdown:
{
  "titles": ["meest relevante functietitel in het Engels", "tweede optie", "derde optie"],
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experience": "bijv. 8 jaar",
  "summary": "1-zin samenvatting van het profiel in het Nederlands"
}

Profiel:
${profileText.slice(0, 3000)}`,
    }],
  });

  const analysisContent = analysis.content[0];
  if (analysisContent.type !== "text") return NextResponse.json({ error: "Profielanalyse mislukt" }, { status: 500 });

  let profileData: { titles: string[]; skills: string[]; experience: string; summary: string };
  try {
    const cleaned = analysisContent.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error();
    profileData = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "Kon profiel niet verwerken" }, { status: 500 });
  }

  const primaryTitle = profileData.titles[0] ?? "professional";
  const skillsStr = profileData.skills.slice(0, 3).join(" ");

  // Step 2: search vacancies in parallel
  const [nlJobs, remoteJobs, intJobs] = await Promise.all([
    searchAdzuna("nl", `${primaryTitle} freelance ${skillsStr}`),
    searchAdzuna("gb", `${primaryTitle} remote freelance contract ${skillsStr}`),
    searchAdzuna("gb", `${primaryTitle} contract ${skillsStr}`),
  ]);

  // Deduplicate across searches by title+company
  const seen = new Set<string>();
  const allVacancies: Vacancy[] = [];

  for (const v of [
    ...mapJobs(nlJobs, "nl"),
    ...mapJobs(remoteJobs, "remote"),
    ...mapJobs(intJobs, "international"),
  ]) {
    const key = `${v.title.toLowerCase()}-${v.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      allVacancies.push(v);
    }
  }

  await supabase.rpc("decrement_credits", { user_id: user.id });
  await supabase.from("usage_logs").insert({ user_id: user.id, tool: "vacancy-finder", credits_used: 1 });

  return NextResponse.json({ profile: profileData, vacancies: allVacancies });
}
