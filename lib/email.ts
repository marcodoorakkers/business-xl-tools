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
