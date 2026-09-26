import { test, expect } from '@playwright/test';

test('kanban empty column', async ({ page }) => {
  await page.goto('http://localhost:3000/tests/kanban');
});
