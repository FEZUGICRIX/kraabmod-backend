import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes'

dotenv.config()

const app = express()



// app.use(cors({ origin: true, credentials: true }))



app.use(express.json())
app.use(routes)

app.get('/api/ping', (_req, res) => {
	res.json({ message: 'pong' })
})

export default app
