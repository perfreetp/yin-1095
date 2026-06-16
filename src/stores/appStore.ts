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
  id: 'employee-001',
  name: '林雅婷',
  department: '产品部',
  role: 'employee',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=employee-001',
}

const adminUser: User = {
  id: 'admin-001',
  name: '王慧敏',
  department: '人力资源部',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin-001',
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
