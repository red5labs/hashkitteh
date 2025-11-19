import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, TrendingUp, Cpu } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function Dashboard() {
  const { sessions, setActiveView, resetCurrentSession } = useAppStore()

  const recentSessions = sessions.slice(-5).reverse()

  const handleNewTask = () => {
    // Explicitly reset when starting a new task from dashboard
    resetCurrentSession()
    setActiveView('new-task')
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Welcome to hashkitteh</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1F2937] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Start</CardTitle>
            <CardDescription>Start a new password recovery task</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNewTask} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#1F2937] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">System Resources</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">CPU Usage</span>
              </div>
              <span className="text-sm font-medium text-white">--</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">GPU Usage</span>
              </div>
              <span className="text-sm font-medium text-white">--</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1F2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Sessions</CardTitle>
          <CardDescription>Your recently created or accessed sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-gray-400 text-sm">No sessions yet. Create a new task to get started.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    useAppStore.getState().loadSession(session.id)
                    setActiveView('sessions')
                  }}
                >
                  <div>
                    <p className="text-white font-medium">{session.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

