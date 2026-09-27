/* Isolates when R3F's "synchronously unmount a root" error fires. */
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 900 })

const t0 = Date.now()
const marks = []
page.on('console', (m) => {
  if (m.type() === 'error') marks.push([`${Date.now() - t0}ms`, m.text().slice(0, 90)])
})
page.on('pageerror', (e) => marks.push([`${Date.now() - t0}ms`, 'PAGEERROR ' + e.message.slice(0, 90)]))

await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
const step = async (label, fn) => {
  await fn()
  await new Promise((r) => setTimeout(r, 900))
  console.log(`-- after ${label}: ${marks.length} errors`)
}

await step('load', async () => {})
await step('3s idle', async () => new Promise((r) => setTimeout(r, 2500)))
await step('scroll to architecture', async () => {
  await page.evaluate(() => document.getElementById('architecture')?.scrollIntoView())
})
await step('scroll to modules', async () => {
  await page.evaluate(() => document.getElementById('modules')?.scrollIntoView())
})
await step('click a module card', async () => {
  await page.evaluate(() => document.querySelector('.mod')?.click())
})

console.log('\nTIMELINE')
marks.forEach(([t, m]) => console.log(t, m))
await browser.close()

