import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  BookOpen,
  FileText,
  Volume2,
  Video,
  MessageCircleQuestion,
  Clock,
  CalendarDays,
  Filter,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type { Resource, ResourceCategory, ResourceType } from '../../shared/types'
import { cn } from '@/lib/utils'

const categoryConfig: Record<
  ResourceCategory,
  { label: string; gradient: string; badge: string; iconBg: string }
> = {
  sleep: {
    label: '睡眠知识',
    gradient: 'from-rose-200 via-rose-300 to-lavender-300',
    badge: 'bg-rose-100 text-rose-600 border-rose-200',
    iconBg: 'from-rose-300 to-rose-400',
  },
  hormone: {
    label: '激素变化',
    gradient: 'from-lavender-200 via-lavender-300 to-sage-200',
    badge: 'bg-lavender-100 text-lavender-600 border-lavender-200',
    iconBg: 'from-lavender-300 to-lavender-400',
  },
  emotion: {
    label: '情绪管理',
    gradient: 'from-sunset-200 via-rose-200 to-lavender-200',
    badge: 'bg-sunset-100 text-sunset-600 border-sunset-200',
    iconBg: 'from-sunset-300 to-sunset-400',
  },
  nutrition: {
    label: '营养运动',
    gradient: 'from-sage-200 via-sage-300 to-warm-300',
    badge: 'bg-sage-100 text-sage-600 border-sage-200',
    iconBg: 'from-sage-300 to-sage-400',
  },
}

const typeConfig: Record<
  ResourceType,
  { label: string; icon: typeof FileText; text: string }
> = {
  article: { label: '文章', icon: FileText, text: 'text-rose-500' },
  audio: { label: '音频', icon: Volume2, text: 'text-lavender-500' },
  video: { label: '视频', icon: Video, text: 'text-sunset-500' },
  qa: { label: '问答', icon: MessageCircleQuestion, text: 'text-sage-500' },
}

const categoryFilters: { key: 'all' | ResourceCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'sleep', label: '睡眠知识' },
  { key: 'hormone', label: '激素变化' },
  { key: 'emotion', label: '情绪管理' },
  { key: 'nutrition', label: '营养运动' },
]

function formatDuration(seconds?: number) {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}秒`
  if (secs === 0) return `${mins}分钟`
  return `${mins}分${secs}秒`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | ResourceCategory>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, debouncedKeyword])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (categoryFilter !== 'all') params.set('category', categoryFilter)
        if (debouncedKeyword) params.set('keyword', debouncedKeyword)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const res = await fetch(`/api/resources?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setResources(json.data.list)
          setTotal(json.data.total)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [categoryFilter, debouncedKeyword, page])

  const statsByType = {
    article: resources.filter((r) => r.type === 'article').length,
    audio: resources.filter((r) => r.type === 'audio').length,
    video: resources.filter((r) => r.type === 'video').length,
    qa: resources.filter((r) => r.type === 'qa').length,
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-warm-50 via-rose-50 to-lavender-50 border border-warm-100/60">
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-gradient-to-br from-warm-200/50 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-gradient-to-tr from-lavender-200/40 to-transparent blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warm-300 to-sunset-400 flex items-center justify-center shadow-lg shadow-warm-200/60">
                <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-clay-900">资源中心</h1>
            </div>
            <p className="text-clay-600 text-base leading-relaxed max-w-2xl">
              由专家精选的身心健康知识库，涵盖睡眠、激素、情绪、营养等主题，
              用科学知识守护你的每一刻。
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {(Object.keys(typeConfig) as ResourceType[]).map((t) => {
              const tcfg = typeConfig[t]
              const TIcon = tcfg.icon
              const count = statsByType[t]
              if (count === 0 && categoryFilter === 'all') return null
              return (
                <div
                  key={t}
                  className="text-center px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-sm border border-white shadow-sm min-w-[80px]"
                >
                  <TIcon className={cn('w-5 h-5 mx-auto mb-1.5', tcfg.text)} strokeWidth={2} />
                  <div className="text-lg font-bold text-clay-800">{count}</div>
                  <div className="text-[11px] text-clay-500">{tcfg.label}</div>
                </div>
              )
            })}
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
            placeholder="搜索资源标题、内容..."
            className="w-full h-12 pl-12 pr-5 rounded-2xl border border-clay-100 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-warm-200 focus:border-warm-300 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-clay-500">
          <Filter className="w-4 h-4" strokeWidth={1.8} />
          <span>共 {total} 篇资源</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2 overflow-x-auto -mx-2 px-2">
        {categoryFilters.map((f) => {
          const isActive = categoryFilter === f.key
          const cfg = f.key !== 'all' ? categoryConfig[f.key] : null
          return (
            <button
              key={f.key}
              onClick={() => setCategoryFilter(f.key)}
              className={cn(
                'shrink-0 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 border flex items-center gap-2',
                isActive
                  ? cfg
                    ? cn('text-white border-transparent shadow-lg', {
                        'bg-gradient-to-r from-rose-400 to-rose-500 shadow-rose-200/50':
                          f.key === 'sleep',
                        'bg-gradient-to-r from-lavender-400 to-lavender-500 shadow-lavender-200/50':
                          f.key === 'hormone',
                        'bg-gradient-to-r from-sunset-400 to-sunset-500 shadow-sunset-200/50':
                          f.key === 'emotion',
                        'bg-gradient-to-r from-sage-400 to-sage-500 shadow-sage-200/50':
                          f.key === 'nutrition',
                      })
                    : 'bg-gradient-to-r from-clay-500 to-clay-600 text-white border-transparent shadow-md'
                  : 'bg-white text-clay-600 border-clay-100 hover:border-warm-200 hover:text-warm-600',
              )}
            >
              {cfg && (
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isActive ? 'bg-white/80' : '',
                  )}
                  style={
                    !isActive
                      ? {
                          background:
                            f.key === 'sleep'
                              ? '#C77076'
                              : f.key === 'hormone'
                                ? '#9067AB'
                                : f.key === 'emotion'
                                  ? '#DB7E20'
                                  : '#668F5C',
                        }
                      : undefined
                  }
                />
              )}
              {f.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-clay-50 animate-pulse stagger-enter"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-clay-200 bg-white/50 p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-warm-100 to-lavender-100 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-warm-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clay-800">暂无符合条件的资源</h3>
            <p className="text-sm text-clay-500 mt-2">试试调整分类或搜索关键词</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {resources.map((r, idx) => {
            const ccfg = categoryConfig[r.category]
            const tcfg = typeConfig[r.type]
            const TIcon = tcfg.icon
            const durationText = r.type === 'article'
              ? r.readTime
                ? `约 ${r.readTime} 分钟阅读`
                : ''
              : r.duration
                ? `时长 ${formatDuration(r.duration)}`
                : r.readTime
                  ? `约 ${r.readTime} 分钟`
                  : ''

            return (
              <Link
                key={r.id}
                to={`/resources/${r.id}`}
                className="stagger-enter group relative rounded-3xl bg-white border border-clay-100 overflow-hidden card-hover flex flex-col"
                style={{ animationDelay: `${(idx % 10) * 0.08}s` }}
              >
                <div
                  className={cn(
                    'relative h-36 bg-gradient-to-br overflow-hidden',
                    ccfg.gradient,
                  )}
                >
                  <div className="absolute inset-0">
                    <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/25 blur-2xl" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/20 blur-xl" />
                  </div>
                  <div className="relative z-10 h-full p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white',
                        )}
                      >
                        <TIcon className="w-5.5 h-5.5" strokeWidth={2} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm bg-white/25 border-white/30 text-white',
                          )}
                        >
                          {tcfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/90 drop-shadow-sm">
                        {ccfg.label}
                      </span>
                      <Sparkles className="w-4 h-4 text-white/60" strokeWidth={1.8} />
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-bold text-clay-800 mb-2 group-hover:text-warm-600 transition-colors line-clamp-2 leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-sm text-clay-500 leading-relaxed line-clamp-3">
                      {r.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-clay-400 mt-auto pt-3 border-t border-clay-50">
                    <div className="flex items-center gap-3">
                      {durationText && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" strokeWidth={1.8} />
                          <span>{durationText}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" strokeWidth={1.8} />
                      <span>{formatDate(r.publishedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                        ccfg.badge,
                      )}
                    >
                      {ccfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-clay-400 group-hover:text-warm-500 transition-colors">
                      阅读
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
