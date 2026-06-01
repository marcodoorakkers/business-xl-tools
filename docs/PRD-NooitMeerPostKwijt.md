# Product Requirements Document — NooitMeerPostKwijt

**Versie:** 2.0  
**Datum:** juni 2026  
**Status:** Actief — in productie

---

## 1. Productvisie

### Probleemstelling
Papieren post raakt verloren, wordt vergeten of blijft ongeopend. Het gevolg: gemiste deadlines, verlopen garanties, onbetaalde rekeningen en het frustrerende "Waar is die brief?"-moment.

### Oplossing
NooitMeerPostKwijt stelt gebruikers in staat om papieren post te scannen, automatisch te laten analyseren door AI en gestructureerd op te slaan in hun eigen cloudomgeving (OneDrive of Dropbox). Acties en deadlines worden bijgehouden en gebruikers worden tijdig herinnerd — zodat niets vergeten wordt.

### Tagline
*"Nooit meer een brief kwijt"*

### Positionering
Een persoonlijke digitale postassistent voor particulieren — eenvoudig, snel en privacyvriendelijk omdat documenten in de eigen cloud van de gebruiker worden opgeslagen.

---

## 2. Doelgroep

**Primair:** Nederlandstalige particulieren (18+) die regelmatig papieren post ontvangen en hier grip op willen houden.

**Typisch profiel:**
- Ontvangt 5–20 brieven per maand
- Heeft OneDrive (Microsoft 365) of Dropbox
- Gebruikt een smartphone als primair apparaat
- Wil geen gedoe met scanners of complexe software

**Buiten scope (nu):**
- Zakelijk gebruik (ZZP/MKB) — doorverwijzen naar TimeSaverTools.nl
- Gebruikers zonder cloudopslag

---

## 3. Kernfuncties

### 3.1 Document scannen
- Upload via foto (mobiel camera) of PDF
- Multi-pagina ondersteuning (meerdere foto's samenvoegen tot één document)
- Automatische compressie bij grote afbeeldingen
- Ondersteuning: JPG, PNG, PDF (HEIC geblokkeerd — gebruiker krijgt instructie)
- Web Share Target: delen vanuit de camera-app op Android werkt direct

### 3.2 AI-analyse
- Detecteert: documenttype, afzender, datum, onderwerp, samenvatting
- Stelt mappad en bestandsnaam voor (klaar voor cloud-opslag)
- Herkent gezinslid als van toepassing (op basis van naam/adres op document)
- Detecteert actie + deadline + actietype (betaling/reageren/aanvragen/registreren)
- **Afzenderherkenning:** bij terugkerende afzenders gebruikt de AI eerdere scans als context voor consistentere mappad en type-classificatie
- Kosten: 1 scan per analyse (uit maandabonnement)

### 3.3 Archief
- Overzicht van alle gescande documenten
- Sortering op datum (nieuwste eerst)
- Doorzoekbaar op afzender, type en onderwerp
- Download-functie per document (via cloudopslag-URL)
- Labels: gezinslid, documenttype

### 3.4 Acties bijhouden
- Automatisch aangemaakt vanuit AI-analyse
- Statussen: **open / gedaan / overgeslagen**
- Overzicht gefilterd op status, gesorteerd op deadline (meest urgent bovenaan)
- Kleurcodering urgentie: rood (te laat / vandaag), oranje (≤7 dagen), groen (later)
- **Herinneringsmail:** automatische e-mail 1–3 dagen voor de deadline (eenmalig per actie)
- **Agenda-export:** directe knop per actie voor Google Calendar of iCal/Outlook download
- **Actielijst.md sync:** na elke statuswijziging wordt een Markdown-actielijst bijgewerkt op `{archiveRoot}/Actielijst.md` in OneDrive/Dropbox — zodat anderen met toegang tot de cloudopslag de lijst kunnen lezen zonder de app

### 3.5 Cloud-integratie
- OneDrive: opslaan in eigen map via Microsoft OAuth
- Dropbox: opslaan in eigen map via Dropbox OAuth
- Bestandsnaam en mappad worden door AI voorgesteld op basis van documentinhoud én eerdere scans
- Automatische token-verversing bij verlopen sessies

### 3.6 Abonnement & betaling
- **Abonnement-only** — geen losse scan-pakketten
- **Eerste maand gratis:** trial van 30 dagen, geen creditcard nodig bij aanmelding
- **Na proefperiode:** €3,99/maand — 50 scans per maand, ongebruikte scans vervallen aan eind van de maand
- Statussen: `trialing` → `active` → `cancelling` → `null`
- Betaling via Stripe (iDEAL, creditcard, Bancontact)
- Abonnement beheren/opzeggen via Stripe Customer Portal

### 3.7 Account & instellingen
- Registratie via e-mail + wachtwoord
- E-mailbevestiging vereist voor activatie
- Wachtwoord wijzigen
- Cloudopslag-koppeling instellen/verwijderen (OneDrive, Dropbox)
- Gezinsleden toevoegen (namen, voor documentlabeling)
- Account verwijderen

---

## 4. Niet in scope (huidige versie)

- Automatische OCR of tekstherkenning zonder AI
- Meerdere gebruikers per account met gedeelde inbox / notificaties (backlog)
- Mobiele app (native iOS/Android) — wel geoptimaliseerd als PWA
- Exportfunctie naar PDF-bundel
- Automatische e-mailverwerking
- Integratie met Google Drive

---

## 5. User Stories

### Registratie & onboarding
- Als nieuwe gebruiker wil ik me kunnen aanmelden met e-mail en wachtwoord, zodat ik een eigen account heb.
- Als nieuwe gebruiker wil ik een bevestigingsmail ontvangen en na klikken direct op mijn dossier terechtkomen op nooitmeerpostkwijt.nl.
- Als nieuwe gebruiker wil ik de eerste maand gratis kunnen proberen zonder creditcard zodat ik zonder risico kan starten.

### Scannen
- Als gebruiker wil ik een foto van een brief kunnen uploaden, zodat de AI die voor mij analyseert.
- Als gebruiker wil ik een PDF kunnen uploaden, zodat ik ook digitale post kan verwerken.
- Als gebruiker wil ik meerdere foto's kunnen uploaden als één document (voor meerdere pagina's).
- Als gebruiker wil ik de AI-suggestie voor mappad en bestandsnaam kunnen accepteren of aanpassen voordat ik opsla.
- Als gebruiker wil ik dat de app terugkerende afzenders herkent en dezelfde mapstructuur gebruikt als vorige keer.
- Als gebruiker wil ik het document naar mijn OneDrive of Dropbox kunnen sturen met één klik.

### Archief & zoeken
- Als gebruiker wil ik al mijn gescande documenten kunnen terugvinden in het archief.
- Als gebruiker wil ik kunnen zoeken op afzender, onderwerp of type zodat ik snel een specifiek document terugvind.

### Acties & herinneringen
- Als gebruiker wil ik openstaande acties kunnen zien zodat ik deadlines niet vergeet.
- Als gebruiker wil ik een actie als gedaan of overgeslagen kunnen markeren.
- Als gebruiker wil ik een e-mailherinnering ontvangen als een deadline nadert.
- Als gebruiker wil ik een actie direct aan mijn agenda toevoegen (Google Calendar of iCal).
- Als gebruiker wil ik dat mijn actielijst automatisch gesynchroniseerd wordt naar mijn cloudopslag zodat mijn gezin er ook bij kan.

### Abonnement
- Als gebruiker wil ik mijn scansaldo kunnen zien in het dossier.
- Als gebruiker wil ik een maandelijks abonnement kunnen afsluiten waarbij ik de eerste maand gratis ben.
- Als gebruiker wil ik mijn abonnement kunnen opzeggen en weten tot wanneer ik nog scans heb.

### Mobiel
- Als gebruiker wil ik de app op mijn iPhone-beginscherm kunnen installeren zodat ik hem snel kan openen.
- Als gebruiker wil ik de app op Android kunnen installeren als PWA.
- Als gebruiker wil ik een foto vanuit mijn camera-app direct kunnen delen met NooitMeerPostKwijt.

---

## 6. Niet-functionele eisen

| Eis | Norm |
|-----|------|
| Laadtijd eerste pagina | < 2 seconden |
| Beschikbaarheid | > 99% (Vercel/Supabase SLA) |
| Dataprivacy | Documenten worden alleen in eigen cloud van gebruiker opgeslagen, niet op onze servers |
| Taal | Nederlands |
| Responsive | Geoptimaliseerd voor mobiel (primair) en desktop |
| Toegankelijkheid | Leesbare contrastverhouding, voldoende grote knoppen |

---

## 7. Technische architectuur

| Component | Technologie |
|-----------|-------------|
| Frontend + backend | Next.js (App Router) op Vercel |
| Database + auth | Supabase (PostgreSQL + GoTrue) |
| AI-analyse | Anthropic API (Claude Sonnet 4.6) |
| Betaling | Stripe (checkout, webhooks, Customer Portal) |
| E-mail (transactioneel + herinneringen) | Resend — `noreply@timesavertools.nl` |
| Cloud-integratie | Microsoft Graph API (OneDrive), Dropbox API |
| Geplande taken | Vercel Cron Jobs (dagelijks 07:00 herinneringsmail) |
| Domein | nooitmeerpostkwijt.nl (routing via middleware naar /gezin/*) |

### Database tabellen (NMMPK-relevant)

| Tabel | Doel |
|-------|------|
| `profiles` | Gebruikersprofiel, subscription_credits, subscription_status |
| `documents` | Gearchiveerde documenten (metadata) |
| `document_actions` | Acties met deadline, status en reminder_sent_at |
| `archive_family_members` | Gezinsledennamen voor documentlabeling |
| `onedrive_tokens` | OAuth tokens + archive_root pad |
| `dropbox_tokens` | OAuth tokens + archive_root pad |

---

## 8. Businessmodel

| Stroom | Detail |
|--------|--------|
| Trial | 30 dagen gratis, 50 scans beschikbaar, geen creditcard |
| Abonnement | €3,99/maand — 50 scans, vervallen maandelijks |
| Kosten per scan | ~€0,01–0,03 (Anthropic API) |

---

## 9. Succescriteria

- [x] Registratie- en bevestigingsflow werkt op nooitmeerpostkwijt.nl
- [x] Scan → analyse → opslaan in OneDrive/Dropbox werkt end-to-end
- [x] Abonnement via Stripe werkt (trial + betaling na 30 dagen)
- [x] Scans worden correct afgetrokken en maandelijks gereset
- [x] App installeerbaar als PWA op iOS en Android
- [x] Geen persoonlijke documenten opgeslagen op onze servers
- [x] Archief met zoekfunctie op afzender/type/onderwerp
- [x] Actielijst met urgentiecodering en statusbeheer
- [x] Deadline herinneringsmails via Vercel cron
- [x] Agenda-export (Google Calendar + iCal/Outlook)
- [x] Automatische Actielijst.md sync naar cloudopslag
- [x] Slimme afzenderherkenning op basis van eerdere scans
- [ ] Gezinsbeheer met gedeelde inbox (backlog)
