# Backlog — NooitMeerPostKwijt

Functies die bewust zijn uitgesteld. Elke entry bevat de motivatie en wat er nodig is om het op te pakken.

---

## Gemiddelde prioriteit

### Instelbare agenda-reminders voor acties
**Wat:** Gebruiker kiest per actie (of als standaard instelling) hoeveel dagen vóór de deadline hij een herinnering wil ontvangen — bijv. 3 dagen van tevoren. De herinnering kan worden verstuurd als e-mail, of als kalenderafspraak met ingebouwde VALARM (via ICS).

**Wat er al is:**
- Reminder-e-mails worden al verstuurd 1–3 dagen voor de deadline (via dagelijkse cron op `/api/onboarding/send`), bijgehouden via `reminder_sent_at` op `document_actions`
- Google Calendar-link en ICS-download staan al in de actiepagina (handmatig, op verzoek van gebruiker)

**Wat er nog ontbreekt:**
- Instelbare reminderperiode per gebruiker of per actie (bijv. 1, 3, 7 dagen)
- VALARM in de gegenereerde ICS zodat de agenda zelf ook een herinnering geeft
- Optioneel: automatisch een kalenderafspraak aanmaken via Google Calendar API / CalDAV (complex, vereist OAuth)

**Aanbevolen aanpak (lichtgewicht):**
1. `reminder_days` voorkeur toevoegen aan `archive_settings` (default: 3)
2. Cron gebruikt `reminder_days` i.p.v. hardcoded 1–3
3. ICS-download krijgt een `VALARM` component met de gekozen periode

---

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
