import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const androidDirectory = path.resolve(scriptDirectory, '..', 'android')
const tasks = process.argv.slice(2)
const environment = { ...process.env }

if (tasks.length === 0) {
  console.error('Usage: node scripts/android-gradle.mjs <gradle-task> [...gradle-tasks]')
  process.exit(1)
}

const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const androidStudioJbr =
  process.env.ANDROID_STUDIO_JBR ?? 'C:\\Program Files\\Android\\Android Studio\\jbr'

if (
  process.platform === 'win32' &&
  existsSync(path.join(androidStudioJbr, 'bin', 'java.exe'))
) {
  environment.JAVA_HOME = androidStudioJbr
  environment.Path = `${path.join(androidStudioJbr, 'bin')};${environment.Path ?? ''}`
}

const result = spawnSync(wrapper, tasks, {
  cwd: androidDirectory,
  env: environment,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
