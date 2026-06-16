import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'

const router = Router()

interface CareChannelApply {
  id: string
  programId: string
  userId: string
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
}

const careChannelApplies: CareChannelApply[] = []

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

router.get('/programs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query

    const programs = mockData.carePrograms.map((program) => {
      let applied = false
      let applyStatus: string | null = null

      if (userId) {
        const existingApply = careChannelApplies.find(
          (a) => a.programId === program.id && a.userId === userId,
        )
        if (existingApply) {
          applied = true
          applyStatus = existingApply.status
        }
      }

      return {
        ...program,
        applied,
        applyStatus,
      }
    })

    res.status(200).json({
      success: true,
      data: programs,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取关怀项目列表失败，请稍后重试',
    })
  }
})

router.post('/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, userId, reason }: { programId: string; userId: string; reason?: string } =
      req.body

    if (!programId || !userId) {
      res.status(400).json({
        success: false,
        error: '项目ID和用户ID不能为空',
      })
      return
    }

    const program = mockData.carePrograms.find((p) => p.id === programId)
    if (!program) {
      res.status(404).json({
        success: false,
        error: '关怀项目不存在',
      })
      return
    }

    const existingApply = careChannelApplies.find(
      (a) => a.programId === programId && a.userId === userId,
    )
    if (existingApply) {
      res.status(400).json({
        success: false,
        error: '您已经报名过该项目，请勿重复报名',
      })
      return
    }

    const applyRecord: CareChannelApply = {
      id: generateUUID(),
      programId,
      userId,
      appliedAt: new Date().toISOString(),
      status: 'pending',
      reason,
    }

    careChannelApplies.push(applyRecord)

    res.status(200).json({
      success: true,
      data: {
        message: '报名成功，项目管理员将尽快与您联系',
        apply: applyRecord,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '报名失败，请稍后重试',
    })
  }
})

export default router
