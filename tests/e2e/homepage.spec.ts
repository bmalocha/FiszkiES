import { test, expect } from "@playwright/test";

test("homepage has expected title and heading", async ({ page }) => {
  // Navigate to the homepage using baseURL from config
  await page.goto("/");

  // Expect a title "to contain" a substring.
  // Adjust the title if needed
  await expect(page).toHaveTitle(/FiszkiES/);

  // Expect the main heading to be visible and contain the correct text.
  // Adjust the selector and text if needed
  const heading = page.locator("h1");
  await expect(heading).toBeVisible();
  await expect(heading).toContainText("Hej!"); // Adjust if your heading text is different
});

// Example of another test: Check if the main call-to-action button exists
// test('homepage has call-to-action button', async ({ page }) => {
//   await page.goto('/');

//   // Adjust selector based on your button
// });
