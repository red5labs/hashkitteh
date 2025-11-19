import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir, homedir } from 'os'

let mainWindow: BrowserWindow | null = null
let hashcatProcess: ChildProcess | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Disable sandbox to avoid CSP issues in dev
      webSecurity: true,
    },
    backgroundColor: '#111827',
    titleBarStyle: 'default',
  })

  // In development, load from Vite dev server
  // In production, load from built files
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    // Use VITE_DEV_SERVER_URL if set, otherwise use default port
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    console.log('Loading dev server:', devUrl)
    
    // Wait a moment for Vite server to be fully ready, then load
    setTimeout(() => {
      mainWindow.loadURL(devUrl).catch((err) => {
        console.error('Failed to load URL:', err)
        // Retry after a short delay
        setTimeout(() => {
          mainWindow.loadURL(devUrl).catch((retryErr) => {
            console.error('Retry also failed:', retryErr)
          })
        }, 1000)
      })
    }, 500)
    
    // DevTools can be opened manually with Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (macOS)
    // mainWindow.webContents.openDevTools()
    
    // Log any navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', errorCode, errorDescription, validatedURL)
    })
  } else {
    // Production: load from dist/
    const prodPath = join(__dirname, '../../dist/index.html')
    console.log('Loading production file:', prodPath)
    mainWindow.loadFile(prodPath)
  }
}

app.whenReady().then(() => {
  // electron-vite starts the Vite server before calling this
  // Just create the window - it will load from the dev server
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (hashcatProcess) {
    hashcatProcess.kill()
    hashcatProcess = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('hashcat:check-binary', async (_, path: string) => {
  return existsSync(path)
})

ipcMain.handle('hashcat:start', async (_, args: string[], hashcatPath: string) => {
  if (hashcatProcess) {
    return { success: false, error: 'Hashcat process already running' }
  }

  return new Promise((resolve) => {
    try {
      console.log('Spawning hashcat:', hashcatPath, 'with args:', args)
      
      // On Windows, hashcat might need to be run from its directory
      // Try to get the directory of the hashcat executable
      const path = require('path')
      const hashcatDir = path.dirname(hashcatPath)
      const hashcatExe = path.basename(hashcatPath)
      
      console.log('Hashcat directory:', hashcatDir)
      console.log('Hashcat executable:', hashcatExe)
      
      hashcatProcess = spawn(hashcatExe, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        cwd: hashcatDir, // Set working directory to hashcat's directory
        env: { ...process.env }, // Pass through environment variables
      })

      // Log process errors (spawn errors, not hashcat errors)
      hashcatProcess.on('error', (error) => {
        console.error('Hashcat process spawn error:', error)
        mainWindow?.webContents.send('hashcat:error', `Failed to start hashcat: ${error.message}\n\nPossible causes:\n- Hashcat binary not found\n- Missing dependencies (OpenCL runtime)\n- Invalid hashcat installation`)
        hashcatProcess = null
        resolve({ success: false, error: `Failed to start: ${error.message}` })
      })

      // Collect all stderr output to check for fatal errors
      let stderrBuffer = ''
      
      hashcatProcess.stdout?.on('data', (data) => {
        const output = data.toString()
        console.log('Hashcat stdout:', output)
        mainWindow?.webContents.send('hashcat:output', output)
      })

      hashcatProcess.stderr?.on('data', (data) => {
        const error = data.toString()
        stderrBuffer += error
        console.log('Hashcat stderr:', error)
        mainWindow?.webContents.send('hashcat:error', error)
      })

      hashcatProcess.on('exit', (code, signal) => {
        console.log('Hashcat process exited:', { code, signal })
        
        // If exit code is -1 or error, provide helpful message
        if (code !== 0 && code !== null) {
          const signedCode = code > 2147483647 ? code - 4294967296 : code
          console.error('Hashcat exited with error code:', signedCode)
          console.error('Stderr output:', stderrBuffer)
          
          // Send a helpful error message
          if (stderrBuffer.includes('OpenCL') && !args.includes('--force')) {
            mainWindow?.webContents.send('hashcat:error', 
              'Hashcat failed: OpenCL error. Try enabling "Force CPU-Only Mode" in Attack Config.'
            )
          } else if (stderrBuffer) {
            mainWindow?.webContents.send('hashcat:error', 
              `Hashcat failed with exit code ${signedCode}. Check console output for details.`
            )
          }
        }
        
        mainWindow?.webContents.send('hashcat:exit', code)
        hashcatProcess = null
      })

      resolve({ success: true })
    } catch (error) {
      console.error('Failed to spawn hashcat:', error)
      resolve({ success: false, error: String(error) })
    }
  })
})

ipcMain.handle('hashcat:stop', async () => {
  if (hashcatProcess) {
    hashcatProcess.kill('SIGTERM')
    hashcatProcess = null
    return { success: true }
  }
  return { success: false, error: 'No process running' }
})

ipcMain.handle('hashcat:pause', async () => {
  if (hashcatProcess) {
    hashcatProcess.kill('SIGSTOP')
    return { success: true }
  }
  return { success: false, error: 'No process running' }
})

ipcMain.handle('hashcat:resume', async () => {
  if (hashcatProcess) {
    hashcatProcess.kill('SIGCONT')
    return { success: true }
  }
  return { success: false, error: 'No process running' }
})

ipcMain.handle('dialog:open-file', async (_, options: Electron.OpenDialogOptions) => {
  if (!mainWindow) return { canceled: true }
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('dialog:save-file', async (_, options: Electron.SaveDialogOptions) => {
  if (!mainWindow) return { canceled: true }
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('fs:read-file', async (_, filePath: string) => {
  const fs = await import('fs/promises')
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('fs:write-file', async (_, filePath: string, content: string) => {
  const fs = await import('fs/promises')
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('fs:create-temp-file', async (_, content: string, extension: string = 'txt') => {
  const fs = await import('fs/promises')
  const path = await import('path')
  try {
    const tempPath = join(tmpdir(), `hashcat-${Date.now()}.${extension}`)
    await fs.writeFile(tempPath, content, 'utf-8')
    return { success: true, path: tempPath }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('hashcat:read-potfile', async (_, hashcatPath: string) => {
  try {
    // Hashcat potfile is usually in the same directory as hashcat.exe
    const path = require('path')
    const hashcatDir = path.dirname(hashcatPath)
    const potfilePath = join(hashcatDir, 'hashcat.potfile')
    
    console.log('Reading potfile from:', potfilePath)
    
    if (existsSync(potfilePath)) {
      const content = readFileSync(potfilePath, 'utf-8')
      console.log('Potfile content length:', content.length)
      return { success: true, content }
    } else {
      console.log('Potfile not found at:', potfilePath)
      return { success: false, error: 'Potfile not found' }
    }
  } catch (error) {
    console.error('Error reading potfile:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('hashcat:clear-potfile', async (_, hashcatPath: string) => {
  try {
    // Hashcat potfile is usually in the same directory as hashcat.exe
    const path = require('path')
    const hashcatDir = path.dirname(hashcatPath)
    const potfilePath = join(hashcatDir, 'hashcat.potfile')
    
    console.log('Clearing potfile at:', potfilePath)
    
    if (existsSync(potfilePath)) {
      // Write empty string to clear the potfile (preserves the file)
      writeFileSync(potfilePath, '', 'utf-8')
      console.log('Potfile cleared successfully')
      return { success: true }
    } else {
      // Potfile doesn't exist, which is fine - nothing to clear
      console.log('Potfile not found, nothing to clear')
      return { success: true, message: 'Potfile does not exist' }
    }
  } catch (error) {
    console.error('Error clearing potfile:', error)
    return { success: false, error: String(error) }
  }
})

