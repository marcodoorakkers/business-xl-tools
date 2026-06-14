import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { convertToPdf } from "@/lib/convert-to-pdf";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

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

  // Logo als base64 inbedden zodat Puppeteer het kan renderen
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public", "gezin-apple-touch-icon.png");
    logoBase64 = fs.readFileSync(logoPath).toString("base64");
  } catch { /* logo niet beschikbaar, geen probleem */ }

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
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: white; padding: 0; }

  .header { background: #f59e0b; padding: 28px 40px; display: flex; align-items: center; gap: 16px; }
  .header img { width: 48px; height: 48px; border-radius: 12px; }
  .header-text h1 { font-size: 20px; font-weight: 800; color: white; margin-bottom: 2px; }
  .header-text p { font-size: 11px; color: #fef3c7; }

  .content { padding: 32px 40px; }

  .notice { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; font-size: 11px; color: #78350f; line-height: 1.6; }

  h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #f59e0b; margin: 24px 0 8px; border-bottom: 1.5px solid #fde68a; padding-bottom: 5px; }
  h2:first-of-type { margin-top: 0; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  td { padding: 5px 8px; vertical-align: top; border-bottom: 1px solid #f5f5f5; font-size: 11px; }
  td.label { color: #888; width: 180px; font-weight: 500; white-space: nowrap; }

  .card { border: 1px solid #eee; border-radius: 6px; padding: 10px 12px; margin-bottom: 6px; page-break-inside: avoid; }
  .card-title { font-weight: 600; font-size: 12px; margin-bottom: 5px; color: #111; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 10px; font-weight: 600; margin-right: 4px; }
  .badge-open { background: #fef3c7; color: #92400e; }
  .badge-gedaan { background: #d1fae5; color: #065f46; }
  .badge-overgeslagen { background: #f3f4f6; color: #6b7280; }
  .empty { color: #aaa; font-style: italic; font-size: 11px; padding: 6px 0; }

  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #bbb; }
</style>
</head>
<body>

<div class="header">
  ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="NooitMeerPostKwijt" />` : ""}
  <div class="header-text">
    <h1>Mijn gegevens</h1>
    <p>NooitMeerPostKwijt · Gegenereerd op ${exportDate}</p>
  </div>
</div>

<div class="content">
  <div class="notice">
    Dit is een volledig overzicht van alle gegevens die NooitMeerPostKwijt over jou opslaat.
    Foto's en documenten worden <strong>nooit opgeslagen</strong> op onze servers — alleen de AI-analyse (afzender, type, samenvatting) staat hieronder.
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
      ${m.full_name ? `<div style="color:#666;font-size:11px">${esc(m.full_name)}</div>` : ""}
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

  <div class="footer">NooitMeerPostKwijt · nooitmeerpostkwijt.nl · © ${new Date().getFullYear()} Business XL</div>
</div>

</body>
</html>`;

  const htmlBuffer = Buffer.from(html, "utf-8");
  const filename = `mijn-gegevens-nmpk-${new Date().toISOString().slice(0, 10)}`;

  try {
    const pdfBuffer = await convertToPdf(htmlBuffer, "text/html");
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch {
    // PDF generation failed (Chromium not available) — serve HTML instead
    return new NextResponse(htmlBuffer, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.html"`,
      },
    });
  }
}
