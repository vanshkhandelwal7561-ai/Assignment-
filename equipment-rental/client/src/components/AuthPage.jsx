import { ArrowRight, Box, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import ThemeToggle from './ThemeToggle'
import { Alert } from './ui'
import { buttonStyles, inputClass } from './uiStyles'

function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const switchMode = (nextMode) => { setMode(nextMode); setError(''); setSuccess('') }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await api.post(endpoint, form)
      if (mode === 'register') { setMode('login'); setSuccess('Account created. Sign in to continue.'); setForm({ name: '', email: form.email, password: '' }) } else { localStorage.setItem('token', data.token); navigate('/dashboard') }
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to continue') } finally { setBusy(false) }
  }

  return <main className="relative min-h-screen bg-slate-50 p-4 sm:p-8"><div className="absolute right-5 top-5"><ThemeToggle /></div><div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_0.9fr]">
    <section className="relative hidden overflow-hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" /><div className="relative"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Box size={20} /></span><span className="text-sm font-semibold tracking-wide">AV Gear</span></div><div className="mt-24 max-w-md"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">Equipment Rental Management</p><h1 className="mt-5 text-4xl font-bold leading-tight">Reserve gear with confidence.</h1><p className="mt-5 text-base leading-7 text-blue-100">Manage college equipment, check availability, and return gear on time.</p></div></div><p className="relative text-sm text-blue-100">A clearer way to keep every production moving.</p></section>
    <section className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-sm"><Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-900 lg:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"><Box size={16} /></span>Equipment Rental</Link><div className="mt-10 lg:mt-0"><p className="text-sm font-semibold text-blue-600">{mode === 'login' ? 'Welcome back' : 'Get started'}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Access your reservations and equipment workspace.' : 'Join the equipment desk in less than a minute.'}</p></div>{success && <div className="mt-6"><Alert type="success">{success}</Alert></div>}{error && <div className="mt-6"><Alert>{error}</Alert></div>}<form onSubmit={submit} className="mt-7 space-y-4">{mode === 'register' && <label className="block text-sm font-medium text-slate-700">Full name<div className="relative"><UserRound size={17} className="absolute left-3 top-3 text-slate-400" /><input required name="name" value={form.name} onChange={updateField} className={`${inputClass} pl-10`} placeholder="Alex Johnson" /></div></label>}<label className="block text-sm font-medium text-slate-700">Email address<div className="relative"><Mail size={17} className="absolute left-3 top-3 text-slate-400" /><input required type="email" name="email" value={form.email} onChange={updateField} className={`${inputClass} pl-10`} placeholder="you@college.edu" /></div></label><label className="block text-sm font-medium text-slate-700">Password<div className="relative"><LockKeyhole size={17} className="absolute left-3 top-3 text-slate-400" /><input required minLength="6" type="password" name="password" value={form.password} onChange={updateField} className={`${inputClass} pl-10`} placeholder="At least 6 characters" /></div></label><button disabled={busy} className={`${buttonStyles.primary} mt-2 w-full`}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></button></form><p className="mt-7 text-center text-sm text-slate-500">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-blue-600 hover:text-blue-700">{mode === 'login' ? 'Register' : 'Sign in'}</button></p></div></section>
  </div></main>
}

export default AuthPage
