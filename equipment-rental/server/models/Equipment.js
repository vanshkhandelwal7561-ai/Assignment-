const mongoose = require('mongoose')

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyLateFee: {
      type: Number,
      required: true,
      min: 0,
    },
    depositPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Equipment', equipmentSchema)
