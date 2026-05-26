import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const origin = request.nextUrl.origin;
  const failUrl = `${origin}/tools/mijn-dossier/instellingen?error=auth_failed`;

  if (!user) return NextResponse.redirect(failUrl);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) return NextResponse.redirect(failUrl);

  const storedState = request.cookies.get("ms_oauth_state")?.value;
  if (!storedState || storedState !== state) return NextResponse.redirect(failUrl);

  const redirectUri = `${origin}/api/tools/mijn-dossier/onedrive/callback`;

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!tokenRes.ok) return NextResponse.redirect(failUrl);

  const tokens = await tokenRes.json();
  if (!tokens.access_token || !tokens.refresh_token) return NextResponse.redirect(failUrl);

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const admin = createAdminClient();
  await admin.from("onedrive_tokens").upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    archive_root: "Archief",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  const response = NextResponse.redirect(`${origin}/tools/mijn-dossier/instellingen?connected=1`);
  response.cookies.set("ms_oauth_state", "", { maxAge: 0, path: "/" });

  return response;
}
