import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import Store from 'electron-store'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const store = new Store()

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: false, // We'll use nodeIntegration in this tool for simplicity since it's local
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
})

// IPC Handlers for Settings
ipcMain.handle('get-settings', () => {
  return store.store
})

ipcMain.handle('save-settings', (_, settings) => {
  store.set(settings)
  return true
})

// IPC Handlers for File System
ipcMain.handle('select-file', async (_, options) => {
  const result = await dialog.showOpenDialog(win!, options)
  return result
})

ipcMain.handle('select-save-file', async (_, options) => {
  const result = await dialog.showSaveDialog(win!, options)
  return result
})

ipcMain.handle('read-file', (_, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)
    return buffer
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
})

ipcMain.handle('save-file', (_, { filePath, buffer }) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return true
  } catch (error: any) {
    throw new Error(`Failed to save file: ${error.message}`)
  }
})

// MCP Handlers
const activeMcpClients: Record<string, Client> = {}

ipcMain.handle('connect-mcp-server', async (_, { id, command, args }) => {
  try {
    if (activeMcpClients[id]) {
      await activeMcpClients[id].close()
      delete activeMcpClients[id]
    }
    const transport = new StdioClientTransport({ command, args })
    const client = new Client(
      { name: "my-app-mcp-client", version: "1.0.0" },
      { capabilities: { tools: {} } }
    )
    await client.connect(transport)
    activeMcpClients[id] = client
    return true
  } catch (error: any) {
    throw new Error(`Failed to connect MCP server: ${error.message}`)
  }
})

ipcMain.handle('get-mcp-tools', async (_, id) => {
  const client = activeMcpClients[id]
  if (!client) throw new Error(`MCP server ${id} not connected`)
  const response = await client.listTools()
  return response.tools
})

ipcMain.handle('call-mcp-tool', async (_, { id, name, args }) => {
  const client = activeMcpClients[id]
  if (!client) throw new Error(`MCP server ${id} not connected`)
  const response = await client.callTool({ name, arguments: args })
  return response
})

ipcMain.handle('disconnect-mcp-server', async (_, id) => {
  if (activeMcpClients[id]) {
    await activeMcpClients[id].close()
    delete activeMcpClients[id]
  }
  return true
})
