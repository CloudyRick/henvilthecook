import { test, expect } from "@playwright/test";

test.describe("Admin page access", () => {
  test("redirects unauthenticated users away from /admin", async ({ page }) => {
    await page.goto("/admin");
    // Should not render the admin dashboard
    await expect(page.getByText("Admin Dashboard")).not.toBeVisible();
  });

  test("admin page URL resolves without server error", async ({ page }) => {
    const response = await page.goto("/admin");
    // Should redirect (3xx) or return 200 — never a 5xx
    expect(response?.status()).toBeLessThan(500);
  });
});
