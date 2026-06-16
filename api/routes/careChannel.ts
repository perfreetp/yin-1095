import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type {
  CareChannelApply,
  ContactPreference,
  PreferredTime,
  CareApplyStatus,
} from '../../shared/types/index.js'

const router = Router()

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateAnonymousCode(): string {
  let maxNum = 0
  mockData.careChannelApplies.forEach((apply) => {
    const match = apply.anonymousCode.match(/ANO-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  return `ANO-${String(nextNum).padStart(3, '0')}`
}

function generateSymptomTags(programTitle: string): string[] {
  const tags: string[] = []
  if (programTitle.includes('夜醒') || programTitle.includes('睡眠')) {
    tags.push('高频夜醒', '入睡困难', '白天嗜睡')
  } else if (programTitle.includes('疲劳')) {
    tags.push('明显疲劳', '精力不足', '注意力不集中')
  } else if (programTitle.includes('焦虑') || programTitle.includes('心理')) {
    tags.push('情绪焦虑', '职场压力', '人际关系紧张')
  } else if (programTitle.includes('综合')) {
    tags.push('多重症状', '睡眠障碍', '情绪波动')
  }
  return tags.slice(0, 3)
}

function formatContactPreference(pref: ContactPreference): string {
  const map: Record<ContactPreference, string> = {
    phone: '电话',
    message: '企业微信',
    email: '邮件',
    none: '未设置',
  }
  return map[pref] || '未设置'
}

function formatPreferredTime(times: PreferredTime[]): string[] {
  const map: Record<PreferredTime, string> = {
    weekday_morning: '工作日上午',
    weekday_afternoon: '工作日下午',
    weekday_evening: '工作日傍晚',
    weekend: '周末',
  }
  return times.map((t) => map[t] || t)
}

function generateAdminTimeline(apply: CareChannelApply) {
  const timeline: { time: string; status: string; note: string }[] = []
  timeline.push({
    time: apply.appliedAt,
    status: '已提交',
    note: '用户提交关怀申请，等待处理',
  })

  if (apply.status === 'processing' || apply.status === 'completed') {
    const processDate = new Date(apply.appliedAt)
    processDate.setHours(processDate.getHours() + 24)
    timeline.push({
      time: processDate.toISOString(),
      status: '处理中',
      note: apply.processingNotes || '健康服务专员已受理，正在匹配关怀方案',
    })
  }

  if (apply.status === 'completed') {
    const completeDate = new Date(apply.appliedAt)
    completeDate.setDate(completeDate.getDate() + 7)
    timeline.push({
      time: completeDate.toISOString(),
      status: '已完成',
      note: '关怀服务已完成，持续效果追踪中',
    })
  }

  return timeline
}

function sanitizeAdminApply(apply: CareChannelApply) {
  const program = mockData.carePrograms.find((p) => p.id === apply.programId)
  return {
    id: apply.id,
    anonymousCode: apply.anonymousCode,
    programTitle: program?.title || '未知项目',
    status: apply.status,
    appliedAt: apply.appliedAt,
    updatedAt: apply.updatedAt,
    contactPreference: formatContactPreference(apply.contactPreference),
    preferredTime: formatPreferredTime(apply.preferredTime),
    additionalNotes: apply.additionalNotes,
    processingNotes: apply.processingNotes,
    symptomTags: apply.symptomTags || [],
    timeline: generateAdminTimeline(apply),
  }
}

router.get('/programs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query

    const programs = mockData.carePrograms.map((program) => {
      let applied = false
      let applyStatus: string | null = null

      if (userId) {
        const existingApply = mockData.careChannelApplies.find(
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
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取关怀项目列表失败，请稍后重试',
    })
  }
})

router.get('/my-applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const userApplies = mockData.careChannelApplies.filter((a) => a.userId === userId)

    const result = userApplies.map((apply) => {
      const program = mockData.carePrograms.find((p) => p.id === apply.programId)
      return {
        id: apply.id,
        programId: apply.programId,
        programTitle: program?.title || '未知项目',
        appliedAt: apply.appliedAt,
        status: apply.status,
        anonymousCode: apply.anonymousCode,
        preferredTime: apply.preferredTime,
        contactPreference: apply.contactPreference,
        additionalNotes: apply.additionalNotes,
        updatedAt: apply.updatedAt,
        timeline: generateAdminTimeline(apply),
      }
    })

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取我的申请记录失败，请稍后重试',
    })
  }
})

router.post('/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      programId,
      userId,
      reason,
      contactPreference,
      preferredTime,
      additionalNotes,
    }: {
      programId: string
      userId: string
      reason?: string
      contactPreference: ContactPreference
      preferredTime: PreferredTime[]
      additionalNotes: string
    } = req.body

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

    const existingApply = mockData.careChannelApplies.find(
      (a) => a.programId === programId && a.userId === userId,
    )
    if (existingApply) {
      res.status(400).json({
        success: false,
        error: '您已经报名过该项目，请勿重复报名',
      })
      return
    }

    const now = new Date().toISOString()
    const applyRecord: CareChannelApply = {
      id: generateUUID(),
      programId,
      userId,
      appliedAt: now,
      status: 'pending',
      reason,
      contactPreference: contactPreference || 'none',
      preferredTime: preferredTime || [],
      additionalNotes: additionalNotes || '',
      anonymousCode: generateAnonymousCode(),
      processingNotes: '',
      updatedAt: now,
      symptomTags: generateSymptomTags(program.title),
    }

    mockData.careChannelApplies.push(applyRecord)

    res.status(200).json({
      success: true,
      data: {
        message: '报名成功，项目管理员将尽快与您联系',
        apply: {
          id: applyRecord.id,
          programId: applyRecord.programId,
          programTitle: program.title,
          appliedAt: applyRecord.appliedAt,
          status: applyRecord.status,
          anonymousCode: applyRecord.anonymousCode,
          contactPreference: applyRecord.contactPreference,
          preferredTime: applyRecord.preferredTime,
          additionalNotes: applyRecord.additionalNotes,
          updatedAt: applyRecord.updatedAt,
          timeline: generateAdminTimeline(applyRecord),
        },
      },
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '报名失败，请稍后重试',
    })
  }
})

router.get('/admin/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, status } = req.query

    let filteredApplies = [...mockData.careChannelApplies]

    if (programId && programId !== 'all') {
      filteredApplies = filteredApplies.filter((a) => a.programId === programId)
    }
    if (status && status !== 'all') {
      filteredApplies = filteredApplies.filter((a) => a.status === status)
    }

    const result = filteredApplies.map((apply) => sanitizeAdminApply(apply))

    const pendingCount = mockData.careChannelApplies.filter((a) => a.status === 'pending').length
    const processingCount = mockData.careChannelApplies.filter((a) => a.status === 'processing').length
    const completedCount = mockData.careChannelApplies.filter((a) => a.status === 'completed').length

    let avgResponseTime = 0
    const completedWithProcessing = mockData.careChannelApplies.filter(
      (a) => a.status !== 'pending',
    )
    if (completedWithProcessing.length > 0) {
      const totalTime = completedWithProcessing.reduce((sum, apply) => {
        const applyTime = new Date(apply.appliedAt).getTime()
        const updateTime = new Date(apply.updatedAt).getTime()
        return sum + (updateTime - applyTime)
      }, 0)
      avgResponseTime = Math.round(totalTime / completedWithProcessing.length / (1000 * 60 * 60))
    }

    res.status(200).json({
      success: true,
      data: {
        list: result,
        stats: {
          pending: pendingCount,
          processing: processingCount,
          completed: completedCount,
          avgResponseTime,
        },
      },
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取关怀队列失败，请稍后重试',
    })
  }
})

router.get('/admin/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const apply = mockData.careChannelApplies.find((a) => a.id === id)
    if (!apply) {
      res.status(404).json({
        success: false,
        error: '申请记录不存在',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: sanitizeAdminApply(apply),
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取申请详情失败，请稍后重试',
    })
  }
})

router.put('/admin/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      status,
      processingNotes,
    }: { status: CareApplyStatus; processingNotes?: string } = req.body

    const apply = mockData.careChannelApplies.find((a) => a.id === id)
    if (!apply) {
      res.status(404).json({
        success: false,
        error: '申请记录不存在',
      })
      return
    }

    apply.status = status
    apply.updatedAt = new Date().toISOString()
    if (processingNotes !== undefined) {
      apply.processingNotes = processingNotes
    }

    const sanitizedData = sanitizeAdminApply(apply)

    res.status(200).json({
      success: true,
      data: sanitizedData,
    })
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '状态更新失败，请稍后重试',
    })
  }
})

export default router
