import { test, expect } from "@playwright/test";

const MOCK_PLAN_RESPONSE = {
  message:
    "Here is your personalized study plan:\n\nWeek 1-2: Solve 10 tactics puzzles daily.",
  fen: null,
  arrows: [],
  highlights: [],
  engineMove: null,
  suggestedMove: null,
  moveQuality: null,
};

test.describe("Rating Planner", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the AI API route
    await page.route("**/api/coach", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PLAN_RESPONSE),
      });
    });
  });

  test("loads with form", async ({ page }) => {
    await page.goto("/plan");

    // Header should show
    await expect(
      page.locator("header").getByText("Rating Improvement Plan")
    ).toBeVisible();

    // Form fields should be visible
    await expect(page.getByLabel(/current rating/i)).toBeVisible();
    await expect(page.getByLabel(/target rating/i)).toBeVisible();
    await expect(page.getByText(/available study time/i)).toBeVisible();
    await expect(page.getByText(/biggest weaknesses/i)).toBeVisible();
    await expect(page.getByText(/preferred time control/i)).toBeVisible();
  });

  test("generate button is disabled without ratings", async ({ page }) => {
    await page.goto("/plan");

    const generateBtn = page.getByRole("button", {
      name: /generate study plan/i,
    });
    await expect(generateBtn).toBeDisabled();
  });

  test("fills form and generates plan", async ({ page }) => {
    await page.goto("/plan");

    // Fill ratings
    await page.getByLabel(/current rating/i).fill("1200");
    await page.getByLabel(/target rating/i).fill("1500");

    // Generate should be enabled now
    const generateBtn = page.getByRole("button", {
      name: /generate study plan/i,
    });
    await expect(generateBtn).toBeEnabled();

    // Click generate
    await generateBtn.click();

    // Should show the mocked plan response (unique text from AI response)
    await expect(
      page.getByText(/Solve 10 tactics puzzles daily/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("back link goes to home", async ({ page }) => {
    await page.goto("/plan");

    const backLink = page.getByRole("link", { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });
});
