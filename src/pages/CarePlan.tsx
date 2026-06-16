import { useState, useEffect } from 'react'
import {
  Sun,
  Wind,
  Brain,
  ScanLine,
  Play,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Heart,
  Moon,
  Sunrise,
  TreePine,
  Sparkles,
  CalendarDays,
  Home as HomeIcon,
  Building2,
} from 'lucide-react'
import type { Exercise, SleepTip, ExerciseCategory } from '../../shared/types'
import { cn } from '@/lib/utils'

type TabKey = 'exercises' | 'weekend' | 'sleep-tips'
type ExerciseFilter = 'all' | ExerciseCategory
type SceneKey = 'office' | 'home'

const categoryConfig: Record<
  ExerciseCategory,
  { label: string; icon: typeof Wind; color: string; bg: string; border: string; gradient: string }
> = {
  breathing: {
    label: '呼吸练习',
    icon: Wind,
    color: 'text-sage-600',
    bg: 'bg-sage-50',
    border: 'border-sage-200',
    gradient: 'from-sage-200 to-sage-300',
  },
  meditation: {
    label: '正念冥想',
    icon: Brain,
    color: 'text-lavender-600',
    bg: 'bg-lavender-50',
    border: 'border-lavender-200',
    gradient: 'from-lavender-200 to-lavender-300',
  },
  bodyscan: {
    label: '身体扫描',
    icon: ScanLine,
    color: 'text-sunset-600',
    bg: 'bg-sunset-50',
    border: 'border-sunset-200',
    gradient: 'from-sunset-200 to-sunset-300',
  },
}

const filterOptions: { key: ExerciseFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'breathing', label: '呼吸练习' },
  { key: 'meditation', label: '正念冥想' },
  { key: 'bodyscan', label: '身体扫描' },
]

const weekendActivities = [
  {
    day: '周六',
    time: '08:00 - 09:00',
    title: '晨间唤醒瑜伽',
    desc: '温和的拉伸体式，唤醒沉睡的身体，开启元气满满的周末',
    icon: Sunrise,
    color: 'from-sunset-200 to-sunset-300',
    duration: '60分钟',
  },
  {
    day: '周六',
    time: '10:30 - 11:30',
    title: '户外自然散步',
    desc: '在公园或林间漫步，倾听鸟鸣，感受阳光，让心灵回归自然',
    icon: TreePine,
    color: 'from-sage-200 to-sage-300',
    duration: '60分钟',
  },
  {
    day: '周日',
    time: '09:00 - 09:30',
    title: '晨间冥想营',
    desc: '集体正念冥想，在平静的氛围中与内心对话，积蓄一周能量',
    icon: Sparkles,
    color: 'from-lavender-200 to-lavender-300',
    duration: '30分钟',
  },
  {
    day: '周日',
    time: '15:00 - 16:00',
    title: '下午茶与阅读',
    desc: '泡一杯喜爱的茶，翻开一本书，享受属于自己的安静时光',
    icon: Heart,
    color: 'from-rose-200 to-rose-300',
    duration: '60分钟',
  },
]

const timelineSteps = [
  {
    time: '周五晚上',
    title: '放下工作模式',
    desc: '关闭工作通知，整理桌面，做一次5分钟放松呼吸，告诉自己"本周辛苦了"',
    icon: Moon,
    color: 'bg-lavender-500',
  },
  {
    time: '周六上午',
    title: '身体动起来',
    desc: '瑜伽、散步、骑行，选择喜欢的方式让身体舒展，释放一周积累的紧张',
    icon: Sunrise,
    color: 'bg-sunset-500',
  },
  {
    time: '周六下午',
    title: '兴趣时光',
    desc: '做一件纯粹因为喜欢而做的事：画画、烘焙、听音乐、摆弄花草',
    icon: Sparkles,
    color: 'bg-rose-500',
  },
  {
    time: '周日上午',
    title: '静心冥想',
    desc: '30分钟冥想或正念练习，与自己的内心对话，清理情绪垃圾',
    icon: Brain,
    color: 'bg-lavender-500',
  },
  {
    time: '周日下午',
    title: '轻度准备',
    desc: '花30分钟规划下周，列出3件最重要的事，避免周日焦虑',
    icon: CalendarDays,
    color: 'bg-sage-500',
  },
  {
    time: '周日晚上',
    title: '早睡仪式',
    desc: '晚上10点后放下电子设备，泡脚、阅读、深呼吸，为新一周储备能量',
    icon: Moon,
    color: 'bg-sunset-500',
  },
]

const sleepCategoryMap: Record<string, string[]> = {
  office: ['作息规律', '日间习惯', '环境准备', '饮食注意'],
  home: ['作息规律', '环境准备', '饮食注意', '睡前仪式', '认知行为', '情绪管理', '工具辅助', '医学建议'],
}

export default function CarePlan() {
  const [activeTab, setActiveTab] = useState<TabKey>('exercises')
  const [exerciseFilter, setExerciseFilter] = useState<ExerciseFilter>('all')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sleepTips, setSleepTips] = useState<SleepTip[]>([])
  const [groupedTips, setGroupedTips] = useState<Record<string, SleepTip[]>>({})
  const [checkedTips, setCheckedTips] = useState<Record<string, boolean>>({})
  const [scene, setScene] = useState<SceneKey>('home')

  useEffect(() => {
    const saved = localStorage.getItem('sleep-tips-checked')
    if (saved) {
      try {
        setCheckedTips(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sleep-tips-checked', JSON.stringify(checkedTips))
  }, [checkedTips])

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (exerciseFilter !== 'all') {
          params.set('category', exerciseFilter)
        }
        const res = await fetch(`/api/care-plan/exercises?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setExercises(json.data)
        }
      } catch (e) {
        console.error('Failed to fetch exercises', e)
      } finally {
        setLoading(false)
      }
    }
    fetchExercises()
  }, [exerciseFilter])

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const res = await fetch('/api/care-plan/tips')
        const json = await res.json()
        if (json.success) {
          setSleepTips(json.data.list)
          setGroupedTips(json.data.groupedByCategory || {})
        }
      } catch (e) {
        console.error('Failed to fetch sleep tips', e)
      }
    }
    fetchTips()
  }, [])

  const toggleTip = (id: string) => {
    setCheckedTips((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const visibleCategories = sleepCategoryMap[scene]
  const totalVisibleTips = sleepTips.filter((t) => visibleCategories.includes(t.category)).length
  const completedTips = sleepTips.filter(
    (t) => visibleCategories.includes(t.category) && checkedTips[t.id],
  ).length
  const completionPercent = totalVisibleTips > 0 ? Math.round((completedTips / totalVisibleTips) * 100) : 0

  const handlePlay = (id: string) => {
    setIsPlaying(isPlaying === id ? null : id)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 11) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-rose-50 via-warm-50 to-lavender-50 border border-rose-100/60">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-gradient-to-br from-rose-200/50 to-transparent blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-72 h-72 rounded-full bg-gradient-to-tr from-lavender-200/40 to-transparent blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-300 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-200/60">
                <Sun className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-clay-900">
                {getGreeting()}，愿你今日身心安好
              </h1>
            </div>
            <p className="text-clay-600 text-base leading-relaxed max-w-2xl">
              这里是专属于你的心灵疗愈空间。无论今天过得怎样，都请记得留一点时间给自己。
              跟随呼吸的节奏，让身心在温柔的练习中慢慢舒展。
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white shadow-sm">
            <div className="text-xs text-clay-500">今日练习</div>
            <div className="text-3xl font-bold text-rose-500">
              {Object.keys(checkedTips).length > 0 ? '已坚持' : '0'}
            </div>
            <div className="text-xs text-clay-400">{Object.keys(checkedTips).length} 项小习惯</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 rounded-2xl bg-clay-50 border border-clay-100 w-fit">
        {[
          { key: 'exercises' as TabKey, label: '放松练习', icon: Wind },
          { key: 'weekend' as TabKey, label: '周末调息', icon: CalendarDays },
          { key: 'sleep-tips' as TabKey, label: '睡眠卫生清单', icon: Moon },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300',
              activeTab === tab.key
                ? 'bg-white text-rose-600 shadow-md shadow-rose-100/60'
                : 'text-clay-500 hover:text-clay-700 hover:bg-white/50',
            )}
          >
            <tab.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'exercises' && (
        <div className="space-y-6 stagger-enter">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setExerciseFilter(opt.key)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border',
                  exerciseFilter === opt.key
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200/50'
                    : 'bg-white text-clay-600 border-clay-100 hover:border-rose-200 hover:text-rose-500',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-3xl bg-clay-50 animate-pulse stagger-enter"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exercises.map((ex, idx) => {
                const cfg = categoryConfig[ex.category]
                const Icon = cfg.icon
                const isExpanded = expandedId === ex.id
                const isThisPlaying = isPlaying === ex.id

                return (
                  <div
                    key={ex.id}
                    className={cn(
                      'stagger-enter group relative rounded-3xl bg-white border border-clay-100 overflow-hidden transition-all duration-500 ease-out card-hover',
                      isExpanded ? 'lg:col-span-3' : '',
                    )}
                    style={{ animationDelay: `${(idx % 10) * 0.1}s` }}
                  >
                    {!isExpanded ? (
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedId(ex.id)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={cn(
                              'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                              cfg.gradient,
                            )}
                          >
                            <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                          </div>
                          <span
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium border',
                              cfg.bg,
                              cfg.color,
                              cfg.border,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-clay-800 mb-2 group-hover:text-rose-500 transition-colors line-clamp-1">
                          {ex.title}
                        </h3>
                        <p className="text-sm text-clay-500 leading-relaxed line-clamp-2 mb-4">
                          {ex.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-clay-400 text-sm">
                            <Clock className="w-4 h-4" strokeWidth={1.8} />
                            <span>{ex.duration} 分钟</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <span className="text-xs text-rose-500 font-medium">查看详情</span>
                            <ChevronRight className="w-4 h-4 text-rose-500" strokeWidth={2} />
                          </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-0 group-hover:h-14 transition-all duration-300 overflow-hidden">
                          <div
                            className={cn(
                              'h-full flex items-center justify-center gap-2 text-white font-medium text-sm',
                              'bg-gradient-to-r from-rose-400 to-rose-500',
                            )}
                          >
                            <Play className="w-4.5 h-4.5" strokeWidth={2} fill="currentColor" />
                            立即开始练习
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="lg:w-1/3 flex flex-col items-center gap-6">
                            <div className="relative">
                              <div
                                className={cn(
                                  'w-40 h-40 rounded-full flex items-center justify-center bg-gradient-to-br shadow-xl transition-all duration-500',
                                  cfg.gradient,
                                  isThisPlaying ? 'breathing' : '',
                                )}
                                style={{
                                  boxShadow: isThisPlaying
                                    ? '0 0 60px rgba(232, 180, 184, 0.5)'
                                    : undefined,
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePlay(ex.id)
                                  }}
                                  className="w-24 h-24 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-inner hover:scale-105 transition-transform"
                                >
                                  <Play
                                    className={cn(
                                      'w-10 h-10 ml-1',
                                      cfg.color,
                                      isThisPlaying ? 'animate-pulse' : '',
                                    )}
                                    strokeWidth={2.5}
                                    fill="currentColor"
                                  />
                                </button>
                              </div>
                              {isThisPlaying && (
                                <div className="absolute inset-0 rounded-full border-4 border-rose-200/60 animate-ping" />
                              )}
                            </div>
                            <div className="text-center space-y-2">
                              <span
                                className={cn(
                                  'inline-block px-4 py-1.5 rounded-full text-xs font-medium border',
                                  cfg.bg,
                                  cfg.color,
                                  cfg.border,
                                )}
                              >
                                {cfg.label}
                              </span>
                              <h3 className="text-2xl font-bold text-clay-800">{ex.title}</h3>
                              <div className="flex items-center justify-center gap-1.5 text-clay-500 text-sm">
                                <Clock className="w-4 h-4" strokeWidth={1.8} />
                                <span>约 {ex.duration} 分钟 · {ex.steps.length} 个步骤</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedId(null)}
                              className="w-full py-3 rounded-xl border border-clay-200 text-clay-600 text-sm font-medium hover:bg-clay-50 transition-colors"
                            >
                              收起详情
                            </button>
                          </div>

                          <div className="lg:w-2/3 space-y-4">
                            <p className="text-clay-600 leading-relaxed text-base">
                              {ex.description}
                            </p>
                            <div className="space-y-3 pt-2">
                              <h4 className="text-sm font-bold text-clay-700 flex items-center gap-2">
                                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-400 to-rose-500" />
                                练习步骤
                              </h4>
                              <div className="space-y-3">
                                {ex.steps.map((step, stepIdx) => (
                                  <div
                                    key={stepIdx}
                                    className="flex gap-4 p-4 rounded-2xl bg-gradient-to-r from-warm-50 to-rose-50/50 border border-warm-100 stagger-enter"
                                    style={{ animationDelay: `${stepIdx * 0.08}s` }}
                                  >
                                    <div
                                      className={cn(
                                        'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm bg-gradient-to-br',
                                        cfg.gradient,
                                      )}
                                    >
                                      {stepIdx + 1}
                                    </div>
                                    <p className="text-clay-700 leading-relaxed text-sm pt-1">
                                      {step}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'weekend' && (
        <div className="space-y-8 stagger-enter">
          <div>
            <h2 className="text-xl font-bold text-clay-800 mb-2">周末专属活动推荐</h2>
            <p className="text-clay-500 text-sm">精心挑选的放松活动，让周末成为真正的身心充电站</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {weekendActivities.map((act, idx) => {
              const Icon = act.icon
              return (
                <div
                  key={idx}
                  className="stagger-enter relative rounded-3xl bg-white border border-clay-100 p-6 overflow-hidden card-hover"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={cn('absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br opacity-30 blur-2xl', act.color)} />
                  <div className="relative z-10 flex gap-5">
                    <div
                      className={cn(
                        'shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md',
                        act.color,
                      )}
                    >
                      <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-1 rounded-lg bg-warm-100 text-warm-500 text-xs font-bold">
                          {act.day}
                        </span>
                        <span className="text-xs text-clay-400">{act.time}</span>
                      </div>
                      <h3 className="text-lg font-bold text-clay-800 mb-2">{act.title}</h3>
                      <p className="text-sm text-clay-500 leading-relaxed mb-3">{act.desc}</p>
                      <div className="flex items-center gap-1.5 text-xs text-clay-400">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                        <span>建议时长 {act.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-lavender-50 via-warm-50 to-rose-50 border border-lavender-100/60">
            <div className="absolute -top-20 left-1/3 w-64 h-64 rounded-full bg-lavender-200/30 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-clay-800 mb-2">周末调息时间轴</h2>
              <p className="text-clay-500 text-sm mb-8">从周五晚到周日晚，参考这份温柔的安排，让身心彻底放松</p>

              <div className="relative pl-8 space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-lavender-300 via-rose-300 to-sage-300 rounded-full" />

                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon
                  return (
                    <div
                      key={idx}
                      className="stagger-enter relative"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <div
                        className={cn(
                          'absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md',
                          step.color,
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                      </div>
                      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-full bg-clay-100 text-clay-700 text-xs font-bold">
                            {step.time}
                          </span>
                          <h4 className="font-bold text-clay-800">{step.title}</h4>
                        </div>
                        <p className="text-sm text-clay-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sleep-tips' && (
        <div className="space-y-6 stagger-enter">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-clay-800 mb-1">睡眠卫生清单</h2>
              <p className="text-clay-500 text-sm">科学验证的睡眠改善建议，勾选你已养成的习惯</p>
            </div>

            <div className="flex gap-1.5 p-1 rounded-2xl bg-clay-50 border border-clay-100">
              {[
                { key: 'office' as SceneKey, label: '办公室场景', icon: Building2 },
                { key: 'home' as SceneKey, label: '居家场景', icon: HomeIcon },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScene(s.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                    scene === s.key
                      ? 'bg-white text-rose-600 shadow-md shadow-rose-100/60'
                      : 'text-clay-500 hover:text-clay-700',
                  )}
                >
                  <s.icon className="w-4 h-4" strokeWidth={1.8} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-clay-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#F3ECE0" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(completionPercent / 100) * 175.9} 175.9`}
                      className="transition-all duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#E8B4B8" />
                        <stop offset="100%" stopColor="#AD8AC0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-clay-800">{completionPercent}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-clay-500 mb-1">完成度进度</div>
                  <div className="text-lg font-bold text-clay-800">
                    已完成 <span className="text-rose-500">{completedTips}</span> / {totalVisibleTips} 项
                  </div>
                  <div className="text-xs text-clay-400 mt-0.5">
                    {completionPercent >= 80
                      ? '太棒了！良好的睡眠习惯正在守护你的健康'
                      : completionPercent >= 40
                        ? '继续加油，每一个小习惯都在积累'
                        : '从今天开始，让我们一步步改善睡眠'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {visibleCategories.map((cat, catIdx) => {
                const tips = groupedTips[cat] || []
                if (tips.length === 0) return null
                const catCompleted = tips.filter((t) => checkedTips[t.id]).length
                const catPercent = Math.round((catCompleted / tips.length) * 100)

                return (
                  <div
                    key={cat}
                    className="stagger-enter"
                    style={{ animationDelay: `${catIdx * 0.08}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400" />
                        <h4 className="font-bold text-clay-800 text-base">{cat}</h4>
                        <span className="text-xs text-clay-400">
                          {catCompleted}/{tips.length}
                        </span>
                      </div>
                      <div className="w-32 h-2 rounded-full bg-clay-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-lavender-400 transition-all duration-700 ease-out"
                          style={{ width: `${catPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                      {tips.map((tip) => {
                        const isChecked = !!checkedTips[tip.id]
                        return (
                          <div
                            key={tip.id}
                            onClick={() => toggleTip(tip.id)}
                            className={cn(
                              'group flex gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 border',
                              isChecked
                                ? 'bg-sage-50/60 border-sage-200'
                                : 'bg-clay-50/60 border-clay-100 hover:bg-warm-50 hover:border-warm-200',
                            )}
                          >
                            <div className="shrink-0 pt-0.5">
                              {isChecked ? (
                                <CheckCircle2 className="w-5.5 h-5.5 text-sage-500" strokeWidth={2.2} />
                              ) : (
                                <Circle
                                  className="w-5.5 h-5.5 text-clay-300 group-hover:text-rose-400 transition-colors"
                                  strokeWidth={1.8}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  'font-semibold text-sm mb-1 transition-colors',
                                  isChecked ? 'text-sage-700 line-through/60' : 'text-clay-700',
                                )}
                              >
                                {tip.title}
                              </div>
                              <p
                                className={cn(
                                  'text-xs leading-relaxed',
                                  isChecked ? 'text-sage-500/80' : 'text-clay-500',
                                )}
                              >
                                {tip.content}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
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
