import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://api.dropbox.com/oauth2/token";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const origin = request.nextUrl.origin;
  const hostname = request.nextUrl.hostname;
  const isGezinSite = hostname === "nooitmeerpostkwijt.nl" || hostname === "www.nooitmeerpostkwijt.nl";
  const instellingenPath = isGezinSite ? "/dossier/instellingen" : "/tools/mijn-dossier/instellingen";
  const failUrl = `${origin}${instellingenPath}?error=auth_failed`;

  if (!user) return NextResponse.redirect(failUrl);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) return NextResponse.redirect(failUrl);

  const storedState = request.cookies.get("dropbox_oauth_state")?.value;
  if (!storedState || storedState !== state) return NextResponse.redirect(failUrl);

  const redirectUri = isGezinSite
    ? "https://nooitmeerpostkwijt.nl/api/tools/mijn-dossier/dropbox/callback"
    : `${origin}/api/tools/mijn-dossier/dropbox/callback`;

  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID!,
    client_secret: process.env.DROPBOX_CLIENT_SECRET!,
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

  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 4 * 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from("dropbox_tokens").upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    archive_root: "MijnDossier",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (upsertError) return NextResponse.redirect(failUrl);

  const response = NextResponse.redirect(`${origin}${instellingenPath}?dropbox_connected=1`);
  response.cookies.set("dropbox_oauth_state", "", { maxAge: 0, path: "/" });

  return response;
}
