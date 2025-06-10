import { Router } from 'express'
import {
	createProfile,
	deleteProfile,
	getProfileBySlug,
	getProfiles,
	updateProfile,
} from '../controllers/profileController'

const router = Router()

router.get('/profiles', getProfiles)
router.get('/profiles/:slug', getProfileBySlug)
router.post('/profiles', createProfile)
router.patch('/profiles/:id', updateProfile)
router.delete('/profiles/:id', deleteProfile)

export default router
