import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Volume2,
  Video,
  MessageCircleQuestion,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  CalendarDays,
  ChevronRight,
  Home,
  BookOpen,
  Share2,
  Heart,
  Sparkles,
  XCircle,
} from 'lucide-react'
import type { Resource, ResourceCategory, ResourceType } from '../../shared/types'
import { cn } from '@/lib/utils'

const categoryConfig: Record<
  ResourceCategory,
  { label: string; gradient: string; badge: string }
> = {
  sleep: {
    label: '睡眠知识',
    gradient: 'from-rose-200 via-rose-300 to-lavender-300',
    badge: 'bg-rose-100 text-rose-600 border-rose-200',
  },
  hormone: {
    label: '激素变化',
    gradient: 'from-lavender-200 via-lavender-300 to-sage-200',
    badge: 'bg-lavender-100 text-lavender-600 border-lavender-200',
  },
  emotion: {
    label: '情绪管理',
    gradient: 'from-sunset-200 via-rose-200 to-lavender-200',
    badge: 'bg-sunset-100 text-sunset-600 border-sunset-200',
  },
  nutrition: {
    label: '营养运动',
    gradient: 'from-sage-200 via-sage-300 to-warm-300',
    badge: 'bg-sage-100 text-sage-600 border-sage-200',
  },
}

const typeConfig: Record<
  ResourceType,
  { label: string; icon: typeof FileText; gradient: string }
> = {
  article: { label: '文章', icon: FileText, gradient: 'from-rose-300 to-rose-400' },
  audio: { label: '音频', icon: Volume2, gradient: 'from-lavender-300 to-lavender-400' },
  video: { label: '视频', icon: Video, gradient: 'from-sunset-300 to-sunset-400' },
  qa: { label: '问答', icon: MessageCircleQuestion, gradient: 'from-sage-300 to-sage-400' },
}

function formatDuration(seconds?: number) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

type DetailData = Resource & {
  relatedResources?: Resource[]
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resource, setResource] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/resources/${id}`)
        const json = await res.json()
        if (json.success) {
          setResource(json.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (isPlaying && resource?.duration) {
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1
          if (next >= resource.duration!) {
            setIsPlaying(false)
            return resource.duration!
          }
          return next
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, resource?.duration])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!resource?.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setProgress(Math.round(ratio * resource.duration))
  }

  const togglePlay = () => {
    if (!resource?.duration) return
    if (progress >= resource.duration) setProgress(0)
    setIsPlaying((p) => !p)
  }

  const skipBack = () => {
    setProgress((p) => Math.max(0, p - 15))
  }

  const skipForward = () => {
    if (!resource?.duration) return
    setProgress((p) => Math.min(resource.duration!, p + 15))
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-12 rounded-2xl bg-clay-50 animate-pulse" />
        <div className="h-80 rounded-3xl bg-clay-50 animate-pulse" />
        <div className="h-96 rounded-3xl bg-clay-50 animate-pulse" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="rounded-3xl border border-dashed border-clay-200 bg-white/50 p-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-100 to-lavender-100 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-rose-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-clay-800">资源不存在</h3>
          <p className="text-sm text-clay-500 mt-2">
            <Link to="/resources" className="text-rose-500 hover:underline">
              返回资源列表
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const ccfg = categoryConfig[resource.category]
  const tcfg = typeConfig[resource.type]
  const TIcon = tcfg.icon
  const related = resource.relatedResources || []
  const totalDuration = resource.duration || 0
  const progressPercent = totalDuration > 0 ? (progress / totalDuration) * 100 : 0

  const sections = [
    {
      title: '背景与意义',
      paragraphs: [
        resource.content,
        '在快节奏的现代生活中，我们常常忽略了身体发出的信号。了解相关知识不仅能帮助我们更好地认识自己，更能在问题出现时做出明智的选择。科学的认知是健康管理的第一步，也是最重要的一步。',
      ],
    },
    {
      title: '核心要点',
      paragraphs: [
        '通过对大量研究数据的分析，我们总结出以下关键要点。这些结论均经过专家团队审核，具有较高的可信度和参考价值。建议结合自身实际情况，有选择地采纳和实践。',
        '需要特别强调的是，每个人的身体状况都是独特的。本文提供的信息仅供参考，不能替代专业医疗建议。如有具体健康问题，请务必咨询相关专业人士。',
      ],
    },
    {
      title: '实践建议',
      paragraphs: [
        '知识只有转化为行动才有价值。我们为你整理了一些切实可行的建议，可以从今天开始尝试。记住，改变是一个渐进的过程，不必急于求成，小步持续前进比一时冲动更能带来持久的效果。',
        '建议选择1-2条最容易落实的建议先开始，养成习惯后再逐步增加。每完成一条，不妨给自己一些小奖励，这有助于保持动机，建立正向循环。',
      ],
    },
    {
      title: '写在最后',
      paragraphs: [
        '健康是一场终身的修行，没有终点，只有不断前行的过程。愿本文的内容能成为你健康之旅中的一盏明灯，在你需要时给予方向和力量。',
        '如果你觉得这篇文章有帮助，欢迎分享给身边需要的人。让我们一起，在关爱自己的同时，也把温暖传递给更多人。',
      ],
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-clay-500 hover:text-rose-500 transition-colors"
        >
          <Home className="w-4 h-4" strokeWidth={1.8} />
          首页
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-clay-300" strokeWidth={2} />
        <Link
          to="/resources"
          className="flex items-center gap-1.5 text-clay-500 hover:text-rose-500 transition-colors"
        >
          <BookOpen className="w-4 h-4" strokeWidth={1.8} />
          资源中心
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-clay-300" strokeWidth={2} />
        <span className="text-clay-800 font-semibold truncate max-w-xs">
          {resource.title}
        </span>
      </nav>

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-clay-500 hover:text-rose-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        返回资源列表
      </button>

      <article className="space-y-8 stagger-enter">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br border',
            ccfg.gradient,
            'border-white/50',
          )}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative z-10 space-y-5 text-clay-800">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/40 border-white/60',
                )}
              >
                <TIcon className="w-3.5 h-3.5" strokeWidth={2} />
                {tcfg.label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/40 border-white/60',
                )}
              >
                {ccfg.label}
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => setLiked(!liked)}
                  className="w-11 h-11 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center hover:bg-white/60 transition-colors"
                >
                  <Heart
                    className={cn(
                      'w-5 h-5 transition-colors',
                      liked ? 'fill-rose-500 text-rose-500' : 'text-clay-700',
                    )}
                    strokeWidth={2}
                  />
                </button>
                <button className="w-11 h-11 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center hover:bg-white/60 transition-colors">
                  <Share2 className="w-5 h-5 text-clay-700" strokeWidth={2} />
                </button>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-clay-900 leading-tight drop-shadow-sm">
              {resource.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-clay-700/90">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" strokeWidth={1.8} />
                <span>发布于 {formatDate(resource.publishedAt)}</span>
              </div>
              {resource.type === 'article' && resource.readTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" strokeWidth={1.8} />
                  <span>约 {resource.readTime} 分钟阅读</span>
                </div>
              )}
              {resource.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" strokeWidth={1.8} />
                  <span>时长 {formatDuration(resource.duration)}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/50 text-xs font-semibold">
                <Sparkles className="w-3 h-3" strokeWidth={2} />
                精选内容
              </div>
            </div>
          </div>
        </header>

        {resource.type === 'audio' && (
          <div className="rounded-3xl bg-white border border-clay-100 p-6 shadow-sm shadow-clay-100/60 card-hover">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div
                className={cn(
                  'shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                  tcfg.gradient,
                  isPlaying ? 'breathing' : '',
                )}
              >
                <TIcon className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div
                  className="w-full h-2 rounded-full bg-clay-100 cursor-pointer group relative overflow-hidden"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-lavender-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-lavender-500 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progressPercent}% - 8px)` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={skipBack}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-clay-600 hover:bg-clay-50 hover:text-lavender-500 transition-colors"
                    >
                      <SkipBack className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-500 text-white flex items-center justify-center shadow-lg shadow-lavender-200/50 hover:scale-105 active:scale-95 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 ml-0.5" strokeWidth={2.5} fill="currentColor" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" strokeWidth={2.5} fill="currentColor" />
                      )}
                    </button>
                    <button
                      onClick={skipForward}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-clay-600 hover:bg-clay-50 hover:text-lavender-500 transition-colors"
                    >
                      <SkipForward className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="text-sm tabular-nums font-medium text-clay-500">
                    {formatDuration(progress)} / {formatDuration(totalDuration)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-white border border-clay-100 p-8 md:p-10 shadow-sm shadow-clay-100/40">
          <div className="prose prose-clay max-w-none space-y-10">
            {sections.map((section, sIdx) => (
              <section key={sIdx} className="stagger-enter" style={{ animationDelay: `${sIdx * 0.08}s` }}>
                <h2 className="text-xl md:text-2xl font-bold text-clay-800 mb-5 flex items-center gap-3">
                  <span className="w-1.5 h-7 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400 shrink-0" />
                  <span className="text-warm-500 font-serif italic mr-2">0{sIdx + 1}</span>
                  {section.title}
                </h2>
                <div className="space-y-4 pl-4.5">
                  {section.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-clay-600 leading-[1.95] text-[15px] indent-[2em] first-letter:text-rose-500 first-letter:text-2xl first-letter:font-serif first-letter:font-bold first-letter:mr-1"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-clay-100 space-y-5">
            <div className="flex flex-wrap gap-2">
              {['身心健康', '自我关怀', '科学知识', '专家推荐', '实用指南'].map((tag, idx) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-clay-50 to-warm-50 text-clay-600 border border-clay-100 stagger-enter"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-warm-50 to-lavender-50 border border-rose-100/60 p-5">
              <p className="text-sm text-clay-600 leading-relaxed">
                <span className="font-bold text-rose-500">💡 温馨提示：</span>
                本文内容仅供参考，不能替代专业医疗建议。如有具体健康困扰，请及时咨询相关专业人士。
                关爱自己，从认真对待每一个身体信号开始。
              </p>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <div className="space-y-5 pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-clay-800 flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-warm-400 to-sunset-400" />
              相关推荐
            </h2>
            <Link
              to="/resources"
              className="text-sm text-rose-500 hover:underline font-medium flex items-center gap-1"
            >
              查看更多
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory">
            {related.map((r, idx) => {
              const rccfg = categoryConfig[r.category]
              const rtcfg = typeConfig[r.type]
              const RTIcon = rtcfg.icon
              return (
                <Link
                  key={r.id}
                  to={`/resources/${r.id}`}
                  className="stagger-enter shrink-0 w-[300px] snap-start rounded-3xl bg-white border border-clay-100 overflow-hidden card-hover group flex flex-col"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <div
                    className={cn(
                      'relative h-32 bg-gradient-to-br overflow-hidden shrink-0',
                      rccfg.gradient,
                    )}
                  >
                    <div className="absolute inset-0">
                      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/25 blur-xl" />
                    </div>
                    <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white',
                          )}
                        >
                          <RTIcon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/25 backdrop-blur-sm border border-white/30 text-white">
                          {rtcfg.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-white/90">
                        {rccfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-bold text-clay-800 mb-2 group-hover:text-warm-600 transition-colors line-clamp-2 leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-clay-500 line-clamp-2 leading-relaxed flex-1 mb-3">
                      {r.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-clay-400 pt-2 border-t border-clay-50">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" strokeWidth={1.8} />
                        <span>
                          {r.type === 'article'
                            ? r.readTime
                              ? `${r.readTime}分钟`
                              : ''
                            : r.duration
                              ? formatDuration(r.duration)
                              : r.readTime
                                ? `${r.readTime}分钟`
                                : ''}
                        </span>
                      </div>
                      <span>{formatDate(r.publishedAt)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
