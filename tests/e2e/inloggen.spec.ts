import { test, expect } from "@playwright/test";

test.describe("Inlogpagina", () => {
  test("toont het inlogformulier", async ({ page }) => {
    await page.goto("/inloggen");
    await expect(page.getByText("Inloggen")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /^inloggen$/i })).toBeVisible();
  });

  test("toont foutmelding bij verkeerde gegevens", async ({ page }) => {
    await page.goto("/inloggen");
    await page.locator("input[type='email']").fill("bestaat.niet@example.com");
    await page.locator("input[type='password']").fill("verkeertwachtwoord");
    await page.getByRole("button", { name: /^inloggen$/i }).click();
    await expect(page.locator("p.text-red-500")).toBeVisible({ timeout: 10000 });
  });

  test("heeft werkende link naar aanmeldpagina", async ({ page }) => {
    await page.goto("/inloggen");
    await page.getByRole("link", { name: /aanmelden/i }).click();
    await expect(page).toHaveURL(/aanmelden/);
  });
});
