import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotifType = 'success' | 'error' | 'info' | 'warning'

export interface AppNotification {
  id: string
  type: NotifType
  message: string
  timestamp: number
  read: boolean
}

interface NotificationState {
  notifications: AppNotification[]
  addNotification: (type: NotifType, message: string) => void
  markAllRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (type, message) =>
        set((s) => ({
          notifications: [
            { id: `${Date.now()}-${Math.random()}`, type, message, timestamp: Date.now(), read: false },
            ...s.notifications,
          ].slice(0, 50),
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      removeNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'lmts-notifications' }
  )
)
