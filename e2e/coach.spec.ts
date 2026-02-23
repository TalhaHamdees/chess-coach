import { test, expect } from "@playwright/test";

const MOCK_COACH_RESPONSE = {
  message: "Great position! The Italian Game is a classic opening.",
  fen: null,
  arrows: [],
  highlights: [],
  engineMove: null,
  suggestedMove: null,
  moveQuality: null,
};

test.describe("Coach Chat", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the AI API route
    await page.route("**/api/coach", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COACH_RESPONSE),
      });
    });
  });

  test("loads with board and chat panel", async ({ page }) => {
    await page.goto("/coach");

    // Header should show
    await expect(page.locator("header").getByText("Coach Chat")).toBeVisible();

    // Board should be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();

    // Chat panel card title should be visible (desktop)
    await expect(page.locator('[data-slot="card"] >> text=Coach Chat')).toBeVisible();
  });

  test("has New Game and Flip buttons", async ({ page }) => {
    await page.goto("/coach");

    await expect(page.getByRole("button", { name: /new game/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /flip/i })).toBeVisible();
  });

  test("sends message and receives mocked AI response", async ({ page }) => {
    await page.goto("/coach");

    // Type a message in the input
    const chatInput = page.getByPlaceholder(/ask your coach/i);
    await chatInput.fill("What should I play?");

    // Send the message
    await chatInput.press("Enter");

    // Should show the mocked response
    await expect(
      page.getByText("Great position! The Italian Game is a classic opening.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("back link goes to home", async ({ page }) => {
    await page.goto("/coach");

    const backLink = page.getByRole("link", { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });
});
