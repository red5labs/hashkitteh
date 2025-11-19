import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HashcatConfig, HashcatProgress, CrackedPassword, Session, AppSettings } from '@/types/hashcat.types'

interface AppState {
  // Current session
  currentConfig: HashcatConfig
  currentProgress: HashcatProgress
  currentResults: CrackedPassword[]
  
  // Sessions
  sessions: Session[]
  activeSessionId: string | null
  
  // Settings
  settings: AppSettings
  
  // UI State
  activeView: 'dashboard' | 'new-task' | 'sessions' | 'results' | 'settings' | 'help'
  
  // Actions
  setActiveView: (view: AppState['activeView']) => void
  updateConfig: (config: Partial<HashcatConfig>) => void
  updateProgress: (progress: Partial<HashcatProgress>) => void
  addResult: (result: CrackedPassword) => void
  clearResults: () => void
  saveSession: (name: string) => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  resetCurrentSession: () => void
}

const defaultConfig: HashcatConfig = {
  hashType: 0,
  attackMode: 0,
  workloadProfile: 2,
}

const defaultProgress: HashcatProgress = {
  status: 'idle',
  speed: 0,
  progress: 0,
  timeElapsed: 0,
  recovered: 0,
}

const defaultSettings: AppSettings = {
  hashcatPath: 'hashcat',
  autoSaveSession: true,
  theme: 'dark',
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initialize with defaults
      currentConfig: defaultConfig,
      currentProgress: defaultProgress,
      currentResults: [],
      sessions: [],
      activeSessionId: null,
      settings: defaultSettings,
      activeView: 'dashboard',
      
      setActiveView: (view) => set({ activeView: view }),
      
      updateConfig: (config) =>
        set((state) => ({
          currentConfig: { ...state.currentConfig, ...config },
        })),
      
      updateProgress: (progress) =>
        set((state) => ({
          currentProgress: { ...state.currentProgress, ...progress },
        })),
      
      addResult: (result) =>
        set((state) => ({
          currentResults: [...state.currentResults, result],
        })),
      
      clearResults: () => set({ currentResults: [] }),
      
      saveSession: (name) => {
        const state = get()
        const session: Session = {
          id: Date.now().toString(),
          name,
          config: state.currentConfig,
          progress: state.currentProgress,
          results: state.currentResults,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          sessions: [...s.sessions, session],
          activeSessionId: session.id,
        }))
      },
      
      loadSession: (sessionId) => {
        const state = get()
        const session = state.sessions.find((s) => s.id === sessionId)
        if (session) {
          console.log('Loading session:', session.name, {
            hashes: session.config.hashes?.length || 0,
            hashFile: session.config.hashFile,
            results: session.results.length,
            config: session.config
          })
          set({
            currentConfig: { ...session.config }, // Create a copy to avoid reference issues
            currentProgress: { ...session.progress },
            currentResults: [...session.results], // Create a copy
            activeSessionId: sessionId,
          })
        } else {
          console.error('Session not found:', sessionId)
        }
      },
      
      deleteSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        })),
      
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      
      resetCurrentSession: () =>
        set({
          currentConfig: defaultConfig,
          currentProgress: defaultProgress,
          currentResults: [],
          activeSessionId: null,
        }),
    }),
    {
      name: 'hashkitteh-storage',
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name)
            return value ? JSON.parse(value) : null
          } catch (error) {
            console.error('Error reading from localStorage:', error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to localStorage:', error)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch (error) {
            console.error('Error removing from localStorage:', error)
          }
        },
      },
      partialize: (state) => ({
        sessions: state.sessions,
        settings: state.settings,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
)

