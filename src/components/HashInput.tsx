import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { detectHashType, parseHashes, hashTypes } from '@/utils/hashTypeDetector'

export function HashInput() {
  const { currentConfig, updateConfig } = useAppStore()
  // Sync with store - use hashes from config if available, otherwise use empty string
  const hashInput = currentConfig.hashes?.join('\n') || ''
  const [detectedType, setDetectedType] = useState<number | null>(null)

  useEffect(() => {
    if (hashInput.trim()) {
      const firstHash = hashInput.split('\n')[0].trim()
      const detected = detectHashType(firstHash)
      setDetectedType(detected)
      if (detected !== null) {
        updateConfig({ hashType: detected })
      }
    }
  }, [hashInput, updateConfig])

  const handleFileUpload = async () => {
    if (!window.electronAPI) {
      alert('Electron API not available')
      return
    }
    try {
      const result = await window.electronAPI.dialog.openFile({
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt', 'hash'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePaths.length > 0) {
        const fileResult = await window.electronAPI.fs.readFile(result.filePaths[0])
        if (fileResult.success && fileResult.content) {
          const hashes = parseHashes(fileResult.content)
          updateConfig({ hashFile: result.filePaths[0], hashes })
        }
      }
    } catch (error) {
      console.error('Error reading file:', error)
    }
  }

  const handleHashTypeChange = (value: string) => {
    updateConfig({ hashType: parseInt(value) })
  }

  return (
    <Card className="bg-[#1F2937] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Hash Input</CardTitle>
        <CardDescription>Enter hashes directly (one per line) or upload a file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hash-input" className="text-gray-300">
            Hashes (one per line)
          </Label>
          <Textarea
            id="hash-input"
            className="bg-gray-800 border-gray-600 text-white min-h-[200px] font-mono text-sm resize-y"
            placeholder="Paste hashes here, one per line...&#10;&#10;Example:&#10;8743b52063cd84097a65d1633f5c74f5&#10;5d41402abc4b2a76b9719d911017c592&#10;098f6bcd4621d373cade4e832627b4f6"
            value={hashInput}
            onChange={(e) => {
              const hashes = parseHashes(e.target.value)
              updateConfig({ hashes, hashFile: undefined })
            }}
            rows={10}
          />
          {hashInput && (
            <p className="text-xs text-gray-400">
              {hashInput.split('\n').filter(line => line.trim()).length} hash(es) entered
            </p>
          )}
          {detectedType !== null && (
            <p className="text-xs text-green-400">
              Detected hash type: {hashTypes.find((h) => h.id === detectedType)?.name || 'Unknown'}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFileUpload} className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hash-type" className="text-gray-300">
            Hash Type
          </Label>
          <Select value={currentConfig.hashType.toString()} onValueChange={handleHashTypeChange}>
            <SelectTrigger id="hash-type" className="bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {hashTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()} className="text-white">
                  {type.name} - {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

