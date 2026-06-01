# Cloudflare Email Workers — Installatie-instructie

Geschatte tijd: **30–45 minuten** (inclusief DNS-propagatie)

---

## Stap 1 — Cloudflare account aanmaken

1. Ga naar [cloudflare.com](https://cloudflare.com) → **Sign up**
2. Kies het **Free** plan
3. Bevestig je e-mailadres

---

## Stap 2 — Domein toevoegen aan Cloudflare

1. Klik in het dashboard op **Add a domain**
2. Voer in: `nooitmeerpostkwijt.nl`
3. Kies plan **Free**
4. Cloudflare scant je huidige DNS-records automatisch — controleer of alle records zijn overgenomen (A, CNAME, MX, TXT)
5. Cloudflare geeft je **twee nameservers**, bijvoorbeeld:
   ```
   ada.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
   Schrijf deze op — die heb je nodig in stap 3.

---

## Stap 3 — Nameservers wijzigen bij TransIP

1. Log in op [transip.nl](https://transip.nl) → **Domeinen** → `nooitmeerpostkwijt.nl`
2. Ga naar **Nameservers**
3. Vervang de huidige nameservers door de twee Cloudflare-nameservers uit stap 2
4. Opslaan

> DNS-propagatie duurt 15 minuten tot 2 uur. Je kunt verder gaan met de volgende stappen terwijl je wacht.

---

## Stap 4 — Email Routing activeren

1. Ga in Cloudflare naar je domein → **Email** → **Email Routing**
2. Klik **Enable Email Routing**
3. Cloudflare voegt automatisch MX-records toe voor `nooitmeerpostkwijt.nl` — bevestig dit

---

## Stap 5 — Catch-all route instellen

1. Ga naar **Email** → **Email Routing** → **Routing Rules**
2. Scroll naar **Catch-all** onderaan
3. Klik **Edit** → stel in:
   - Action: **Send to a Worker**
   - Worker: *(nog aanmaken in stap 6, kom hier later terug)*
4. Laat dit venster open

---

## Stap 6 — Cloudflare Worker deployen

Open een terminal op je Mac:

```bash
# Ga naar de worker-map in het project
cd /Users/marcodoorakkers/business-xl-tools/cloudflare/email-worker

# Dependencies installeren
npm install

# Inloggen bij Cloudflare (opent browser)
npx wrangler login

# Worker deployen
npx wrangler deploy
```

Je ziet als het goed is:
```
Deployed nmmrk-email-scanner (xx ms)
```

---

## Stap 7 — Webhook secret instellen

Kies een willekeurige lange string als geheim (bijv. genereer er een):

```bash
# Genereer een secret
openssl rand -hex 32
```

Kopieer de uitvoer. Voer daarna in:

```bash
npx wrangler secret put WEBHOOK_SECRET
```

Plak de gegenereerde string wanneer daarom wordt gevraagd.

**Bewaar deze string** — je hebt hem nodig in stap 8.

---

## Stap 8 — Secret toevoegen aan Vercel

1. Ga naar [vercel.com](https://vercel.com) → project **business-xl-tools** → **Settings** → **Environment Variables**
2. Voeg toe:
   - **Name:** `CLOUDFLARE_WEBHOOK_SECRET`
   - **Value:** *(dezelfde string als in stap 7)*
   - **Environments:** Production + Preview
3. Klik **Save**
4. Herstart de deployment: **Deployments** → laatste deployment → **Redeploy**

---

## Stap 9 — Worker koppelen aan e-mailroute

1. Ga terug naar Cloudflare → **Email** → **Email Routing** → **Routing Rules**
2. Bij **Catch-all**: kies Worker `nmmrk-email-scanner`
3. Opslaan

---

## Stap 10 — SQL-migratie uitvoeren in Supabase

1. Ga naar [supabase.com](https://supabase.com) → jouw project → **SQL Editor**
2. Plak en voer uit:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scan_email_token UUID DEFAULT gen_random_uuid();

UPDATE profiles
  SET scan_email_token = gen_random_uuid()
  WHERE scan_email_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_scan_email_token_idx
  ON profiles (scan_email_token);
```

---

## Stap 11 — Testen

1. Open de app → **Instellingen** → je ziet nu een persoonlijk scan-adres, bijv.:
   ```
   a1b2c3d4-...@scan.nooitmeerpostkwijt.nl
   ```
2. Stuur een e-mail met een PDF-bijlage naar dat adres (of forward een factuur uit Gmail)
3. Wacht 10–30 seconden
4. Ververs je dossier — het document zou automatisch geanalyseerd moeten verschijnen

---

## Problemen?

| Symptoom | Oorzaak | Oplossing |
|----------|---------|-----------|
| Scan-adres verschijnt niet in Instellingen | SQL-migratie niet uitgevoerd | Stap 10 opnieuw uitvoeren |
| E-mail komt niet aan | DNS nog niet gepropageerd | Wacht tot Cloudflare het domein als **Active** markeert |
| Document verschijnt niet in dossier | Worker of Vercel secret niet juist | Controleer of `CLOUDFLARE_WEBHOOK_SECRET` overeenkomt in Vercel en Wrangler |
| 401 fout in Vercel logs | Secret komt niet overeen | Stap 7 en 8 opnieuw doorlopen |

---

## Ook nog doen: CRON_SECRET voor herinneringsmails

Zolang je toch in Vercel bent (stap 8), voeg ook dit toe:

1. Genereer een secret: `openssl rand -hex 32`
2. Voeg toe als env var: **Name:** `CRON_SECRET`, **Value:** gegenereerde string
3. Herstart deployment

Dit activeert de automatische herinneringsmails voor deadlines (was al gebouwd, wacht alleen op dit secret).
