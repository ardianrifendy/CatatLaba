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

// Dev boot check: prove the local SQLite database opens, migrations run, defaults
// seed, and Drizzle can read it all back. Dev only, and dynamically imported so
// the sql.js (wasm) dev backend is tree-shaken out of the production bundle
// entirely (the device build uses the native SQLite backend). Phase 1 wires DB
// startup into the real app lifecycle.
if (import.meta.env.DEV) {
  void (async () => {
    try {
      const { categories, channels, initDb } = await import('@/db/local')
      const { db, migrationsApplied } = await initDb()
      const [catCount, chanCount] = await Promise.all([
        db.select().from(categories),
        db.select().from(channels),
      ])
      console.info(
        `[db] boot ok — migrations: ${migrationsApplied}, seeded categories: ${catCount.length}, channels: ${chanCount.length}`,
      )
    } catch (error) {
      console.error('[db] init failed:', error)
    }
  })()
}
