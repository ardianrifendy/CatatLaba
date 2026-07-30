import { create } from 'zustand'

export type TabId = 'beranda' | 'transaksi' | 'produk' | 'laporan' | 'pengaturan'

interface NavState {
  activeTab: TabId
  subScreenTitle: string | null
  setActiveTab: (tab: TabId) => void
  setSubScreenTitle: (title: string | null) => void
}

// Tab navigation is plain client state — no router in the MVP. The shell reads
// `activeTab` to pick the page; the tab bar / sidebar call `setActiveTab`.
export const useNavStore = create<NavState>()((set) => ({
  activeTab: 'beranda',
  subScreenTitle: null,
  setActiveTab: (tab) => set({ activeTab: tab, subScreenTitle: null }),
  setSubScreenTitle: (title) => set({ subScreenTitle: title }),
}))
