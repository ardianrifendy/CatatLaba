import { create } from 'zustand'

export type GlobalActionType = 'create-transaction' | 'create-product' | null

interface GlobalActionState {
  pendingAction: GlobalActionType
  triggerAction: (action: GlobalActionType) => void
  clearAction: () => void
}

export const useGlobalActionStore = create<GlobalActionState>()((set) => ({
  pendingAction: null,
  triggerAction: (action) => set({ pendingAction: action }),
  clearAction: () => set({ pendingAction: null }),
}))
