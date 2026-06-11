// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("desktopApi", {
  captureScreen: (name) => ipcRenderer.invoke("desktop:capture", name),
  selectFiles: () => ipcRenderer.invoke("system:select-files"),
  saveTextFile: (payload) => ipcRenderer.invoke("system:save-text", payload),
  getRuntime: () => ipcRenderer.invoke("system:get-runtime")
});
