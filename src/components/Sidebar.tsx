import { LayoutDashboard, Plus, FolderOpen, FileText, Settings, Info } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { activeView, setActiveView, resetCurrentSession } = useAppStore()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-task', label: 'New Task', icon: Plus },
    { id: 'sessions', label: 'Sessions', icon: FolderOpen },
    { id: 'results', label: 'Results', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & About', icon: Info },
  ] as const

  const handleNavClick = (itemId: string) => {
    // Always reset when explicitly clicking "New Task" from the sidebar
    // This gives users a clear way to start fresh
    if (itemId === 'new-task') {
      resetCurrentSession()
    }
    setActiveView(itemId as any)
  }

  return (
    <div className="w-64 bg-[#1F2937] border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700 flex flex-col items-center">
        <img 
          src="/hashkitteh_logo.png" 
          alt="hashkitteh logo" 
          className="w-32 h-auto mb-2"
          onError={(e) => {
            console.error('Failed to load logo image. Make sure hashkitteh_logo.png is in the public folder.')
            e.currentTarget.style.display = 'none'
          }}
        />
        <p className="text-sm text-gray-400 mt-1 text-center">Password Recovery Tool</p>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                isActive ? 'bg-primary text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
              )}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-700 text-gray-400 text-xs text-center">
        Need tips? Visit the <button onClick={() => setActiveView('help')} className="text-primary hover:underline">Help & About page</button>.
      </div>
    </div>
  )
}

