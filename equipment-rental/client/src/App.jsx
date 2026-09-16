import { cloneElement, isValidElement, useEffect, useState } from 'react'
import { Box, ClipboardList, LayoutDashboard, LogOut, Menu, Package, UserRound, X } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import api from './api'
import AdminEquipment from './components/AdminEquipment'
import AllRentals from './components/AllRentals'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import EquipmentDetails from './components/EquipmentDetails'
import EquipmentList from './components/EquipmentList'
import MyRentals from './components/MyRentals'
import ThemeToggle from './components/ThemeToggle'
import { LoadingState } from './components/ui'

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/equipment', label: 'Equipment', icon: Package },
  { to: '/rentals', label: 'My Rentals', icon: ClipboardList },
]

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/equipment', label: 'Equipment Management', icon: Box },
  { to: '/admin/rentals', label: 'All Rentals', icon: ClipboardList },
]

function Sidebar({ user, onLogout, onNavigate }) {
  const location = useLocation()
  const links = user.role === 'ADMIN' ? adminLinks : userLinks
  return <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-[#27272A] dark:bg-[#09090B]">
    <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-3 pb-8"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><Box size={19} /></span><span><span className="block text-sm font-bold text-slate-900">AV Gear</span><span className="block text-xs text-slate-500">Equipment Rental Management</span></span></Link>
    <nav className="space-y-1" aria-label="Primary navigation">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
      {links.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
        return <Link key={to} to={to} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} />{label}</Link>
      })}
    </nav>
    <div className="mt-auto border-t border-slate-100 pt-4">
      <div className="flex items-center gap-3 px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span><span className="block text-xs text-slate-500">{user.role === 'ADMIN' ? 'Administrator' : 'Student borrower'}</span></span></div>
      <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"><LogOut size={18} />Log out</button>
    </div>
  </aside>
}

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))
  const [error, setError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); setError('Your session has expired. Please sign in again.') })
      .finally(() => setLoading(false))
  }, [])

  if (!localStorage.getItem('token')) return <Navigate to="/auth" replace />
  if (loading) return <main className="min-h-screen bg-slate-50 px-6 py-8"><LoadingState label="Loading your workspace" /></main>
  if (error || !user) return <main className="min-h-screen bg-slate-50 p-8 text-sm text-red-600">{error || 'Unable to load session.'} <Link className="font-semibold underline" to="/auth">Sign in</Link></main>

  const logout = () => { localStorage.removeItem('token'); navigate('/auth') }
  const content = isValidElement(children) ? cloneElement(children, { user }) : children
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090B] dark:text-[#FAFAFA]">
    <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar user={user} onLogout={logout} /></div>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
    <div className={`fixed inset-y-0 left-0 z-50 transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="relative h-full"><Sidebar user={user} onLogout={logout} onNavigate={() => setMobileOpen(false)} /><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div></div>
    <div className="lg:pl-72"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur dark:border-[#27272A] dark:bg-[#111113]/95 sm:px-8 lg:px-10"><button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-[#A1A1AA] dark:hover:bg-[#18181B] lg:hidden"><Menu size={21} /></button><div className="hidden lg:block"><p className="text-sm font-semibold text-slate-900 dark:text-[#FAFAFA]">{user.role === 'ADMIN' ? 'Administration' : 'Borrower workspace'}</p><p className="text-xs text-slate-500 dark:text-[#71717A]">{location.pathname.includes('equipment') ? 'Equipment' : location.pathname.includes('rentals') ? 'Rentals' : 'Dashboard'}</p></div><div className="ml-auto flex items-center gap-3"><ThemeToggle /><span className="hidden text-sm text-slate-500 dark:text-[#A1A1AA] sm:block">{user.email}</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-[#172033] dark:text-blue-400">{user.name?.charAt(0).toUpperCase()}</span></div></header><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{content}</main></div>
  </div>
}

function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
    <Route path="/equipment" element={<Layout><EquipmentList /></Layout>} />
    <Route path="/equipment/:id" element={<Layout><EquipmentDetails /></Layout>} />
    <Route path="/rentals" element={<Layout><MyRentals /></Layout>} />
    <Route path="/admin/equipment" element={<Layout><AdminEquipment /></Layout>} />
    <Route path="/admin/rentals" element={<Layout><AllRentals /></Layout>} />
  </Routes>
}

export default App
