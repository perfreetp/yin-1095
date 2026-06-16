import { Moon, Shield, ChevronLeft, ChevronRight, SkipForward, Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import type { SleepAnswer } from '../../shared/types'

interface SleepQuestion {
  id: string
  question: string
  hint?: string
  options: { label: string; value: number; subLabel?: string }[]
}

const sleepQuestions: SleepQuestion[] = [
  {
    id: 'q1',
    question: '近一个月，您通常几点上床睡觉？',
    hint: '选择最接近您日常作息的时间段',
    options: [
      { label: '22:00 之前', value: 0 },
      { label: '22:00 - 23:00', value: 0 },
      { label: '23:00 - 00:00', value: 1 },
      { label: '00:00 之后', value: 2 },
    ],
  },
  {
    id: 'q2',
    question: '近一个月，您通常需要多长时间才能入睡？',
    hint: '从上床准备睡觉到真正睡着的时间',
    options: [
      { label: '15 分钟以内', value: 0, subLabel: '倒头就睡' },
      { label: '15 - 30 分钟', value: 1, subLabel: '稍微酝酿' },
      { label: '30 - 60 分钟', value: 2, subLabel: '辗转反侧' },
      { label: '60 分钟以上', value: 3, subLabel: '久久难眠' },
    ],
  },
  {
    id: 'q3',
    question: '近一个月，您通常几点起床？',
    options: [
      { label: '08:00 之后', value: 0 },
      { label: '07:00 - 08:00', value: 0 },
      { label: '06:00 - 07:00', value: 1 },
      { label: '06:00 之前', value: 2 },
    ],
  },
  {
    id: 'q4',
    question: '近一个月，您总的实际睡眠时间是多少？',
    hint: '指实际睡着的时间，而非躺在床上的时间',
    options: [
      { label: '7 小时以上', value: 0 },
      { label: '6 - 7 小时', value: 1 },
      { label: '5 - 6 小时', value: 2 },
      { label: '不足 5 小时', value: 3 },
    ],
  },
  {
    id: 'q5',
    question: '近一个月，您通常夜间醒来几次？',
    options: [
      { label: '无 / 几乎不醒', value: 0 },
      { label: '1 次 / 每晚', value: 1 },
      { label: '2 - 3 次 / 每晚', value: 2 },
      { label: '4 次以上 / 每晚', value: 3 },
    ],
  },
  {
    id: 'q6',
    question: '近一个月，醒来后您能快速再次入睡吗？',
    options: [
      { label: '立即能睡着', value: 0 },
      { label: '10 分钟内', value: 1 },
      { label: '10 - 30 分钟', value: 2 },
      { label: '30 分钟以上 / 无法再睡', value: 3 },
    ],
  },
  {
    id: 'q7',
    question: '近一个月，您对自己的睡眠质量整体评价如何？',
    options: [
      { label: '很好', value: 0, subLabel: '精力充沛' },
      { label: '还不错', value: 1, subLabel: '偶有疲惫' },
      { label: '比较差', value: 2, subLabel: '经常疲劳' },
      { label: '非常差', value: 3, subLabel: '严重影响' },
    ],
  },
  {
    id: 'q8',
    question: '近一个月，睡眠问题对您白天的生活影响程度如何？',
    hint: '包括工作效率、情绪、人际互动等方面',
    options: [
      { label: '无影响', value: 0 },
      { label: '轻微影响', value: 1 },
      { label: '明显影响', value: 2 },
      { label: '严重影响', value: 3 },
    ],
  },
]

export default function AssessmentSleep() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const currentQ = sleepQuestions[currentIdx]
  const progress = ((currentIdx + 1) / sleepQuestions.length) * 100
  const isLast = currentIdx === sleepQuestions.length - 1
  const currentValue = answers[currentQ.id]

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }))
  }

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx(currentIdx + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSkip = () => {
    if (currentValue === undefined) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: 0 }))
    }
    if (!isLast) {
      setCurrentIdx(currentIdx + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const answerList: SleepAnswer[] = sleepQuestions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? 0,
      }))

      const res = await fetch('/api/assessment/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answerList,
          department: user?.department ?? '未知部门',
          userId: user?.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        navigate(`/assessment/result/${data.data.id}`)
      } else {
        alert(data.error || '提交失败，请稍后重试')
        setSubmitting(false)
      }
    } catch (e) {
      console.error(e)
      alert('网络错误，请稍后重试')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="stagger-enter">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center shadow-sm">
            <Moon className="w-5 h-5 text-lavender-500" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-clay-900">睡眠困扰筛查</h1>
            <p className="text-xs text-clay-500">PSQI 匹兹堡睡眠质量指数 · 共 {sleepQuestions.length} 题</p>
          </div>
        </div>
      </div>

      <div className="stagger-enter">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-clay-500">
            第 <span className="font-semibold text-clay-800">{currentIdx + 1}</span> / {sleepQuestions.length} 题
          </span>
          <span className="text-lavender-600 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-clay-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #AD8AC0 0%, #C77076 100%)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5 stagger-enter" key={currentQ.id}>
          <div className="rounded-2xl bg-white border border-clay-100 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-clay-800 leading-relaxed">{currentQ.question}</h2>
              {currentQ.hint && (
                <p className="text-sm text-clay-400 mt-2 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-clay-300" />
                  {currentQ.hint}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentValue === opt.value
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 group',
                      isSelected
                        ? 'border-rose-400 bg-gradient-to-r from-rose-50 to-lavender-50 shadow-md shadow-rose-100/50'
                        : 'border-clay-100 bg-white hover:border-clay-200 hover:bg-clay-50/60'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'border-rose-500 bg-rose-500'
                            : 'border-clay-200 group-hover:border-rose-300'
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'font-medium transition-colors',
                          isSelected ? 'text-rose-700' : 'text-clay-700 group-hover:text-clay-800'
                        )}>
                          {opt.label}
                        </div>
                        {opt.subLabel && (
                          <div className={cn(
                            'text-xs mt-0.5',
                            isSelected ? 'text-rose-500/80' : 'text-clay-400'
                          )}>
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="stagger-enter rounded-2xl border border-lavender-200 bg-gradient-to-br from-lavender-50 to-rose-50 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-lavender-500" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-clay-800">匿名隐私保护</span>
            </div>
            <ul className="space-y-2 text-xs text-clay-500 leading-relaxed">
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-lavender-400 mt-1.5 shrink-0" />
                所有数据加密存储
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-lavender-400 mt-1.5 shrink-0" />
                答案不会关联真实姓名
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-lavender-400 mt-1.5 shrink-0" />
                你可以随时撤回删除
              </li>
            </ul>
          </div>

          <div className="stagger-enter rounded-2xl border border-clay-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-clay-700 mb-3">已答题目</p>
            <div className="flex flex-wrap gap-2">
              {sleepQuestions.map((q, idx) => {
                const answered = answers[q.id] !== undefined
                const isCurrent = idx === currentIdx
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      isCurrent
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                        : answered
                        ? 'bg-lavender-100 text-lavender-700 hover:bg-lavender-200'
                        : 'bg-clay-50 text-clay-400 hover:bg-clay-100'
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-enter flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0 || submitting}
          className={cn(
            'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all',
            currentIdx === 0 || submitting
              ? 'text-clay-300 cursor-not-allowed'
              : 'text-clay-600 hover:bg-clay-100'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          上一题
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-clay-500 hover:text-clay-700 hover:bg-clay-50 transition-all"
          >
            <SkipForward className="w-4 h-4" />
            {isLast ? '跳过并提交' : '跳过'}
          </button>

          <button
            onClick={handleNext}
            disabled={currentValue === undefined || submitting}
            className={cn(
              'inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-md',
              currentValue !== undefined && !submitting
                ? 'bg-gradient-to-r from-lavender-400 to-rose-400 text-white hover:shadow-lg hover:shadow-lavender-200/60 hover:scale-[1.02]'
                : 'bg-clay-100 text-clay-400 cursor-not-allowed shadow-none'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                提交中...
              </>
            ) : isLast ? (
              <>
                提交评估
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                下一题
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
