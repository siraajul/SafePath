import { expect, test } from '@playwright/test';

test('Home loads with starter content and both navigation links', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByText('Try editing', { exact: true })).toBeVisible();
  await expect(page.getByText('Fresh start', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore', exact: true })).toBeVisible();
  await testInfo.attach('home', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  expect(errors).toEqual([]);
});

test('Explore expands its routing content and returns Home', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('link', { name: 'Explore', exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  const section = page.getByText('File-based routing', { exact: true });
  const details = page.getByText('src/app/explore.tsx', { exact: true });
  await section.click();
  await expect(details).toBeVisible();
  await testInfo.attach('explore-expanded', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await section.click();
  await expect(details).toBeHidden();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByText('Try editing', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
