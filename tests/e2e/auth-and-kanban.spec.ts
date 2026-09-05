import { test, expect } from "@playwright/test";

test.describe("E2E Journey: Public Pages, Authentication & Navigation", () => {
  test("loads the public landing page with hero, live mockup, and hierarchy", async ({ page }) => {
    await page.goto("/");

    // Expect hero branding
    await expect(page.locator("text=The real-time workspace for modern engineering.")).toBeVisible();
    await expect(page.locator('a:has-text("Create Free Workspace")')).toBeVisible();
    await expect(page.locator('a:has-text("See How It Works")')).toBeVisible();

    // Expect live mockup and hierarchy
    await expect(page.locator("text=TripTally [TRIP] — Sprint 12 Kanban")).toBeVisible();
    await expect(page.locator("text=Domain Hierarchy")).toBeVisible();
  });

  test("loads the public how-it-works guide page", async ({ page }) => {
    await page.goto("/how-it-works");

    await expect(page.locator("text=How to Use Workflow")).toBeVisible();
    await expect(page.locator("text=STEP 01")).toBeVisible();
    await expect(page.locator("text=Interactive Drag & Drop Kanban")).toBeVisible();
  });

  test("loads the login page with OAuth and Credentials forms", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("text=Welcome to Workflow")).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("text=Continue with GitHub")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("loads the register page with signup form", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator("text=Create your Workflow account")).toBeVisible();
    await expect(page.locator('input[placeholder="Nithin"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account & Workspace")')).toBeVisible();
  });
});
