import { HashInput } from './HashInput'
import { AttackConfig } from './AttackConfig'
import { ExecutionMonitor } from './ExecutionMonitor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function NewTask() {
  const { resetCurrentSession, setActiveView, activeSessionId, currentResults } = useAppStore()

  const handleNewTask = () => {
    resetCurrentSession()
    // Stay on the same view, just reset the data
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {activeSessionId ? 'Task Configuration' : 'New Task'}
          </h2>
          <p className="text-gray-400">
            {activeSessionId 
              ? 'View and edit the loaded session configuration' 
              : 'Configure and start a new password recovery task'}
          </p>
        </div>
        <div className="flex gap-2">
          {currentResults.length > 0 && (
            <Button variant="outline" onClick={() => setActiveView('results')}>
              <FileText className="mr-2 h-4 w-4" />
              View Results ({currentResults.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleNewTask}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hash" className="space-y-6">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="hash" className="data-[state=active]:bg-primary">
            Hash Input
          </TabsTrigger>
          <TabsTrigger value="attack" className="data-[state=active]:bg-primary">
            Attack Config
          </TabsTrigger>
          <TabsTrigger value="execute" className="data-[state=active]:bg-primary">
            Execute
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hash">
          <HashInput />
        </TabsContent>

        <TabsContent value="attack">
          <AttackConfig />
        </TabsContent>

        <TabsContent value="execute">
          <ExecutionMonitor />
        </TabsContent>
      </Tabs>
    </div>
  )
}

