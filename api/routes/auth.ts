import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, department } = req.body

    if (!name || !department) {
      res.status(400).json({
        success: false,
        error: '姓名和部门不能为空',
      })
      return
    }

    const user = mockData.users.find(
      (u) => u.name === name && u.department === department,
    )

    if (!user) {
      const newUser = {
        id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        }),
        name,
        department,
        role: 'employee' as const,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      }
      mockData.users.push(newUser)

      res.status(200).json({
        success: true,
        data: {
          user: newUser,
          token: 'mock-jwt-token-' + newUser.id,
        },
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        token: 'mock-jwt-token-' + user.id,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      message: '退出登录成功',
    },
  })
})

export default router
