export function useDesktopBridge() {
  const desktopApi = window.desktopApi

  return {
    available: Boolean(desktopApi),
    captureScreen: (name?: string) => desktopApi?.captureScreen(name),
    selectFiles: () => desktopApi?.selectFiles() ?? Promise.resolve([]),
    saveTextFile: (payload: { title: string; defaultPath: string; content: string }) =>
      desktopApi?.saveTextFile(payload) ?? Promise.resolve({ saved: false }),
    getRuntime: () =>
      desktopApi?.getRuntime() ?? Promise.resolve({ apiBaseUrl: '/api', mode: 'browser' }),
  }
}
