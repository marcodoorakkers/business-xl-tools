import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/tools/mijn-dossier/dropbox/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    token_access_type: "offline",
    state,
  });

  const authUrl = `https://www.dropbox.com/oauth2/authorize?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("dropbox_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  return response;
}
