import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  MapPin,
  User,
  Users,
  Clock,
  Mic2,
  Workflow,
  MessageCircleHeart,
  GraduationCap,
  CheckCircle,
  XCircle,
  ChevronRight,
  CalendarX,
  CalendarCheck2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import type { Activity, ActivityType, ActivityRegistration } from '../../shared/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

const typeConfig: Record<
  ActivityType,
  { label: string; icon: typeof Mic2; gradient: string; badge: string }
> = {
  lecture: {
    label: '讲座',
    icon: Mic2,
    gradient: 'from-rose-200 via-rose-300 to-rose-400',
    badge: 'bg-rose-100 text-rose-600 border-rose-200',
  },
  workshop: {
    label: '工作坊',
    icon: Workflow,
    gradient: 'from-lavender-200 via-lavender-300 to-lavender-400',
    badge: 'bg-lavender-100 text-lavender-600 border-lavender-200',
  },
  consultation: {
    label: '咨询',
    icon: MessageCircleHeart,
    gradient: 'from-sage-200 via-sage-300 to-sage-400',
    badge: 'bg-sage-100 text-sage-600 border-sage-200',
  },
  course: {
    label: '课程',
    icon: GraduationCap,
    gradient: 'from-sunset-200 via-sunset-300 to-sunset-400',
    badge: 'bg-sunset-100 text-sunset-600 border-sunset-200',
  },
}

type TabKey = 'registered' | 'attended' | 'cancelled'

type MyActivityItem = {
  activity: Activity
  registration: ActivityRegistration
}

const tabs: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'registered', label: '已报名', icon: CalendarCheck2 },
  { key: 'attended', label: '已参加', icon: CheckCircle },
  { key: 'cancelled', label: '已取消', icon: CalendarX },
]

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekday = weekdays[d.getDay()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return {
    date: `${year}年${month}月${day}日`,
    shortDate: `${month}月${day}日`,
    weekday,
    time: `${hh}:${mm}`,
    full: `${year}年${month}月${day}日 ${weekday} ${hh}:${mm}`,
  }
}

export default function MyActivities() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('registered')
  const [items, setItems] = useState<MyActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/activities/my?userId=${user.id}`)
        const json = await res.json()
        if (json.success) {
          setItems(json.data || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const handleCancel = async (activityId: string) => {
    if (!user) return
    if (!confirm('确定要取消报名吗？')) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/activities/${activityId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (json.success) {
        setItems((prev) =>
          prev.map((it) =>
            it.activity.id === activityId
              ? { ...it, registration: { ...it.registration, status: 'cancelled' } }
              : it,
          ),
        )
      } else {
        alert(json.error || '取消失败')
      }
    } catch (e) {
      alert('取消失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = items.filter((it) => {
    const s = it.registration.status
    if (activeTab === 'registered') return s === 'registered'
    if (activeTab === 'attended') return s === 'attended'
    return s === 'cancelled'
  })

  const stats = {
    registered: items.filter((i) => i.registration.status === 'registered').length,
    attended: items.filter((i) => i.registration.status === 'attended').length,
    cancelled: items.filter((i) => i.registration.status === 'cancelled').length,
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-clay-500 hover:text-rose-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        返回活动列表
      </button>

      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-sage-50 via-warm-50 to-rose-50 border border-sage-100/60">
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-gradient-to-br from-sage-200/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-gradient-to-tr from-rose-200/40 to-transparent blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center shadow-lg shadow-sage-200/60">
                <CalendarDays className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-clay-900">我的活动</h1>
            </div>
            <p className="text-clay-600 text-base leading-relaxed max-w-2xl">
              查看你报名参加的所有活动，记录每一次成长的足迹。
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {tabs.map((t) => {
              const count =
                t.key === 'registered'
                  ? stats.registered
                  : t.key === 'attended'
                    ? stats.attended
                    : stats.cancelled
              return (
                <div
                  key={t.key}
                  className="text-center px-5 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white shadow-sm min-w-[90px]"
                >
                  <div className="text-2xl font-bold text-sage-500">{count}</div>
                  <div className="text-xs text-clay-500 mt-1">{t.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 rounded-2xl bg-clay-50 border border-clay-100 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
              activeTab === t.key
                ? 'bg-white text-sage-600 shadow-md shadow-sage-100/60'
                : 'text-clay-500 hover:text-clay-700 hover:bg-white/50',
            )}
          >
            <t.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
            {t.label}
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-bold',
                activeTab === t.key ? 'bg-sage-100 text-sage-600' : 'bg-clay-100 text-clay-500',
              )}
            >
              {t.key === 'registered'
                ? stats.registered
                : t.key === 'attended'
                  ? stats.attended
                  : stats.cancelled}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-3xl bg-clay-50 animate-pulse stagger-enter"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-clay-200 bg-white/50 p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-clay-100 to-warm-100 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-clay-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clay-800">
              {activeTab === 'registered' && '暂无报名中的活动'}
              {activeTab === 'attended' && '暂无已参加的活动'}
              {activeTab === 'cancelled' && '暂无已取消的活动'}
            </h3>
            <p className="text-sm text-clay-500 mt-2">
              <Link to="/activities" className="text-rose-500 hover:underline">
                去活动中心看看 →
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            const { activity, registration } = item
            const cfg = typeConfig[activity.type]
            const Icon = cfg.icon
            const dt = formatDateTime(activity.startTime)
            const endDt = formatDateTime(activity.endTime)
            const regDt = formatDateTime(registration.registeredAt)
            const isPast = new Date(activity.startTime) < new Date()
            const canCancel = registration.status === 'registered' && !isPast
            const capacityPercent = Math.min(
              100,
              Math.round((activity.registered / activity.capacity) * 100),
            )

            const statusLabel =
              registration.status === 'registered'
                ? isPast
                  ? '待回顾'
                  : '待参加'
                : registration.status === 'attended'
                  ? '已参加'
                  : '已取消'
            const statusClass =
              registration.status === 'registered'
                ? isPast
                  ? 'bg-warm-100 text-warm-500 border-warm-200'
                  : 'bg-sage-100 text-sage-600 border-sage-200'
                : registration.status === 'attended'
                  ? 'bg-lavender-100 text-lavender-600 border-lavender-200'
                  : 'bg-clay-100 text-clay-500 border-clay-200'

            return (
              <div
                key={`${registration.id}-${activity.id}`}
                className="stagger-enter group relative rounded-3xl bg-white border border-clay-100 overflow-hidden card-hover"
                style={{ animationDelay: `${(idx % 10) * 0.08}s` }}
              >
                <Link
                  to={`/activities/${activity.id}`}
                  className="block p-6 lg:p-7"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div
                      className={cn(
                        'lg:w-28 lg:shrink-0 flex lg:flex-col items-center gap-4 lg:gap-3 p-4 lg:p-5 rounded-2xl bg-gradient-to-br',
                        cfg.gradient,
                      )}
                    >
                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-white">
                        <Icon className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2} />
                      </div>
                      <div className="text-center text-white lg:mt-1">
                        <div className="text-2xl lg:text-3xl font-bold leading-none">
                          {dt.shortDate.split('月')[1]?.replace('日', '')}
                        </div>
                        <div className="text-xs opacity-90 mt-1.5">
                          {dt.shortDate.split('月')[0]}月
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col lg:flex-row lg:items-center gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                              cfg.badge,
                            )}
                          >
                            {cfg.label}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                              statusClass,
                            )}
                          >
                            {registration.status === 'registered' && !isPast && (
                              <CalendarCheck2 className="w-3 h-3" strokeWidth={2.2} />
                            )}
                            {registration.status === 'attended' && (
                              <CheckCircle className="w-3 h-3" strokeWidth={2.2} />
                            )}
                            {registration.status === 'cancelled' && (
                              <XCircle className="w-3 h-3" strokeWidth={2.2} />
                            )}
                            {statusLabel}
                          </span>
                        </div>
                        <h3 className="text-lg lg:text-xl font-bold text-clay-800 mb-3 group-hover:text-rose-500 transition-colors leading-snug line-clamp-2">
                          {activity.title}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-5 text-xs text-clay-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                            <span>
                              {dt.weekday} {dt.time} - {endDt.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                            <span className="line-clamp-1">{activity.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                            <span className="line-clamp-1">{activity.speaker}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                            <span>
                              {activity.registered}/{activity.capacity} 人报名
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-[11px] text-clay-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3 h-3" strokeWidth={1.8} />
                            <span>报名于 {regDt.shortDate} {regDt.time}</span>
                          </div>
                          <div className="w-28 h-1.5 rounded-full bg-clay-100 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                'bg-gradient-to-r from-sage-300 to-sage-500',
                              )}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex lg:flex-col items-center gap-3 lg:min-w-[140px]">
                        {canCancel ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleCancel(activity.id)
                            }}
                            disabled={submitting}
                            className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-clay-200 text-clay-600 text-sm font-medium hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-60"
                          >
                            <CalendarX className="w-4 h-4" strokeWidth={1.8} />
                            {submitting ? '处理中...' : '取消报名'}
                          </button>
                        ) : (
                          <div className="flex-1 lg:w-full" />
                        )}
                        <div className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-100 to-lavender-100 text-rose-600 text-sm font-medium group-hover:shadow-md group-hover:shadow-rose-100/50 transition-all">
                          查看详情
                          <ChevronRight className="w-4 h-4" strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
