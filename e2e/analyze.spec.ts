import { test, expect } from "@playwright/test";

const SAMPLE_PGN = `[Event "Test Game"]
[Site "Chess Coach"]
[Date "2024.01.01"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O 1-0`;

test.describe("Game Analysis", () => {
  test("loads with PGN import form", async ({ page }) => {
    await page.goto("/analyze");

    // Header should show
    await expect(page.locator("header").getByText("Game Analysis")).toBeVisible();

    // PGN textarea should be visible
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("imports PGN and shows board with moves", async ({ page }) => {
    await page.goto("/analyze");

    // Paste PGN into textarea
    const textarea = page.locator("textarea");
    await textarea.fill(SAMPLE_PGN);

    // Click Import button
    const importBtn = page.getByRole("button", { name: /import pgn/i });
    await importBtn.click();

    // Board should be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();

    // Move history should have moves
    await expect(page.getByText("e4")).toBeVisible();
  });

  test("shows header with game info after import", async ({ page }) => {
    await page.goto("/analyze");

    const textarea = page.locator("textarea");
    await textarea.fill(SAMPLE_PGN);

    const importBtn = page.getByRole("button", { name: /import pgn/i });
    await importBtn.click();

    // Should show player names in header
    await expect(
      page.locator("header").getByText(/Player1/)
    ).toBeVisible();
  });
});
