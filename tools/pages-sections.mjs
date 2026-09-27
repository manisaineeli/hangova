/**
 * Confirms every section of the published presentation actually rendered,
 * rather than assuming a mounted root means the page is fine.
 */
import puppeteer from 'puppeteer-core'

const URL = process.argv[2] || 'https://manisaineeli.github.io/hangova/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const problems = []
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message.slice(0, 200)))
page.on('console', (m) => {
  if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 200))
})

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
await sleep(8000)

// walk the page so scroll-linked reveals and lazy sections mount
const height = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < height; y += 700) {
  await page.evaluate((v) => window.scrollTo(0, v), y)
  await sleep(220)
}
await sleep(2500)

const sections = await page.evaluate(() =>
  [...document.querySelectorAll('section[id]')].map((s) => ({
    id: s.id,
    height: Math.round(s.getBoundingClientRect().height),
    text: (s.innerText || '').trim().slice(0, 60).replace(/\n/g, ' | '),
  })),
)

console.log('sections found:', sections.length)
let bad = 0
for (const s of sections) {
  const empty = s.height < 40 || s.text.length < 3
  if (empty) bad++
  console.log(`  ${empty ? 'EMPTY' : ' ok  '}  #${s.id.padEnd(13)} h=${String(s.height).padStart(5)}  ${s.text}`)
}

await page.screenshot({ path: 'C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\shots\\pages-full.png', fullPage: false })
console.log('canvases:', await page.evaluate(() => document.querySelectorAll('canvas').length))
console.log('empty sections:', bad)
console.log('errors:', problems.length)
problems.slice(0, 5).forEach((p) => console.log('  -', p))

await browser.close()
