import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type { Feedback, FeedbackCategory } from '../../shared/types/index.js'

const router = Router()

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      ratings,
      content,
    }: {
      category: FeedbackCategory
      ratings: Record<string, number>
      content: string
    } = req.body

    if (!category || !content) {
      res.status(400).json({
        success: false,
        error: '反馈类型和内容不能为空',
      })
      return
    }

    const validCategories: FeedbackCategory[] = [
      'satisfaction',
      'suggestion',
      'experience',
    ]
    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        error: '无效的反馈类型',
      })
      return
    }

    const feedback: Feedback = {
      id: generateUUID(),
      anonymousId: generateUUID(),
      category,
      ratings: ratings || {},
      content,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }

    mockData.feedbacks.push(feedback)

    res.status(200).json({
      success: true,
      data: {
        message: '反馈提交成功，感谢您的宝贵意见',
        feedback: {
          id: feedback.id,
          category: feedback.category,
          submittedAt: feedback.submittedAt,
          status: feedback.status,
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

export default router
