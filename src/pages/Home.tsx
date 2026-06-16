import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Wind,
  CalendarDays,
  BookOpen,
  Play,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Sparkles,
  Sun,
  Moon,
  CloudSun,
  Coffee,
  Heart,
  Leaf,
  Zap,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '../stores/appStore'
import type { Exercise, SleepTip, Activity, Resource } from '../../shared/types'

const gradientMaps = {
  rose: 'from-rose-200 to-rose-300',
  lavender: 'from-lavender-200 to-lavender-300',
  sage: 'from-sage-200 to-sage-300',
  sunset: 'from-sunset-200 to-sunset-300',
  warm: 'from-warm-200 to-warm-300',
}

const resourceCategoryLabels: Record<string, string> = {
  sleep: '睡眠',
  hormone: '激素',
  emotion: '情绪',
  nutrition: '营养',
}

const resourceTypeLabels: Record<string, string> = {
  article: '文章',
  audio: '音频',
  video: '视频',
  qa: '问答',
}

const activityTypeLabels: Record<string, string> = {
  lecture: '讲座',
  workshop: '工作坊',
  consultation: '咨询',
  course: '课程',
}

const activityTypeColors: Record<string, string> = {
  lecture: 'bg-lavender-100 text-lavender-500',
  workshop: 'bg-sage-100 text-sage-500',
  consultation: 'bg-rose-100 text-rose-500',
  course: 'bg-sunset-100 text-sunset-500',
}

const tipIcons = [Coffee, Heart, Leaf, Zap, Moon, Sun]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return { text: '凌晨好', icon: Moon }
  if (hour < 12) return { text: '早上好', icon: Sun }
  if (hour < 14) return { text: '中午好', icon: Coffee }
  if (hour < 18) return { text: '下午好', icon: CloudSun }
  return { text: '晚上好', icon: Moon }
}

function getDailyMessage() {
  const messages = [
    '愿您今天拥有好眠与温柔的心情',
    '每一次深呼吸，都是对自己的温柔拥抱',
    '照顾好自己，是最重要的工作',
    '愿今天的您，被温柔以待',
    '慢一点也没关系，您已经做得很好了',
    '今天也要记得爱自己多一点',
    '身心舒展，万事可期',
  ]
  const day = new Date().getDate()
  return messages[day % messages.length]
}

function formatDate(date: Date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekdays[date.getDay()]}`
}

function formatActivityTime(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const month = start.getMonth() + 1
  const day = start.getDate()
  const startH = start.getHours().toString().padStart(2, '0')
  const startM = start.getMinutes().toString().padStart(2, '0')
  const endH = end.getHours().toString().padStart(2, '0')
  const endM = end.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${startH}:${startM}-${endH}:${endM}`
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const greeting = getGreeting()
  const dailyMessage = getDailyMessage()
  const GreetingIcon = greeting.icon

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [tips, setTips] = useState<SleepTip[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [tipIndex, setTipIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const trendData = [
    { week: '第1周', score: 68 },
    { week: '第2周', score: 72 },
    { week: '第3周', score: 70 },
    { week: '第4周', score: 75 },
    { week: '第5周', score: 78 },
    { week: '第6周', score: 82 },
  ]

  const weeklyExerciseCount = 4
  const weeklyExerciseTarget = 7
  const registeredActivitiesCount = 2
  const departmentParticipationRate = 72

  const fetchData = useCallback(async () => {
    try {
      const [exercisesRes, tipsRes, activitiesRes, resourcesRes] = await Promise.all([
        fetch('/api/care-plan/exercises?duration=short'),
        fetch('/api/care-plan/tips'),
        fetch('/api/activities?status=upcoming&pageSize=3'),
        fetch('/api/resources?pageSize=5'),
      ])

      const [exercisesData, tipsData, activitiesData, resourcesData] = await Promise.all([
        exercisesRes.json(),
        tipsRes.json(),
        activitiesRes.json(),
        resourcesRes.json(),
      ])

      if (exercisesData.success) setExercises(exercisesData.data)
      if (tipsData.success) {
        const allTips = tipsData.data.list || []
        setTips(allTips.slice(0, 6))
      }
      if (activitiesData.success) setActivities(activitiesData.data.list || [])
      if (resourcesData.success) setResources(resourcesData.data.list || [])
    } catch (error) {
      console.error('获取首页数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const recommendedExercise = exercises[0]

  const nextTip = () => {
    if (tips.length > 0) {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }
  }

  const prevTip = () => {
    if (tips.length > 0) {
      setTipIndex((prev) => (prev - 1 + tips.length) % tips.length)
    }
  }

  const progressPercent = (weeklyExerciseCount / weeklyExerciseTarget) * 100
  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="space-y-6">
      <div className="stagger-enter watercolor-bg rounded-3xl p-6 md:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-200 to-lavender-200 flex items-center justify-center">
                <GreetingIcon className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-clay-900">
                  {greeting.text}，{user?.name || '朋友'}
                </h1>
              </div>
            </div>
            <p className="text-lg md:text-xl text-clay-600 font-serif mb-5">
              「{dailyMessage}」
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm text-sm text-clay-600 border border-clay-100">
                <Users className="w-3.5 h-3.5 text-lavender-500" />
                {user?.department}参与率 {departmentParticipationRate}%
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm text-sm text-clay-600 border border-clay-100">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                您的同事们也在关注健康
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-4 lg:flex-col lg:items-end">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <CloudSun className="w-7 h-7 text-sunset-400" />
                <span className="text-2xl font-semibold text-clay-800">26°C</span>
              </div>
              <p className="text-sm text-clay-500">多云转晴 · 微风</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-clay-100">
              <p className="text-sm text-clay-500 mb-0.5">今天是</p>
              <p className="text-lg font-semibold text-clay-800">{formatDate(new Date())}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 opacity-30 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#E8B4B8" strokeWidth="2" className="breathing" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#C9B1D4" strokeWidth="2" style={{ animationDelay: '0.5s' }} className="breathing" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#A8C3A0" strokeWidth="2" style={{ animationDelay: '1s' }} className="breathing" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
        <Link
          to="/assessment"
          className="card-hover rounded-3xl p-5 bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200/50 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-300 to-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-clay-800 mb-1">开始自测</h3>
          <p className="text-sm text-clay-600">睡眠 · 更年期 · 心理健康</p>
        </Link>

        <Link
          to="/care-plan"
          className="card-hover rounded-3xl p-5 bg-gradient-to-br from-lavender-100 to-lavender-200 border border-lavender-200/50 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-300 to-lavender-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wind className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-clay-800 mb-1">今日练习</h3>
          <p className="text-sm text-clay-600">呼吸 · 冥想 · 身体扫描</p>
        </Link>

        <Link
          to="/activities"
          className="card-hover rounded-3xl p-5 bg-gradient-to-br from-sage-100 to-sage-200 border border-sage-200/50 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-clay-800 mb-1">活动报名</h3>
          <p className="text-sm text-clay-600">讲座 · 工作坊 · 咨询</p>
        </Link>

        <Link
          to="/resources"
          className="card-hover rounded-3xl p-5 bg-gradient-to-br from-sunset-100 to-sunset-200 border border-sunset-200/50 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sunset-300 to-sunset-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-clay-800 mb-1">健康资源</h3>
          <p className="text-sm text-clay-600">文章 · 音频 · 视频</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 stagger-enter">
          <div className="card-hover rounded-3xl bg-white p-6 md:p-8 border border-clay-100 h-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-clay-900 mb-1">今日推荐</h2>
                <p className="text-clay-500">
                  {recommendedExercise?.title || '3分钟呼吸放松'} · {recommendedExercise?.duration || 3}分钟
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-600 text-sm font-medium">
                呼吸练习
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <button
                onClick={() => navigate('/care-plan')}
                className="relative w-36 h-36 flex-shrink-0 group"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lavender-200 to-rose-200 breathing" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-lavender-300/50 to-rose-300/50 breathing" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-rose-400 to-lavender-400 flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-105 transition-transform">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </button>

              <div className="flex-1">
                <p className="text-clay-600 mb-5 leading-relaxed">
                  {recommendedExercise?.description || '由哈佛医学博士推荐的快速放松呼吸法，通过调节呼吸节律激活副交感神经，快速缓解紧张焦虑，帮助入眠。'}
                </p>
                <div className="space-y-2 mb-6">
                  {(recommendedExercise?.steps || []).slice(0, 3).map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lavender-100 text-lavender-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-clay-600">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-clay-500">
                    <Clock className="w-4 h-4" />
                    {recommendedExercise?.duration || 3} 分钟
                  </span>
                  <button
                    onClick={() => navigate('/care-plan')}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5"
                  >
                    立即开始
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stagger-enter">
          <div className="card-hover rounded-3xl bg-white p-6 border border-clay-100 h-full flex flex-col">
            <h2 className="text-xl font-bold text-clay-900 mb-5">我的数据</h2>

            <div className="mb-6">
              <p className="text-sm text-clay-500 mb-3">最近自测趋势</p>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#AD8AC0" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#AD8AC0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" hide />
                    <YAxis hide domain={[50, 100]} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#9067AB"
                      strokeWidth={2.5}
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-clay-400 mt-1">
                <span>6周前</span>
                <span className="text-lavender-500 font-medium">↑ 改善 21%</span>
                <span>本周</span>
              </div>
            </div>

            <div className="border-t border-clay-100 pt-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#F6F2F9"
                      strokeWidth="5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E8B4B8" />
                        <stop offset="100%" stopColor="#C9B1D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-clay-800">{weeklyExerciseCount}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-clay-800">本周练习</p>
                  <p className="text-sm text-clay-500">已完成 {weeklyExerciseCount}/{weeklyExerciseTarget} 次</p>
                </div>
              </div>
            </div>

            <div className="border-t border-clay-100 pt-5 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-sage-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-clay-800">{registeredActivitiesCount}</p>
                    <p className="text-xs text-clay-500">已报名活动</p>
                  </div>
                </div>
                <Link
                  to="/my-activities"
                  className="text-sm text-lavender-500 hover:text-lavender-600 font-medium inline-flex items-center gap-1"
                >
                  查看
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 stagger-enter">
          <div className="card-hover rounded-3xl bg-white p-6 md:p-8 border border-clay-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-clay-900 mb-1">办公室睡眠小智慧</h2>
                <p className="text-sm text-clay-500">来自专业人士的健康建议</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prevTip}
                  className="w-9 h-9 rounded-full bg-clay-50 hover:bg-clay-100 border border-clay-200 flex items-center justify-center text-clay-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextTip}
                  className="w-9 h-9 rounded-full bg-clay-50 hover:bg-clay-100 border border-clay-200 flex items-center justify-center text-clay-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {tips.length > 0 && (
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${tipIndex * 100}%)` }}
                >
                  {tips.map((tip, idx) => {
                    const TipIcon = tipIcons[idx % tipIcons.length]
                    const gradients = ['from-rose-100 to-rose-200', 'from-lavender-100 to-lavender-200', 'from-sage-100 to-sage-200', 'from-sunset-100 to-sunset-200', 'from-warm-100 to-warm-200']
                    const iconGradients = ['from-rose-300 to-rose-400', 'from-lavender-300 to-lavender-400', 'from-sage-300 to-sage-400', 'from-sunset-300 to-sunset-400', 'from-warm-300 to-warm-400']
                    return (
                      <div key={tip.id} className="w-full flex-shrink-0 px-1">
                        <div className={`rounded-2xl p-6 bg-gradient-to-br ${gradients[idx % gradients.length]} border border-white/60`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconGradients[idx % iconGradients.length]} flex items-center justify-center flex-shrink-0 shadow-md`}>
                              <TipIcon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-lg font-bold text-clay-800">{tip.title}</h3>
                                <span className="px-2.5 py-0.5 rounded-full bg-white/70 text-xs text-clay-600 font-medium">
                                  {tip.category}
                                </span>
                              </div>
                              <p className="text-clay-700 leading-relaxed">{tip.content}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-1.5 mt-5">
              {tips.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTipIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === tipIndex ? 'w-6 bg-lavender-400' : 'w-1.5 bg-clay-200 hover:bg-clay-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="stagger-enter">
          <div className="card-hover rounded-3xl bg-white p-6 border border-clay-100 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-clay-900">近期活动</h2>
              <Link
                to="/activities"
                className="text-sm text-lavender-500 hover:text-lavender-600 font-medium inline-flex items-center gap-1"
              >
                全部
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-clay-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 text-clay-300" />
                  <p>暂无即将开始的活动</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-2xl border border-clay-100 hover:border-clay-200 hover:bg-clay-50/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-clay-800 text-sm leading-snug group-hover:text-lavender-600 transition-colors line-clamp-2">
                        {activity.title}
                      </h3>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${activityTypeColors[activity.type]}`}>
                        {activityTypeLabels[activity.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-clay-500 mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatActivityTime(activity.startTime, activity.endTime)}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/activities/${activity.id}`)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-lavender-50 to-rose-50 text-lavender-600 text-sm font-medium hover:from-lavender-100 hover:to-rose-100 transition-colors"
                    >
                      立即报名
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-enter">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-clay-900 mb-1">为您精选的健康阅读</h2>
            <p className="text-sm text-clay-500">根据您的兴趣推荐</p>
          </div>
          <Link
            to="/resources"
            className="text-sm text-lavender-500 hover:text-lavender-600 font-medium inline-flex items-center gap-1"
          >
            查看全部
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2">
          {resources.length === 0 ? (
            <div className="w-full text-center py-12 text-clay-500 rounded-3xl bg-white border border-clay-100">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-clay-300" />
              <p>暂无推荐资源</p>
            </div>
          ) : (
            resources.map((resource, idx) => {
              const gradients = [
                'from-rose-300 via-rose-200 to-lavender-300',
                'from-lavender-300 via-lavender-200 to-sage-300',
                'from-sage-300 via-sage-200 to-sunset-300',
                'from-sunset-300 via-sunset-200 to-warm-300',
                'from-warm-300 via-rose-200 to-rose-300',
              ]
              return (
                <Link
                  key={resource.id}
                  to={`/resources/${resource.id}`}
                  className="card-hover flex-shrink-0 w-64 rounded-3xl bg-white border border-clay-100 overflow-hidden group"
                >
                  <div className={`h-36 bg-gradient-to-br ${gradients[idx % gradients.length]} relative overflow-hidden`}>
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-xs font-medium text-clay-700">
                        {resourceCategoryLabels[resource.category]}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-sm text-xs text-clay-600 inline-flex items-center gap-1">
                      {resource.type === 'audio' || resource.type === 'video' ? (
                        <>
                          <Play className="w-3 h-3" fill="currentColor" />
                          {resource.duration ? `${Math.floor(resource.duration / 60)}分钟` : ''}
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3 h-3" />
                          {resource.readTime ? `${resource.readTime}分钟阅读` : '阅读'}
                        </>
                      )}
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/20" />
                    <div className="absolute -top-2 -left-2 w-12 h-12 rounded-full bg-white/10" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${gradientMaps[Object.keys(gradientMaps)[idx % 5]]} text-clay-700`}>
                        {resourceTypeLabels[resource.type]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-clay-800 mb-2 line-clamp-2 group-hover:text-lavender-600 transition-colors leading-snug">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-clay-500 line-clamp-2 leading-relaxed">
                      {resource.content}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
