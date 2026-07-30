import { Capacitor, registerPlugin } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface ExportJsonFileInput {
  readonly fileName: string
  readonly json: string
}

export interface ExportJsonFileResult {
  readonly native: boolean
  readonly uri: string | null
}

interface NativeFileExportPlugin {
  saveJson(input: ExportJsonFileInput): Promise<{ readonly uri: string; readonly fileName: string }>
}

const NativeFileExport = registerPlugin<NativeFileExportPlugin>('FileExport')

export async function exportJsonFile(input: ExportJsonFileInput): Promise<ExportJsonFileResult> {
  if (Capacitor.isNativePlatform()) {
    return exportNativeDownloadJsonFile(input).catch(() => exportNativeShareJsonFile(input))
  }

  exportWebJsonFile(input)
  return { native: false, uri: null }
}

async function exportNativeDownloadJsonFile(input: ExportJsonFileInput): Promise<ExportJsonFileResult> {
  const written = await NativeFileExport.saveJson(input)
  return { native: true, uri: written.uri }
}

async function exportNativeShareJsonFile(input: ExportJsonFileInput): Promise<ExportJsonFileResult> {
  const path = `CatatLaba/${input.fileName}`
  const written = await Filesystem.writeFile({
    path,
    data: input.json,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  })

  const canShare = await Share.canShare().then((result) => result.value).catch(() => false)
  if (canShare) {
    await Share.share({
      title: input.fileName,
      text: 'Backup JSON CatatLaba',
      files: [written.uri],
      dialogTitle: 'Simpan atau bagikan backup CatatLaba',
    }).catch(() => undefined)
  }

  return { native: true, uri: written.uri }
}

function exportWebJsonFile(input: ExportJsonFileInput): void {
  const url = URL.createObjectURL(new Blob([input.json], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = input.fileName
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
