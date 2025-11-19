import React, { useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Dashboard } from '@/components/Dashboard'
import { NewTask } from '@/components/NewTask'
import { Sessions } from '@/components/Sessions'
import { ResultsViewer } from '@/components/ResultsViewer'
import { Settings } from '@/components/Settings'
import { HelpAbout } from '@/components/HelpAbout'
import { useAppStore } from '@/store/appStore'

// Simple error boundary component
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#111827', minHeight: '100vh' }}>
          <h1 style={{ color: 'red' }}>Error Loading App</h1>
          <p>{this.state.error?.message}</p>
          <pre style={{ background: '#1F2937', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  // Only subscribe to activeView changes to prevent unnecessary re-renders
  const activeView = useAppStore((state) => state.activeView)

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      console.error('Global error:', e.error, e.message, e.filename, e.lineno)
    }
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', e.reason)
    }
    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  const renderContent = () => {
    try {
      switch (activeView) {
        case 'dashboard':
          return <Dashboard />
        case 'new-task':
          return <NewTask />
        case 'sessions':
          return <Sessions />
        case 'results':
          return <ResultsViewer />
        case 'settings':
          return <Settings />
        case 'help':
          return <HelpAbout />
        default:
          return <Dashboard />
      }
    } catch (error) {
      console.error('Error rendering content:', error)
      return <div style={{ padding: '20px', color: 'red' }}>Error: {String(error)}</div>
    }
  }

  return (
    <AppErrorBoundary>
      <div className="flex h-screen bg-[#111827] text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </AppErrorBoundary>
  )
}

export default App

