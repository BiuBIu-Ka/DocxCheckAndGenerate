import type { ScreenshotResult } from '@/types/platform'

declare global {
  interface Window {
    desktopApi?: {
      captureScreen: (name?: string) => Promise<ScreenshotResult>
      selectFiles: () => Promise<string[]>
      saveTextFile: (payload: { title: string; defaultPath: string; content: string }) => Promise<{ saved: boolean; filePath?: string }>
      getRuntime: () => Promise<{ apiBaseUrl: string; mode: string }>
    }
  }
}

export {}
