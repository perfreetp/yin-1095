import { useState, useEffect, useCallback } from 'react'
import {
  HandHeart,
  Shield,
  ClipboardCheck,
  HeartHandshake,
  Moon,
  BatteryCharging,
  CloudRain,
  Flower2,
  Sparkles,
  Check,
  X,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Hash,
  Calendar,
  UserCheck,
  Target,
  Activity,
} from 'lucide-react'
import type {
  CareProgram,
  ContactPreference,
  PreferredTime,
  CareApplyStatus,
} from '../../shared/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

interface MyApplication {
  id: string
  programId: string
  programTitle: string
  appliedAt: string
  status: CareApplyStatus
  anonymousCode: string
  preferredTime: PreferredTime[]
  contactPreference: ContactPreference
  additionalNotes: string
  updatedAt: string
  timeline: { time: string; status: string; note: string }[]
}

const contactPreferenceOptions: {
  value: ContactPreference
  label: string
  icon: typeof Phone
  desc: string
}[] = [
  { value: 'phone', label: '电话', icon: Phone, desc: '专员将致电与您沟通' },
  { value: 'message', label: '企业微信', icon: MessageCircle, desc: '通过企业微信联系' },
  { value: 'email', label: '邮件', icon: Mail, desc: '发送邮件沟通详情' },
  { value: 'none', label: '暂不选择', icon: Lock, desc: '后续再确定联系方式' },
]

const preferredTimeOptions: {
  value: PreferredTime
  label: string
  desc: string
}[] = [
  { value: 'weekday_morning', label: '工作日上午', desc: '09:00-12:00' },
  { value: 'weekday_afternoon', label: '工作日下午', desc: '14:00-18:00' },
  { value: 'weekday_evening', label: '工作日傍晚', desc: '18:00-21:00' },
  { value: 'weekend', label: '周末', desc: '周六/周日全天' },
]

const serviceProcessSteps = [
  {
    step: '①',
    title: '提交申请',
    desc: '填写报名表单，获取专属匿名编号',
    icon: ClipboardCheck,
    gradient: 'from-lavender-300 to-lavender-400',
    bg: 'bg-lavender-50',
    border: 'border-lavender-200',
    text: 'text-lavender-600',
    time: '立即',
  },
  {
    step: '②',
    title: '健康服务专员初审',
    desc: '1个工作日内完成初审，确认申请资格',
    icon: UserCheck,
    gradient: 'from-rose-300 to-rose-400',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-600',
    time: '1个工作日',
  },
  {
    step: '③',
    title: '匹配专属关怀方案',
    desc: '根据您的情况匹配专业团队，制定个性化方案',
    icon: Target,
    gradient: 'from-sage-300 to-sage-400',
    bg: 'bg-sage-50',
    border: 'border-sage-200',
    text: 'text-sage-600',
    time: '3个工作日',
  },
  {
    step: '④',
    title: '持续跟进与效果追踪',
    desc: '一对一跟进服务，定期评估改善效果',
    icon: Activity,
    gradient: 'from-sunset-300 to-sunset-400',
    bg: 'bg-sunset-50',
    border: 'border-sunset-200',
    text: 'text-sunset-600',
    time: '全程陪伴',
  },
]

const statusProgressSteps = [
  { key: 'pending', label: '已提交' },
  { key: 'processing', label: '处理中' },
  { key: 'in_service', label: '关怀服务中' },
  { key: 'completed', label: '已完成' },
]

const programConfig: Record<
  string,
  {
    icon: typeof Moon
    gradient: string
    bg: string
    border: string
    text: string
    badge: string
  }
> = {
  default: {
    icon: Sparkles,
    gradient: 'from-rose-300 to-lavender-400',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-600',
    badge: '专属关怀',
  },
}

const getProgramStyle = (title: string) => {
  if (title.includes('夜醒') || title.includes('睡眠')) {
    return {
      icon: Moon,
      gradient: 'from-lavender-300 via-indigo-300 to-lavender-400',
      bg: 'bg-lavender-50',
      border: 'border-lavender-200',
      text: 'text-lavender-600',
      badge: '睡眠改善',
    }
  }
  if (title.includes('疲劳')) {
    return {
      icon: BatteryCharging,
      gradient: 'from-sunset-300 via-warm-400 to-sunset-400',
      bg: 'bg-sunset-50',
      border: 'border-sunset-200',
      text: 'text-sunset-600',
      badge: '精力恢复',
    }
  }
  if (title.includes('焦虑') || title.includes('心理')) {
    return {
      icon: CloudRain,
      gradient: 'from-sage-300 via-teal-300 to-sage-400',
      bg: 'bg-sage-50',
      border: 'border-sage-200',
      text: 'text-sage-600',
      badge: '心理支持',
    }
  }
  if (title.includes('综合')) {
    return {
      icon: Flower2,
      gradient: 'from-rose-300 via-warm-300 to-lavender-400',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-600',
      badge: '全面管理',
    }
  }
  return programConfig.default
}

const getStatusConfig = (status: CareApplyStatus) => {
  const config: Record<
    CareApplyStatus,
    { label: string; color: string; dotColor: string; progressIndex: number }
  > = {
    pending: {
      label: '待处理',
      color: 'bg-warm-100 text-warm-600 border-warm-200',
      dotColor: 'bg-warm-500',
      progressIndex: 0,
    },
    processing: {
      label: '处理中',
      color: 'bg-lavender-100 text-lavender-600 border-lavender-200',
      dotColor: 'bg-lavender-500',
      progressIndex: 1,
    },
    completed: {
      label: '已完成',
      color: 'bg-sage-100 text-sage-600 border-sage-200',
      dotColor: 'bg-sage-500',
      progressIndex: 3,
    },
  }
  return config[status] || config.pending
}

const contactPreferenceLabel: Record<ContactPreference, string> = {
  phone: '电话',
  message: '企业微信',
  email: '邮件',
  none: '暂未选择',
}

const preferredTimeLabel: Record<PreferredTime, string> = {
  weekday_morning: '工作日上午',
  weekday_afternoon: '工作日下午',
  weekday_evening: '工作日傍晚',
  weekend: '周末',
}

export default function CareChannel() {
  const { user } = useAppStore()
  const [programs, setPrograms] = useState<
    (CareProgram & { applied?: boolean; applyStatus?: string | null })[]
  >([])
  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null)

  const [selectedProgram, setSelectedProgram] = useState<CareProgram | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<MyApplication | null>(null)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [contactPreference, setContactPreference] = useState<ContactPreference>('none')
  const [preferredTime, setPreferredTime] = useState<PreferredTime[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchMyApplications = useCallback(async () => {
    if (!user?.id) return
    setLoadingApplications(true)
    try {
      const res = await fetch(`/api/care-channel/my-applications?userId=${user.id}`)
      const json = await res.json()
      if (json.success) {
        setMyApplications(json.data)
      }
    } catch (e) {
      console.error('获取我的申请记录失败', e)
    } finally {
      setLoadingApplications(false)
    }
  }, [user?.id])

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const params = new URLSearchParams()
        if (user?.id) params.set('userId', user.id)
        const res = await fetch(`/api/care-channel/programs?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setPrograms(json.data)
        }
      } catch (e) {
        console.error('获取关怀项目失败', e)
      } finally {
        setLoading(false)
      }
    }
    fetchPrograms()
    fetchMyApplications()
  }, [user, fetchMyApplications])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleOpenModal = (program: CareProgram) => {
    setSelectedProgram(program)
    setShowModal(true)
    setShowSuccess(false)
    setSuccessData(null)
    setPrivacyAgreed(false)
    setContactPreference('none')
    setPreferredTime([])
    setAdditionalNotes('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProgram(null)
  }

  const togglePreferredTime = (time: PreferredTime) => {
    setPreferredTime((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    )
  }

  const handleSubmit = async () => {
    if (!selectedProgram || !privacyAgreed) return
    if (!user) {
      setToast({ type: 'error', message: '请先登录' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/care-channel/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedProgram.id,
          userId: user.id,
          contactPreference,
          preferredTime,
          additionalNotes,
          reason: additionalNotes || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowSuccess(true)
        setSuccessData(json.data.apply)
        setMyApplications((prev) => [...prev, json.data.apply])
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === selectedProgram.id ? { ...p, applied: true, applyStatus: 'pending' } : p,
          ),
        )
      } else {
        setToast({ type: 'error', message: json.error || '报名失败' })
      }
    } catch (_e) {
      setToast({ type: 'error', message: '网络错误，请稍后重试' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const renderStatusProgress = (status: CareApplyStatus) => {
    const statusConfig = getStatusConfig(status)
    const currentIndex = statusConfig.progressIndex

    return (
      <div className="w-full">
        <div className="relative flex items-center justify-between mb-2">
          {statusProgressSteps.map((step, idx) => {
            const isActive = idx <= currentIndex
            const isCurrent = idx === currentIndex
            return (
              <div
                key={step.key}
                className="flex flex-col items-center relative z-10"
                style={{ width: `${100 / statusProgressSteps.length}%` }}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-rose-400 to-lavender-500 border-rose-400 text-white'
                      : 'bg-white border-clay-200 text-clay-300',
                    isCurrent && 'ring-4 ring-rose-100',
                  )}
                >
                  {isActive ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-medium">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1.5 font-medium',
                    isActive ? 'text-clay-700' : 'text-clay-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-clay-100 -z-0">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-lavender-500 transition-all duration-500"
              style={{ width: `${(currentIndex / (statusProgressSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

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

      {myApplications.length > 0 && (
        <div className="stagger-enter space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-sage-400 to-rose-400" />
            <h2 className="text-xl font-bold text-clay-800">我的关怀申请</h2>
            <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-600 text-xs font-medium border border-sage-200">
              {myApplications.length} 项申请
            </span>
          </div>

          {loadingApplications ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-3xl bg-clay-50 animate-pulse stagger-enter"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app, idx) => {
                const statusConfig = getStatusConfig(app.status)
                const program = programs.find((p) => p.id === app.programId)
                const style = program ? getProgramStyle(program.title) : programConfig.default
                const isExpanded = expandedAppId === app.id

                return (
                  <div
                    key={app.id}
                    className={cn(
                      'stagger-enter relative overflow-hidden rounded-3xl border transition-all duration-300',
                      'bg-gradient-to-br from-white via-warm-50/30 to-white',
                      statusConfig.dotColor.replace('bg-', 'border-'),
                    )}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div
                      className={cn(
                        'absolute top-0 left-0 w-1 h-full',
                        statusConfig.dotColor,
                      )}
                    />

                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0',
                            style.gradient,
                          )}
                        >
                          <style.icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-bold text-clay-800">
                                  {app.programTitle}
                                </h3>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                                    statusConfig.color,
                                  )}
                                >
                                  <span
                                    className={cn('w-2 h-2 rounded-full', statusConfig.dotColor)}
                                  />
                                  {statusConfig.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-clay-500">
                                <span className="flex items-center gap-1.5">
                                  <Hash className="w-3.5 h-3.5" strokeWidth={1.8} />
                                  <span className="font-mono font-semibold text-clay-700">
                                    {app.anonymousCode}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                                  {formatDate(app.appliedAt)}
                                </span>
                              </div>
                            </div>
                            <button className="text-clay-400 hover:text-clay-600 transition-colors shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" strokeWidth={2} />
                              ) : (
                                <ChevronDown className="w-5 h-5" strokeWidth={2} />
                              )}
                            </button>
                          </div>

                          <div className="pt-2">{renderStatusProgress(app.status)}</div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-clay-100 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 rounded-2xl bg-clay-50/60 border border-clay-100">
                            <p className="text-xs font-semibold text-clay-700 mb-2 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                              方便时间
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {app.preferredTime.length > 0 ? (
                                app.preferredTime.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-100 text-lavender-700 border border-lavender-200"
                                  >
                                    {preferredTimeLabel[t]}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-clay-400">未指定</span>
                              )}
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-clay-50/60 border border-clay-100">
                            <p className="text-xs font-semibold text-clay-700 mb-2 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" strokeWidth={1.8} />
                              联系偏好
                            </p>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sage-100 text-sage-700 border border-sage-200">
                              {contactPreferenceLabel[app.contactPreference]}
                            </span>
                          </div>
                        </div>

                        {app.additionalNotes && (
                          <div className="mb-4 p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
                            <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                              <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                              备注
                            </p>
                            <p className="text-sm text-clay-600 leading-relaxed">
                              {app.additionalNotes}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-clay-700 mb-3 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" strokeWidth={1.8} />
                            进度时间线
                          </p>
                          <div className="relative pl-6 space-y-4">
                            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-rose-300 via-lavender-300 to-sage-300" />
                            {app.timeline.map((item, tIdx) => (
                              <div key={tIdx} className="relative">
                                <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-rose-400 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                                </div>
                                <div className="bg-clay-50/60 border border-clay-100 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-clay-700">
                                      {item.status}
                                    </span>
                                    <span className="text-xs text-clay-400">
                                      {formatDateTime(item.time)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-clay-500">{item.note}</p>
                                </div>
                              </div>
                            ))}
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

      <div className="stagger-enter relative overflow-hidden rounded-3xl p-8 md:p-10 border border-rose-100/60"
           style={{ background: 'linear-gradient(135deg, #F6E4E6 0%, #F6F2F9 35%, #F2F6F1 70%, #FEF5EC 100%)' }}>
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-gradient-to-br from-rose-300/40 to-lavender-300/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-gradient-to-tr from-sage-200/40 to-warm-200/30 blur-3xl" />
        <div className="absolute top-20 left-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-sunset-200/50 to-transparent blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-br from-rose-400 via-lavender-400 to-sage-400 flex items-center justify-center shadow-xl shadow-rose-200/50">
              <HandHeart className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-clay-900">专属健康关怀通道</h1>
              <p className="text-sm md:text-base text-clay-600 mt-1">
                针对有明显困扰的同事，提供一对一的深入支持服务
              </p>
            </div>
          </div>

          <p className="text-clay-600 text-base leading-relaxed max-w-2xl mb-8">
            我们深知，有些困扰无法仅凭自我调节解决。当你需要更多支持时，
            专业的健康服务团队就在你身边。所有服务<span className="font-semibold text-rose-500">完全免费、严格保密</span>，
            你永远可以放心地向我们求助。
          </p>

          <div className="flex items-start gap-3 p-4 md:p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-300 to-rose-400 flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-clay-800 text-sm mb-0.5">🔒 隐私保护承诺</p>
              <p className="text-sm text-clay-600 leading-relaxed">
                所有报名信息严格保密，仅健康服务专员可查看，不会向HR或部门透露
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-enter space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400" />
          <h2 className="text-xl font-bold text-clay-800">服务流程</h2>
          <span className="text-xs text-clay-400">了解完整的关怀路径</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {serviceProcessSteps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className={cn(
                  'stagger-enter relative rounded-3xl p-6 border card-hover',
                  step.bg,
                  step.border,
                )}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/70 text-clay-500 border border-white">
                    {step.time}
                  </span>
                </div>
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md mb-5',
                    step.gradient,
                  )}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-clay-300">{step.step}</span>
                  <h3 className={cn('text-lg font-bold', step.text)}>{step.title}</h3>
                </div>
                <p className="text-sm text-clay-600 leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-400 to-lavender-400" />
            <h2 className="text-xl font-bold text-clay-800">关怀项目</h2>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-medium border border-rose-200">
              {programs.length} 项可选
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-clay-50 animate-pulse stagger-enter"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {programs.map((program, idx) => {
              const style = getProgramStyle(program.title)
              const Icon = style.icon
              const isApplied = program.applied

              return (
                <div
                  key={program.id}
                  className="stagger-enter relative rounded-3xl bg-white border border-clay-100 overflow-hidden card-hover"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={cn('absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br opacity-20 blur-3xl', style.gradient)} />

                  <div className="relative z-10 p-6">
                    <div className="flex gap-4 mb-5">
                      <div
                        className={cn(
                          'shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                          style.gradient,
                        )}
                      >
                        <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-lg font-bold text-clay-800 leading-tight">
                            {program.title}
                          </h3>
                          <span
                            className={cn(
                              'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
                              style.bg,
                              style.text,
                              style.border,
                            )}
                          >
                            {style.badge}
                          </span>
                        </div>
                        <p className={cn('text-xs font-medium mb-1', style.text)}>
                          🎯 {program.targetGroup}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-clay-600 leading-relaxed mb-4 line-clamp-3">
                      {program.description}
                    </p>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-clay-700 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                        项目权益
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {program.benefits.slice(0, 4).map((b, i) => (
                          <span
                            key={i}
                            className={cn(
                              'px-2.5 py-1 rounded-xl text-xs border',
                              style.bg,
                              'text-clay-600',
                              style.border,
                            )}
                          >
                            {b.length > 14 ? b.slice(0, 14) + '…' : b}
                          </span>
                        ))}
                        {program.benefits.length > 4 && (
                          <span className="px-2.5 py-1 rounded-xl text-xs text-clay-400 border border-clay-100 bg-clay-50">
                            +{program.benefits.length - 4} 项
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 p-3 rounded-2xl bg-clay-50/60 border border-clay-100">
                      <p className="text-xs font-semibold text-clay-700 mb-1.5">⏱️ 预计响应时间</p>
                      <p className="text-xs text-clay-600">{program.expectedResponseTime}</p>
                    </div>

                    <div className="mb-5 p-3 rounded-2xl bg-warm-50/60 border border-warm-100">
                      <p className="text-xs font-semibold text-clay-700 mb-1.5">📋 服务流程</p>
                      <div className="space-y-1">
                        {program.serviceProcess.slice(0, 2).map((s, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <Check className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', style.text)} strokeWidth={2.5} />
                            <span className="text-xs text-clay-600">{s}</span>
                          </div>
                        ))}
                        {program.serviceProcess.length > 2 && (
                          <span className="text-xs text-clay-400 ml-5">...还有 {program.serviceProcess.length - 2} 步</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" strokeWidth={1.8} />
                        <p className="text-xs text-clay-600 leading-relaxed">
                          {program.privacyCommitment.length > 60
                            ? program.privacyCommitment.slice(0, 60) + '…'
                            : program.privacyCommitment}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => !isApplied && handleOpenModal(program)}
                      disabled={isApplied}
                      className={cn(
                        'w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                        isApplied
                          ? 'bg-sage-50 text-sage-600 border border-sage-200 cursor-default'
                          : 'text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
                      )}
                      style={
                        !isApplied
                          ? {
                              background: 'linear-gradient(135deg, #E8B4B8 0%, #D99196 50%, #C77076 100%)',
                              boxShadow: '0 6px 20px rgba(217, 145, 150, 0.35)',
                            }
                          : undefined
                      }
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                          已报名 · 等待专员联系
                        </>
                      ) : (
                        <>
                          我要报名
                          <ArrowRight className="w-4.5 h-4.5" strokeWidth={2} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && selectedProgram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0 bg-clay-900/30 backdrop-blur-md animate-in fade-in duration-300" />

          <div
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {!showSuccess ? (
              <>
                <div className="sticky top-0 bg-white z-10 px-7 pt-7 pb-5 border-b border-clay-100 rounded-t-3xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md',
                          getProgramStyle(selectedProgram.title).gradient,
                        )}
                      >
                        {(() => {
                          const PIcon = getProgramStyle(selectedProgram.title).icon
                          return <PIcon className="w-5.5 h-5.5 text-white" strokeWidth={1.8} />
                        })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-clay-800">报名 {selectedProgram.title}</h3>
                        <p className="text-xs text-clay-500 mt-0.5">完全自愿 · 严格保密</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="w-9 h-9 rounded-xl bg-clay-50 hover:bg-clay-100 flex items-center justify-center text-clay-400 hover:text-clay-600 transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="px-7 py-6 space-y-5">
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <p className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-2">
                      <Shield className="w-4.5 h-4.5" strokeWidth={1.8} />
                      隐私声明（请仔细阅读）
                    </p>
                    <div className="text-xs text-clay-600 leading-relaxed space-y-2 max-h-40 overflow-y-auto pr-2">
                      <p>
                        您提交的报名信息将受到严格保护，我们承诺：
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-1">
                        <li>所有信息仅用于关怀项目的匹配与服务跟进</li>
                        <li>数据存储与公司HR系统完全隔离，独立加密</li>
                        <li>仅项目管理专员和指定专业顾问可访问</li>
                        <li>不会向任何第三方（包括您的主管、HR部门）披露</li>
                        <li>您有权随时申请撤回报名并删除个人信息</li>
                        <li>咨询过程遵循专业伦理保密原则</li>
                      </ul>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => setPrivacyAgreed(!privacyAgreed)}
                      className={cn(
                        'shrink-0 w-5.5 h-5.5 rounded-md border-2 flex items-center justify-center transition-all duration-200 mt-0.5',
                        privacyAgreed
                          ? 'bg-rose-500 border-rose-500'
                          : 'bg-white border-clay-300 group-hover:border-rose-400',
                      )}
                    >
                      {privacyAgreed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-clay-700 leading-relaxed pt-0.5">
                      我已阅读并同意上述<span className="font-semibold text-rose-600">隐私声明</span>，
                      理解并同意我的信息按照以上方式被使用
                    </span>
                  </label>

                  <div className="space-y-5 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-clay-700 mb-3 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-clay-400" strokeWidth={1.8} />
                        联系偏好
                        <span className="text-xs text-clay-400 font-normal">（选择专员如何联系您）</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {contactPreferenceOptions.map((opt) => {
                          const OptIcon = opt.icon
                          const isSelected = contactPreference === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setContactPreference(opt.value)}
                              className={cn(
                                'p-3 rounded-2xl border-2 text-left transition-all duration-200',
                                isSelected
                                  ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100'
                                  : 'border-clay-100 bg-white hover:border-clay-200 hover:bg-clay-50',
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <OptIcon
                                  className={cn(
                                    'w-4 h-4',
                                    isSelected ? 'text-rose-500' : 'text-clay-400',
                                  )}
                                  strokeWidth={1.8}
                                />
                                <span
                                  className={cn(
                                    'text-sm font-semibold',
                                    isSelected ? 'text-rose-700' : 'text-clay-700',
                                  )}
                                >
                                  {opt.label}
                                </span>
                              </div>
                              <p className="text-xs text-clay-500">{opt.desc}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-clay-700 mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-clay-400" strokeWidth={1.8} />
                        方便时间
                        <span className="text-xs text-clay-400 font-normal">（可多选）</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {preferredTimeOptions.map((opt) => {
                          const isSelected = preferredTime.includes(opt.value)
                          return (
                            <button
                              key={opt.value}
                              onClick={() => togglePreferredTime(opt.value)}
                              className={cn(
                                'p-3 rounded-2xl border-2 text-left transition-all duration-200',
                                isSelected
                                  ? 'border-lavender-400 bg-lavender-50 ring-2 ring-lavender-100'
                                  : 'border-clay-100 bg-white hover:border-clay-200 hover:bg-clay-50',
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={cn(
                                    'text-sm font-semibold',
                                    isSelected ? 'text-lavender-700' : 'text-clay-700',
                                  )}
                                >
                                  {opt.label}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-lavender-500" strokeWidth={2.5} />
                                )}
                              </div>
                              <p className="text-xs text-clay-500">{opt.desc}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-clay-700 mb-2 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-clay-400" strokeWidth={1.8} />
                        想先聊聊的问题
                        <span className="text-xs text-clay-400 font-normal">（选填）</span>
                      </label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={4}
                        placeholder="可以简单描述一下您目前的困扰或希望获得的帮助，有助于我们提前准备（无需详细，一句话也可以）"
                        className="w-full px-4 py-3 rounded-2xl border border-warm-200 bg-white text-sm text-clay-700 placeholder-clay-400 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100/60 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 px-7 py-5 border-t border-clay-100 bg-white rounded-b-3xl">
                  <button
                    onClick={handleSubmit}
                    disabled={!privacyAgreed || submitting}
                    className={cn(
                      'w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                      privacyAgreed && !submitting
                        ? 'text-white shadow-lg hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]'
                        : 'bg-clay-100 text-clay-400 cursor-not-allowed',
                    )}
                    style={
                      privacyAgreed && !submitting
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
                        <HeartHandshake className="w-5 h-5" strokeWidth={1.8} />
                        确认报名
                      </>
                    )}
                  </button>
                  {!privacyAgreed && (
                    <p className="text-center text-xs text-clay-400 mt-2">
                      请先勾选同意隐私声明
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="px-8 py-10 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-sage-200/60 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-2xl font-bold text-clay-800 mb-2">报名成功！</h3>
                <p className="text-clay-600 mb-2">
                  感谢您迈出这一步，我们会好好照顾您 🌷
                </p>
                {successData && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-700 border border-lavender-200 mb-6">
                    <Hash className="w-4 h-4" strokeWidth={1.8} />
                    <span className="font-mono font-semibold text-sm">
                      您的匿名编号：{successData.anonymousCode}
                    </span>
                  </div>
                )}

                <div className="text-left space-y-3 p-5 rounded-2xl bg-gradient-to-br from-sage-50 via-warm-50 to-rose-50 border border-sage-100 mb-7">
                  <p className="text-sm font-semibold text-clay-700 mb-2">接下来的流程：</p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-sage-200 text-sage-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-sm text-clay-600">
                        健康服务专员将在<span className="font-semibold text-sage-600">1个工作日内</span>审核您的报名
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-lavender-200 text-lavender-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-sm text-clay-600">
                        审核通过后，专员将通过您选择的方式与您联系，确认具体安排
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-sm text-clay-600">
                        开启专属关怀之旅，由专业团队为您提供一对一支持
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="px-10 py-3 rounded-2xl text-white font-semibold text-sm shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #84A97C 0%, #668F5C 100%)',
                    boxShadow: '0 6px 20px rgba(102, 143, 92, 0.35)',
                  }}
                >
                  我知道了
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
