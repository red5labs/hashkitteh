import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  hashcat: {
    checkBinary: (path: string) => ipcRenderer.invoke('hashcat:check-binary', path),
    start: (args: string[], hashcatPath: string) => ipcRenderer.invoke('hashcat:start', args, hashcatPath),
    stop: () => ipcRenderer.invoke('hashcat:stop'),
    pause: () => ipcRenderer.invoke('hashcat:pause'),
    resume: () => ipcRenderer.invoke('hashcat:resume'),
    readPotfile: (hashcatPath: string) => ipcRenderer.invoke('hashcat:read-potfile', hashcatPath),
    clearPotfile: (hashcatPath: string) => ipcRenderer.invoke('hashcat:clear-potfile', hashcatPath),
    onOutput: (callback: (data: string) => void) => {
      ipcRenderer.on('hashcat:output', (_event, data) => callback(data))
    },
    onError: (callback: (data: string) => void) => {
      ipcRenderer.on('hashcat:error', (_event, data) => callback(data))
    },
    onExit: (callback: (code: number | null) => void) => {
      ipcRenderer.on('hashcat:exit', (_event, code) => callback(code))
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    },
  },
  dialog: {
    openFile: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:open-file', options),
    openDirectory: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:open-file', { ...options, properties: ['openDirectory'] }),
    saveFile: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('dialog:save-file', options),
  },
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
    createTempFile: (content: string, extension?: string) => ipcRenderer.invoke('fs:create-temp-file', content, extension),
  },
})

declare global {
  interface Window {
    electronAPI: {
      hashcat: {
        checkBinary: (path: string) => Promise<boolean>
        start: (args: string[], hashcatPath: string) => Promise<{ success: boolean; error?: string }>
        stop: () => Promise<{ success: boolean; error?: string }>
        pause: () => Promise<{ success: boolean; error?: string }>
        resume: () => Promise<{ success: boolean; error?: string }>
        readPotfile: (hashcatPath: string) => Promise<{ success: boolean; content?: string; error?: string }>
        clearPotfile: (hashcatPath: string) => Promise<{ success: boolean; message?: string; error?: string }>
        onOutput: (callback: (data: string) => void) => void
        onError: (callback: (data: string) => void) => void
        onExit: (callback: (code: number | null) => void) => void
        removeAllListeners: (channel: string) => void
      }
      dialog: {
        openFile: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
        openDirectory: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
        saveFile: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
      }
      fs: {
        readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
        createTempFile: (content: string, extension?: string) => Promise<{ success: boolean; path?: string; error?: string }>
      }
    }
  }
}

