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

  // Open acties met deadline over 1 t/m 3 dagen, nog geen reminder gestuurd
  const { data: actions, error } = await supabase
    .from("document_actions")
    .select(`
      id,
      user_id,
      actie,
      deadline,
      afzender,
      document_naam,
      profiles!inner ( email )
    `)
    .eq("status", "open")
    .is("reminder_sent_at", null)
    .gte("deadline", new Date(Date.now() + 86400_000).toISOString().slice(0, 10))
    .lte("deadline", new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10));

  if (error) {
    console.error("[reminders] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!actions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const sentIds: string[] = [];

  for (const action of actions) {
    const profile = action.profiles as unknown as { email: string };
    const email = profile?.email;
    if (!email) continue;

    const deadline = new Date(action.deadline + "T00:00:00");
    const dagNaam = deadline.toLocaleDateString("nl-NL", { weekday: "long" });
    const datumStr = deadline.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    const daysLeft = Math.round((deadline.getTime() - Date.now()) / 86400_000);
    const urgentie = daysLeft <= 1 ? "morgen" : `over ${daysLeft} dagen`;

    const afzenderTekst = action.afzender ? ` (${action.afzender})` : "";
    const docTekst = action.document_naam ? `\n\nDocument: ${action.document_naam}${afzenderTekst}` : "";

    const { error: emailError } = await resend.emails.send({
      from: "NooitMeerPostKwijt <noreply@timesavertools.nl>",
      to: email,
      subject: `Herinnering: ${action.actie} — deadline ${urgentie}`,
      html: reminderHtml({
        actie: action.actie,
        dagNaam,
        datumStr,
        urgentie,
        docTekst: action.document_naam
          ? `${action.document_naam}${action.afzender ? ` · ${action.afzender}` : ""}`
          : null,
      }),
    });

    if (emailError) {
      console.error(`[reminders] email failed for ${email}:`, emailError);
      continue;
    }

    sentIds.push(action.id);
    sent++;
  }

  if (sentIds.length > 0) {
    await supabase
      .from("document_actions")
      .update({ reminder_sent_at: new Date().toISOString() })
      .in("id", sentIds);
  }

  console.log(`[reminders] sent ${sent} of ${actions.length}`);
  return NextResponse.json({ sent, total: actions.length });
}

function reminderHtml({
  actie,
  dagNaam,
  datumStr,
  urgentie,
  docTekst,
}: {
  actie: string;
  dagNaam: string;
  datumStr: string;
  urgentie: string;
  docTekst: string | null;
}) {
  const doc = docTekst
    ? `<p style="margin:0 0 16px;color:#78716c;font-size:14px;">${escHtml(docTekst)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr><td style="background:#f59e0b;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">NooitMeerPostKwijt</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;color:#78716c;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Deadline herinnering</p>
          <h1 style="margin:0 0 20px;color:#1c1917;font-size:22px;font-weight:800;line-height:1.3;">${escHtml(actie)}</h1>
          ${doc}
          <div style="background:#fef3c7;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#92400e;font-size:15px;font-weight:700;">Deadline ${urgentie}</p>
            <p style="margin:4px 0 0;color:#b45309;font-size:14px;">${dagNaam} ${datumStr}</p>
          </div>
          <a href="https://nooitmeerpostkwijt.nl/dossier/acties" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">Open actielijst →</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #f5f5f4;">
          <p style="margin:0;color:#a8a29e;font-size:12px;">Je ontvangt deze herinnering omdat je een actie met deadline hebt in je NooitMeerPostKwijt dossier.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
