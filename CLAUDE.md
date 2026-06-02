@AGENTS.md

# Business XL Tools — projectinstructies

Dit repo bevat twee producten:

| Product | Domein | Route |
|---|---|---|
| **TimeSaverTools** (TST) | timesavertools.nl | `app/` (root) |
| **NooitMeerPostKwijt** (NMMPK) | nooitmeerpostkwijt.nl | `app/gezin/` (via middleware rewrite) |

## Development workflow

- Development branch: `claude/mac-session-activity-kdk1x`
- Altijd ontwikkelen op deze branch, PR aanmaken naar `main`, direct mergen
- Vercel deployt automatisch vanuit `main` (productie) en vanuit preview-branches

## Nieuwe tools — altijd achter een feature flag

Nieuwe tools worden ALTIJD gebouwd achter een env var feature flag, zodat ze eerst getest kunnen worden op de preview-omgeving voordat ze live gaan.

**Patroon (zie MijnDossier als voorbeeld):**

1. Kies een env var naam, bijv. `MIJN_TOOL_ENABLED`
2. Gate de tool op het dashboard (`app/dashboard/page.tsx`):
   ```ts
   ...(process.env.MIJN_TOOL_ENABLED === "true" ? [{ name: "...", ... }] : [])
   ```
3. Gate de tool-pagina zelf met een redirect als de flag uit staat:
   ```ts
   if (process.env.MIJN_TOOL_ENABLED !== "true") redirect("/dashboard");
   ```
4. Zet de env var aan in Vercel op de preview-omgeving, maar NIET op productie
5. Pas als de tool klaar en getest is: env var ook op productie aanzetten

## Creditkosten per tool (TST)

Elke tool trekt credits af in de API route (`app/api/tools/[tool]/route.ts`). Zorg dat de tekst op de tool-pagina en het dashboard altijd overeenkomt met wat de API daadwerkelijk aftrekt:

| Tool | Credits |
|---|---|
| Voice Mail Draft | 1 |
| Meeting Memo | 1 |
| Document Opmaken | 1 |
| CV Builder | 1 |
| Vacaturezoeker | 1 |
| Weekmenu Planner | 1 |
| MijnDossier | 1 |

## Pricing model

### TimeSaverTools
- **Credits-only** — geen abonnement
- Gratis starterscredits bij aanmelding
- Credits kopen in pakketten (vervallen nooit)
- Bestaande abonnees worden nog wel ondersteund (status `active`/`cancelling`)

### NooitMeerPostKwijt
- **Abonnement-only** — geen losse scan-pakketten
- Eerste maand gratis, geen creditcard nodig (`payment_method_collection: "if_required"`, `trial_period_days: 30`)
- Daarna €3,99/maand · 50 scans per maand
- Abonnement-statussen: `trialing` → `active` → `cancelling` → `null`

## Projectstructuur

```
app/
  tools/[tool-naam]/page.tsx     — TST frontend (client component)
  api/tools/[tool-naam]/route.ts — TST backend API route
  dashboard/page.tsx             — TST tool-overzicht
  page.tsx                       — TST landingspagina
  account/page.tsx               — TST account (credits kopen)
  gezin/                         — NMMPK (nooitmeerpostkwijt.nl via middleware)
    page.tsx                     — NMMPK landingspagina
    layout.tsx                   — NMMPK layout (eigen manifest link)
    manifest.ts                  — NMMPK PWA manifest (amber thema, gezin-icoon)
    account/page.tsx             — NMMPK account (abonnement beheren)
    dossier/page.tsx             — NMMPK scan-interface (client component)
    dossier/instellingen/page.tsx — opslag, gezinsleden, scan-e-mailadres
    aanmelden/page.tsx           — NMMPK registratie
    inloggen/page.tsx            — NMMPK login
  api/
    checkout/
      create-session/route.ts    — Stripe checkout (detecteert NMMPK-domein voor trial)
      webhook/route.ts           — Stripe webhook handler
    gezin/
      share-target/route.ts      — Web Share Target (Android PWA, POST + GET)
    tools/mijn-dossier/
      route.ts                   — handmatige scan (AI-analyse + upload)
      email-scan/route.ts        — Cloudflare webhook-ontvanger (inbound e-mail)
      scan-email/token/route.ts  — persoonlijk scan-e-mailadres ophalen/genereren
      onedrive/family/route.ts   — gezinsleden CRUD (GET/POST/PATCH/DELETE)
      onedrive/status/route.ts   — verbindingsstatus + gezinsleden + opslagvoorkeur
      sync-actielijst/route.ts   — actielijst als Markdown naar OneDrive/Dropbox
cloudflare/
  email-worker/                  — Cloudflare Email Worker (postal-mime, wrangler)
    index.js                     — MIME-parser, stuurt bijlage als base64 naar webhook
    wrangler.toml                — worker naam + WEBHOOK_URL var
docs/
  BACKLOG.md                     — uitgestelde features met motivatie
  Cloudflare-setup.md            — stap-voor-stap installatiegids
  PRD-NooitMeerPostKwijt.md
  Testplan-NooitMeerPostKwijt.md
supabase/migrations/
  add_scan_email_token.sql       — scan_email_token kolom op profiles
```

## PWA (NMMPK)

- Manifest: `app/gezin/manifest.ts` → `/gezin/manifest.webmanifest`
- Icoon: `public/gezin-apple-touch-icon.png` (amber, envelop)
- Web Share Target werkt op Android; iOS Safari ondersteunt dit niet
- Share flow: POST → tijdelijk bestand in Supabase Storage (`share-temp` bucket) → cookie → GET laadt bestand in dossier

## E-mail

- **Outbound** (transactioneel): Resend met `@timesavertools.nl` als afzenderdomein
- **Inbound** (scan via e-mail): Cloudflare Email Workers op `nooitmeerpostkwijt.nl`
  - Catch-all route → Worker `nmmrk-email-scanner` → webhook `email-scan/route.ts`
  - Elke gebruiker heeft een uniek `scan_email_token` (UUID) als persoonlijk scanadres
  - Bijlage (PDF/afbeelding) wordt in-memory verwerkt, nooit opgeslagen op server
  - Toegang: alleen `subscription_status = active | trialing` (geen credits-check)
  - Secrets: `CLOUDFLARE_WEBHOOK_SECRET` in Vercel, `WEBHOOK_SECRET` in Wrangler

## Gezinsleden (NMMPK)

- Opgeslagen in `archive_family_members` (user_id, name, full_name)
- `full_name` optioneel — gebruikt voor herkenning van initialen/achternamen op documenten
- Gedeeltelijke naamkoppeling: als Claude "Xavi" teruggeeft maar de opgeslagen naam "Xavi (X.M. Doorakkers)" is, wordt de volledige naam gebruikt
- Gezinslid-herkenning gebruikt (in volgorde): naam op document → e-mailonderwerp → historische afzender→gezinslid koppeling

## Backlog

Zie `docs/BACKLOG.md` voor uitgestelde features.
