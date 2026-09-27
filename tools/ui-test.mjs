/**
 * Headless smoke test for the Hangova product app.
 * Drives the real UI through Chrome: signs in, plans a trip, and checks that
 * each module's screens render without runtime errors.
 */
import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5174'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const pass = []
const fail = []

function check(label, ok, detail = '') {
  ;(ok ? pass : fail).push(label + (detail ? ` — ${detail}` : ''))
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * innerText reflects CSS text-transform, and this UI uppercases its section
 * headings, so every text assertion has to be case-insensitive.
 */
async function text() {
  const raw = await page.evaluate(() => document.body.innerText)
  return raw.toUpperCase()
}

/** Case-insensitive "does the page contain this phrase" test. */
function has(body, needle) {
  return String(body).toUpperCase().includes(String(needle).toUpperCase())
}

/** Case-insensitive waitForFunction on page text. */
async function waitFor(needle, timeout = 20000) {
  await page.waitForFunction(
    (n) => document.body.innerText.toUpperCase().includes(n.toUpperCase()),
    { timeout },
    needle,
  )
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000'],
  defaultViewport: { width: 1440, height: 1000 },
})

const page = await browser.newPage()

const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

async function text() {
  return page.evaluate(() => document.body.innerText)
}

/** Clicks the submit button of the first form (not a tab or link). */
async function submit() {
  const ok = await page.evaluate(() => {
    const form = document.querySelector('form')
    const btn = form && form.querySelector('button.primary, button[type=submit]')
    if (btn) {
      btn.click()
      return true
    }
    return false
  })
  if (!ok) throw new Error('no submit button found')
  return true
}

async function clickText(selector, needle) {
  const handle = await page.evaluateHandle(
    (sel, n) => [...document.querySelectorAll(sel)].find((el) => el.innerText.trim().includes(n)),
    selector,
    needle,
  )
  const el = handle.asElement()
  if (!el) throw new Error(`no ${selector} containing "${needle}"`)
  await el.click()
  return true
}

try {
  /* ---------------- login screen ---------------- */
  console.log('\n== Login screen ==')
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 })
  await sleep(900)
  let body = await text()
  check('sign-in page renders', has(body, 'Hangova') && has(body, 'Sign in')
  check('all four modules listed', ['User & Admin', 'AI Planning', 'Borrow & Booking', 'Travel Info'].every((m) => has(body, m))

  // use the demo account shortcut, then submit the form
  await clickText('button', 'Traveller')
  await sleep(200)
  await submit()
  await waitFor('Hello,', 25000)
  body = await text()
  check('signed in as demo traveller', has(body, 'Hello, Demo')
  check('dashboard shows module shortcuts', has(body, 'Plan a new trip') && has(body, 'Travel loan')

  /* ---------------- Module 2: planner ---------------- */
  console.log('\n== Module 2: AI trip planner ==')
  await clickText('a', 'Plan a trip')
  await waitFor('Trip details', 20000)

  await page.type('input[placeholder*="Manali"]', 'Manali')
  await sleep(1400) // let the type-ahead resolve

  const suggestionCount = await page.evaluate(() => document.querySelectorAll('form button').length)
  check('destination suggestions appear', suggestionCount > 0)

  // pick the first suggestion if present
  const picked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) =>
      /curated|live lookup/.test(b.innerText),
    )
    if (btns.length) {
      btns[0].click()
      return true
    }
    return false
  })
  if (picked) await sleep(300)

  await clickText('button', 'Generate itinerary')
  await waitFor('Budget estimate', 45000)
  body = await text()
  check('itinerary generated', has(body, 'Day by day')
  check('budget estimate shown', has(body, 'Budget estimate') && has(body, 'Estimated total')
  check('day cost rendered', /DAY COST/.test(body))
  check('free-entry places labelled', has(body, 'Free')
  check('weather surfaced', /live weather|estimated weather/.test(body))
  check('budget tips rendered', has(body, 'Budget-based suggestions')
  check('place recommendations rendered', has(body, 'Recommended places')

  /* ---------------- Module 3: booking ---------------- */
  console.log('\n== Module 3: booking ==')
  await clickText('a', 'Hotels & transport')
  await waitFor('Travellers', 20000)
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input')]
    const dest = inputs.find((i) => i.placeholder === 'City or destination')
    if (dest) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(dest, 'Goa')
      dest.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await sleep(400)
  await clickText('button', 'Search')
  await waitFor('per night', 30000)
  body = await text()
  check('hotel results listed', has(body, 'per night') && /stays/i.test(body))
  check('cancellation policy shown', has(body, 'Cancellation')
  check('weather fetched alongside', /forecast|Weather/i.test(body))

  // book the first hotel
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^Book for/.test(x.innerText))
    if (b) b.click()
  })
  await waitFor('Booked HNG-', 25000)
  body = await text()
  check('booking confirmed with reference', has(body, 'Booked HNG-')

  /* ---------------- Module 3: bookings history ---------------- */
  console.log('\n== Module 3: bookings & cancellation ==')
  await clickText('a', 'My bookings')
  await waitFor('Total bookings', 20000)
  body = await text()
  check('booking history shows the new booking', has(body, 'CONFIRMED') && has(body, 'Cancel booking')

  page.on('dialog', async (d) => {
    await d.accept('Changed plans')
  })
  await clickText('button', 'Cancel booking')
  await waitFor('cancelled', 25000)
  body = await text()
  check('cancellation recorded with refund', /cancelled/i.test(body) && /refund/i.test(body))

  /* ---------------- Module 3: travel loan ---------------- */
  console.log('\n== Module 3: travel loan ==')
  await clickText('a', 'Travel loan')
  await waitFor('Waiting for an administrator', 20000)
  body = await text()
  check('pending loan visible to traveller', has(body, 'PENDING')

  await clickText('button', 'Apply for a loan')
  await waitFor('New loan request', 15000)
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input')]
    const purpose = inputs.find((i) => i.placeholder && i.placeholder.includes('Family holiday'))
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    if (purpose) {
      setter.call(purpose, 'Weekend trip to Coorg')
      purpose.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await sleep(300)
  await clickText('button', 'Submit request')
  await waitFor('submitted', 25000)
  body = await text()
  check('loan application submitted', has(body, 'submitted')

  /* ---------------- Module 4: expenses ---------------- */
  console.log('\n== Module 4: expenses ==')
  await clickText('a', 'Expenses')
  await waitFor('Record an expense', 20000)
  await page.evaluate(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    const desc = document.querySelector('input[placeholder="What was it for?"]')
    if (desc) {
      setter.call(desc, 'Dinner at the beach shack')
      desc.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const amt = [...document.querySelectorAll('input[type=number]')].find(
      (i) => i.closest('form') && i.closest('form').innerText.includes('Record an expense'),
    )
    if (amt) {
      setter.call(amt, '1850')
      amt.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await sleep(300)
  await clickText('button', 'Add expense')
  await waitFor('Expense recorded', 25000)
  body = await text()
  check('expense recorded and summarised', has(body, 'Dinner at the beach shack') && has(body, 'TOTAL SPENT')

  /* ---------------- Module 4: profile ---------------- */
  console.log('\n== Profile ==')
  await clickText('a', 'Profile')
  await waitFor('Your profile', 20000)
  body = await text()
  check('profile shows account details', has(body, 'Member since') && has(body, 'Password')

  /* ---------------- admin ---------------- */
  console.log('\n== Admin console ==')
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Sign out')
    if (b) b.click()
  })
  await waitFor('Create account', 20000)
  await clickText('button', 'Administrator')
  await sleep(200)
  await submit()
  await waitFor('Hello,', 25000)
  await clickText('a', 'Admin')
  await waitFor('Admin console', 20000)
  body = await text()
  check('admin console loads', has(body, 'Admin console')
  check('pending loan visible to admin', has(body, 'Weekend trip to Coorg')

  // approve it
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Approve')
    if (b) b.click()
  })
  await waitFor('Travel loan request', 20000).catch(() => {})

  await page.screenshot({ path: 'C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\ui-admin.png', fullPage: false })

  // handle the amount prompt
  await sleep(300)
} catch (err) {
  console.log('\nSCRIPT ERROR:', err.message)
  fail.push('script error: ' + err.message)
  const here = await text().catch(() => '(could not read page)')
  console.log('--- current page text (first 700 chars) ---')
  console.log(here.slice(0, 700))
  const links = await page
    .evaluate(() => [...document.querySelectorAll('a')].map((a) => a.innerText.trim()).filter(Boolean))
    .catch(() => [])
  console.log('--- links on page ---')
  console.log(links.join(' | '))
  await page.screenshot({ path: 'C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\ui-error.png' }).catch(() => {})
}

/* ---------------- console errors ---------------- */
const realErrors = consoleErrors.filter(
  (e) => !/favicon|Download the React DevTools|net::ERR_/i.test(e)
    && !/Failed to load resource.*404/.test(e),
)
check('no uncaught console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))

await browser.close()

console.log(`\n============ UI: ${pass.length} passed, ${fail.length} failed ============`)
if (fail.length) {
  console.log('failures:')
  fail.forEach((f) => console.log('  - ' + f))
  process.exit(1)
}
