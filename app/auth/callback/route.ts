import { createClient } from "@/lib/supabase/server";
import { sendAdminNotification } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Detect new registration: created_at within the last 5 minutes
      const createdAt = new Date(data.user.created_at).getTime();
      const isNewUser = Date.now() - createdAt < 5 * 60 * 1000;

      if (isNewUser) {
        const email = data.user.email ?? "onbekend";
        const time = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });

        await sendAdminNotification(
          `🎉 Nieuwe gebruiker: ${email}`,
          `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #1E3A8A;">Nieuwe aanmelding op TimeSaverTools</h2>
              <p style="color: #374151;">Er heeft zich zojuist een nieuwe gebruiker aangemeld:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                  <td style="padding: 8px 12px; background: #F3F4F6; font-weight: 600; width: 30%;">E-mail</td>
                  <td style="padding: 8px 12px; background: #F9FAFB;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #F3F4F6; font-weight: 600;">Tijdstip</td>
                  <td style="padding: 8px 12px; background: #F9FAFB;">${time}</td>
                </tr>
              </table>
              <a href="${origin}/admin" style="display: inline-block; background: #2563EB; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Bekijk in admin →
              </a>
            </div>
          `
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
