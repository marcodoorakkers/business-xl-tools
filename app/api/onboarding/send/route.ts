import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const now = new Date();
  let sent = 0;

  // ── 1. WELKOMSTMAIL: trialing-gebruikers aangemeld in de afgelopen 24 uur ──
  const yesterday = new Date(now.getTime() - 24 * 3600_000).toISOString();
  const { data: newUsers } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("subscription_status", "trialing")
    .gte("created_at", yesterday)
    .not("id", "in", `(SELECT user_id FROM onboarding_emails WHERE email_type = 'welcome')`);

  for (const user of newUsers ?? []) {
    if (!user.email) continue;
    const { data: profile } = await supabase
      .from("profiles")
      .select("promo_code")
      .eq("id", user.id)
      .single();
    const isFoundingMember = profile?.promo_code === "founding25" || /^fm\d+$/.test(profile?.promo_code ?? "");
    const isVriend = profile?.promo_code === "vriendenvan";
    await resend.emails.send({
      from: "NooitMeerPostKwijt <noreply@timesavertools.nl>",
      to: user.email,
      subject: isFoundingMember ? "Welkom, Founding Member! 🎉" : isVriend ? "Welkom bij NooitMeerPostKwijt! 🎁" : "Welkom bij NooitMeerPostKwijt 👋",
      html: isFoundingMember ? welcomeFoundingHtml() : isVriend ? welcomeVriendHtml() : welcomeHtml(),
    });
    await supabase.from("onboarding_emails").insert({ user_id: user.id, email_type: "welcome" });
    sent++;
  }

  // ── 2. DAG 3: nog niet gescand? ──
  const day3Start = new Date(now.getTime() - 4 * 86400_000).toISOString();
  const day3End   = new Date(now.getTime() - 3 * 86400_000).toISOString();
  const { data: day3Users } = await supabase
    .from("profiles")
    .select("id, email")
    .in("subscription_status", ["trialing", "active"])
    .gte("created_at", day3Start)
    .lte("created_at", day3End)
    .not("id", "in", `(SELECT user_id FROM onboarding_emails WHERE email_type = 'day3')`);

  for (const user of day3Users ?? []) {
    if (!user.email) continue;
    // Alleen sturen als de gebruiker nog geen enkel document heeft gescand
    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) > 0) {
      // Al gescand — wel markeren als verzonden zodat we niet opnieuw checken
      await supabase.from("onboarding_emails").insert({ user_id: user.id, email_type: "day3" });
      continue;
    }
    await resend.emails.send({
      from: "NooitMeerPostKwijt <noreply@timesavertools.nl>",
      to: user.email,
      subject: "Heb je al je eerste document gescand?",
      html: day3Html(),
    });
    await supabase.from("onboarding_emails").insert({ user_id: user.id, email_type: "day3" });
    sent++;
  }

  // ── 3. PROEFPERIODE LOOPT AF: 5 dagen voor einde trial ──
  const in5days     = new Date(now.getTime() + 5 * 86400_000).toISOString().slice(0, 10);
  const in6days     = new Date(now.getTime() + 6 * 86400_000).toISOString().slice(0, 10);
  const { data: expiringUsers } = await supabase
    .from("profiles")
    .select("id, email, subscription_period_end")
    .eq("subscription_status", "trialing")
    .gte("subscription_period_end", in5days)
    .lt("subscription_period_end", in6days)
    .not("id", "in", `(SELECT user_id FROM onboarding_emails WHERE email_type = 'trial_ending')`);

  for (const user of expiringUsers ?? []) {
    if (!user.email) continue;
    const endDate = user.subscription_period_end
      ? new Date(user.subscription_period_end).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
      : "binnenkort";
    const { data: profile } = await supabase
      .from("profiles")
      .select("promo_code")
      .eq("id", user.id)
      .single();
    const isFoundingMember = profile?.promo_code === "founding25" || /^fm\d+$/.test(profile?.promo_code ?? "");
    const isVriend = profile?.promo_code === "vriendenvan";
    const is6Months = isFoundingMember || isVriend;
    await resend.emails.send({
      from: "NooitMeerPostKwijt <noreply@timesavertools.nl>",
      to: user.email,
      subject: is6Months ? "Je 6 maanden gratis lopen bijna af" : "Je proefperiode loopt bijna af",
      html: trialEndingHtml(endDate, is6Months),
    });
    await supabase.from("onboarding_emails").insert({ user_id: user.id, email_type: "trial_ending" });
    sent++;
  }

  return NextResponse.json({ sent });
}

// ─────────────────────────────────────────────
// HTML-templates
// ─────────────────────────────────────────────

function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr><td style="background:#f59e0b;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:16px;font-weight:800;letter-spacing:-.01em;">NooitMeerPostKwijt</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #f5f5f4;">
          <p style="margin:0;color:#a8a29e;font-size:12px;">NooitMeerPostKwijt · Business XL · <a href="https://nooitmeerpostkwijt.nl" style="color:#a8a29e;">nooitmeerpostkwijt.nl</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function cta(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:8px;">${label}</a>`;
}

function welcomeFoundingHtml() {
  return emailShell(`
    <div style="background:#fef3c7;border-radius:12px;padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:20px;">⭐</span>
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:700;">Jij bent een van de eerste 25 — Founding Member</p>
    </div>
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Welkom! Je krijgt 6 maanden gratis.</h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Goed dat je erbij bent. Als founding member krijg je <strong>6 maanden gratis</strong> toegang tot NooitMeerPostKwijt — geen creditcard nodig.
    </p>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      NooitMeerPostKwijt werkt simpel: scan een brief of factuur, en wij regelen de rest — analyse, archivering en deadlines bijhouden.
    </p>

    <p style="margin:0 0 8px;color:#1c1917;font-size:14px;font-weight:700;">Zo begin je in 3 stappen:</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#57534e;font-size:14px;line-height:2;">
      <li>Koppel je OneDrive of Dropbox in <a href="https://nooitmeerpostkwijt.nl/dossier/instellingen" style="color:#d97706;">Instellingen</a></li>
      <li>Maak een foto of upload een PDF via het Dossier</li>
      <li>Bekijk de analyse — NooitMeerPostKwijt vertelt je wat het is en wat je moet doen</li>
    </ol>

    <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;color:#166534;font-size:14px;font-weight:700;">Over je proefperiode</p>
      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;">
        Je 6 maanden starten zodra je op <a href="https://nooitmeerpostkwijt.nl/account" style="color:#166534;font-weight:700;">Account</a> op <strong>"Abonnement starten"</strong> klikt — dit is gratis en vereist geen creditcard.
        <br><br>
        Wil je daarna doorgaan? Voeg dan een betaalmethode toe. Doe je niets, dan stopt het abonnement automatisch na 6 maanden. Je documenten in OneDrive of Dropbox blijven altijd van jou.
      </p>
    </div>

    <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">
      💡 <strong>Tip:</strong> Heb je Gmail? Je kunt facturen en brieven direct doorsturen naar je persoonlijke scanadres — te vinden in Instellingen.
    </p>
    ${cta("https://nooitmeerpostkwijt.nl/account", "Activeer je 6 maanden gratis →")}
    <p style="margin:16px 0 0;font-size:13px;color:#a8a29e;text-align:center;">Of ga direct naar <a href="https://nooitmeerpostkwijt.nl/dossier/aan-de-slag" style="color:#d97706;">Aan de slag</a></p>
  `);
}

function welcomeVriendHtml() {
  return emailShell(`
    <div style="background:#eff6ff;border-radius:12px;padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:20px;">🎁</span>
      <p style="margin:0;color:#1e40af;font-size:14px;font-weight:700;">Je krijgt 6 maanden gratis toegang</p>
    </div>
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Welkom bij NooitMeerPostKwijt!</h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Goed dat je erbij bent. Je hebt <strong>6 maanden gratis</strong> toegang gekregen — geen creditcard nodig.
    </p>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      NooitMeerPostKwijt werkt simpel: scan een brief of factuur, en wij regelen de rest — analyse, archivering en deadlines bijhouden.
    </p>
    <p style="margin:0 0 8px;color:#1c1917;font-size:14px;font-weight:700;">Zo begin je in 3 stappen:</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#57534e;font-size:14px;line-height:2;">
      <li>Koppel je OneDrive of Dropbox in <a href="https://nooitmeerpostkwijt.nl/dossier/instellingen" style="color:#d97706;">Instellingen</a></li>
      <li>Maak een foto of upload een PDF via het Dossier</li>
      <li>Bekijk de analyse — NooitMeerPostKwijt vertelt je wat het is en wat je moet doen</li>
    </ol>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;color:#166534;font-size:14px;font-weight:700;">Over je proefperiode</p>
      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;">
        Wil je na 6 maanden doorgaan? Voeg dan een betaalmethode toe. Doe je niets, dan stopt het abonnement automatisch. Je documenten in OneDrive of Dropbox blijven altijd van jou.
      </p>
    </div>
    <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">
      💡 <strong>Tip:</strong> Heb je Gmail? Je kunt facturen en brieven direct doorsturen naar je persoonlijke scanadres — te vinden in Instellingen.
    </p>
    ${cta("https://nooitmeerpostkwijt.nl/dossier/aan-de-slag", "Aan de slag →")}
  `);
}

function welcomeHtml() {
  return emailShell(`
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Welkom! Jouw archief staat klaar.</h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Goed dat je erbij bent. NooitMeerPostKwijt werkt simpel: scan een brief of factuur, en wij regelen de rest — analyse, archivering en deadlines bijhouden.
    </p>
    <p style="margin:0 0 8px;color:#1c1917;font-size:14px;font-weight:700;">Zo begin je in 3 stappen:</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#57534e;font-size:14px;line-height:2;">
      <li>Koppel je OneDrive of Dropbox in <a href="https://nooitmeerpostkwijt.nl/dossier/instellingen" style="color:#d97706;">Instellingen</a></li>
      <li>Maak een foto of upload een PDF via het Dossier</li>
      <li>Bekijk de analyse — NooitMeerPostKwijt vertelt je wat het is en wat je moet doen</li>
    </ol>
    <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">
      💡 <strong>Tip:</strong> Heb je Gmail? Je kunt facturen en brieven direct doorsturen naar je persoonlijke scanadres — te vinden in Instellingen.
    </p>
    ${cta("https://nooitmeerpostkwijt.nl/dossier/aan-de-slag", "Aan de slag →")}
    <p style="margin:16px 0 0;font-size:13px;color:#a8a29e;text-align:center;">Of ga direct naar <a href="https://nooitmeerpostkwijt.nl/dossier" style="color:#d97706;">Post scannen</a></p>
  `);
}

function day3Html() {
  return emailShell(`
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Heb je al je eerste document gescand?</h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Je account staat klaar, maar we zien nog geen gescande documenten. Dat is zonde — want het eerste moment dat je iets terugvindt in tien seconden wat je anders een halfuur zou zoeken, is het moment dat je het begrijpt.
    </p>
    <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">
      Pak een willekeurige brief van je bureau of uit je brievenbus, maak een foto en upload hem. Meer hoeft het niet te zijn.
    </p>
    <div style="background:#fef3c7;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:700;">Of forward een e-mail met bijlage</p>
      <p style="margin:4px 0 0;color:#b45309;font-size:13px;">Ga naar Instellingen → kopieer je persoonlijke scanadres → forward een factuur vanuit Gmail.</p>
    </div>
    ${cta("https://nooitmeerpostkwijt.nl/dossier", "Eerste document scannen →")}
  `);
}

function trialEndingHtml(endDate: string, isFoundingMember = false) {
  return emailShell(isFoundingMember ? `
    <p style="margin:0 0 8px;color:#78716c;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Founding Member</p>
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Je 6 maanden gratis lopen af op ${endDate}</h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Als een van de eerste 25 gebruikers heb je 6 maanden gratis NooitMeerPostKwijt gebruikt. We hopen dat je er net zoveel aan hebt gehad als we hoopten.
    </p>
    <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">
      Wil je doorgaan? Voeg dan een betaalmethode toe — daarna loopt het automatisch door voor <strong>€3,99/maand</strong>. Doe je niets, dan stopt het automatisch. Je documenten in OneDrive of Dropbox blijven altijd van jou.
    </p>
    <div style="background:#fef3c7;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:14px;">✓ &nbsp;Zakelijk aftrekbaar &nbsp;·&nbsp; ✓ &nbsp;Opzegbaar wanneer je wil &nbsp;·&nbsp; ✓ &nbsp;€3,99/maand</p>
    </div>
    ${cta("https://nooitmeerpostkwijt.nl/account", "Betaalmethode toevoegen →")}
  ` : `
    <p style="margin:0 0 8px;color:#78716c;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Proefperiode</p>
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Je proefperiode loopt af op ${endDate}</h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:15px;line-height:1.6;">
      Wil je NooitMeerPostKwijt blijven gebruiken? Voeg dan een betaalmethode toe — daarna gaat het automatisch door voor <strong>€3,99/maand</strong>.
    </p>
    <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">
      Doe je niets, dan stopt het abonnement automatisch. Je documenten en archief blijven gewoon in jouw OneDrive of Dropbox staan — die zijn van jou.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#166534;font-size:14px;">✓ &nbsp;Zakelijk aftrekbaar &nbsp;·&nbsp; ✓ &nbsp;Opzegbaar wanneer je wil &nbsp;·&nbsp; ✓ &nbsp;€3,99/maand</p>
    </div>
    ${cta("https://nooitmeerpostkwijt.nl/account", "Abonnement activeren →")}
  `);
}
