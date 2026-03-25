import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import uploadRouter from './routes/upload.js'
import chatRouter from './routes/chat.js'

const app = express()

app.use(cors({ origin: 'https://pdfprocessing.netlify.app', credentials: true }))
app.use(express.json())

app.use('/api/upload', uploadRouter)
app.use('/api/chat', chatRouter)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`)
})