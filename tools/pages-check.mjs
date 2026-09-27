/**
 * Loads the published presentation in a real browser and reports what happens,
 * so "it is not working" can be traced to an actual cause rather than guessed.
 */
import puppeteer from 'puppeteer-core'

const URL = process.argv[2] || 'https://manisaineeli.github.io/hangova/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=swiftshader',
  ],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()

const problems = []
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message.slice(0, 220)))
page.on('console', (m) => {
  if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 220))
})
page.on('requestfailed', (r) =>
  problems.push(`requestfailed: ${r.url().slice(0, 100)} ${r.failure()?.errorText}`),
)
page.on('response', (r) => {
  if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url().slice(0, 100)}`)
})

const t0 = Date.now()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
console.log('dom ready in', Date.now() - t0, 'ms')

// wait for the app to actually mount something
await sleep(9000)

const info = await page.evaluate(() => {
  const root = document.getElementById('root')
  return {
    title: document.title,
    rootChildren: root ? root.children.length : -1,
    canvases: document.querySelectorAll('canvas').length,
    bodyText: document.body.innerText.slice(0, 260).replace(/\n/g, ' | '),
    hasBoot: !!document.getElementById('boot'),
    bootClass: document.getElementById('boot')?.className || '(none)',
    mainTag: !!document.querySelector('main'),
    height: document.body.scrollHeight,
  }
})

console.log('title        :', info.title)
console.log('root children:', info.rootChildren)
console.log('canvases     :', info.canvases)
console.log('boot splash  :', info.hasBoot, '/', info.bootClass)
console.log('body height  :', info.height)
console.log('text         :', info.bodyText || '(empty)')

await page.screenshot({ path: 'C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\shots\\pages-check.png' })

console.log('\nproblems:', problems.length)
problems.slice(0, 8).forEach((p) => console.log('  -', p))

await browser.close()
