const mongoose = require('mongoose')
const Equipment = require('../models/Equipment')
const Rental = require('../models/Rental')
const User = require('../models/User')
const {
  getAvailability,
  occupiedStatuses,
  parseDate,
} = require('./equipmentController')

const MAX_ACTIVE_UNITS = 5
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const calculateLateDays = (actualReturnDate, expectedReturnDate) => {
  const actual = new Date(actualReturnDate)
  const expected = new Date(expectedReturnDate)
  actual.setUTCHours(0, 0, 0, 0)
  expected.setUTCHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((actual - expected) / MILLISECONDS_PER_DAY))
}

const validateRentalDates = (startDateValue, endDateValue) => {
  const startDate = parseDate(startDateValue)
  const expectedReturnDate = parseDate(endDateValue)

  if (!startDate || !expectedReturnDate) {
    return { error: 'startDate and expectedReturnDate must use YYYY-MM-DD format' }
  }
  if (expectedReturnDate < startDate) {
    return { error: 'expectedReturnDate must be on or after startDate' }
  }

  return { startDate, expectedReturnDate }
}

const createRental = async (req, res) => {
  try {
    const { equipmentId, quantity, startDate: startDateValue, expectedReturnDate: endDateValue } = req.body || {}
    const dates = validateRentalDates(startDateValue, endDateValue)

    if (dates.error) {
      return res.status(400).json({ success: false, message: dates.error })
    }
    if (!mongoose.isValidObjectId(equipmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid equipment ID' })
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' })
    }

    const equipment = await Equipment.findById(equipmentId)
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ success: false, message: 'Active equipment not found' })
    }

    const availability = await getAvailability(equipment, dates.startDate, dates.expectedReturnDate)
    if (quantity > availability.availableQuantity) {
      return res.status(409).json({
        success: false,
        message: `Only ${availability.availableQuantity} unit(s) are available for those dates`,
      })
    }

    const now = new Date()
    now.setUTCHours(0, 0, 0, 0)
    const userRentals = await Rental.find({
      user: req.user._id,
      status: { $in: occupiedStatuses },
      expectedReturnDate: { $gte: now },
    }).select('quantity')
    const currentUnits = userRentals.reduce((total, rental) => total + rental.quantity, 0)

    if (currentUnits + quantity > MAX_ACTIVE_UNITS) {
      return res.status(409).json({
        success: false,
        message: `Borrowing limit is ${MAX_ACTIVE_UNITS} active/upcoming units`,
      })
    }

    const rental = await Rental.create({
      user: req.user._id,
      equipment: equipment._id,
      quantity,
      startDate: dates.startDate,
      expectedReturnDate: dates.expectedReturnDate,
      depositAmount: quantity * equipment.depositPerUnit,
      status: 'BOOKED',
    })

    await rental.populate('equipment', 'name category depositPerUnit dailyLateFee')
    return res.status(201).json({ success: true, message: 'Equipment booked successfully', rental })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid rental data' })
    }

    console.error('Create rental error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to create rental' })
  }
}

const getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ user: req.user._id })
      .populate('equipment', 'name category depositPerUnit dailyLateFee')
      .populate('transferHistory.fromUser', 'name email')
      .populate('transferHistory.toUser', 'name email')
      .sort({ createdAt: -1 })

    return res.json({ success: true, rentals })
  } catch (error) {
    console.error('Get my rentals error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to fetch rentals' })
  }
}

const getRentalById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid rental ID' })
  }

  try {
    const rental = await Rental.findById(req.params.id)
      .populate('equipment', 'name category depositPerUnit dailyLateFee')
      .populate('user', 'name email role')
      .populate('transferHistory.fromUser', 'name email')
      .populate('transferHistory.toUser', 'name email')

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' })
    }
    if (rental.user._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You can only access your own rentals' })
    }

    return res.json({ success: true, rental })
  } catch (error) {
    console.error('Get rental error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to fetch rental' })
  }
}

const getAllRentals = async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('equipment', 'name category')
      .populate('user', 'name email role')
      .populate('transferHistory.fromUser', 'name email')
      .populate('transferHistory.toUser', 'name email')
      .sort({ createdAt: -1 })

    return res.json({ success: true, rentals })
  } catch (error) {
    console.error('Get all rentals error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to fetch rentals' })
  }
}

const returnRental = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid rental ID' })
  }

  try {
    const rental = await Rental.findById(req.params.id).populate('equipment', 'name dailyLateFee')

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' })
    }
    if (rental.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the borrower or an admin can process this return' })
    }
    if (rental.actualReturnDate || rental.status === 'RETURNED') {
      return res.status(409).json({ success: false, message: 'Rental has already been returned' })
    }
    if (rental.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cancelled rentals cannot be returned' })
    }

    const actualReturnDate = new Date()
    const lateDays = calculateLateDays(actualReturnDate, rental.expectedReturnDate)
    const lateFee = lateDays * rental.equipment.dailyLateFee * rental.quantity
    const refundableAmount = Math.max(0, rental.depositAmount - lateFee)

    rental.actualReturnDate = actualReturnDate
    rental.lateFee = lateFee
    rental.refundableAmount = refundableAmount
    rental.status = 'RETURNED'
    await rental.save()

    return res.json({
      success: true,
      message: 'Equipment returned successfully',
      lateDays,
      lateFee,
      depositAmount: rental.depositAmount,
      refundableAmount,
      actualReturnDate,
    })
  } catch (error) {
    console.error('Return rental error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to process return' })
  }
}

const transferRental = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid rental ID' })
  }

  const { newBorrowerId } = req.body || {}
  if (!mongoose.isValidObjectId(newBorrowerId)) {
    return res.status(400).json({ success: false, message: 'Invalid new borrower ID' })
  }

  try {
    const rental = await Rental.findById(req.params.id)
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' })
    }
    if (rental.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the current borrower or an admin can transfer this rental' })
    }
    if (!['BOOKED', 'ACTIVE', 'OVERDUE'].includes(rental.status) || rental.actualReturnDate) {
      return res.status(400).json({ success: false, message: 'Only an active, non-returned rental can be transferred' })
    }
    if (rental.user.toString() === newBorrowerId.toString()) {
      return res.status(400).json({ success: false, message: 'New borrower must be different from the current borrower' })
    }

    const newBorrower = await User.findById(newBorrowerId).select('name email role')
    if (!newBorrower) {
      return res.status(404).json({ success: false, message: 'New borrower not found' })
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const existingRentals = await Rental.find({
      user: newBorrower._id,
      status: { $in: occupiedStatuses },
      expectedReturnDate: { $gte: today },
    }).select('quantity')
    const existingUnits = existingRentals.reduce((total, item) => total + item.quantity, 0)
    if (existingUnits + rental.quantity > MAX_ACTIVE_UNITS) {
      return res.status(409).json({
        success: false,
        message: `New borrower would exceed the ${MAX_ACTIVE_UNITS}-unit borrowing limit`,
      })
    }

    const previousBorrowerId = rental.user
    rental.user = newBorrower._id
    rental.transferHistory.push({
      fromUser: previousBorrowerId,
      toUser: newBorrower._id,
      transferredAt: new Date(),
    })
    await rental.save()
    await rental.populate([
      { path: 'user', select: 'name email role' },
      { path: 'equipment', select: 'name category depositPerUnit dailyLateFee' },
      { path: 'transferHistory.fromUser', select: 'name email' },
      { path: 'transferHistory.toUser', select: 'name email' },
    ])

    return res.json({
      success: true,
      message: 'Loan transferred successfully.',
      rental,
    })
  } catch (error) {
    console.error('Transfer rental error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to transfer rental' })
  }
}

module.exports = {
  createRental,
  getMyRentals,
  getRentalById,
  getAllRentals,
  returnRental,
  transferRental,
  MAX_ACTIVE_UNITS,
}
