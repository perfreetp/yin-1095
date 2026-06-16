import { Router, type Request, type Response } from 'express'
import { mockData } from '../data/mockData.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, type, keyword, page, pageSize } = req.query
    const pageNum = parseInt(page as string) || 1
    const sizeNum = parseInt(pageSize as string) || 12

    let filtered = [...mockData.resources]

    if (category) {
      filtered = filtered.filter((r) => r.category === category)
    }

    if (type) {
      filtered = filtered.filter((r) => r.type === type)
    }

    if (keyword) {
      const keywordLower = (keyword as string).toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(keywordLower) ||
          r.content.toLowerCase().includes(keywordLower),
      )
    }

    filtered.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )

    const startIndex = (pageNum - 1) * sizeNum
    const paginatedData = filtered.slice(startIndex, startIndex + sizeNum)

    res.status(200).json({
      success: true,
      data: {
        list: paginatedData,
        total: filtered.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(filtered.length / sizeNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取资源列表失败，请稍后重试',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const resource = mockData.resources.find((r) => r.id === id)

    if (!resource) {
      res.status(404).json({
        success: false,
        error: '资源不存在',
      })
      return
    }

    const relatedResources = mockData.resources
      .filter((r) => r.category === resource.category && r.id !== id)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, 4)

    res.status(200).json({
      success: true,
      data: {
        ...resource,
        relatedResources,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取资源详情失败，请稍后重试',
    })
  }
})

export default router
