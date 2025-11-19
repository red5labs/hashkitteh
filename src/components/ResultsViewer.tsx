import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Copy, Eye, EyeOff, Search, Save, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function ResultsViewer() {
  const { currentResults, clearResults, saveSession, setActiveView, activeSessionId } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showPasswords, setShowPasswords] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  const handleSaveSession = () => {
    const sessionName = prompt('Enter a name for this session:', `Session ${new Date().toLocaleString()}`)
    if (sessionName && sessionName.trim()) {
      saveSession(sessionName.trim())
      alert('Session saved successfully!')
      setActiveView('sessions')
    }
  }

  const filteredResults = currentResults.filter(
    (result) =>
      result.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.password.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleExport = async (format: 'csv' | 'json' | 'txt') => {
    let content = ''
    let extension = ''

    if (format === 'csv') {
      content = 'Hash,Password\n' + filteredResults.map((r) => `"${r.hash}","${r.password}"`).join('\n')
      extension = 'csv'
    } else if (format === 'json') {
      content = JSON.stringify(filteredResults, null, 2)
      extension = 'json'
    } else {
      content = filteredResults.map((r) => `${r.hash}:${r.password}`).join('\n')
      extension = 'txt'
    }

    try {
      const result = await window.electronAPI.dialog.saveFile({
        defaultPath: `hashcat-results.${extension}`,
        filters: [
          { name: format.toUpperCase(), extensions: [extension] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePath) {
        const writeResult = await window.electronAPI.fs.writeFile(result.filePath, content)
        if (writeResult.success) {
          alert('Results exported successfully!')
        } else {
          alert(`Failed to export: ${writeResult.error}`)
        }
      }
    } catch (error) {
      console.error('Error exporting results:', error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Results</h2>
          <p className="text-gray-400">
            {currentResults.length === 0 
              ? 'No results yet. Start a task to see recovered passwords here.'
              : `${filteredResults.length} of ${currentResults.length} passwords recovered`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveView('new-task')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Task
          </Button>
          <Button variant="outline" onClick={() => setShowPasswords(!showPasswords)}>
            {showPasswords ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showPasswords ? 'Hide' : 'Show'} Passwords
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          {currentResults.length > 0 && (
            <>
              <Button variant="default" onClick={handleSaveSession}>
                <Save className="mr-2 h-4 w-4" />
                Save Session
              </Button>
              <Button variant="destructive" onClick={clearResults}>
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10 bg-gray-800 border-gray-600 text-white"
          placeholder="Search hashes or passwords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardContent className="p-0">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {currentResults.length === 0
                ? 'No results yet. Start a task to see recovered passwords here.'
                : 'No results match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-300 font-mono">{result.hash}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {showPasswords ? (
                          <code className="text-sm text-green-400 font-mono">{result.password}</code>
                        ) : (
                          <span className="text-gray-500">••••••••</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(result.password, index)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

