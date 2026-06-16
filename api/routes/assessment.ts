import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type {
  SleepAssessment,
  MenopauseAssessment,
  SleepAnswer,
  SymptomScore,
} from '../../shared/types/index.js'

const router = Router()

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const sleepSuggestions: Record<string, string[]> = {
  mild: [
    '建议保持规律作息，每天同一时间上床和起床',
    '睡前1小时避免使用电子设备',
    '可以尝试睡前泡脚或温水浴',
    '保持卧室温度适宜（18-22℃）',
  ],
  moderate: [
    '建议进行睡眠卫生评估，找出影响因素',
    '适度增加日间运动，避免睡前剧烈运动',
    '减少咖啡因摄入，下午2点后不喝咖啡/茶',
    '尝试渐进式肌肉放松或深呼吸练习',
    '如持续超过2周，建议咨询专业医生',
  ],
  severe: [
    '强烈建议尽快就医，进行专业睡眠监测',
    '可尝试认知行为疗法（CBT-I）',
    '避免自行服用安眠药物',
    '建立睡前放松仪式，减少焦虑',
    '记录睡眠日记，帮助医生诊断',
    '建议暂时调整工作强度，保证休息时间',
  ],
}

const menopauseSuggestions: Record<string, string[]> = {
  mild: [
    '保持规律运动，每周3-5次有氧运动',
    '饮食均衡，多摄入豆制品、深海鱼',
    '穿着透气吸汗的衣物',
    '保持良好心态，接受身体变化',
    '补充钙和维生素D，预防骨质疏松',
  ],
  moderate: [
    '建议定期进行妇科检查',
    '可尝试中医调理，辨证施治',
    '学习压力管理技巧，如冥想、瑜伽',
    '保持社交活动，避免孤独感',
    '与伴侣坦诚沟通，获得理解支持',
    '如症状明显，可咨询医生是否需要激素治疗',
  ],
  severe: [
    '强烈建议到妇科或内分泌科就诊',
    '在医生指导下考虑激素替代治疗（HRT）',
    '进行骨密度检查，预防骨质疏松',
    '寻求心理咨询，应对情绪问题',
    '加入支持小组，与同龄人交流经验',
    '调整工作节奏，避免过度劳累',
  ],
}

function calculateSleepSeverity(score: number): 'mild' | 'moderate' | 'severe' {
  if (score <= 11) return 'mild'
  if (score <= 18) return 'moderate'
  return 'severe'
}

function calculateMenopauseSeverity(
  score: number,
): 'mild' | 'moderate' | 'severe' {
  if (score <= 20) return 'mild'
  if (score <= 35) return 'moderate'
  return 'severe'
}

router.post('/sleep', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      answers,
      department,
      userId,
    }: {
      answers: SleepAnswer[]
      department: string
      userId?: string
    } = req.body

    if (!answers || !department) {
      res.status(400).json({
        success: false,
        error: '答卷内容和部门不能为空',
      })
      return
    }

    const totalScore = answers.reduce((sum, a) => sum + (a.value || 0), 0)
    const severity = calculateSleepSeverity(totalScore)

    const assessment: SleepAssessment = {
      id: generateUUID(),
      anonymousId: generateUUID(),
      department,
      submittedAt: new Date().toISOString(),
      answers,
      totalScore,
      severity,
      suggestions: sleepSuggestions[severity],
      ...(userId ? { userId } : {}),
    }

    mockData.sleepAssessments.push(assessment)

    res.status(200).json({
      success: true,
      data: assessment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '提交睡眠自测失败，请稍后重试',
    })
  }
})

router.post(
  '/menopause',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        symptoms,
        department,
        userId,
      }: {
        symptoms: SymptomScore[]
        department: string
        userId?: string
      } = req.body

      if (!symptoms || !department) {
        res.status(400).json({
          success: false,
          error: '症状评分和部门不能为空',
        })
        return
      }

      const totalScore = symptoms.reduce((sum, s) => sum + (s.score || 0), 0)
      const severity = calculateMenopauseSeverity(totalScore)

      const assessment: MenopauseAssessment = {
        id: generateUUID(),
        anonymousId: generateUUID(),
        department,
        submittedAt: new Date().toISOString(),
        symptoms,
        totalScore,
        severity,
        suggestions: menopauseSuggestions[severity],
        ...(userId ? { userId } : {}),
      } as MenopauseAssessment

      mockData.menopauseAssessments.push(assessment)

      res.status(200).json({
        success: true,
        data: assessment,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '提交围绝经期自测失败，请稍后重试',
      })
    }
  },
)

router.get('/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, department } = req.query

    const sleepList = mockData.sleepAssessments.filter((a) => {
      if (userId && (a as SleepAssessment & { userId?: string }).userId === userId)
        return true
      if (department && a.department === department) return true
      return false
    })

    const menopauseList = mockData.menopauseAssessments.filter((a) => {
      if (
        userId &&
        (a as MenopauseAssessment & { userId?: string }).userId === userId
      )
        return true
      if (department && a.department === department) return true
      return false
    })

    const allAssessments = [
      ...sleepList.map((a) => ({ ...a, type: 'sleep' as const })),
      ...menopauseList.map((a) => ({ ...a, type: 'menopause' as const })),
    ].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )

    res.status(200).json({
      success: true,
      data: allAssessments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取自测历史失败，请稍后重试',
    })
  }
})

router.get('/result/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const sleepResult = mockData.sleepAssessments.find((a) => a.id === id)
    if (sleepResult) {
      res.status(200).json({
        success: true,
        data: { ...sleepResult, type: 'sleep' },
      })
      return
    }

    const menopauseResult = mockData.menopauseAssessments.find(
      (a) => a.id === id,
    )
    if (menopauseResult) {
      res.status(200).json({
        success: true,
        data: { ...menopauseResult, type: 'menopause' },
      })
      return
    }

    res.status(404).json({
      success: false,
      error: '报告不存在',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取报告失败，请稍后重试',
    })
  }
})

export default router
