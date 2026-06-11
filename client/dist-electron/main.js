// electron/main.ts
import { app as app2, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { fileURLToPath } from "node:url";
import path2 from "node:path";

// electron/services/screenshot-service.ts
import { desktopCapturer, screen, app } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function sanitizeCaptureName(name) {
  return (name || "manual-capture").replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
}
function resolveCapturePath(name) {
  const stem = sanitizeCaptureName(name);
  const dir = path.join(app.getPath("userData") || os.tmpdir(), "captures");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${stem}-${Date.now()}.png`);
}
async function capturePrimaryScreen(name) {
  const primary = screen.getPrimaryDisplay();
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: primary.size.width,
      height: primary.size.height
    }
  });
  const source = sources[0];
  if (!source) {
    throw new Error("\u672A\u83B7\u53D6\u5230\u53EF\u7528\u5C4F\u5E55\u6E90");
  }
  const filePath = resolveCapturePath(name);
  fs.writeFileSync(filePath, source.thumbnail.toPNG());
  return {
    filePath,
    width: source.thumbnail.getSize().width,
    height: source.thumbnail.getSize().height,
    capturedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var isDev = !app2.isPackaged;
var rendererUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
function resolveHtmlPath() {
  return path2.resolve(__dirname, "../dist/index.html");
}
async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 1200,
    minHeight: 780,
    backgroundColor: "#0b1020",
    title: "\u519B\u5DE5\u8F6F\u4EF6\u6587\u6863\u667A\u80FD\u7F16\u5236\u4E0E\u5BA1\u67E5\u5E73\u53F0",
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path2.resolve(__dirname, "./preload.js")
    }
  });
  if (isDev) {
    await mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(resolveHtmlPath());
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}
function registerIpcHandlers() {
  ipcMain.handle("desktop:capture", async (_event, name) => {
    return capturePrimaryScreen(name);
  });
  ipcMain.handle("system:select-files", async () => {
    const result = await dialog.showOpenDialog({
      title: "\u9009\u62E9\u6587\u6863\u6216\u622A\u56FE",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "\u6587\u6863\u4E0E\u56FE\u7247", extensions: ["doc", "docx", "pdf", "md", "png", "jpg", "jpeg"] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });
  ipcMain.handle("system:save-text", async (_event, payload) => {
    const result = await dialog.showSaveDialog({
      title: payload.title,
      defaultPath: payload.defaultPath
    });
    if (result.canceled || !result.filePath) {
      return { saved: false };
    }
    await import("node:fs/promises").then(({ writeFile }) => writeFile(result.filePath, payload.content, "utf-8"));
    return { saved: true, filePath: result.filePath };
  });
  ipcMain.handle("system:get-runtime", () => ({
    apiBaseUrl: "http://127.0.0.1:8000/api",
    mode: isDev ? "development" : "production"
  }));
}
app2.whenReady().then(async () => {
  registerIpcHandlers();
  await createWindow();
  app2.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});
app2.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app2.quit();
  }
});
