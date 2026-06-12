import { ipcRenderer, contextBridge } from 'electron'

// We are using nodeIntegration: true and contextIsolation: false for simplicity in this local tool,
// but let's provide a safe bridge if needed, or just let renderer use ipcRenderer directly.
// Since contextIsolation is false, we can just attach it to window.
window.ipcRenderer = ipcRenderer
