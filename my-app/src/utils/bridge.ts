import localforage from 'localforage'

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
      input.accept = '.docx'
      input.onchange = async (e: any) => {
        const file = e.target.files[0]
        if (!file) return resolve(null)
        const arrayBuffer = await file.arrayBuffer()
        resolve({ path: 'web-template', name: file.name, buffer: arrayBuffer })
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
