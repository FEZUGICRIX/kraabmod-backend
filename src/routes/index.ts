import { Router } from 'express'
import profileRoutes from './profileRoutes'

const router = Router()

// Routes
router.use('/api', profileRoutes)

export default router
