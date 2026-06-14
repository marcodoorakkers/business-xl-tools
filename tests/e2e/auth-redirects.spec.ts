import { test, expect } from "@playwright/test";

test.describe("Auth-redirects (niet ingelogd)", () => {
  const protectedRoutes = [
    "/dossier",
    "/dossier/archief",
    "/dossier/instellingen",
    "/dossier/aan-de-slag",
    "/acties",
    "/account",
    "/mijn-gegevens",
    "/ideeen",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirect naar /inloggen`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/inloggen/);
    });
  }
});
