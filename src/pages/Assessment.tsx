import { Moon, Flower2, Shield, FileText, Calendar, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

interface HistoryItem {
  id: string
  type: 'sleep' | 'menopause'
  submittedAt: string
  severity: 'mild' | 'moderate' | 'severe'
  totalScore: number
}

const severityConfig = {
  mild: { label: '轻度', bg: 'bg-sage-100', text: 'text-sage-600', border: 'border-sage-200' },
  moderate: { label: '中度', bg: 'bg-warm-100', text: 'text-warm-600', border: 'border-warm-200' },
  severe: { label: '重度', bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
}

export default function Assessment() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params = new URLSearchParams()
        if (user?.id) params.append('userId', user.id)
        if (user?.department) params.append('department', user.department)

        const res = await fetch(`/api/assessment/my?${params.toString()}`)
        const data = await res.json()
        if (data.success) {
          setHistory(data.data.slice(0, 10))
        }
      } catch (e) {
        console.error('获取历史记录失败', e)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [user])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="space-y-8">
      <div className="stagger-enter">
        <h1 className="text-2xl font-bold text-clay-900">健康自测中心</h1>
        <p className="text-clay-500 mt-1">
          通过科学量表了解你的身心健康状态，<span className="text-rose-500 font-medium">所有数据匿名加密，仅你本人可见</span>
        </p>
      </div>

      <div className="stagger-enter rounded-2xl border border-lavender-200 bg-gradient-to-r from-lavender-50 to-rose-50 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-5 h-5 text-lavender-500" strokeWidth={1.8} />
        </div>
        <div className="text-sm">
          <p className="font-medium text-clay-800">隐私保护承诺</p>
          <p className="text-clay-500 mt-0.5">
            所有自测数据采用端到端加密存储，不关联真实姓名，报告生成后自动匿名化处理，你可以随时删除个人数据。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/assessment/sleep" className="group stagger-enter">
          <div className="relative h-full rounded-3xl overflow-hidden p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-lavender-100/60 hover:shadow-2xl hover:shadow-lavender-200/70"
               style={{ background: 'linear-gradient(135deg, #E9E0F1 0%, #D4C1E3 50%, #C9B1D4 100%)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-rose-200/30 blur-3xl" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-md">
                <Moon className="w-8 h-8 text-lavender-500" strokeWidth={1.8} fill="currentColor" fillOpacity={0.15} />
              </div>
              <h3 className="text-xl font-bold text-clay-800 mb-2">睡眠困扰筛查</h3>
              <p className="text-sm text-clay-600/80 leading-relaxed mb-6">
                参考 PSQI 匹兹堡睡眠质量指数设计，评估睡眠质量、入睡困难、夜醒等 <span className="font-semibold">8 道题目</span>，约 3 分钟完成
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm text-lavender-600 font-medium text-sm shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                开始测试
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/assessment/menopause" className="group stagger-enter">
          <div className="relative h-full rounded-3xl overflow-hidden p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-rose-100/60 hover:shadow-2xl hover:shadow-rose-200/70"
               style={{ background: 'linear-gradient(135deg, #F6E4E6 0%, #E8B4B8 50%, #E0A5AA 100%)' }}>
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-16 -right-10 w-48 h-48 rounded-full bg-warm-200/40 blur-3xl" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-md">
                <Flower2 className="w-8 h-8 text-rose-500" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-bold text-clay-800 mb-2">围绝经期症状评估</h3>
              <p className="text-sm text-clay-600/80 leading-relaxed mb-6">
                参考 Kupperman 改良量表设计，评估潮热、情绪、疲劳等 <span className="font-semibold">10 项症状</span>，约 2 分钟完成
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm text-rose-600 font-medium text-sm shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                开始测试
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="stagger-enter">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-clay-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" strokeWidth={1.8} />
            我的自测历史
          </h2>
          <span className="text-xs text-clay-400">显示最近 10 条</span>
        </div>

        <div className="rounded-2xl border border-clay-100 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-3 border-lavender-200 border-t-lavender-500 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-clay-50 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7 text-clay-300" strokeWidth={1.5} />
              </div>
              <p className="text-clay-500 text-sm">暂无自测记录，开始你的第一次健康评估吧</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-clay-50/60 text-xs text-clay-500">
                    <th className="text-left font-medium py-3.5 px-5">测试类型</th>
                    <th className="text-left font-medium py-3.5 px-5">完成日期</th>
                    <th className="text-left font-medium py-3.5 px-5">严重程度</th>
                    <th className="text-left font-medium py-3.5 px-5">总分</th>
                    <th className="text-right font-medium py-3.5 px-5">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => {
                    const sev = severityConfig[item.severity]
                    const isSleep = item.type === 'sleep'
                    return (
                      <tr key={item.id} className="border-t border-clay-50 hover:bg-clay-50/40 transition-colors"
                          style={{ animationDelay: `${idx * 0.05}s` }}>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              isSleep ? 'bg-lavender-50' : 'bg-rose-50'
                            )}>
                              {isSleep
                                ? <Moon className="w-4 h-4 text-lavender-500" strokeWidth={1.8} />
                                : <Flower2 className="w-4 h-4 text-rose-500" strokeWidth={1.8} />}
                            </div>
                            <span className="text-sm font-medium text-clay-700">
                              {isSleep ? '睡眠困扰筛查' : '围绝经期症状评估'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-sm text-clay-500">{formatDate(item.submittedAt)}</td>
                        <td className="py-4 px-5">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                            sev.bg, sev.text, sev.border
                          )}>
                            {sev.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-sm font-semibold text-clay-700">{item.totalScore}</td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => navigate(`/assessment/result/${item.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium hover:underline transition-colors"
                          >
                            查看报告
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
