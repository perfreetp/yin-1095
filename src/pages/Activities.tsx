import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  CalendarDays,
  MapPin,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Mic2,
  Workflow,
  MessageCircleHeart,
  GraduationCap,
  Clock,
  Filter,
  Tag,
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import type { Activity, ActivityType } from '../../shared/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

const typeConfig: Record<
  ActivityType,
  { label: string; icon: typeof Mic2; gradient: string; badge: string; text: string }
> = {
  lecture: {
    label: '讲座',
    icon: Mic2,
    gradient: 'from-rose-200 via-rose-300 to-rose-400',
    badge: 'bg-rose-100 text-rose-600 border-rose-200',
    text: 'text-rose-600',
  },
  workshop: {
    label: '工作坊',
    icon: Workflow,
    gradient: 'from-lavender-200 via-lavender-300 to-lavender-400',
    badge: 'bg-lavender-100 text-lavender-600 border-lavender-200',
    text: 'text-lavender-600',
  },
  consultation: {
    label: '咨询',
    icon: MessageCircleHeart,
    gradient: 'from-sage-200 via-sage-300 to-sage-400',
    badge: 'bg-sage-100 text-sage-600 border-sage-200',
    text: 'text-sage-600',
  },
  course: {
    label: '课程',
    icon: GraduationCap,
    gradient: 'from-sunset-200 via-sunset-300 to-sunset-400',
    badge: 'bg-sunset-100 text-sunset-600 border-sunset-200',
    text: 'text-sunset-600',
  },
}

const typeFilters: { key: 'all' | ActivityType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'lecture', label: '讲座' },
  { key: 'workshop', label: '工作坊' },
  { key: 'consultation', label: '咨询' },
  { key: 'course', label: '课程' },
]

const timeFilters = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
]

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekday = weekdays[d.getDay()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return {
    date: `${month}月${day}日`,
    weekday,
    time: `${hh}:${mm}`,
    full: `${month}月${day}日 ${weekday} ${hh}:${mm}`,
  }
}

export default function Activities() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const pageSize = 9

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, timeFilter, debouncedKeyword])

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (typeFilter !== 'all') params.set('type', typeFilter)
        if (debouncedKeyword) params.set('keyword', debouncedKeyword)
        if (timeFilter !== 'all') {
          const now = new Date()
          if (timeFilter === 'week') {
            const weekEnd = new Date(now)
            weekEnd.setDate(now.getDate() + 7)
            params.set('status', 'upcoming')
          } else if (timeFilter === 'month') {
            const monthEnd = new Date(now)
            monthEnd.setDate(now.getDate() + 30)
            params.set('status', 'upcoming')
          }
        }
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const res = await fetch(`/api/activities?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          let list = json.data.list as Activity[]
          if (timeFilter === 'week') {
            const now = new Date()
            const weekEnd = new Date(now)
            weekEnd.setDate(now.getDate() + 7)
            list = list.filter((a) => {
              const t = new Date(a.startTime)
              return t >= now && t <= weekEnd
            })
          } else if (timeFilter === 'month') {
            const now = new Date()
            const monthEnd = new Date(now)
            monthEnd.setDate(now.getDate() + 30)
            list = list.filter((a) => {
              const t = new Date(a.startTime)
              return t >= now && t <= monthEnd
            })
          }
          setActivities(list)
          setTotal(json.data.total)
          setTotalPages(json.data.totalPages)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [typeFilter, timeFilter, debouncedKeyword, page])

  useEffect(() => {
    const fetchMy = async () => {
      if (!user) return
      try {
        const res = await fetch(`/api/activities/my?userId=${user.id}`)
        const json = await res.json()
        if (json.success) {
          const ids = new Set(
            (json.data as Array<{ registration: { status: string }; activity: { id: string } }>)
              .filter((x) => x.registration.status !== 'cancelled')
              .map((x) => x.activity.id),
          )
          setRegisteredIds(ids)
        }
      } catch (e) {
        // ignore
      }
    }
    fetchMy()
  }, [user])

  const handleRegister = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    try {
      const res = await fetch(`/api/activities/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (json.success) {
        setRegisteredIds((prev) => new Set(prev).add(id))
        setActivities((prev) =>
          prev.map((a) => (a.id === id ? { ...a, registered: a.registered + 1 } : a)),
        )
      } else {
        alert(json.error || '报名失败')
      }
    } catch (e) {
      alert('报名失败，请稍后重试')
    }
  }

  const stats = useMemo(() => {
    const upcoming = activities.filter((a) => new Date(a.startTime) > new Date()).length
    const available = activities.filter(
      (a) => a.registered < a.capacity && new Date(a.startTime) > new Date(),
    ).length
    return { upcoming, available }
  }, [activities])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-lavender-50 via-warm-50 to-rose-50 border border-lavender-100/60">
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-gradient-to-br from-lavender-200/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-gradient-to-tr from-rose-200/40 to-transparent blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-300 to-lavender-400 flex items-center justify-center shadow-lg shadow-lavender-200/60">
                <CalendarDays className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-clay-900">活动中心</h1>
            </div>
            <p className="text-clay-600 text-base leading-relaxed max-w-2xl">
              丰富的身心健康主题活动，专业讲师带来的干货分享，在学习与交流中遇见更好的自己。
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white shadow-sm">
              <div className="text-2xl font-bold text-lavender-500">{stats.upcoming}</div>
              <div className="text-xs text-clay-500 mt-1">近期活动</div>
            </div>
            <div className="text-center px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white shadow-sm">
              <div className="text-2xl font-bold text-rose-500">{stats.available}</div>
              <div className="text-xs text-clay-500 mt-1">可报名</div>
            </div>
            <Link
              to="/activities/my"
              className="text-center px-6 py-4 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-lg shadow-rose-200/50 hover:scale-105 transition-transform"
            >
              <div className="text-2xl font-bold">{registeredIds.size}</div>
              <div className="text-xs opacity-90 mt-1">已报名</div>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clay-400"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索活动名称、描述或标签..."
            className="w-full h-12 pl-12 pr-5 rounded-2xl border border-clay-100 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-clay-500">
          <Filter className="w-4 h-4" strokeWidth={1.8} />
          <span>筛选条件</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border',
                typeFilter === f.key
                  ? 'bg-lavender-500 text-white border-lavender-500 shadow-md shadow-lavender-200/50'
                  : 'bg-white text-clay-600 border-clay-100 hover:border-lavender-200 hover:text-lavender-600',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {timeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border',
                timeFilter === f.key
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200/50'
                  : 'bg-white text-clay-600 border-clay-100 hover:border-rose-200 hover:text-rose-500',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-3xl bg-clay-50 animate-pulse stagger-enter"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-clay-200 bg-white/50 p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-lavender-100 to-rose-100 flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-lavender-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clay-800">暂无符合条件的活动</h3>
            <p className="text-sm text-clay-500 mt-2">试试调整筛选条件，或稍后再来查看</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activities.map((act, idx) => {
            const cfg = typeConfig[act.type]
            const Icon = cfg.icon
            const dt = formatDateTime(act.startTime)
            const endDt = formatDateTime(act.endTime)
            const capacityPercent = Math.min(100, Math.round((act.registered / act.capacity) * 100))
            const remaining = act.capacity - act.registered
            const isTight = remaining > 0 && remaining <= Math.ceil(act.capacity * 0.2)
            const isFull = act.registered >= act.capacity
            const isPast = new Date(act.startTime) < new Date()
            const isRegistered = registeredIds.has(act.id)

            let btnText = '立即报名'
            let btnClass = 'bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:shadow-lg hover:shadow-rose-200/60'
            if (isPast) {
              btnText = '已结束'
              btnClass = 'bg-clay-100 text-clay-400 cursor-not-allowed'
            } else if (isRegistered) {
              btnText = '已报名 ✓'
              btnClass = 'bg-sage-100 text-sage-600 border border-sage-200'
            } else if (isFull) {
              btnText = '名额已满'
              btnClass = 'bg-clay-100 text-clay-500 cursor-not-allowed'
            }

            return (
              <Link
                key={act.id}
                to={`/activities/${act.id}`}
                className="stagger-enter group relative rounded-3xl bg-white border border-clay-100 overflow-hidden card-hover flex flex-col"
                style={{ animationDelay: `${(idx % 10) * 0.08}s` }}
              >
                <div className={cn('relative h-40 bg-gradient-to-br overflow-hidden', cfg.gradient)}>
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/40 blur-2xl" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/30 blur-xl" />
                  </div>
                  <div className="relative z-10 h-full p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm',
                          cfg.badge,
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                          {cfg.label}
                        </span>
                      </span>
                      {isRegistered && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-sage-600 border border-white shadow-sm">
                          已报名
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-white drop-shadow-sm">
                        <div className="text-3xl font-bold leading-none">{dt.date.split('月')[1]?.replace('日', '')}</div>
                        <div className="text-sm opacity-90 mt-0.5">{dt.date.split('月')[0]}月 · {dt.weekday}</div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white/25 backdrop-blur-md text-white text-xs font-medium border border-white/30">
                        {dt.time} - {endDt.time}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-bold text-clay-800 mb-2 group-hover:text-rose-500 transition-colors line-clamp-2 leading-snug">
                      {act.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-clay-500 mb-3">
                      <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                      <span className="line-clamp-1">{act.speaker}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {act.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-clay-50 text-clay-500 text-[11px] border border-clay-100"
                        >
                          <Tag className="w-3 h-3" strokeWidth={2} />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-clay-50">
                    <div className="flex items-center gap-1.5 text-xs text-clay-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                      <span className="line-clamp-1">{act.location}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-clay-500">
                          <Users className="w-3.5 h-3.5" strokeWidth={1.8} />
                          <span>
                            {act.registered}/{act.capacity} 人
                          </span>
                        </div>
                        {!isPast && !isFull && (
                          <span
                            className={cn(
                              'font-medium',
                              isTight ? 'text-rose-500' : 'text-sage-500',
                            )}
                          >
                            {isTight ? `仅剩 ${remaining} 个名额!` : `余 ${remaining} 个名额`}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-2 rounded-full bg-clay-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isFull
                              ? 'bg-clay-400'
                              : isTight
                                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                : 'bg-gradient-to-r from-sage-300 to-sage-400',
                          )}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      if (!isPast && !isFull && !isRegistered) {
                        handleRegister(act.id, e)
                      } else {
                        navigate(`/activities/${act.id}`)
                      }
                    }}
                    className={cn(
                      'w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 mt-auto',
                      btnClass,
                      !isPast && !isFull && !isRegistered
                        ? 'hover:scale-[1.02] active:scale-[0.98]'
                        : '',
                    )}
                    disabled={isPast || isFull}
                  >
                    {btnText}
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              page === 1
                ? 'text-clay-300 bg-clay-50 cursor-not-allowed'
                : 'text-clay-600 bg-white border border-clay-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200',
            )}
          >
            <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              const isCurrent = p === page
              const show =
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 1
              if (!show && Math.abs(p - page) === 2) {
                return (
                  <span
                    key={`dots-${p}`}
                    className="w-10 h-10 flex items-center justify-center text-clay-400 text-sm"
                  >
                    ...
                  </span>
                )
              }
              if (!show) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-sm font-medium transition-all',
                    isCurrent
                      ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-md shadow-rose-200/50'
                      : 'text-clay-600 bg-white border border-clay-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200',
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              page === totalPages
                ? 'text-clay-300 bg-clay-50 cursor-not-allowed'
                : 'text-clay-600 bg-white border border-clay-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200',
            )}
          >
            <ChevronRight className="w-4.5 h-4.5" strokeWidth={2} />
          </button>
          <span className="ml-4 text-xs text-clay-400">
            共 {total} 个活动 · 第 {page}/{totalPages} 页
          </span>
        </div>
      )}
    </div>
  )
}
