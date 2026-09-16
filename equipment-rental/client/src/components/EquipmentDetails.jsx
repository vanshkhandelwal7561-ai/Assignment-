import { ArrowLeft, Banknote, Clock3, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import BookingForm from './BookingForm'
import { Alert, Card, LoadingState } from './ui'

function EquipmentDetails() {
  const { id } = useParams()
  const [equipment, setEquipment] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get(`/equipment/${id}`).then(({ data }) => setEquipment(data.equipment)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load equipment')) }, [id])
  if (error) return <Alert>{error}</Alert>
  if (!equipment) return <LoadingState label="Loading equipment details" />
  return <section><Link to="/equipment" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft size={16} />Back to equipment</Link><div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]"><Card className="overflow-hidden"><div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 text-blue-200"><Package size={92} strokeWidth={1} /></div><div className="p-7"><div className="flex items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{equipment.category}</span>{equipment.isActive && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>}</div><h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{equipment.name}</h1><p className="mt-2 text-sm leading-6 text-slate-500">Reserve this equipment for your next campus production. Availability is checked against all overlapping reservations.</p><div className="mt-8 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3"><div><Package size={17} className="text-blue-600" /><p className="mt-3 text-xs text-slate-500">Total units</p><p className="mt-1 text-lg font-bold text-slate-900">{equipment.totalQuantity}</p></div><div><Banknote size={17} className="text-blue-600" /><p className="mt-3 text-xs text-slate-500">Deposit / unit</p><p className="mt-1 text-lg font-bold text-slate-900">₹{equipment.depositPerUnit}</p></div><div><Clock3 size={17} className="text-blue-600" /><p className="mt-3 text-xs text-slate-500">Late fee / day</p><p className="mt-1 text-lg font-bold text-slate-900">₹{equipment.dailyLateFee}</p></div></div></div></Card><BookingForm equipment={equipment} /></div></section>
}

export default EquipmentDetails
