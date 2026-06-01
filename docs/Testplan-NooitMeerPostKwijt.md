# Testplan — NooitMeerPostKwijt

**Versie:** 2.0  
**Datum:** juni 2026  
**Doel:** End-to-end validatie van alle kernfuncties

---

## Voorbereiding

- [ ] Gebruik een e-mailadres dat nog **niet** in Supabase staat (nieuw testaccount)
- [ ] Stripe testkaart: `4242 4242 4242 4242`, vervaldatum `12/34`, CVC `123`
- [ ] Test primair op **mobiel (iPhone Safari)** — dit is het primaire platform
- [ ] Vercel deployment staat op **Ready** voor de laatste commit
- [ ] OneDrive en/of Dropbox testaccount beschikbaar

---

## Module 1 — Registratie & authenticatie

### T01 — Aanmelden nieuw account
**Stappen:**
1. Ga naar nooitmeerpostkwijt.nl/aanmelden
2. Vul e-mailadres + wachtwoord in (min. 8 tekens)
3. Klik "Account aanmaken"

**Verwacht:**
- Bevestigingspagina verschijnt ("Controleer je inbox")
- E-mail arriveert van NooitMeerPostKwijt
- E-mail heeft amber-knop "Bevestig mijn e-mailadres →"

---

### T02 — E-mailbevestiging
**Stappen:**
1. Open de bevestigingsmail
2. Controleer dat de link naar **nooitmeerpostkwijt.nl** gaat (niet business-xl-tools.vercel.app)
3. Klik op de knop

**Verwacht:**
- Browser opent nooitmeerpostkwijt.nl
- Gebruiker landt op **/dossier**
- Supabase toont gebruiker als bevestigd
- subscription_status = `trialing`, subscription_credits = 50

---

### T03 — Inloggen bestaand account
**Stappen:**
1. Ga naar nooitmeerpostkwijt.nl/inloggen
2. Vul e-mailadres + wachtwoord in
3. Klik "Inloggen"

**Verwacht:**
- Redirect naar /dossier
- Scansaldo zichtbaar in header (bijv. "50 scans")

---

### T04 — Uitloggen
**Stappen:**
1. Klik "Uitloggen" in het dossier
2. Probeer /dossier direct te bezoeken

**Verwacht:**
- Na uitloggen: redirect naar homepage
- /dossier zonder sessie: redirect naar /inloggen

---

### T05 — Al ingelogd → auth-pagina bezoeken
**Stappen:**
1. Log in
2. Ga handmatig naar nooitmeerpostkwijt.nl/inloggen

**Verwacht:**
- Automatisch redirect naar /dossier

---

## Module 2 — Scannen & analyseren

### T06 — Document uploaden (foto)
**Stappen:**
1. Open het dossier
2. Selecteer een foto van een brief

**Verwacht:**
- Upload start direct, voortgangsindicator zichtbaar
- Na analyse: suggesties voor type, afzender, datum, mappad, bestandsnaam
- Actie + deadline gevuld als aanwezig in document

---

### T07 — Document uploaden (PDF)
**Stappen:**
1. Selecteer een PDF-bestand

**Verwacht:**
- Zelfde flow als T06, PDF correct geanalyseerd

---

### T08 — Multi-pagina document
**Stappen:**
1. Upload meerdere foto's tegelijk (meerdere pagina's van één brief)

**Verwacht:**
- Alle pagina's worden samengevoegd en als één document geanalyseerd

---

### T09 — Scanaftrek
**Stappen:**
1. Noteer het scansaldo vóór de scan
2. Voer een scan uit en sla op

**Verwacht:**
- Scansaldo daalt met 1
- Bij saldo 0: melding "Niet genoeg credits" (402)

---

### T10 — Afzenderherkenning
**Stappen:**
1. Scan een document van afzender X, sla op
2. Scan een tweede document van dezelfde afzender X

**Verwacht:**
- Bij de tweede scan: mappad en type zijn al correct voorgesteld (consistent met de eerste scan)
- Geen handmatige correctie nodig

---

### T11 — Opslaan in OneDrive
**Stappen:**
1. Koppel OneDrive via /dossier/instellingen
2. Scan een document, klik "Opslaan in OneDrive"

**Verwacht:**
- Document verschijnt in OneDrive op het voorgestelde mappad
- Bestandsnaam klopt met de AI-suggestie
- Succesbericht in de app

---

### T12 — Opslaan in Dropbox
**Stappen:**
1. Koppel Dropbox via /dossier/instellingen
2. Scan een document, klik "Opslaan in Dropbox"

**Verwacht:**
- Document verschijnt in Dropbox — zelfde als T11

---

## Module 3 — Archief

### T13 — Archief bekijken
**Stappen:**
1. Scan en sla minimaal 3 documenten op
2. Ga naar /dossier/archief

**Verwacht:**
- Alle documenten zichtbaar, gesorteerd op datum (nieuwste eerst)
- Documenttype en afzender zichtbaar per item
- Download-link werkt

---

### T14 — Zoeken in archief
**Stappen:**
1. Typ een deel van een afzendernaam of onderwerp in het zoekveld

**Verwacht:**
- Lijst filtert direct op de invoer
- Resultaten tonen overeenkomende documenten

---

## Module 4 — Acties & herinneringen

### T15 — Acties bekijken
**Stappen:**
1. Scan een document met een zichtbare actie/deadline (bijv. een factuur)
2. Ga naar /acties

**Verwacht:**
- Actie verschijnt met deadline, urgentiekleur en actietype
- Filter op "Open", "Gedaan", "Overgeslagen" werkt

---

### T16 — Actie afhandelen
**Stappen:**
1. Klik "Markeer als gedaan" bij een open actie

**Verwacht:**
- Actie verdwijnt uit de open lijst
- Verschijnt onder "Gedaan"
- Actie kan worden heropend

---

### T17 — Actie overslaan & verwijderen
**Stappen:**
1. Klik "Overslaan" bij een open actie
2. Ga naar tab "Overgeslagen"
3. Klik "Verwijderen"

**Verwacht:**
- Actie verplaatst naar overgeslagen
- Na verwijderen verdwijnt de actie volledig

---

### T18 — Agenda-export Google Calendar
**Stappen:**
1. Open een actie met deadline
2. Klik "Agenda" → "Google Agenda"

**Verwacht:**
- Nieuw tabblad opent met Google Calendar vooringevuld
- Titel = actietekst, datum = deadline

---

### T19 — Agenda-export iCal/Outlook
**Stappen:**
1. Klik "Agenda" → "iCal / Outlook"

**Verwacht:**
- .ics-bestand wordt gedownload
- Bestand kan worden geopend in Agenda.app / Outlook

---

### T20 — Actielijst.md sync
**Stappen:**
1. Koppel OneDrive of Dropbox
2. Markeer een actie als gedaan

**Verwacht:**
- `{archiveRoot}/Actielijst.md` in OneDrive/Dropbox wordt bijgewerkt
- Bestand bevat secties: Te laat / Deze week / Later / Geen deadline
- Afgehandelde actie staat niet meer in het bestand

---

### T21 — Deadline herinnering (handmatig testen)
**Stappen:**
1. Maak een actie aan met deadline = morgen
2. Roep `/api/reminders/send` aan via POST met juiste `Authorization: Bearer {CRON_SECRET}` header

**Verwacht:**
- E-mail arriveert met correct onderwerp en deadline-informatie
- `reminder_sent_at` is ingevuld in Supabase
- Tweede aanroep stuurt geen tweede mail (reminder_sent_at is al gevuld)

---

## Module 5 — Abonnement

### T22 — Trial starten
**Stappen:**
1. Registreer nieuw account (T01+T02)
2. Ga naar /account

**Verwacht:**
- Status toont "Proefperiode — eerste maand gratis"
- 50 scans beschikbaar, geen betaalgegevens gevraagd
- subscription_status = `trialing` in Supabase

---

### T23 — Abonnement starten (na trial)
**Stappen:**
1. Klik "Starten →" bij het abonnement op /account
2. Betaal met testkaart in Stripe Checkout

**Verwacht:**
- Redirect naar /account?payment=subscribed
- Melding: "Abonnement gestart! Je eerste maand is gratis — 50 scans staan klaar."
- subscription_status = `active` in Supabase

---

### T24 — Abonnement opzeggen
**Stappen:**
1. Klik "Beheren" bij actief abonnement
2. Zeg op via Stripe Customer Portal

**Verwacht:**
- Status wijzigt naar "loopt af op [datum]" (cancelling)
- Scans blijven beschikbaar tot einde betaalperiode
- Na vervaldatum: subscription_credits = 0

---

### T25 — Maandelijkse reset (Stripe test clock)
**Stappen:**
1. Start abonnement, gebruik 10 scans (40 resterend)
2. Versnelling via Stripe test clock naar volgende maand

**Verwacht:**
- subscription_credits reset naar 50 (niet 90)
- Resterende 40 abonnementsscans zijn vervallen

---

## Module 6 — Account & instellingen

### T26 — Wachtwoord wijzigen
**Stappen:**
1. Ga naar /account → wachtwoord wijzigen
2. Log uit en log opnieuw in met nieuw wachtwoord

**Verwacht:**
- Wachtwoord succesvol gewijzigd, inloggen werkt

---

### T27 — Account verwijderen
**Stappen:**
1. Ga naar /account → "Account verwijderen" → bevestig

**Verwacht:**
- Account verwijderd uit Supabase
- Redirect naar homepage
- Opnieuw inloggen niet mogelijk

---

## Module 7 — Mobiel & PWA

### T28 — PWA installeren op iPhone
**Stappen:**
1. Open nooitmeerpostkwijt.nl in Safari op iPhone
2. Tik op Deel-icoon → "Zet op beginscherm"

**Verwacht:**
- Icoon: amber vierkant met envelopje
- Naam: "NooitMeerPostKwijt"
- App opent zonder Safari-adresbalk

---

### T29 — Web Share Target (Android)
**Stappen:**
1. Installeer PWA op Android
2. Maak een foto en deel via de systeemdeelknop → kies NooitMeerPostKwijt

**Verwacht:**
- App opent met de foto al geladen in het dossier

---

### T30 — Mobiele navigatie
**Stappen:**
1. Open het dossier op mobiel

**Verwacht:**
- Header past op scherm zonder overloop
- Alle navigatie-items (Acties, Archief, ⚙️, 👤) zichtbaar en aantikbaar

---

## Resultatenregistratie

| Test | Resultaat | Opmerking |
|------|-----------|-----------|
| T01 | ⬜ | |
| T02 | ⬜ | |
| T03 | ⬜ | |
| T04 | ⬜ | |
| T05 | ⬜ | |
| T06 | ⬜ | |
| T07 | ⬜ | |
| T08 | ⬜ | |
| T09 | ⬜ | |
| T10 | ⬜ | |
| T11 | ⬜ | |
| T12 | ⬜ | |
| T13 | ⬜ | |
| T14 | ⬜ | |
| T15 | ⬜ | |
| T16 | ⬜ | |
| T17 | ⬜ | |
| T18 | ⬜ | |
| T19 | ⬜ | |
| T20 | ⬜ | |
| T21 | ⬜ | |
| T22 | ⬜ | |
| T23 | ⬜ | |
| T24 | ⬜ | |
| T25 | ⬜ | |
| T26 | ⬜ | |
| T27 | ⬜ | |
| T28 | ⬜ | |
| T29 | ⬜ | |
| T30 | ⬜ | |

**Legenda:** ✅ Geslaagd · ❌ Mislukt · ⏭️ Overgeslagen · ⬜ Nog niet uitgevoerd
