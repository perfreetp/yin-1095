import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type { Activity, DepartmentTrend, DashboardStats } from '../../shared/types/index.js'

const router = Router()

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

    const userMap = new Map(mockData.users.map((u) => [u.id, u]))
    const departmentDistribution: Record<string, number> = {}

    registrations.forEach((r) => {
      const user = userMap.get(r.userId)
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

export default router
