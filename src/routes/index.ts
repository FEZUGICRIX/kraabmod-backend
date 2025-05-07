import { Router } from 'express'
import profileRoutes from './profileRoutes'
import emailRoutes from './emailRoutes'

const router = Router()

// Routes
router.use('/api', profileRoutes)
router.use('/api', emailRoutes)

export default router
