import type {
  User,
  SleepAssessment,
  MenopauseAssessment,
  Activity,
  ActivityRegistration,
  Resource,
  Exercise,
  CareProgram,
  Feedback,
  Department,
  SleepTip,
  SleepAnswer,
  SymptomScore,
} from '../../shared/types/index.js'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function formatDate(date: Date): string {
  return date.toISOString()
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const departments: string[] = [
  '技术部',
  '产品部',
  '市场部',
  '人力资源部',
  '财务部',
  '运营部',
  '销售部',
  '法务部',
  '客户服务部',
  '行政部',
]

const departmentEmployeeCounts: Record<string, number> = {
  技术部: 35,
  产品部: 25,
  市场部: 22,
  人力资源部: 15,
  财务部: 18,
  运营部: 20,
  销售部: 28,
  法务部: 12,
  客户服务部: 15,
  行政部: 10,
}

const chineseFirstNames = [
  '张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
]

const chineseLastNames = [
  '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋',
  '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平',
  '刚', '桂英', '华', '鑫', '波', '斌', '宇', '浩', '凯', '健',
  '俊', '帆', '鹏', '博', '婷', '雪', '倩', '琳', '欣', '悦',
  '梦', '思', '雨', '晨', '瑶', '诗', '琪', '乐', '佳', '文',
]

function generateName(): string {
  const first = pickRandom(chineseFirstNames)
  const last = pickRandom(chineseLastNames)
  return first + last
}

const departmentList: Department[] = departments.map((name) => ({
  name,
  employeeCount: departmentEmployeeCounts[name],
}))

const users: User[] = []
let userIdIndex = 0

for (const dept of departments) {
  const count = departmentEmployeeCounts[dept]
  for (let i = 0; i < count; i++) {
    const isAdmin = userIdIndex < 5
    users.push({
      id: generateUUID(),
      name: generateName(),
      department: dept,
      role: isAdmin ? 'admin' : 'employee',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userIdIndex}`,
    })
    userIdIndex++
  }
}

const sleepQuestionIds = [
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8',
]

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

function generateSleepAssessment(department: string, severity: 'mild' | 'moderate' | 'severe'): SleepAssessment {
  const baseDate = randomDate(new Date('2025-10-01'), new Date('2026-06-15'))
  const severityRange = {
    mild: [5, 11],
    moderate: [12, 18],
    severe: [19, 24],
  }
  const [min, max] = severityRange[severity]
  const totalScore = Math.floor(Math.random() * (max - min + 1)) + min

  const answers: SleepAnswer[] = sleepQuestionIds.map((qid) => ({
    questionId: qid,
    value: Math.floor(Math.random() * 4),
  }))

  return {
    id: generateUUID(),
    anonymousId: generateUUID(),
    department,
    submittedAt: formatDate(baseDate),
    answers,
    totalScore,
    severity,
    suggestions: sleepSuggestions[severity],
  }
}

const sleepAssessments: SleepAssessment[] = []
const severityDistribution: ('mild' | 'moderate' | 'severe')[] = []

for (let i = 0; i < 75; i++) severityDistribution.push('mild')
for (let i = 0; i < 45; i++) severityDistribution.push('moderate')
for (let i = 0; i < 30; i++) severityDistribution.push('severe')

const shuffledSeverity = shuffle(severityDistribution)

for (let i = 0; i < 150; i++) {
  const dept = departments[i % departments.length]
  sleepAssessments.push(generateSleepAssessment(dept, shuffledSeverity[i]))
}

const menopauseSymptoms = [
  { id: 's1', name: '潮热' },
  { id: 's2', name: '失眠' },
  { id: 's3', name: '情绪波动' },
  { id: 's4', name: '心悸' },
  { id: 's5', name: '头痛' },
  { id: 's6', name: '关节痛' },
  { id: 's7', name: '疲劳' },
  { id: 's8', name: '记忆力下降' },
  { id: 's9', name: '阴道干涩' },
  { id: 's10', name: '性欲变化' },
]

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

function generateMenopauseAssessment(department: string): MenopauseAssessment {
  const baseDate = randomDate(new Date('2025-10-01'), new Date('2026-06-15'))
  const severityRoll = Math.random()
  let severity: 'mild' | 'moderate' | 'severe'
  if (severityRoll < 0.5) severity = 'mild'
  else if (severityRoll < 0.8) severity = 'moderate'
  else severity = 'severe'

  const severityRange = {
    mild: [10, 20],
    moderate: [21, 35],
    severe: [36, 50],
  }
  const [min, max] = severityRange[severity]
  let totalScore = 0

  const symptoms: SymptomScore[] = menopauseSymptoms.map((symptom) => {
    let score: number
    if (severity === 'mild') score = Math.floor(Math.random() * 2) + 1
    else if (severity === 'moderate') score = Math.floor(Math.random() * 2) + 2
    else score = Math.floor(Math.random() * 2) + 4
    totalScore += score
    return { symptomId: symptom.id, name: symptom.name, score }
  })

  if (totalScore < min) totalScore = min
  if (totalScore > max) totalScore = max

  return {
    id: generateUUID(),
    anonymousId: generateUUID(),
    department,
    submittedAt: formatDate(baseDate),
    symptoms,
    totalScore,
    severity,
    suggestions: menopauseSuggestions[severity],
  }
}

const menopauseAssessments: MenopauseAssessment[] = []
for (let i = 0; i < 100; i++) {
  const dept = departments[i % departments.length]
  menopauseAssessments.push(generateMenopauseAssessment(dept))
}

const activityData: Array<{
  title: string
  type: 'lecture' | 'workshop' | 'consultation' | 'course'
  description: string
  location: string
  speaker: string
  capacity: number
  tags: string[]
  dateOffset: number
  durationHours: number
}> = [
  { title: '睡眠健康与职场效率讲座', type: 'lecture', description: '深度解析睡眠对工作表现的影响，分享科学睡眠方法与实用技巧，帮助员工改善睡眠质量，提升工作效率。', location: '公司大会议室A', speaker: '李明（协和医院睡眠科副主任医师）', capacity: 120, tags: ['睡眠', '健康', '职场'], dateOffset: -60, durationHours: 2 },
  { title: '围绝经期健康管理科普', type: 'lecture', description: '全面解读围绝经期生理变化，教授症状应对策略，帮助女性员工平稳度过这一特殊时期。', location: '多功能厅', speaker: '王芳（妇产科主任医师）', capacity: 80, tags: ['女性健康', '激素', '科普'], dateOffset: -45, durationHours: 2.5 },
  { title: '压力管理与心理健康', type: 'lecture', description: '识别压力信号，学习科学减压方法，建立健康的心理防线，提升职场幸福感。', location: '培训中心', speaker: '张伟（心理咨询师）', capacity: 100, tags: ['心理', '压力', '情绪'], dateOffset: -30, durationHours: 2 },
  { title: '营养与免疫力提升', type: 'lecture', description: '从营养学角度解读如何通过饮食提升免疫力，搭配运动建议，打造健康体魄。', location: '公司大会议室B', speaker: '刘静（注册营养师）', capacity: 80, tags: ['营养', '饮食', '健康'], dateOffset: -15, durationHours: 2 },
  { title: '常见妇科疾病预防', type: 'lecture', description: '普及女性常见妇科疾病知识，强调定期体检的重要性，教授自我检查方法。', location: '多功能厅', speaker: '陈晓红（妇科主任医师）', capacity: 60, tags: ['女性健康', '预防', '体检'], dateOffset: 10, durationHours: 2 },
  { title: '亲子沟通与家庭和谐', type: 'lecture', description: '分享高效亲子沟通技巧，平衡工作与家庭，构建和谐家庭关系。', location: '培训中心', speaker: '赵雪（家庭治疗师）', capacity: 80, tags: ['家庭', '亲子', '沟通'], dateOffset: 25, durationHours: 2 },

  { title: '正念减压工作坊', type: 'workshop', description: '通过体验式学习掌握正念冥想技巧，在日常工作中随时放松身心，缓解焦虑情绪。', location: '瑜伽室', speaker: '孙悦（正念导师）', capacity: 30, tags: ['正念', '冥想', '减压'], dateOffset: -50, durationHours: 3 },
  { title: '睡眠改善工作坊', type: 'workshop', description: '手把手教授睡眠日记记录法、睡前放松技巧，制定个性化睡眠改善计划。', location: '活动中心', speaker: '周健（睡眠治疗师）', capacity: 25, tags: ['睡眠', '放松', '实操'], dateOffset: -20, durationHours: 3 },
  { title: '芳香疗法与情绪调节', type: 'workshop', description: '了解精油基础知识，亲手调配专属香氛，学习用芳香疗法改善情绪。', location: '手工活动室', speaker: '吴娜（芳香疗法师）', capacity: 20, tags: ['精油', '情绪', '手工'], dateOffset: 5, durationHours: 3.5 },
  { title: '职场绘画疗愈', type: 'workshop', description: '无需绘画基础，通过自由绘画释放情绪，发现内心真实感受，获得心灵滋养。', location: '创意空间', speaker: '郑艺（艺术治疗师）', capacity: 20, tags: ['艺术', '疗愈', '情绪'], dateOffset: 20, durationHours: 3 },

  { title: '一对一心理咨询时段（上午）', type: 'consultation', description: '与专业心理咨询师进行50分钟一对一深度对话，完全保密，可讨论情绪、人际关系、职业发展等问题。', location: '心理咨询室1', speaker: '多位咨询师', capacity: 5, tags: ['咨询', '保密', '心理'], dateOffset: -40, durationHours: 4 },
  { title: '一对一心理咨询时段（下午）', type: 'consultation', description: '与专业心理咨询师进行50分钟一对一深度对话，完全保密，可讨论情绪、人际关系、职业发展等问题。', location: '心理咨询室2', speaker: '多位咨询师', capacity: 5, tags: ['咨询', '保密', '心理'], dateOffset: -10, durationHours: 4 },
  { title: '睡眠专科义诊咨询', type: 'consultation', description: '知名医院睡眠科专家坐诊，针对失眠、打鼾、多梦等问题提供专业建议。', location: '医务室', speaker: '李明（睡眠科副主任）', capacity: 8, tags: ['义诊', '睡眠', '专家'], dateOffset: 15, durationHours: 5 },
  { title: '中医体质辨识咨询', type: 'consultation', description: '老中医一对一坐诊，通过望闻问切辨别体质，提供个性化调理建议。', location: '中医诊室', speaker: '王大夫（中医主任医师）', capacity: 10, tags: ['中医', '体质', '调理'], dateOffset: 30, durationHours: 5 },
  { title: '妇科健康义诊咨询', type: 'consultation', description: '三甲医院妇科专家坐诊，免费提供妇科健康咨询，解答各类女性健康问题。', location: '医务室', speaker: '陈晓红（妇科主任）', capacity: 8, tags: ['义诊', '妇科', '专家'], dateOffset: 40, durationHours: 5 },
]

const activities: Activity[] = activityData.map((data) => {
  const baseDate = new Date('2026-04-01')
  baseDate.setDate(baseDate.getDate() + data.dateOffset)
  baseDate.setHours(9 + Math.floor(Math.random() * 4), Math.random() > 0.5 ? 0 : 30, 0, 0)

  const endDate = new Date(baseDate)
  endDate.setHours(endDate.getHours() + data.durationHours)

  const registered = Math.floor(Math.random() * (data.capacity * 0.9))

  return {
    id: generateUUID(),
    title: data.title,
    type: data.type,
    description: data.description,
    coverImage: `https://picsum.photos/seed/${generateUUID()}/800/400`,
    startTime: formatDate(baseDate),
    endTime: formatDate(endDate),
    location: data.location,
    speaker: data.speaker,
    capacity: data.capacity,
    registered,
    tags: data.tags,
  }
})

const activityRegistrations: ActivityRegistration[] = []
const employeeUsers = users.filter((u) => u.role === 'employee')

for (const activity of activities) {
  const regCount = activity.registered
  const shuffledUsers = shuffle([...employeeUsers])
  const selectedUsers = shuffledUsers.slice(0, regCount)

  for (const user of selectedUsers) {
    const activityStartTime = new Date(activity.startTime)
    const regDate = new Date(activityStartTime)
    regDate.setDate(regDate.getDate() - Math.floor(Math.random() * 14 + 1))

    const activityPast = activityStartTime < new Date()
    let status: 'registered' | 'cancelled' | 'attended'
    const roll = Math.random()
    if (activityPast) {
      if (roll < 0.75) status = 'attended'
      else if (roll < 0.9) status = 'registered'
      else status = 'cancelled'
    } else {
      if (roll < 0.9) status = 'registered'
      else status = 'cancelled'
    }

    activityRegistrations.push({
      id: generateUUID(),
      activityId: activity.id,
      userId: user.id,
      registeredAt: formatDate(regDate),
      status,
    })
  }
}

const resourceData: Array<{
  title: string
  category: 'sleep' | 'hormone' | 'emotion' | 'nutrition'
  type: 'article' | 'audio' | 'video' | 'qa'
  content: string
  duration?: number
  readTime?: number
}> = [
  { title: '深度睡眠：你不知道的睡眠真相', category: 'sleep', type: 'article', content: '深度睡眠是人体修复最重要的阶段。本文将带你了解深度睡眠的作用、如何判断自己是否拥有足够的深度睡眠，以及7个经过科学验证的深度睡眠提升技巧。从室温控制到睡前仪式，每一个细节都可能成为你改善睡眠的关键。', readTime: 8 },
  { title: '经常半夜醒来？可能是这5个原因', category: 'sleep', type: 'article', content: '夜醒是现代人常见的睡眠困扰。本文分析了导致半夜醒来的5大常见原因：血糖波动、皮质醇节律紊乱、卧室环境不佳、睡前饮水量、以及潜在的健康问题。同时提供了针对性的改善建议。', readTime: 6 },
  { title: '午睡的科学：多久才合适？', category: 'sleep', type: 'article', content: '午睡被称为"最佳健康投资"。但你知道吗？午睡时间不当反而会影响健康。本文解析了20分钟、45分钟、90分钟三种午睡时长的不同效果，教你根据自身需求选择最佳午睡方案。', readTime: 5 },
  { title: '睡前手机党必看：蓝光的真实危害', category: 'sleep', type: 'article', content: '蓝光如何影响褪黑素分泌？睡前刷手机究竟会造成多大影响？本文基于最新研究数据，解读蓝光与睡眠的关系，并提供实用的应对策略：从手机设置到蓝光眼镜选择，全面防护。', readTime: 7 },
  { title: '睡前冥想引导音频（20分钟）', category: 'sleep', type: 'audio', content: '专为睡前设计的冥想引导，配合舒缓的背景音乐，帮助你从一天的忙碌中抽离，放松紧绷的神经，自然进入甜美梦乡。', duration: 1200 },
  { title: '睡眠呼吸暂停：沉默的健康杀手', category: 'sleep', type: 'article', content: '打鼾不等于睡得香，可能是睡眠呼吸暂停的信号。本文详细介绍了睡眠呼吸暂停的症状、危害、诊断方法，以及生活方式干预和治疗选项，守护你的睡眠健康。', readTime: 9 },
  { title: '10个改善失眠的小窍门', category: 'sleep', type: 'video', content: '本视频通过动画演示，生动讲解了10个简单易行的失眠改善小窍门，包括478呼吸法、渐进式肌肉放松、睡眠限制疗法等，让你不再辗转反侧。', duration: 600 },

  { title: '围绝经期：每个女人都该了解的事', category: 'hormone', type: 'article', content: '围绝经期不是"衰老"的标志，而是女性生命旅程中自然的过渡阶段。本文系统介绍了围绝经期的生理变化、常见症状、诊断标准，帮助女性科学认识这一时期，做好身心准备。', readTime: 10 },
  { title: '潮热盗汗怎么办？中医调理有妙招', category: 'hormone', type: 'article', content: '潮热盗汗是围绝经期最困扰的症状之一。中医认为这与阴虚火旺有关，本文分享了艾灸、食疗、穴位按摩等多种调理方法，配合生活方式建议，帮你平稳度过。', readTime: 7 },
  { title: '大豆异黄酮真的能缓解更年期症状吗？', category: 'hormone', type: 'article', content: '关于大豆异黄酮的争议从未停止。本文基于最新临床研究数据，客观分析植物雌激素的作用机制、适用人群、使用剂量和潜在风险，为你提供科学参考。', readTime: 8 },
  { title: '激素替代治疗（HRT）全解析', category: 'hormone', type: 'article', content: 'HRT是目前缓解围绝经期症状最有效的方法之一，但也伴随着争议。本文邀请权威专家解读HRT的适应症、禁忌症、风险评估，以及不同给药方式的选择。', readTime: 11 },
  { title: '围绝经期情绪波动：不是矫情是激素', category: 'hormone', type: 'article', content: '前一秒开心，后一秒落泪？围绝经期的情绪波动常被误解为"矫情"。本文从神经内分泌角度解析雌激素对情绪的影响机制，并提供情绪管理策略。', readTime: 6 },
  { title: '女性一生的激素变化全周期科普', category: 'hormone', type: 'audio', content: '从青春期到围绝经期，女性的一生伴随着激素的奇妙变化。本音频以时间线方式，科普女性各阶段的激素特点和健康要点。', duration: 1500 },

  { title: '焦虑来了？5分钟情绪急救法', category: 'emotion', type: 'article', content: '当焦虑感突然来袭，你需要的是一套快速有效的情绪急救方案。本文介绍了包括54321接地法、深呼吸、冷水洗脸等在内的5种5分钟情绪急救技巧，随时随地可用。', readTime: 5 },
  { title: '职场PUA识别与心理应对', category: 'emotion', type: 'article', content: '职场PUA正在悄悄侵蚀员工的心理健康。本文总结了职场PUA的8种典型表现，教你如何识别、如何应对、以及如何重建自信，保护自己的心理边界。', readTime: 9 },
  { title: '情绪ABC理论：改变想法就能改变心情', category: 'emotion', type: 'article', content: '事情本身不是问题，我们对事情的看法才是问题。本文深入解读情绪ABC理论，通过大量实例教你如何识别不合理信念，用认知重构改善情绪。', readTime: 7 },
  { title: '内耗自救指南：停止脑子里的战争', category: 'emotion', type: 'article', content: '精神内耗正在消耗你的能量。本文分析了完美主义、过度思虑、讨好型人格等常见内耗模式，并提供了一套完整的自救练习方案。', readTime: 8 },
  { title: '如何与负面情绪和平共处', category: 'emotion', type: 'audio', content: '压制情绪只会让它更强烈。本音频引导你以接纳而非对抗的态度面对负面情绪，学习与情绪共处的智慧。', duration: 900 },
  { title: '正念认知疗法（MBCT）入门', category: 'emotion', type: 'article', content: 'MBCT是结合正念与认知疗法的心理干预方法，被证实对预防抑郁复发、缓解焦虑有显著效果。本文介绍MBCT的核心理念和基础练习。', readTime: 8 },
  { title: '常见心理问题答疑', category: 'emotion', type: 'qa', content: '精选用户提问：焦虑和抑郁症有什么区别？心理咨询有用吗？社恐如何改善？什么时候需要就医？特邀心理咨询师逐一解答。', readTime: 6 },

  { title: '抗炎饮食：吃对食物远离慢性炎症', category: 'nutrition', type: 'article', content: '慢性炎症是万病之源。本文详解抗炎饮食的核心原则，列出抗炎食物TOP20清单和促炎食物黑名单，教你用饮食构筑健康防线。', readTime: 9 },
  { title: '办公室带饭指南：营养又美味的午餐方案', category: 'nutrition', type: 'article', content: '外卖怕不健康，带饭又不知道做什么？本文提供了一周不重样的办公室午餐方案，兼顾营养均衡、方便携带、美味可口三大需求。', readTime: 7 },
  { title: '女性补铁全攻略：气血不足怎么补？', category: 'nutrition', type: 'article', content: '女性是缺铁性贫血的高发人群。本文解读缺铁信号、血红素铁与非血红素铁的区别、补铁禁忌，以及哪些食物能帮助铁吸收。', readTime: 6 },
  { title: '熬夜党救星：抗氧化营养素补充指南', category: 'nutrition', type: 'article', content: '熬夜对身体最大的伤害之一是氧化应激。本文介绍了维生素C、维生素E、谷胱甘肽、花青素等抗氧化营养素的食物来源和补充建议。', readTime: 7 },
  { title: '咖啡爱好者必读：咖啡的健康真相', category: 'nutrition', type: 'article', content: '咖啡是提神神器还是健康杀手？本文基于最新流行病学研究，解析咖啡的健康益处与风险，告诉你每天喝多少才合适。', readTime: 6 },
  { title: '地中海饮食：被WHO推荐的饮食模式', category: 'nutrition', type: 'video', content: '地中海饮食连续多年被评为最佳饮食模式。本视频详细讲解地中海饮食的构成、健康益处，以及如何在中国饮食习惯中融入地中海饮食的精髓。', duration: 720 },
]

const resources: Resource[] = resourceData.map((data, index) => {
  const baseDate = randomDate(new Date('2025-12-01'), new Date('2026-06-10'))
  return {
    id: generateUUID(),
    title: data.title,
    category: data.category,
    type: data.type,
    content: data.content,
    audioUrl: data.type === 'audio' ? `/audio/resource-${index + 1}.mp3` : undefined,
    duration: data.duration,
    readTime: data.readTime,
    publishedAt: formatDate(baseDate),
  }
})

const exerciseData: Array<{
  title: string
  category: 'breathing' | 'meditation' | 'bodyscan'
  duration: number
  description: string
  steps: string[]
}> = [
  {
    title: '4-7-8呼吸放松法',
    category: 'breathing',
    duration: 5,
    description: '由哈佛医学博士推荐的快速放松呼吸法，通过调节呼吸节律激活副交感神经，快速缓解紧张焦虑，帮助入眠。',
    steps: [
      '找一个舒适的坐姿或躺姿，放松肩膀',
      '用舌尖抵住上颚，保持在整个练习过程中',
      '完全用嘴呼出，发出"呼"的声音',
      '闭嘴，用鼻子静静吸气，在心中数4个数（1-2-3-4）',
      '停止吸气，屏住呼吸，在心中数7个数（1-2-3-4-5-6-7）',
      '用嘴完全呼出，同时在心中数8个数（1-2-3-4-5-6-7-8）',
      '以上为一次呼吸，重复进行4-8轮',
    ],
  },
  {
    title: '腹式深呼吸练习',
    category: 'breathing',
    duration: 8,
    description: '最基础的放松呼吸法，通过深度腹部呼吸增加氧气摄入，降低心率和血压，缓解身心紧张。',
    steps: [
      '舒适地坐下或躺下，一手放在胸前，一手放在腹部',
      '通过鼻子缓慢吸气，让腹部鼓起，放在腹部的手应感觉到起伏',
      '放在胸前的手尽量保持不动',
      '吸气约4秒后，屏住呼吸1-2秒',
      '通过嘴巴或鼻子缓慢呼气，让腹部自然内收',
      '呼气时间约为吸气的2倍（6-8秒）',
      '重复进行5-10分钟，感受全身的放松',
    ],
  },
  {
    title: '箱式呼吸（Box Breathing）',
    category: 'breathing',
    duration: 6,
    description: '海豹突击队使用的专注力训练呼吸法，帮助快速平复情绪、提升专注力，适用于高压场合前。',
    steps: [
      '找到舒适的姿势，背部挺直，双脚平放地面',
      '缓慢地通过鼻子呼气4秒，感受肺部完全排空',
      '屏住呼吸4秒，不要紧张，保持放松',
      '缓慢地通过鼻子吸气4秒，感受肺部充满空气',
      '再次屏住呼吸4秒，保持平静',
      '以上为一个完整循环，重复6-8轮',
      '全程保持注意力在呼吸上，走神时温柔地拉回',
    ],
  },
  {
    title: '交替鼻孔呼吸法',
    category: 'breathing',
    duration: 7,
    description: '源自瑜伽的平衡呼吸法，协调左右大脑半球，恢复身心平衡，适合情绪波动时练习。',
    steps: [
      '选择舒适的坐姿，用拇指按住右鼻孔',
      '用左鼻孔缓慢吸气4秒',
      '用无名指按住左鼻孔，屏住呼吸2秒',
      '松开右鼻孔，用右鼻孔缓慢呼气6秒',
      '用右鼻孔吸气4秒',
      '按住右鼻孔，屏住呼吸2秒',
      '松开左鼻孔，缓慢呼气6秒',
      '以上为一轮，重复5-7轮',
    ],
  },
  {
    title: '晨间觉醒冥想',
    category: 'meditation',
    duration: 10,
    description: '以平静清醒的状态开启美好一天，设定当日积极意图，培养感恩心态。',
    steps: [
      '醒来后不要立即起床，盘腿坐姿或保持躺姿',
      '轻轻闭上眼睛，做3次深呼吸',
      '扫描全身，从头顶到脚趾，感受每个部位的状态',
      '将注意力带到呼吸上，观察自然的呼吸节律',
      '在心中默念3件今天值得感恩的事',
      '设定今日的一个积极意图，如"今天我将以耐心对待每一个人"',
      '感受阳光透过窗户，带着这份平静慢慢睁开眼睛',
    ],
  },
  {
    title: '慈心冥想（Metta Meditation）',
    category: 'meditation',
    duration: 12,
    description: '培养慈悲心与同理心的经典冥想，先向自己、再向亲友、陌生人乃至"敌人"发送善意，化解怨恨与对抗。',
    steps: [
      '舒适安坐，放松身心，做几次深呼吸',
      '先将慈爱发送给自己：默念"愿我平安、愿我健康、愿我快乐、愿我轻松"',
      '想象一位你感激的人，向他发送同样的祝福',
      '想象一位普通朋友，向他发送慈爱祝福',
      '想象一位陌生人（如快递员、路人），向他发送祝福',
      '想象一位与你有矛盾的人，尝试向他发送祝福',
      '最后将慈爱扩展到所有众生："愿所有生命都幸福安康"',
    ],
  },
  {
    title: '观呼吸冥想',
    category: 'meditation',
    duration: 15,
    description: '最经典的正念冥想练习，通过观察呼吸培养觉察力和平等心，是所有冥想的基础。',
    steps: [
      '保持背部挺直的坐姿，闭上眼睛或半闭眼',
      '将注意力带到鼻孔或腹部，选择一个你最容易觉察呼吸的位置',
      '只是观察呼吸的自然流动，不做任何控制和评判',
      '注意吸气和呼气的不同感觉，温度、长短、深浅',
      '当注意力游走时（一定会发生），不要批评自己',
      '温柔地觉察到走神了，然后将注意力带回到呼吸上',
      '每一次走神再回来，都是正念的增强',
      '持续练习15分钟，最后慢慢扩展觉察到全身',
    ],
  },
  {
    title: '情绪观察冥想',
    category: 'meditation',
    duration: 10,
    description: '当被强烈情绪困扰时，通过这个练习与情绪共处而非对抗，体验情绪的无常本性。',
    steps: [
      '找到安静的地方坐下，确认此刻的情绪是什么',
      '给情绪命名（焦虑、愤怒、悲伤、委屈...）',
      '将注意力从想法转移到身体感受上',
      '在身体中定位这个情绪的位置（胸口发紧？胃部翻腾？）',
      '像科学家一样观察这个感受的形状、大小、温度、质地',
      '对这个感受说：我看到你了，我允许你在这里',
      '不试图赶走它，只是带着善意观察它',
      '感受它的变化，它会像云一样聚散流动',
    ],
  },
  {
    title: '睡前放松冥想',
    category: 'meditation',
    duration: 15,
    description: '专为入睡设计的冥想，帮助卸下一天的疲惫，清空纷乱的思绪，在平静中自然入眠。',
    steps: [
      '平躺在床上，调整到最舒适的姿势',
      '闭上眼睛，做三次深长的呼吸',
      '在心中回顾今天发生的事，像看电影一样过一遍',
      '不对任何事情做评判，只是观察，然后放下',
      '在心中说：今天已经过去了，明天是新的一天',
      '想象自己躺在温暖柔软的云朵上',
      '从头顶开始，逐一对每个部位说"放松了"',
      '随着放松深入，允许自己自然入睡',
    ],
  },
  {
    title: '全身身体扫描（进阶版）',
    category: 'bodyscan',
    duration: 20,
    description: '由著名正念导师乔·卡巴金设计的经典身体扫描练习，深度觉察身体感受，释放深层紧张。',
    steps: [
      '平躺在床上或瑜伽垫上，双腿自然分开，双臂放在身体两侧',
      '做几次深呼吸，让身体开始放松',
      '将注意力带到左脚脚趾，逐个觉察每个脚趾的感受',
      '慢慢上移到脚掌、脚跟、脚踝，觉察每个部位的感觉',
      '继续上移经过小腿、膝盖、大腿、髋部',
      '扫描整个腹部、胸部、背部，觉察呼吸带来的起伏',
      '扫描双手、双臂、肩膀、颈部',
      '最后扫描面部：额头、眉毛、眼睛、脸颊、下巴、嘴巴',
      '觉察整个身体作为一个整体的存在',
      '在这份觉察中停留几分钟',
    ],
  },
  {
    title: '快速身体扫描（5分钟版）',
    category: 'bodyscan',
    duration: 5,
    description: '时间紧张时的简化版本，快速检查身体主要紧张区域并释放，适合工作间隙。',
    steps: [
      '任何舒适姿势都可以，闭上眼睛',
      '做三次深呼吸，吸气数4，呼气数6',
      '快速扫描以下关键部位：肩膀-脖子-眼睛-下巴-胸口-胃部',
      '在每个部位停留几秒，注意是否有紧张感',
      '如果发现紧张，想象呼吸直接送到那个部位',
      '呼气时让紧张随着气息流走',
      '最后做一次深呼吸，感受全身的变化',
    ],
  },
  {
    title: '疼痛管理身体扫描',
    category: 'bodyscan',
    duration: 12,
    description: '专为慢性疼痛或身体不适人群设计，用正念态度与疼痛共处，减轻疼痛带来的痛苦感。',
    steps: [
      '找到能承受的舒适姿势',
      '深呼吸几次，建立安全的基础',
      '先扫描没有疼痛的区域，建立资源',
      '带着好奇而非抗拒，轻轻地将注意力带到疼痛区域',
      '观察疼痛的边界，它真的是一个整块吗？',
      '观察疼痛的品质：刺痛？酸痛？胀痛？灼烧？',
      '注意疼痛区域是否在不断变化',
      '在疼痛周围找到一些舒适的区域，来回移动注意力',
      '接纳"此刻有疼痛"这个事实，但不被它定义',
    ],
  },
]

const exercises: Exercise[] = exerciseData.map((data) => ({
  id: generateUUID(),
  title: data.title,
  category: data.category,
  duration: data.duration,
  description: data.description,
  steps: data.steps,
  audioUrl: `/audio/exercise-${data.category}-${data.title.slice(0, 4)}.mp3`,
}))

const carePrograms: CareProgram[] = [
  {
    id: generateUUID(),
    title: '夜醒人群关怀计划',
    targetGroup: '频繁夜醒、睡眠质量差、白天疲惫的员工',
    description: '本计划为受睡眠困扰的员工提供为期8周的系统支持，包含专业睡眠评估、个性化改善方案、睡眠日记工具、专家答疑和同伴支持小组，帮助你重新拥有甜美的夜晚。',
    benefits: [
      '一对一专业睡眠评估（30分钟）',
      '个性化睡眠改善方案定制',
      '8周睡眠日记工具包',
      '每周专家在线答疑',
      '同路人支持小组（完全保密）',
      '免费睡眠辅助工具礼包（眼罩、耳塞、香薰）',
    ],
    eligibilityCriteria: [
      '近1个月每周至少3晚出现夜醒',
      'PSQI睡眠问卷得分≥7分',
      '愿意在8周内配合完成记录和练习',
      '当前未使用处方类安眠药物（或经医生同意）',
    ],
    privacyCommitment: '所有参与信息严格保密，仅项目管理专员可访问，不向任何第三方（包括公司、直系领导）披露参与情况和个人数据。',
  },
  {
    id: generateUUID(),
    title: '疲劳人群支持计划',
    targetGroup: '长期感到疲劳、精力不足、工作效率下降的员工',
    description: '持续疲劳不是"懒"，而是身体发出的求助信号。本计划通过多维度评估和干预，帮助你找回充沛精力，重燃工作与生活热情。',
    benefits: [
      '全面疲劳原因评估（营养、睡眠、激素、心理）',
      '注册营养师一对一饮食指导',
      '定制化运动恢复方案',
      '中医体质辨识与调理建议',
      '4次小组督导支持会',
      '3个月后跟踪复评',
    ],
    eligibilityCriteria: [
      '疲劳状态持续3个月以上',
      '影响日常工作或生活质量',
      '体检无严重器质性疾病',
      '愿意配合饮食和生活方式调整',
    ],
    privacyCommitment: '参与信息加密存储，仅专业团队成员可接触，所有评估报告仅供个人查看，不纳入公司人事档案。',
  },
  {
    id: generateUUID(),
    title: '焦虑心理咨询计划',
    targetGroup: '长期被焦虑情绪困扰、职场压力大、人际关系紧张的员工',
    description: '焦虑是现代职场人最常见的心理困扰。本计划提供专业、系统的心理咨询支持，帮助你理解焦虑的根源，掌握应对技能，重建心理弹性。',
    benefits: [
      '初始评估访谈（90分钟）',
      '8次个体心理咨询（每次50分钟）',
      '咨询师专属心理测评报告',
      '自助CBT练习工具包',
      '可选：加入支持性团体小组',
      '结束后3个月内可预约1次巩固咨询',
    ],
    eligibilityCriteria: [
      '感到持续的紧张、担心或不安',
      'GAD-7焦虑量表得分≥8分',
      '无严重自伤自杀风险',
      '能够稳定参与咨询过程',
    ],
    privacyCommitment: '所有咨询内容严格遵循心理咨询伦理保密原则，不向任何人透露（包括公司、家属），只有在法律要求的极端情况下才可能打破保密。',
  },
  {
    id: generateUUID(),
    title: '综合健康管理计划',
    targetGroup: '希望系统改善身心健康、提升生活质量的员工，或存在多种健康困扰的员工',
    description: '本计划提供全方位的健康管理支持，从身体到心理、从饮食到运动，由多学科团队为你量身定制健康管理方案，陪伴你踏上深度健康之旅。',
    benefits: [
      '全面健康评估（睡眠/心理/营养/运动四维）',
      '多学科团队会诊，制定3个月管理方案',
      '指定健康管理师一对一跟踪',
      '4次专题咨询（可在睡眠/心理/营养中选择）',
      '可穿戴健康设备3个月免费使用',
      '阶段评估与方案动态调整',
      'VIP活动优先报名权',
    ],
    eligibilityCriteria: [
      '有强烈的健康改善意愿',
      '能够投入每周至少2小时的健康练习',
      '支持线上+线下的混合参与模式',
      '签署健康管理知情同意书',
    ],
    privacyCommitment: '所有健康数据独立存储，与公司HR系统完全隔离。仅你的健康管理师和相关专业顾问在工作需要时可访问，访问均留痕可审计。',
  },
]

const feedbackCategories: Array<'satisfaction' | 'suggestion' | 'experience'> = [
  'satisfaction', 'satisfaction', 'satisfaction',
  'suggestion', 'suggestion',
  'experience', 'experience', 'experience', 'experience',
]

const feedbackTemplate: Record<string, string[]> = {
  satisfaction: [
    '非常感谢公司提供的这些健康资源，睡眠自测让我第一次意识到自己的睡眠问题有多严重，已经预约了睡眠科的挂号，希望能改善。',
    '参加了正念减压工作坊，效果超出预期！老师非常专业，学到的呼吸法已经在用了，感觉加班后的焦虑感减轻了很多。',
    '围绝经期健康讲座内容很充实，之前对这些变化一知半解，现在心里有底了，也知道该去医院做哪些检查了。',
    '平台上的放松练习音频质量很高，睡前听10分钟身体扫描，睡眠质量明显提升，希望能有更多这样的内容。',
    '心理咨询预约流程很顺畅，咨询师很专业，几次咨询后情绪状态好了很多。这种服务真的很珍贵。',
    '营养文章写得很实用，把外卖换成带饭后，下午不再昏昏欲睡了，工作效率反而更高了。',
    '资源中心的内容更新很及时，种类也丰富，不仅自己受益，还推荐给了家人。',
  ],
  suggestion: [
    '建议增加更多线上活动，有些线下活动时间和部门例会冲突，线上参与会更灵活。',
    '希望能有更多针对男性员工的关怀内容，目前看很多内容偏向女性健康。',
    '活动报名通知方式可以优化一下，有时候活动发布了但我们不知道，等看到时已经报满了。',
    '建议放松练习增加更多时长选择，比如3分钟版、30分钟版，适应不同场景的需要。',
    '希望关怀项目的申请流程更简单透明，不太清楚报名后多久会有反馈。',
    '资源中心可以增加一个收藏功能，看到好的文章想保存下来以后再看，但现在找不到入口。',
    '建议增加青少年子女教育相关的内容，中年员工在育儿方面也有很多困惑需要支持。',
  ],
  experience: [
    '最近项目压力特别大，连续加班了两个星期，每天都在焦虑中度过，幸好有这个平台的冥想音频，不然真的不知道怎么撑过来。',
    '作为一个42岁的女性，这段时间情绪波动特别大，自己都觉得不可理喻，测了围绝经期量表才知道是激素变化，报名了关怀计划，希望能得到帮助。',
    '家里出了点事，最近工作时总是心神不宁，预约了心理咨询，咨询师给了我很多支持，让我能继续坚持下去。',
    '一直有打鼾的问题，家人说我半夜有时候会停止呼吸，做了睡眠自测后意识到问题的严重性，已经预约了义诊咨询，希望能解决。',
    '最近总觉得很累，每天睡8个小时还是困，做了自测发现疲劳评分很高，报名了疲劳支持计划，期待能有改善。',
    '入职三年了，第一次觉得公司真的在关心我们的身心健康，不是嘴上说说，而是真金白银投入了资源，很感动。',
    '作为一个内向的人，不太敢向别人倾诉情绪，但平台上的匿名反馈和自测功能让我觉得很安全，可以诚实地面对自己的状态。',
  ],
}

function generateFeedback(): Feedback {
  const category = pickRandom(feedbackCategories)
  const template = pickRandom(feedbackTemplate[category])
  const baseDate = randomDate(new Date('2025-11-01'), new Date('2026-06-15'))

  const statusRoll = Math.random()
  let status: 'pending' | 'reviewed' | 'resolved'
  if (statusRoll < 0.2) status = 'pending'
  else if (statusRoll < 0.7) status = 'reviewed'
  else status = 'resolved'

  const ratingKeys = {
    satisfaction: ['整体满意度', '活动质量', '内容实用性', '服务专业性'],
    suggestion: ['需求契合度', '内容丰富度', '使用便捷性', '改进空间'],
    experience: ['情绪改善程度', '问题解决程度', '支持及时性', '安全感'],
  }

  const ratings: Record<string, number> = {}
  for (const key of ratingKeys[category]) {
    ratings[key] = category === 'suggestion'
      ? Math.floor(Math.random() * 3) + 3
      : Math.floor(Math.random() * 2) + 4
  }

  return {
    id: generateUUID(),
    anonymousId: generateUUID(),
    category,
    ratings,
    content: template,
    submittedAt: formatDate(baseDate),
    status,
  }
}

const feedbacks: Feedback[] = Array.from({ length: 50 }, () => generateFeedback())

const sleepTips: SleepTip[] = [
  { id: generateUUID(), title: '固定作息时间', content: '每天同一时间上床和起床，包括周末。即使前一晚没睡好，也不要晚起，这是建立生物钟的关键。', category: '作息规律' },
  { id: generateUUID(), title: '睡前90分钟避免蓝光', content: '电子屏幕的蓝光会抑制褪黑素分泌。如需使用，开启夜间模式或佩戴防蓝光眼镜，亮度调至最低。', category: '环境准备' },
  { id: generateUUID(), title: '打造睡眠友好环境', content: '卧室温度18-22℃，湿度40%-60%，遮光窗帘+耳塞+眼罩，床只用于睡眠和亲密，不在床上办公刷手机。', category: '环境准备' },
  { id: generateUUID(), title: '下午2点后不碰咖啡因', content: '咖啡因半衰期4-6小时，下午喝咖啡因饮品会影响当晚深度睡眠。包括咖啡、茶、可乐、能量饮料、部分巧克力。', category: '饮食注意' },
  { id: generateUUID(), title: '晚餐三不吃原则', content: '不吃太饱（七分饱即可）、不吃太晚（睡前3小时完成）、不吃太刺激（辛辣、油腻、酒精）。', category: '饮食注意' },
  { id: generateUUID(), title: '睡前1小时温水泡脚', content: '40℃左右温水泡脚15-20分钟，促进下肢血液循环，降低核心体温，启动睡眠开关。可加艾叶、生姜、薰衣草精油。', category: '睡前仪式' },
  { id: generateUUID(), title: '建立睡前放松仪式', content: '每天睡前重复同样的活动组合：如"刷牙→泡脚→阅读纸质书15分钟→关灯"，让大脑形成条件反射，一启动就知道要睡觉了。', category: '睡前仪式' },
  { id: generateUUID(), title: '日间充足光照', content: '早晨或上午户外活动30分钟，晒太阳帮助校准生物钟，增加日间清醒度，改善夜间睡眠质量。', category: '日间习惯' },
  { id: generateUUID(), title: '规律运动但选对时间', content: '每周150分钟中等强度运动显著改善睡眠，但避免睡前3小时剧烈运动，以免皮质醇升高影响入睡。', category: '日间习惯' },
  { id: generateUUID(), title: '白天不补觉超过20分钟', content: '午睡超过30分钟会进入深睡眠，醒来后更加困倦，还会影响当晚睡眠。最佳午睡时长15-20分钟，下午3点后不再补觉。', category: '作息规律' },
  { id: generateUUID(), title: '床是用来睡觉的', content: '如果躺床20分钟还没睡着，果断起床！去做一些无聊、放松的活动（不要看手机），等有困意了再回到床上。', category: '认知行为' },
  { id: generateUUID(), title: '不要反复看时间', content: '失眠时反复看时间会加重焦虑："又过了一小时我还没睡着！"把闹钟和手机翻面，或放在视线外。', category: '认知行为' },
  { id: generateUUID(), title: '睡前排空膀胱', content: '夜尿是常见夜醒原因，睡前1小时减少液体摄入，上床前去一次厕所。但如果口渴请正常喝水，不要刻意渴自己。', category: '生理准备' },
  { id: generateUUID(), title: '选择合适的枕头', content: '好枕头应贴合颈椎曲度：仰睡时一拳高，侧睡时与肩同宽。材质以记忆棉、乳胶为佳，每1-2年更换新枕头。', category: '环境准备' },
  { id: generateUUID(), title: '不要带着情绪上床', content: '睡前如有未解决的烦心事，花5分钟写在纸上，告诉自己"明天再处理"，把问题从大脑中"转移"到纸上。', category: '睡前仪式' },
  { id: generateUUID(), title: '睡前避免激烈讨论', content: '睡前1小时不要和家人、伴侣讨论容易引发情绪激动的话题，如有矛盾约定"明天再谈"，保护睡前的平静状态。', category: '情绪管理' },
  { id: generateUUID(), title: '记录睡眠日记', content: '连续2周记录：上床时间、入睡时长、夜醒次数、起床时间、白天精神状态。这有助于发现睡眠问题的规律，就医时也是重要参考。', category: '工具辅助' },
  { id: generateUUID(), title: '谨慎使用助眠产品', content: '褪黑素、助眠保健品不是人人适合，长期使用可能有依赖性。如持续失眠超过2周，建议就医而非自行购药。', category: '医学建议' },
  { id: generateUUID(), title: '接受偶尔的失眠', content: '偶尔一两天睡不好是正常的，不会对身体造成严重损害。过度担心"我今晚又要失眠了"反而真的会导致失眠，顺其自然反而容易入睡。', category: '认知行为' },
  { id: generateUUID(), title: '何时需要就医', content: '以下情况建议就诊：每周3次以上失眠、持续超过1个月；白天严重影响工作生活；打鼾严重+白天极度嗜睡（可能睡眠呼吸暂停）；伴明显情绪问题。', category: '医学建议' },
]

export const mockData = {
  users,
  departments: departmentList,
  sleepAssessments,
  menopauseAssessments,
  activities,
  activityRegistrations,
  resources,
  exercises,
  carePrograms,
  feedbacks,
  sleepTips,
}

export default mockData
