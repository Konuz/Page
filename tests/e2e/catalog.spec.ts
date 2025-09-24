import { test, expect } from '@playwright/test';

test.describe('ToolShare landing flow', () => {
  test('homepage -> category -> tool detail', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await expect(page.getByRole('heading', { name: 'Nasze narzędzia' })).toBeVisible();

    const firstCategory = page.locator('#tools-grid a.category-card').first();
    const categoryName = await firstCategory.innerText();
    await firstCategory.click();

    await expect(page.locator('#category-title')).toHaveText(categoryName.trim());
    const firstTool = page.locator('#tools-grid a.tool-card').first();
    await firstTool.click();

    await expect(page.locator('#tool-details-section')).toBeVisible();
    await expect(page.locator('.breadcrumb span').last()).toBeVisible();
  });
});
