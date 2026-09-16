import { AlertTriangle, ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api'
import { Alert, Card, EmptyState, LoadingState, PageHeader, StatusBadge } from './ui'

const isOverdue = (rental) => !rental.actualReturnDate && new Date(rental.expectedReturnDate) < new Date(new Date().setHours(0, 0, 0, 0))
const statusFor = (rental) => rental.actualReturnDate ? 'RETURNED' : isOverdue(rental) ? 'OVERDUE' : rental.status
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function AllRentals() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { api.get('/rentals').then(({ data }) => setRentals(data.rentals)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load rentals')).finally(() => setLoading(false)) }, [])
  return <section><PageHeader eyebrow="Administration" title="All Rentals" description="Monitor reservations, returns and overdue equipment." actions={<span className="text-sm text-slate-500">{rentals.length} total rentals</span>} />{error && <Alert>{error}</Alert>}{loading && <LoadingState label="Loading all rentals" />}{!loading && !error && rentals.length === 0 && <EmptyState icon={ClipboardList} title="No rentals yet" description="Reservations will appear here once students book equipment." />}{!loading && !error && rentals.length > 0 && <Card className="overflow-hidden"><div className="hidden grid-cols-[1.2fr_1.2fr_0.5fr_1fr_1fr_0.8fr] gap-3 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>User</span><span>Equipment</span><span>Qty</span><span>Return date</span><span>Status</span><span>Deposit</span></div>{rentals.map((rental) => <div key={rental._id} className="grid gap-3 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[1.2fr_1.2fr_0.5fr_1fr_1fr_0.8fr] md:items-center"><div><p className="text-sm font-semibold text-slate-900">{rental.user?.name || 'Unknown user'}</p><p className="mt-1 text-xs text-slate-500">{rental.user?.email}</p></div><div><p className="text-sm font-semibold text-slate-900">{rental.equipment?.name || 'Equipment'}</p><p className="mt-1 text-xs text-slate-500">{rental.equipment?.category}</p></div><span className="text-sm text-slate-600"><span className="mr-2 text-xs text-slate-500 md:hidden">Quantity</span>{rental.quantity}</span><span className="text-sm text-slate-600">{formatDate(rental.expectedReturnDate)}</span><span><StatusBadge status={statusFor(rental)} />{isOverdue(rental) && <span className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={13} />Needs return</span>}</span><span className="text-sm font-medium text-slate-700">₹{rental.depositAmount}</span></div>)}</Card>}</section>
}

export default AllRentals
