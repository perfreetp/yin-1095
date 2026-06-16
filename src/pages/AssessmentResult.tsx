import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Shield, ArrowLeft, RotateCcw, Moon, Flower2, Lightbulb,
  Clock, BookOpen, Heart, Activity, Calendar, ArrowRight,
  HandHeart, Sparkles, Leaf, Target, Coffee, AlertTriangle,
  Flame, Zap, Droplets, Lock,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ReferenceDot,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { SleepAssessment, MenopauseAssessment, CareProgram, SleepAnswer, SymptomScore, TopSymptom, SleepIssue, CareProgramRecommendation } from '../../shared/types'

type ResultData = (SleepAssessment & { type: 'sleep' }) | (MenopauseAssessment & { type: 'menopause' })

const severityConfig = {
  mild: {
    label: '轻度',
    bg: 'bg-sage-100',
    text: 'text-sage-600',
    border: 'border-sage-200',
    dot: 'bg-sage-400',
    gradient: 'from-sage-400 to-lavender-400',
    ring: 'stroke-sage-400',
    ringBg: 'stroke-sage-100',
    desc: '目前状态良好，继续保持健康的生活方式',
  },
  moderate: {
    label: '中度',
    bg: 'bg-warm-100',
    text: 'text-warm-600',
    border: 'border-warm-200',
    dot: 'bg-warm-400',
    gradient: 'from-warm-400 to-rose-400',
    ring: 'stroke-warm-400',
    ringBg: 'stroke-warm-100',
    desc: '需要适当关注，建议参考下方建议进行调整',
  },
  severe: {
    label: '重度',
    bg: 'bg-rose-100',
    text: 'text-rose-600',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
    gradient: 'from-rose-400 to-clay-400',
    ring: 'stroke-rose-400',
    ringBg: 'stroke-rose-100',
    desc: '建议尽快寻求专业帮助，你并不孤单，我们一起度过',
  },
}

const sleepQuestionLabels: Record<string, string> = {
  q1: '就寝时间',
  q2: '入睡时长',
  q3: '起床时间',
  q4: '总睡眠时长',
  q5: '夜醒频率',
  q6: '复睡难度',
  q7: '主观质量',
  q8: '日间影响',
}

const sleepColors = ['#AD8AC0', '#C9B1D4', '#E8B4B8', '#D99196', '#C77076', '#E89A4E', '#F2B880', '#84A97C']

const symptomTagColors = [
  { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200', icon: Flame },
  { bg: 'bg-lavender-100', text: 'text-lavender-600', border: 'border-lavender-200', icon: Zap },
  { bg: 'bg-sage-100', text: 'text-sage-600', border: 'border-sage-200', icon: Droplets },
]

function GaugeChart({ score, maxScore, severity }: { score: number; maxScore: number; severity: 'mild' | 'moderate' | 'severe' }) {
  const pct = Math.min(score / maxScore, 1)
  const circ = 2 * Math.PI * 90
  const dash = (circ * 0.75)
  const offset = dash - dash * pct
  const cfg = severityConfig[severity]

  return (
    <div className="relative w-[220px] h-[220px]">
      <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 220 220">
        <circle
          cx="110" cy="110" r="90"
          fill="none"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={cfg.ringBg}
        />
        <circle
          cx="110" cy="110" r="90"
          fill="none"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={offset}
          className={cfg.ring}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
        <span className="text-xs text-clay-400 font-medium mb-1">总分</span>
        <span className="text-5xl font-bold text-clay-800 tracking-tight">{score}</span>
        <span className="text-xs text-clay-400 mt-1">/ {maxScore}</span>
      </div>
    </div>
  )
}

function SuggestionIcon({ idx }: { idx: number }) {
  const icons = [Lightbulb, Clock, Leaf, Target, Heart, Coffee, BookOpen, Sparkles, Activity, HandHeart]
  const Icon = icons[idx % icons.length]
  const colors = [
    'from-rose-100 to-warm-100 text-rose-500',
    'from-lavender-100 to-rose-100 text-lavender-500',
    'from-sage-100 to-warm-100 text-sage-500',
    'from-warm-100 to-sunset-100 text-warm-500',
  ]
  return (
    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm', colors[idx % colors.length])}>
      <Icon className="w-5 h-5" strokeWidth={1.8} />
    </div>
  )
}

function SymptomTag({ symptom, rank }: { symptom: TopSymptom; rank: number }) {
  const color = symptomTagColors[rank % symptomTagColors.length]
  const Icon = color.icon
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm',
      color.bg, color.text, color.border
    )}>
      <Icon className="w-4 h-4" fill="currentColor" fillOpacity={0.3} />
      <span className="font-semibold text-sm">{symptom.name}</span>
      <span className="text-xs opacity-75 font-medium">
        {symptom.score === 3 ? '重度' : symptom.score === 2 ? '中度' : '轻度'}
      </span>
    </div>
  )
}

function SleepIssueTag({ issue, rank }: { issue: SleepIssue; rank: number }) {
  const color = symptomTagColors[rank % symptomTagColors.length]
  const Icon = color.icon
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm',
      color.bg, color.text, color.border
    )}>
      <Icon className="w-4 h-4" fill="currentColor" fillOpacity={0.3} />
      <span className="font-semibold text-sm">{issue.label}</span>
      <span className="text-xs opacity-75 font-medium">
        {issue.score === 3 ? '明显' : issue.score === 2 ? '轻度' : '良好'}
      </span>
    </div>
  )
}

function SevereAlertBanner() {
  return (
    <div className="stagger-enter rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 p-5 shadow-lg shadow-rose-200/50">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-white" fill="currentColor" fillOpacity={0.3} strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-base mb-1">需要专业医疗关注</h4>
          <p className="text-white/90 text-sm leading-relaxed">
            您的症状已达到重度程度，强烈建议尽快寻求专业医疗帮助。请不要独自承受，及时就医可以有效缓解症状、预防并发症。
          </p>
        </div>
      </div>
    </div>
  )
}

function MedicalAdviceCard({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50/80 to-warm-50/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-rose-500" strokeWidth={1.8} />
        </div>
        <h4 className="font-bold text-rose-700 text-base">就医建议</h4>
      </div>
      <ul className="space-y-2.5">
        {suggestions.map((s, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-rose-700 leading-relaxed">
            <span className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-rose-600">{idx + 1}</span>
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RecommendedProgramCard({ program, idx }: { program: CareProgramRecommendation; idx: number }) {
  const navigate = useNavigate()
  return (
    <div
      className="rounded-2xl bg-white p-6 border border-clay-100 shadow-sm hover:shadow-lg hover:shadow-rose-100/50 transition-all stagger-enter"
      style={{ animationDelay: `${idx * 0.1}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
          idx === 0
            ? 'from-rose-100 to-warm-100'
            : 'from-lavender-100 to-sage-100'
        )}>
          <HandHeart className={cn(
            'w-6 h-6',
            idx === 0 ? 'text-rose-500' : 'text-lavender-500'
          )} strokeWidth={1.8} />
        </div>
        <span className="text-xs text-clay-400 border border-clay-100 px-2.5 py-1 rounded-full">
          保密参与
        </span>
      </div>

      <h4 className="font-bold text-clay-800 mb-2">{program.title}</h4>
      <p className="text-xs text-warm-500 mb-4 leading-relaxed font-medium">
        <Sparkles className="w-3 h-3 inline -mt-0.5 mr-1" />
        {program.reason}
      </p>

      <button
        onClick={() => navigate('/care-channel')}
        className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-rose-400 to-warm-400 text-white shadow-md hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] transition-all"
      >
        立即报名
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function AssessmentResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isForbidden, setIsForbidden] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchResult = async () => {
      if (!user) return
      try {
        const res = await fetch(`/api/assessment/result/${id}?userId=${user.id}`)
        if (res.status === 403) {
          setIsForbidden(true)
          setLoading(false)
          return
        }
        if (res.status === 404) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const result = await res.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || '报告不存在')
        }
      } catch (e) {
        console.error(e)
        setError('获取报告失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [id, user])

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-lavender-200 border-t-lavender-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (isForbidden) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-white border border-rose-100 shadow-xl shadow-rose-100/30 p-8 md:p-10 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-100 to-lavender-100 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-inner">
              <Lock className="w-10 h-10 text-rose-400" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-clay-800 mb-3">您无权查看此报告</h2>
          <p className="text-clay-500 leading-relaxed mb-8">
            这份报告属于其他员工，为保护隐私，您只能查看自己的自测报告。
            所有健康数据均采用端到端加密存储，确保每个人的隐私安全。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/assessment')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 to-lavender-400 text-white font-medium shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-200/60 hover:scale-[1.02] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              返回自测中心
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-clay-100">
            <div className="flex items-center justify-center gap-2 text-xs text-clay-400">
              <Shield className="w-4 h-4" strokeWidth={1.8} />
              <span>隐私保护 · 数据加密 · 仅本人可见</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || error || !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-white border border-clay-100 shadow-lg shadow-clay-100/30 p-8 md:p-10 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-clay-100 to-warm-100" />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-10 h-10 text-warm-400" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-clay-800 mb-3">报告不存在</h2>
          <p className="text-clay-500 leading-relaxed mb-8">
            您要查看的自测报告可能已被删除或不存在。
            您可以前往自测中心完成一次新的健康评估。
          </p>
          <button
            onClick={() => navigate('/assessment')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-lavender-400 to-rose-400 text-white font-medium shadow-lg shadow-lavender-200/50 hover:shadow-xl hover:shadow-lavender-200/60 hover:scale-[1.02] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回自测中心
          </button>
        </div>
      </div>
    )
  }

  const sev = severityConfig[data.severity]
  const isSleep = data.type === 'sleep'
  const maxScore = isSleep ? 24 : 50

  const chartData = isSleep
    ? (data.answers as SleepAnswer[]).map((a, i) => ({
        name: sleepQuestionLabels[a.questionId] || `问题${i + 1}`,
        score: a.value,
        fullMark: 3,
        isHigh: a.value >= 2,
      }))
    : (data.symptoms as SymptomScore[]).map((s) => ({
        name: s.name,
        score: s.score,
        fullMark: 3,
        isHigh: s.score >= 2,
      }))

  const weightedScore = !isSleep && 'weightedScore' in data ? data.weightedScore : null

  const topSymptoms = !isSleep && 'topSymptoms' in data ? data.topSymptoms as TopSymptom[] : []
  const topIssues = isSleep && 'topIssues' in data ? (data.topIssues as SleepIssue[]) || [] : []
  const recommendedPrograms = 'recommendedPrograms' in data ? (data.recommendedPrograms as CareProgramRecommendation[]) || [] : []

  const isSevere = data.severity === 'severe'

  let dailyCareSuggestions: string[] = []
  let specificSuggestions: string[] = []
  let medicalSuggestions: string[] = []

  if (isSleep) {
    const generalCount = isSevere ? 3 : isSevere ? 3 : 4
    dailyCareSuggestions = data.suggestions.slice(0, generalCount)
    specificSuggestions = data.suggestions.slice(generalCount, isSevere ? -3 : undefined)
    if (isSevere) {
      medicalSuggestions = data.suggestions.slice(-3)
    }
  } else {
    const generalCount = isSevere ? 5 : 5
    dailyCareSuggestions = data.suggestions.slice(0, generalCount)
    const specificCount = isSevere ? 4 : 4
    specificSuggestions = data.suggestions.slice(generalCount, generalCount + specificCount)
    if (isSevere) {
      medicalSuggestions = data.suggestions.slice(generalCount + specificCount)
    }
  }

  const highScoreNames = new Set(
    chartData.filter(d => d.isHigh).map(d => d.name)
  )

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="stagger-enter flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/assessment')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-clay-500 hover:text-clay-700 hover:bg-clay-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          返回自测中心
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isSleep ? '/assessment/sleep' : '/assessment/menopause')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-clay-200 text-clay-600 hover:bg-clay-50 hover:border-clay-300 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            重新测试
          </button>
        </div>
      </div>

      <div className="stagger-enter rounded-3xl border border-lavender-100 bg-gradient-to-r from-lavender-50/80 via-rose-50/60 to-warm-50/80 p-5 flex items-start gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-5 h-5 text-lavender-500" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-clay-800">此报告仅您本人可见，数据已匿名处理</p>
          <p className="text-xs text-clay-500 mt-1 leading-relaxed">
            所有评估结果均采用端到端加密存储，不与您的真实身份做公开关联，您可以随时在设置中删除所有自测数据。
          </p>
        </div>
      </div>

      {isSevere && <SevereAlertBanner />}

      <div className="stagger-enter rounded-3xl border border-clay-100 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-clay-50/60 to-white p-8">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <GaugeChart score={data.totalScore} maxScore={maxScore} severity={data.severity} />
              {weightedScore !== null && (
                <div className="text-center mt-3">
                  <span className="text-xs text-clay-400">加权评分: </span>
                  <span className="text-sm font-bold text-lavender-600">{weightedScore.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center lg:text-left w-full">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                  isSleep ? 'from-lavender-100 to-lavender-200' : 'from-rose-100 to-warm-100'
                )}>
                  {isSleep
                    ? <Moon className="w-5 h-5 text-lavender-500" strokeWidth={1.8} />
                    : <Flower2 className="w-5 h-5 text-rose-500" strokeWidth={1.8} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-clay-800">
                    {isSleep ? '睡眠困扰筛查报告' : '围绝经期症状评估报告'}
                  </h2>
                  <p className="text-xs text-clay-400">
                    <Calendar className="w-3 h-3 inline -mt-0.5 mr-1" strokeWidth={1.8} />
                    {new Date(data.submittedAt).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border',
                    sev.bg, sev.text, sev.border
                  )}>
                    <span className={cn('w-2 h-2 rounded-full', sev.dot)} />
                    {sev.label}
                  </span>
                  <span className="text-xs text-clay-400">
                    参考标准：{isSleep ? '≤11 良好 / 12-18 中度 / ≥19 重度' : '≤25 轻度 / 26-45 中度 / ≥46 重度'}
                  </span>
                </div>

                {!isSleep && topSymptoms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-clay-400 mr-1">主要困扰：</span>
                    {topSymptoms.map((symptom, idx) => (
                      <SymptomTag key={symptom.symptomId} symptom={symptom} rank={idx} />
                    ))}
                  </div>
                )}

                {isSleep && topIssues.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-clay-400 mr-1">主要问题：</span>
                    {topIssues.map((issue, idx) => (
                      <SleepIssueTag key={issue.questionId} issue={issue} rank={idx} />
                    ))}
                  </div>
                )}
              </div>

              <p className={cn('text-base leading-relaxed max-w-lg', sev.text)}>
                <Sparkles className="w-4 h-4 inline -mt-0.5 mr-1.5" strokeWidth={1.8} />
                {sev.desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isSleep && topIssues.length > 0 && (
        <div className="stagger-enter rounded-3xl border border-clay-100 bg-white shadow-sm p-7">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-warm-500" strokeWidth={1.8} />
            <h3 className="text-lg font-bold text-clay-800">具体问题分析</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topIssues.map((issue, idx) => (
              <div
                key={issue.questionId}
                className="p-5 rounded-2xl border border-warm-100 bg-gradient-to-br from-warm-50/50 to-rose-50/30 stagger-enter"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    idx === 0 ? 'bg-rose-100' : idx === 1 ? 'bg-warm-100' : 'bg-sage-100'
                  )}>
                    <Clock className={cn(
                      'w-5 h-5',
                      idx === 0 ? 'text-rose-500' : idx === 1 ? 'text-warm-500' : 'text-sage-500'
                    )} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-clay-700">{issue.label}</span>
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        issue.score === 3 ? 'bg-rose-100 text-rose-600' : 'bg-warm-100 text-warm-600'
                      )}>
                        {issue.score === 3 ? '明显' : '轻度'}
                      </span>
                    </div>
                    <p className="text-sm text-clay-600 leading-relaxed">{issue.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stagger-enter rounded-3xl border border-clay-100 bg-white shadow-sm p-7">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-lavender-500" strokeWidth={1.8} />
          <h3 className="text-lg font-bold text-clay-800">
            {isSleep ? '睡眠各维度得分明细' : '十项症状评分雷达图'}
          </h3>
          {highScoreNames.size > 0 && (
            <span className="text-xs text-clay-400 ml-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />
              红点标记 = 需重点关注
            </span>
          )}
        </div>

        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            {isSleep ? (
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0E7E2" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#8F6D5F' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#8F6D5F' }}
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px', border: '1px solid #F0E7E2',
                    boxShadow: '0 8px 24px rgba(172,138,125,0.12)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [value, '得分']}
                />
                <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={38}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isHigh ? '#E26D75' : sleepColors[i % sleepColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#E0CCC2" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#75574B' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 3]}
                  tick={{ fontSize: 11, fill: '#AC8A7D' }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px', border: '1px solid #F0E7E2',
                    boxShadow: '0 8px 24px rgba(172,138,125,0.12)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [value, '评分']}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                />
                <Radar
                  name="症状评分"
                  dataKey="score"
                  stroke="#C77076"
                  strokeWidth={2}
                  fill="url(#menopauseGrad)"
                  fillOpacity={0.45}
                />
                {chartData.map((entry, index) => (
                  entry.isHigh && (
                    <ReferenceDot
                      key={`dot-${index}`}
                      x={entry.name}
                      y={entry.score}
                      r={6}
                      fill="#E26D75"
                      stroke="white"
                      strokeWidth={2}
                    />
                  )
                ))}
                <defs>
                  <linearGradient id="menopauseGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E8B4B8" />
                    <stop offset="100%" stopColor="#F2B880" />
                  </linearGradient>
                </defs>
              </RadarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stagger-enter rounded-3xl border border-clay-100 bg-white shadow-sm p-7">
        <div className="flex items-center gap-2 mb-6">
          <HandHeart className="w-5 h-5 text-rose-500" strokeWidth={1.8} />
          <h3 className="text-lg font-bold text-clay-800">为您定制的健康建议</h3>
        </div>

        <div className="space-y-6">
          {dailyCareSuggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-clay-600 mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-sage-500" />
                日常自我护理
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dailyCareSuggestions.map((s, idx) => (
                  <div
                    key={`daily-${idx}`}
                    className={cn(
                      'p-4 rounded-2xl border transition-all hover:shadow-md stagger-enter',
                      idx % 2 === 0
                        ? 'bg-gradient-to-br from-lavender-50/80 to-rose-50/50 border-lavender-100 hover:border-lavender-200'
                        : 'bg-gradient-to-br from-sage-50/70 to-warm-50/70 border-sage-100 hover:border-sage-200'
                    )}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <SuggestionIcon idx={idx} />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-clay-400 mb-1">建议 {String(idx + 1).padStart(2, '0')}</div>
                        <p className="text-sm text-clay-700 leading-relaxed">{s}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {specificSuggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-clay-600 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-warm-500" />
                针对性症状建议
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specificSuggestions.map((s, idx) => (
                  <div
                    key={`specific-${idx}`}
                    className={cn(
                      'p-4 rounded-2xl border transition-all hover:shadow-md stagger-enter',
                      idx % 2 === 0
                        ? 'bg-gradient-to-br from-warm-50/80 to-rose-50/50 border-warm-100 hover:border-warm-200'
                        : 'bg-gradient-to-br from-rose-50/70 to-lavender-50/50 border-rose-100 hover:border-rose-200'
                    )}
                    style={{ animationDelay: `${(dailyCareSuggestions.length + idx) * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <SuggestionIcon idx={dailyCareSuggestions.length + idx} />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-clay-400 mb-1">
                          建议 {String(dailyCareSuggestions.length + idx + 1).padStart(2, '0')}
                        </div>
                        <p className="text-sm text-clay-700 leading-relaxed">{s}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSevere && medicalSuggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-rose-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" fill="currentColor" fillOpacity={0.3} />
                就医提示
              </h4>
              <MedicalAdviceCard suggestions={medicalSuggestions} />
            </div>
          )}
        </div>
      </div>

      {recommendedPrograms.length > 0 && (
        <div className="stagger-enter rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/60 via-warm-50/60 to-lavender-50/40 p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-500" strokeWidth={1.8} fill="currentColor" fillOpacity={0.15} />
            <h3 className="text-lg font-bold text-clay-800">为您推荐的关怀通道</h3>
          </div>
          <p className="text-sm text-clay-500 mb-6">
            基于你的评估结果，我们为你匹配了以下深度关怀项目，全程保密参与
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendedPrograms.map((prog, idx) => (
              <RecommendedProgramCard key={prog.id} program={prog} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {recommendedPrograms.length === 0 && data.severity !== 'mild' && (
        <div className="stagger-enter rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/60 via-warm-50/60 to-lavender-50/40 p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-500" strokeWidth={1.8} fill="currentColor" fillOpacity={0.15} />
            <h3 className="text-lg font-bold text-clay-800">为您推荐的关怀通道</h3>
          </div>
          <p className="text-sm text-clay-500 mb-6">
            基于你的评估结果，我们为你匹配了以下深度关怀项目，全程保密参与
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RecommendedProgramCard
              program={{
                id: 'fallback-1',
                title: '🌙 夜醒人群专项关怀',
                reason: '针对中度及以上困扰的同事，提供专业睡眠改善支持',
              }}
              idx={0}
            />
            <RecommendedProgramCard
              program={{
                id: 'fallback-2',
                title: '🌸 综合健康管理套餐',
                reason: '适合多种症状叠加困扰的同事，提供全方位关怀',
              }}
              idx={1}
            />
          </div>
        </div>
      )}

      <div className="stagger-enter flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-8">
        <button
          onClick={() => navigate('/assessment')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border border-clay-200 text-clay-600 bg-white hover:bg-clay-50 hover:border-clay-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回自测中心
        </button>
        <button
          onClick={() => navigate(isSleep ? '/assessment/sleep' : '/assessment/menopause')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重新做一次测试
        </button>
      </div>
    </div>
  )
}
