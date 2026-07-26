import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/lib/env' // fail-fast env validation at boot
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
