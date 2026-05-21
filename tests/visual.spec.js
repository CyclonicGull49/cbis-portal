import { expect, test } from '@playwright/test'

test.describe('CBIS+ visual smoke', () => {
  test('login renders without layout overflow', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar al portal' })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(hasHorizontalOverflow).toBe(false)

    const viewport = page.viewportSize()
    if (viewport && viewport.width >= 900) {
      const hasVerticalOverflow = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1)
      expect(hasVerticalOverflow).toBe(false)
    }
  })

  test('protected routes keep unauthenticated users at login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  })
})
