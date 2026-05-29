import { Resend } from "resend";

export async function sendAdminNotification(subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "TimeSaverTools <noreply@timesavertools.nl>",
    to: process.env.ADMIN_EMAIL,
    subject,
    html,
  });

  if (error) console.error("[email] Resend error:", error);
}

export async function sendWelcomeEmailNMMPK(to: string) {
  if (!process.env.RESEND_API_KEY) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "NooitMeerPostKwijt <noreply@nooitmeerpostkwijt.nl>",
    to,
    subject: "Welkom — je 10 gratis scans staan klaar",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; padding: 40px 32px;">
        <p style="font-size: 28px; margin: 0 0 24px;">📬</p>
        <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 12px;">Welkom bij NooitMeerPostKwijt</h1>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin: 0 0 24px;">
          Je account is actief. Je hebt <strong style="color: #111827;">10 gratis scans</strong> — genoeg om te zien hoe het werkt.
        </p>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin: 0 0 32px;">
          Pak een brief die op je bureau ligt, maak een foto en zie wat NooitMeerPostKwijt eruit haalt. Welke actie staat erop? Wat is de deadline?
        </p>
        <a href="https://nooitmeerpostkwijt.nl/dossier"
           style="display: inline-block; background: #F59E0B; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
          Eerste brief scannen →
        </a>
        <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 40px 0 24px;" />
        <p style="font-size: 12px; color: #9CA3AF; line-height: 1.6; margin: 0;">
          Vragen? Mail naar <a href="mailto:nooitmeerpostkwijt@business-xl.nl" style="color: #9CA3AF;">nooitmeerpostkwijt@business-xl.nl</a><br />
          NooitMeerPostKwijt · Business XL · Bosscheweg 44, 5056 KC Berkel-Enschot
        </p>
      </div>
    `,
  });

  if (error) console.error("[email] Welcome email error:", error);
}
