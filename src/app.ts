import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())
app.use(routes)

app.get('/api/ping', (_req, res) => {
	res.json({ message: 'pong' })
})

export default app
