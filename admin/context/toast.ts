import { create } from 'zustand'

type ToastState = {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
  setToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

const useToast = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  setToast: (message, type = 'info') => {
    set({ message, type, visible: true })
    setTimeout(() => set({ visible: false }), 3000)
  },
  hideToast: () => set({ visible: false }),
}))

export default useToast
