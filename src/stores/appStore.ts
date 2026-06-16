import { create } from 'zustand'

export interface User {
  id: string
  name: string
  department: string
  role: 'employee' | 'admin'
  avatar?: string
}

interface AppState {
  user: User | null
  adminMode: boolean
  sidebarCollapsed: boolean
  setAdminMode: (value: boolean) => void
  toggleSidebar: () => void
  login: () => void
  logout: () => void
}

const defaultUser: User = {
  id: 'a1b2c3d4-0000-0000-0000-000000000006',
  name: '林雅婷',
  department: '产品部',
  role: 'employee',
}

const adminUser: User = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  name: '王慧敏',
  department: '人力资源部',
  role: 'admin',
}

export const useAppStore = create<AppState>((set, get) => ({
  user: defaultUser,
  adminMode: false,
  sidebarCollapsed: false,
  setAdminMode: (value) => set({ adminMode: value, user: value ? adminUser : defaultUser }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  login: () => set({ user: defaultUser }),
  logout: () => set({ user: null }),
}))
