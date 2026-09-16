const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const adminMiddleware = require('../middleware/adminMiddleware')
const {
  createRental,
  getAllRentals,
  getMyRentals,
  getRentalById,
  returnRental,
  transferRental,
} = require('../controllers/rentalController')

const router = express.Router()

router.use(authMiddleware)
router.post('/', createRental)
router.post('/:id/return', returnRental)
router.post('/:id/transfer', transferRental)
router.get('/my', getMyRentals)
router.get('/', adminMiddleware, getAllRentals)
router.get('/:id', getRentalById)

module.exports = router
