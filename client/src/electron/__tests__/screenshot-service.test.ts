import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/app-data' },
  desktopCapturer: {},
  screen: {},
}))

describe('screenshot service helpers', async () => {
  const { sanitizeCaptureName, resolveCapturePath } = await import('../../../electron/services/screenshot-service')

  it('sanitizes capture names', () => {
    expect(sanitizeCaptureName('Manual Capture 01')).toBe('manual-capture-01')
  })

  it('resolves capture file path', () => {
    const result = resolveCapturePath('步骤1')
    expect(result).toContain('/tmp/app-data/captures/')
    expect(result).toMatch(/\.png$/)
  })
})
