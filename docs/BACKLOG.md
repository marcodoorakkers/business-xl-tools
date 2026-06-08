# Backlog — NooitMeerPostKwijt

Functies die bewust zijn uitgesteld. Elke entry bevat de motivatie en wat er nodig is om het op te pakken.

---

## Hoge prioriteit

### Scan via e-mail
**Wat:** Elke gebruiker krijgt een uniek e-mailadres (`{token}@scan.nooitmeerpostkwijt.nl`). Een doorgestuurde e-mail met PDF-bijlage wordt automatisch geanalyseerd en toegevoegd aan het dossier.

**Waarom uitgesteld:** Vereist een inbound e-maildienst. Resend (al in gebruik) ondersteunt geen inbound e-mail. Mailgun is een extra dienst die beheerd moet worden. Cloudflare Email Workers vereist DNS-migratie naar Cloudflare.

**Code is klaar:** De webhook-endpoint, token-API en UI in instellingen zijn gebouwd (`app/api/tools/mijn-dossier/email-scan/route.ts`). Alleen de externe dienst en DNS-records ontbreken nog.

**Aanbevolen aanpak: Cloudflare Email Workers (gratis)**
- Domein `nooitmeerpostkwijt.nl` toevoegen aan Cloudflare (nameservers wijzigen bij TransIP)
- Email Routing activeren in Cloudflare dashboard
- Route aanmaken: `*@scan.nooitmeerpostkwijt.nl` → Worker `nmmrk-email-scanner`
- Worker deployen vanuit `cloudflare/email-worker/`: `npm install && npx wrangler deploy`
- Secret instellen: `npx wrangler secret put WEBHOOK_SECRET`
- Zelfde secret toevoegen als `CLOUDFLARE_WEBHOOK_SECRET` in Vercel
- SQL-migratie uitvoeren: `supabase/migrations/add_scan_email_token.sql`

**Alternatief: Mailgun** — werkt zonder DNS-migratie, maar wordt betaald na 3 maanden proefperiode. Code is compatibel gemaakt met Cloudflare-formaat (JSON + shared secret i.p.v. HMAC multipart).

---

## Gemiddelde prioriteit

### Gezinsbeheer met gedeelde inbox
**Wat:** Meerdere accounts koppelen aan één gezin. Gedeelde actielijst, notificatie als iemand anders een document scant.

**Concrete trigger:** Twee gebruikers (bijv. partners) koppelen dezelfde OneDrive — documenten komen al op dezelfde plek terecht via `by_person` mapstructuur, maar acties zijn strikt per `user_id` en dus niet voor elkaar zichtbaar.

**Waarom uitgesteld:** Significante omvang — vereist nieuwe datastructuur (gezinstabel, uitnodigingsflow, gedeelde RLS-policies). Niet te bouwen als losse feature.

**Wat er nodig is om op te pakken:**
- Datamodel uitwerken (gezin-entiteit, leden, eigenaar)
- Uitnodigingsflow via e-mail
- RLS-policies aanpassen zodat gezinsleden elkaars documenten kunnen zien

---

## Lage prioriteit

### Google Drive integratie
**Wat:** Naast OneDrive en Dropbox ook Google Drive als opslaglocatie ondersteunen.

**Waarom uitgesteld:** Grote overlap met bestaande integraties, maar Google OAuth heeft extra review-proces voor productie-goedkeuring.

### Exportfunctie PDF-bundel
**Wat:** Meerdere gescande documenten samenvoegen tot één PDF voor archivering of delen.

**Waarom uitgesteld:** Lage gebruikersvraag verwacht in de beginfase.

### Automatische e-mailverwerking
**Wat:** E-mailbox koppelen zodat digitale post (facturen, brieven) automatisch wordt verwerkt zonder handmatige forward.

**Waarom uitgesteld:** Vereist OAuth-koppeling met Gmail/Outlook en doorlopende polling of webhooks. Privacygevoelig. Scan-via-e-mail (zie boven) is een lichtere variant die eerst getest moet worden.
