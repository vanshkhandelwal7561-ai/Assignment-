const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const equipmentRoutes = require('./routes/equipmentRoutes')
const rentalRoutes = require('./routes/rentalRoutes')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/rentals', rentalRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
  })
})

const startServer = async () => {
  try {
    await connectDB()

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

startServer()
