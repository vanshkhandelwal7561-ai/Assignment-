const mongoose = require('mongoose')
const Equipment = require('../models/Equipment')
const Rental = require('../models/Rental')

const occupiedStatuses = ['BOOKED', 'ACTIVE', 'OVERDUE']

const parseDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const getAvailability = async (equipment, startDate, endDate) => {
  const rentals = await Rental.find({
    equipment: equipment._id,
    status: { $in: occupiedStatuses },
    startDate: { $lte: endDate },
    expectedReturnDate: { $gte: startDate },
  }).select('quantity')

  const bookedQuantity = rentals.reduce((total, rental) => total + rental.quantity, 0)
  const availableQuantity = Math.max(0, equipment.totalQuantity - bookedQuantity)

  return { bookedQuantity, availableQuantity }
}

const today = () => {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  return date
}

const getEquipment = async (req, res) => {
  try {
    const filter = req.user.role === 'ADMIN' && req.query.includeInactive === 'true'
      ? {}
      : { isActive: true }
    const startDate = parseDate(req.query.startDate) || today()
    const endDate = parseDate(req.query.endDate) || startDate

    if (req.query.startDate && (!parseDate(req.query.startDate) || (req.query.endDate && !parseDate(req.query.endDate)))) {
      return res.status(400).json({ success: false, message: 'Dates must use YYYY-MM-DD format' })
    }

    if (endDate < startDate) {
      return res.status(400).json({ success: false, message: 'End date must be on or after start date' })
    }

    const equipment = await Equipment.find(filter).sort({ name: 1 })
    const items = await Promise.all(equipment.map(async (item) => {
      const availability = await getAvailability(item, startDate, endDate)
      return { ...item.toObject(), ...availability }
    }))

    return res.json({ success: true, equipment: items })
  } catch (error) {
    console.error('Get equipment error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to fetch equipment' })
  }
}

const getEquipmentById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid equipment ID' })
  }

  try {
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment || (!equipment.isActive && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ success: false, message: 'Equipment not found' })
    }

    return res.json({ success: true, equipment })
  } catch (error) {
    console.error('Get equipment item error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to fetch equipment' })
  }
}

const createEquipment = async (req, res) => {
  try {
    const { name, category, totalQuantity, dailyLateFee, depositPerUnit, isActive } = req.body || {}
    const equipment = await Equipment.create({ name, category, totalQuantity, dailyLateFee, depositPerUnit, isActive })
    return res.status(201).json({ success: true, equipment })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid equipment data' })
    }

    console.error('Create equipment error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to create equipment' })
  }
}

const updateEquipment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid equipment ID' })
  }

  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body || {},
      { new: true, runValidators: true },
    )

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' })
    }

    return res.json({ success: true, equipment })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid equipment data' })
    }

    console.error('Update equipment error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to update equipment' })
  }
}

const deleteEquipment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid equipment ID' })
  }

  try {
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' })
    }

    const rentalHistory = await Rental.exists({ equipment: equipment._id })
    if (rentalHistory) {
      equipment.isActive = false
      await equipment.save()
      return res.json({ success: true, message: 'Equipment deactivated because rental history exists', equipment })
    }

    await equipment.deleteOne()
    return res.json({ success: true, message: 'Equipment deleted successfully' })
  } catch (error) {
    console.error('Delete equipment error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to delete equipment' })
  }
}

const getAvailabilityForEquipment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid equipment ID' })
  }

  const startDate = parseDate(req.query.startDate)
  const endDate = parseDate(req.query.endDate)
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate must use YYYY-MM-DD format' })
  }
  if (endDate < startDate) {
    return res.status(400).json({ success: false, message: 'End date must be on or after start date' })
  }

  try {
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment || (!equipment.isActive && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ success: false, message: 'Equipment not found' })
    }

    const availability = await getAvailability(equipment, startDate, endDate)
    return res.json({
      success: true,
      equipment: {
        id: equipment._id,
        name: equipment.name,
        totalQuantity: equipment.totalQuantity,
        ...availability,
      },
    })
  } catch (error) {
    console.error('Get availability error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to check availability' })
  }
}

module.exports = {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getAvailabilityForEquipment,
  getAvailability,
  parseDate,
  occupiedStatuses,
}
