import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  // Gebruik vaste redirect URI in productie voor betrouwbare OAuth
  const host = request.nextUrl.hostname;
  const isProduction = host === "nooitmeerpostkwijt.nl" || host === "www.nooitmeerpostkwijt.nl";
  const redirectUri = isProduction
    ? "https://nooitmeerpostkwijt.nl/api/tools/mijn-dossier/onedrive/callback"
    : `${request.nextUrl.origin}/api/tools/mijn-dossier/onedrive/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "Files.ReadWrite.AppFolder offline_access",
    response_mode: "query",
    state,
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("ms_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  return response;
}
