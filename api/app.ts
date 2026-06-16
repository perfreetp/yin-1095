/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import assessmentRoutes from './routes/assessment.js'
import adminRoutes from './routes/admin.js'
import activitiesRoutes from './routes/activities.js'
import resourcesRoutes from './routes/resources.js'
import carePlanRoutes from './routes/carePlan.js'
import careChannelRoutes from './routes/careChannel.js'
import feedbackRoutes from './routes/feedback.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/assessment', assessmentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/activities', activitiesRoutes)
app.use('/api/resources', resourcesRoutes)
app.use('/api/care-plan', carePlanRoutes)
app.use('/api/care-channel', careChannelRoutes)
app.use('/api/feedback', feedbackRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
