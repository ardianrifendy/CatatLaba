import type { Repositories } from '@/db/repositories'
import type { BusinessPreset } from './business-presets'

export interface ApplyPresetResult {
  addedCategories: number
  addedChannels: number
  addedWallets: number
}

const PRESET_STORAGE_KEY = 'catatlaba.active_preset_v1'

export async function applyBusinessPreset(
  repos: Repositories,
  preset: BusinessPreset,
): Promise<ApplyPresetResult> {
  // 1. Fetch current items to avoid duplicate creation
  const existingCategoriesRes = await repos.categories.list()
  const existingChannelsRes = await repos.channels.list()
  const existingWalletsRes = await repos.wallets.list()

  const existingCategories = existingCategoriesRes.ok ? existingCategoriesRes.value : []
  const existingChannels = existingChannelsRes.ok ? existingChannelsRes.value : []
  const existingWallets = existingWalletsRes.ok ? existingWalletsRes.value : []

  const existingCategoryNames = new Set(
    existingCategories.map((c) => `${c.name.trim().toLowerCase()}:${c.type}`),
  )
  const existingChannelNames = new Set(
    existingChannels.map((c) => c.name.trim().toLowerCase()),
  )
  const existingWalletNames = new Set(
    existingWallets.map((w) => w.name.trim().toLowerCase()),
  )

  let addedCategories = 0
  let addedChannels = 0
  let addedWallets = 0

  // 2. Add missing Categories
  for (const cat of preset.categories) {
    const key = `${cat.name.trim().toLowerCase()}:${cat.type}`
    if (!existingCategoryNames.has(key)) {
      const res = await repos.categories.create({
        name: cat.name,
        type: cat.type,
        icon: cat.icon ?? null,
        parentId: null,
      })
      if (res.ok) {
        addedCategories++
        existingCategoryNames.add(key)
      }
    }
  }

  // 3. Add missing Channels
  for (const ch of preset.channels) {
    const key = ch.name.trim().toLowerCase()
    if (!existingChannelNames.has(key)) {
      const res = await repos.channels.create({
        name: ch.name,
        isArchived: false,
      })
      if (res.ok) {
        addedChannels++
        existingChannelNames.add(key)
      }
    }
  }

  // 4. Add missing Wallets
  for (const w of preset.wallets) {
    const key = w.name.trim().toLowerCase()
    if (!existingWalletNames.has(key)) {
      const res = await repos.wallets.create({
        name: w.name,
        type: w.type,
        initialBalance: 0,
        isArchived: false,
      })
      if (res.ok) {
        addedWallets++
        existingWalletNames.add(key)
      }
    }
  }

  // 5. Save active preset metadata & units in localStorage
  try {
    window.localStorage.setItem(
      PRESET_STORAGE_KEY,
      JSON.stringify({
        id: preset.id,
        name: preset.name,
        appliedAt: new Date().toISOString(),
        units: preset.units,
      }),
    )
  } catch {
    // Fallback for storage restrictions
  }

  return {
    addedCategories,
    addedChannels,
    addedWallets,
  }
}

export function getActivePresetMetadata(): { id: string; name: string; appliedAt: string; units: string[] } | null {
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
