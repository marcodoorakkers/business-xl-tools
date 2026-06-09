import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/gezin/inloggen", request.url));

  const host = request.nextUrl.hostname;
  const isProduction = host === "nooitmeerpostkwijt.nl" || host === "www.nooitmeerpostkwijt.nl";
  const redirectUri = isProduction
    ? "https://nooitmeerpostkwijt.nl/api/tools/mijn-dossier/googledrive/callback"
    : `${request.nextUrl.origin}/api/tools/mijn-dossier/googledrive/callback`;

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("googledrive_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  return response;
}
