import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Shield, ArrowLeft, RotateCcw, Moon, Flower2, Lightbulb,
  Clock, BookOpen, Heart, Activity, Calendar, ArrowRight,
  HandHeart, Sparkles, Leaf, Target, Coffee, AlertTriangle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { SleepAssessment, MenopauseAssessment, CareProgram, SleepAnswer, SymptomScore } from '../../shared/types'

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
  const icons = [Lightbulb, Clock, Leaf, Target, Heart, Coffee, BookOpen, Sparkles]
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

export default function AssessmentResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [carePrograms, setCarePrograms] = useState<CareProgram[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/assessment/result/${id}`)
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
  }, [id])

  useEffect(() => {
    if (!data) return
    if (data.severity === 'mild') return

    const fetchPrograms = async () => {
      try {
        const res = await fetch('/api/care-channel/programs')
        const result = await res.json()
        if (result.success) {
          const allPrograms: CareProgram[] = result.data.programs || result.data
          const programs = allPrograms.filter((p) => {
            if (data.type === 'sleep') return p.title.includes('夜醒') || p.title.includes('疲劳') || p.title.includes('综合')
            return p.title.includes('焦虑') || p.title.includes('综合') || p.title.includes('疲劳')
          }).slice(0, 2)
          setCarePrograms(programs)
        }
      } catch (e) {
        const fallbackPrograms: CareProgram[] = [
          {
            id: 'fallback-1',
            title: '🌙 夜醒人群专项关怀',
            targetGroup: '睡眠困扰较明显的同事',
            description: '针对睡眠自测达到中度及以上困扰的同事，提供睡眠改善专项支持。',
            benefits: ['1对1睡眠健康咨询', '睡眠监测指导', '专家门诊绿色通道'],
            eligibilityCriteria: ['睡眠自测结果中度及以上'],
            privacyCommitment: '所有信息严格保密',
          },
          {
            id: 'fallback-2',
            title: '🌸 综合健康管理套餐',
            targetGroup: '多种症状叠加困扰的同事',
            description: '提供全方位的健康评估与持续关怀服务。',
            benefits: ['全面健康评估', '持续跟进关怀', '多学科专家咨询'],
            eligibilityCriteria: ['任一自测结果中度及以上'],
            privacyCommitment: '所有信息严格保密',
          },
        ]
        setCarePrograms(fallbackPrograms)
      }
    }
    fetchPrograms()
  }, [data])

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-lavender-200 border-t-lavender-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[400px] rounded-2xl border border-rose-100 bg-white/50 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-400" strokeWidth={1.5} />
        <p className="text-clay-600 font-medium">{error || '报告不存在'}</p>
        <button
          onClick={() => navigate('/assessment')}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-300 to-lavender-300 text-white text-sm font-medium hover:shadow-md transition-all"
        >
          返回自测中心
        </button>
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
      }))
    : (data.symptoms as SymptomScore[]).map((s) => ({
        name: s.name,
        score: s.score,
        fullMark: 3,
      }))

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

      <div className="stagger-enter rounded-3xl border border-clay-100 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-clay-50/60 to-white p-8">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <GaugeChart score={data.totalScore} maxScore={maxScore} severity={data.severity} />
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

              <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border',
                  sev.bg, sev.text, sev.border
                )}>
                  <span className={cn('w-2 h-2 rounded-full', sev.dot)} />
                  {sev.label}
                </span>
                <span className="text-xs text-clay-400">
                  参考标准：{isSleep ? '≤11 良好 / 12-18 中度 / ≥19 重度' : '≤20 轻度 / 21-35 中度 / ≥36 重度'}
                </span>
              </div>

              <p className={cn('text-base leading-relaxed max-w-lg', sev.text)}>
                <Sparkles className="w-4 h-4 inline -mt-0.5 mr-1.5" strokeWidth={1.8} />
                {sev.desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-enter rounded-3xl border border-clay-100 bg-white shadow-sm p-7">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-lavender-500" strokeWidth={1.8} />
          <h3 className="text-lg font-bold text-clay-800">
            {isSleep ? '睡眠各维度得分明细' : '十项症状评分雷达图'}
          </h3>
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
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={sleepColors[i % sleepColors.length]} />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.suggestions.map((s, idx) => (
            <div
              key={idx}
              className={cn(
                'p-5 rounded-2xl border transition-all hover:shadow-md stagger-enter',
                idx % 2 === 0
                  ? 'bg-gradient-to-br from-lavender-50/80 to-rose-50/50 border-lavender-100 hover:border-lavender-200'
                  : 'bg-gradient-to-br from-sage-50/70 to-warm-50/70 border-sage-100 hover:border-sage-200'
              )}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start gap-3.5">
                <SuggestionIcon idx={idx} />
                <div className="flex-1">
                  <div className="text-xs font-bold text-clay-400 mb-1.5">建议 {String(idx + 1).padStart(2, '0')}</div>
                  <p className="text-sm text-clay-700 leading-relaxed">{s}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.severity !== 'mild' && carePrograms.length > 0 && (
        <div className="stagger-enter rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/60 via-warm-50/60 to-lavender-50/40 p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-500" strokeWidth={1.8} fill="currentColor" fillOpacity={0.15} />
            <h3 className="text-lg font-bold text-clay-800">为您推荐的关怀通道</h3>
          </div>
          <p className="text-sm text-clay-500 mb-6">
            基于你的评估结果，我们为你匹配了以下深度关怀项目，全程保密参与
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {carePrograms.map((prog, idx) => (
              <div
                key={prog.id}
                className="rounded-2xl bg-white p-6 border border-clay-100 shadow-sm hover:shadow-lg hover:shadow-rose-100/50 transition-all stagger-enter"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
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

                <h4 className="font-bold text-clay-800 mb-2">{prog.title}</h4>
                <p className="text-xs text-clay-500 leading-relaxed mb-4 line-clamp-2">{prog.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {prog.benefits.slice(0, 3).map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-clay-50 text-[11px] text-clay-600"
                    >
                      <Leaf className="w-3 h-3 text-sage-500" strokeWidth={2} />
                      {b.length > 10 ? b.slice(0, 10) + '…' : b}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/care-channel')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-rose-400 to-warm-400 text-white shadow-md hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] transition-all"
                >
                  立即报名
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
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
