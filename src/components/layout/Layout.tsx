import { Outlet, useLocation, Link } from 'react-router-dom'
import { Search, Bell, ChevronRight, User, Home } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAppStore } from '@/stores/appStore'

const breadcrumbMap: Record<string, { label: string; path?: string }[]> = {
  '/': [{ label: '首页' }],
  '/assessment': [{ label: '健康自测' }],
  '/assessment/sleep': [
    { label: '健康自测', path: '/assessment' },
    { label: '睡眠评估' },
  ],
  '/assessment/menopause': [
    { label: '健康自测', path: '/assessment' },
    { label: '围绝经期评估' },
  ],
  '/care-plan': [{ label: '关怀计划' }],
  '/activities': [{ label: '活动中心' }],
  '/activities/my': [
    { label: '活动中心', path: '/activities' },
    { label: '我的活动' },
  ],
  '/resources': [{ label: '资源中心' }],
  '/care-channel': [{ label: '关怀通道' }],
  '/feedback': [{ label: '意见反馈' }],
  '/admin': [{ label: '管理中心' }],
  '/admin/dashboard': [
    { label: '管理中心', path: '/admin' },
    { label: '数据看板' },
  ],
  '/admin/activities': [
    { label: '管理中心', path: '/admin' },
    { label: '活动管理' },
  ],
  '/admin/feedback': [
    { label: '管理中心', path: '/admin' },
    { label: '反馈审阅' },
  ],
}

function getBreadcrumb(pathname: string) {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]

  const parts = pathname.split('/').filter(Boolean)

  if (parts[0] === 'assessment' && parts[1] === 'result') {
    return [
      { label: '健康自测', path: '/assessment' },
      { label: '评估结果' },
    ]
  }
  if (parts[0] === 'activities' && parts.length === 2) {
    return [
      { label: '活动中心', path: '/activities' },
      { label: '活动详情' },
    ]
  }
  if (parts[0] === 'resources' && parts.length === 2) {
    return [
      { label: '资源中心', path: '/resources' },
      { label: '资源详情' },
    ]
  }

  return [{ label: '首页', path: '/' }]
}

export default function Layout() {
  const { user } = useAppStore()
  const location = useLocation()
  const breadcrumbs = getBreadcrumb(location.pathname)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-warm-50 via-white to-rose-50/40">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-rose-200/30 via-lavender-200/20 to-transparent pointer-events-none -z-0" />
        <div className="absolute top-32 right-60 w-[300px] h-[300px] rounded-full bg-sunset-200/10 blur-3xl pointer-events-none -z-0" />

        <header className="relative z-10 h-20 px-8 flex items-center justify-between border-b border-clay-100/60 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-clay-500 hover:text-rose-500 transition-colors"
              >
                <Home className="w-4 h-4" strokeWidth={1.8} />
                <span className="font-medium">首页</span>
              </Link>
              {breadcrumbs.map((item, idx) => {
                if (idx === 0 && item.path === '/') return null
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-clay-300" strokeWidth={2} />
                    {item.path ? (
                      <Link
                        to={item.path}
                        className="text-clay-500 hover:text-rose-500 transition-colors font-medium"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-clay-800 font-semibold">{item.label}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-400"
                strokeWidth={1.8}
              />
              <input
                type="text"
                placeholder="搜索内容、活动、资源..."
                className="w-80 h-11 pl-11 pr-5 rounded-xl border border-clay-100 bg-white/80 text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
              />
            </div>

            <button className="relative w-11 h-11 rounded-xl border border-clay-100 bg-white/80 flex items-center justify-center text-clay-500 hover:text-rose-500 hover:bg-rose-50 transition-all group">
              <Bell className="w-5 h-5" strokeWidth={1.8} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
            </button>

            <div className="h-8 w-px bg-clay-100" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-clay-800">{user?.name}</div>
                <div className="text-xs text-clay-500">
                  {user &&
                    (typeof user.department === 'string'
                      ? user.department
                      : (user.department as { name: string }).name)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-rose-200 to-lavender-200 flex items-center justify-center shadow-sm ring-2 ring-white">
                {user?.avatar ? (
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
                <User className={`w-5 h-5 text-rose-500 ${user?.avatar ? 'hidden' : ''}`} />
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto">
          <div className="relative">
            <div className="absolute top-0 left-8 right-8 h-32 bg-gradient-to-b from-rose-100/30 via-lavender-100/10 to-transparent pointer-events-none" />
            <div className="relative px-8 py-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
