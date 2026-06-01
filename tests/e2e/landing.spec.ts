import { test, expect } from "@playwright/test";

test.describe("Landingspagina", () => {
  test("laadt correct en toont de hero-tekst", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").filter({ hasText: /waar is mijn post/i })).toBeVisible({ timeout: 10000 });
  });

  test("toont de abonnementsprijs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("€3,99").first()).toBeVisible();
    await expect(page.getByText("Maandelijks abonnement").first()).toBeVisible();
  });

  test("toont eerste maand gratis badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Eerste maand gratis").first()).toBeVisible();
  });

  test("navigeert naar aanmelden via CTA-knop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /gratis beginnen/i }).first().click();
    await expect(page).toHaveURL(/aanmelden/);
  });

  test("navigeert naar inloggen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /inloggen/i }).first().click();
    await expect(page).toHaveURL(/inloggen/);
  });
});
