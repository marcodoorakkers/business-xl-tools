import { test, expect } from "@playwright/test";

// API auth — geen sessie = 401 of redirect
test.describe("API auth-checks (geen sessie)", () => {
  const apiRoutes: { method: "get" | "post"; path: string }[] = [
    { method: "post", path: "/api/reminders/send" },
    { method: "post", path: "/api/tools/mijn-dossier/sync-actielijst" },
    { method: "get",  path: "/api/gezin/my-data" },
    { method: "get",  path: "/api/gezin/clear-data" },
    { method: "post", path: "/api/gezin/clear-data" },
    { method: "get",  path: "/api/tools/mijn-dossier/acties" },
    { method: "get",  path: "/api/tools/mijn-dossier/documents" },
  ];

  for (const { method, path } of apiRoutes) {
    test(`${method.toUpperCase()} ${path} weigert zonder sessie`, async ({ request }) => {
      const res = method === "get"
        ? await request.get(path)
        : await request.post(path);
      expect([401, 307]).toContain(res.status());
    });
  }

  test("Reminder API weigert verkeerde bearer token", async ({ request }) => {
    const res = await request.post("/api/reminders/send", {
      headers: { Authorization: "Bearer wrongsecret" },
    });
    expect(res.status()).toBe(401);
  });
});

// Trial-informatie op landingspagina
test.describe("Trial-informatie op landingspagina", () => {
  test("CTA stuurt door naar aanmelden", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /gratis beginnen/i }).first().click();
    await expect(page).toHaveURL(/\/aanmelden/);
  });
});
