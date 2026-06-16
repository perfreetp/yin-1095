import { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  CalendarCheck,
  Activity as ActivityIcon,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Heart,
  Clock,
  Zap,
  MessageSquare,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { DashboardStats } from 'shared/types'

interface DepartmentStat {
  department: string
  employeeCount: number
  totalCount: number
  sleepCount: number
  menopauseCount: number
  severityDistribution: { mild: number; moderate: number; severe: number }
  avgSeverityScore: number
  participationRate: number
  monthlyTrend: { month: string; count: number }[]
}

interface SymptomStat {
  name: string
  totalCount: number
  percentage: number
  severityDistribution: { mild: number; moderate: number; severe: number }
  departmentDistribution: { department: string; count: number }[]
}

const COLORS = ['#B55359', '#754994', '#4E7745', '#A87C3C', '#DB7E20', '#AD8AC0', '#84A97C', '#D3B88F', '#C77076', '#9067AB']

const THEME_COLORS = {
  rose: '#B55359',
  lavender: '#754994',
  sage: '#4E7745',
  sunset: '#DB7E20',
}

function formatMonth(dateStr: string) {
  const [year, month] = dateStr.split('-')
  return `${year.slice(2)}/${month}`
}

function getLast6Months() {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

type ColorKey = 'rose' | 'lavender' | 'sage' | 'sunset'

interface EffectTrackingData {
  exerciseTrends: Array<{ month: string; [key: string]: number | string }>
  activitySatisfactionTrends: Array<{ month: string; satisfaction: number; avgRating: number }>
  severityImprovementTrends: Array<{
    month: string
    department: string
    firstScore: number
    latestScore: number
    improvement: number
  }>
  careChannelEfficiency: {
    totalApplications: number
    pendingCount: number
    processingCount: number
    completedCount: number
    avgResponseTime: number
    completionRate: number
    funnelData: Array<{ name: string; value: number; fill: string }>
  }
  topImprovements: Array<{
    department: string
    improvement: number
    currentScore: number
    trend: 'up' | 'down' | 'stable'
  }>
  recommendedActions: Array<{
    id: string
    type: 'urgent' | 'warning' | 'suggestion'
    department: string
    message: string
    action: string
  }>
}

type EffectTabKey = 'exercise' | 'satisfaction' | 'improvement' | 'efficiency'

const effectTabs: { key: EffectTabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'exercise', label: '练习趋势', icon: Heart },
  { key: 'satisfaction', label: '活动满意度', icon: Sparkles },
  { key: 'improvement', label: '健康改善', icon: TrendingUp },
  { key: 'efficiency', label: '关怀效率', icon: Zap },
]

const departmentColors: Record<string, string> = {
  '技术部': '#B55359',
  '产品部': '#754994',
  '市场部': '#4E7745',
  '人力资源部': '#DB7E20',
  '财务部': '#AD8AC0',
  '运营部': '#84A97C',
  '销售部': '#D3B88F',
  '法务部': '#C77076',
  '客户服务部': '#9067AB',
  '行政部': '#A87C3C',
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardStats | null>(null)
  const [departments, setDepartments] = useState<DepartmentStat[]>([])
  const [symptoms, setSymptoms] = useState<SymptomStat[]>([])
  const [effectData, setEffectData] = useState<EffectTrackingData | null>(null)
  const [activeEffectTab, setActiveEffectTab] = useState<EffectTabKey>('exercise')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, deptRes, symRes, effectRes] = await Promise.all([
          fetch('/api/admin/stats/overview').then((r) => r.json()),
          fetch('/api/admin/stats/department').then((r) => r.json()),
          fetch('/api/admin/stats/symptoms').then((r) => r.json()),
          fetch('/api/admin/effect-tracking').then((r) => r.json()),
        ])
        if (overviewRes.success) setOverview(overviewRes.data)
        if (deptRes.success) setDepartments(deptRes.data)
        if (symRes.success) setSymptoms(symRes.data)
        if (effectRes.success) setEffectData(effectRes.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const last6Months = getLast6Months()

  const trendData = last6Months.map((month) => {
    let sleepCount = 0
    let menopauseCount = 0
    departments.forEach((d) => {
      const m = d.monthlyTrend.find((t) => t.month === month)
      if (m) {
        const ratio = d.totalCount > 0 ? d.sleepCount / d.totalCount : 0.4
        sleepCount += Math.round(m.count * ratio)
        menopauseCount += Math.round(m.count * (1 - ratio))
      }
    })
    return {
      month: formatMonth(month),
      睡眠: sleepCount,
      围绝经期: menopauseCount,
    }
  })

  const top5Symptoms = symptoms.slice(0, 5).map((s) => ({
    name: s.name,
    value: s.totalCount,
  }))

  const barData = departments.map((d) => ({
    department: d.department.slice(0, 3),
    fullName: d.department,
    avgScore: d.avgSeverityScore,
  }))

  const heatmapData = departments.map((d) => ({
    department: d.department,
    轻度: d.severityDistribution.mild,
    中度: d.severityDistribution.moderate,
    重度: d.severityDistribution.severe,
    total: d.totalCount,
  }))

  const heatmapMax = Math.max(...heatmapData.map((d) => d.total), 1)

  const topConcernDepts = [...departments]
    .sort((a, b) => b.avgSeverityScore - a.avgSeverityScore)
    .slice(0, 5)

  const kpiCards = overview
    ? [
        {
          title: '总参与人数',
          value: overview.totalParticipants,
          icon: Users,
          color: 'rose' as ColorKey,
          trend: 12.5,
          trendUp: true,
          suffix: '人',
        },
        {
          title: '部门参与率',
          value: overview.participationRate,
          icon: Target,
          color: 'lavender' as ColorKey,
          trend: 5.2,
          trendUp: true,
          suffix: '%',
        },
        {
          title: '本月新增自测数',
          value: 48,
          icon: ActivityIcon,
          color: 'sage' as ColorKey,
          trend: 8.3,
          trendUp: true,
          suffix: '份',
        },
        {
          title: '活动参与人次',
          value: overview.activityStats.registered,
          icon: CalendarCheck,
          color: 'sunset' as ColorKey,
          trend: 3.1,
          trendUp: false,
          suffix: '人次',
        },
      ]
    : []

  const colorClasses: Record<ColorKey, string> = {
    rose: 'from-rose-50 to-rose-100/60 text-rose-500 border-rose-100',
    lavender: 'from-lavender-50 to-lavender-100/60 text-lavender-500 border-lavender-100',
    sage: 'from-sage-50 to-sage-100/60 text-sage-500 border-sage-100',
    sunset: 'from-sunset-50 to-sunset-100/60 text-sunset-500 border-sunset-100',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-clay-900">数据看板</h1>
          <p className="text-clay-500 mt-1">全局关怀数据一览</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sage-50 to-lavender-50 border border-sage-200/60 text-sm">
          <ShieldCheck className="w-4 h-4 text-sage-500" strokeWidth={1.8} />
          <span className="text-sage-700 font-medium">
            所有数据均为部门级聚合，不含任何个人可识别信息
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br backdrop-blur-sm border p-6 shadow-sm hover:shadow-md transition-all',
                colorClasses[card.color],
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-clay-500 font-medium">{card.title}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-clay-900">{card.value}</span>
                    <span className="text-clay-500 text-lg">{card.suffix}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {card.trendUp ? (
                      <TrendingUp className="w-4 h-4 text-sage-500" strokeWidth={2} />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-500" strokeWidth={2} />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        card.trendUp ? 'text-sage-600' : 'text-rose-600',
                      )}
                    >
                      {card.trend}%
                    </span>
                    <span className="text-xs text-clay-400">较上月</span>
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

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-clay-800">6个月自测参与趋势</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-clay-600">睡眠</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-lavender-400" />
                <span className="text-clay-600">围绝经期</span>
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.rose} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={THEME_COLORS.rose} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="menoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.lavender} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={THEME_COLORS.lavender} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E7E2" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={{ stroke: '#E0CCC2' }} tickLine={false} />
                <YAxis tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E0CCC2',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(143,109,95,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="睡眠"
                  stroke={THEME_COLORS.rose}
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'white', stroke: THEME_COLORS.rose, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="围绝经期"
                  stroke={THEME_COLORS.lavender}
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'white', stroke: THEME_COLORS.lavender, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-clay-800 mb-4">Top5症状分布</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={top5Symptoms}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {top5Symptoms.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E0CCC2',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {top5Symptoms.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-clay-600 flex-1 truncate">{s.name}</span>
                <span className="text-clay-500 font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-clay-800 mb-5">部门平均严重程度对照</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E7E2" vertical={false} />
              <XAxis dataKey="department" tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={{ stroke: '#E0CCC2' }} tickLine={false} />
              <YAxis domain={[0, 3]} tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number, _name: string, props: { payload: { fullName: string } }) => [
                  `${props.payload.fullName}: ${value} 分`,
                  '平均严重程度',
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E0CCC2',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(143,109,95,0.1)',
                }}
              />
              <Bar dataKey="avgScore" radius={[8, 8, 0, 0]} barSize={32}>
                {barData.map((entry, index) => {
                  const hue = 350 - (index * 25) / barData.length
                  const lightness = Math.max(40, 70 - entry.avgScore * 8)
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${hue}, 45%, ${lightness}%)`}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-clay-800 mb-5">症状严重程度热力图</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-clay-500 font-medium pb-3 pr-4">部门</th>
                  <th className="text-center text-clay-500 font-medium pb-3 px-2 w-24">轻度</th>
                  <th className="text-center text-clay-500 font-medium pb-3 px-2 w-24">中度</th>
                  <th className="text-center text-clay-500 font-medium pb-3 px-2 w-24">重度</th>
                  <th className="text-center text-clay-500 font-medium pb-3 pl-4 w-28">合计</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.department} className="border-t border-clay-50">
                    <td className="py-3 pr-4 text-clay-700 font-medium">
                      {row.department}
                    </td>
                    {(['轻度', '中度', '重度'] as const).map((level) => {
                      const count = row[level]
                      const intensity = count / heatmapMax
                      const bgColor =
                        level === '轻度'
                          ? `rgba(78, 119, 69, ${0.2 + intensity * 0.6})`
                          : level === '中度'
                          ? `rgba(219, 126, 32, ${0.2 + intensity * 0.6})`
                          : `rgba(181, 83, 89, ${0.2 + intensity * 0.6})`
                      return (
                        <td key={level} className="px-2 py-3">
                          <div
                            className={cn(
                              'h-10 rounded-lg flex items-center justify-center font-medium',
                              count > 0 ? 'text-white' : 'text-clay-400',
                            )}
                            style={{ backgroundColor: count > 0 ? bgColor : '#FBF3F4' }}
                          >
                            {count > 0 ? count : '-'}
                          </div>
                        </td>
                      )
                    })}
                    <td className="text-center text-clay-600 font-semibold pl-4">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-clay-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(78, 119, 69, 0.5)' }} />
              轻度
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(219, 126, 32, 0.5)' }} />
              中度
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(181, 83, 89, 0.5)' }} />
              重度
            </span>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-clay-800">高关注部门</h3>
            <Sparkles className="w-5 h-5 text-sunset-500" strokeWidth={1.8} />
          </div>
          <div className="space-y-3">
            {topConcernDepts.map((dept, idx) => (
              <div
                key={dept.department}
                className="p-4 rounded-xl bg-gradient-to-r from-rose-50/60 to-transparent border border-rose-100/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                      {dept.department.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-clay-800">{dept.department}</div>
                      <div className="text-xs text-clay-500 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-sunset-500" strokeWidth={2} />
                        主要关注：{dept.avgSeverityScore > 2 ? '严重' : dept.avgSeverityScore > 1.5 ? '中度' : '轻度'}级别
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-clay-900">{dept.avgSeverityScore.toFixed(1)}</div>
                    <div className="text-xs text-clay-400">平均分数</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 px-3 py-1.5 rounded-lg bg-lavender-50 text-lavender-600 font-medium text-center truncate">
                    参与率 {dept.participationRate}%
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors">
                    建议操作
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {effectData && (
        <div className="stagger-enter">
          <div className="card-hover rounded-3xl bg-white p-6 md:p-8 border border-clay-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-clay-900 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-lavender-500" />
                  效果追踪分析
                </h2>
                <p className="text-sm text-clay-500">多维度追踪员工健康改善效果</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {effectTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveEffectTab(tab.key)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2',
                      activeEffectTab === tab.key
                        ? 'bg-gradient-to-r from-lavender-500 to-rose-500 text-white shadow-lg shadow-lavender-200'
                        : 'bg-clay-50 text-clay-600 hover:bg-clay-100',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="min-h-[400px]">
              {activeEffectTab === 'exercise' && effectData.exerciseTrends && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-clay-500">各部门近6个月人均练习次数</p>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={effectData.exerciseTrends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          {Object.entries(departmentColors).map(([dept, color]) => (
                            <linearGradient key={dept} id={`areaGradient-${dept}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                              <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0E7E2" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={{ stroke: '#E0CCC2' }} tickLine={false} />
                        <YAxis tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E0CCC2',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(143,109,95,0.1)',
                          }}
                        />
                        <Legend />
                        {Object.entries(departmentColors).map(([dept, color]) => (
                          <Area
                            key={dept}
                            type="monotone"
                            dataKey={dept}
                            stackId="1"
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#areaGradient-${dept})`}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeEffectTab === 'satisfaction' && effectData.activitySatisfactionTrends && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-sunset-50 to-rose-50 border border-sunset-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sunset-400 to-rose-500 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-clay-500">平均满意度</p>
                          <p className="text-2xl font-bold text-clay-900">
                            {effectData.activitySatisfactionTrends.length > 0
                              ? (
                                  effectData.activitySatisfactionTrends.reduce((sum, d) => sum + d.avgRating, 0) /
                                  effectData.activitySatisfactionTrends.length
                                ).toFixed(1)
                              : '0.0'}
                            <span className="text-lg text-clay-400 ml-1">/ 5</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={effectData.activitySatisfactionTrends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0E7E2" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={{ stroke: '#E0CCC2' }} tickLine={false} />
                        <YAxis tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 5]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E0CCC2',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(143,109,95,0.1)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgRating"
                          name="满意度评分"
                          stroke="#DB7E20"
                          strokeWidth={3}
                          dot={{ r: 6, fill: 'white', stroke: '#DB7E20', strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeEffectTab === 'improvement' && effectData.topImprovements && (
                <div>
                  <p className="text-sm text-clay-500 mb-4">各部门严重程度改善幅度（分数下降越多表示改善越明显）</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={effectData.topImprovements} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0E7E2" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={{ stroke: '#E0CCC2' }} tickLine={false} />
                        <YAxis dataKey="department" type="category" tick={{ fill: '#8F6D5F', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E0CCC2',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(143,109,95,0.1)',
                          }}
                          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)} 分`, '改善幅度']}
                        />
                        <Bar
                          dataKey="improvement"
                          name="改善幅度"
                          radius={[0, 8, 8, 0]}
                          fill="#4E7745"
                        >
                          {effectData.topImprovements.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.improvement > 0 ? '#4E7745' : '#B55359'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeEffectTab === 'efficiency' && effectData.careChannelEfficiency && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-lavender-50 to-rose-50 border border-lavender-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-400 to-rose-400 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-clay-500">平均响应时间</p>
                          <p className="text-2xl font-bold text-clay-900">
                            {effectData.careChannelEfficiency.avgResponseTime.toFixed(1)}
                            <span className="text-lg text-clay-400 ml-1">小时</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-sage-50 to-lavender-50 border border-sage-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-400 to-lavender-400 flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-clay-500">申请完成率</p>
                          <p className="text-2xl font-bold text-clay-900">
                            {effectData.careChannelEfficiency.completionRate.toFixed(1)}
                            <span className="text-lg text-clay-400 ml-1">%</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-sunset-50 to-sage-50 border border-sunset-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sunset-400 to-sage-400 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-clay-500">总申请数</p>
                          <p className="text-2xl font-bold text-clay-900">
                            {effectData.careChannelEfficiency.totalApplications}
                            <span className="text-lg text-clay-400 ml-1">件</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E0CCC2',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(143,109,95,0.1)',
                          }}
                          formatter={(value: number, name: string) => [`${value} 件`, name]}
                        />
                        <Legend />
                        <Pie
                          data={effectData.careChannelEfficiency.funnelData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          innerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${value}件 (${(percent * 100).toFixed(0)}%)`}
                        >
                          {effectData.careChannelEfficiency.funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {effectData?.recommendedActions && effectData.recommendedActions.length > 0 && (
        <div className="stagger-enter">
          <div className="card-hover rounded-3xl bg-white p-6 md:p-8 border border-clay-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-clay-900 mb-1 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sunset-500" />
                  智能建议
                </h2>
                <p className="text-sm text-clay-500">基于数据分析的行动建议</p>
              </div>
            </div>

            <div className="space-y-4">
              {effectData.recommendedActions.map((action) => {
                const typeStyles = {
                  urgent: {
                    bg: 'bg-gradient-to-r from-rose-50 to-rose-100/50',
                    border: 'border-rose-200',
                    badge: 'bg-rose-500',
                    icon: AlertTriangle,
                    iconColor: 'text-rose-500',
                  },
                  warning: {
                    bg: 'bg-gradient-to-r from-sunset-50 to-sunset-100/50',
                    border: 'border-sunset-200',
                    badge: 'bg-sunset-500',
                    icon: TrendingUp,
                    iconColor: 'text-sunset-500',
                  },
                  suggestion: {
                    bg: 'bg-gradient-to-r from-lavender-50 to-lavender-100/50',
                    border: 'border-lavender-200',
                    badge: 'bg-lavender-500',
                    icon: Sparkles,
                    iconColor: 'text-lavender-500',
                  },
                }
                const styles = typeStyles[action.type]
                const Icon = styles.icon

                return (
                  <div
                    key={action.id}
                    className={cn(
                      'p-4 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4',
                      styles.bg,
                      styles.border,
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn('p-2 rounded-xl bg-white flex-shrink-0', styles.iconColor)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium text-white', styles.badge)}>
                            {action.type === 'urgent' ? '紧急' : action.type === 'warning' ? '警告' : '建议'}
                          </span>
                          <span className="font-bold text-clay-800">{action.department}</span>
                        </div>
                        <p className="text-sm text-clay-600">{action.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`已安排：${action.action}`)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-lavender-500 to-rose-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-lavender-200 transition-all inline-flex items-center gap-2 flex-shrink-0"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      {action.action}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
