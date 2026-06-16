import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type { ActivityRegistration, ActivityFeedback, SleepAssessment, MenopauseAssessment } from '../../shared/types/index.js'

const router = Router()

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, keyword, page, pageSize } = req.query
    const pageNum = parseInt(page as string) || 1
    const sizeNum = parseInt(pageSize as string) || 10
    const now = new Date()

    let filtered = [...mockData.activities]

    if (type) {
      filtered = filtered.filter((a) => a.type === type)
    }

    if (status === 'upcoming') {
      filtered = filtered.filter((a) => new Date(a.startTime) >= now)
    } else if (status === 'past') {
      filtered = filtered.filter((a) => new Date(a.endTime) < now)
    } else if (status === 'ongoing') {
      filtered = filtered.filter(
        (a) => new Date(a.startTime) <= now && new Date(a.endTime) >= now,
      )
    }

    if (keyword) {
      const keywordLower = (keyword as string).toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(keywordLower) ||
          a.description.toLowerCase().includes(keywordLower) ||
          a.tags.some((t) => t.toLowerCase().includes(keywordLower)),
      )
    }

    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const startIndex = (pageNum - 1) * sizeNum
    const paginatedData = filtered.slice(startIndex, startIndex + sizeNum)

    res.status(200).json({
      success: true,
      data: {
        list: paginatedData,
        total: filtered.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(filtered.length / sizeNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取活动列表失败，请稍后重试',
    })
  }
})

router.get('/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const myRegistrations = mockData.activityRegistrations.filter(
      (r) => r.userId === userId,
    )

    const activityMap = new Map(mockData.activities.map((a) => [a.id, a]))
    const result = myRegistrations
      .map((reg) => {
        const activity = activityMap.get(reg.activityId)
        const hasFeedback = mockData.activityFeedbacks.some(
          (f) => f.activityId === reg.activityId && f.userId === userId,
        )
        return activity
          ? {
              registration: {
                ...reg,
                feedbackSubmitted: hasFeedback,
              },
              activity,
            }
          : null
      })
      .filter((item) => item !== null)
      .sort(
        (a, b) =>
          new Date(b!.activity.startTime).getTime() -
          new Date(a!.activity.startTime).getTime(),
      )

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取我的活动失败，请稍后重试',
    })
  }
})

router.get('/my-effect', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const myRegistrations = mockData.activityRegistrations.filter(
      (r) => r.userId === userId && r.status === 'attended',
    )

    const attendedCount = myRegistrations.length

    const myFeedbacks = mockData.activityFeedbacks.filter((f) => f.userId === userId)
    const avgRating = myFeedbacks.length > 0
      ? Number((myFeedbacks.reduce((sum, f) => sum + f.rating, 0) / myFeedbacks.length).toFixed(1))
      : 0

    const userSleepAssessments = mockData.sleepAssessments.filter(
      (a) => (a as SleepAssessment & { userId?: string }).userId === userId,
    )
    const userMenopauseAssessments = mockData.menopauseAssessments.filter(
      (a) => (a as MenopauseAssessment & { userId?: string }).userId === userId,
    )

    const userAssessments: Array<SleepAssessment | MenopauseAssessment> = [
      ...userSleepAssessments,
      ...userMenopauseAssessments,
    ].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())

    const assessmentTrend: Array<{ date: string; score: number }> = []
    if (userAssessments.length > 0) {
      const recentAssessments = userAssessments.slice(-6)
      for (const assessment of recentAssessments) {
        const date = new Date(assessment.submittedAt)
        assessmentTrend.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          score: assessment.totalScore,
        })
      }
    }

    const activityIds = myRegistrations.map((r) => r.activityId)
    const hasFeedback = activityIds.some((aid) =>
      mockData.activityFeedbacks.some((f) => f.activityId === aid && f.userId === userId),
    )

    res.status(200).json({
      success: true,
      data: {
        attendedActivitiesCount: attendedCount,
        averageRating: avgRating,
        assessmentTrend,
        feedbackSubmitted: hasFeedback,
        pendingFeedbackCount: activityIds.filter(
          (aid) => !mockData.activityFeedbacks.some((f) => f.activityId === aid && f.userId === userId),
        ).length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取活动效果数据失败，请稍后重试',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { userId } = req.query

    const activity = mockData.activities.find((a) => a.id === id)

    if (!activity) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      })
      return
    }

    let myRegistration: ActivityRegistration | null = null
    if (userId) {
      myRegistration =
        mockData.activityRegistrations.find(
          (r) => r.activityId === id && r.userId === userId,
        ) || null
    }

    const registeredUsers = mockData.activityRegistrations.filter(
      (r) => r.activityId === id && r.status !== 'cancelled',
    ).length

    res.status(200).json({
      success: true,
      data: {
        ...activity,
        registeredCount: registeredUsers,
        myRegistration,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取活动详情失败，请稍后重试',
    })
  }
})

router.post('/:id/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { userId } = req.body

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const activity = mockData.activities.find((a) => a.id === id)
    if (!activity) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      })
      return
    }

    const existingRegistration = mockData.activityRegistrations.find(
      (r) => r.activityId === id && r.userId === userId && r.status !== 'cancelled',
    )
    if (existingRegistration) {
      res.status(400).json({
        success: false,
        error: '您已经报名过该活动',
      })
      return
    }

    const currentRegistered = mockData.activityRegistrations.filter(
      (r) => r.activityId === id && r.status !== 'cancelled',
    ).length
    if (currentRegistered >= activity.capacity) {
      res.status(400).json({
        success: false,
        error: '活动报名已满',
      })
      return
    }

    const now = new Date()
    if (new Date(activity.startTime) < now) {
      res.status(400).json({
        success: false,
        error: '活动已开始，无法报名',
      })
      return
    }

    const registration: ActivityRegistration = {
      id: generateUUID(),
      activityId: id,
      userId,
      registeredAt: now.toISOString(),
      status: 'registered',
    }

    mockData.activityRegistrations.push(registration)

    const activityIndex = mockData.activities.findIndex((a) => a.id === id)
    if (activityIndex !== -1) {
      mockData.activities[activityIndex].registered = currentRegistered + 1
    }

    res.status(200).json({
      success: true,
      data: registration,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '活动报名失败，请稍后重试',
    })
  }
})

router.post('/:id/feedback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { userId, rating, content, comment, contentPracticality, wouldRecommend }: {
      userId: string
      rating: number
      content?: string
      comment?: string
      contentPracticality?: number
      wouldRecommend?: boolean
    } = req.body

    const feedbackContent = content ?? comment

    if (!userId || !rating || !feedbackContent) {
      res.status(400).json({
        success: false,
        error: '用户ID、评分和反馈内容不能为空',
      })
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: '评分必须在1-5之间',
      })
      return
    }

    if (contentPracticality !== undefined && (contentPracticality < 1 || contentPracticality > 5)) {
      res.status(400).json({
        success: false,
        error: '内容实用性评分必须在1-5之间',
      })
      return
    }

    const activity = mockData.activities.find((a) => a.id === id)
    if (!activity) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      })
      return
    }

    const registration = mockData.activityRegistrations.find(
      (r) => r.activityId === id && r.userId === userId && r.status !== 'cancelled',
    )
    if (!registration) {
      res.status(400).json({
        success: false,
        error: '您未报名该活动，无法提交反馈',
      })
      return
    }

    const existingFeedback = mockData.activityFeedbacks.find(
      (f) => f.activityId === id && f.userId === userId,
    )
    if (existingFeedback) {
      res.status(400).json({
        success: false,
        error: '您已经提交过该活动的反馈',
      })
      return
    }

    const feedback: ActivityFeedback & { id: string } = {
      id: generateUUID(),
      activityId: id,
      userId,
      rating: Math.max(1, Math.min(5, rating)),
      content: feedbackContent,
      contentPracticality: contentPracticality !== undefined ? Math.max(1, Math.min(5, contentPracticality)) : undefined,
      submittedAt: new Date().toISOString(),
      wouldRecommend: wouldRecommend ?? true,
    }

    mockData.activityFeedbacks.push(feedback)

    res.status(200).json({
      success: true,
      data: {
        message: '反馈提交成功，感谢您的宝贵意见',
        feedback: {
          id: feedback.id,
          activityId: feedback.activityId,
          rating: feedback.rating,
          contentPracticality: feedback.contentPracticality,
          submittedAt: feedback.submittedAt,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '提交反馈失败，请稍后重试',
    })
  }
})

router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { userId } = req.body

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const activity = mockData.activities.find((a) => a.id === id)
    if (!activity) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      })
      return
    }

    const registrationIndex = mockData.activityRegistrations.findIndex(
      (r) => r.activityId === id && r.userId === userId && r.status === 'registered',
    )

    if (registrationIndex === -1) {
      res.status(404).json({
        success: false,
        error: '未找到报名记录',
      })
      return
    }

    const now = new Date()
    if (new Date(activity.startTime) < now) {
      res.status(400).json({
        success: false,
        error: '活动已开始，无法取消报名',
      })
      return
    }

    mockData.activityRegistrations[registrationIndex].status = 'cancelled'

    const activityIndex = mockData.activities.findIndex((a) => a.id === id)
    if (activityIndex !== -1 && mockData.activities[activityIndex].registered > 0) {
      mockData.activities[activityIndex].registered -= 1
    }

    res.status(200).json({
      success: true,
      data: {
        message: '取消报名成功',
        registration: mockData.activityRegistrations[registrationIndex],
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '取消报名失败，请稍后重试',
    })
  }
})

export default router
