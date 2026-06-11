import { desktopCapturer, screen, app } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type ScreenshotResult = {
  filePath: string
  width: number
  height: number
  capturedAt: string
}

export function sanitizeCaptureName(name?: string) {
  return (name || 'manual-capture').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
}

export function resolveCapturePath(name?: string) {
  const stem = sanitizeCaptureName(name)
  const dir = path.join(app.getPath('userData') || os.tmpdir(), 'captures')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${stem}-${Date.now()}.png`)
}

export async function capturePrimaryScreen(name?: string): Promise<ScreenshotResult> {
  const primary = screen.getPrimaryDisplay()
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: primary.size.width,
      height: primary.size.height,
    },
  })

  const source = sources[0]
  if (!source) {
    throw new Error('未获取到可用屏幕源')
  }

  const filePath = resolveCapturePath(name)
  fs.writeFileSync(filePath, source.thumbnail.toPNG())

  return {
    filePath,
    width: source.thumbnail.getSize().width,
    height: source.thumbnail.getSize().height,
    capturedAt: new Date().toISOString(),
  }
}
