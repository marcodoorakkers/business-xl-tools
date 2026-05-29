# Product Requirements Document — NooitMeerPostKwijt

**Versie:** 1.0  
**Datum:** mei 2025  
**Status:** Actief

---

## 1. Productvisie

### Probleemstelling
Papieren post raakt verloren, wordt vergeten of blijft ongeopend. Het gevolg: gemiste deadlines, verlopen garanties, onbetaalde rekeningen en het frustrerende "Waar is die brief?"-moment.

### Oplossing
NooitMeerPostKwijt stelt gebruikers in staat om papieren post te scannen, automatisch te laten analyseren door AI en gestructureerd op te slaan in hun eigen cloudomgeving (OneDrive of Dropbox). Acties en deadlines worden bijgehouden zodat niets vergeten wordt.

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
- Automatische compressie bij grote afbeeldingen
- Ondersteuning: JPG, PNG, HEIC, PDF

### 3.2 AI-analyse
- Detecteert: documenttype, afzender, datum, onderwerp, samenvatting
- Stelt mappad en bestandsnaam voor (klaar voor cloud-opslag)
- Herkent gezinslid als van toepassing
- Detecteert actie + deadline + actietype
- Kosten: 1 credit per scan

### 3.3 Archief
- Overzicht van alle gescande documenten
- Sortering op datum (nieuwste eerst)
- Doorzoekbaar op afzender/onderwerp
- Download-functie per document

### 3.4 Acties bijhouden
- Automatisch aangemaakt vanuit AI-analyse
- Statussen: open / afgehandeld
- Overzicht van openstaande acties met deadlines

### 3.5 Cloud-integratie
- OneDrive: opslaan in eigen map via Microsoft OAuth
- Dropbox: opslaan in eigen map via Dropbox OAuth
- Bestandsnaam en mappad worden door AI voorgesteld

### 3.6 Credits & betaling
- **Gratis bij aanmelding:** 10 credits (verlopen nooit)
- **Abonnement:** 50 credits/maand voor €3,99 — ongebruikte credits vervallen aan eind van de maand
- **Eenmalige pakketten:** 10 / 50 / 100 / 200 scans — verlopen nooit
- Betaling via Stripe (iDEAL, creditcard, Bancontact)

### 3.7 Account & instellingen
- Registratie via e-mail + wachtwoord
- E-mailbevestiging vereist voor activatie
- Wachtwoord wijzigen
- Cloudopslag-koppeling instellen/verwijderen
- Account verwijderen

---

## 4. Niet in scope (v1)

- Automatische OCR of tekstherkenning zonder AI
- Delen van documenten met anderen
- Meerdere gebruikers per account / gezinsplan
- Mobiele app (native iOS/Android) — wel geoptimaliseerd als PWA
- Exportfunctie naar PDF-bundel
- Automatische e-mailverwerking
- Integratie met Google Drive

---

## 5. User Stories

### Registratie & onboarding
- Als nieuwe gebruiker wil ik me kunnen aanmelden met e-mail en wachtwoord, zodat ik een eigen account heb.
- Als nieuwe gebruiker wil ik een bevestigingsmail ontvangen en na klikken direct op mijn dossier terechtkomen op nooitmeerpostkwijt.nl.
- Als nieuwe gebruiker wil ik 10 gratis scans krijgen zodat ik de app kan proberen zonder te betalen.

### Scannen
- Als gebruiker wil ik een foto van een brief kunnen uploaden, zodat de AI die voor mij analyseert.
- Als gebruiker wil ik een PDF kunnen uploaden, zodat ik ook digitale post kan verwerken.
- Als gebruiker wil ik de AI-suggestie voor mappad en bestandsnaam kunnen accepteren of aanpassen voordat ik opsla.
- Als gebruiker wil ik het document naar mijn OneDrive of Dropbox kunnen sturen met één klik.

### Archief & acties
- Als gebruiker wil ik al mijn gescande documenten kunnen terugvinden in het archief.
- Als gebruiker wil ik openstaande acties kunnen zien zodat ik deadlines niet vergeet.
- Als gebruiker wil ik een actie als afgehandeld kunnen markeren.

### Credits & betaling
- Als gebruiker wil ik mijn creditssaldo kunnen zien in het dossier.
- Als gebruiker wil ik extra scans kunnen kopen als ik bijna door mijn credits heen ben.
- Als gebruiker wil ik een maandelijks abonnement kunnen afsluiten zodat ik altijd scans beschikbaar heb.
- Als gebruiker wil ik mijn abonnement kunnen opzeggen en weten tot wanneer ik nog scans heb.

### Mobiel
- Als gebruiker wil ik de app op mijn iPhone-beginscherm kunnen installeren zodat ik hem snel kan openen.
- Als gebruiker wil ik de app op Android kunnen installeren als PWA.

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

## 7. Technische architectuur (samenvatting)

| Component | Technologie |
|-----------|-------------|
| Frontend + backend | Next.js 14 (App Router) op Vercel |
| Database + auth | Supabase (PostgreSQL + GoTrue) |
| AI-analyse | OpenAI API (GPT-4o) |
| Betaling | Stripe (checkout + webhooks) |
| E-mail (transactioneel) | Resend |
| Cloud-integratie | Microsoft Graph API (OneDrive), Dropbox API |
| Domein | nooitmeerpostkwijt.nl (routing via middleware naar /gezin/*) |

---

## 8. Businessmodel

| Stroom | Detail |
|--------|--------|
| Gratis laag | 10 credits bij aanmelding |
| Abonnement | €3,99/maand — 50 credits, vervallen maandelijks |
| Eenmalig | €1,99 / €7,49 / €11,99 / €19,99 voor 10/50/100/200 credits |
| Kosten per scan | ~€0,02–0,05 (OpenAI API) |

---

## 9. Succescriteria (launch)

- [ ] Volledige registratie- en bevestigingsflow werkt op nooitmeerpostkwijt.nl
- [ ] Scan → analyse → opslaan in OneDrive/Dropbox werkt end-to-end
- [ ] Betaling via Stripe werkt (eenmalig + abonnement)
- [ ] Credits worden correct afgetrokken en bijgeschreven
- [ ] App installeerbaar als PWA op iOS en Android
- [ ] Geen persoonlijke documenten opgeslagen op onze servers
