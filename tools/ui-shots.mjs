/**
 * Visual capture pass: signs in, walks the app, and screenshots each screen so
 * the 3D layering and motion can be reviewed.
 */
import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:5174'
const OUT = 'C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\shots'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const issues = []

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=swiftshader',
    '--window-size=1600,1100',
  ],
  defaultViewport: { width: 1600, height: 1100, deviceScaleFactor: 1 },
})

const page = await browser.newPage()

page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|React DevTools|404/.test(m.text())) {
    issues.push('console: ' + m.text().slice(0, 200))
  }
})
page.on('pageerror', (e) => issues.push('pageerror: ' + e.message.slice(0, 200)))

async function shot(name) {
  await sleep(1400)
  await page.screenshot({ path: `${OUT}\\${name}.png` })
  console.log('  captured ' + name)
}

/** Counts live WebGL canvases so we can prove the 3D layer mounted. */
async function canvasCount() {
  return page.evaluate(() => document.querySelectorAll('canvas').length)
}

async function clickText(sel, needle) {
  const h = await page.evaluateHandle(
    (s, n) => [...document.querySelectorAll(s)].find((el) => el.innerText.trim().includes(n)),
    sel,
    needle,
  )
  const el = h.asElement()
  if (!el) throw new Error(`no ${sel} containing "${needle}"`)
  await el.click()
}

/**
 * Clicks a nav link by dispatching on the element itself. Coordinate clicks can
 * land on the sticky header overlay instead of the link.
 */
async function clickNav(needle) {
  const ok = await page.evaluate((n) => {
    const a = [...document.querySelectorAll('nav.nav a')].find((el) =>
      el.innerText.trim().includes(n),
    )
    if (a) {
      a.click()
      return true
    }
    return false
  }, needle)
  if (!ok) throw new Error(`no nav link "${needle}"`)
}

async function waitFor(needle, timeout = 25000) {
  await page.waitForFunction(
    (n) => document.body.innerText.toUpperCase().includes(n.toUpperCase()),
    { timeout },
    needle,
  )
}

/** Types into a field the way a user would, which React handles correctly. */
async function fill(selector, value) {
  const el = await page.$(selector)
  if (!el) throw new Error(`no field matching ${selector}`)
  await el.click({ clickCount: 3 })
  await page.keyboard.press('Backspace')
  await el.type(value, { delay: 18 })
  await sleep(250)
}

/** Clicks the form's submit button (not a chip or tab). */
async function submit() {
  const ok = await page.evaluate(() => {
    const form = document.querySelector('form')
    const btn = form && form.querySelector('button.primary')
    if (btn) {
      btn.click()
      return true
    }
    return false
  })
  if (!ok) throw new Error('no submit button')
  return ok
}

try {
  // ---- login ----
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2500)
  console.log('login canvases: ' + (await canvasCount()))
  await shot('01-login')

  // switch biome to prove the 3D responds
  await clickText('button', 'Falls')
  await sleep(1200)
  await shot('02-login-waterfall')
  await clickText('button', 'Ocean')
  await sleep(1200)
  await shot('03-login-ocean')

  // ---- sign in ----
  await clickText('button', 'Traveller')
  await sleep(200)
  await submit()
  await waitFor('Hello,')
  await sleep(2600)
  console.log('dashboard canvases: ' + (await canvasCount()))
  await shot('04-dashboard')

  // ---- planner ----
  await clickNav('Plan a trip')
  await waitFor('Trip details')
  await fill('input[placeholder*="Manali"]', 'Manali')
  await sleep(1800)
  await shot('05-planner-input')

  await submit()
  await waitFor('Budget estimate', 60000)
  await sleep(2200)
  await shot('06-planner-result')

  // scroll to the day-by-day section
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h3')].find((h) => /day by day/i.test(h.innerText))
    if (el) el.scrollIntoView({ block: 'start' })
  })
  await shot('07-itinerary')

  await page.evaluate(() => window.scrollBy(0, 700))
  await shot('08-itinerary-scrolled')

  // ---- trip detail ----
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Open full trip/.test(x.innerText))
    if (b) b.click()
  })
  await waitFor('Itinerary', 25000).catch(() => {})
  await sleep(2000)
  await shot('09-trip-detail')

  // ---- hotels ----
  await clickNav('Hotels & transport')
  await page.waitForSelector('input[placeholder="City or destination"]', { timeout: 25000 })
  await fill('input[placeholder="City or destination"]', 'Goa')
  await sleep(500)
  await submit()
  await waitFor('per night', 40000)
  await sleep(1600)
  await shot('10-hotels')

  // ---- transport tab ----
  await clickText('button', 'Flights, trains & buses')
  await sleep(600)
  await submit()
  await waitFor('per person', 40000)
  await sleep(1500)
  await shot('11-transport')

  // ---- bookings ----
  await clickNav('My bookings')
  await waitFor('Total bookings')
  await sleep(1400)
  await shot('12-bookings')

  // ---- loans ----
  await clickNav('Travel loan')
  await waitFor('Travel loan')
  await sleep(1400)
  await shot('13-loans')

  // ---- expenses ----
  await clickNav('Expenses')
  await waitFor('Record an expense')
  await sleep(1600)
  await shot('14-expenses')

  // ---- profile ----
  await clickNav('Profile')
  await waitFor('Your profile')
  await sleep(1400)
  await shot('15-profile')

  // ---- admin, in an isolated context so it starts signed out at / ----
  console.log('--- admin pass ---')
  const ctx = await browser.createBrowserContext()
  const admin = await ctx.newPage()
  admin.on('pageerror', (e) => issues.push('admin pageerror: ' + e.message.slice(0, 200)))
  await admin.setViewport({ width: 1600, height: 1100 })
  await admin.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(1500)
  await admin.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(
      (x) => x.innerText.trim() === 'Administrator',
    )
    b?.click()
  })
  await sleep(300)
  await admin.evaluate(() => {
    document.querySelector('form')?.querySelector('button.primary')?.click()
  })
  await admin.waitForFunction(() => document.body.innerText.includes('Hello,'), { timeout: 25000 })
  await sleep(1800)
  await admin.evaluate(() => {
    const a = [...document.querySelectorAll('nav.nav a')].find((el) => el.innerText.includes('Admin'))
    a?.click()
  })
  await admin.waitForFunction(() => document.body.innerText.includes('Admin console'), { timeout: 25000 })
  await sleep(2000)
  await admin.screenshot({ path: `${OUT}\\16-admin.png` })
  console.log('  captured 16-admin')
  console.log('  admin canvases: ' + (await admin.evaluate(() => document.querySelectorAll('canvas').length)))

  // the other admin tabs
  await admin.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Bookings/.test(x.innerText))
    b?.click()
  })
  await sleep(1600)
  await admin.screenshot({ path: `${OUT}\\17-admin-bookings.png` })
  await admin.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Users/.test(x.innerText))
    b?.click()
  })
  await sleep(1600)
  await admin.screenshot({ path: `${OUT}\\18-admin-users.png` })
  console.log('  captured 17-18')
  await ctx.close()
} catch (err) {
  issues.push('script: ' + err.message)
  console.log('SCRIPT ERROR: ' + err.message)
  console.log('URL: ' + page.url())
  const here = await page.evaluate(() => document.body.innerText).catch(() => '')
  console.log('page text: ' + here.slice(0, 700).replace(/\n/g, ' / '))
  await page.screenshot({ path: `${OUT}\\error.png` }).catch(() => {})
}

await browser.close()

const real = issues.filter((i) => !/Failed to load resource.*404/.test(i))
console.log(`\n============ capture done, ${real.length} issue(s) ============`)
real.forEach((i) => console.log('  - ' + i))
