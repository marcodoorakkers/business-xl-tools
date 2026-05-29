# Testplan — NooitMeerPostKwijt

**Versie:** 1.0  
**Datum:** mei 2025  
**Doel:** End-to-end validatie van alle kernfuncties vóór go-to-market

---

## Voorbereiding

- [ ] Gebruik een e-mailadres dat nog **niet** in Supabase staat (nieuw testaccount)
- [ ] Gebruik een Stripe testkaart: `4242 4242 4242 4242`, vervaldatum `12/34`, CVC `123`
- [ ] Test primair op **mobiel (iPhone Safari)** — dit is het primaire platform
- [ ] Vercel deployment staat op **Ready** voor de laatste commit

---

## Module 1 — Registratie & authenticatie

### T01 — Aanmelden nieuw account
**Stappen:**
1. Ga naar nooitmeerpostkwijt.nl/aanmelden
2. Vul e-mailadres + wachtwoord in (min. 8 tekens)
3. Klik "Account aanmaken"

**Verwacht:**
- Bevestigingspagina verschijnt ("Controleer je inbox")
- E-mail arriveert van NooitMeerPostKwijt (niet Supabase Auth)
- E-mail heeft amber-knop "Bevestig mijn e-mailadres →"

---

### T02 — E-mailbevestiging
**Stappen:**
1. Open de bevestigingsmail
2. Hover over de knop — controleer dat de link naar **nooitmeerpostkwijt.nl** gaat (niet business-xl-tools.vercel.app)
3. Klik op de knop

**Verwacht:**
- Browser opent nooitmeerpostkwijt.nl
- Gebruiker landt op **/dossier** (niet /dashboard of foutpagina)
- Welkomstmail arriveert ("je 10 gratis scans staan klaar")
- Supabase toont gebruiker als bevestigd

---

### T03 — Inloggen bestaand account
**Stappen:**
1. Ga naar nooitmeerpostkwijt.nl/inloggen
2. Vul e-mailadres + wachtwoord in
3. Klik "Inloggen"

**Verwacht:**
- Redirect naar /dossier
- Creditssaldo zichtbaar in header

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
- Automatisch redirect naar /dossier (niet de inlogpagina tonen)

---

## Module 2 — Scannen & analyseren

### T06 — Document uploaden (foto)
**Stappen:**
1. Open het dossier
2. Tik op het uploadgebied / camera-knop
3. Maak een foto van een brief of selecteer een bestaande foto

**Verwacht:**
- Upload start direct
- Voortgangsindicator zichtbaar ("Analyseren...")
- Na analyse: suggesties voor type, afzender, datum, mappad, bestandsnaam
- Actie + deadline gevuld als aanwezig in document

---

### T07 — Document uploaden (PDF)
**Stappen:**
1. Selecteer een PDF-bestand via upload

**Verwacht:**
- Zelfde flow als T06
- PDF correct geanalyseerd

---

### T08 — Creditaftrek na scan
**Stappen:**
1. Noteer het creditssaldo vóór de scan
2. Voer een scan uit (T06 of T07)
3. Sla het document op

**Verwacht:**
- Creditssaldo daalt met 1 na opslaan
- Als saldo 0: melding dat er geen credits meer zijn

---

### T09 — Opslaan in OneDrive
**Stappen:**
1. Koppel OneDrive via /dossier/instellingen (Microsoft login)
2. Scan een document
3. Klik "Opslaan in OneDrive"

**Verwacht:**
- Document verschijnt in OneDrive op het voorgestelde mappad
- Bestandsnaam klopt met de AI-suggestie
- Succesbericht in de app

---

### T10 — Opslaan in Dropbox
**Stappen:**
1. Koppel Dropbox via /dossier/instellingen
2. Scan een document
3. Klik "Opslaan in Dropbox"

**Verwacht:**
- Document verschijnt in Dropbox
- Zelfde als T09

---

## Module 3 — Archief & acties

### T11 — Archief bekijken
**Stappen:**
1. Scan en sla minimaal 3 documenten op
2. Ga naar /dossier/archief

**Verwacht:**
- Alle opgeslagen documenten zichtbaar
- Gesorteerd op datum (nieuwste eerst)
- Download-knop werkt

---

### T12 — Acties bekijken
**Stappen:**
1. Scan een document met een zichtbare actie/deadline (bijv. een factuur)
2. Ga naar /acties

**Verwacht:**
- Actie verschijnt met deadline en type
- Actie kan worden afgehandeld (status wijzigt)

---

## Module 4 — Betaling (eenmalige credits)

### T13 — Credits kopen (eenmalig)
**Stappen:**
1. Ga naar /account
2. Kies "10 scans — €1,99" → klik "Kopen →"
3. Stripe checkout opent
4. Betaal met testkaart `4242 4242 4242 4242`

**Verwacht:**
- Redirect naar /account?payment=success&credits=10
- Groene succesmelding: "Betaling geslaagd! 10 scans zijn toegevoegd"
- Creditssaldo +10 in Supabase (controleer in dashboard)
- Credits zichtbaar in dossier-header

---

### T14 — Mislukte betaling
**Stappen:**
1. Gebruik testkaart `4000 0000 0000 0002` (declined)

**Verwacht:**
- Stripe toont foutmelding
- Geen credits bijgekomen
- Redirect naar /account?payment=cancelled

---

## Module 5 — Abonnement

### T15 — Abonnement starten
**Stappen:**
1. Ga naar /account
2. Klik "Starten →" bij het maandelijkse abonnement
3. Betaal met testkaart

**Verwacht:**
- Redirect naar /account?payment=subscribed
- Groene melding: "Abonnement gestart! 50 scans zijn toegevoegd"
- subscription_credits = 50 in Supabase (niet credits!)
- Abonnementsstatus toont "actief" met volgende verlengingsdatum
- Header toont "50 abonnement (deze maand) · X gekocht (verlopen nooit)"

---

### T16 — Abonnement opzeggen
**Stappen:**
1. Klik "Beheren" bij actief abonnement
2. Zeg op via Stripe Customer Portal

**Verwacht:**
- Status wijzigt naar "loopt af op [datum]"
- Amber melding: "Abonnement loopt af op..."
- Tekst: "Je abonnementsscans zijn nog geldig tot het einde van de betaalperiode"
- Na vervaldatum (Stripe test clock): subscription_credits = 0, credits ongewijzigd

---

### T17 — Credits gebruik-het-of-verlies-het
**Stappen:**
1. Start abonnement (50 subscription_credits)
2. Gebruik 10 scans
3. Simuleer maandelijkse verlenging via Stripe test clock

**Verwacht:**
- Na verlenging: subscription_credits reset naar 50 (niet 90!)
- Resterende 40 abonnementsscans zijn vervallen

---

## Module 6 — Account & instellingen

### T18 — Wachtwoord wijzigen
**Stappen:**
1. Ga naar /account
2. Voer huidig wachtwoord + nieuw wachtwoord in
3. Sla op
4. Log uit en log opnieuw in met nieuw wachtwoord

**Verwacht:**
- Wachtwoord succesvol gewijzigd
- Inloggen met nieuw wachtwoord werkt

---

### T19 — Account verwijderen
**Stappen:**
1. Ga naar /account
2. Klik "Account verwijderen"
3. Bevestig

**Verwacht:**
- Account verwijderd uit Supabase
- Redirect naar homepage
- Opnieuw inloggen niet mogelijk

---

## Module 7 — Mobiel & PWA

### T20 — PWA installeren op iPhone
**Stappen:**
1. Open nooitmeerpostkwijt.nl in Safari op iPhone
2. Tik op het Deel-icoon → "Zet op beginscherm"
3. Voeg toe

**Verwacht:**
- Icoon: amber vierkant met envelopje (niet wit blanco)
- Naam: "NooitMeerPostKwijt" (niet "TimeSaverTools" of de URL)
- App opent zonder Safari-adresbalk (volledig scherm)

---

### T21 — Mobiele navigatie
**Stappen:**
1. Open het dossier op mobiel

**Verwacht:**
- Header past op het scherm zonder overloop
- Alle navigatie-items (Acties, Archief, ⚙️, 👤) zichtbaar en aantikbaar
- Upload-knop groot genoeg voor vingers

---

## Resultatenregistratie

| Test | Resultaat | Opmerking |
|------|-----------|-----------|
| T01  | ⬜ | |
| T02  | ⬜ | |
| T03  | ⬜ | |
| T04  | ⬜ | |
| T05  | ⬜ | |
| T06  | ⬜ | |
| T07  | ⬜ | |
| T08  | ⬜ | |
| T09  | ⬜ | |
| T10  | ⬜ | |
| T11  | ⬜ | |
| T12  | ⬜ | |
| T13  | ⬜ | |
| T14  | ⬜ | |
| T15  | ⬜ | |
| T16  | ⬜ | |
| T17  | ⬜ | |
| T18  | ⬜ | |
| T19  | ⬜ | |
| T20  | ⬜ | |
| T21  | ⬜ | |

**Legenda:** ✅ Geslaagd · ❌ Mislukt · ⏭️ Overgeslagen · ⬜ Nog niet uitgevoerd
