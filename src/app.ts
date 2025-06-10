import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes'
import path from 'path'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())
app.use('/static', express.static(path.join(process.cwd(), 'public')))
app.use(routes)

app.get('/api/ping', (_req, res) => {
	res.json({ message: 'pong' })
})

export default app
