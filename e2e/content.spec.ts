import { test, expect } from "@playwright/test";

test.describe("Content sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("locked sections show Members label", async ({ page }) => {
    await expect(page.getByText("Members").first()).toBeVisible();
  });

  test("free preview section expands on click", async ({ page }) => {
    const freeSection = page.locator("#chapters > div").filter({
      has: page.locator("svg path[d*='19.5 8.25']"),
    }).first();

    await freeSection.locator("button").click();
    await expect(freeSection.locator("div.pb-6")).toBeVisible();
  });

  test("multiple sections can be open simultaneously", async ({ page }) => {
    const freeSections = page.locator("#chapters > div").filter({
      has: page.locator("svg path[d*='19.5 8.25']"),
    });

    const count = await freeSections.count();
    if (count < 2) test.skip();

    await freeSections.nth(0).locator("button").click();
    await freeSections.nth(1).locator("button").click();

    await expect(freeSections.nth(0).locator("div.pb-6")).toBeVisible();
    await expect(freeSections.nth(1).locator("div.pb-6")).toBeVisible();
  });

  test("clicking open section again closes it", async ({ page }) => {
    const freeSection = page.locator("#chapters > div").filter({
      has: page.locator("svg path[d*='19.5 8.25']"),
    }).first();

    const button = freeSection.locator("button");
    await button.click();
    await expect(freeSection.locator("div.pb-6")).toBeVisible();
    await button.click();
    await expect(freeSection.locator("div.pb-6")).not.toBeVisible();
  });
});
