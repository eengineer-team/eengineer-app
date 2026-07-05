import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = 'C:/Users/user/AppData/Local/Temp/claude/C--Users-user-Desktop-eengineer-app/41978499-88bc-460c-a277-d729c1a18357/scratchpad'
const BREAKPOINTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
]

const browser = await chromium.launch({ args: ['--no-sandbox'] })

for (const bp of BREAKPOINTS) {
  const page = await browser.newPage({ viewport: { width: bp.width, height: bp.height } })
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.setItem('ee_session', JSON.stringify({
      provider: 'github', status: 'builder', name: 'GitHub Builder', role: 'builder',
    }))
  })
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }))
  console.log(`dashboard-home @ ${bp.name}:`, JSON.stringify(metrics))
  await page.screenshot({ path: `${OUT}/step3-dashboard-home-${bp.name}.png`, fullPage: true })
  await page.close()
}

await browser.close()
console.log('DONE')
