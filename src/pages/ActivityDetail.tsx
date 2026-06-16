import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  MapPin,
  User,
  Users,
  Clock,
  ArrowLeft,
  Mic2,
  Workflow,
  MessageCircleHeart,
  GraduationCap,
  CheckCircle,
  XCircle,
  Share2,
  Heart,
  ChevronRight,
  Sparkles,
  Tag,
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

function calcDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (mins === 0) return `${hours} 小时`
  if (hours === 0) return `${mins} 分钟`
  return `${hours} 小时 ${mins} 分钟`
}

type ActivityDetailData = Activity & {
  registeredCount: number
  myRegistration: ActivityRegistration | null
  relatedActivities?: Activity[]
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [activity, setActivity] = useState<ActivityDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (user) params.set('userId', user.id)
        const res = await fetch(`/api/activities/${id}?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setActivity(json.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user])

  const handleRegister = async () => {
    if (!user || !activity) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (json.success) {
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                registeredCount: prev.registeredCount + 1,
                myRegistration: json.data,
              }
            : null,
        )
      } else {
        alert(json.error || '报名失败')
      }
    } catch (e) {
        alert('报名失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!user || !activity) return
    if (!confirm('确定要取消报名吗？')) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (json.success) {
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                registeredCount: Math.max(0, prev.registeredCount - 1),
                myRegistration: null,
              }
            : null,
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-72 rounded-3xl bg-clay-50 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-40 rounded-3xl bg-clay-50 animate-pulse" />
            <div className="h-64 rounded-3xl bg-clay-50 animate-pulse" />
          </div>
          <div className="h-96 rounded-3xl bg-clay-50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="rounded-3xl border border-dashed border-clay-200 bg-white/50 p-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-100 to-lavender-100 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-rose-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-clay-800">活动不存在</h3>
          <p className="text-sm text-clay-500 mt-2">
            <Link to="/activities" className="text-rose-500 hover:underline">
              返回活动列表
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const cfg = typeConfig[activity.type]
  const Icon = cfg.icon
  const startDt = formatDateTime(activity.startTime)
  const endDt = formatDateTime(activity.endTime)
  const duration = calcDuration(activity.startTime, activity.endTime)
  const capacityPercent = Math.min(
    100,
    Math.round((activity.registeredCount / activity.capacity) * 100),
  )
  const remaining = activity.capacity - activity.registeredCount
  const isTight = remaining > 0 && remaining <= Math.ceil(activity.capacity * 0.2)
  const isFull = activity.registeredCount >= activity.capacity
  const isPast = new Date(activity.startTime) < new Date()
  const isRegistered = !!activity.myRegistration

  const relatedActivities = activity.relatedActivities || []

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-clay-500 hover:text-rose-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        返回活动列表
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-clay-100">
        <div className={cn('relative h-64 md:h-72 bg-gradient-to-br overflow-hidden', cfg.gradient)}>
          <div className="absolute inset-0">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative z-10 h-full p-8 flex flex-col justify-between text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/25 border-white/30',
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {cfg.label}
                </span>
                {isRegistered && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-sage-600 border border-white shadow-sm ml-2">
                    <CheckCircle className="w-4 h-4" strokeWidth={2.2} />
                    已报名成功
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLiked(!liked)}
                  className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Heart
                    className={cn('w-5 h-5', liked ? 'fill-rose-500 text-rose-500' : '')}
                    strokeWidth={2}
                  />
                </button>
                <button className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Share2 className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-sm leading-tight mb-4">
                {activity.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm opacity-95">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4.5 h-4.5" strokeWidth={1.8} />
                  {startDt.full}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5" strokeWidth={1.8} />
                  约 {duration}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 stagger-enter">
          <div className="rounded-3xl bg-white border border-clay-100 p-7 card-hover">
            <h2 className="text-lg font-bold text-clay-800 flex items-center gap-3 mb-5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400" />
              活动介绍
            </h2>
            <div className="space-y-4 text-clay-600 leading-relaxed">
              <p className="text-base">{activity.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-warm-50 border border-rose-100/60">
                  <div className="flex items-center gap-2 text-rose-500 mb-2">
                    <Sparkles className="w-5 h-5" strokeWidth={2} />
                    <h4 className="font-semibold">你将收获</h4>
                  </div>
                  <ul className="space-y-1.5 text-sm text-clay-600 mt-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>系统的{cfg.label}主题知识</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>专业讲师现场答疑解惑</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>实用可落地的实践方法</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>同路人交流社群</span>
                    </li>
                  </ul>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-lavender-50 to-rose-50 border border-lavender-100/60">
                  <div className="flex items-center gap-2 text-lavender-600 mb-2">
                    <Users className="w-5 h-5" strokeWidth={2} />
                    <h4 className="font-semibold">适合人群</h4>
                  </div>
                  <ul className="space-y-1.5 text-sm text-clay-600 mt-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>关注自身身心健康的员工</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>希望学习实用技巧与方法</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>愿意参与现场互动交流</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                      <span>能够全程参与不中途离场</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-clay-100 p-7 card-hover">
            <h2 className="text-lg font-bold text-clay-800 flex items-center gap-3 mb-5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-lavender-400 to-sage-400" />
              讲师介绍
            </h2>
            <div className="flex items-start gap-5">
              <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-200 via-lavender-200 to-sage-200 flex items-center justify-center shadow-md">
                <User className="w-10 h-10 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-clay-800 mb-1">{activity.speaker}</h3>
                <div className="flex flex-wrap gap-1.5 my-3">
                  {activity.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-clay-50 text-clay-600 text-xs border border-clay-100">
                      <Tag className="w-3 h-3" strokeWidth={2} />
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-clay-600 leading-relaxed">
                  拥有丰富的{cfg.label}经验，深耕相关领域多年，擅长将专业知识转化为通俗易懂的语言，
                  帮助众多参与者解决实际问题，获得一致好评。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-clay-100 p-7 card-hover">
            <h2 className="text-lg font-bold text-clay-800 flex items-center gap-3 mb-5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sage-400 to-sunset-400" />
              活动日程
            </h2>
            <div className="relative pl-8 space-y-5">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-sage-300 via-rose-300 to-lavender-300 rounded-full" />
              {[
                { time: '签到入场', desc: '到场签到，领取活动资料包，就座准备' },
                { time: '开场介绍', desc: '主持人开场，介绍活动背景与讲师' },
                { time: '主题分享', desc: '核心内容讲解，案例分析与互动' },
                { time: '茶歇交流', desc: '中场休息，自由交流与茶点' },
                { time: '互动问答', desc: '现场提问，讲师答疑解惑' },
                { time: '活动结束', desc: '合影留念，资料发放' },
              ].map((item, idx) => (
                <div key={idx} className="stagger-enter" style={{ animationDelay: `${idx * 0.06}s` }}>
                  <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-lavender-400 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    {idx + 1}
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-clay-50/80 to-rose-50/50 border border-clay-100 p-4">
                    <h4 className="font-semibold text-clay-800 text-sm mb-1">{item.time}</h4>
                    <p className="text-sm text-clay-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="lg:sticky lg:top-6 space-y-5">
            <div className="rounded-3xl bg-white border border-clay-100 p-6 shadow-sm shadow-clay-100/60 overflow-hidden">
              <h3 className="text-base font-bold text-clay-800 mb-5 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-500" strokeWidth={2} />
                活动信息
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center mt-0.5">
                    <CalendarDays className="w-4.5 h-4.5 text-rose-500" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-xs text-clay-400 mb-1">活动时间</div>
                    <div className="text-sm font-semibold text-clay-700">
                      {startDt.shortDate} {startDt.weekday}
                    </div>
                    <div className="text-xs text-clay-500 mt-0.5">
                      {startDt.time} - {endDt.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-lavender-50 flex items-center justify-center mt-0.5">
                    <MapPin className="w-4.5 h-4.5 text-lavender-500" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-xs text-clay-400 mb-1">活动地点</div>
                    <div className="text-sm font-semibold text-clay-700">{activity.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center mt-0.5">
                    <Clock className="w-4.5 h-4.5 text-sage-500" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-xs text-clay-400 mb-1">活动时长</div>
                    <div className="text-sm font-semibold text-clay-700">约 {duration}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-sunset-50 flex items-center justify-center mt-0.5">
                    <Users className="w-4.5 h-4.5 text-sunset-500" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <div className="text-xs text-clay-400 mb-1">名额情况</div>
                        <div className="text-sm font-semibold text-clay-700">
                          {activity.registeredCount} / {activity.capacity} 人
                        </div>
                      </div>
                      {!isPast && !isFull && (
                        <div
                          className={cn(
                            'text-xs font-bold',
                            isTight ? 'text-rose-500' : 'text-sage-500',
                          )}
                        >
                          {isTight ? `仅剩 ${remaining} 名!` : `余 ${remaining} 名`}
                        </div>
                      )}
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-clay-100 overflow-hidden mt-1.5">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          isFull
                            ? 'bg-clay-400'
                            : isTight
                              ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                              : 'bg-gradient-to-r from-sage-300 to-sage-500',
                        )}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-5 mt-5 border-t border-clay-100">
                {isPast ? (
                  <div className="w-full py-3.5 rounded-2xl bg-clay-100 text-clay-400 text-center font-semibold text-sm">
                    活动已结束
                  </div>
                ) : isRegistered ? (
                  <div className="space-y-3">
                    <div className="w-full py-3.5 rounded-2xl bg-sage-50 border border-sage-200 text-sage-600 text-center font-bold text-sm flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" strokeWidth={2.2} />
                      您已成功报名
                    </div>
                    {activity.myRegistration && (
                      <button
                        onClick={handleCancel}
                        disabled={submitting}
                        className="w-full py-3 rounded-2xl border border-clay-200 text-clay-600 text-center text-sm font-medium hover:bg-clay-50 hover:border-clay-300 transition-all disabled:opacity-60"
                      >
                        {submitting ? '处理中...' : '取消报名'}
                      </button>
                    )}
                  </div>
                ) : isFull ? (
                  <div className="w-full py-3.5 rounded-2xl bg-clay-100 text-clay-500 text-center font-semibold text-sm">
                    名额已满
                  </div>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-rose-200/60"
                    style={{
                      background: 'linear-gradient(135deg, #E8B4B8 0%, #B55359 100%)',
                    }}
                  >
                    {submitting ? '报名中...' : '立即报名参加'}
                  </button>
                )}
              </div>
            </div>

            {relatedActivities.length > 0 && (
              <div className="rounded-3xl bg-white border border-clay-100 p-6">
              <h3 className="text-base font-bold text-clay-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lavender-500" strokeWidth={2} />
                  相关推荐
                </span>
              </h3>
              <div className="space-y-3">
                {relatedActivities.map((r) => {
                  const rcfg = typeConfig[r.type]
                  const RIcon = rcfg.icon
                  const rdt = formatDateTime(r.startTime)
                  return (
                    <Link
                    key={r.id}
                    to={`/activities/${r.id}`}
                    className="group block p-4 rounded-2xl border border-clay-50 hover:bg-clay-50 transition-all hover:border-clay-200"
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                            rcfg.gradient,
                          )}
                        >
                          <RIcon className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-clay-800 text-sm mb-1 line-clamp-2 group-hover:text-rose-500 transition-colors">
                            {r.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-clay-400 mt-1">
                            <CalendarDays className="w-3 h-3" strokeWidth={2} />
                            <span>{rdt.shortDate} {rdt.weekday}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-clay-300 group-hover:text-rose-500 shrink-0 mt-2" strokeWidth={2} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
