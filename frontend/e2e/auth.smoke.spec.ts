import { test, expect } from "@playwright/test";

/**
 * Smoke coverage for the highest-value flows. Uses the seeded demo accounts
 * (see backend/pkg/database/seed.go). Run against a live stack — see
 * playwright.config.ts.
 *
 * Selectors use input IDs (#email / #password) because labels are i18n
 * translated and not associated via htmlFor.
 */

const ACCOUNTS = [
  { role: "admin",   email: "admin@school.com",   password: "Admin@123",   landing: /admin/ },
  { role: "teacher", email: "teacher@school.com", password: "Teacher@123", landing: /teacher/ },
  { role: "student", email: "student@school.com", password: "Student@123", landing: /student/ },
  { role: "parent",  email: "parent@school.com",  password: "Parent@123",  landing: /parent/ },
];

async function login(page: any, email: string, password: string) {
  await page.goto("/en/auth/login");
  // Use ID selectors — labels are i18n-translated and not linked via htmlFor
  await page.locator("#email").waitFor({ state: "visible", timeout: 15_000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("button[type=submit]").click();
}

for (const acct of ACCOUNTS) {
  test(`${acct.role} can log in and reach their dashboard`, async ({ page }) => {
    await login(page, acct.email, acct.password);
    await expect(page).toHaveURL(acct.landing, { timeout: 20_000 });
  });
}

test("invalid credentials are rejected", async ({ page }) => {
  await login(page, "admin@school.com", "wrong-password");
  // Should stay on the login page and surface an error
  await expect(page).toHaveURL(/auth\/login/, { timeout: 10_000 });
  await expect(page.locator("form")).toBeVisible();
});

test("public homepage loads", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("body")).toBeVisible();
});
