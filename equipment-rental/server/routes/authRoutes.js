const express = require('express')
const { getCurrentUser, listUsers, login, register } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, getCurrentUser)
router.get('/users', authMiddleware, listUsers)

module.exports = router
