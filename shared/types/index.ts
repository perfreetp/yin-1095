export interface User {
  id: string
  name: string
  department: string
  role: 'employee' | 'admin'
  avatar?: string
}

export interface SleepAnswer {
  questionId: string
  value: number
}

export interface SleepAssessment {
  id: string
  userId?: string
  anonymousId: string
  department: string
  submittedAt: string
  answers: SleepAnswer[]
  totalScore: number
  severity: 'mild' | 'moderate' | 'severe'
  suggestions: string[]
}

export interface SymptomScore {
  symptomId: string
  name: string
  score: number
}

export interface MenopauseAssessment {
  id: string
  anonymousId: string
  department: string
  submittedAt: string
  symptoms: SymptomScore[]
  totalScore: number
  severity: 'mild' | 'moderate' | 'severe'
  suggestions: string[]
}

export type ActivityType = 'lecture' | 'workshop' | 'consultation' | 'course'

export interface Activity {
  id: string
  title: string
  type: ActivityType
  description: string
  coverImage?: string
  startTime: string
  endTime: string
  location: string
  speaker: string
  capacity: number
  registered: number
  tags: string[]
}

export interface ActivityRegistration {
  id: string
  activityId: string
  userId: string
  registeredAt: string
  status: 'registered' | 'cancelled' | 'attended'
}

export type ResourceCategory = 'sleep' | 'hormone' | 'emotion' | 'nutrition'
export type ResourceType = 'article' | 'audio' | 'video' | 'qa'

export interface Resource {
  id: string
  title: string
  category: ResourceCategory
  type: ResourceType
  content: string
  audioUrl?: string
  duration?: number
  readTime?: number
  publishedAt: string
}

export type ExerciseCategory = 'breathing' | 'meditation' | 'bodyscan'

export interface Exercise {
  id: string
  title: string
  category: ExerciseCategory
  duration: number
  description: string
  steps: string[]
  audioUrl?: string
}

export interface CareProgram {
  id: string
  title: string
  targetGroup: string
  description: string
  benefits: string[]
  eligibilityCriteria: string[]
  privacyCommitment: string
}

export type FeedbackCategory = 'satisfaction' | 'suggestion' | 'experience'
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved'

export interface Feedback {
  id: string
  anonymousId: string
  category: FeedbackCategory
  ratings: Record<string, number>
  content: string
  submittedAt: string
  status: FeedbackStatus
}

export interface DepartmentTrend {
  department: string
  participantCount: number
  avgSeverityScore: number
  topConcern: string
}

export interface DashboardStats {
  totalParticipants: number
  participationRate: number
  topSymptoms: { name: string; count: number; percentage: number }[]
  activityStats: { total: number; registered: number; completed: number }
  departmentTrends: DepartmentTrend[]
}

export interface SleepTip {
  id: string
  title: string
  content: string
  category: string
}

export interface Department {
  name: string
  employeeCount: number
}
