import localforage from 'localforage'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

// 判断当前是否处于 Electron 环境
const isElectron = typeof window !== 'undefined' && !!window.ipcRenderer

export async function getSettings() {
  if (isElectron) {
    return await window.ipcRenderer.invoke('get-settings')
  } else {
    return JSON.parse(localStorage.getItem('app_settings') || '{}')
  }
}

export async function saveSettings(settings: any) {
  if (isElectron) {
    return await window.ipcRenderer.invoke('save-settings', settings)
  } else {
    localStorage.setItem('app_settings', JSON.stringify(settings))
    return true
  }
}

export async function selectTemplateFile(): Promise<{ path: string; name: string; buffer: ArrayBuffer } | null> {
  if (isElectron) {
    const result = await window.ipcRenderer.invoke('select-file', {
      properties: ['openFile'],
      filters: [{ name: 'Word Documents', extensions: ['docx'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const path = result.filePaths[0]
      const buffer = await window.ipcRenderer.invoke('read-file', path)
      return { path, name: path, buffer }
    }
    return null
  } else {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      input.onchange = (e: any) => {
        const file = e.target.files[0]
        if (!file) return resolve(null)
        
        const reader = new FileReader()
        reader.onload = () => {
          resolve({ path: 'web-template', name: file.name, buffer: reader.result as ArrayBuffer })
        }
        reader.onerror = () => {
          console.error("Failed to read file in web")
          resolve(null)
        }
        reader.readAsArrayBuffer(file)
      }
      input.click()
    })
  }
}

export async function saveTemplateBuffer(buffer: ArrayBuffer) {
  if (!isElectron) {
    // Web 环境下，将模板的二进制数据存入 IndexedDB
    await localforage.setItem('web_template_buffer', buffer)
  }
}

export async function getTemplateBuffer(path: string): Promise<ArrayBuffer | null> {
  if (isElectron) {
    return await window.ipcRenderer.invoke('read-file', path)
  } else {
    return await localforage.getItem('web_template_buffer')
  }
}

export async function selectAndExtractTextFiles(): Promise<{name: string, content: string}[]> {
  if (isElectron) {
    const result = await window.ipcRenderer.invoke('select-file', {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Documents', extensions: ['txt', 'md', 'docx'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const files = []
      for (const path of result.filePaths) {
        const buffer = await window.ipcRenderer.invoke('read-file', path)
        const name = path.split('\\').pop()?.split('/').pop() || 'unknown'
        let content = ''
        if (name.endsWith('.docx')) {
          try {
            const zip = new PizZip(buffer)
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
            content = doc.getFullText()
          } catch(e) { console.error(e) }
        } else {
          content = new TextDecoder('utf-8').decode(buffer)
        }
        files.push({ name, content })
      }
      return files
    }
    return []
  } else {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = '.txt,.md,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      input.onchange = async (e: any) => {
        const files = e.target.files
        if (!files || files.length === 0) return resolve([])
        const result = []
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const buffer = await file.arrayBuffer()
          let content = ''
          if (file.name.endsWith('.docx')) {
            try {
              const zip = new PizZip(buffer)
              const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
              content = doc.getFullText()
            } catch(e) { console.error(e) }
          } else {
            content = new TextDecoder('utf-8').decode(buffer)
          }
          result.push({ name: file.name, content })
        }
        resolve(result)
      }
      input.click()
    })
  }
}

export async function saveGeneratedDocument(buffer: ArrayBuffer | Uint8Array, defaultName: string): Promise<boolean> {
  if (isElectron) {
    const result = await window.ipcRenderer.invoke('select-save-file', {
      title: '保存生成的文档',
      defaultPath: defaultName,
      filters: [{ name: 'Word Documents', extensions: ['docx'] }]
    })
    if (!result.canceled && result.filePath) {
      await window.ipcRenderer.invoke('save-file', {
        filePath: result.filePath,
        buffer: buffer
      })
      return true
    }
    return false
  } else {
    // Web 环境下通过创建 a 标签触发下载
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  }
}

// MCP / Tools Bridge
export async function connectMcpServer(id: string, command: string, args: string[]): Promise<boolean> {
  if (isElectron) {
    return await window.ipcRenderer.invoke('connect-mcp-server', { id, command, args })
  } else {
    console.warn('MCP Server is not supported in pure web environment.')
    return false
  }
}

export async function getMcpTools(id: string): Promise<any[]> {
  if (isElectron) {
    return await window.ipcRenderer.invoke('get-mcp-tools', id)
  } else {
    return []
  }
}

export async function callMcpTool(id: string, name: string, args: any): Promise<any> {
  if (isElectron) {
    return await window.ipcRenderer.invoke('call-mcp-tool', { id, name, args })
  } else {
    throw new Error('MCP tools are not available in web mode.')
  }
}

export async function disconnectMcpServer(id: string): Promise<boolean> {
  if (isElectron) {
    return await window.ipcRenderer.invoke('disconnect-mcp-server', id)
  }
  return true
}
