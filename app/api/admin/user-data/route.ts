import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId vereist" }, { status: 400 });

  const format = req.nextUrl.searchParams.get("format") ?? "html";

  const admin = createAdminClient();

  const [profile, documents, actions, settings, members] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("documents").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("document_actions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("archive_settings").select("*").eq("user_id", userId).single(),
    admin.from("archive_family_members").select("*").eq("user_id", userId),
  ]);

  if (format === "json") {
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      profiel: profile.data ?? null,
      instellingen: settings.data ?? null,
      geadresseerden: members.data ?? [],
      documenten: documents.data ?? [],
      acties: actions.data ?? [],
    };
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nmpk-gegevens-${userId.slice(0, 8)}.json"`,
      },
    });
  }

  // HTML rapport
  const exportDate = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const p = profile.data ?? {};
  const s = settings.data ?? {};
  const docs = documents.data ?? [];
  const acts = actions.data ?? [];
  const mems = members.data ?? [];

  function row(label: string, value: unknown) {
    if (value === null || value === undefined || value === "") return "";
    return `<tr><td class="label">${esc(label)}</td><td>${esc(String(value))}</td></tr>`;
  }

  function esc(str: string) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmt(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  }

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Gegevensexport — NooitMeerPostKwijt</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; color: #1a1a1a; background: #f9f9f9; padding: 40px; }
  .page { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .meta { color: #888; font-size: 12px; margin-bottom: 32px; }
  h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #555; margin: 28px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td { padding: 6px 8px; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
  td.label { color: #666; width: 200px; font-weight: 500; white-space: nowrap; }
  .card { border: 1px solid #eee; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
  .card-title { font-weight: 600; margin-bottom: 6px; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; margin-right: 4px; }
  .badge-open { background: #fef3c7; color: #92400e; }
  .badge-gedaan { background: #d1fae5; color: #065f46; }
  .badge-overgeslagen { background: #f3f4f6; color: #6b7280; }
  .empty { color: #aaa; font-style: italic; font-size: 12px; padding: 8px 0; }
  @media print { body { background: white; padding: 0; } .page { box-shadow: none; padding: 20px; } }
</style>
</head>
<body>
<div class="page">
  <h1>Gegevensexport</h1>
  <p class="meta">NooitMeerPostKwijt · Gegenereerd op ${exportDate} · Gebruiker ${esc(userId.slice(0, 8))}…</p>

  <h2>Profiel</h2>
  <table>
    ${row("E-mailadres", p.email)}
    ${row("Aangemeld op", fmt(p.created_at))}
    ${row("Abonnementsstatus", p.subscription_status)}
    ${row("Proefperiode eindigt", fmt(p.subscription_period_end))}
    ${row("Promo code", p.promo_code)}
  </table>

  <h2>Instellingen</h2>
  <table>
    ${row("Opslagvoorkeur", s.storage_preference)}
    ${row("Mapstructuur", s.folder_structure === "by_person" ? "Per geadresseerde" : s.folder_structure === "by_subject" ? "Per onderwerp" : s.folder_structure)}
  </table>

  <h2>Geadresseerden (${mems.length})</h2>
  ${mems.length === 0 ? '<p class="empty">Geen geadresseerden.</p>' : mems.map(m => `
    <div class="card">
      <div class="card-title">${esc(m.name ?? "")}</div>
      ${m.full_name ? `<div style="color:#666;font-size:12px">${esc(m.full_name)}</div>` : ""}
    </div>`).join("")}

  <h2>Documenten (${docs.length})</h2>
  ${docs.length === 0 ? '<p class="empty">Geen documenten.</p>' : docs.map(d => `
    <div class="card">
      <div class="card-title">${esc(d.afzender ?? "Onbekend")} — ${esc(d.onderwerp ?? "")}</div>
      <table>
        ${row("Datum", fmt(d.datum))}
        ${row("Type", d.type)}
        ${row("Mappad", d.mappad)}
        ${row("Bestandsnaam", d.bestandsnaam)}
        ${row("Geadresseerde", d.gezinslid)}
        ${row("Samenvatting", d.samenvatting)}
        ${row("Opgeslagen in", d.storage)}
        ${row("Toegevoegd op", fmt(d.created_at))}
      </table>
    </div>`).join("")}

  <h2>Acties (${acts.length})</h2>
  ${acts.length === 0 ? '<p class="empty">Geen acties.</p>' : acts.map(a => `
    <div class="card">
      <div class="card-title">
        <span class="badge badge-${esc(a.status ?? "open")}">${esc(a.status ?? "open")}</span>
        ${esc(a.actie ?? "")}
      </div>
      <table>
        ${row("Afzender", a.afzender)}
        ${row("Document", a.document_naam)}
        ${row("Type", a.actie_type)}
        ${row("Deadline", fmt(a.deadline))}
        ${row("Aangemaakt op", fmt(a.created_at))}
      </table>
    </div>`).join("")}

</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
