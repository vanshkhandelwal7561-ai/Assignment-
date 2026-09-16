const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI

  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined. Add it to server/.env.')
  }

  try {
    await mongoose.connect(mongoURI)
    console.log('MongoDB connected successfully')
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`)
  }
}

module.exports = connectDB
