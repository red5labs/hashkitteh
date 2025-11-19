import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Play } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function Sessions() {
  const { sessions, loadSession, deleteSession, setActiveView } = useAppStore()

  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId)
    // Switch to new-task view to see the loaded configuration
    setActiveView('new-task')
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Sessions</h2>
        <p className="text-gray-400">Manage your saved sessions</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-[#1F2937] border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">No saved sessions yet.</p>
            <Button
              className="mt-4"
              onClick={() => setActiveView('new-task')}
            >
              Create New Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-[#1F2937] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">{session.name}</CardTitle>
                <CardDescription>
                  {new Date(session.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hash Type:</span>
                    <span className="text-white">{session.config.hashType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack Mode:</span>
                    <span className="text-white">{session.config.attackMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recovered:</span>
                    <span className="text-green-400">{session.results.length}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleLoadSession(session.id)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Load
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

