import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  const originalWarn = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    const first = String(args[0] ?? '')
    if (first.includes('THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')) {
      return
    }
    originalWarn(...args)
  }
}

createRoot(document.getElementById('root')!).render(
  <App />,
)
