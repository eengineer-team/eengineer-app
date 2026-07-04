import { chromium } from 'playwright'

const browser = await chromium.launch({ args: ['--no-sandbox'] })

// Desktop
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } })
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
await page.goto('http://localhost:5184/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=The people behind it.')
await page.locator('text=The people behind it.').scrollIntoViewIfNeeded()
await page.screenshot({ path: 'C:/Users/user/AppData/Local/Temp/claude/C--Users-user-Desktop-eengineer-app/829871d7-c044-41f3-8340-f6e1b0a0f649/scratchpad/team-desktop.png', fullPage: false })

// Mobile
const mpage = await browser.newPage({ viewport: { width: 375, height: 1200 } })
await mpage.goto('http://localhost:5184/', { waitUntil: 'networkidle' })
await mpage.waitForSelector('text=The people behind it.')
await mpage.locator('text=The people behind it.').scrollIntoViewIfNeeded()
await mpage.screenshot({ path: 'C:/Users/user/AppData/Local/Temp/claude/C--Users-user-Desktop-eengineer-app/829871d7-c044-41f3-8340-f6e1b0a0f649/scratchpad/team-mobile.png' })

console.log('console errors:', errors)
await browser.close()
