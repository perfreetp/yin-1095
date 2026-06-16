import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type { ExerciseCompletion } from '../../shared/types/index.js'

const router = Router()

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getStreakDays(completions: ExerciseCompletion[]): number {
  if (completions.length === 0) return 0

  const completedDates = new Set(
    completions.map((c) => {
      const d = new Date(c.completedAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })
  )

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`

    if (completedDates.has(dateKey)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

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

router.post('/exercise-complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, exerciseId, duration, completedAt, feeling, notes } = req.body

    if (!userId || !exerciseId || !duration) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数',
      })
      return
    }

    const exercise = mockData.exercises.find((e) => e.id === exerciseId)
    if (!exercise) {
      res.status(404).json({
        success: false,
        error: '练习不存在',
      })
      return
    }

    const completion: ExerciseCompletion = {
      id: generateUUID(),
      userId,
      exerciseId,
      duration,
      completedAt: completedAt || new Date().toISOString(),
      feeling: feeling || 'better',
      notes,
    }

    mockData.exerciseCompletions.push(completion)

    const userCompletions = mockData.exerciseCompletions.filter((c) => c.userId === userId)
    const streakDays = getStreakDays(userCompletions)

    let newBadge: { type: string; name: string } | null = null
    if (streakDays === 3) {
      newBadge = { type: '3days', name: '3天坚持徽章' }
    } else if (streakDays === 7) {
      newBadge = { type: '7days', name: '7天坚持徽章' }
    } else if (streakDays === 30) {
      newBadge = { type: '30days', name: '30天坚持徽章' }
    }

    res.status(200).json({
      success: true,
      data: {
        completion,
        streakDays,
        newBadge,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '记录练习完成失败，请稍后重试',
    })
  }
})

router.get('/my-stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const userCompletions = mockData.exerciseCompletions.filter((c) => c.userId === userId)
    const now = new Date()
    const startOfThisWeek = getStartOfWeek(now)

    const weeklyCount = userCompletions.filter((c) => new Date(c.completedAt) >= startOfThisWeek).length

    const streakDays = getStreakDays(userCompletions)

    const totalDuration = userCompletions.reduce((sum, c) => sum + c.duration, 0)

    const exerciseTypeCount: Record<string, number> = {}
    for (const completion of userCompletions) {
      const exercise = mockData.exercises.find((e) => e.id === completion.exerciseId)
      if (exercise) {
        exerciseTypeCount[exercise.category] = (exerciseTypeCount[exercise.category] || 0) + 1
      }
    }

    let mostFrequentType = 'breathing'
    let maxCount = 0
    for (const [type, count] of Object.entries(exerciseTypeCount)) {
      if (count > maxCount) {
        maxCount = count
        mostFrequentType = type
      }
    }

    const weeklyTrend: Array<{ week: string; count: number }> = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(startOfThisWeek)
      weekStart.setDate(weekStart.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const count = userCompletions.filter((c) => {
        const d = new Date(c.completedAt)
        return d >= weekStart && d <= weekEnd
      }).length

      weeklyTrend.push({
        week: `第${4 - i}周`,
        count,
      })
    }

    const typeLabels: Record<string, string> = {
      breathing: '呼吸练习',
      meditation: '正念冥想',
      bodyscan: '身体扫描',
    }

    res.status(200).json({
      success: true,
      data: {
        weeklyExerciseCount: weeklyCount,
        streakDays,
        totalDuration,
        mostFrequentExerciseType: typeLabels[mostFrequentType] || mostFrequentType,
        weeklyTrend,
        weeklyTarget: 7,
        completionRate: Math.min(100, Math.round((weeklyCount / 7) * 100)),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取个人统计失败，请稍后重试',
    })
  }
})

export default router
