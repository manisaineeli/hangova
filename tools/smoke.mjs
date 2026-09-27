/* Headless smoke-test: loads the app, captures console/page errors,
   waits for WebGL, and screenshots given scroll positions. */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.argv[2] || 'http://localhost:5173/'
const OUT = process.argv[3] || 'C:\\Users\\ganes\\AppData\\Local\\Temp\\opencode\\shots'
const SHOTS = (process.argv[4] || '0,0.12,0.25,0.37,0.5,0.62,0.75,0.88')
  .split(',')
  .map(Number)

fs.mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1600,1000',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })

const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`))
page.on('requestfailed', (r) => logs.push(`[REQFAIL] ${r.url()} ${r.failure()?.errorText}`))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3500))

const diag = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  const gl = c && (c.getContext('webgl2') || c.getContext('webgl'))
  return {
    canvas: !!c,
    size: c ? [c.width, c.height] : null,
    glVendor: gl ? gl.getParameter(gl.VERSION) : null,
    sections: [...document.querySelectorAll('main section')].map((s) => s.id),
    docH: document.documentElement.scrollHeight,
    bootGone: document.getElementById('boot')?.classList.contains('gone'),
  }
})
console.log('DIAG', JSON.stringify(diag, null, 2))

for (const s of SHOTS) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, max * f)
  }, s)
  await new Promise((r) => setTimeout(r, 2200))
  const name = `shot-${String(Math.round(s * 100)).padStart(3, '0')}.png`
  await page.screenshot({ path: path.join(OUT, name) })
  console.log('shot ->', name)
}

console.log('\n=== CONSOLE (' + logs.length + ') ===')
console.log(logs.slice(0, 60).join('\n') || '(clean)')

await browser.close()
