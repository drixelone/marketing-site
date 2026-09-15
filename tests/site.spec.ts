import { test, expect, type Page } from '@playwright/test'

for (const [name, width, height] of [['desktop', 1536, 1024], ['mobile', 390, 844], ['small-mobile', 320, 640], ['laptop', 1366, 768], ['short-desktop', 1280, 600], ['landscape', 844, 390], ['small-landscape', 667, 375]] as const) {
  test(`${name}: layout, assets and rendering`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.locator('.ribbon-fallback')).toHaveClass(/is-hidden/)
    await page.waitForTimeout(1200)
    await expect(page.getByRole('heading', { name: 'Coming soon.' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
    const footer = await page.locator('footer').boundingBox()
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(height + 1)
    expect(await page.locator('.logo img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    const heading = await page.locator('.supporting').boundingBox()
    const ribbon = await page.locator('.ribbon-stage').boundingBox()
    expect(ribbon!.y).toBeGreaterThan(heading!.y + heading!.height)
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true })
    expect(errors).toEqual([])
  })
}
test('motion, cursor response, reduced motion, visibility and context loss', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  await expect(page.locator('.ribbon-fallback')).toHaveClass(/is-hidden/)
  const canvas = page.locator('canvas')
  const first = await canvas.screenshot()
  await page.mouse.move(1100, 400)
  await page.waitForTimeout(600)
  expect((await canvas.screenshot()).equals(first)).toBe(false)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(600)
  const still = await canvas.screenshot()
  await page.mouse.move(100, 100)
  await page.waitForTimeout(600)
  expect(await changedPixels(page, still, await canvas.screenshot())).toBe(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.waitForTimeout(200)
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.ribbon-stage')).toHaveAttribute('data-visible', 'false')
  const paused = await canvas.screenshot()
  await page.waitForTimeout(300)
  expect(await changedPixels(page, paused, await canvas.screenshot())).toBe(0)
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.ribbon-stage')).toHaveAttribute('data-visible', 'true')
  await page.waitForTimeout(300)
  expect((await canvas.screenshot()).equals(paused)).toBe(false)
  await canvas.evaluate((node: HTMLCanvasElement) => node.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext())
  await expect(page.locator('.ribbon-fallback')).not.toHaveClass(/is-hidden/)
})
test('WebGL unavailable: static ribbon and accessible copy', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: unknown[]) {
      if (type.includes('webgl')) return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.ribbon-fallback')).toBeVisible()
  expect(await page.locator('.ribbon-fallback').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(8)
  await expect(page.getByRole('heading')).toHaveText('Coming soon.')
})

// Ignore sub-perceptual GPU color rounding; any channel change >2 still fails.
async function changedPixels(page: Page, first: Buffer, second: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const read = async (src: string) => {
      const img = new Image(); img.src = src; await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data
    }
    const x = await read(a), y = await read(b)
    let changed = 0
    for (let i = 0; i < x.length; i += 4) {
      if ([0, 1, 2, 3].some(channel => Math.abs(x[i + channel] - y[i + channel]) > 2)) changed++
    }
    return changed
  }, [first, second].map(buffer => 'data:image/png;base64,' + buffer.toString('base64')))
}
