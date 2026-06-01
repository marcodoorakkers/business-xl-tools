import { test, expect } from "@playwright/test";

test.describe("Aanmeldpagina", () => {
  test("toont het registratieformulier", async ({ page }) => {
    await page.goto("/aanmelden");
    await expect(page.getByRole("heading", { name: "Account aanmaken" })).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /account aanmaken/i })).toBeVisible();
  });

  test("toont foutmelding bij niet-overeenkomende wachtwoorden", async ({ page }) => {
    await page.goto("/aanmelden");
    await page.locator("input[type='email']").fill("test@example.com");
    await page.locator("input[type='password']").nth(0).fill("wachtwoord1");
    await page.locator("input[type='password']").nth(1).fill("wachtwoord2");
    await page.getByRole("button", { name: /account aanmaken/i }).click();
    await expect(page.getByText(/wachtwoorden komen niet overeen/i)).toBeVisible();
  });

  test("toont foutmelding bij te kort wachtwoord", async ({ page }) => {
    await page.goto("/aanmelden");
    await page.locator("input[type='email']").fill("test@example.com");
    await page.locator("input[type='password']").nth(0).fill("kort");
    await page.locator("input[type='password']").nth(1).fill("kort");
    await page.getByRole("button", { name: /account aanmaken/i }).click();
    await expect(page.getByText(/minimaal 8 tekens/i)).toBeVisible();
  });

  test("heeft werkende link naar inlogpagina", async ({ page }) => {
    await page.goto("/aanmelden");
    await page.getByRole("link", { name: /inloggen/i }).click();
    await expect(page).toHaveURL(/inloggen/);
  });
});
