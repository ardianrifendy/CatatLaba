export type StoreProfile = {
  name: string
  address: string
  phone: string
}

const DEFAULT_STORE_PROFILE: StoreProfile = {
  name: 'Usaha Saya',
  address: '',
  phone: '',
}

export function getStoreProfile(): StoreProfile {
  try {
    const raw = localStorage.getItem('catatlaba_store_profile')
    if (raw) return { ...DEFAULT_STORE_PROFILE, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_STORE_PROFILE
}

export function saveStoreProfile(profile: StoreProfile): void {
  localStorage.setItem('catatlaba_store_profile', JSON.stringify(profile))
}
