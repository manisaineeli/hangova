import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000 })
await page.evaluateOnNewDocument(() => { window.__wmDebug = true });
await page.goto(URL, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 3000))

const info = await page.evaluate(() => {
  const slot = document.getElementById('globe-slot')
  const r = slot ? slot.getBoundingClientRect() : null
  const canvas = document.querySelector('.stage canvas')
  const cr = canvas ? canvas.getBoundingClientRect() : null
  return {
    slotRect: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    canvasRect: cr && { w: Math.round(cr.width), h: Math.round(cr.height) },
    canvasAttr: canvas && { w: canvas.width, h: canvas.height },
    dpr: window.devicePixelRatio,
    computedSlot: slot && (() => {
      const s = getComputedStyle(slot)
      return { display: s.display, height: s.height, width: s.width, minHeight: s.minHeight }
    })(),
    // expected globe pixel diameter
    expected: (() => {
      if (!r) return null
      const wpp = (2 * Math.tan((42 * Math.PI) / 360)) / (cr?.height || 1000)
      const localSize = 1.5 * 2 * 1.62
      return { wpp, scale: (Math.min(r.width, r.height) * wpp) / localSize }
    })(),
  }
})
console.log(JSON.stringify(info, null, 2))
const dbg = await page.evaluate(() => window.__wmDbg)
console.log('RUNTIME', JSON.stringify(dbg))
await browser.close()

