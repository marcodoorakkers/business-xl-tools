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
  contract_type?: string; // "permanent" | "contract"
  contract_time?: string; // "full_time" | "part_time"
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
  contractType: string;
}

function deriveContractType(job: AdzunaJob): string {
  const ct = (job.contract_type ?? "").toLowerCase();
  const ctime = (job.contract_time ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();
  const desc = (job.description ?? "").toLowerCase();

  if (ct === "permanent" || title.includes("permanent") || title.includes(" vast ") || desc.includes("vast dienstverband")) return "permanent";
  if (ctime === "part_time" || title.includes("part-time") || title.includes("part time")) return "part-time";
  if (ct === "contract" || title.includes("freelance") || title.includes("zzp") || title.includes("interim") || desc.includes("freelance")) return "freelance";
  return "contract";
}

async function searchAdzuna(
  country: string,
  what: string,
  scope: Vacancy["scope"]
): Promise<Vacancy[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what,
    results_per_page: "10",
    sort_by: "date",
  });

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[vacancy-finder] Adzuna ${country} "${what}" → ${res.status}:`, body.slice(0, 200));
      return [];
    }
    const data = await res.json();
    const jobs: AdzunaJob[] = data.results ?? [];
    console.log(`[vacancy-finder] Adzuna ${country} "${what}" → ${jobs.length} results`);
    return jobs.map((j) => ({
      id: `${scope}-${j.id}`,
      title: j.title,
      company: j.company?.display_name ?? "Onbekend",
      location: j.location?.display_name ?? "",
      description: j.description?.slice(0, 220) ?? "",
      url: j.redirect_url,
      salary: formatSalary(j.salary_min, j.salary_max),
      created: j.created,
      scope,
      contractType: deriveContractType(j),
    }));
  } catch (err) {
    console.error(`[vacancy-finder] Adzuna ${country} fetch error:`, err);
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

  const analysis = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Analyseer dit CV voor een vacaturezoeker gericht op freelance/ZZP werk.
Geef ALLEEN een JSON object terug, zonder extra tekst of markdown:
{
  "titles": ["meest relevante Engelstalige functietitel (kort, 1-3 woorden)", "tweede optie", "derde optie"],
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "bijv. 8 jaar",
  "summary": "1-zin samenvatting van het profiel in het Nederlands"
}

Houd de titels kort en generiek zodat ze goed werken als zoekterm. Bijv. "Developer" niet "Senior Full-Stack JavaScript Developer".

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
    if (!match) throw new Error("No JSON found");
    profileData = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "Kon profiel niet verwerken" }, { status: 500 });
  }

  console.log("[vacancy-finder] Profile extracted:", profileData.titles, profileData.skills);

  const title = profileData.titles[0] ?? "professional";
  const title2 = profileData.titles[1] ?? title;
  const title3 = profileData.titles[2] ?? title2;

  const [nlJobs1, nlJobs2, nlJobs3, remoteJobs, intJobs1, intJobs2] = await Promise.all([
    searchAdzuna("nl", title, "nl"),                           // breed: alleen functietitel
    searchAdzuna("nl", `${title2} freelance`, "nl"),           // tweede titel + freelance
    searchAdzuna("nl", `${title3} ZZP`, "nl"),                 // derde titel + ZZP
    searchAdzuna("gb", `${title} remote contract`, "remote"),
    searchAdzuna("gb", `${title} freelance contract`, "international"),
    searchAdzuna("gb", `${title2} contract`, "international"),
  ]);

  const seen = new Set<string>();
  const allVacancies: Vacancy[] = [];
  for (const v of [...nlJobs1, ...nlJobs2, ...nlJobs3, ...remoteJobs, ...intJobs1, ...intJobs2]) {
    const key = `${v.title.toLowerCase()}-${v.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      allVacancies.push(v);
    }
  }

  console.log(`[vacancy-finder] Total unique vacancies: ${allVacancies.length}`);

  await supabase.rpc("decrement_credits", { user_id: user.id });
  const { error: logErr } = await supabase.from("usage_logs").insert({ user_id: user.id, tool: "vacancy-finder", credits_used: 1 });
  if (logErr) console.error("[vacancy-finder] usage_logs insert failed:", logErr.message);

  return NextResponse.json({ profile: profileData, vacancies: allVacancies });
}
