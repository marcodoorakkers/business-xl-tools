# Staging omgeving instellen

## Stap 1 — Nieuw Supabase project aanmaken (5 min)

1. Ga naar [supabase.com](https://supabase.com) → **New project**
2. Naam: `business-xl-staging` — onthoud het wachtwoord
3. Wacht tot het project klaar is (~2 min)
4. Ga naar **Project Settings → API** en kopieer:
   - `Project URL`
   - `anon public` key
   - `service_role` key (onder "Service role")

5. Ga naar **SQL Editor** en voer deze bestanden achtereenvolgens uit:
   - Inhoud van `supabase-setup.sql`
   - Inhoud van `supabase-onedrive.sql`
   - Inhoud van `supabase-dropbox.sql`

---

## Stap 2 — Vercel omgevingsvariabelen instellen (5 min)

1. Ga naar [vercel.com](https://vercel.com) → jouw project → **Settings → Environment Variables**
2. Voeg de volgende variabelen toe, stel bij elke in dat ze gelden voor **Preview** (niet Production):

| Variabele | Waarde |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL van staging Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key van staging Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key van staging Supabase |
| `ANTHROPIC_API_KEY` | Zelfde als productie |
| `STRIPE_SECRET_KEY` | Stripe test-sleutel (of zelfde als productie) |
| `ADMIN_EMAIL` | Jouw e-mailadres |
| `MICROSOFT_CLIENT_ID` | Zelfde als productie (of aparte Azure app) |
| `MICROSOFT_CLIENT_SECRET` | Zelfde als productie (of aparte Azure app) |
| `DROPBOX_CLIENT_ID` | Zelfde als productie (of aparte Dropbox app) |
| `DROPBOX_CLIENT_SECRET` | Zelfde als productie (of aparte Dropbox app) |

> Tip: alle andere variabelen die je al hebt in productie zet je ook op Preview met dezelfde waarde.

---

## Stap 3 — Staging deployment controleren (2 min)

1. Ga naar **Vercel → Deployments**
2. Zoek de deployment van de `staging` branch
3. Je staging URL is: `business-xl-tools-git-staging-marcodoorakkers.vercel.app`
4. Open de URL en controleer of je kunt inloggen

---

## Dagelijks gebruik

- Nieuwe features ontwikkel je op een feature branch
- Merge naar `staging` om te testen op de staging URL
- Werkt alles? Merge naar `main` voor productie
