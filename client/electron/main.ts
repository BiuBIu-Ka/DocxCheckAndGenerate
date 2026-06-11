import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { capturePrimaryScreen } from './services/screenshot-service'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = !app.isPackaged
const rendererUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://127.0.0.1:5173'

function resolveHtmlPath() {
  return path.resolve(__dirname, '../dist/index.html')
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 1200,
    minHeight: 780,
    backgroundColor: '#0b1020',
    title: '军工软件文档智能编制与审查平台',
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.resolve(__dirname, './preload.js'),
    },
  })

  if (isDev) {
    await mainWindow.loadURL(rendererUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(resolveHtmlPath())
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function registerIpcHandlers() {
  ipcMain.handle('desktop:capture', async (_event, name?: string) => {
    return capturePrimaryScreen(name)
  })

  ipcMain.handle('system:select-files', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择文档或截图',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '文档与图片', extensions: ['doc', 'docx', 'pdf', 'md', 'png', 'jpg', 'jpeg'] },
      ],
    })

    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('system:save-text', async (_event, payload: { title: string; defaultPath: string; content: string }) => {
    const result = await dialog.showSaveDialog({
      title: payload.title,
      defaultPath: payload.defaultPath,
    })

    if (result.canceled || !result.filePath) {
      return { saved: false }
    }

    await import('node:fs/promises').then(({ writeFile }) => writeFile(result.filePath!, payload.content, 'utf-8'))
    return { saved: true, filePath: result.filePath }
  })

  ipcMain.handle('system:get-runtime', () => ({
    apiBaseUrl: 'http://127.0.0.1:8000/api',
    mode: isDev ? 'development' : 'production',
  }))
}

app.whenReady().then(async () => {
  registerIpcHandlers()
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
