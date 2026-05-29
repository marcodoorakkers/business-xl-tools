import { createClient } from "@/lib/supabase/server";
import { sendAdminNotification, sendWelcomeEmailNMMPK } from "@/lib/email";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "";

  const currentHost = request.headers.get("x-forwarded-host")
    ?? request.headers.get("host")
    ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const currentOrigin = `${proto}://${currentHost}`;

  // Determine the target domain and final path from the "next" parameter.
  // "next" can be a full URL like "https://nooitmeerpostkwijt.nl/auth/callback?next=/dossier"
  // or a simple path like "/dossier".
  let targetOrigin = currentOrigin;
  let finalPath = currentHost.includes("nooitmeerpostkwijt") ? "/dossier" : "/dashboard";

  try {
    const nextUrl = new URL(nextParam);
    targetOrigin = nextUrl.origin;
    // Extract the inner "next" path from the callback URL, or derive from domain
    const innerNext = nextUrl.searchParams.get("next");
    finalPath = innerNext ?? (nextUrl.hostname.includes("nooitmeerpostkwijt") ? "/dossier" : "/dashboard");
  } catch {
    // nextParam is already a simple path
    if (nextParam) finalPath = nextParam;
  }

  // If the target domain differs from where we are now, redirect there first
  // so the session cookie is set on the correct domain.
  if (targetOrigin !== currentOrigin && token_hash && type) {
    const params = new URLSearchParams({ token_hash, type, next: finalPath });
    return NextResponse.redirect(`${targetOrigin}/auth/confirm?${params}`);
  }

  // Verify the OTP token on the correct domain
  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error && data.user) {
      const isNMMPK = currentHost.includes("nooitmeerpostkwijt");
      const createdAt = new Date(data.user.created_at).getTime();
      const isNewUser = Date.now() - createdAt < 5 * 60 * 1000;

      if (isNewUser) {
        const email = data.user.email ?? "onbekend";
        const time = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });

        if (isNMMPK && data.user.email) {
          await sendWelcomeEmailNMMPK(data.user.email);
        }

        await sendAdminNotification(
          `🎉 Nieuwe gebruiker: ${email}`,
          `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1E3A8A;">Nieuwe aanmelding ${isNMMPK ? "op NooitMeerPostKwijt" : "op TimeSaverTools"}</h2>
            <p style="color: #374151;"><strong>E-mail:</strong> ${email}</p>
            <p style="color: #374151;"><strong>Tijdstip:</strong> ${time}</p>
          </div>`
        );
      }

      return NextResponse.redirect(`${currentOrigin}${finalPath}`);
    }
  }

  // Verification failed
  const errorPath = currentHost.includes("nooitmeerpostkwijt") ? "/inloggen" : "/auth/login";
  return NextResponse.redirect(`${currentOrigin}${errorPath}?error=confirmation_error`);
}
