import { test, expect } from "@playwright/test";

// Deze tests draaien op iPhone 14 viewport (zie playwright.config.ts)
test.describe("Mobiele weergave", () => {
  test("landingspagina laadt zonder horizontale scroll", async ({ page }) => {
    await page.goto("/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px marge
  });

  test("aanmeldpagina is bruikbaar op mobiel", async ({ page }) => {
    await page.goto("/aanmelden");
    const emailInput = page.getByPlaceholder(/jij@example.com/i);
    await expect(emailInput).toBeVisible();
    // Controleer dat het formulier niet buiten beeld valt
    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
  });

  test("inlogpagina is bruikbaar op mobiel", async ({ page }) => {
    await page.goto("/inloggen");
    await expect(page.getByRole("button", { name: /inloggen/i })).toBeVisible();
  });

  test("hero-tekst is leesbaar op mobiel", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").filter({ hasText: /nooit meer.*document.*kwijt/i })).toBeVisible();
  });
});
