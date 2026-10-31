import { expect, test, type Page } from '@playwright/test';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tab = (page: Page, name: string) => page.getByRole('link', { name, exact: true });

async function finishOnboarding(page: Page) {
  await page.goto('/');
  await button(page, 'Continue').click();
  await expect(page.getByText('Where would you like to go?')).toBeVisible();
}

/** Picks a sample place from the search screen. */
async function choosePlace(page: Page, rowName: string, place: RegExp) {
  await page.getByRole('button', { name: rowName }).click();
  await page.getByRole('button', { name: place }).first().click();
}

async function planTrip(page: Page, destination: RegExp) {
  await choosePlace(page, 'Choose a starting point', /^TSC/);
  await choosePlace(page, 'Search for a destination', destination);
  await button(page, 'Find a route').click();
}

test('First launch shows onboarding, switches to Bangla and remembers it', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByText('Compare walking routes with clearer information')).toBeVisible();
  await expect(page.getByText('These observations do not guarantee safety.')).toBeVisible();
  await expect(page.getByText('Where would you like to go?')).toBeHidden();

  await page.getByRole('radio', { name: 'বাংলা' }).click();
  await expect(page.getByText('আরও স্পষ্ট তথ্য নিয়ে হাঁটার পথ তুলনা করুন')).toBeVisible();
  await expect(page.getByText('এই তথ্য নিরাপত্তার নিশ্চয়তা নয়।')).toBeVisible();
  await testInfo.attach('onboarding-bn', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  await button(page, 'এগিয়ে যান').click();
  await expect(page.getByText('কোথায় যেতে চান?')).toBeVisible();

  await page.reload();
  await expect(page.getByText('কোথায় যেতে চান?')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Home needs a start and a destination, then compares routes with an honest recommendation', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await finishOnboarding(page);
  await expect(button(page, 'Find a route')).toBeDisabled();
  await expect(page.getByText('Choose a starting point and a destination.')).toBeVisible();

  await planTrip(page, /^Shahbag/);
  await expect(page.getByText('Sample data for design preview.')).toBeVisible();
  await expect(page.getByText('One route has better verified conditions than the other.')).toBeVisible();
  await expect(page.getByText('Better observed conditions', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Fastest', { exact: true })).toBeVisible();
  await expect(page.getByText('These observations do not guarantee safety.')).toBeVisible();
  await expect(page.getByText(/safe route|safest/i)).toHaveCount(0);
  await testInfo.attach('routes', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  await button(page, 'View details').first().click();
  await expect(page.getByText('Along the route')).toBeVisible();
  await expect(page.getByText('synthetic-demo-001', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Routes abstain when a crossing is unknown, and are plain outside the pilot area', async ({ page }) => {
  await finishOnboarding(page);
  await planTrip(page, /^Curzon Hall/);
  await expect(page.getByText('is not verified, so conditions are not compared.')).toBeVisible();
  await expect(page.getByText('Better observed conditions', { exact: true })).toHaveCount(0);

  await page.goBack();
  await choosePlace(page, 'Curzon Hall (কার্জন হল)', /^Gulshan 1/);
  await button(page, 'Find a route').click();
  await expect(page.getByText('This trip is outside the pilot area.')).toBeVisible();
  await expect(page.getByText('Conditions not assessed').first()).toBeVisible();
});

test('Help lists emergency numbers without needing an account', async ({ page }) => {
  await finishOnboarding(page);
  await tab(page, 'Help').click();
  for (const number of ['999', '109', '1098']) {
    await expect(button(page, `Call ${number}`)).toBeVisible();
  }
  await expect(page.getByText('does not contact anyone for you', { exact: false })).toBeVisible();
});

test('A street report is saved on the device, listed, and can be deleted', async ({ page }) => {
  await finishOnboarding(page);
  await tab(page, 'Report').click();
  await button(page, 'Submit privately').click();
  await expect(page.getByText('Choose what the problem is.')).toBeVisible();

  await page.getByRole('radio', { name: 'Streetlight not working' }).click();
  await page.getByRole('radio', { name: /^Shahbag/ }).click();
  await button(page, 'Submit privately').click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();

  await button(page, 'My reports').click();
  await expect(page.getByText('Streetlight not working')).toBeVisible();
  await expect(page.getByText('Saved on this device, waiting to send')).toBeVisible();

  page.once('dialog', dialog => dialog.accept());
  await button(page, 'Delete this report').click();
  await expect(page.getByText('You have not reported anything.')).toBeVisible();
});

test('Trusted contacts are validated and start as invited', async ({ page }) => {
  await finishOnboarding(page);
  await tab(page, 'Profile').click();
  await button(page, 'Trusted contacts. 0').click();
  await button(page, 'Add contact').click();
  await expect(page.getByText('Enter a name.')).toBeVisible();
  await expect(page.getByText('Enter a valid Bangladeshi mobile number.')).toBeVisible();

  await page.getByLabel('Name').fill('Rina');
  await page.getByLabel('Mobile number').fill('01712 345678');
  await button(page, 'Add contact').click();
  await expect(page.getByText('Waiting for them to accept')).toBeVisible();
});
