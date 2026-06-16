import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'

const router = Router()

router.get('/exercises', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, duration } = req.query

    let filtered = [...mockData.exercises]

    if (category) {
      filtered = filtered.filter((e) => e.category === category)
    }

    if (duration === 'short') {
      filtered = filtered.filter((e) => e.duration <= 5)
    } else if (duration === 'medium') {
      filtered = filtered.filter((e) => e.duration > 5 && e.duration <= 10)
    } else if (duration === 'long') {
      filtered = filtered.filter((e) => e.duration > 10)
    }

    filtered.sort((a, b) => a.duration - b.duration)

    res.status(200).json({
      success: true,
      data: filtered,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取放松练习列表失败，请稍后重试',
    })
  }
})

router.get('/tips', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query

    let filtered = [...mockData.sleepTips]

    if (category) {
      filtered = filtered.filter((t) => t.category === category)
    }

    const groupedByCategory = filtered.reduce(
      (acc, tip) => {
        if (!acc[tip.category]) {
          acc[tip.category] = []
        }
        acc[tip.category].push(tip)
        return acc
      },
      {} as Record<string, typeof filtered>,
    )

    res.status(200).json({
      success: true,
      data: {
        list: filtered,
        groupedByCategory,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取睡眠卫生贴士失败，请稍后重试',
    })
  }
})

export default router
