export type AttackMode = 0 | 1 | 3 | 6 | 7

export interface HashcatConfig {
  hashType: number
  attackMode: AttackMode
  hashFile?: string
  hashes?: string[]
  wordlist?: string
  rules?: string
  mask?: string
  workloadProfile: 1 | 2 | 3 | 4
  gpuDevices?: string
  customArgs?: string[]
  forceCpu?: boolean // Use CPU-only mode if OpenCL is not available
  outputFile?: string // Output file for cracked passwords
}

export interface HashcatProgress {
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error'
  speed: number // H/s
  progress: number // 0-100
  timeElapsed: number // seconds
  timeEstimated?: number // seconds
  recovered: number
  temperature?: number
  currentHash?: string
}

export interface CrackedPassword {
  hash: string
  password: string
  timestamp: number
}

export interface Session {
  id: string
  name: string
  config: HashcatConfig
  progress: HashcatProgress
  results: CrackedPassword[]
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  hashcatPath: string
  defaultWordlistPath?: string
  defaultRulesPath?: string
  outputDirectory?: string
  autoSaveSession: boolean
  theme: 'light' | 'dark'
}

export interface HashTypeInfo {
  id: number
  name: string
  description: string
  example: string
}

