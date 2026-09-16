const mongoose = require('mongoose')

const rentalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    lateFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['BOOKED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED'],
      default: 'BOOKED',
    },
    transferHistory: [
      {
        fromUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        toUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        transferredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
)

rentalSchema.index({ user: 1, status: 1 })
rentalSchema.index({ equipment: 1, status: 1 })
rentalSchema.index({ expectedReturnDate: 1, status: 1 })

module.exports = mongoose.model('Rental', rentalSchema)
