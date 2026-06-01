import { test, expect } from "@playwright/test";

test.describe("Auth-redirects (niet ingelogd)", () => {
  test("/dossier redirect naar /inloggen", async ({ page }) => {
    await page.goto("/dossier");
    await expect(page).toHaveURL(/inloggen/);
  });

  test("/acties redirect naar /inloggen", async ({ page }) => {
    await page.goto("/acties");
    await expect(page).toHaveURL(/inloggen/);
  });

  test("/account redirect naar /inloggen", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/inloggen/);
  });

  test("/dossier/archief redirect naar /inloggen", async ({ page }) => {
    await page.goto("/dossier/archief");
    await expect(page).toHaveURL(/inloggen/);
  });

  test("/dossier/instellingen redirect naar /inloggen", async ({ page }) => {
    await page.goto("/dossier/instellingen");
    await expect(page).toHaveURL(/inloggen/);
  });
});
