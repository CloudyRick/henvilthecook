import { test, expect } from "@playwright/test";

test.describe("Auth modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens auth modal when clicking Sign In", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Welcome Back")).toBeVisible();
  });

  test("shows email and password inputs in modal", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Min. 6 characters")).toBeVisible();
  });

  test("shows Continue with Google button", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Continue with Google")).toBeVisible();
  });

  test("can switch to sign up mode", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByText("Create Account")).toBeVisible();
  });

  test("closes modal when clicking the X button", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Welcome Back")).toBeVisible();
    // Click the X close button inside the modal
    await page.locator(".fixed.inset-0 button").first().click();
    await expect(page.getByText("Welcome Back")).not.toBeVisible();
  });

  test("opens auth modal when clicking Unlock Full Content unauthenticated", async ({ page }) => {
    await page.getByRole("button", { name: "Unlock Full Content" }).click();
    await expect(page.getByText("Welcome Back")).toBeVisible();
  });
});
