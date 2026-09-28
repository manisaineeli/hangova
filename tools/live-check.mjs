/**
 * Loads a URL in a real browser and reports what the visitor would actually
 * see: what rendered, any Cloudflare interstitial, and every failed request.
 */
import puppeteer from 'puppeteer-core'

const URL = process.argv[2]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  defaultViewport: { width: 1400, height: 900 },
})
const page = await browser.newPage()

const bad = []
page.on('response', (r) => {
  if (r.status() >= 400) bad.push(`HTTP ${r.status()}  ${r.url().slice(0, 90)}`)
})
page.on('pageerror', (e) => bad.push('JS ERROR: ' + e.message.slice(0, 140)))
page.on('console', (m) => {
  if (m.type() === 'error') bad.push('console: ' + m.text().slice(0, 140))
})

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
await sleep(9000)

const view = await page.evaluate(() => ({
  title: document.title,
  rootKids: document.getElementById('root')?.children.length ?? -1,
  canvases: document.querySelectorAll('canvas').length,
  height: document.body.scrollHeight,
  text: document.body.innerText.slice(0, 200).replace(/\s+/g, ' '),
  cloudflareChallenge: /just a moment|checking your browser|challenge-platform|cf-browser-verification/i.test(
    document.body.innerText + document.title,
  ),
  // a Cloudflare block often renders its own page instead of the app
  looksLikeBlock:
    /enable javascript and cookies|attention required|cloudflare ray id|access denied/i.test(
      document.body.innerText,
    ),
}))

console.log('url              :', URL)
console.log('title            :', view.title)
console.log('root children    :', view.rootKids)
console.log('canvases         :', view.canvases)
console.log('page height      :', view.height)
console.log('cloudflare block :', view.looksLikeBlock || view.cloudflareChallenge)
console.log('visible text     :', view.text || '(nothing rendered)')

console.log('\nfailed requests / errors:', bad.length)
bad.slice(0, 6).forEach((b) => console.log('  -', b))

const out = URL.includes('trycloudflare') ? 'tunnel' : 'pages'
await page.screenshot({ path: `C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\shots\\live-${out}.png` })
await browser.close()
