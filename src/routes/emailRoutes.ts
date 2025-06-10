import { Router } from 'express'
import { sendEmail, sendOrderEmail } from '../controllers/emailContraller'

const router = Router()

router.post('/sendEmail', sendEmail)
router.post('/sendEmailFromCalculator', sendOrderEmail)

export default router
