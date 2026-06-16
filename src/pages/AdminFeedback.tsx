import { useCallback, useEffect, useState } from 'react'
import {
  MessageSquare,
  Clock,
  Star,
  CheckCircle2,
  CheckSquare,
  Eye,
  Filter,
  RefreshCw,
  SmilePlus,
  Lightbulb,
  Heart,
  ShieldCheck,
} from 'lucide-react'
import type { Feedback, FeedbackCategory, FeedbackStatus } from 'shared/types'
import { cn } from '@/lib/utils'

interface FeedbackListResponse {
  list: Feedback[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const categoryConfig: Record<FeedbackCategory, { label: string; icon: typeof SmilePlus; className: string; bgClass: string }> = {
  satisfaction: {
    label: '满意度',
    icon: SmilePlus,
    className: 'bg-sage-100 text-sage-700 border-sage-200',
    bgClass: 'from-sage-50/50 to-white',
  },
  suggestion: {
    label: '建议',
    icon: Lightbulb,
    className: 'bg-sunset-100 text-sunset-700 border-sunset-200',
    bgClass: 'from-sunset-50/50 to-white',
  },
  experience: {
    label: '体验',
    icon: Heart,
    className: 'bg-lavender-100 text-lavender-700 border-lavender-200',
    bgClass: 'from-lavender-50/50 to-white',
  },
}

const statusConfig: Record<FeedbackStatus, { label: string; dotClass: string; textClass: string }> = {
  pending: { label: '待处理', dotClass: 'bg-rose-500', textClass: 'text-rose-600' },
  reviewed: { label: '已审阅', dotClass: 'bg-sunset-500', textClass: 'text-sunset-600' },
  resolved: { label: '已解决', dotClass: 'bg-sage-500', textClass: 'text-sage-600' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60))
      return `${mins}分钟前`
    }
    return `${hours}小时前`
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4 transition-colors',
            i < value
              ? 'fill-sunset-400 text-sunset-400'
              : 'text-clay-200',
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [stats, setStats] = useState({ total: 0, pending: 0, avgSatisfaction: 0 })
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (feedback.length > 0) {
      const total = totalCount || feedback.length
      const pending = feedback.filter((f) => f.status === 'pending').length
      let totalRatings = 0
      let count = 0
      feedback.forEach((f) => {
        Object.values(f.ratings).forEach((r) => {
          totalRatings += r
          count++
        })
      })
      const avg = count > 0 ? Number((totalRatings / count).toFixed(1)) : 0
      setStats({ total, pending, avgSatisfaction: avg })
    }
  }, [feedback, totalCount])

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('pageSize', '50')
      const res = await fetch(`/api/admin/feedback?${params.toString()}`).then((r) => r.json())
      if (res.success) {
        const data: FeedbackListResponse = res.data
        setFeedback(data.list)
        setTotalCount(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  async function updateStatus(id: string, status: FeedbackStatus) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json())
      if (res.success) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status } : f)),
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const statCards = [
    {
      title: '总反馈数',
      value: stats.total,
      icon: MessageSquare,
      color: 'lavender',
      suffix: '条',
    },
    {
      title: '待处理',
      value: stats.pending,
      icon: Clock,
      color: 'rose',
      suffix: '条',
    },
    {
      title: '满意度平均分',
      value: stats.avgSatisfaction,
      icon: Star,
      color: 'sunset',
      suffix: '/ 5',
    },
  ]

  const statColorClasses: Record<string, string> = {
    lavender: 'from-lavender-50 to-lavender-100/60 text-lavender-500 border-lavender-100',
    rose: 'from-rose-50 to-rose-100/60 text-rose-500 border-rose-100',
    sunset: 'from-sunset-50 to-sunset-100/60 text-sunset-500 border-sunset-100',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-clay-900">反馈审阅</h1>
          <p className="text-clay-500 mt-1 flex items-center gap-2">
            查看和处理员工反馈
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sage-50 text-sage-600 text-xs font-medium border border-sage-100">
              <ShieldCheck className="w-3 h-3" strokeWidth={2} />
              所有反馈完全匿名
            </span>
          </p>
        </div>
        <button
          onClick={fetchFeedback}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay-50 text-clay-600 font-medium text-sm hover:bg-clay-100 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} strokeWidth={1.8} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br backdrop-blur-sm border p-6 shadow-sm hover:shadow-md transition-all',
                statColorClasses[card.color],
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-clay-500 font-medium">{card.title}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-clay-900">{card.value}</span>
                    <span className="text-clay-500 text-lg">{card.suffix}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm">
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </div>
              </div>
              <div className="absolute -bottom-0 -right-0 w-32 h-32 rounded-full bg-gradient-to-tl from-white/40 to-transparent pointer-events-none" />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-clay-500 font-medium">
          <Filter className="w-4 h-4" strokeWidth={1.8} />
          筛选：
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-clay-400">分类</span>
          <div className="flex items-center gap-1.5">
            {(['all', 'satisfaction', 'suggestion', 'experience'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                  filterCategory === cat
                    ? 'bg-gradient-to-r from-rose-500 to-lavender-500 text-white shadow-sm'
                    : 'bg-clay-50 text-clay-600 hover:bg-clay-100',
                )}
              >
                {cat === 'all' ? '全部' : categoryConfig[cat].label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-6 w-px bg-clay-200 mx-2" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-clay-400">状态</span>
          <div className="flex items-center gap-1.5">
            {(['all', 'pending', 'reviewed', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                  filterStatus === st
                    ? 'bg-gradient-to-r from-rose-500 to-lavender-500 text-white shadow-sm'
                    : 'bg-clay-50 text-clay-600 hover:bg-clay-100',
                )}
              >
                {st === 'all' ? '全部' : statusConfig[st].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-clay-400">
          共 {totalCount} 条反馈
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sage-100 to-rose-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-sage-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-clay-700">暂无反馈数据</h3>
            <p className="text-sm text-clay-500 mt-2">尝试调整筛选条件查看更多结果</p>
          </div>
        ) : (
          feedback.map((item) => {
            const catCfg = categoryConfig[item.category]
            const stCfg = statusConfig[item.status]
            const CatIcon = catCfg.icon
            const isUpdating = updatingId === item.id
            const ratingEntries = Object.entries(item.ratings)
            const avgRating =
              ratingEntries.length > 0
                ? ratingEntries.reduce((sum, [, v]) => sum + v, 0) / ratingEntries.length
                : 0

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-2xl border border-clay-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all',
                  'bg-gradient-to-br',
                  catCfg.bgClass,
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center border flex-shrink-0',
                    catCfg.className,
                  )}>
                    <CatIcon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border',
                          catCfg.className,
                        )}>
                          {catCfg.label}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', stCfg.dotClass)} />
                          <span className={cn('text-xs font-medium', stCfg.textClass)}>
                            {stCfg.label}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StarRating value={Math.round(avgRating)} />
                          <span className="text-xs text-clay-400 font-medium ml-1">
                            {avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-clay-400 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                        {formatDate(item.submittedAt)}
                      </div>
                    </div>

                    <p className="text-sm text-clay-700 leading-relaxed mb-4">
                      {item.content}
                    </p>

                    {ratingEntries.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl bg-white/60 border border-clay-50">
                        {ratingEntries.map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between gap-3">
                            <span className="text-xs text-clay-500 font-medium truncate">{key}</span>
                            <StarRating value={value} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      {item.status !== 'reviewed' && item.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(item.id, 'reviewed')}
                          disabled={isUpdating}
                          className={cn(
                            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60',
                            'bg-sunset-50 text-sunset-700 border border-sunset-200 hover:bg-sunset-100',
                          )}
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.8} />
                          标记已审阅
                        </button>
                      )}
                      {item.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(item.id, 'resolved')}
                          disabled={isUpdating}
                          className={cn(
                            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60',
                            'bg-gradient-to-r from-sage-500 to-sage-600 text-white hover:shadow-md hover:shadow-sage-200/50',
                          )}
                        >
                          {item.status === 'reviewed' ? (
                            <>
                              <CheckSquare className="w-4 h-4" strokeWidth={1.8} />
                              标记已解决
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                              审阅并解决
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
