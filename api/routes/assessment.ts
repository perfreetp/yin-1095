import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'
import type {
  SleepAssessment,
  MenopauseAssessment,
  SleepAnswer,
  SymptomScore,
  TopSymptom,
  CareProgramRecommendation,
  SleepIssue,
} from '../../shared/types/index.js'

const router = Router()

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const symptomWeights: Record<string, number> = {
  '失眠': 1.5,
  '潮热出汗': 1.5,
  '心悸': 1.3,
  '易激动': 1.3,
  '抑郁疑心': 1.4,
  '疲乏': 1.3,
  '头痛': 1.2,
  '眩晕': 1.1,
  '骨关节痛': 1.1,
  '感觉异常': 1.0,
}

const symptomSpecificAdvice: Record<string, string[]> = {
  '潮热出汗': [
    '建议穿着透气轻薄的棉质衣物，便于散热',
    '避免辛辣食物、酒精和咖啡因，这些可能诱发潮热',
    '保持室温凉爽，可使用空调或风扇调节',
    '随身携带小风扇和湿巾，潮热发作时使用',
  ],
  '失眠': [
    '建议进行睡眠卫生评估，找出影响睡眠的具体因素',
    '建立睡前放松仪式，如温水泡脚、轻柔拉伸',
    '下午2点后避免摄入咖啡因（咖啡、茶、可乐等）',
    '睡前1小时停止使用电子设备，可改为阅读纸质书',
  ],
  '心悸': [
    '注意观察心悸发作的诱因，如情绪、饮食、活动等',
    '避免过度劳累和情绪激动，保持心情平稳',
    '减少咖啡因和酒精摄入，戒烟',
    '如心悸频繁发作，建议进行心电图检查',
  ],
  '易激动': [
    '建议学习压力管理技巧，如深呼吸、正念冥想',
    '遇到情绪激动时，尝试暂停6秒再做出反应',
    '保持规律运动，如瑜伽、太极有助于情绪稳定',
    '与家人朋友坦诚沟通，获得理解和支持',
  ],
  '抑郁疑心': [
    '建议进行专业的情绪状态评估',
    '尝试正念冥想练习，每天10-15分钟',
    '保持社交活动，避免独自承受负面情绪',
    '如情绪持续低落超过2周，请寻求心理咨询',
  ],
  '疲乏': [
    '建议进行能量管理，合理安排工作和休息',
    '适度进行有氧运动，如快走、游泳，反而能提升精力',
    '检查是否存在缺铁或维生素D缺乏，必要时补充',
    '避免长时间连续工作，每小时起身活动5分钟',
  ],
  '头痛': [
    '注意记录头痛发作的诱因（饮食、睡眠、压力等）',
    '保持规律作息，避免睡眠过多或过少',
    '避免长时间低头看电子设备，注意颈椎放松',
    '如头痛频繁发作，建议神经内科就诊',
  ],
  '眩晕': [
    '起床或起身时动作要缓慢，避免体位性低血压',
    '避免突然转头或快速改变体位',
    '保证充足睡眠，避免过度疲劳',
    '如眩晕频繁发作，建议进行前庭功能检查',
  ],
  '骨关节痛': [
    '建议进行骨密度检测，评估骨质疏松风险',
    '补充钙和维生素D，多晒太阳',
    '选择低冲击性运动，如游泳、骑自行车',
    '注意关节保暖，避免受凉',
  ],
  '感觉异常': [
    '注意观察感觉异常的部位、频率和持续时间',
    '避免长时间保持同一姿势，定时活动',
    '检查是否存在维生素B12缺乏',
    '如症状持续或加重，建议神经内科就诊',
  ],
}

const generalAdvice: Record<string, string[]> = {
  mild: [
    '保持规律运动，每周3-5次，每次30分钟有氧运动',
    '饮食均衡，多摄入豆制品、深海鱼、坚果等',
    '保持良好心态，接受身体的自然变化',
    '补充钙和维生素D，预防骨质疏松',
    '每天抽出15分钟做自己喜欢的事情放松心情',
  ],
  moderate: [
    '建议定期进行妇科检查，关注激素水平变化',
    '可尝试中医调理，根据体质辨证施治',
    '学习压力管理技巧，如冥想、深呼吸练习',
    '保持社交活动，避免孤独感',
    '与伴侣坦诚沟通，获得理解和支持',
  ],
}

const severeMedicalAdvice: string[] = [
  '强烈建议到妇科或内分泌科就诊，进行全面激素水平检查',
  '建议进行骨密度检测，评估骨质疏松风险',
  '如有严重抑郁或焦虑情绪，请尽快寻求精神心理科专业帮助',
  '可考虑在医生指导下进行激素替代治疗（HRT）评估',
]

const sleepQuestionLabels: Record<string, string> = {
  q1: '就寝时间',
  q2: '入睡时长',
  q3: '起床时间',
  q4: '总睡眠时长',
  q5: '夜醒频率',
  q6: '复睡难度',
  q7: '主观质量',
  q8: '日间影响',
}

const sleepIssueDescriptions: Record<string, Record<number, string>> = {
  q1: {
    1: '就寝时间规律，作息习惯良好',
    2: '就寝时间偶尔不规律，需要注意调整',
    3: '就寝时间非常不规律，严重影响生物钟',
  },
  q2: {
    1: '入睡时间正常，睡眠启动良好',
    2: '入睡时间较长，可能存在入睡困难',
    3: '入睡时间很长，存在明显的入睡困难',
  },
  q3: {
    1: '起床时间规律，生物钟稳定',
    2: '起床时间偶尔不规律，需要注意',
    3: '起床时间非常不规律，生物钟紊乱',
  },
  q4: {
    1: '总睡眠时长充足，精力恢复良好',
    2: '总睡眠时长略少，可能影响日间精力',
    3: '总睡眠时长严重不足，需要重视',
  },
  q5: {
    1: '夜间觉醒少，睡眠连续性好',
    2: '夜间偶有觉醒，睡眠质量受一定影响',
    3: '夜间觉醒频繁，睡眠连续性差',
  },
  q6: {
    1: '醒后容易再次入睡，睡眠恢复能力好',
    2: '醒后复睡有一定难度，需要调整',
    3: '醒后难以再次入睡，存在明显的睡眠维持问题',
  },
  q7: {
    1: '主观睡眠质量好，醒后感觉精力充沛',
    2: '主观睡眠质量一般，醒后仍有疲劳感',
    3: '主观睡眠质量差，醒后仍感觉疲惫不堪',
  },
  q8: {
    1: '睡眠对日间功能影响小，白天精力充沛',
    2: '睡眠对日间功能有一定影响，偶尔感到困倦',
    3: '睡眠严重影响日间功能，白天频繁感到困倦',
  },
}

const sleepSpecificAdvice: Record<string, string[]> = {
  q1: [
    '建议每天固定时间上床，即使周末也保持一致',
    '睡前2小时避免剧烈运动和刺激性活动',
    '建立睡前放松仪式，帮助身体进入睡眠状态',
  ],
  q2: [
    '如躺下20分钟仍未睡着，建议起床做些轻松的活动',
    '睡前避免使用电子设备，蓝光会抑制褪黑素分泌',
    '可尝试渐进式肌肉放松或深呼吸练习',
  ],
  q3: [
    '建议每天固定时间起床，包括周末',
    '起床后可接触自然光，帮助调节生物钟',
    '避免白天补觉太久，影响夜间睡眠',
  ],
  q4: [
    '建议评估睡眠需求，成年人通常需要7-9小时睡眠',
    '检查是否存在影响睡眠时间的因素（工作、娱乐等）',
    '如长期睡眠不足，建议调整作息安排',
  ],
  q5: [
    '检查卧室环境（温度、噪音、光线等）是否适宜',
    '睡前避免大量饮水，减少夜间起夜',
    '如夜醒频繁，建议排查是否存在睡眠呼吸问题',
  ],
  q6: [
    '夜醒后避免看时间，减少焦虑',
    '保持卧室昏暗，避免明亮光线',
    '可尝试身体扫描冥想，帮助重新入睡',
  ],
  q7: [
    '建议记录睡眠日记，找出影响睡眠质量的因素',
    '检查是否存在潜在的健康问题影响睡眠',
    '如自我调节无效，建议咨询睡眠专科医生',
  ],
  q8: [
    '白天可适当进行户外活动，帮助提升精力',
    '避免下午3点后摄入咖啡因',
    '如日间困倦影响工作生活，建议就医评估',
  ],
}

const sleepGeneralAdvice: Record<string, string[]> = {
  mild: [
    '继续保持规律的作息习惯',
    '睡前1小时避免使用电子设备',
    '保持卧室温度适宜（18-22℃）',
    '适度进行日间运动，有助于提升睡眠质量',
  ],
  moderate: [
    '建议进行睡眠卫生评估，找出影响因素',
    '适度增加日间运动，避免睡前剧烈运动',
    '减少咖啡因摄入，下午2点后不喝咖啡/茶',
    '尝试渐进式肌肉放松或深呼吸练习',
    '如持续超过2周，建议咨询专业医生',
  ],
  severe: [
    '强烈建议尽快就医，进行专业睡眠监测（PSG）',
    '可尝试认知行为疗法（CBT-I），这是治疗慢性失眠的首选',
    '避免自行服用安眠药物，需在医生指导下使用',
    '建立睡前放松仪式，减少睡眠焦虑',
    '记录睡眠日记，帮助医生诊断',
    '建议暂时调整工作强度，保证休息时间',
  ],
}

function calculateSleepSeverity(score: number): 'mild' | 'moderate' | 'severe' {
  if (score <= 11) return 'mild'
  if (score <= 18) return 'moderate'
  return 'severe'
}

function extractTopSleepIssues(answers: SleepAnswer[]): SleepIssue[] {
  return answers
    .filter(a => a.value >= 2)
    .map(a => ({
      questionId: a.questionId,
      label: sleepQuestionLabels[a.questionId] || a.questionId,
      score: a.value,
      description: sleepIssueDescriptions[a.questionId]?.[a.value] || '需要关注',
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function generateSleepSuggestions(
  severity: 'mild' | 'moderate' | 'severe',
  answers: SleepAnswer[],
): string[] {
  const suggestions: string[] = [...sleepGeneralAdvice[severity]]

  const highScoreAnswers = answers
    .filter(a => a.value >= 2)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  for (const answer of highScoreAnswers) {
    const specificAdvice = sleepSpecificAdvice[answer.questionId]
    if (specificAdvice && suggestions.length < 8) {
      suggestions.push(specificAdvice[0])
    }
  }

  return suggestions.slice(0, 8)
}

function recommendSleepPrograms(answers: SleepAnswer[]): CareProgramRecommendation[] {
  const programs: CareProgramRecommendation[] = []
  const highScoreMap = new Map<string, number>()

  for (const a of answers) {
    highScoreMap.set(a.questionId, a.value)
  }

  if ((highScoreMap.get('q5') || 0) >= 2 || (highScoreMap.get('q6') || 0) >= 2) {
    programs.push({
      id: 'program-night-wake',
      title: '🌙 夜醒人群专项关怀',
      reason: '因为您的夜间觉醒和复睡困难症状明显，我们推荐...',
    })
  }

  if ((highScoreMap.get('q4') || 0) >= 2 || (highScoreMap.get('q8') || 0) >= 2) {
    programs.push({
      id: 'program-fatigue',
      title: '🔋 疲劳恢复支持计划',
      reason: '因为您的睡眠不足和日间疲劳症状明显，我们推荐...',
    })
  }

  const highScoreCount = Array.from(highScoreMap.values()).filter(v => v >= 2).length
  if (highScoreCount >= 3) {
    const existingIds = programs.map(p => p.id)
    if (!existingIds.includes('program-comprehensive')) {
      programs.push({
        id: 'program-comprehensive',
        title: '🌸 综合健康管理套餐',
        reason: '因为您有多个方面的睡眠困扰，我们推荐...',
      })
    }
  }

  if ((highScoreMap.get('q7') || 0) >= 2 || (highScoreMap.get('q2') || 0) >= 2) {
    const existingIds = programs.map(p => p.id)
    if (!existingIds.includes('program-anxiety') && programs.length < 2) {
      programs.push({
        id: 'program-anxiety',
        title: '💭 焦虑情绪心理咨询',
        reason: '因为您的入睡困难和睡眠质量差可能与情绪相关，我们推荐...',
      })
    }
  }

  return programs.slice(0, 2)
}

function calculateWeightedScore(symptoms: SymptomScore[]): number {
  return symptoms.reduce((sum, s) => {
    const weight = symptomWeights[s.name] || 1.0
    return sum + s.score * weight
  }, 0)
}

function calculateMenopauseSeverity(
  symptoms: SymptomScore[],
): { severity: 'mild' | 'moderate' | 'severe'; weightedScore: number } {
  const weightedScore = calculateWeightedScore(symptoms)
  const severeSymptomCount = symptoms.filter(s => s.score >= 3).length
  const highScoreSymptomMap = new Map(symptoms.map(s => [s.name, s.score]))

  const insomniaScore = highScoreSymptomMap.get('失眠') || 0
  const hotFlashScore = highScoreSymptomMap.get('潮热出汗') || 0
  const depressionScore = highScoreSymptomMap.get('抑郁疑心') || 0

  const criticalTriad =
    insomniaScore >= 2 && hotFlashScore >= 2 && depressionScore >= 2

  if (weightedScore > 45 || severeSymptomCount >= 3 || criticalTriad) {
    return { severity: 'severe', weightedScore }
  }

  if (weightedScore >= 26 || severeSymptomCount >= 1) {
    return { severity: 'moderate', weightedScore }
  }

  return { severity: 'mild', weightedScore }
}

function extractTopSymptoms(symptoms: SymptomScore[]): TopSymptom[] {
  return symptoms
    .map(s => ({
      symptomId: s.symptomId,
      name: s.name,
      score: s.score,
      weight: symptomWeights[s.name] || 1.0,
    }))
    .sort((a, b) => {
      const aWeighted = a.score * a.weight
      const bWeighted = b.score * b.weight
      if (bWeighted !== aWeighted) return bWeighted - aWeighted
      return b.score - a.score
    })
    .slice(0, 3)
}

function generateMenopauseSuggestions(
  severity: 'mild' | 'moderate' | 'severe',
  symptoms: SymptomScore[],
): string[] {
  const suggestions: string[] = []

  suggestions.push(...generalAdvice[severity === 'severe' ? 'moderate' : severity])

  const highScoreSymptoms = symptoms
    .filter(s => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  for (const symptom of highScoreSymptoms) {
    const advice = symptomSpecificAdvice[symptom.name]
    if (advice) {
      suggestions.push(advice[0])
      if (suggestions.length >= 6) break
    }
  }

  if (severity === 'severe') {
    suggestions.push(...severeMedicalAdvice)
  }

  return suggestions.slice(0, 10)
}

function recommendCarePrograms(symptoms: SymptomScore[]): CareProgramRecommendation[] {
  const programs: CareProgramRecommendation[] = []
  const highScoreMap = new Map(symptoms.map(s => [s.name, s.score]))

  if ((highScoreMap.get('失眠') || 0) >= 2) {
    programs.push({
      id: 'program-night-wake',
      title: '🌙 夜醒人群专项关怀',
      reason: '因为您的失眠症状明显，我们推荐...',
    })
  }

  if ((highScoreMap.get('疲乏') || 0) >= 2) {
    const existingIds = programs.map(p => p.id)
    if (!existingIds.includes('program-fatigue')) {
      programs.push({
        id: 'program-fatigue',
        title: '🔋 疲劳恢复支持计划',
        reason: '因为您的疲乏症状明显，我们推荐...',
      })
    }
  }

  const emotionScore = Math.max(
    highScoreMap.get('抑郁疑心') || 0,
    highScoreMap.get('易激动') || 0,
  )
  if (emotionScore >= 2) {
    const existingIds = programs.map(p => p.id)
    if (!existingIds.includes('program-anxiety')) {
      programs.push({
        id: 'program-anxiety',
        title: '💭 焦虑情绪心理咨询',
        reason: '因为您的情绪波动症状明显，我们推荐...',
      })
    }
  }

  const highScoreCount = Array.from(highScoreMap.values()).filter(v => v >= 2).length
  if (highScoreCount >= 3) {
    const existingIds = programs.map(p => p.id)
    if (!existingIds.includes('program-comprehensive')) {
      programs.push({
        id: 'program-comprehensive',
        title: '🌸 综合健康管理套餐',
        reason: '因为您有多个症状困扰，我们推荐...',
      })
    }
  }

  return programs.slice(0, 2)
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
    const topIssues = extractTopSleepIssues(answers)
    const suggestions = generateSleepSuggestions(severity, answers)
    const recommendedPrograms = recommendSleepPrograms(answers)

    const assessment: SleepAssessment = {
      id: generateUUID(),
      anonymousId: generateUUID(),
      department,
      submittedAt: new Date().toISOString(),
      answers,
      totalScore,
      severity,
      suggestions,
      topIssues,
      recommendedPrograms,
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
      const { severity, weightedScore } = calculateMenopauseSeverity(symptoms)
      const topSymptoms = extractTopSymptoms(symptoms)
      const suggestions = generateMenopauseSuggestions(severity, symptoms)
      const recommendedPrograms = recommendCarePrograms(symptoms)

      const assessment: MenopauseAssessment = {
        id: generateUUID(),
        anonymousId: generateUUID(),
        department,
        submittedAt: new Date().toISOString(),
        symptoms,
        totalScore,
        weightedScore,
        severity,
        suggestions,
        topSymptoms,
        recommendedPrograms,
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
    const { userId } = req.query

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '用户ID不能为空',
      })
      return
    }

    const userIdStr = String(userId)

    const sleepList = mockData.sleepAssessments.filter(
      (a) => (a as SleepAssessment & { userId?: string }).userId === userIdStr,
    )

    const menopauseList = mockData.menopauseAssessments.filter(
      (a) =>
        (a as MenopauseAssessment & { userId?: string }).userId === userIdStr,
    )

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
    const { userId } = req.query

    const sleepResult = mockData.sleepAssessments.find((a) => a.id === id)
    if (sleepResult) {
      if (userId) {
        const reportUserId = (sleepResult as SleepAssessment & { userId?: string }).userId
        if (reportUserId !== String(userId)) {
          res.status(403).json({
            success: false,
            error: '无权访问该报告',
          })
          return
        }
      }
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
      if (userId) {
        const reportUserId = (menopauseResult as MenopauseAssessment & { userId?: string }).userId
        if (reportUserId !== String(userId)) {
          res.status(403).json({
            success: false,
            error: '无权访问该报告',
          })
          return
        }
      }
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
