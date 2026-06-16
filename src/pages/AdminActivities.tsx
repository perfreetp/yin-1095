import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Edit3,
  Users,
  Download,
  X,
  Calendar,
  MapPin,
  UserCircle,
  Tag,
  Hash,
  Clock,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react'
import type { Activity, ActivityType } from 'shared/types'
import { cn } from '@/lib/utils'

interface RegistrationDetail {
  activityTitle: string
  totalRegistered: number
  capacity: number
  anonymousCount: number
  departmentDistribution: { department: string; count: number }[]
}

type ActivityStatus = 'upcoming' | 'ongoing' | 'past'

const typeLabels: Record<ActivityType, { label: string; className: string }> = {
  lecture: { label: '讲座', className: 'bg-lavender-100 text-lavender-700 border-lavender-200' },
  workshop: { label: '工作坊', className: 'bg-sage-100 text-sage-700 border-sage-200' },
  consultation: { label: '义诊咨询', className: 'bg-rose-100 text-rose-700 border-rose-200' },
  course: { label: '系列课程', className: 'bg-sunset-100 text-sunset-700 border-sunset-200' },
}

const statusLabels: Record<ActivityStatus, { label: string; dotClass: string; textClass: string }> = {
  upcoming: { label: '未开始', dotClass: 'bg-sage-500', textClass: 'text-sage-700' },
  ongoing: { label: '进行中', dotClass: 'bg-sunset-500', textClass: 'text-sunset-700' },
  past: { label: '已结束', dotClass: 'bg-clay-400', textClass: 'text-clay-500' },
}

function getStatus(activity: Activity): ActivityStatus {
  const now = new Date()
  const start = new Date(activity.startTime)
  const end = new Date(activity.endTime)
  if (now < start) return 'upcoming'
  if (now > end) return 'past'
  return 'ongoing'
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const defaultFormData = {
  title: '',
  type: 'lecture' as ActivityType,
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  speaker: '',
  capacity: 50,
  tags: '',
}

export default function AdminActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationDetail, setRegistrationDetail] = useState<RegistrationDetail | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('pageSize', '50')
      const res = await fetch(`/api/activities?${params.toString()}`).then((r) => r.json())
      if (res.success) {
        setActivities(res.data.list)
      }
    } finally {
      setLoading(false)
    }
  }, [keyword, filterType])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  function openCreateModal() {
    setEditingActivity(null)
    setFormData(defaultFormData)
    setShowCreateModal(true)
  }

  function openEditModal(activity: Activity) {
    setEditingActivity(activity)
    const start = new Date(activity.startTime)
    const end = new Date(activity.endTime)
    const pad = (n: number) => String(n).padStart(2, '0')
    setFormData({
      title: activity.title,
      type: activity.type,
      description: activity.description,
      startTime: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`,
      location: activity.location,
      speaker: activity.speaker,
      capacity: activity.capacity,
      tags: activity.tags.join('、'),
    })
    setShowCreateModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location,
        speaker: formData.speaker,
        capacity: Number(formData.capacity),
        tags: formData.tags.split(/[、,，\s]+/).filter(Boolean),
      }

      const url = editingActivity
        ? `/api/admin/activities/${editingActivity.id}`
        : '/api/admin/activities'
      const method = editingActivity ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json())

      if (res.success) {
        setShowCreateModal(false)
        fetchActivities()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleViewRegistrations(activity: Activity) {
    setShowRegistrationModal(true)
    setRegLoading(true)
    setRegistrationDetail(null)
    try {
      const res = await fetch(`/api/admin/activities/${activity.id}/registrations`).then((r) => r.json())
      if (res.success) {
        setRegistrationDetail(res.data)
      }
    } finally {
      setRegLoading(false)
    }
  }

  function handleExport(activity: Activity) {
    const csvContent = [
      ['活动名称', activity.title].join(','),
      ['类型', typeLabels[activity.type].label].join(','),
      ['开始时间', formatDateTime(activity.startTime)].join(','),
      ['结束时间', formatDateTime(activity.endTime)].join(','),
      ['地点', activity.location].join(','),
      ['讲师', activity.speaker].join(','),
      ['容量', activity.capacity].join(','),
      ['已报名', activity.registered].join(','),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `活动_${activity.title}_导出.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = activities

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-clay-900">活动管理</h1>
          <p className="text-clay-500 mt-1">创建和管理关怀活动</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-lavender-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-rose-200/50 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          创建活动
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-400" strokeWidth={1.8} />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchActivities()}
            placeholder="搜索活动标题、描述、标签..."
            className="w-full h-11 pl-11 pr-5 rounded-xl border border-clay-100 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-400" strokeWidth={1.8} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-11 pl-11 pr-8 rounded-xl border border-clay-100 bg-white text-sm text-clay-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
          >
            <option value="all">全部类型</option>
            <option value="lecture">讲座</option>
            <option value="workshop">工作坊</option>
            <option value="consultation">义诊咨询</option>
            <option value="course">系列课程</option>
          </select>
        </div>
        <button
          onClick={fetchActivities}
          className="h-11 px-5 rounded-xl bg-clay-50 text-clay-600 text-sm font-medium hover:bg-clay-100 transition-colors"
        >
          搜索
        </button>
      </div>

      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-clay-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-clay-50/60 border-b border-clay-100">
                <th className="text-left text-clay-600 font-medium px-6 py-4">活动</th>
                <th className="text-left text-clay-600 font-medium px-4 py-4 w-24">类型</th>
                <th className="text-left text-clay-600 font-medium px-4 py-4 w-36">时间</th>
                <th className="text-left text-clay-600 font-medium px-4 py-4 w-32">地点</th>
                <th className="text-left text-clay-600 font-medium px-4 py-4 w-40">报名进度</th>
                <th className="text-left text-clay-600 font-medium px-4 py-4 w-24">状态</th>
                <th className="text-right text-clay-600 font-medium px-6 py-4 w-52">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-clay-400">
                    <div className="flex justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-clay-400">
                    暂无活动数据
                  </td>
                </tr>
              ) : (
                filtered.map((activity) => {
                  const status = getStatus(activity)
                  const progress = Math.round((activity.registered / activity.capacity) * 100)
                  return (
                    <tr key={activity.id} className="border-b border-clay-50 hover:bg-clay-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activity.coverImage && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-clay-100 flex-shrink-0">
                              <img
                                src={activity.coverImage}
                                alt={activity.title}
                                className="w-full h-full object-cover"
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-clay-800 truncate max-w-xs">{activity.title}</div>
                            <div className="text-xs text-clay-500 mt-1 flex items-center gap-1.5">
                              <UserCircle className="w-3 h-3" strokeWidth={1.8} />
                              <span className="truncate">{activity.speaker || '待定'}</span>
                              <span className="mx-1.5 text-clay-300">|</span>
                              <Hash className="w-3 h-3" strokeWidth={1.8} />
                              <span>{activity.tags.slice(0, 2).join('、') || '暂无标签'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border',
                          typeLabels[activity.type].className,
                        )}>
                          {typeLabels[activity.type].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-clay-600 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-clay-400" strokeWidth={1.8} />
                            {formatDateTime(activity.startTime)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-clay-400" strokeWidth={1.8} />
                            {formatDateTime(activity.endTime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-clay-600">
                          <MapPin className="w-3 h-3 text-clay-400" strokeWidth={1.8} />
                          <span className="truncate max-w-28">{activity.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-clay-600 font-medium">
                              {activity.registered} / {activity.capacity}
                            </span>
                            <span className="text-clay-500">{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-clay-100 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                progress >= 90
                                  ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                  : progress >= 60
                                  ? 'bg-gradient-to-r from-sunset-400 to-sunset-500'
                                  : 'bg-gradient-to-r from-sage-400 to-sage-500',
                              )}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', statusLabels[status].dotClass)} />
                          <span className={cn('text-xs font-medium', statusLabels[status].textClass)}>
                            {statusLabels[status].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(activity)}
                            className="p-2 rounded-lg text-clay-500 hover:bg-clay-100 hover:text-clay-700 transition-colors"
                            title="编辑活动"
                          >
                            <Edit3 className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                          <button
                            onClick={() => handleViewRegistrations(activity)}
                            className="p-2 rounded-lg text-lavender-500 hover:bg-lavender-50 hover:text-lavender-700 transition-colors"
                            title="查看报名"
                          >
                            <Users className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                          <button
                            onClick={() => handleExport(activity)}
                            className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 hover:text-sage-700 transition-colors"
                            title="导出数据"
                          >
                            <Download className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-clay-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-clay-100">
            <div className="sticky top-0 bg-white border-b border-clay-100 px-8 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-clay-900">
                {editingActivity ? '编辑活动' : '创建新活动'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-clay-400 hover:bg-clay-100 hover:text-clay-600 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.8} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-clay-700 mb-2">活动标题 *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入活动标题"
                  className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-clay-700 mb-2">活动类型 *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                    className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all appearance-none cursor-pointer"
                  >
                    <option value="lecture">讲座</option>
                    <option value="workshop">工作坊</option>
                    <option value="consultation">义诊咨询</option>
                    <option value="course">系列课程</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-clay-700 mb-2">活动容量 *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-clay-700 mb-2">开始时间 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-clay-700 mb-2">结束时间 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-clay-700 mb-2">活动地点 *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="请输入活动地点"
                    className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-clay-700 mb-2">主讲/讲师</label>
                  <input
                    type="text"
                    value={formData.speaker}
                    onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                    placeholder="请输入主讲人姓名"
                    className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-clay-700 mb-2 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-clay-400" strokeWidth={1.8} />
                  标签（用顿号或逗号分隔）
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="例如：睡眠、健康、职场"
                  className="w-full h-11 px-4 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-clay-700 mb-2">活动描述</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入活动详细描述..."
                  className="w-full px-4 py-3 rounded-xl border border-clay-200 bg-white text-sm text-clay-700 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-clay-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-clay-50 text-clay-600 font-medium text-sm hover:bg-clay-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-lavender-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-rose-200/50 transition-all disabled:opacity-60"
                >
                  {submitting ? '提交中...' : editingActivity ? '保存修改' : '创建活动'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-clay-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-clay-100 overflow-hidden">
            <div className="bg-gradient-to-r from-lavender-50 to-sage-50 border-b border-clay-100 px-8 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-clay-900">报名详情</h3>
                <p className="text-sm text-clay-500 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sage-500" strokeWidth={1.8} />
                  为保护隐私，仅显示部门分布统计
                </p>
              </div>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="p-2 rounded-xl text-clay-400 hover:bg-white/60 hover:text-clay-600 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.8} />
              </button>
            </div>
            <div className="p-8">
              {regLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full" />
                </div>
              ) : registrationDetail ? (
                <div className="space-y-6">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-rose-50 via-lavender-50 to-sage-50">
                    <div className="text-sm text-clay-500 mb-1">{registrationDetail.activityTitle}</div>
                    <div className="text-5xl font-bold text-clay-900 mt-3">
                      {registrationDetail.anonymousCount}
                    </div>
                    <div className="text-sm text-clay-500 mt-2">
                      匿名报名人数 / 容量 {registrationDetail.capacity}
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-lavender-500"
                        style={{ width: `${Math.round((registrationDetail.anonymousCount / registrationDetail.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-clay-700 mb-3">部门分布</h4>
                    <div className="space-y-2.5">
                      {registrationDetail.departmentDistribution.map((d, idx) => {
                        const pct = registrationDetail.anonymousCount > 0
                          ? Math.round((d.count / registrationDetail.anonymousCount) * 100)
                          : 0
                        const colors = ['#B55359', '#754994', '#4E7745', '#A87C3C', '#DB7E20', '#AD8AC0', '#84A97C', '#D3B88F', '#C77076', '#9067AB']
                        return (
                          <div key={d.department}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="text-clay-700 font-medium">{d.department}</span>
                              <span className="text-clay-500">{d.count}人 ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-clay-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {registrationDetail.departmentDistribution.length === 0 && (
                        <div className="text-center py-8 text-clay-400 text-sm">
                          暂无报名数据
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
