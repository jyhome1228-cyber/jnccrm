// Live deployment smoke test
// PDF import E2E
// E2E QA trigger 2026-10-02
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
  assert((await page.locator('body').innerText()).includes('Test login'), 'Dedicated test login is missing.');
  assert((await page.locator('body').innerText()).includes('test@jncostech.com / 1111'), 'Test login credentials are not shown as expected.');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `Desktop login has horizontal overflow: ${overflow}px`);
  await page.screenshot({ path: 'artifacts/login-desktop.png', fullPage: true });

  await page.fill('#loginEmail', 'test@jncostech.com');
  await page.fill('#loginPassword', '1111');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/index\.html#dashboard$/, { timeout: 10000 });
  assert((await page.locator('#sessionRole').innerText()).includes('Test Master'), 'Test session did not start in demo mode.');

  const navChecks = [
    ['calendar','Calendar'],['dashboard','Dashboard'],['customers','Customers'],['leads','Leads'],
    ['projects','Projects'],['samples','Samples'],['quotations','Quotations'],['orders','Orders'],
    ['operations','Operations'],['settings','Settings']
  ];
  for (const [hash,label] of navChecks) {
    await page.locator(`a.nav-item[data-view="${hash}"]`).click();
    await page.waitForTimeout(120);
    assert(page.url().includes('#' + hash), `${label} navigation failed.`);
    assert((await page.locator('#pageRoot').innerText()).trim().length > 0, `${label} page rendered empty.`);
  }

  await page.locator('a.nav-item[data-view="leads"]').click();
  await page.waitForTimeout(120);
  assert(await page.locator('[data-action="import-request-pdf"]').isVisible(), 'Import Request PDF button is missing on Leads.');
  const pdfRuntime = await page.evaluate(() => ({
    pdfjs: typeof window.pdfjsLib !== 'undefined',
    parser: typeof window.JNCRequestParser !== 'undefined'
  }));
  assert(pdfRuntime.pdfjs, 'PDF.js runtime did not load.');
  assert(pdfRuntime.parser, 'JN COS request parser did not load.');

  const fixturePage = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  await fixturePage.setContent(`<!doctype html><html><head><style>
    @page{size:A4;margin:28px} body{font-family:Arial,sans-serif;font-size:10px;color:#111}
    h1{font-size:16px;margin:0 0 8px}.section{font-weight:700;margin:14px 0 7px}
    .one{margin:4px 0}.label{font-weight:700;font-size:9px}.value{margin-top:4px}
    .g2,.g4{display:grid;gap:18px;margin:5px 0 9px}.g2{grid-template-columns:1fr 1fr}.g4{grid-template-columns:repeat(4,1fr)}
    .labels>div{font-weight:700;font-size:9px}.values>div{font-size:10px}
  </style></head><body>
    <h1>JN COS TECH</h1><div class="section">PROJECT REQUEST SUMMARY</div>
    <div class="one label">EXPORTED</div><div class="one value">1 Oct 2026, 6:05 pm</div>
    <div class="one label">DOCUMENT</div><div class="one value">99112233</div>
    <div class="one label">INQUIRY</div><div class="one value">QA Request Company</div><div class="one value">99112233 · 1 Oct 2026, 6:00 pm</div>
    <div class="g4 labels"><div>TYPE</div><div>STATUS</div><div>EMAIL</div><div>PHONE / WHATSAPP</div></div>
    <div class="g4 values"><div>Inquiry</div><div>New</div><div>qa@example.com</div><div>2079460101</div></div>
    <div class="section">CONTACT INFORMATION</div>
    <div class="g2 labels"><div>COMPANY / BRAND</div><div>CONTACT PERSON</div></div>
    <div class="g2 values"><div>QA Request Company</div><div>Martin</div></div>
    <div class="g2 labels"><div>POSITION</div><div>COMPANY TYPE</div></div>
    <div class="g2 values"><div>Operations Manager</div><div>Manufacturer / Industry Partner</div></div>
    <div class="g2 labels"><div>EMAIL</div><div>PHONE / WHATSAPP</div></div>
    <div class="g2 values"><div>qa@example.com</div><div>2079460101</div></div>
    <div class="g2 labels"><div>COUNTRY / REGION</div><div>WEBSITE / SOCIAL</div></div>
    <div class="g2 values"><div>United Kingdom</div><div>www.example.test</div></div>
    <div class="g2 labels"><div>PREFERRED CONTACT METHOD</div><div>PREFERRED CONTACT TIME</div></div>
    <div class="g2 values"><div>—</div><div>Please contact me with more information.</div></div>
    <div class="section">PROJECT SCOPE</div>
    <div class="g2 labels"><div>SERVICE TYPE</div><div>PRODUCT CATEGORIES</div></div>
    <div class="g2 values"><div>ODM — Develop a new product with JN COS TECH</div><div>Serum / Ampoule</div></div>
    <div class="g2 labels"><div>PROJECT STAGE</div><div>TARGET MARKETS</div></div>
    <div class="g2 values"><div>Idea / Early concept</div><div>United Kingdom / EU</div></div>
    <div class="g2 labels"><div>LAUNCH TIMING</div><div>INITIAL QUANTITY</div></div>
    <div class="g2 values"><div>Not decided yet</div><div>—</div></div>
    <div class="section">FORMULATION</div>
    <div class="g2 labels"><div>SKIN / PRODUCT CONCERNS</div><div>TEXTURES / FINISH</div></div>
    <div class="g2 values"><div>Hydration</div><div>Lightweight / Watery</div></div>
    <div class="one label">HERO INGREDIENTS / AVOID LIST</div><div class="one value">Open to recommendation</div>
    <div class="g2 labels"><div>CLAIMS / POSITIONING</div><div>FRAGRANCE</div></div>
    <div class="g2 values"><div>Vegan</div><div>Open to recommendation</div></div>
    <div class="one label">REFERENCE PRODUCTS</div><div class="one value">Follow-up reference message.</div>
    <div class="section">PACKAGING & MARKET REQUIREMENTS</div>
    <div class="g2 labels"><div>PACKAGING SUPPORT</div><div>PRIMARY PACKAGING</div></div>
    <div class="g2 values"><div>Need full packaging sourcing support</div><div>Dropper / Ampoule</div></div>
    <div class="g2 labels"><div>SECONDARY PACKAGING</div><div>DESIGN SUPPORT</div></div>
    <div class="g2 values"><div>Folding carton</div><div>Need design support</div></div>
    <div class="one label">CERTIFICATIONS / MARKET REQUIREMENTS</div><div class="one value">EU</div>
    <div class="section">ADDITIONAL REQUIREMENTS</div>
    <div class="one label">KEY REQUIREMENTS</div><div class="one value">I would like to know more about your services.</div>
    <div class="one label">ADDITIONAL NOTES</div><div class="one value">Please contact me.</div>
    <div class="one label">HOW THEY FOUND US</div><div class="one value">Referral</div>
    <div class="one label">PRIVACY CONSENT</div><div class="one value">Yes</div>
  </body></html>`, { waitUntil:'load' });
  const fixturePath = 'artifacts/request-import-fixture.pdf';
  await fixturePage.pdf({ path:fixturePath, format:'A4', printBackground:true });
  await fixturePage.close();

  await page.locator('#requestPdfInput').setInputFiles(fixturePath);
  await page.locator('#requestPdfReviewForm').waitFor({state:'visible', timeout:10000});
  assert((await page.locator('#requestPdfReviewForm [name="company"]').inputValue()) === 'QA Request Company', 'PDF company mapping failed.');
  assert((await page.locator('#requestPdfReviewForm [name="contact"]').inputValue()) === 'Martin', 'PDF contact mapping failed.');
  assert((await page.locator('#requestPdfReviewForm [name="type"]').inputValue()) === 'ODM', 'PDF service-type mapping failed.');
  assert((await page.locator('#requestPdfReviewForm [name="productCategory"]').inputValue()) === 'Serum / Ampoule', 'PDF product-category mapping failed.');
  assert((await page.locator('#requestPdfReviewForm [name="projectStage"]').inputValue()) === 'Idea / Early concept', 'PDF project-stage mapping failed.');
  await page.screenshot({ path:'artifacts/request-import-preview.png', fullPage:true });

  await page.locator('#requestPdfReviewForm button[type="submit"]').click();
  await page.waitForTimeout(250);
  const leadRow = page.locator('tbody tr', {hasText:'QA Request Company'}).first();
  assert(await leadRow.isVisible(), 'Imported Lead did not appear in the Leads table.');
  assert((await leadRow.innerText()).includes('Request #99112233'), 'Imported request Document ID is missing from the Lead row.');

  await leadRow.locator('[data-action="lead-to-project"]').click();
  await page.waitForURL(/#projects\//, {timeout:10000});
  const projectText = await page.locator('#pageRoot').innerText();
  assert(projectText.includes('Serum / Ampoule Development'), 'Lead → Project name mapping failed.');
  assert(projectText.includes('Serum / Ampoule'), 'Lead → Project category mapping failed.');
  assert(projectText.includes('ODM'), 'Lead → Project service-type mapping failed.');
  assert(projectText.includes('Idea / Early concept'), 'Lead → Project stage mapping failed.');
  await page.screenshot({ path:'artifacts/request-project-result.png', fullPage:true });

  await page.goto(base + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#loginEmail', 'qa@example.com');
  await page.fill('#loginPassword', '1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const validation = await page.locator('#loginPassword').evaluate(el => ({
    valid: el.validity.valid,
    tooShort: el.validity.tooShort,
    message: el.validationMessage
  }));
  const customError = await page.locator('#loginError').innerText();
  assert(validation.tooShort || customError.includes('Firebase password'), 'Short-password validation did not block submission.');
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
