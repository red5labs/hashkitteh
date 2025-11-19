import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('=== hashkitteh Starting ===')
console.log('Root element exists:', !!document.getElementById('root'))
console.log('window.electronAPI exists:', typeof window !== 'undefined' && !!window.electronAPI)
console.log('React version:', React.version)

// Render immediately without try-catch to see real errors
const rootElement = document.getElementById('root')
if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; color: red;">ERROR: Root element not found!</div>'
  throw new Error('Root element not found')
}

console.log('Creating React root...')
try {
  const root = ReactDOM.createRoot(rootElement)

  console.log('Rendering App component...')
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )

  console.log('=== React app rendered ===')
} catch (error) {
  console.error('FATAL ERROR rendering React app:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; background: #1F2937; font-family: monospace;">
      <h1>Fatal Error Loading App</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <pre style="background: #111827; padding: 10px; overflow: auto; font-size: 12px;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
    </div>
  `
}

