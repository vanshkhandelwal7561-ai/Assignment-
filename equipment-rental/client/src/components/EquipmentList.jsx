import { Filter, PackageOpen, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Alert, Card, EmptyState, LoadingState, PageHeader } from './ui'
import { buttonStyles, inputClass } from './uiStyles'

function EquipmentList() {
  const [equipment, setEquipment] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/equipment').then(({ data }) => setEquipment(data.equipment)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load equipment')).finally(() => setLoading(false)) }, [])
  const categories = useMemo(() => [...new Set(equipment.map((item) => item.category))].sort(), [equipment])
  const filtered = equipment.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()) && (category === 'all' || item.category === category))

  if (loading) return <LoadingState label="Loading equipment" />
  if (error) return <Alert>{error}</Alert>

  return <section><PageHeader eyebrow="Inventory" title="Equipment" description="Browse and reserve available college equipment." actions={<span className="text-sm text-slate-500">{equipment.length} equipment types</span>} /><div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search equipment" className={`${inputClass} pl-10`} /></div><div className="relative sm:w-56"><Filter size={16} className="absolute left-3 top-3 text-slate-400" /><select value={category} onChange={(event) => setCategory(event.target.value)} className={`${inputClass} appearance-none pl-9`}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>{filtered.length === 0 ? <EmptyState icon={PackageOpen} title={equipment.length ? 'No matching equipment' : 'No equipment available'} description={equipment.length ? 'Try a different search or category.' : 'There is no active equipment in the inventory yet.'} action={equipment.length > 0 && <button type="button" onClick={() => { setSearch(''); setCategory('all') }} className={buttonStyles.secondary}>Clear filters</button>} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item._id} className="flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item.category}</span><h2 className="mt-4 text-lg font-bold text-slate-900">{item.name}</h2></div><span className={`text-xs font-semibold ${item.availableQuantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.availableQuantity > 0 ? 'Available' : 'Unavailable'}</span></div><div className="mt-6 grid grid-cols-2 gap-y-4 text-sm"><div><p className="text-xs text-slate-500">Available</p><p className="mt-1 font-semibold text-slate-900">{item.availableQuantity} <span className="font-normal text-slate-400">/ {item.totalQuantity} units</span></p></div><div><p className="text-xs text-slate-500">Deposit</p><p className="mt-1 font-semibold text-slate-900">₹{item.depositPerUnit} <span className="font-normal text-slate-400">/ unit</span></p></div><div><p className="text-xs text-slate-500">Late fee</p><p className="mt-1 font-semibold text-slate-900">₹{item.dailyLateFee} <span className="font-normal text-slate-400">/ day</span></p></div></div><Link to={`/equipment/${item._id}`} className={`${buttonStyles.secondary} mt-6 w-full`}>View details</Link></Card>)}</div>}</section>
}

export default EquipmentList
