import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await req.json().catch(() => ({ type: "welcome_founding" }));

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ADMIN_EMAIL!;

  // Inline de templates hier zodat we geen import-cyclus krijgen
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
        <tr><td style="padding:32px;">${content}</td></tr>
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

  let subject = "";
  let html = "";

  if (type === "welcome_founding") {
    subject = "Welkom, Founding Member! 🎉 [TEST]";
    html = emailShell(`
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
  } else if (type === "trial_ending") {
    subject = "Je 6 maanden gratis lopen bijna af [TEST]";
    html = emailShell(`
      <p style="margin:0 0 8px;color:#78716c;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Founding Member</p>
      <h1 style="margin:0 0 16px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">Je 6 maanden gratis lopen af op 4 december 2026</h1>
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
    `);
  } else {
    return NextResponse.json({ error: "Onbekend type. Gebruik 'welcome_founding' of 'trial_ending'." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "NooitMeerPostKwijt <noreply@timesavertools.nl>",
    to,
    subject,
    html,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, sent_to: to, type });
}
