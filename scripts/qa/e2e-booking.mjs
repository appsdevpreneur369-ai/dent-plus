// TEST-ONLY end-to-end booking on the website against a LOCAL build or STAGING (never production).
// Staging is safe for this because SMS and WhatsApp are in dry-run there and test OTPs are allowed (OTP 123456);
// test patients use @dpc.test emails (undeliverable) and phones in the dummy range 90000115xx
// (SPDC 90000111xx, AISHWARYA 90000113xx, DPC demo seed 90000114xx).
// Usage: node scripts/qa/e2e-booking.mjs <site base URL> qa/e2e
// The site must be built with NEXT_PUBLIC_CLINICFLOW_API_URL / _CLINIC_SLUG pointing at the API, and its origin must be in
// the API's CORS list (otherwise booking falls back, which checks 6-7 test on purpose).
// Multi-speciality flow: start by department or doctor → concern → (doctor) → day → time → details → OTP.
// Every scenario is a pass/fail check; exit code 1 if any fails.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const [base = 'http://localhost:3300', out = 'qa/e2e'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
if (/clinicflow247\.com|clinicflow-frontend-\d|clinicflow-api-\d/.test(base)) throw new Error(`Refusing to run against production: ${base}`);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
const check = (scenario, pass, detail = {}) => {
  results.push({ scenario, pass, ...detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${scenario}${pass ? '' : `  ${JSON.stringify(detail).slice(0, 300)}`}`);
};
const stamp = Date.now();
let phoneSeq = Math.floor(Math.random() * 90);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const S = (scope) => (scope === 'main' ? 'main' : '[role=dialog]');
const click = async (page, text, scope) => (await page.waitForSelector(`${S(scope)} ::-p-text(${text})`, { timeout: 25000 })).click();
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const stepText = (page, scope) => page.$eval(S(scope), (d) => d.innerText).catch(() => '');

/** From "Pick a day" onwards: day → time → details (→ OTP). Returns the result heading or the error text. */
async function finish(page, prefix, { email, phone, expectOtp = true, scope } = {}) {
  const sel = S(scope);
  try {
    if (await page.$(`${sel} [role=radiogroup][aria-label=Doctor]`)) await click(page, 'Continue', scope);
    const day = await page.waitForSelector(`${sel} [role=listbox] [role=option]:nth-child(2)`, { timeout: 25000 });
    await day.click();
    await page.waitForSelector(`${sel} [role=radiogroup][aria-label=Time] [role=radio]`, { timeout: 25000 });
    const slots = await page.$$(`${sel} [role=radiogroup][aria-label=Time] [role=radio]`);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const slotText = await slot.evaluate((e) => e.textContent);
    await slot.click();
    await click(page, 'Continue', scope);
    await page.waitForSelector('#bk-name');
    await wait(400);
    await page.type('#bk-name', 'Test Patient');
    // A fresh number per booking: core matches an existing patient by phone before it checks the email.
    await page.type('#bk-phone', phone ?? `90000115${String(10 + (phoneSeq++ % 90)).padStart(2, '0')}`);
    await page.type('#bk-email', email ?? `e2e+${stamp}-${prefix}@dpc.test`);
    await page.click(`${sel} input[type=checkbox]`);
    await page.click(`${sel} button[type=submit]`);
    if (expectOtp) {
      await page.waitForSelector('#bk-otp', { timeout: 25000 });
      await wait(400);
      await page.type('#bk-otp', '123456');
      await page.click(`${sel} button[type=submit]`);
    }
    const res = await page.waitForFunction(
      (s) => {
        const d = document.querySelector(s);
        const h = d?.querySelector('h2')?.textContent ?? '';
        const alert = d?.querySelector('[role=alert]')?.textContent ?? '';
        return /confirmed|Request sent|received|on WhatsApp/i.test(h) ? { heading: h } : alert ? { error: alert } : false;
      },
      { timeout: 40000 },
      sel,
    );
    const r = await res.jsonValue();
    await shot(page, `${prefix}-result`);
    return { slotText, ...r };
  } catch (e) {
    await shot(page, `${prefix}-FAILED`);
    return { error: String(e).slice(0, 300) };
  }
}

// 1) Hero "Book in 30 seconds": Children → paediatrician concern → straight to the day (one doctor) → OTP → confirmed.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.click('label:has(input[value=children])');
  await page.click('button ::-p-text(See free times)');
  await page.waitForSelector('[role=dialog]');
  await click(page, 'Child with fever or cough');
  await wait(2500); // health check
  const r = await finish(page, '1-children');
  check('hero card → Children → paediatrician booked live (SMS code) → confirmed', /confirmed/i.test(r.heading ?? ''), r);
  await page.close();
}

// 2) Department first: header Book → Dental care → "Missing tooth or teeth" → doctor step (two prosthodontists) → confirmed.
//    Then the same email again → honest "already uses this email" message, never "slot taken".
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.click('header button[aria-haspopup=dialog]');
  await click(page, 'Dental care');
  await click(page, 'Missing tooth or teeth');
  const doctorStep = await page.waitForSelector('[role=dialog] [role=radiogroup][aria-label=Doctor]', { timeout: 10000 }).then(() => true).catch(() => false);
  await wait(2500);
  const email = `e2e+${stamp}-repeat@dpc.test`;
  const r = await finish(page, '2-dental', { email });
  check('department first: Dental → concern → choose doctor (2 dentists) → confirmed', doctorStep && /confirmed/i.test(r.heading ?? ''), { doctorStep, ...r });
  await page.click('[role=dialog] button[aria-label="Close booking"]');
  await page.click('header button[aria-haspopup=dialog]');
  await click(page, 'Dental care');
  await click(page, 'Cleaning or check-up');
  await wait(2500);
  const rr = await finish(page, '2b-repeat', { email });
  check('second booking with the same email → "patient account already uses this email"', /already uses this email/i.test(rr.error ?? ''), rr);
  await page.close();
}

// 3) Doctor first: Dr. Padmaja Rani's page → only her concerns (eyes + family, no dental/children chips) → confirmed.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/doctors/dr-t-padmaja-rani`, { waitUntil: 'load' });
  await page.click('main button ::-p-text(Book with)');
  await page.waitForSelector('[role=dialog] ::-p-text(What is the visit for?)');
  const text = await stepText(page);
  const scoped = /Eye strain or headaches/.test(text) && /BP or sugar review/.test(text) && !/Missing tooth/.test(text) && !/Child with fever/.test(text);
  await click(page, 'Eye strain or headaches');
  await wait(2500);
  const r = await finish(page, '3-eyes');
  check('doctor first: eye doctor → only her concerns → confirmed', scoped && /confirmed/i.test(r.heading ?? ''), { scoped, ...r });
  await page.close();
}

// 4) No auto-opening popup on this site (desktop, 14 s idle).
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/about`, { waitUntil: 'load' });
  await wait(14000);
  check('no auto-opening booking popup', !(await page.$('[role=dialog]')));
  await page.close();
}

// 5) Phone: the sticky action bar opens booking. Doctors API down → enquiry (a real lead), clearly a request.
{
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  page.on('request', (rq) => (/\/api\/clinicflow\/clinics\/[0-9a-f-]{36}\/doctors$/.test(rq.url()) ? rq.respond({ status: 503, contentType: 'application/json', body: '{"success":false,"error":{"code":"DOWN"}}' }) : rq.continue()));
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.click('div.fixed button[aria-haspopup=dialog]');
  await click(page, 'Eye care');
  await click(page, 'Eye check');
  await wait(2500);
  const r = await finish(page, '5-enquiry', { expectOtp: false });
  check('phone bar → doctors API down → enquiry request (not a booking)', /Request sent|received/i.test(r.heading ?? '') && !/confirmed/i.test(r.heading ?? ''), r);
  await ctx.close();
}

// 6) Whole API unreachable → WhatsApp fallback to the approved number 94409 19770, never "booked".
{
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (rq) => (/\/api\/clinicflow\/|localhost:8089|clinicflow-api-staging/.test(rq.url()) ? rq.abort() : rq.continue()));
  await page.goto(`${base}/book?problem=toothache`, { waitUntil: 'load' });
  await wait(3500);
  const r = await finish(page, '6-whatsapp', { expectOtp: false, scope: 'main' });
  const href = await page.$eval('main a[href^="https://wa.me/"]', (a) => a.href).catch(() => '');
  check('API down → WhatsApp message to +91 94409 19770, never a success', /on WhatsApp/i.test(r.heading ?? '') && href.startsWith('https://wa.me/919440919770?text='), { ...r, href: href.slice(0, 40) });
  await ctx.close();
}

// 7) Deep link to a one-doctor concern skips the doctor step: /book?problem=child-fever → "Pick a day".
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/book?problem=child-fever`, { waitUntil: 'load' });
  await page.waitForSelector('main ::-p-text(Pick a day)', { timeout: 25000 }).catch(() => null);
  const text = await stepText(page, 'main');
  check('deep link ?problem=child-fever → straight to "Pick a day" (no doctor step)', /Pick a day/.test(text) && !/Choose your doctor/.test(text));
  await page.close();
}

// 8) Deep link by department: /book?department=eyes → concern step with eye concerns only.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/book?department=eyes`, { waitUntil: 'load' });
  await page.waitForSelector('main ::-p-text(What is the visit for?)', { timeout: 25000 }).catch(() => null);
  const text = await stepText(page, 'main');
  check('deep link ?department=eyes → eye concerns only', /Red, itchy or watery eyes/.test(text) && !/Missing tooth/.test(text) && !/Fever, cough or cold/.test(text));
  await page.close();
}

await browser.close();
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} booking checks passed`);
process.exitCode = failed ? 1 : 0;
