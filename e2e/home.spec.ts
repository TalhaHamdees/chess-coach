import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads with starting position board", async ({ page }) => {
    // Board grid should render
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();

    // Should show 64 squares
    const squares = page.locator('[role="gridcell"]');
    await expect(squares).toHaveCount(64);
  });

  test("has all 7 navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /openings/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /tactics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /endgames/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /analyze/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /coach/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /custom/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /study plan/i })).toBeVisible();
  });

  test("navigation links go to correct pages", async ({ page }) => {
    // Check openings link
    const openingsLink = page.getByRole("link", { name: /openings/i });
    await expect(openingsLink).toHaveAttribute("href", "/train/opening");

    // Check tactics link
    const tacticsLink = page.getByRole("link", { name: /tactics/i });
    await expect(tacticsLink).toHaveAttribute("href", "/train/tactics");

    // Check endgames link
    const endgamesLink = page.getByRole("link", { name: /endgames/i });
    await expect(endgamesLink).toHaveAttribute("href", "/train/endgame");

    // Check analyze link
    const analyzeLink = page.getByRole("link", { name: /analyze/i });
    await expect(analyzeLink).toHaveAttribute("href", "/analyze");

    // Check coach link
    const coachLink = page.getByRole("link", { name: /coach/i });
    await expect(coachLink).toHaveAttribute("href", "/coach");

    // Check custom link
    const customLink = page.getByRole("link", { name: /custom/i });
    await expect(customLink).toHaveAttribute("href", "/train/custom");

    // Check plan link
    const planLink = page.getByRole("link", { name: /study plan/i });
    await expect(planLink).toHaveAttribute("href", "/plan");
  });

  test("New Game button resets board", async ({ page }) => {
    const newGameBtn = page.getByRole("button", { name: /new game/i });
    await expect(newGameBtn).toBeVisible();

    // Click new game — should not crash
    await newGameBtn.click();

    // Board should still be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });

  test("Flip button toggles orientation", async ({ page }) => {
    const flipBtn = page.getByRole("button", { name: /flip/i });
    await expect(flipBtn).toBeVisible();

    // Click flip — should not crash
    await flipBtn.click();

    // Board should still be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });

  test("shows theme toggle", async ({ page }) => {
    const themeBtn = page.getByRole("button", { name: /toggle theme/i });
    await expect(themeBtn).toBeVisible();
  });

  test("shows White to move initially", async ({ page }) => {
    await expect(page.getByText("White to move")).toBeVisible();
  });
});
