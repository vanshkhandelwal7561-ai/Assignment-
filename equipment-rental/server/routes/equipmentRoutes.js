const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const adminMiddleware = require('../middleware/adminMiddleware')
const {
  createEquipment,
  deleteEquipment,
  getAvailabilityForEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
} = require('../controllers/equipmentController')

const router = express.Router()

router.use(authMiddleware)
router.get('/', getEquipment)
router.get('/:id/availability', getAvailabilityForEquipment)
router.get('/:id', getEquipmentById)
router.post('/', adminMiddleware, createEquipment)
router.put('/:id', adminMiddleware, updateEquipment)
router.delete('/:id', adminMiddleware, deleteEquipment)

module.exports = router
