import { AlertTriangle, CalendarDays, PackageOpen, RotateCcw, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Alert, Card, EmptyState, LoadingState, Modal, PageHeader, StatusBadge } from './ui'
import { buttonStyles } from './uiStyles'

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const isOverdue = (rental) => !rental.actualReturnDate && new Date(rental.expectedReturnDate) < startOfToday()
const getStatus = (rental) => rental.actualReturnDate ? 'RETURNED' : isOverdue(rental) ? 'OVERDUE' : rental.status
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const getLateDays = (rental) => {
  if (!rental.actualReturnDate) return 0
  const actual = new Date(rental.actualReturnDate)
  const expected = new Date(rental.expectedReturnDate)
  actual.setHours(0, 0, 0, 0)
  expected.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((actual - expected) / (24 * 60 * 60 * 1000)))
}

function RentalRow({ rental, onReturn, onTransfer }) {
  const status = getStatus(rental)
  const canReturn = ['BOOKED', 'ACTIVE', 'OVERDUE'].includes(status)
  return <>
    <div className="hidden grid-cols-[1.4fr_0.5fr_1fr_1fr_0.7fr_0.8fr] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid">
      <div><p className="text-sm font-semibold text-slate-900">{rental.equipment?.name || 'Equipment'}</p><p className="mt-0.5 text-xs text-slate-500">{rental.equipment?.category}</p></div>
      <span className="text-sm text-slate-600">{rental.quantity}</span>
      <span className="text-sm text-slate-600">{formatDate(rental.startDate)}</span>
      <span className="text-sm text-slate-600">{formatDate(rental.expectedReturnDate)}</span>
      <StatusBadge status={status} />
      <span className="flex justify-end gap-3 text-right">{canReturn && <><button type="button" onClick={() => onTransfer(rental)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Transfer</button><button type="button" onClick={() => onReturn(rental)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Return</button></>}</span>
    </div>
    <div className="border-b border-slate-100 p-5 last:border-0 sm:hidden">
      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{rental.equipment?.name || 'Equipment'}</p><p className="mt-1 text-xs text-slate-500">{rental.quantity} unit(s) · {rental.equipment?.category}</p></div><StatusBadge status={status} /></div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Rental period</p><p className="mt-1 text-slate-700">{formatDate(rental.startDate)} – {formatDate(rental.expectedReturnDate)}</p></div><div><p className="text-xs text-slate-500">Deposit</p><p className="mt-1 text-slate-700">₹{rental.depositAmount}</p></div></div>
      {canReturn && <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => onTransfer(rental)} className={buttonStyles.secondary}><UserRound size={15} />Transfer loan</button><button type="button" onClick={() => onReturn(rental)} className={buttonStyles.secondary}><RotateCcw size={15} />Return equipment</button></div>}
    </div>
  </>
}

function RentalDetails({ rental }) {
  if (!rental.actualReturnDate && !rental.transferHistory?.length) return null
  const lateDays = getLateDays(rental)
  return <div className="mt-3 space-y-4">{rental.actualReturnDate && <div className="grid gap-3 rounded-lg bg-emerald-50 p-4 text-sm sm:grid-cols-4"><div><p className="text-xs text-emerald-700/70">Actual return</p><p className="mt-1 font-semibold text-emerald-800">{formatDate(rental.actualReturnDate)}</p></div><div><p className="text-xs text-emerald-700/70">Late days</p><p className="mt-1 font-semibold text-emerald-800">{lateDays}</p></div><div><p className="text-xs text-emerald-700/70">Late fee</p><p className="mt-1 font-semibold text-emerald-800">₹{rental.lateFee}</p></div><div><p className="text-xs text-emerald-700/70">Refundable</p><p className="mt-1 font-semibold text-emerald-800">₹{rental.refundableAmount}</p></div></div>}{rental.transferHistory?.length > 0 && <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm"><p className="font-semibold text-slate-800">Transfer history</p><div className="mt-3 space-y-2">{rental.transferHistory.map((transfer, index) => <p key={`${transfer.transferredAt}-${index}`} className="text-slate-500">{transfer.fromUser?.name || 'Previous borrower'} <span className="mx-1 text-slate-300">→</span> {transfer.toUser?.name || 'New borrower'} <span className="ml-2 text-xs text-slate-400">{formatDate(transfer.transferredAt)}</span></p>)}</div></div>}</div>
}

function MyRentals({ user }) {
  const [rentals, setRentals] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [returnError, setReturnError] = useState('')
  const [returnResult, setReturnResult] = useState(null)
  const [pendingReturn, setPendingReturn] = useState(null)
  const [returning, setReturning] = useState(false)
  const [pendingTransfer, setPendingTransfer] = useState(null)
  const [borrowerSearch, setBorrowerSearch] = useState('')
  const [borrowers, setBorrowers] = useState([])
  const [selectedBorrower, setSelectedBorrower] = useState(null)
  const [transferError, setTransferError] = useState('')
  const [transferSuccess, setTransferSuccess] = useState('')
  const [transferring, setTransferring] = useState(false)

  const loadRentals = () => {
    api.get('/rentals/my')
      .then(({ data }) => setRentals(data.rentals))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load rentals'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadRentals() }, [])
  useEffect(() => {
    if (!pendingTransfer) return
    api.get('/auth/users', { params: { search: borrowerSearch } })
      .then(({ data }) => setBorrowers(data.users.filter((user) => String(user._id) !== String(pendingTransfer.user))))
      .catch(() => setTransferError('Unable to search registered borrowers'))
  }, [borrowerSearch, pendingTransfer])

  const visibleRentals = useMemo(() => filter === 'ALL' ? rentals : rentals.filter((rental) => getStatus(rental) === filter), [filter, rentals])
  const confirmReturn = async () => {
    if (!pendingReturn) return
    setReturning(true)
    setReturnError('')
    try {
      const { data } = await api.post(`/rentals/${pendingReturn._id}/return`)
      setReturnResult(data)
      setPendingReturn(null)
      loadRentals()
    } catch (requestError) {
      setReturnError(requestError.response?.data?.message || 'Unable to return equipment')
    } finally { setReturning(false) }
  }
  const openTransfer = (rental) => {
    setPendingTransfer(rental)
    setBorrowerSearch('')
    setSelectedBorrower(null)
    setTransferError('')
    setTransferSuccess('')
  }
  const confirmTransfer = async () => {
    if (!pendingTransfer || !selectedBorrower) return
    setTransferring(true)
    setTransferError('')
    try {
      await api.post(`/rentals/${pendingTransfer._id}/transfer`, { newBorrowerId: selectedBorrower._id })
      setPendingTransfer(null)
      setTransferSuccess('Loan transferred successfully.')
      loadRentals()
    } catch (requestError) {
      setTransferError(requestError.response?.data?.message || 'Unable to transfer loan')
    } finally { setTransferring(false) }
  }

  if (loading) return <LoadingState label="Loading your rentals" />
  return <section>
    <PageHeader eyebrow="Borrowing" title="My Rentals" description="Track your current and previous equipment reservations." actions={<Link to="/equipment" className={buttonStyles.primary}><PackageOpen size={16} />Browse equipment</Link>} />
    {returnResult && <div className="mb-5"><Alert type="success" onClose={() => setReturnResult(null)}><span className="font-semibold">Returned successfully.</span> Deposit ₹{returnResult.depositAmount} · Late fee ₹{returnResult.lateFee} · Refundable ₹{returnResult.refundableAmount}</Alert></div>}
    {returnError && <div className="mb-5"><Alert onClose={() => setReturnError('')}>{returnError}</Alert></div>}
    {transferSuccess && <div className="mb-5"><Alert type="success" onClose={() => setTransferSuccess('')}>{transferSuccess}</Alert></div>}
    {error && <Alert>{error}</Alert>}
    <div className="mb-5 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">{['ALL', 'ACTIVE', 'BOOKED', 'OVERDUE', 'RETURNED'].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${filter === item ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}</button>)}</div>
    {visibleRentals.length === 0 ? <EmptyState icon={CalendarDays} title={filter === 'ALL' ? 'No rentals yet' : `No ${filter.toLowerCase()} rentals`} description="Browse available equipment to make your first reservation." action={<Link to="/equipment" className={buttonStyles.primary}>Browse equipment</Link>} /> : <>
      {visibleRentals.some((rental) => isOverdue(rental)) && <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertTriangle size={17} />Some equipment is overdue. Please arrange a return.</div>}
      <Card className="overflow-hidden"><div className="hidden grid-cols-[1.4fr_0.5fr_1fr_1fr_0.7fr_0.8fr] gap-3 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid"><span>Equipment</span><span>Qty</span><span>Start</span><span>Return date</span><span>Status</span><span className="text-right">Action</span></div>{visibleRentals.map((rental) => <div key={rental._id}><RentalRow rental={rental} onReturn={setPendingReturn} onTransfer={openTransfer} /><div className="px-5 pb-4"><RentalDetails rental={rental} /></div></div>)}</Card>
    </>}
    {pendingReturn && <Modal title={`Return ${pendingReturn.equipment?.name || 'equipment'}?`} onClose={() => !returning && setPendingReturn(null)} footer={<><button type="button" onClick={() => setPendingReturn(null)} disabled={returning} className={buttonStyles.secondary}>Keep rental</button><button type="button" onClick={confirmReturn} disabled={returning} className={buttonStyles.primary}>{returning ? 'Processing...' : 'Confirm return'}</button></>}><p className="text-sm text-slate-600">Confirm that you are returning this reservation.</p><dl className="mt-5 space-y-3 rounded-lg bg-slate-50 p-4 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Quantity</dt><dd className="font-semibold text-slate-900">{pendingReturn.quantity} unit(s)</dd></div><div className="flex justify-between"><dt className="text-slate-500">Expected return</dt><dd className="font-semibold text-slate-900">{formatDate(pendingReturn.expectedReturnDate)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Deposit</dt><dd className="font-semibold text-slate-900">₹{pendingReturn.depositAmount}</dd></div></dl></Modal>}
    {pendingTransfer && <Modal title="Transfer equipment" onClose={() => !transferring && setPendingTransfer(null)} footer={<><button type="button" onClick={() => setPendingTransfer(null)} disabled={transferring} className={buttonStyles.secondary}>Cancel</button><button type="button" onClick={confirmTransfer} disabled={transferring || !selectedBorrower} className={buttonStyles.primary}>{transferring ? 'Transferring...' : 'Transfer loan'}</button></>}><div className="space-y-4 text-sm"><dl className="space-y-2 rounded-lg bg-slate-50 p-4"><div className="flex justify-between"><dt className="text-slate-500">Current borrower</dt><dd className="font-semibold text-slate-900">{user?.name || 'You'}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Equipment</dt><dd className="font-semibold text-slate-900">{pendingTransfer.equipment?.name}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Quantity</dt><dd className="font-semibold text-slate-900">{pendingTransfer.quantity}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Due date</dt><dd className="font-semibold text-slate-900">{formatDate(pendingTransfer.expectedReturnDate)}</dd></div></dl><label className="block font-medium text-slate-700">Select new borrower<div className="relative mt-1.5"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={borrowerSearch} onChange={(event) => { setBorrowerSearch(event.target.value); setSelectedBorrower(null) }} placeholder="Search by name or email" className="block h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div></label>{transferError && <Alert>{transferError}</Alert>}<div className="max-h-40 space-y-1 overflow-y-auto">{borrowers.map((borrower) => <button key={borrower._id} type="button" onClick={() => setSelectedBorrower(borrower)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${selectedBorrower?._id === borrower._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}><span><span className="block text-sm font-semibold text-slate-900">{borrower.name}</span><span className="block text-xs text-slate-500">{borrower.email}</span></span>{selectedBorrower?._id === borrower._id && <span className="text-xs font-semibold text-blue-700">Selected</span>}</button>)}{borrowerSearch && borrowers.length === 0 && <p className="py-3 text-xs text-slate-500">No registered borrowers found.</p>}</div></div></Modal>}
  </section>
}

export default MyRentals
