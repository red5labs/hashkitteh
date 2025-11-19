import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FolderOpen } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { AttackMode } from '@/types/hashcat.types'

const attackModes = [
  { value: 0, label: 'Dictionary Attack (0)', description: 'Attack using a wordlist' },
  { value: 1, label: 'Combinator Attack (1)', description: 'Combine two wordlists' },
  { value: 3, label: 'Brute-force Attack (3)', description: 'Brute-force using mask' },
  { value: 6, label: 'Hybrid Wordlist + Mask (6)', description: 'Wordlist + mask' },
  { value: 7, label: 'Hybrid Mask + Wordlist (7)', description: 'Mask + wordlist' },
] as const

export function AttackConfig() {
  const { currentConfig, updateConfig } = useAppStore()

  const handleWordlistSelect = async () => {
    try {
      const result = await window.electronAPI.dialog.openFile({
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePaths.length > 0) {
        updateConfig({ wordlist: result.filePaths[0] })
      }
    } catch (error) {
      console.error('Error selecting wordlist:', error)
    }
  }

  const handleRulesSelect = async () => {
    try {
      const result = await window.electronAPI.dialog.openFile({
        properties: ['openFile'],
        filters: [
          { name: 'Rule Files', extensions: ['rule'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePaths.length > 0) {
        updateConfig({ rules: result.filePaths[0] })
      }
    } catch (error) {
      console.error('Error selecting rules:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Attack Mode</CardTitle>
          <CardDescription>Select the attack mode for password recovery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attack-mode" className="text-gray-300">
              Attack Mode
            </Label>
            <Select
              value={currentConfig.attackMode.toString()}
              onValueChange={(value) => updateConfig({ attackMode: parseInt(value) as AttackMode })}
            >
              <SelectTrigger id="attack-mode" className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {attackModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value.toString()} className="text-white">
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(currentConfig.attackMode === 0 || currentConfig.attackMode === 6 || currentConfig.attackMode === 7) && (
            <div className="space-y-2">
              <Label className="text-gray-300">Wordlist</Label>
              <div className="flex gap-2">
                <Input
                  className="bg-gray-800 border-gray-600 text-white"
                  value={currentConfig.wordlist || ''}
                  placeholder="Select wordlist file..."
                  readOnly
                />
                <Button variant="outline" onClick={handleWordlistSelect}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentConfig.attackMode === 0 && (
            <div className="space-y-2">
              <Label className="text-gray-300">Rules File (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  className="bg-gray-800 border-gray-600 text-white"
                  value={currentConfig.rules || ''}
                  placeholder="Select rules file..."
                  readOnly
                />
                <Button variant="outline" onClick={handleRulesSelect}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {(currentConfig.attackMode === 3 || currentConfig.attackMode === 6 || currentConfig.attackMode === 7) && (
            <div className="space-y-2">
              <Label htmlFor="mask" className="text-gray-300">
                Mask Pattern
              </Label>
              <Input
                id="mask"
                className="bg-gray-800 border-gray-600 text-white font-mono"
                value={currentConfig.mask || ''}
                onChange={(e) => updateConfig({ mask: e.target.value })}
                placeholder="?a?a?a?a?a?a?a?a"
              />
              <p className="text-xs text-gray-400">
                Use ?l (lowercase), ?u (uppercase), ?d (digits), ?s (special), ?a (all)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Advanced Options</CardTitle>
          <CardDescription>Performance and hardware settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workload" className="text-gray-300">
              Workload Profile
            </Label>
            <Select
              value={currentConfig.workloadProfile.toString()}
              onValueChange={(value) =>
                updateConfig({ workloadProfile: parseInt(value) as 1 | 2 | 3 | 4 })
              }
            >
              <SelectTrigger id="workload" className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="1" className="text-white">1 - Low (Background)</SelectItem>
                <SelectItem value="2" className="text-white">2 - Default</SelectItem>
                <SelectItem value="3" className="text-white">3 - High</SelectItem>
                <SelectItem value="4" className="text-white">4 - Nightmare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-yellow-600/30">
            <div className="space-y-1">
              <Label htmlFor="force-cpu" className="text-gray-300 cursor-pointer">
                Force CPU-Only Mode
              </Label>
              <p className="text-xs text-gray-400">
                Use CPU instead of GPU. Enable this if you get OpenCL errors. Much slower but works without GPU drivers.
              </p>
            </div>
            <input
              id="force-cpu"
              type="checkbox"
              checked={currentConfig.forceCpu || false}
              onChange={(e) => updateConfig({ forceCpu: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

