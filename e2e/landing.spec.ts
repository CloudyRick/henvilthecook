import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows brand name in header", async ({ page }) => {
    await expect(page.getByText("Henvil the Cook").first()).toBeVisible();
  });

  test("shows hero title", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows table of contents section", async ({ page }) => {
    await expect(page.getByText("Table of Contents")).toBeVisible();
  });

  test("shows at least one content section", async ({ page }) => {
    const rows = page.locator("#chapters > div");
    await expect(rows.first()).toBeVisible();
  });

  test("shows Sign In button when not logged in", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("shows Unlock Full Content button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Unlock Full Content" })
    ).toBeVisible();
  });

  test("footer shows brand name", async ({ page }) => {
    await expect(page.locator("footer").getByText("Henvil the Cook")).toBeVisible();
  });
});
