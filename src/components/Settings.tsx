import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FolderOpen, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function Settings() {
  const { settings, updateSettings } = useAppStore()

  const handleHashcatPathSelect = async () => {
    try {
      const result = await window.electronAPI.dialog.openFile({
        properties: ['openFile'],
        filters: [
          { name: 'Executable', extensions: ['exe'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        title: 'Select hashcat.exe',
      })

      if (!result.canceled && result.filePaths.length > 0) {
        const path = result.filePaths[0]
        // Verify the file exists and is executable
        const checkResult = await window.electronAPI.hashcat.checkBinary(path)
        if (checkResult) {
          updateSettings({ hashcatPath: path })
        } else {
          alert('Selected file does not exist or is not accessible')
        }
      }
    } catch (error) {
      console.error('Error selecting hashcat path:', error)
      alert('Error selecting hashcat path: ' + String(error))
    }
  }
  
  const handleTestHashcat = async () => {
    if (!settings.hashcatPath) {
      alert('Please set the hashcat path first')
      return
    }
    
    const checkResult = await window.electronAPI.hashcat.checkBinary(settings.hashcatPath)
    if (checkResult) {
      alert('Hashcat binary found! Path is valid.')
    } else {
      alert('Hashcat binary not found at the specified path. Please check the path and try again.')
    }
  }

  const handleWordlistPathSelect = async () => {
    try {
      const result = await window.electronAPI.dialog.openDirectory()

      if (!result.canceled && result.filePaths.length > 0) {
        updateSettings({ defaultWordlistPath: result.filePaths[0] })
      }
    } catch (error) {
      console.error('Error selecting wordlist path:', error)
    }
  }

  const handleOutputPathSelect = async () => {
    try {
      const result = await window.electronAPI.dialog.openDirectory()

      if (!result.canceled && result.filePaths.length > 0) {
        updateSettings({ outputDirectory: result.filePaths[0] })
      }
    } catch (error) {
      console.error('Error selecting output path:', error)
    }
  }

  const handleClearPotfile = async () => {
    if (!settings.hashcatPath) {
      alert('Please set the hashcat path first')
      return
    }

    const confirmed = confirm(
      'Are you sure you want to clear the hashcat potfile?\n\n' +
      'This will remove all previously cracked passwords from the potfile. ' +
      'This action cannot be undone.\n\n' +
      'Continue?'
    )

    if (!confirmed) {
      return
    }

    try {
      const result = await window.electronAPI.hashcat.clearPotfile(settings.hashcatPath)
      if (result.success) {
        alert(result.message || 'Potfile cleared successfully!')
      } else {
        alert(`Failed to clear potfile: ${result.error}`)
      }
    } catch (error) {
      console.error('Error clearing potfile:', error)
      alert(`Error clearing potfile: ${String(error)}`)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Configure application preferences</p>
      </div>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Hashcat Configuration</CardTitle>
          <CardDescription>Set paths for hashcat binary and resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hashcat-path" className="text-gray-300">
              Hashcat Binary Path
            </Label>
            <div className="flex gap-2">
              <Input
                id="hashcat-path"
                className="bg-gray-800 border-gray-600 text-white"
                value={settings.hashcatPath}
                onChange={(e) => updateSettings({ hashcatPath: e.target.value })}
                placeholder="hashcat.exe or hashcat"
              />
              <Button variant="outline" onClick={handleHashcatPathSelect}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Path to the hashcat executable. On Windows, this is typically hashcat.exe
              <br />
              <span className="text-yellow-400">
                ⚠️ Hashcat must be installed separately. Download from: https://hashcat.net/hashcat/
              </span>
            </p>
            <Button 
              variant="outline" 
              onClick={handleTestHashcat}
              className="mt-2"
            >
              Test Path
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wordlist-path" className="text-gray-300">
              Default Wordlist Directory
            </Label>
            <div className="flex gap-2">
              <Input
                id="wordlist-path"
                className="bg-gray-800 border-gray-600 text-white"
                value={settings.defaultWordlistPath || ''}
                onChange={(e) => updateSettings({ defaultWordlistPath: e.target.value })}
                placeholder="Select default wordlist directory..."
                readOnly
              />
              <Button variant="outline" onClick={handleWordlistPathSelect}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="output-path" className="text-gray-300">
              Output Directory
            </Label>
            <div className="flex gap-2">
              <Input
                id="output-path"
                className="bg-gray-800 border-gray-600 text-white"
                value={settings.outputDirectory || ''}
                onChange={(e) => updateSettings({ outputDirectory: e.target.value })}
                placeholder="Select output directory..."
                readOnly
              />
              <Button variant="outline" onClick={handleOutputPathSelect}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-700">
            <Label className="text-gray-300">Potfile Management</Label>
            <p className="text-xs text-gray-400 mb-2">
              The potfile stores previously cracked passwords. Clearing it will remove all entries.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleClearPotfile}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Potfile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Application Preferences</CardTitle>
          <CardDescription>General application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Auto-save Sessions</Label>
              <p className="text-xs text-gray-400">Automatically save session progress</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSaveSession}
              onChange={(e) => updateSettings({ autoSaveSession: e.target.checked })}
              className="w-4 h-4"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1F2937] border-gray-700 border-yellow-600">
        <CardHeader>
          <CardTitle className="text-yellow-400">Legal Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">
            This tool is intended for legitimate security testing, password recovery for authorized systems, and
            educational purposes only. Users are responsible for ensuring they have proper authorization before
            attempting to recover passwords. Unauthorized access to computer systems is illegal and may result in
            criminal prosecution.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

