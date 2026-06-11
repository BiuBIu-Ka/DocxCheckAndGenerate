import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktopApi', {
  captureScreen: (name?: string) => ipcRenderer.invoke('desktop:capture', name),
  selectFiles: () => ipcRenderer.invoke('system:select-files'),
  saveTextFile: (payload: { title: string; defaultPath: string; content: string }) => ipcRenderer.invoke('system:save-text', payload),
  getRuntime: () => ipcRenderer.invoke('system:get-runtime'),
})
