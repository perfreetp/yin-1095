import { useState } from 'react'
import {
  MessageSquareHeart,
  Shield,
  ThumbsUp,
  Lightbulb,
  Smile,
  Send,
  CheckCircle2,
  Sparkles,
  History,
  Inbox,
  Users,
  Wrench,
  Rocket,
  Lock,
  Unlock,
  Loader2,
  Star,
  X,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedbackCategory } from '../../shared/types'

type TabKey = 'submit' | 'history'

const feedbackCategories: {
  key: FeedbackCategory
  label: string
  subtitle: string
  icon: typeof ThumbsUp
  gradient: string
  bg: string
  border: string
  text: string
}[] = [
  {
    key: 'satisfaction',
    label: '满意度评价',
    subtitle: '告诉我们您对服务的整体感受',
    icon: ThumbsUp,
    gradient: 'from-rose-300 to-rose-400',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-600',
  },
  {
    key: 'suggestion',
    label: '功能建议',
    subtitle: '希望增加或改进哪些功能',
    icon: Lightbulb,
    gradient: 'from-warm-300 to-sunset-400',
    bg: 'bg-sunset-50',
    border: 'border-sunset-200',
    text: 'text-sunset-600',
  },
  {
    key: 'experience',
    label: '使用体验',
    subtitle: '分享您的真实使用感受与故事',
    icon: Smile,
    gradient: 'from-lavender-300 to-lavender-400',
    bg: 'bg-lavender-50',
    border: 'border-lavender-200',
    text: 'text-lavender-600',
  },
]

const ratingDimensions = [
  { key: 'overall', label: '整体满意度', desc: '对服务的总体感受' },
  { key: 'practical', label: '功能实用性', desc: '内容是否真正有用' },
  { key: 'interface', label: '界面体验', desc: '是否美观易用' },
  { key: 'privacy', label: '隐私安全感', desc: '数据保护是否让人放心' },
]

const processFlow = [
  {
    step: '①',
    title: '我们收到反馈',
    desc: '系统自动登记，分配唯一编号',
    icon: Inbox,
    gradient: 'from-lavender-300 to-lavender-400',
  },
  {
    step: '②',
    title: '相关团队审阅',
    desc: '2个工作日内专人评估分析',
    icon: Users,
    gradient: 'from-rose-300 to-rose-400',
  },
  {
    step: '③',
    title: '改进落地',
    desc: '纳入排期，设计开发验证',
    icon: Wrench,
    gradient: 'from-warm-300 to-sunset-400',
  },
  {
    step: '④',
    title: '版本更新体现',
    desc: '在发版说明中感谢您的贡献',
    icon: Rocket,
    gradient: 'from-sage-300 to-sage-400',
  },
]

const recentImprovements = [
  {
    date: '2026-06-10',
    title: '新增关怀通道报名功能',
    desc: '感谢5位用户反馈希望有更直接的一对一支持入口',
    tag: '新功能',
    tagColor: 'bg-sage-100 text-sage-600 border-sage-200',
  },
  {
    date: '2026-06-05',
    title: '睡眠自测报告优化',
    desc: '根据12位用户建议，增加了更详细的改善建议和行动指南',
    tag: '体验优化',
    tagColor: 'bg-lavender-100 text-lavender-600 border-lavender-200',
  },
  {
    date: '2026-05-28',
    title: '放松练习新增3分钟版',
    desc: '感谢23位用户反映工作间隙时间紧张，新增了超短时长版本',
    tag: '内容更新',
    tagColor: 'bg-rose-100 text-rose-600 border-rose-200',
  },
  {
    date: '2026-05-20',
    title: '活动提醒功能上线',
    desc: '根据8位用户建议，报名活动后自动添加日历提醒',
    tag: '新功能',
    tagColor: 'bg-sage-100 text-sage-600 border-sage-200',
  },
  {
    date: '2026-05-12',
    title: '资源中心新增收藏功能',
    desc: '来自31位用户的共同呼声，可以保存喜欢的文章了',
    tag: '体验优化',
    tagColor: 'bg-warm-100 text-warm-600 border-warm-200',
  },
]

function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number
  onChange: (v: number) => void
  size?: 'sm' | 'md'
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const displayValue = hoverValue || value
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= displayValue
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
            className="relative p-0.5 transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none"
          >
            <svg
              className={cn(
                sizeClass,
                'transition-all duration-200',
                isActive
                  ? 'text-warm-400 drop-shadow-sm'
                  : 'text-clay-200 hover:text-warm-200',
              )}
              viewBox="0 0 24 24"
              fill={isActive ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-xs text-clay-500 font-medium min-w-[2rem]">
          {value}/5
        </span>
      )}
    </div>
  )
}

export default function Feedback() {
  const [activeTab, setActiveTab] = useState<TabKey>('submit')
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async () => {
    if (!selectedCategory) {
      setToast({ type: 'error', message: '请选择反馈类型' })
      return
    }
    if (!content.trim()) {
      setToast({ type: 'error', message: '请填写反馈内容' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          ratings,
          content: content.trim(),
          anonymous: isAnonymous,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowSuccess(true)
      } else {
        setToast({ type: 'error', message: json.error || '提交失败' })
      }
    } catch (e) {
      setToast({ type: 'error', message: '网络错误，请稍后重试' })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCategory(null)
    setRatings({})
    setContent('')
    setShowSuccess(false)
  }

  const categoryPlaceholder: Record<FeedbackCategory, string> = {
    satisfaction:
      '例如：整体服务让我最满意的是... 希望在以下方面可以改进... 特别感谢...',
    suggestion:
      '例如：建议增加XX功能，因为... 如果能有XX就更好了... 参考XX产品的做法...',
    experience:
      '例如：最近使用平台的经历是... 某个功能帮我解决了... 那一刻我感觉...',
  }

  const hasAnyRating = Object.values(ratings).some((v) => v > 0)
  const avgRating = hasAnyRating
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).filter((v) => v > 0).length).toFixed(1)
    : null

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-4">
          <div
            className={cn(
              'flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-sm',
              toast.type === 'success'
                ? 'bg-sage-50/95 border-sage-200 text-sage-700'
                : 'bg-rose-50/95 border-rose-200 text-rose-700',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2} />
            ) : (
              <X className="w-5 h-5 shrink-0" strokeWidth={2} />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div
        className="stagger-enter relative overflow-hidden rounded-3xl p-8 md:p-10 border border-lavender-100/60"
        style={{ background: 'linear-gradient(135deg, #F6F2F9 0%, #F6E4E6 35%, #FEF5EC 70%, #F2F6F1 100%)' }}
      >
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-gradient-to-br from-lavender-300/40 to-rose-300/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-gradient-to-tr from-warm-200/40 to-sage-200/30 blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-rose-200/50 to-transparent blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-br from-lavender-400 via-rose-400 to-warm-400 flex items-center justify-center shadow-xl shadow-lavender-200/50">
              <MessageSquareHeart className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-clay-900">您的声音，让关怀更贴心</h1>
              <p className="text-sm md:text-base text-clay-600 mt-1">
                您的反馈将帮助我们不断优化健康关怀服务
              </p>
            </div>
          </div>

          <p className="text-clay-600 text-base leading-relaxed max-w-2xl mb-8">
            每一条反馈都会被认真阅读和评估。无论是一个想法、一点感受，还是一句感谢，
            都是我们前进的动力。<span className="font-semibold text-lavender-600">您的每一句话都算数 💫</span>
          </p>

          <div className="flex items-start gap-3 p-4 md:p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-300 to-lavender-400 flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-clay-800 text-sm mb-0.5">🔒 匿名承诺</p>
              <p className="text-sm text-clay-600 leading-relaxed">
                所有反馈匿名处理，不会关联您的身份
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-enter flex gap-2 p-1.5 rounded-2xl bg-clay-50 border border-clay-100 w-fit">
        <button
          onClick={() => setActiveTab('submit')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300',
            activeTab === 'submit'
              ? 'bg-white text-rose-600 shadow-md shadow-rose-100/60'
              : 'text-clay-500 hover:text-clay-700 hover:bg-white/50',
          )}
        >
          <Send className="w-4.5 h-4.5" strokeWidth={1.8} />
          提交反馈
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300',
            activeTab === 'history'
              ? 'bg-white text-lavender-600 shadow-md shadow-lavender-100/60'
              : 'text-clay-500 hover:text-clay-700 hover:bg-white/50',
          )}
        >
          <History className="w-4.5 h-4.5" strokeWidth={1.8} />
          我的反馈历史
        </button>
      </div>

      {activeTab === 'submit' && !showSuccess && (
        <div className="space-y-6 stagger-enter">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400" />
                <h2 className="text-lg font-bold text-clay-800">选择反馈类型</h2>
              </div>
              <span className="text-xs text-clay-400">请选择一项</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feedbackCategories.map((cat, idx) => {
                const Icon = cat.icon
                const isSelected = selectedCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={cn(
                      'stagger-enter group relative text-left rounded-3xl p-6 border transition-all duration-400 overflow-hidden',
                      isSelected
                        ? 'bg-white shadow-xl ring-2 ring-offset-2 border-transparent'
                        : 'bg-white/70 border-clay-100 hover:bg-white card-hover',
                    )}
                    style={{
                      animationDelay: `${idx * 0.1}s`,
                      ...(isSelected
                        ? {
                            boxShadow: `0 12px 40px -8px ${cat.key === 'satisfaction' ? 'rgba(217, 145, 150, 0.35)' : cat.key === 'suggestion' ? 'rgba(232, 154, 78, 0.35)' : 'rgba(173, 138, 192, 0.35)'}`,
                            ringColor: cat.key === 'satisfaction' ? '#D99196' : cat.key === 'suggestion' ? '#E89A4E' : '#AD8AC0',
                          }
                        : undefined),
                    }}
                  >
                    {isSelected && (
                      <div className={cn('absolute inset-0 opacity-8', cat.bg)} />
                    )}
                    {isSelected && (
                      <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl', cat.gradient)} />
                    )}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            'w-13 h-13 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md transition-transform duration-300',
                            cat.gradient,
                            isSelected ? 'scale-110' : 'group-hover:scale-105',
                          )}
                        >
                          <Icon className="w-6.5 h-6.5 text-white" strokeWidth={1.8} />
                        </div>
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                            isSelected
                              ? 'border-transparent bg-gradient-to-br text-white' + ' ' + cat.gradient
                              : 'border-clay-200 bg-white group-hover:border-clay-300',
                          )}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" strokeWidth={3} />}
                        </div>
                      </div>
                      <h3 className={cn('text-base font-bold mb-1.5 transition-colors', isSelected ? cat.text : 'text-clay-800 group-hover:text-clay-900')}>
                        {cat.label}
                      </h3>
                      <p className="text-xs text-clay-500 leading-relaxed">{cat.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-clay-100 p-6 md:p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-warm-400 to-sunset-400" />
                <h2 className="text-lg font-bold text-clay-800">多维度评分</h2>
              </div>
              {avgRating && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-50 border border-warm-200">
                  <Star className="w-4 h-4 text-warm-400" strokeWidth={1.8} fill="currentColor" />
                  <span className="text-sm font-bold text-warm-600">平均 {avgRating}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {ratingDimensions.map((dim, idx) => (
                <div
                  key={dim.key}
                  className={cn(
                    'stagger-enter flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-2xl transition-colors',
                    ratings[dim.key] ? 'bg-warm-50/60 border border-warm-100' : 'bg-clay-50/40 hover:bg-clay-50/60',
                  )}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-clay-700">{dim.label}</p>
                    <p className="text-xs text-clay-400 mt-0.5">{dim.desc}</p>
                  </div>
                  <StarRating
                    value={ratings[dim.key] || 0}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [dim.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-clay-100 p-6 md:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400" />
              <h2 className="text-lg font-bold text-clay-800">详细反馈</h2>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={1000}
              placeholder={
                selectedCategory
                  ? categoryPlaceholder[selectedCategory]
                  : '请先选择上方的反馈类型，然后在这里写下您的想法...'
              }
              className={cn(
                'w-full px-4 py-3.5 rounded-2xl border bg-clay-50/40 text-sm text-clay-700 placeholder-clay-400 focus:outline-none focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-100/60 transition-all resize-none',
                !selectedCategory
                  ? 'border-clay-200 opacity-70 cursor-not-allowed'
                  : 'border-warm-200',
              )}
              disabled={!selectedCategory}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-xs text-clay-400">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>真诚的文字最有力量</span>
              </div>
              <span className={cn(
                'text-xs font-medium',
                content.length > 900 ? 'text-rose-500' : 'text-clay-400',
              )}>
                {content.length}/1000
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl bg-gradient-to-br from-warm-50 via-rose-50 to-lavender-50 border border-warm-100">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  'shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300',
                  isAnonymous
                    ? 'bg-gradient-to-br from-sage-300 to-sage-400 text-white hover:shadow-lg hover:shadow-sage-200/60'
                    : 'bg-white text-warm-500 border border-warm-200 hover:border-warm-300',
                )}
              >
                {isAnonymous ? (
                  <Lock className="w-5.5 h-5.5" strokeWidth={1.8} />
                ) : (
                  <Unlock className="w-5.5 h-5.5" strokeWidth={1.8} />
                )}
              </button>
              <div>
                <p className="text-sm font-semibold text-clay-700">
                  {isAnonymous ? '✅ 匿名提交' : '非匿名提交'}
                </p>
                <p className="text-xs text-clay-500 mt-0.5">
                  {isAnonymous
                    ? '推荐匿名提交以保护隐私，反馈将无法关联到您'
                    : '您的身份将被记录，便于跟进处理进度'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <label className="flex items-center gap-2 cursor-pointer sm:hidden">
                <div
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-all duration-300',
                    isAnonymous ? 'bg-sage-400' : 'bg-clay-200',
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300',
                      isAnonymous ? 'left-[22px]' : 'left-0.5',
                    )}
                  />
                </div>
              </label>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedCategory || !content.trim()}
                className={cn(
                  'px-8 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                  selectedCategory && content.trim() && !submitting
                    ? 'text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
                    : 'bg-clay-100 text-clay-400 cursor-not-allowed',
                )}
                style={
                  selectedCategory && content.trim() && !submitting
                    ? {
                        background: 'linear-gradient(135deg, #E8B4B8 0%, #D99196 50%, #C77076 100%)',
                        boxShadow: '0 6px 20px rgba(217, 145, 150, 0.35)',
                      }
                    : undefined
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                    提交中...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" strokeWidth={1.8} />
                    提交反馈
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'submit' && showSuccess && (
        <div className="stagger-enter rounded-3xl bg-white border border-sage-100 p-8 md:p-12 text-center overflow-hidden relative">
          <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-sage-200/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-warm-200/40 blur-3xl" />

          <div className="relative z-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sage-300 via-sage-400 to-sage-500 flex items-center justify-center mx-auto mb-7 shadow-2xl shadow-sage-200/60 animate-in zoom-in duration-500">
              <Heart className="w-12 h-12 text-white" strokeWidth={1.8} fill="currentColor" fillOpacity={0.2} />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-clay-800 mb-2">
              感谢您的宝贵反馈 💕
            </h2>
            <p className="text-clay-600 mb-8 max-w-md mx-auto leading-relaxed">
              您的声音已经收到，我们会认真对待每一条建议。
              因为有您，我们才能做得更好。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
              {processFlow.slice(0, 2).map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-gradient-to-br from-sage-50 to-warm-50 border border-sage-100"
                >
                  <div className="text-xs font-bold text-sage-600 mb-1">{step.step}</div>
                  <p className="text-sm font-semibold text-clay-700 mb-0.5">{step.title}</p>
                  <p className="text-xs text-clay-500">{step.desc}</p>
                </div>
              ))}
              <div className="p-4 rounded-2xl bg-clay-50/60 border border-clay-100">
                <div className="text-xs font-bold text-clay-400 mb-1">后续</div>
                <p className="text-sm font-semibold text-clay-600 mb-0.5">持续改进中</p>
                <p className="text-xs text-clay-400">关注版本更新了解进展</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-7 py-3 rounded-2xl font-semibold text-sm border border-clay-200 text-clay-700 bg-white hover:bg-clay-50 hover:border-clay-300 transition-all"
              >
                再写一条反馈
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="px-7 py-3 rounded-2xl font-semibold text-sm text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #AD8AC0 0%, #9067AB 100%)',
                  boxShadow: '0 6px 20px rgba(144, 103, 171, 0.35)',
                }}
              >
                查看反馈处理流程
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 stagger-enter">
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-7 bg-gradient-to-br from-lavender-50 via-warm-50 to-rose-50 border border-lavender-100/60">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-lavender-200/40 blur-3xl" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-500 flex items-center justify-center shadow-lg shadow-lavender-200/60 shrink-0">
                <Shield className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-clay-800 mb-2">关于反馈历史</h3>
                <p className="text-sm text-clay-600 leading-relaxed max-w-2xl">
                  由于反馈<span className="font-semibold text-lavender-600">完全匿名</span>处理，
                  我们无法关联您的提交记录。这是为了最大程度保护您的隐私，让您可以毫无顾虑地表达真实想法。
                  若您想追踪处理进度，可在提交时选择<span className="font-semibold">非匿名方式</span>并留下联系方式。
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-lavender-400 to-sage-400" />
              <h2 className="text-lg font-bold text-clay-800">反馈处理流程</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {processFlow.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div
                    key={idx}
                    className="stagger-enter relative rounded-3xl bg-white border border-clay-100 p-6 card-hover overflow-hidden"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={cn('absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-15 blur-2xl', step.gradient)} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md',
                            step.gradient,
                          )}
                        >
                          <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                        </div>
                        <span className="text-2xl font-bold text-clay-200">{step.step}</span>
                      </div>
                      <h3 className="text-base font-bold text-clay-800 mb-1.5">{step.title}</h3>
                      <p className="text-xs text-clay-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-400 to-sunset-400" />
                <h2 className="text-lg font-bold text-clay-800">近期优化记录</h2>
              </div>
              <span className="text-xs text-clay-400">感谢每一位贡献想法的用户 💐</span>
            </div>

            <div className="rounded-3xl bg-white border border-clay-100 overflow-hidden">
              {recentImprovements.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'stagger-enter p-5 md:p-6 transition-colors hover:bg-clay-50/40',
                    idx !== recentImprovements.length - 1 ? 'border-b border-clay-50' : '',
                  )}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-warm-100 border border-rose-200/60 flex items-center justify-center">
                      <Sparkles className="w-5.5 h-5.5 text-rose-500" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-clay-800">{item.title}</h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium border',
                          item.tagColor,
                        )}>
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-sm text-clay-600 leading-relaxed mb-2">{item.desc}</p>
                      <div className="text-xs text-clay-400 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" strokeWidth={1.8} />
                        {item.date} 上线
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
