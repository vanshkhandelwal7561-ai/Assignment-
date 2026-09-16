const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
})

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  )
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' })
    }

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered' })
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    })

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: safeUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already registered' })
    }

    console.error('Registration error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to register user' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!emailPattern.test(normalizedEmail) || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Valid email and password are required' })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token: createToken(user),
      user: safeUser(user),
    })
  } catch (error) {
    if (error.message === 'JWT_SECRET is not configured') {
      console.error(error.message)
      return res.status(500).json({ success: false, message: 'Authentication is not configured' })
    }

    console.error('Login error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to log in' })
  }
}

const getCurrentUser = async (req, res) => {
  return res.json({
    success: true,
    user: safeUser(req.user),
  })
}

const listUsers = async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? escapeRegex(req.query.search.trim()) : ''
    const filter = search
      ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
      : {}
    const users = await User.find(filter).select('name email role').sort({ name: 1 }).limit(20)
    return res.json({ success: true, users })
  } catch (error) {
    console.error('List users error:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to search users' })
  }
}

module.exports = { register, login, getCurrentUser, listUsers }
