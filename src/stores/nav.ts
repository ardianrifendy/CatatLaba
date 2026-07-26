import { create } from 'zustand'

export type TabId = 'beranda' | 'transaksi' | 'produk' | 'laporan' | 'pengaturan'

interface NavState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

// Tab navigation is plain client state — no router in the MVP. The shell reads
// `activeTab` to pick the page; the tab bar / sidebar call `setActiveTab`.
export const useNavStore = create<NavState>()((set) => ({
  activeTab: 'beranda',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
