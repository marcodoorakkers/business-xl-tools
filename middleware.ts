import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const hostname = request.nextUrl.hostname;
  const isFamilySite =
    hostname === "nooitmeerpostkwijt.nl" ||
    hostname === "www.nooitmeerpostkwijt.nl";

  const originalPath = request.nextUrl.pathname;
  const isApiOrCallback =
    originalPath.startsWith("/api") ||
    originalPath.startsWith("/_next") ||
    originalPath.startsWith("/auth/callback") ||
    originalPath.startsWith("/auth/confirm");

  // Bereken het effectieve pad (met /gezin prefix voor familiedomein)
  const needsRewrite = isFamilySite && !isApiOrCallback && !originalPath.startsWith("/gezin");
  const effectivePath = needsRewrite
    ? originalPath === "/" ? "/gezin" : `/gezin${originalPath}`
    : originalPath;

  // Familie auth-checks
  const isGezinProtected =
    effectivePath.startsWith("/gezin/dossier") ||
    effectivePath.startsWith("/gezin/acties") ||
    effectivePath.startsWith("/gezin/account");
  const isGezinAuthPage =
    effectivePath.startsWith("/gezin/inloggen") ||
    effectivePath.startsWith("/gezin/aanmelden");

  if (isGezinProtected && !user) {
    const redirectTo = isFamilySite ? "/inloggen" : "/gezin/inloggen";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  if (isGezinAuthPage && user) {
    const redirectTo = isFamilySite ? "/dossier" : "/gezin/dossier";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Subscription check: dossier en acties vereisen een actief abonnement
  const isGezinSubscriptionProtected =
    effectivePath.startsWith("/gezin/dossier") ||
    effectivePath.startsWith("/gezin/acties");

  if (isGezinSubscriptionProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile?.subscription_status) {
      const redirectTo = isFamilySite ? "/account" : "/gezin/account";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // Standaard timesavertools.nl auth-checks
  const isAuthPage = originalPath.startsWith("/auth");
  const isProtected =
    originalPath.startsWith("/dashboard") ||
    originalPath.startsWith("/tools") ||
    originalPath.startsWith("/account") ||
    originalPath.startsWith("/admin");

  const isMijnDossier =
    originalPath.startsWith("/tools/mijn-dossier") ||
    originalPath.startsWith("/api/tools/mijn-dossier");

  // MIJN_DOSSIER_ENABLED flag geldt alleen voor timesavertools.nl, niet voor nooitmeerpostkwijt.nl
  if (isMijnDossier && !isFamilySite && process.env.MIJN_DOSSIER_ENABLED !== "true") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAuthPage && !originalPath.startsWith("/auth/callback") && !originalPath.startsWith("/auth/confirm")) {
    const redirectPath = isFamilySite ? "/dossier" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Rewrite familiedomein transparant naar /gezin/*
  if (needsRewrite) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePath;
    const rewriteRes = NextResponse.rewrite(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      rewriteRes.cookies.set(name, value, options); // opties (maxAge, etc.) meenemen
    });
    return rewriteRes;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
