import { useCallback, useEffect, useState } from 'react'
import {
  Inbox,
  Clock,
  CheckCircle2,
  Timer,
  Filter,
  RefreshCw,
  ShieldCheck,
  Play,
  CheckSquare,
  MessageSquarePlus,
  X,
  Hash,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  Lock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Activity,
} from 'lucide-react'
import type {
  CareApplyStatus,
  ContactPreference,
  PreferredTime,
  CareProgram,
} from '../../shared/types'
import { cn } from '@/lib/utils'

interface CareQueueItem {
  id: string
  programId: string
  programTitle: string
  appliedAt: string
  status: CareApplyStatus
  anonymousCode: string
  preferredTime: PreferredTime[]
  contactPreference: ContactPreference
  additionalNotes: string
  symptomTags: string[]
  updatedAt: string
  processingNotes?: string
  timeline?: { time: string; status: string; note: string }[]
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  avgResponseTime: number
}

const statusConfig: Record<
  CareApplyStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string; borderClass: string }
> = {
  pending: {
    label: '待处理',
    dotClass: 'bg-sunset-500',
    bgClass: 'bg-sunset-50',
    textClass: 'text-sunset-600',
    borderClass: 'border-sunset-200',
  },
  processing: {
    label: '处理中',
    dotClass: 'bg-lavender-500',
    bgClass: 'bg-lavender-50',
    textClass: 'text-lavender-600',
    borderClass: 'border-lavender-200',
  },
  completed: {
    label: '已完成',
    dotClass: 'bg-sage-500',
    bgClass: 'bg-sage-50',
    textClass: 'text-sage-600',
    borderClass: 'border-sage-200',
  },
}

const contactPreferenceConfig: Record<ContactPreference, { label: string; icon: typeof Phone }> = {
  phone: { label: '电话', icon: Phone },
  message: { label: '企业微信', icon: MessageCircle },
  email: { label: '邮件', icon: Mail },
  none: { label: '暂未选择', icon: Lock },
}

const preferredTimeLabel: Record<PreferredTime, string> = {
  weekday_morning: '工作日上午',
  weekday_afternoon: '工作日下午',
  weekday_evening: '工作日傍晚',
  weekend: '周末',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60))
      return `${mins}分钟前`
    }
    return `${hours}小时前`
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function AdminCareQueue() {
  const [queue, setQueue] = useState<CareQueueItem[]>([])
  const [programs, setPrograms] = useState<CareProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    avgResponseTime: 0,
  })

  const [filterProgram, setFilterProgram] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CareQueueItem | null>(null)
  const [newStatus, setNewStatus] = useState<CareApplyStatus>('processing')
  const [processingNotes, setProcessingNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterProgram !== 'all') params.set('programId', filterProgram)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const [queueRes, programsRes] = await Promise.all([
        fetch(`/api/care-channel/admin/queue?${params.toString()}`).then((r) => r.json()),
        fetch('/api/care-channel/programs').then((r) => r.json()),
      ])

      if (queueRes.success) {
        setQueue(queueRes.data.list)
        setStats(queueRes.data.stats)
      }
      if (programsRes.success) {
        setPrograms(programsRes.data)
      }
    } catch (e) {
      console.error('获取关怀队列失败', e)
    } finally {
      setLoading(false)
    }
  }, [filterProgram, filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openStatusModal = (item: CareQueueItem, defaultStatus: CareApplyStatus) => {
    setSelectedItem(item)
    setNewStatus(defaultStatus)
    setProcessingNotes(item.processingNotes || '')
    setShowStatusModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedItem) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/care-channel/admin/${selectedItem.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          processingNotes,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setShowStatusModal(false)
        fetchData()
      }
    } catch (e) {
      console.error('更新状态失败', e)
    } finally {
      setUpdating(false)
    }
  }

  const statCards = [
    {
      title: '待处理',
      value: stats.pending,
      icon: Inbox,
      color: 'sunset',
      suffix: '条',
    },
    {
      title: '处理中',
      value: stats.processing,
      icon: Activity,
      color: 'lavender',
      suffix: '条',
    },
    {
      title: '已完成',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'sage',
      suffix: '条',
    },
    {
      title: '平均响应时间',
      value: stats.avgResponseTime,
      icon: Timer,
      color: 'rose',
      suffix: '小时',
    },
  ]

  const statColorClasses: Record<string, string> = {
    sunset: 'from-sunset-50 to-sunset-100/60 text-sunset-500 border-sunset-100',
    lavender: 'from-lavender-50 to-lavender-100/60 text-lavender-500 border-lavender-100',
    sage: 'from-sage-50 to-sage-100/60 text-sage-500 border-sage-100',
    rose: 'from-rose-50 to-rose-100/60 text-rose-500 border-rose-100',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-clay-900">关怀队列</h1>
          <p className="text-clay-500 mt-1 flex items-center gap-2">
            管理和跟进员工关怀申请
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sage-50 text-sage-600 text-xs font-medium border border-sage-100">
              <ShieldCheck className="w-3 h-3" strokeWidth={2} />
              所有数据完全匿名
            </span>
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay-50 text-clay-600 font-medium text-sm hover:bg-clay-100 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} strokeWidth={1.8} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br backdrop-blur-sm border p-6 shadow-sm hover:shadow-md transition-all',
                statColorClasses[card.color],
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-clay-500 font-medium">{card.title}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-clay-900">{card.value}</span>
                    <span className="text-clay-500 text-lg">{card.suffix}</span>
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

      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-clay-500 font-medium">
          <Filter className="w-4 h-4" strokeWidth={1.8} />
          筛选：
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-clay-400">项目</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterProgram('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                filterProgram === 'all'
                  ? 'bg-gradient-to-r from-rose-500 to-lavender-500 text-white shadow-sm'
                  : 'bg-clay-50 text-clay-600 hover:bg-clay-100',
              )}
            >
              全部
            </button>
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterProgram(p.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                  filterProgram === p.id
                    ? 'bg-gradient-to-r from-rose-500 to-lavender-500 text-white shadow-sm'
                    : 'bg-clay-50 text-clay-600 hover:bg-clay-100',
                )}
              >
                {p.title.length > 6 ? p.title.slice(0, 6) + '…' : p.title}
              </button>
            ))}
          </div>
        </div>
        <div className="h-6 w-px bg-clay-200 mx-2" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-clay-400">状态</span>
          <div className="flex items-center gap-1.5">
            {(['all', 'pending', 'processing', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                  filterStatus === st
                    ? 'bg-gradient-to-r from-rose-500 to-lavender-500 text-white shadow-sm'
                    : 'bg-clay-50 text-clay-600 hover:bg-clay-100',
                )}
              >
                {st === 'all' ? '全部' : statusConfig[st].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-clay-400">共 {queue.length} 条申请</div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full" />
          </div>
        ) : queue.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sage-100 to-rose-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-10 h-10 text-sage-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-clay-700">暂无申请数据</h3>
            <p className="text-sm text-clay-500 mt-2">尝试调整筛选条件查看更多结果</p>
          </div>
        ) : (
          queue.map((item) => {
            const stCfg = statusConfig[item.status]
            const contactCfg = contactPreferenceConfig[item.contactPreference]
            const ContactIcon = contactCfg.icon
            const isExpanded = expandedId === item.id

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden',
                  stCfg.borderClass,
                )}
              >
                <div
                  className={cn('w-full h-1', stCfg.dotClass)}
                />

                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div
                        className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center border-2',
                          stCfg.bgClass,
                          stCfg.borderClass,
                        )}
                      >
                        <span className="font-mono text-lg font-bold text-clay-800">
                          {item.anonymousCode.replace('ANO-', '')}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-clay-500">
                        {item.anonymousCode}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border',
                            stCfg.bgClass,
                            stCfg.textClass,
                            stCfg.borderClass,
                          )}>
                            <span className={cn('w-2 h-2 rounded-full', stCfg.dotClass)} />
                            {stCfg.label}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            {item.programTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-clay-400 shrink-0">
                          <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {formatDate(item.appliedAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {item.symptomTags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-clay-100 text-clay-600 border border-clay-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-lg border',
                          'bg-lavender-50 text-lavender-700 border-lavender-200',
                        )}>
                          <Clock className="w-3 h-3" strokeWidth={1.8} />
                          {item.preferredTime.length > 0
                            ? item.preferredTime.map((t) => preferredTimeLabel[t]).join('、')
                            : '未指定时间'}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-lg border',
                          'bg-sage-50 text-sage-700 border-sage-200',
                        )}>
                          <ContactIcon className="w-3 h-3" strokeWidth={1.8} />
                          {contactCfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        className="text-clay-400 hover:text-clay-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedId(isExpanded ? null : item.id)
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" strokeWidth={2} />
                        ) : (
                          <ChevronDown className="w-5 h-5" strokeWidth={2} />
                        )}
                      </button>
                      <div className="flex items-center gap-1.5">
                        {item.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openStatusModal(item, 'processing')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lavender-500 text-white hover:bg-lavender-600 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" strokeWidth={1.8} />
                            开始处理
                          </button>
                        )}
                        {item.status === 'processing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openStatusModal(item, 'completed')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sage-500 text-white hover:bg-sage-600 transition-colors"
                          >
                            <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.8} />
                            标记完成
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openStatusModal(item, item.status)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-clay-100 text-clay-600 hover:bg-clay-200 transition-colors"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" strokeWidth={1.8} />
                          备注
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-clay-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-2xl bg-clay-50/60 border border-clay-100">
                        <p className="text-xs font-semibold text-clay-700 mb-2 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" strokeWidth={1.8} />
                          匿名编号
                        </p>
                        <p className="font-mono text-sm font-semibold text-clay-800">
                          {item.anonymousCode}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-clay-50/60 border border-clay-100">
                        <p className="text-xs font-semibold text-clay-700 mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                          申请时间
                        </p>
                        <p className="text-sm text-clay-700">{formatDateTime(item.appliedAt)}</p>
                      </div>
                    </div>

                    {item.additionalNotes && (
                      <div className="mb-4 p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
                        <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                          申请人备注
                        </p>
                        <p className="text-sm text-clay-600 leading-relaxed">
                          {item.additionalNotes}
                        </p>
                      </div>
                    )}

                    {item.processingNotes && (
                      <div className="mb-4 p-4 rounded-2xl bg-lavender-50/40 border border-lavender-100">
                        <p className="text-xs font-semibold text-lavender-700 mb-2 flex items-center gap-1.5">
                          <MessageSquarePlus className="w-3.5 h-3.5" strokeWidth={1.8} />
                          处理备注
                        </p>
                        <p className="text-sm text-clay-600 leading-relaxed">
                          {item.processingNotes}
                        </p>
                      </div>
                    )}

                    {item.timeline && item.timeline.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-clay-700 mb-3 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" strokeWidth={1.8} />
                          处理时间线
                        </p>
                        <div className="relative pl-6 space-y-4">
                          <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-sunset-300 via-lavender-300 to-sage-300" />
                          {item.timeline.map((tlItem, tIdx) => (
                            <div key={tIdx} className="relative">
                              <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-lavender-400 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-lavender-400" />
                              </div>
                              <div className="bg-clay-50/60 border border-clay-100 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-clay-700">
                                    {tlItem.status}
                                  </span>
                                  <span className="text-xs text-clay-400">
                                    {formatDateTime(tlItem.time)}
                                  </span>
                                </div>
                                <p className="text-xs text-clay-500">{tlItem.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showStatusModal && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowStatusModal(false)}
        >
          <div className="absolute inset-0 bg-clay-900/30 backdrop-blur-md animate-in fade-in duration-300" />

          <div
            className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 pt-7 pb-5 border-b border-clay-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-lavender-300 to-lavender-400 flex items-center justify-center shadow-md">
                    <Activity className="w-5.5 h-5.5 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-clay-800">更新申请状态</h3>
                    <p className="text-xs text-clay-500 mt-0.5">
                      {selectedItem.anonymousCode} · {selectedItem.programTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="w-9 h-9 rounded-xl bg-clay-50 hover:bg-clay-100 flex items-center justify-center text-clay-400 hover:text-clay-600 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="px-7 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-clay-700 mb-3">
                  新状态
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pending', 'processing', 'completed'] as const).map((st) => {
                    const cfg = statusConfig[st]
                    const isSelected = newStatus === st
                    return (
                      <button
                        key={st}
                        onClick={() => setNewStatus(st)}
                        className={cn(
                          'p-3 rounded-2xl border-2 text-center transition-all duration-200',
                          isSelected
                            ? `${cfg.bgClass} ${cfg.borderClass} ring-2 ${cfg.bgClass.replace('50', '100')}`
                            : 'border-clay-100 bg-white hover:border-clay-200 hover:bg-clay-50',
                        )}
                      >
                        <div className={cn('w-4 h-4 rounded-full mx-auto mb-1.5', cfg.dotClass)} />
                        <span className={cn('text-sm font-semibold', cfg.textClass)}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-clay-700 mb-2 flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4 text-clay-400" strokeWidth={1.8} />
                  处理备注
                  <span className="text-xs text-clay-400 font-normal">（仅管理端可见）</span>
                </label>
                <textarea
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  rows={4}
                  placeholder="填写处理备注，如：已联系用户、已匹配咨询师、用户需要改期等..."
                  className="w-full px-4 py-3 rounded-2xl border border-warm-200 bg-white text-sm text-clay-700 placeholder-clay-400 focus:outline-none focus:border-lavender-300 focus:ring-4 focus:ring-lavender-100/60 transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-7 py-5 border-t border-clay-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-clay-600 bg-clay-50 hover:bg-clay-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-lavender-500 to-lavender-600 hover:shadow-lg hover:shadow-lavender-200/50 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    更新中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                    确认更新
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
