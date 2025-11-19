import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, Square, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { buildHashcatArgs } from '@/utils/hashcatRunner'
import { parseHashcatOutput, parseCrackedLine } from '@/utils/hashcatRunner'

export function ExecutionMonitor() {
  // Use selectors to prevent unnecessary re-renders
  const currentConfig = useAppStore((state) => state.currentConfig)
  const currentProgress = useAppStore((state) => state.currentProgress)
  const settings = useAppStore((state) => state.settings)
  const currentResults = useAppStore((state) => state.currentResults)
  const updateProgress = useAppStore((state) => state.updateProgress)
  const addResult = useAppStore((state) => state.addResult)
  const saveSession = useAppStore((state) => state.saveSession)
  const resetCurrentSession = useAppStore((state) => state.resetCurrentSession)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [outputFilePath, setOutputFilePath] = useState<string | null>(null)
  const [lastHashFilePath, setLastHashFilePath] = useState<string | null>(null)

  useEffect(() => {
    if (!window.electronAPI) {
      console.error('window.electronAPI is not available')
      return
    }

    const handleOutput = (data: string) => {
      const lines = data.split('\n').filter((line) => line.trim())
      setConsoleOutput((prev) => [...prev, ...lines].slice(-100)) // Keep last 100 lines

      // Parse progress updates
      for (const line of lines) {
        // Log all output for debugging
        console.log('Hashcat output:', line)
        
        // Check if hashcat found hashes in potfile
        if (line.includes('All hashes found as potfile')) {
          console.log('Hashcat found hashes in potfile - will read from potfile or use --show output')
        }
        
        const parsed = parseHashcatOutput(line)
        if (parsed) {
          console.log('Parsed progress:', parsed)
          updateProgress({ ...parsed, status: 'running' })
        }

        // Parse cracked passwords (only from lines that look like actual results)
        // Hashcat outputs cracked passwords as: hash:password
        // With --show, it also outputs potfile entries in the same format
        // We need to be careful not to parse status messages
        const cracked = parseCrackedLine(line)
        if (cracked) {
          console.log('Found cracked password:', cracked)
          addResult({
            hash: cracked.hash,
            password: cracked.password,
            timestamp: Date.now(),
          })
        }
      }
    }

    const handleError = (data: string) => {
      const errorLine = `[ERROR] ${data}`
      setConsoleOutput((prev) => [...prev, errorLine].slice(-100))
      
      // Detect fatal errors that cause immediate exit
      if (data.includes('Failed to start hashcat') || 
          data.includes('Process error') ||
          data.includes('ENOENT') ||
          data.includes('cannot find')) {
        console.error('Fatal hashcat error:', data)
        updateProgress({ status: 'error' })
        setTimeout(() => {
          alert(`Hashcat Failed to Start\n\n${data}\n\nPlease check:\n1. Hashcat binary path in Settings\n2. Hashcat is properly installed\n3. All required files exist`)
        }, 500)
        return
      }
      
      // Detect OpenCL errors
      // Note: Even with --force, hashcat may still show OpenCL errors during initialization
      // but should continue with CPU mode. We'll suppress the popup if CPU mode is enabled.
      if (data.includes('OpenCL') || data.includes('No such file or directory')) {
        // Only update status and show popup if CPU mode is NOT enabled
        if (!currentConfig.forceCpu) {
          updateProgress({ status: 'error' })
          // Show a helpful message after a short delay
          setTimeout(() => {
            const message = `OpenCL Error Detected!\n\n` +
              `Hashcat cannot find OpenCL (GPU acceleration library).\n\n` +
              `Possible solutions:\n` +
              `1. Install GPU drivers (NVIDIA/AMD/Intel)\n` +
              `2. Enable "Force CPU-Only Mode" in Attack Config > Advanced Options\n` +
              `3. Verify hashcat binary path in Settings\n\n` +
              `Note: CPU-only mode is much slower but will work without GPU drivers.`
            alert(message)
          }, 500)
        } else {
          // CPU mode is enabled - this error is expected, hashcat should continue
          // Don't set error status, keep it running
          console.log('OpenCL error detected but CPU mode is enabled - hashcat should continue with CPU')
          // Ensure status stays as running
          updateProgress({ status: 'running' })
        }
      } else {
        // Other errors - log but don't necessarily fail
        console.error('Hashcat error:', data)
      }
    }

    const handleExit = async (code: number | null) => {
      console.log('Hashcat exited with code:', code)
      // Convert large unsigned exit codes (Windows) to signed
      let exitCode = code
      if (code !== null && code > 2147483647) {
        // Convert unsigned to signed (Windows returns large numbers for negative codes)
        exitCode = code - 4294967296
        console.log('Converted exit code to signed:', exitCode)
      }
      
      // Read output file if it exists (hashcat writes cracked passwords here)
      if (outputFilePath) {
        try {
          const fileResult = await window.electronAPI.fs.readFile(outputFilePath)
          if (fileResult.success && fileResult.content) {
            console.log('Reading cracked passwords from output file:', outputFilePath)
            const lines = fileResult.content.split('\n').filter(line => line.trim())
            for (const line of lines) {
              const cracked = parseCrackedLine(line)
              if (cracked) {
                console.log('Found cracked password from file:', cracked)
                addResult({
                  hash: cracked.hash,
                  password: cracked.password,
                  timestamp: Date.now(),
                })
              }
            }
          }
        } catch (error) {
          console.error('Error reading output file:', error)
        }
      }
      
      // If hashcat said all hashes were in potfile, use --show to get them
      // This is more reliable than reading the potfile directly
      if (exitCode === 0 && consoleOutput.some(line => line.includes('All hashes found as potfile'))) {
        try {
          console.log('Hashcat found hashes in potfile, using --show to retrieve them')
          
          // Build --show command: hashcat --show -m <hashType> <hashFile>
          const showArgs = [
            '--show',
            '-m', currentConfig.hashType.toString(),
            lastHashFilePath || currentConfig.hashFile || ''
          ].filter(Boolean)
          
          console.log('Running hashcat --show with args:', showArgs)
          
          // Run hashcat --show to get the passwords
          const showResult = await window.electronAPI.hashcat.start(showArgs, settings.hashcatPath)
          if (!showResult.success) {
            console.error('Failed to run hashcat --show:', showResult.error)
            // Fall back to reading potfile directly
            await readPotfileDirectly()
          }
          // The --show output will come through handleOutput, which will parse it
        } catch (error) {
          console.error('Error running hashcat --show:', error)
          // Fall back to reading potfile directly
          await readPotfileDirectly()
        }
      } else if (exitCode === 0) {
        // Also try reading from potfile directly as a fallback
        await readPotfileDirectly()
      }
      
      async function readPotfileDirectly() {
        try {
          const potfileResult = await window.electronAPI.hashcat.readPotfile(settings.hashcatPath)
          if (potfileResult.success && potfileResult.content) {
            console.log('Reading passwords from potfile, content length:', potfileResult.content.length)
            const lines = potfileResult.content.split('\n').filter(line => line.trim())
            console.log('Potfile lines:', lines.length)
            let foundCount = 0
            for (const line of lines) {
              console.log('Potfile line:', JSON.stringify(line)) // Use JSON.stringify to see any hidden chars
              const cracked = parseCrackedLine(line)
              if (cracked) {
                console.log('Found password from potfile:', cracked)
                foundCount++
                addResult({
                  hash: cracked.hash,
                  password: cracked.password,
                  timestamp: Date.now(),
                })
              } else {
                console.log('Line did not parse as hash:password:', JSON.stringify(line))
                // Try a simpler parse as fallback
                const parts = line.split(':')
                if (parts.length >= 2) {
                  const hash = parts[0].trim()
                  const password = parts.slice(1).join(':').trim() // Join in case password has colons
                  if (hash.length >= 8 && password.length > 0) {
                    console.log('Using fallback parse:', { hash, password })
                    addResult({
                      hash,
                      password,
                      timestamp: Date.now(),
                    })
                    foundCount++
                  }
                }
              }
            }
            console.log(`Parsed ${foundCount} passwords from potfile`)
          } else {
            console.log('Potfile read failed:', potfileResult.error)
          }
        } catch (error) {
          console.error('Error reading potfile:', error)
        }
      }
      
      if (exitCode === 0) {
        updateProgress({ status: 'completed' })
        
        // Auto-save session if enabled and we have results
        // Use getState() to get the latest results after addResult calls
        if (settings.autoSaveSession) {
          const latestResults = useAppStore.getState().currentResults
          if (latestResults.length > 0) {
            const sessionName = `Auto-saved ${new Date().toLocaleString()}`
            saveSession(sessionName)
            console.log('Auto-saved session:', sessionName)
          }
        }
      } else if (exitCode !== null) {
        // Check if we have OpenCL errors in console when CPU mode is enabled
        // If so, the exit might be due to OpenCL, but we should still show error
        // since hashcat didn't actually run
        console.error('Hashcat exited with error code:', exitCode)
        updateProgress({ status: 'error' })
      } else {
        // Null exit code might mean process was killed
        updateProgress({ status: 'stopped' })
      }
    }

    window.electronAPI.hashcat.onOutput(handleOutput)
    window.electronAPI.hashcat.onError(handleError)
    window.electronAPI.hashcat.onExit(handleExit)

    return () => {
      if (window.electronAPI) {
        window.electronAPI.hashcat.removeAllListeners('hashcat:output')
        window.electronAPI.hashcat.removeAllListeners('hashcat:error')
        window.electronAPI.hashcat.removeAllListeners('hashcat:exit')
      }
    }
  }, [updateProgress, addResult, currentConfig.forceCpu, outputFilePath])

  const handleStartNewTask = () => {
    // Reset the session to start fresh
    resetCurrentSession()
    // Clear console output
    setConsoleOutput([])
    // The form will now be empty and ready for new input
  }

  const handleStart = async () => {
    if (!window.electronAPI) {
      alert('Electron API not available. Please restart the app.')
      return
    }

    if (!currentConfig.hashFile && (!currentConfig.hashes || currentConfig.hashes.length === 0)) {
      alert('Please provide hashes first')
      return
    }

    if (currentConfig.attackMode === 0 && !currentConfig.wordlist) {
      alert('Please select a wordlist')
      return
    }

    // Create temp file for hashes if not using hashFile
    let hashFilePath = currentConfig.hashFile
    if (!hashFilePath && currentConfig.hashes && currentConfig.hashes.length > 0) {
      const tempResult = await window.electronAPI.fs.createTempFile(
        currentConfig.hashes.join('\n'),
        'hash'
      )
      if (!tempResult.success || !tempResult.path) {
        alert(`Failed to create temporary hash file: ${tempResult.error}`)
        return
      }
      hashFilePath = tempResult.path
    }

    // Create output file for cracked passwords
    const outputFileResult = await window.electronAPI.fs.createTempFile('', 'out')
    const outputFilePath = outputFileResult.success && outputFileResult.path 
      ? outputFileResult.path 
      : undefined
    
    // Store output file path for reading after hashcat exits
    // Also store hash file path for potential --show command
    if (outputFilePath) {
      setOutputFilePath(outputFilePath)
    }
    setLastHashFilePath(hashFilePath!)

    const args = buildHashcatArgs({
      ...currentConfig,
      hashFile: hashFilePath!,
      outputFile: outputFilePath,
    })

    // Log the arguments for debugging (including --force if CPU mode is enabled)
    console.log('Starting hashcat with args:', args)
    console.log('CPU-only mode enabled:', currentConfig.forceCpu)

    updateProgress({ status: 'running' })
    setConsoleOutput([])

    const result = await window.electronAPI.hashcat.start(args, settings.hashcatPath)
    if (!result.success) {
      updateProgress({ status: 'error' })
      alert(`Failed to start hashcat: ${result.error}`)
    }
  }

  const handleStop = async () => {
    await window.electronAPI.hashcat.stop()
    updateProgress({ status: 'stopped' })
  }

  const handlePause = async () => {
    await window.electronAPI.hashcat.pause()
    updateProgress({ status: 'paused' })
  }

  const handleResume = async () => {
    await window.electronAPI.hashcat.resume()
    updateProgress({ status: 'running' })
  }

  const formatSpeed = (speed: number): string => {
    if (speed >= 1000000) return `${(speed / 1000000).toFixed(2)} MH/s`
    if (speed >= 1000) return `${(speed / 1000).toFixed(2)} KH/s`
    return `${speed.toFixed(2)} H/s`
  }

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Execution Control</CardTitle>
          <CardDescription>Start, pause, or stop the hashcat process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {currentProgress.status === 'idle' || currentProgress.status === 'stopped' ? (
              <Button onClick={handleStart} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            ) : currentProgress.status === 'completed' || currentProgress.status === 'error' ? (
              <Button onClick={handleStartNewTask} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Start New Task
              </Button>
            ) : currentProgress.status === 'running' ? (
              <>
                <Button onClick={handlePause} variant="outline" className="flex-1">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button onClick={handleStop} variant="destructive" className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            ) : currentProgress.status === 'paused' ? (
              <>
                <Button onClick={handleResume} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
                <Button onClick={handleStop} variant="destructive" className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Progress</CardTitle>
          <CardDescription>Real-time execution statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Progress</span>
              <span className="text-white font-medium">{currentProgress.progress.toFixed(2)}%</span>
            </div>
            <Progress value={currentProgress.progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Speed</p>
              <p className="text-lg font-semibold text-white">{formatSpeed(currentProgress.speed)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Recovered</p>
              <p className="text-lg font-semibold text-green-400">{currentProgress.recovered}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Time Elapsed</p>
              <p className="text-lg font-semibold text-white">{formatTime(currentProgress.timeElapsed)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="text-lg font-semibold text-white capitalize">{currentProgress.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Console Output</CardTitle>
          <CardDescription>
            Real-time hashcat output
            {currentConfig.forceCpu && (
              <span className="ml-2 text-yellow-400 text-xs">
                (CPU mode: OpenCL errors are expected and can be ignored)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black rounded-md p-4 h-64 overflow-y-auto font-mono text-sm">
            {consoleOutput.length === 0 ? (
              <p className="text-gray-500">No output yet...</p>
            ) : (
              consoleOutput.map((line, index) => {
                // Highlight OpenCL errors in yellow when CPU mode is enabled (they're expected)
                const isOpenCLError = currentConfig.forceCpu && 
                  (line.includes('OpenCL') || line.includes('No such file or directory'))
                return (
                  <div 
                    key={index} 
                    className={isOpenCLError ? 'text-yellow-400' : 'text-green-400'}
                  >
                    {line}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

