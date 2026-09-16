import { AlertTriangle, ArrowRight, Box, CalendarDays, CheckCircle2, ClipboardList, Package, Plus, RotateCcw, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Alert, Card, EmptyState, LoadingState, PageHeader, StatusBadge } from './ui'
import { buttonStyles } from './uiStyles'

const startOfToday = () => { const date = new Date(); date.setHours(0, 0, 0, 0); return date }
const isOverdue = (rental) => !rental.actualReturnDate && new Date(rental.expectedReturnDate) < startOfToday()
const isUpcoming = (rental) => !rental.actualReturnDate && !isOverdue(rental) && new Date(rental.expectedReturnDate) >= startOfToday()

function MetricCard({ icon: Icon, label, value, supporting, tone = 'blue' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', indigo: 'bg-indigo-50 text-indigo-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', emerald: 'bg-emerald-50 text-emerald-600' }
  return <Card className="p-5"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[tone]}`}><Icon size={19} /></span><span className="text-xs font-medium text-slate-400">Today</span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-sm font-medium text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-500">{supporting}</p></Card>
}

function ReturnList({ rentals, admin = false }) {
  if (!rentals.length) return <EmptyState icon={CalendarDays} title="No upcoming returns" description={admin ? 'All current reservations are clear.' : 'Browse available equipment to make your first reservation.'} action={!admin && <Link to="/equipment" className={buttonStyles.secondary}>Browse equipment</Link>} />
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden grid-cols-[1.4fr_0.6fr_1fr_0.8fr] border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid"><span>Equipment</span><span>Qty</span><span>Return date</span><span>Status</span></div>{rentals.slice(0, 5).map((rental) => <div key={rental._id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_0.6fr_1fr_0.8fr] sm:items-center"><div><p className="text-sm font-semibold text-slate-900">{rental.equipment?.name || 'Equipment'}</p>{admin && <p className="mt-0.5 text-xs text-slate-500">{rental.user?.name || rental.user?.email}</p>}</div><span className="text-sm text-slate-600">{rental.quantity}</span><span className="text-sm text-slate-600">{new Date(rental.expectedReturnDate).toLocaleDateString()}</span><span><StatusBadge status={isOverdue(rental) ? 'OVERDUE' : rental.status} /></span></div>)}</div>
}

function Dashboard({ user }) {
  const [equipment, setEquipment] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { const requests = user.role === 'ADMIN' ? Promise.all([api.get('/equipment?includeInactive=true'), api.get('/rentals')]) : Promise.all([api.get('/equipment'), api.get('/rentals/my')]); requests.then(([equipmentResponse, rentalsResponse]) => { setEquipment(equipmentResponse.data.equipment); setRentals(rentalsResponse.data.rentals) }).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load dashboard')).finally(() => setLoading(false)) }, [user.role])
  if (loading) return <LoadingState label="Loading your dashboard" />
  if (error) return <Alert>{error}</Alert>

  const activeRentals = rentals.filter((rental) => ['BOOKED', 'ACTIVE'].includes(rental.status)).length
  const overdueRentals = rentals.filter(isOverdue).length
  const upcomingReturns = rentals.filter(isUpcoming).sort((a, b) => new Date(a.expectedReturnDate) - new Date(b.expectedReturnDate))

  if (user.role === 'ADMIN') return <><PageHeader eyebrow="Admin overview" title="Dashboard" description="Keep the AV room organized and every reservation accounted for." actions={<Link to="/admin/equipment" className={buttonStyles.primary}><Plus size={16} />Add equipment</Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard icon={Package} label="Total equipment" value={equipment.length} supporting="Active and inactive types" /><MetricCard icon={BoxIcon} label="Total units" value={equipment.reduce((sum, item) => sum + item.totalQuantity, 0)} supporting="Physical units tracked" tone="indigo" /><MetricCard icon={CheckCircle2} label="Available units" value={equipment.filter((item) => item.isActive).reduce((sum, item) => sum + item.availableQuantity, 0)} supporting="Ready to reserve" tone="emerald" /><MetricCard icon={Users} label="Active rentals" value={activeRentals} supporting="Booked or in use" tone="amber" /><MetricCard icon={AlertTriangle} label="Overdue rentals" value={overdueRentals} supporting="Need attention" tone="red" /></div><section className="mt-10"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Recent rentals</h2><p className="mt-1 text-sm text-slate-500">The latest activity across the equipment room.</p></div><Link to="/admin/rentals" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">View all <ArrowRight size={15} /></Link></div><ReturnList rentals={rentals} admin /></section></>

  return <><PageHeader eyebrow="Borrower workspace" title={`Good morning, ${user.name?.split(' ')[0] || 'there'}`} description="Manage your equipment rentals and returns." actions={<Link to="/equipment" className={buttonStyles.primary}><Package size={16} />Browse equipment</Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={Package} label="Available equipment" value={equipment.length} supporting="Types ready to reserve" /><MetricCard icon={ClipboardIcon} label="Active rentals" value={activeRentals} supporting="Currently on your account" tone="indigo" /><MetricCard icon={CalendarDays} label="Upcoming returns" value={upcomingReturns.length} supporting="Plan your handoffs" tone="amber" /><MetricCard icon={AlertTriangle} label="Overdue" value={overdueRentals} supporting="Needs your attention" tone="red" /></div><section className="mt-10"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Upcoming returns</h2><p className="mt-1 text-sm text-slate-500">Stay ahead of your return dates.</p></div><Link to="/rentals" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">My rentals <ArrowRight size={15} /></Link></div><ReturnList rentals={upcomingReturns} /></section><section className="mt-8 grid gap-4 sm:grid-cols-2"><Link to="/equipment" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Package size={19} /></span><h3 className="mt-4 font-semibold text-slate-900">Browse equipment</h3><p className="mt-1 text-sm text-slate-500">Find cameras, projectors and more.</p><ArrowRight size={17} className="mt-4 text-blue-600 transition group-hover:translate-x-1" /></Link><Link to="/rentals" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><RotateCcw size={19} /></span><h3 className="mt-4 font-semibold text-slate-900">Review my rentals</h3><p className="mt-1 text-sm text-slate-500">Track returns, deposits and late fees.</p><ArrowRight size={17} className="mt-4 text-indigo-600 transition group-hover:translate-x-1" /></Link></section></>
}

function BoxIcon(props) { return <Box {...props} /> }
function ClipboardIcon(props) { return <ClipboardList {...props} /> }

export default Dashboard
