import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const [profile, documents, actions, settings, members] = await Promise.all([
    supabase.from("profiles").select("subscription_status, subscription_period_end, promo_code, created_at").eq("id", user.id).single(),
    supabase.from("documents").select("afzender, type, datum, onderwerp, mappad, bestandsnaam, gezinslid, samenvatting, storage, actie, actie_gedaan, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("document_actions").select("actie, actie_type, deadline, status, afzender, document_naam, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("archive_settings").select("storage_preference, folder_structure").eq("user_id", user.id).single(),
    supabase.from("archive_family_members").select("name, full_name").eq("user_id", user.id),
  ]);

  const p = profile.data ?? {};
  const s = settings.data ?? {};
  const docs = documents.data ?? [];
  const acts = actions.data ?? [];
  const mems = members.data ?? [];

  const exportDate = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  function esc(str: string) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmt(d: string | null | undefined) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  }

  function row(label: string, value: unknown) {
    if (value === null || value === undefined || value === "") return "";
    return `<tr><td class="label">${esc(label)}</td><td>${esc(String(value))}</td></tr>`;
  }

  const statusLabel: Record<string, string> = {
    trialing: "Proefperiode",
    active: "Actief",
    cancelling: "Loopt af",
  };

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Mijn gegevens — NooitMeerPostKwijt</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; color: #1a1a1a; background: #f9f9f9; padding: 40px; }
  .page { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .meta { color: #888; font-size: 12px; margin-bottom: 8px; }
  .notice { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-bottom: 28px; font-size: 12px; color: #78350f; line-height: 1.5; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #555; margin: 28px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
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
  <h1>Mijn gegevens</h1>
  <p class="meta">NooitMeerPostKwijt · Gegenereerd op ${exportDate}</p>
  <div class="notice">
    Dit is een volledig overzicht van alle gegevens die NooitMeerPostKwijt over jou opslaat.
    Je foto's en documenten worden <strong>nooit opgeslagen</strong> op onze servers — alleen de AI-analyse (afzender, type, samenvatting) staat hieronder.
    Je bestanden staan uitsluitend in jouw eigen OneDrive of Dropbox.
  </div>

  <h2>Account</h2>
  <table>
    ${row("E-mailadres", user.email)}
    ${row("Aangemeld op", fmt((p as Record<string, string>).created_at))}
    ${row("Abonnementsstatus", statusLabel[(p as Record<string, string>).subscription_status] ?? (p as Record<string, string>).subscription_status ?? "—")}
    ${row("Abonnement loopt tot", fmt((p as Record<string, string>).subscription_period_end))}
    ${row("Promo code", (p as Record<string, string>).promo_code)}
  </table>

  <h2>Instellingen</h2>
  <table>
    ${row("Opslaglocatie", (s as Record<string, string>).storage_preference)}
    ${row("Mapstructuur", (s as Record<string, string>).folder_structure === "by_person" ? "Per geadresseerde" : (s as Record<string, string>).folder_structure === "by_subject" ? "Per onderwerp" : (s as Record<string, string>).folder_structure ?? "—")}
  </table>

  <h2>Geadresseerden (${mems.length})</h2>
  ${mems.length === 0 ? '<p class="empty">Geen geadresseerden toegevoegd.</p>' : mems.map((m: Record<string, string>) => `
    <div class="card">
      <div class="card-title">${esc(m.name ?? "")}</div>
      ${m.full_name ? `<div style="color:#666;font-size:12px">${esc(m.full_name)}</div>` : ""}
    </div>`).join("")}

  <h2>Documenten (${docs.length})</h2>
  ${docs.length === 0 ? '<p class="empty">Nog geen documenten gescand.</p>' : docs.map((d: Record<string, string>) => `
    <div class="card">
      <div class="card-title">${esc(d.afzender ?? "Onbekend")}${d.onderwerp ? ` — ${esc(d.onderwerp)}` : ""}</div>
      <table>
        ${row("Datum document", fmt(d.datum))}
        ${row("Type", d.type)}
        ${row("Mappad", d.mappad)}
        ${row("Bestandsnaam", d.bestandsnaam)}
        ${row("Geadresseerde", d.gezinslid)}
        ${row("Samenvatting", d.samenvatting)}
        ${row("Opgeslagen in", d.storage)}
        ${row("Actie", d.actie)}
        ${row("Gescand op", fmt(d.created_at))}
      </table>
    </div>`).join("")}

  <h2>Acties (${acts.length})</h2>
  ${acts.length === 0 ? '<p class="empty">Geen acties.</p>' : acts.map((a: Record<string, string>) => `
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
      "Content-Disposition": `attachment; filename="mijn-gegevens-nmpk-${new Date().toISOString().slice(0, 10)}.html"`,
    },
  });
}
