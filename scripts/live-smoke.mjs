// Live deployment smoke test
import { chromium } from 'playwright';

const base = process.env.CRM_BASE_URL || 'https://jyhome1228-cyber.github.io/jnccrm';
const failures = [];
const consoleErrors = [];
const badResponses = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const browser = await chromium.launch({ headless: true });

async function attachDiagnostics(page, label) {
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[${label}] ${msg.text()}`);
  });
  page.on('pageerror', err => consoleErrors.push(`[${label}] PAGEERROR ${err.message}`));
  page.on('response', response => {
    const url = response.url();
    if (response.status() >= 400 && (url.startsWith(base) || /firebase|googleapis|gstatic/.test(url))) {
      badResponses.push(`[${label}] ${response.status()} ${url}`);
    }
  });
}

// Desktop login
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await attachDiagnostics(page, 'desktop-login');
  const response = await page.goto(base + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
  assert(response && response.ok(), 'Login page did not return HTTP 2xx.');
  assert((await page.title()) === 'Sign in · JN COS TECH CRM', 'Unexpected login page title.');
  assert(await page.locator('#loginForm').isVisible(), 'Login form is not visible.');
  assert(await page.locator('#loginEmail').isVisible(), 'Email input is not visible.');
  assert(await page.locator('#loginPassword').isVisible(), 'Password input is not visible.');
  assert(await page.getByRole('button', { name: 'Sign in' }).isVisible(), 'Sign in button is not visible.');
  assert((await page.locator('body').innerText()).includes('INTERNAL WORKSPACE'), 'Login brand copy is missing.');
  assert(!(await page.locator('body').innerText()).includes('Test login'), 'Test login copy is exposed in production.');
  assert(!(await page.locator('body').innerText()).includes('1111'), 'Test password is exposed in production.');

  await page.fill('#loginEmail', 'qa@example.com');
  await page.fill('#loginPassword', '1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const errorText = await page.locator('#loginError').innerText();
  assert(errorText.includes('Firebase password'), 'Short-password validation did not appear.');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `Desktop login has horizontal overflow: ${overflow}px`);
  await page.screenshot({ path: 'artifacts/login-desktop.png', fullPage: true });
  await page.close();
}

// Unauthenticated root should redirect to login
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await attachDiagnostics(page, 'root-redirect');
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForURL(/login\.html(?:\?.*)?$/, { timeout: 20000 });
  assert(/login\.html(?:\?.*)?$/.test(page.url()), 'Unauthenticated root did not redirect to login.');
  await page.close();
}

// Mobile login
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1
  });
  await attachDiagnostics(page, 'mobile-login');
  const response = await page.goto(base + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
  assert(response && response.ok(), 'Mobile login page did not return HTTP 2xx.');
  assert(await page.locator('#loginForm').isVisible(), 'Mobile login form is not visible.');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `Mobile login has horizontal overflow: ${overflow}px`);
  const formBox = await page.locator('.login-card').boundingBox();
  assert(formBox && formBox.width <= 390, 'Mobile login card exceeds viewport width.');
  await page.screenshot({ path: 'artifacts/login-mobile.png', fullPage: true });
  await page.close();
}

await browser.close();

const ignoredConsole = consoleErrors.filter(msg => !/favicon/i.test(msg));
if (ignoredConsole.length) {
  failures.push('Console errors detected:\n' + ignoredConsole.join('\n'));
}
if (badResponses.length) {
  failures.push('HTTP/resource errors detected:\n' + badResponses.join('\n'));
}

if (failures.length) {
  console.error('\nLIVE SMOKE TEST FAILED');
  for (const failure of failures) console.error('\n- ' + failure);
  process.exit(1);
}

console.log('LIVE SMOKE TEST PASSED');
console.log('Checked:', base);
