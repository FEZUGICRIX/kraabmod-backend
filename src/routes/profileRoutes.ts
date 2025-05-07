import { Router } from 'express'
import {
	createProfile,
	deleteProfile,
	getProfileById,
	getProfiles,
} from '../controllers/profileController'

const router = Router()

router.get('/profiles', getProfiles)
router.get('/profiles/:id', getProfileById)
router.post('/profiles', createProfile)
router.delete('/profiles/:id', deleteProfile)

export default router
