import { expect, test, type Page } from '@playwright/test';

const continueButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function finishOnboarding(page: Page) {
  await page.goto('/');
  await continueButton(page, 'Continue').click();
}

test('First launch shows onboarding, switches to Bangla and remembers it', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByText('Compare walking routes with clearer information')).toBeVisible();
  await expect(page.getByText('These observations do not guarantee safety.')).toBeVisible();
  await expect(page.getByText('Try editing', { exact: true })).toBeHidden();

  await page.getByRole('radio', { name: 'বাংলা' }).click();
  await expect(page.getByText('আরও স্পষ্ট তথ্য নিয়ে হাঁটার পথ তুলনা করুন')).toBeVisible();
  await expect(page.getByText('এই তথ্য নিরাপত্তার নিশ্চয়তা নয়।')).toBeVisible();
  await testInfo.attach('onboarding-bn', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  await continueButton(page, 'এগিয়ে যান').click();
  await expect(page.getByText('Try editing', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('Try editing', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Home loads with starter content and both navigation links', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await finishOnboarding(page);
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

  await finishOnboarding(page);
  await page.getByRole('link', { name: 'Explore', exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  const section = page.getByText('File-based routing', { exact: true });
  const details = page.getByText('src/app/explore.tsx', { exact: true });
  // The first click can land before the web build hydrates, so retry until it takes effect.
  await expect(async () => {
    if (!(await details.isVisible())) await section.click();
    await expect(details).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await testInfo.attach('explore-expanded', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await section.click();
  await expect(details).toBeHidden();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByText('Try editing', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
