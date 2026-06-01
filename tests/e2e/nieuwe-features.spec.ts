import { test, expect } from "@playwright/test";

// T21 — Reminder API auth
test.describe("Reminder API (T21)", () => {
  test("weigert ongeautoriseerde aanroep", async ({ request }) => {
    const res = await request.post("/api/reminders/send", {
      headers: { Authorization: "Bearer wrongsecret" },
    });
    expect(res.status()).toBe(401);
  });

  test("weigert aanroep zonder Authorization header", async ({ request }) => {
    const res = await request.post("/api/reminders/send");
    expect(res.status()).toBe(401);
  });
});

// Actielijst sync API auth
test.describe("Sync-actielijst API", () => {
  test("weigert aanroep zonder sessie", async ({ request }) => {
    const res = await request.post("/api/tools/mijn-dossier/sync-actielijst");
    expect([401, 307]).toContain(res.status());
  });
});

// T15 — Actiespagina vereist login
test.describe("Actiespagina auth (T15)", () => {
  test("redirect naar inloggen als niet ingelogd", async ({ page }) => {
    await page.goto("/acties");
    await expect(page).toHaveURL(/\/inloggen/);
  });
});

// Trial-informatie op landingspagina (relevant voor T22)
test.describe("Trial-informatie op landingspagina (T22)", () => {
  test("vermeldt geen creditcard nodig", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/geen creditcard/i).first()).toBeVisible();
  });

  test("vermeldt eerste maand gratis", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/eerste maand gratis/i).first()).toBeVisible();
  });

  test("CTA stuurt door naar aanmelden", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /gratis beginnen/i }).first().click();
    await expect(page).toHaveURL(/\/aanmelden/);
  });
});
