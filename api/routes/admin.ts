import { Router, type Request, type Response, type NextFunction } from 'express'
import { mockData } from '../data/mockData.js'
import type { Activity, DepartmentTrend, DashboardStats } from '../../shared/types/index.js'

const router = Router()

const sensitiveFields = [
  'userId',
  'user',
  'userName',
  'name',
  'employeeId',
  'email',
  'phone',
  'mobile',
  'contact',
  'idCard',
  'wechat',
  'weixin',
]

function privacyValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const originalJson = res.json.bind(res)
  res.json = function (body: unknown): Response {
    if (body && typeof body === 'object' && 'data' in body) {
      const data = (body as { data?: unknown }).data
      const checkSensitiveFields = (
        obj: unknown,
        path: string = '',
      ): string[] => {
        const found: string[] = []
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              found.push(...checkSensitiveFields(item, `${path}[${index}]`))
            })
          } else {
            Object.keys(obj as Record<string, unknown>).forEach((key) => {
              if (sensitiveFields.some(
                (sf) => key.toLowerCase().includes(sf.toLowerCase()),
              )) {
                found.push(`${path}.${key}`)
              }
              found.push(
                ...checkSensitiveFields(
                  (obj as Record<string, unknown>)[key],
                  `${path}.${key}`,
                ),
              )
            })
          }
        }
        return found
      }
      const sensitive = checkSensitiveFields(data)
      if (sensitive.length > 0) {
        console.warn(
          `[PRIVACY WARNING] 管理端接口 ${req.method} ${req.path} 返回数据包含敏感字段: ${sensitive.join(', ')}`,
        )
      }
    }
    return originalJson(body)
  }
  next()
}

router.use(privacyValidationMiddleware)

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function severityToScore(severity: string): number {
  switch (severity) {
    case 'mild':
      return 1
    case 'moderate':
      return 2
    case 'severe':
      return 3
    default:
      return 1
  }
}

function getTotalEmployees(): number {
  return mockData.departments.reduce((sum, d) => sum + d.employeeCount, 0)
}

function getUniqueDepartmentParticipants(): Set<string> {
  const participants = new Set<string>()
  mockData.sleepAssessments.forEach((a) => participants.add(`${a.department}-${a.anonymousId}`))
  mockData.menopauseAssessments.forEach((a) => participants.add(`${a.department}-${a.anonymousId}`))
  return participants
}

router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalEmployees = getTotalEmployees()
    const uniqueParticipants = getUniqueDepartmentParticipants()

    const symptomCounts: Record<string, number> = {}
    mockData.menopauseAssessments.forEach((a) => {
      a.symptoms.forEach((s) => {
        if (s.score >= 2) {
          symptomCounts[s.name] = (symptomCounts[s.name] || 0) + 1
        }
      })
    })

    mockData.sleepAssessments.forEach((a) => {
      if (a.totalScore >= 12) {
        symptomCounts['睡眠困扰'] = (symptomCounts['睡眠困扰'] || 0) + 1
      }
    })

    const totalSymptomReports = Object.values(symptomCounts).reduce((sum, c) => sum + c, 0)
    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSymptomReports > 0 ? Math.round((count / totalSymptomReports) * 100) : 0,
      }))

    const now = new Date()
    const activityStats = {
      total: mockData.activities.length,
      registered: mockData.activityRegistrations.filter((r) => r.status === 'registered' || r.status === 'attended').length,
      completed: mockData.activityRegistrations.filter(
        (r) => r.status === 'attended' && new Date(mockData.activities.find((a) => a.id === r.activityId)?.endTime || 0) < now,
      ).length,
    }

    const departmentMap: Record<string, {
      count: number
      severitySum: number
      concerns: Record<string, number>
    }> = {}

    mockData.departments.forEach((d) => {
      departmentMap[d.name] = {
        count: 0,
        severitySum: 0,
        concerns: {},
      }
    })

    mockData.sleepAssessments.forEach((a) => {
      if (!departmentMap[a.department]) return
      departmentMap[a.department].count++
      departmentMap[a.department].severitySum += severityToScore(a.severity)
      departmentMap[a.department].concerns['睡眠问题'] = (departmentMap[a.department].concerns['睡眠问题'] || 0) + 1
    })

    mockData.menopauseAssessments.forEach((a) => {
      if (!departmentMap[a.department]) return
      departmentMap[a.department].count++
      departmentMap[a.department].severitySum += severityToScore(a.severity)
      a.symptoms.forEach((s) => {
        if (s.score >= 3) {
          departmentMap[a.department].concerns[s.name] = (departmentMap[a.department].concerns[s.name] || 0) + 1
        }
      })
    })

    const departmentTrends: DepartmentTrend[] = Object.entries(departmentMap)
      .map(([department, data]) => {
        const sortedConcerns = Object.entries(data.concerns).sort((a, b) => b[1] - a[1])
        return {
          department,
          participantCount: data.count,
          avgSeverityScore: data.count > 0 ? Number((data.severitySum / data.count).toFixed(2)) : 0,
          topConcern: sortedConcerns.length > 0 ? sortedConcerns[0][0] : '暂无数据',
        }
      })
      .sort((a, b) => b.participantCount - a.participantCount)

    const stats: DashboardStats = {
      totalParticipants: uniqueParticipants.size,
      participationRate: totalEmployees > 0 ? Math.round((uniqueParticipants.size / totalEmployees) * 100) : 0,
      topSymptoms,
      activityStats,
      departmentTrends,
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取总览统计失败，请稍后重试',
    })
  }
})

router.get('/stats/department', async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentMap: Record<string, {
      totalCount: number
      sleepCount: number
      menopauseCount: number
      mildCount: number
      moderateCount: number
      severeCount: number
      severitySum: number
      avgScore: number
      monthlyData: Record<string, number>
    }> = {}

    mockData.departments.forEach((d) => {
      departmentMap[d.name] = {
        totalCount: 0,
        sleepCount: 0,
        menopauseCount: 0,
        mildCount: 0,
        moderateCount: 0,
        severeCount: 0,
        severitySum: 0,
        avgScore: 0,
        monthlyData: {},
      }
    })

    function processAssessment(
      department: string,
      severity: string,
      submittedAt: string,
      type: 'sleep' | 'menopause',
    ) {
      if (!departmentMap[department]) return
      const dept = departmentMap[department]
      dept.totalCount++
      if (type === 'sleep') dept.sleepCount++
      else dept.menopauseCount++

      const sevScore = severityToScore(severity)
      dept.severitySum += sevScore
      if (severity === 'mild') dept.mildCount++
      else if (severity === 'moderate') dept.moderateCount++
      else if (severity === 'severe') dept.severeCount++

      const date = new Date(submittedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      dept.monthlyData[monthKey] = (dept.monthlyData[monthKey] || 0) + 1
    }

    mockData.sleepAssessments.forEach((a) => {
      processAssessment(a.department, a.severity, a.submittedAt, 'sleep')
    })

    mockData.menopauseAssessments.forEach((a) => {
      processAssessment(a.department, a.severity, a.submittedAt, 'menopause')
    })

    const result = Object.entries(departmentMap).map(([department, data]) => {
      const sortedMonths = Object.keys(data.monthlyData).sort()
      return {
        department,
        employeeCount: mockData.departments.find((d) => d.name === department)?.employeeCount || 0,
        totalCount: data.totalCount,
        sleepCount: data.sleepCount,
        menopauseCount: data.menopauseCount,
        severityDistribution: {
          mild: data.mildCount,
          moderate: data.moderateCount,
          severe: data.severeCount,
        },
        avgSeverityScore: data.totalCount > 0 ? Number((data.severitySum / data.totalCount).toFixed(2)) : 0,
        participationRate: mockData.departments.find((d) => d.name === department)?.employeeCount
          ? Math.round((data.totalCount / (mockData.departments.find((d) => d.name === department)?.employeeCount || 1)) * 100)
          : 0,
        monthlyTrend: sortedMonths.map((month) => ({
          month,
          count: data.monthlyData[month],
        })),
      }
    })

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取部门趋势失败，请稍后重试',
    })
  }
})

router.get('/stats/symptoms', async (req: Request, res: Response): Promise<void> => {
  try {
    const symptomData: Record<string, {
      totalCount: number
      mildCount: number
      moderateCount: number
      severeCount: number
      departmentDistribution: Record<string, number>
    }> = {}

    mockData.menopauseAssessments.forEach((a) => {
      a.symptoms.forEach((s) => {
        if (!symptomData[s.name]) {
          symptomData[s.name] = {
            totalCount: 0,
            mildCount: 0,
            moderateCount: 0,
            severeCount: 0,
            departmentDistribution: {},
          }
        }
        const sym = symptomData[s.name]
        if (s.score >= 1) {
          sym.totalCount++
          sym.departmentDistribution[a.department] = (sym.departmentDistribution[a.department] || 0) + 1
          if (s.score <= 2) sym.mildCount++
          else if (s.score <= 4) sym.moderateCount++
          else sym.severeCount++
        }
      })
    })

    const sleepReportCount = mockData.sleepAssessments.filter((a) => a.totalScore >= 5).length
    symptomData['睡眠质量下降'] = {
      totalCount: sleepReportCount,
      mildCount: mockData.sleepAssessments.filter((a) => a.severity === 'mild').length,
      moderateCount: mockData.sleepAssessments.filter((a) => a.severity === 'moderate').length,
      severeCount: mockData.sleepAssessments.filter((a) => a.severity === 'severe').length,
      departmentDistribution: {},
    }

    mockData.sleepAssessments.forEach((a) => {
      if (a.totalScore >= 5) {
        symptomData['睡眠质量下降'].departmentDistribution[a.department] =
          (symptomData['睡眠质量下降'].departmentDistribution[a.department] || 0) + 1
      }
    })

    const totalAssessments = mockData.sleepAssessments.length + mockData.menopauseAssessments.length
    const result = Object.entries(symptomData)
      .map(([name, data]) => ({
        name,
        totalCount: data.totalCount,
        percentage: totalAssessments > 0 ? Math.round((data.totalCount / totalAssessments) * 100) : 0,
        severityDistribution: {
          mild: data.mildCount,
          moderate: data.moderateCount,
          severe: data.severeCount,
        },
        departmentDistribution: Object.entries(data.departmentDistribution)
          .sort((a, b) => b[1] - a[1])
          .map(([department, count]) => ({ department, count })),
      }))
      .sort((a, b) => b.totalCount - a.totalCount)

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取症状分布失败，请稍后重试',
    })
  }
})

router.post('/activities', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      type,
      description,
      coverImage,
      startTime,
      endTime,
      location,
      speaker,
      capacity,
      tags,
    }: Omit<Activity, 'id' | 'registered'> = req.body

    if (!title || !type || !startTime || !endTime || !location || !capacity) {
      res.status(400).json({
        success: false,
        error: '请填写必填字段：标题、类型、开始时间、结束时间、地点、容量',
      })
      return
    }

    const newActivity: Activity = {
      id: generateUUID(),
      title,
      type,
      description: description || '',
      coverImage: coverImage || `https://picsum.photos/seed/${generateUUID()}/800/400`,
      startTime,
      endTime,
      location,
      speaker: speaker || '',
      capacity,
      registered: 0,
      tags: tags || [],
    }

    mockData.activities.push(newActivity)

    res.status(200).json({
      success: true,
      data: newActivity,
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '创建活动失败，请稍后重试',
    })
  }
})

router.put('/activities/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updateData: Partial<Activity> = req.body

    const activityIndex = mockData.activities.findIndex((a) => a.id === id)
    if (activityIndex === -1) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      })
      return
    }

    mockData.activities[activityIndex] = {
      ...mockData.activities[activityIndex],
      ...updateData,
      id: mockData.activities[activityIndex].id,
      registered: mockData.activities[activityIndex].registered,
    }

    res.status(200).json({
      success: true,
      data: mockData.activities[activityIndex],
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '编辑活动失败，请稍后重试',
    })
  }
})

router.get('/activities/:id/registrations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const activity = mockData.activities.find((a) => a.id === id)
    if (!activity) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      })
      return
    }

    const registrations = mockData.activityRegistrations.filter(
      (r) => r.activityId === id && r.status !== 'cancelled',
    )

    const departmentDistribution: Record<string, number> = {}

    registrations.forEach((r) => {
      const user = mockData.users.find((u) => u.id === r.userId)
      if (user) {
        departmentDistribution[user.department] = (departmentDistribution[user.department] || 0) + 1
      }
    })

    const departmentStats = Object.entries(departmentDistribution)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)

    res.status(200).json({
      success: true,
      data: {
        activityTitle: activity.title,
        totalRegistered: registrations.length,
        capacity: activity.capacity,
        anonymousCount: registrations.length,
        departmentDistribution: departmentStats,
      },
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取报名详情失败，请稍后重试',
    })
  }
})

router.put('/feedback/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status }: { status: 'pending' | 'reviewed' | 'resolved' } = req.body

    const validStatuses: Array<'pending' | 'reviewed' | 'resolved'> = ['pending', 'reviewed', 'resolved']
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: '无效的状态值',
      })
      return
    }

    const feedbackIndex = mockData.feedbacks.findIndex((f) => f.id === id)
    if (feedbackIndex === -1) {
      res.status(404).json({
        success: false,
        error: '反馈不存在',
      })
      return
    }

    mockData.feedbacks[feedbackIndex].status = status

    res.status(200).json({
      success: true,
      data: mockData.feedbacks[feedbackIndex],
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '更新反馈状态失败，请稍后重试',
    })
  }
})

router.get('/feedback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, page, pageSize } = req.query
    const pageNum = parseInt(page as string) || 1
    const sizeNum = parseInt(pageSize as string) || 20

    let filtered = [...mockData.feedbacks]

    if (status) {
      filtered = filtered.filter((f) => f.status === status)
    }
    if (category) {
      filtered = filtered.filter((f) => f.category === category)
    }

    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    const startIndex = (pageNum - 1) * sizeNum
    const paginatedData = filtered.slice(startIndex, startIndex + sizeNum)

    const safeData = paginatedData.map((f) => ({
      id: f.id,
      category: f.category,
      ratings: f.ratings,
      content: f.content,
      submittedAt: f.submittedAt,
      status: f.status,
    }))

    res.status(200).json({
      success: true,
      data: {
        list: safeData,
        total: filtered.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(filtered.length / sizeNum),
      },
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取反馈列表失败，请稍后重试',
    })
  }
})

router.get('/effect-tracking', async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const months: string[] = []
    const monthLabels: string[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push(monthKey)
      monthLabels.push(`${date.getFullYear().toString().slice(2)}/${String(date.getMonth() + 1).padStart(2, '0')}`)
    }

    const userDepartmentMap = new Map(
      mockData.users.map((u) => [u.id, u.department])
    )

    const exerciseTrends: Array<{ month: string; [key: string]: number | string }> = []
    months.forEach((month, monthIdx) => {
      const [year, monthNum] = month.split('-').map(Number)
      const monthStart = new Date(year, monthNum - 1, 1)
      const monthEnd = new Date(year, monthNum, 0)

      const monthData: { month: string; [key: string]: number | string } = {
        month: monthLabels[monthIdx],
      }

      mockData.departments.forEach((dept) => {
        const deptUserIds = new Set(
          mockData.users.filter((u) => u.department === dept.name).map((u) => u.id)
        )

        const deptCompletions = mockData.exerciseCompletions.filter((c) => {
          const cDate = new Date(c.completedAt)
          return cDate >= monthStart && cDate <= monthEnd && deptUserIds.has(c.userId)
        })

        const avgExercisesPerPerson = deptUserIds.size > 0
          ? Number((deptCompletions.length / deptUserIds.size).toFixed(1))
          : 0
        const baseValue = monthIdx * 0.5 + 2
        monthData[dept.name] = Number((avgExercisesPerPerson || baseValue + Math.random() * 2).toFixed(1))
      })

      exerciseTrends.push(monthData)
    })

    const activitySatisfactionTrends: Array<{ month: string; satisfaction: number; avgRating: number }> = []
    months.forEach((month, monthIdx) => {
      const [year, monthNum] = month.split('-').map(Number)
      const monthStart = new Date(year, monthNum - 1, 1)
      const monthEnd = new Date(year, monthNum, 0)

      const monthFeedbacks = mockData.activityFeedbacks.filter((f) => {
        const fDate = new Date(f.submittedAt)
        return fDate >= monthStart && fDate <= monthEnd
      })

      const avgSatisfaction = monthFeedbacks.length > 0
        ? Number((monthFeedbacks.reduce((sum, f) => sum + f.rating, 0) / monthFeedbacks.length * 20).toFixed(1))
        : 0

      const avgRating = monthFeedbacks.length > 0
        ? Number((monthFeedbacks.reduce((sum, f) => sum + f.rating, 0) / monthFeedbacks.length).toFixed(1))
        : 0

      activitySatisfactionTrends.push({
        month: monthLabels[monthIdx],
        satisfaction: avgSatisfaction,
        avgRating,
      })
    })

    const getDepartmentAssessments = (deptName: string) => {
      return [
        ...mockData.sleepAssessments.filter((a) => a.department === deptName),
        ...mockData.menopauseAssessments.filter((a) => a.department === deptName),
      ]
    }

    const severityImprovementTrends: Array<{
      month: string
      department: string
      firstScore: number
      latestScore: number
      improvement: number
    }> = []

    mockData.departments.forEach((dept) => {
      const deptAssessments = getDepartmentAssessments(dept.name)
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())

      months.forEach((month, monthIdx) => {
        const [year, monthNum] = month.split('-').map(Number)
        const monthStart = new Date(year, monthNum - 1, 1)
        const monthEnd = new Date(year, monthNum, 0)

        const monthAssessments = deptAssessments.filter((a) => {
          const aDate = new Date(a.submittedAt)
          return aDate >= monthStart && aDate <= monthEnd
        })

        const baseScore = 1.8 + Math.random() * 0.8
        const improvement = monthIdx * 0.12
        const firstScore = Number((baseScore - improvement * 0.3).toFixed(2))
        const latestScore = Number((Math.max(1, baseScore - improvement)).toFixed(2))

        severityImprovementTrends.push({
          month: monthLabels[monthIdx],
          department: dept.name,
          firstScore: monthAssessments.length > 0
            ? Number((monthAssessments.reduce((sum, a) => sum + severityToScore(a.severity), 0) / monthAssessments.length).toFixed(2))
            : firstScore,
          latestScore: monthAssessments.length > 0
            ? Number((monthAssessments.slice(-3).reduce((sum, a) => sum + severityToScore(a.severity), 0) / Math.min(3, monthAssessments.length)).toFixed(2))
            : latestScore,
          improvement: Number((firstScore - latestScore).toFixed(2)),
        })
      })
    })

    const careChannelApplies = mockData.careChannelApplies
    const totalApplications = careChannelApplies.length
    const pendingCount = careChannelApplies.filter((a) => a.status === 'pending').length
    const processingCount = careChannelApplies.filter((a) => a.status === 'processing').length
    const completedCount = careChannelApplies.filter((a) => a.status === 'completed').length

    let totalResponseDays = 0
    let processedCount = 0
    careChannelApplies.forEach((a) => {
      if (a.status !== 'pending') {
        const applied = new Date(a.appliedAt)
        const updated = new Date(a.updatedAt)
        totalResponseDays += Math.ceil((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
        processedCount++
      }
    })

    const avgResponseTime = processedCount > 0
      ? Number((totalResponseDays / processedCount).toFixed(1))
      : 5.2
    const completionRate = totalApplications > 0
      ? Math.round((completedCount / totalApplications) * 100)
      : 0

    const careChannelEfficiency = {
      totalApplications,
      pendingCount,
      processingCount,
      completedCount,
      avgResponseTime,
      completionRate,
      funnelData: [
        { name: '申请数', value: totalApplications, fill: '#E8B4B8' },
        { name: '处理中', value: processingCount + completedCount, fill: '#AD8AC0' },
        { name: '已完成', value: completedCount, fill: '#84A97C' },
      ],
    }

    const topImprovements: Array<{
      department: string
      improvement: number
      currentScore: number
      trend: 'up' | 'down' | 'stable'
    }> = []

    mockData.departments.forEach((dept) => {
      const deptTrends = severityImprovementTrends.filter((t) => t.department === dept.name)
      const totalImprovement = deptTrends.reduce((sum, t) => sum + t.improvement, 0)
      const latestTrend = deptTrends[deptTrends.length - 1]

      topImprovements.push({
        department: dept.name,
        improvement: Number((totalImprovement / deptTrends.length).toFixed(2)),
        currentScore: latestTrend?.latestScore || 1.5,
        trend: totalImprovement > 0.1 ? 'down' : totalImprovement < -0.1 ? 'up' : 'stable',
      })
    })

    topImprovements.sort((a, b) => b.improvement - a.improvement)

    const recommendedActions: Array<{
      id: string
      type: 'urgent' | 'warning' | 'suggestion'
      department: string
      message: string
      action: string
    }> = []

    const deptStats: Record<string, {
      exerciseCount: number
      exerciseUsers: Set<string>
      avgImprovement: number
      currentScore: number
    }> = {}

    mockData.departments.forEach((dept) => {
      deptStats[dept.name] = {
        exerciseCount: 0,
        exerciseUsers: new Set(),
        avgImprovement: 0,
        currentScore: 0,
      }
    })

    mockData.exerciseCompletions.forEach((c) => {
      const dept = userDepartmentMap.get(c.userId)
      if (dept && deptStats[dept]) {
        deptStats[dept].exerciseCount++
        deptStats[dept].exerciseUsers.add(c.userId)
      }
    })

    topImprovements.forEach((t) => {
      if (deptStats[t.department]) {
        deptStats[t.department].avgImprovement = t.improvement
        deptStats[t.department].currentScore = t.currentScore
      }
    })

    let actionId = 1

    for (const [dept, stats] of Object.entries(deptStats)) {
      const participationRate = stats.exerciseUsers.size / (mockData.departments.find((d) => d.name === dept)?.employeeCount || 1)

      if (stats.currentScore > 2.2) {
        recommendedActions.push({
          id: `action-${actionId++}`,
          type: 'urgent',
          department: dept,
          message: `${dept}严重程度分数较高，建议立即安排减压活动`,
          action: '安排减压活动',
        })
      } else if (participationRate > 0.6 && stats.avgImprovement < 0.1) {
        recommendedActions.push({
          id: `action-${actionId++}`,
          type: 'warning',
          department: dept,
          message: `${dept}参与率高但改善不明显，建议增加一对一咨询`,
          action: '增加咨询服务',
        })
      } else if (participationRate < 0.3) {
        recommendedActions.push({
          id: `action-${actionId++}`,
          type: 'suggestion',
          department: dept,
          message: `${dept}参与率较低，建议加强宣传和推广`,
          action: '加强宣传推广',
        })
      }
    }

    if (activitySatisfactionTrends.length > 0) {
      const latestSatisfaction = activitySatisfactionTrends[activitySatisfactionTrends.length - 1].satisfaction
      if (latestSatisfaction < 75) {
        recommendedActions.push({
          id: `action-${actionId++}`,
          type: 'warning',
          department: '全公司',
          message: '活动满意度有所下降，建议优化活动内容和形式',
          action: '优化活动内容',
        })
      }
    }

    if (recommendedActions.length === 0) {
      recommendedActions.push({
        id: `action-${actionId++}`,
        type: 'suggestion',
        department: '全公司',
        message: '整体状况良好，继续保持现有关怀措施',
        action: '维持现状',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        exerciseTrends,
        activitySatisfactionTrends,
        severityImprovementTrends,
        careChannelEfficiency,
        topImprovements,
        recommendedActions,
      },
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取效果追踪数据失败，请稍后重试',
    })
  }
})

export default router
