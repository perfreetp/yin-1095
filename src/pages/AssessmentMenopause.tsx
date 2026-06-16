import { Flower2, Shield, Check, Loader2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import type { SymptomScore } from '../../shared/types'

interface MenopauseSymptom {
  id: string
  name: string
  description: string
  icon: string
}

const symptoms: MenopauseSymptom[] = [
  { id: 's1', name: '潮热出汗', description: '突然感到燥热、脸红、出汗', icon: '🌡️' },
  { id: 's2', name: '感觉异常', description: '麻木、刺痛、耳鸣等异常感觉', icon: '✨' },
  { id: 's3', name: '失眠', description: '入睡困难、多梦、早醒', icon: '🌙' },
  { id: 's4', name: '易激动', description: '情绪易怒、烦躁、发脾气', icon: '⚡' },
  { id: 's5', name: '抑郁疑心', description: '情绪低落、焦虑、多疑', icon: '💧' },
  { id: 's6', name: '眩晕', description: '头晕、站不稳、头昏沉', icon: '🌀' },
  { id: 's7', name: '疲乏', description: '精力不足、容易累、乏力', icon: '🔋' },
  { id: 's8', name: '骨关节痛', description: '关节酸痛、腰背疼痛', icon: '🦴' },
  { id: 's9', name: '头痛', description: '头部胀痛、偏头痛、紧箍感', icon: '💆' },
  { id: 's10', name: '心悸', description: '心跳加速、心慌、胸闷', icon: '❤️' },
]

const scoreLevels = [
  { score: 0, label: '无', desc: '近一个月无此症状', color: 'sage' },
  { score: 1, label: '轻度', desc: '偶尔出现，不影响生活', color: 'lavender' },
  { score: 2, label: '中度', desc: '经常出现，轻度影响生活', color: 'warm' },
  { score: 3, label: '重度', desc: '持续存在，严重影响生活', color: 'rose' },
]

const colorMap: Record<string, { activeBg: string; activeBorder: string; activeText: string; hover: string; passiveBg: string }> = {
  sage: {
    activeBg: 'bg-sage-100',
    activeBorder: 'border-sage-400',
    activeText: 'text-sage-700',
    hover: 'hover:border-sage-200 hover:bg-sage-50/60',
    passiveBg: 'bg-sage-50',
  },
  lavender: {
    activeBg: 'bg-lavender-100',
    activeBorder: 'border-lavender-400',
    activeText: 'text-lavender-700',
    hover: 'hover:border-lavender-200 hover:bg-lavender-50/60',
    passiveBg: 'bg-lavender-50',
  },
  warm: {
    activeBg: 'bg-warm-100',
    activeBorder: 'border-warm-400',
    activeText: 'text-warm-700',
    hover: 'hover:border-warm-200 hover:bg-warm-50/60',
    passiveBg: 'bg-warm-50',
  },
  rose: {
    activeBg: 'bg-rose-100',
    activeBorder: 'border-rose-400',
    activeText: 'text-rose-700',
    hover: 'hover:border-rose-200 hover:bg-rose-50/60',
    passiveBg: 'bg-rose-50',
  },
}

export default function AssessmentMenopause() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const answeredCount = Object.keys(scores).length
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const progress = (answeredCount / symptoms.length) * 100
  const allAnswered = answeredCount === symptoms.length

  const handleSelect = (symptomId: string, score: number) => {
    setScores((prev) => {
      if (prev[symptomId] === score) {
        const next = { ...prev }
        delete next[symptomId]
        return next
      }
      return { ...prev, [symptomId]: score }
    })
  }

  const handleSubmit = async () => {
    if (!allAnswered) {
      const confirmSkip = confirm(`还有 ${symptoms.length - answeredCount} 项未评分，未评分项将按"无"计算，确定提交吗？`)
      if (!confirmSkip) return
    }

    setSubmitting(true)
    try {
      const symptomList: SymptomScore[] = symptoms.map((s) => ({
        symptomId: s.id,
        name: s.name,
        score: scores[s.id] ?? 0,
      }))

      const res = await fetch('/api/assessment/menopause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomList,
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="stagger-enter flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-warm-100 flex items-center justify-center shadow-sm">
            <Flower2 className="w-5 h-5 text-rose-500" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-clay-900">围绝经期症状评估</h1>
            <p className="text-xs text-clay-500">Kupperman 改良评分量表 · 共 {symptoms.length} 项症状</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/assessment')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-clay-500 hover:text-clay-700 hover:bg-clay-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          返回自测中心
        </button>
      </div>

      <div className="stagger-enter">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-clay-500">
            已完成 <span className="font-semibold text-clay-800">{answeredCount}</span> / {symptoms.length} 项
            <span className="mx-2 text-clay-200">·</span>
            当前总分 <span className="font-semibold text-rose-600">{totalScore}</span>
          </span>
          <span className="text-rose-600 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-clay-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #E89A4E 0%, #C77076 100%)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {symptoms.map((symptom, idx) => {
            const currentScore = scores[symptom.id]
            return (
              <div
                key={symptom.id}
                className="stagger-enter rounded-2xl bg-white border border-clay-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-clay-50 to-warm-50 flex items-center justify-center text-xl shrink-0 shadow-sm border border-clay-100">
                    {symptom.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-clay-800">{symptom.name}</h3>
                      <span className="text-xs text-clay-400">#{String(idx + 1).padStart(2, '0')}</span>
                      {currentScore !== undefined && (
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          colorMap[scoreLevels[currentScore].color].passiveBg,
                          colorMap[scoreLevels[currentScore].color].activeText
                        )}>
                          {scoreLevels[currentScore].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-clay-400 mt-1">{symptom.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {scoreLevels.map((level) => {
                    const isSelected = currentScore === level.score
                    const colors = colorMap[level.color]
                    return (
                      <button
                        key={level.score}
                        onClick={() => handleSelect(symptom.id, level.score)}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all duration-300 text-center group relative',
                          isSelected
                            ? `${colors.activeBg} ${colors.activeBorder} shadow-md`
                            : `bg-white border-clay-100 ${colors.hover}`
                        )}
                      >
                        <div className={cn(
                          'text-sm font-bold mb-1 transition-colors',
                          isSelected ? colors.activeText : 'text-clay-700 group-hover:text-clay-800'
                        )}>
                          {level.label}
                        </div>
                        <div className={cn(
                          'text-xs leading-snug transition-colors line-clamp-2',
                          isSelected ? `${colors.activeText}/80` : 'text-clay-400'
                        )}>
                          {level.desc}
                        </div>
                        {isSelected && (
                          <div className={cn(
                            'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm',
                            colors.activeBorder.replace('border-', 'bg-').replace('-400', '-500')
                          )}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="stagger-enter rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-warm-50 p-5 shadow-sm sticky top-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-rose-500" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-clay-800">匿名隐私保护</span>
            </div>
            <ul className="space-y-2.5 text-xs text-clay-500 leading-relaxed mb-5">
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                所有数据加密存储
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                症状不会关联真实姓名
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                报告仅你本人可见
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                你可以随时撤回删除
              </li>
            </ul>

            <div className="border-t border-rose-100/80 pt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-clay-500">完成度</span>
                  <span className="font-semibold text-clay-700">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-warm-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-clay-500">当前总分</span>
                <span className="text-2xl font-bold text-rose-600">{totalScore}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {symptoms.map((s, i) => {
                  const has = scores[s.id] !== undefined
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        'w-6 h-6 rounded-md text-[10px] flex items-center justify-center font-medium transition-all',
                        has
                          ? scores[s.id] === 0
                            ? 'bg-sage-100 text-sage-600'
                            : scores[s.id] === 1
                            ? 'bg-lavender-100 text-lavender-600'
                            : scores[s.id] === 2
                            ? 'bg-warm-100 text-warm-600'
                            : 'bg-rose-100 text-rose-600'
                          : 'bg-clay-50 text-clay-300'
                      )}
                      title={s.name}
                    >
                      {i + 1}
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'w-full mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md',
                !submitting
                  ? 'bg-gradient-to-r from-rose-400 to-warm-400 text-white hover:shadow-lg hover:shadow-rose-200/60 hover:scale-[1.02]'
                  : 'bg-clay-100 text-clay-400 cursor-not-allowed shadow-none'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  提交评估报告
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
