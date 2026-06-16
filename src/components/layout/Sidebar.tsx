import { NavLink } from 'react-router-dom'
import {
  Home,
  ClipboardList,
  HeartPulse,
  CalendarDays,
  BookOpen,
  HandHeart,
  MessageSquareHeart,
  BarChart3,
  CalendarCog,
  Inbox,
  Flower2,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const employeeNavItems: NavItem[] = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/assessment', label: '健康自测', icon: ClipboardList },
  { to: '/care-plan', label: '关怀计划', icon: HeartPulse },
  { to: '/activities', label: '活动中心', icon: CalendarDays },
  { to: '/resources', label: '资源中心', icon: BookOpen },
  { to: '/care-channel', label: '关怀通道', icon: HandHeart },
  { to: '/feedback', label: '意见反馈', icon: MessageSquareHeart },
]

const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: '数据看板', icon: BarChart3 },
  { to: '/admin/activities', label: '活动管理', icon: CalendarCog },
  { to: '/admin/feedback', label: '反馈审阅', icon: Inbox },
]

export default function Sidebar() {
  const { user, adminMode, sidebarCollapsed, setAdminMode, toggleSidebar } = useAppStore()

  const navItems = adminMode ? adminNavItems : employeeNavItems

  return (
    <aside
      className={`relative flex flex-col bg-warm-50 border-r border-clay-100 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20' : 'w-[260px]'
      }`}
      style={{ boxShadow: '4px 0 20px -4px rgba(143, 109, 95, 0.12)' }}
    >
      <div className="flex items-center h-20 px-5 border-b border-clay-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-300 via-rose-400 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-200/60 shrink-0">
            <Flower2 className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-clay-800 leading-tight">悦享·她健康</span>
              <span className="text-xs text-clay-400">员工关怀平台</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-5 overflow-y-auto px-3">
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-clay-400 uppercase tracking-wider">
              {adminMode ? '管理功能' : '功能导航'}
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 font-semibold'
                    : 'text-clay-600 hover:bg-rose-50/60 hover:text-rose-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-gradient-to-b from-rose-400 to-rose-500" />
                  )}
                  <item.icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                      !sidebarCollapsed ? 'group-hover:scale-110' : ''
                    }`}
                    strokeWidth={1.8}
                  />
                  {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-clay-100 space-y-3">
        {user && (
          <div
            className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-rose-50 to-warm-100/60 border border-rose-100/60 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-rose-200 to-lavender-200 flex items-center justify-center shadow-sm">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <User className={`w-5 h-5 text-rose-500 ${user.avatar ? 'hidden' : ''}`} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-sage-400 border-2 border-warm-50" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-clay-800 truncate">{user.name}</div>
                <div className="text-xs text-clay-500 truncate">
                  {typeof user.department === 'string'
                    ? user.department
                    : (user.department as { name: string }).name}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-clay-100 ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              adminMode
                ? 'bg-gradient-to-br from-lavender-400 to-lavender-500 text-white shadow-md shadow-lavender-200/50'
                : 'bg-clay-100 text-clay-500'
            }`}
          >
            <Shield className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1">
              <div className="text-xs text-clay-500 mb-1">
                {adminMode ? '管理员模式' : '员工模式'}
              </div>
              <button
                onClick={() => setAdminMode(!adminMode)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                  adminMode ? 'bg-lavender-400' : 'bg-clay-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    adminMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-clay-500 hover:bg-clay-100 hover:text-clay-700 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4.5 h-4.5" strokeWidth={2} />
          ) : (
            <>
              <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
              <span className="text-xs font-medium">收起侧边栏</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
