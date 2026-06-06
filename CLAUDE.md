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
- Daarna €3,99/maand incl. BTW · onbeperkt scannen
- Abonnement-statussen: `trialing` → `active` → `cancelling` → `null`
- NMPK-abonnees krijgen automatisch **10 TST credits per maand** (bijgeschreven via Stripe webhook bij start + verlenging)
- Toegangscheck altijd op `subscription_status` (active/trialing), nooit op `subscription_credits`

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
    acties/page.tsx              — actielijst (open/gedaan/overgeslagen, deadline, afvinken)
    dossier/page.tsx             — NMMPK scan-interface (client component)
    dossier/components/DossierNav.tsx — gedeelde nav met acties-badge
    dossier/instellingen/page.tsx — opslag, geadresseerden, mapstructuur, scan-e-mailadres
    dossier/archief/page.tsx     — documentenpagina: lijst + mappenview (drilldown)
    dossier/aan-de-slag/page.tsx — onboarding pagina nieuwe gebruikers (4 stappen + tips)
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
      onedrive/family/route.ts   — geadresseerden CRUD (GET/POST/PATCH/DELETE) incl. full_name
      onedrive/status/route.ts   — verbindingsstatus + geadresseerden + opslagvoorkeur + mapstructuur
      sync-actielijst/route.ts   — actielijst als Markdown naar OneDrive/Dropbox
      auto-mappad/route.ts       — retroactief mappaden toewijzen via AI (Haiku, geen credits)
      acties/route.ts            — document_actions CRUD (GET/POST)
      acties/[id]/route.ts       — PATCH status (open/gedaan/overgeslagen), DELETE
      documents/route.ts         — GET (lijst + ?all=1 + ?jaar=), POST, PATCH (mappad/actie_gedaan), DELETE
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
  add_onboarding_emails.sql      — onboarding_emails tabel (welkom/dag3/trial_ending tracking)
  add_full_name_family.sql       — full_name kolom op archive_family_members (ALTER TABLE)
  add_folder_structure.sql       — folder_structure kolom op archive_settings (ALTER TABLE)
  add_demo_rate_limits.sql       — demo_rate_limits tabel (IP-hash, count, window_start)
  add_promo_codes.sql            — promo_codes tabel + founding25 (25x 180 dagen trial)
  add_product_to_ideas.sql       — product kolom op ideas tabel (nmmpk/tst)
  add_promo_code_to_profiles.sql — promo_code kolom op profiles
  add_reminder_sent_at.sql       — reminder_sent_at kolom op document_actions
  add_actie_to_documents.sql     — actie en actie_gedaan kolommen op documents
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

## Geadresseerden (NMMPK)

- Vroeger "Gezinsleden" — hernoemd naar "Geadresseerden" in de UI (personen én entiteiten zoals BV/eenmanszaak)
- Opgeslagen in `archive_family_members` (user_id, name, full_name)
- `full_name` optioneel — alleen relevant voor personen, gebruikt voor herkenning van initialen/achternamen op documenten; voor entiteiten volstaat alleen `name`
- Instellingenpagina toont duidelijke uitleg: personen (bijv. Anna) én entiteiten (bijv. je BV) kunnen worden toegevoegd; `full_name` is enkel voor personen
- Gedeeltelijke naamkoppeling: als Claude "Xavi" teruggeeft maar de opgeslagen naam "Xavi (X.M. Doorakkers)" is, wordt de volledige naam gebruikt
- Herkenning gebruikt (in volgorde): naam op document → e-mailonderwerp → historische afzender→geadresseerde koppeling

## Mapstructuur (NMMPK)

- Instelling `folder_structure` in `archive_settings`: `by_subject` (standaard) of `by_person`
- **Mappad formaat**: altijd `Afzender/Onderwerp/Jaartal` — bijv. `Belastingdienst/Omzetbelasting/2026`
- **Per onderwerp**: `{archiveRoot}/{Afzender}/{Onderwerp}/{Jaar}/{bestand}`
- **Per geadresseerde**: `{archiveRoot}/{geadresseerde}/{Afzender}/{Onderwerp}/{Jaar}/{bestand}`
- Onbekende geadresseerde → `Gemeenschappelijk/`
- `gezinslid` veld zit in de AI JSON response — ontbreekt dit, dan werkt de geadresseerde map niet
- Gestandaardiseerde afzendernamen in prompt: Belastingdienst, DUO, UWV, CAK, SVB, RDW, RVO, Gemeente [Naam], banken op handelsnaam

## Onboarding e-mailsequentie (NMMPK)

- Cron dagelijks om 08:00 via `/api/onboarding/send`
- **Welkomstmail**: trialing-gebruikers aangemeld in afgelopen 24u
- **Dag 3**: trialing-gebruikers die nog geen document gescand hebben
- **Trial ending**: 5 dagen voor einde proefperiode (op basis van `subscription_period_end`)
- Bijgehouden in `onboarding_emails` tabel (user_id, email_type, sent_at)

## Middleware — feature flag gedrag

- `MIJN_DOSSIER_ENABLED` flag geldt ALLEEN voor timesavertools.nl, NIET voor nooitmeerpostkwijt.nl
- Anders worden alle `/api/tools/mijn-dossier/*` routes geblokkeerd op het NMPK-domein
- Supabase browser client (`createClient()`) mag NOOIT op module-niveau worden aangeroepen in client components — alleen inline in handlers (Next.js 16 pre-rendert anders)

## Naamgeving NMMPK (geldend)

| Oud | Nieuw |
|-----|-------|
| Gezinsleden | Geadresseerden |
| Archief (pagina) | Documenten |
| Post scannen | Scannen |
| Archiefmap naam | Dossiermap naam |
| Standaard mapnaam "Archief" | "MijnDossier" |

## Promo codes (NMMPK)

- Tabel `promo_codes` (code, max_uses, uses, trial_days, active)
- Actieve promo: `founding25` — 25x 180 dagen trial
- Flow: `?promo=founding25` in aanmeld-URL → localStorage → SubscribeButton → create-session
- Cap wordt atomisch gecontroleerd; bij max bereikt → gewone 30-daagse trial
- Gebruik monitoren: `SELECT code, uses, max_uses FROM promo_codes;`

## Storage (NMMPK)

- Voorkeur opgeslagen in `archive_settings.storage_preference` ("onedrive" | "dropbox")
- "local" bestaat nog in de DB maar is verwijderd uit de UI — gebruikers met "local" krijgen een prompt naar Instellingen
- Default mapnaam: "MijnDossier"
- OAuth redirect URIs zijn hardcoded voor productiedomein (nooitmeerpostkwijt.nl) — nooit dynamisch
- Opslaan via upsert met `onConflict: "user_id"` (primary key = geldige unique constraint)
- `folder_structure` kolom toegevoegd via `add_folder_structure.sql` — SELECT faalt als kolom ontbreekt, waardoor storagePreference altijd "local" lijkt
- Opslagknop in scan pagina heet altijd "Opslaan in Dossier →", locatie als hint eronder
- Instellingenpagina toont opslagknoppen pas na API-response (state start op null, niet "local")

## Founding members (NMMPK)

- Promo code `founding25` — 25x 180 dagen trial, cap van 25 gebruikers
- `promo_code` kolom op `profiles` — wordt ingevuld bij checkout als promo geldig is
- Teller op homepage en launch pagina gebaseerd op `profiles.promo_code = 'founding25'` (NIET op `promo_codes.uses` — die kan afwijken)
- Founding member badge op accountpagina als `promo_code = 'founding25'`
- Aparte welkomstmail met uitleg 6 maanden + activatie instructie
- Aparte trial-ending mail na ~6 maanden met persoonlijke toon
- Proefperiode tekst op accountpagina past zich aan voor founding members
- `PromoActiveerBanner` op accountpagina — leest promo uit URL param (via bevestigingsmail) én localStorage
- Bevestigingsmail redirect naar `/account` (niet `/dossier`) zodat activatie direct zichtbaar is
- Promo code wordt meegegeven in de bevestigingsmail URL (`?promo=founding25`) zodat hij werkt in elke browser

## Navigatie (NMMPK)

- Gedeelde `DossierNav` component op alle dossier-pagina's: `dossier/components/DossierNav.tsx`
- Actieve pagina licht op in amber via `usePathname()`
- Links: Acties, Documenten, 💡 (Ideeën), ?, ⚙, account-icoon, Feedback, Uitloggen
- **Acties-badge**: telt openstaande acties via `/api/tools/mijn-dossier/acties`; rood bij verlopen deadlines, amber anders; ververst bij elke paginawisseling
- Landingspagina (`/`) redirect ingelogde gebruikers naar `/dossier`

## Documenten pagina (NMMPK)

Route: `dossier/archief/page.tsx` — API: `documents/route.ts`

### Lijstview
- Zoekbalk (afzender, onderwerp, samenvatting, mappad, bestandsnaam)
- Filters: geadresseerde (dropdown), type (dropdown), jaar (knopjes — toggle, bewaard in URL)
- Paginering: 20 per keer, "Meer laden" knop, offset via `?offset=`
- Per document: type-icoon, afzender, onderwerp, datum, samenvatting (2 regels), badges (type, geadresseerde, mappad, opslag)
- **Mappad bewerken**: klik op het mappad-badge of `+ map` → inline invoerveld → PATCH `?id=`
- **Actie afvinken**: ○/✓ knop als `documents.actie` gevuld is → PATCH `actie_gedaan`; doorgestreept bij gedaan
- **Verwijder-bevestiging**: klik ✕ → inline "Ja / Nee" (geen browser `confirm()`)
- Alle filters bewaard in URL-params

### Mappenview (drilldown)
- Toggle "Lijst / Mappen" rechtsboven
- Boomstructuur opgebouwd client-side uit `mappad` veld (`Afzender/Onderwerp/Jaar`)
- **Drilldown**: tap op map → volledig scherm met inhoud; terug-knop toont naam bovenliggende map
- Breadcrumb bij meer dan één niveau diep
- Per document: type-icoon, afzender, onderwerp, datum, actie-toggle, ✏️ (mappad), ✕
- Geladen via `?all=1` (geen paginering); cache reset na verwijderen of mappad-wijziging
- **Auto-mappad banner**: als er documenten zonder mappad zijn (Overig), verschijnt amber banner met "Automatisch indelen →" — roept `/api/tools/mijn-dossier/auto-mappad` aan (Claude Haiku, geen credits)
- "Overig" is ook een klikbare map voor documenten zonder mappad

### Documents API
- `GET ?q=&gezinslid=&type=&jaar=&offset=` — gefilterde lijst, 20+1 voor hasMore detectie
- `GET ?all=1` — alle documenten zonder paginering (voor mappenview)
- `POST` — nieuw document; accepteert ook `actie` veld
- `PATCH ?id=` — body mag `mappad` en/of `actie_gedaan` bevatten
- `DELETE ?id=` — verwijdert document

## Acties (NMMPK)

- Pagina: `gezin/acties/page.tsx` — drie tabs: Open, Gedaan, Overgeslagen
- Data: `document_actions` tabel (id, user_id, actie, deadline, actie_type, document_naam, afzender, mappad, file_url, status, created_at)
- `documents` tabel heeft ook `actie text` en `actie_gedaan boolean DEFAULT false` — gevuld bij opslaan scan als gebruiker "Actie toevoegen" had aangevinkt
- Deadline-badge toont lopende teller ("X dagen te laat") alleen in tab Open; in Gedaan/Overgeslagen altijd statische datum
- Afvinken vanuit documenten-pagina via PATCH op `documents.actie_gedaan` (los van `document_actions`)
- Actielijst sync naar OneDrive/Dropbox via `/api/tools/mijn-dossier/sync-actielijst` (Markdown met checkboxes)
- Reminder-emails: open acties met deadline 1–3 dagen vooruit, bijgehouden via `reminder_sent_at`

## Launch pagina (NMMPK)

- `/launch` — persoonlijk verhaal (RDW tenaamstellingscode), live founding25 teller, CTA schakelt automatisch
- `/` — originele landingspagina met demo en features + amber banner met live teller bovenaan
- Beide tellers gebaseerd op `profiles.promo_code` count

## Ideeënbord (NMMPK)

- `/ideeen` — eigen pagina met amber stijl, bol.com cadeaukaart incentive (€15/maand)
- Aparte API op `/api/gezin/ideas` gefilterd op `product = 'nmmpk'`
- `product` kolom toegevoegd aan `ideas` tabel via `add_product_to_ideas.sql`
- Stemmen via bestaande `/api/ideas/[id]/vote` route (gedeeld met TST)

## Admin (NMMPK)

- `/admin` — gebruikersoverzicht alleen toegankelijk voor `ADMIN_EMAIL`
- API op `/api/admin/nmmpk-users` — toont subscription_status, promo_code, storage, doc count
- `/api/admin/test-email` — stuurt testmails naar ADMIN_EMAIL (type: `welcome_founding` of `trial_ending`)

## Stripe (NMMPK)

- Stripe Tax aangezet — BTW-facturen worden automatisch gegenereerd
- Customer Portal ingesteld: amber branding, omleidingslink `/account`, privacy/voorwaarden URLs
- BTW-nummer en KvK ingevuld bij Openbare bedrijfsgegevens
- Bankafschrift omschrijving: `NOOITMEERPOSTKWIJT/BXL`
- Oude facturen (vóór Stripe Tax) hebben geen BTW-regel — alleen nieuwe facturen zijn correct

## Vriend van (NMMPK)

- Promo code `vriendenvan` — onbeperkt gebruik (max_uses: 9999), 180 dagen trial
- Zelfde flow als founding25 maar zonder cap — link: `/aanmelden?promo=vriendenvan`
- Blauwe "Vriend van NooitMeerPostKwijt" badge op accountpagina
- Eigen welkomstmail (`welcomeVriendHtml`) en trial-ending mail
- Beheer via `/admin` — schakelaar om link aan/uit te zetten, overzicht wie zich aangemeld heeft

## Auto-checkout (NMMPK)

- `AutoCheckout.tsx` — start Stripe checkout automatisch als promo in URL of localStorage
- `AutoCheckoutWrapper.tsx` — client wrapper die checkt of promo aanwezig is
- Na 10s timeout: handmatige "Abonnement starten →" knop als fallback
- Na inloggen: redirect naar `/account` als geen abonnement actief, anders `/dossier`
- Promo zit in bevestigingsmail URL (`?promo=...`) zodat het op elk apparaat werkt
- Probleem: promo in localStorage van PC werkt niet op telefoon → altijd via URL delen

## Stripe webhooks

- `cancel_at_period_end = true` → status wordt `cancelling` (niet `active`)
- `canceled` → status wordt `null`
- `subscription_period_end` wordt bijgewerkt bij elke webhook

## Backlog

Zie `docs/BACKLOG.md` voor uitgestelde features.
