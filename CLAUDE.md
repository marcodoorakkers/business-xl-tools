@AGENTS.md

# TimeSaverTools — projectinstructies

## Development workflow

- Development branch: `claude/timesavertools-dev-d3WWI`
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

## Creditkosten per tool

Elke tool trekt credits af in de API route (`app/api/tools/[tool]/route.ts`). Zorg dat de tekst op de tool-pagina en het dashboard altijd overeenkomt met wat de API daadwerkelijk aftrekt:

| Tool | Credits |
|---|---|
| Voice Mail Draft | 2 |
| Meeting Memo | 2 |
| Document Opmaken | 2 |
| CV Builder | 2 |
| Presentatie Outline | 1 |
| Vacaturezoeker | 1 |
| Weekmenu Planner | 1 |
| MijnDossier | 1 |

## Projectstructuur

```
app/
  tools/[tool-naam]/page.tsx     — frontend (client component)
  api/tools/[tool-naam]/route.ts — backend API route
  dashboard/page.tsx             — tool-overzicht
  page.tsx                       — landingspagina
components/
  Navbar.tsx
lib/supabase/                    — client + server Supabase helpers
```

## E-mail

Transactionele e-mails gaan via Resend met `@timesavertools.nl` als afzenderdomein.
