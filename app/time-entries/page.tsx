'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  PlusIcon,
  DocumentTextIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [matters, setMatters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    matter_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    hours: 1,
    description: '',
    hourly_rate: 5000,
    billable: true
  })

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      const { data: userData } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', user.email)
        .single()
      if (userData) {
        setUserRole(userData.role)
        setUserId(userData.id)
      }
      fetchTimeEntries(userData?.id, userData?.role)
      fetchMatters()
    }
  }

  async function fetchTimeEntries(currentUserId: string, role: string) {
    let query = supabase
      .from('time_entries')
      .select(`*, matters (title)`)
      .order('entry_date', { ascending: false })

    if (role !== 'super_admin' && role !== 'finance_head') {
      query = query.eq('lawyer_id', currentUserId)
    }

    const { data } = await query
    if (data) setEntries(data)
    setLoading(false)
  }

  async function fetchMatters() {
    const { data } = await supabase
      .from('matters')
      .select('id, title, matter_number, client_id')
      .eq('status', 'active')
      .limit(100)
    if (data) setMatters(data)
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault()
    const totalAmount = formData.hours * formData.hourly_rate

    const { error } = await supabase.from('time_entries').insert([{
      lawyer_id: userId,
      matter_id: formData.matter_id,
      entry_date: formData.entry_date,
      hours: formData.hours,
      description: formData.description,
      hourly_rate: formData.hourly_rate,
      total_amount: totalAmount,
      billable: formData.billable,
      status: 'pending'
    }])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Time entry created!')
      setShowModal(false)
      setFormData({
        matter_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        hours: 1,
        description: '',
        hourly_rate: 5000,
        billable: true
      })
      fetchTimeEntries(userId, userRole)
    }
  }

  async function handleApproveEntry(id: string, approve: boolean) {
    const status = approve ? 'approved' : 'rejected'
    const { error } = await supabase
      .from('time_entries')
      .update({ status: status })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Entry ${approve ? 'approved' : 'rejected'}!`)
      fetchTimeEntries(userId, userRole)
    }
  }

  async function handleBillToInvoice() {
    const approvedEntries = entries.filter(e => e.status === 'approved' && !e.invoice_id)
    
    if (approvedEntries.length === 0) {
      alert('No approved time entries to bill')
      return
    }

    const entriesByMatter = approvedEntries.reduce((acc: any, entry) => {
      if (!acc[entry.matter_id]) acc[entry.matter_id] = []
      acc[entry.matter_id].push(entry)
      return acc
    }, {})

    let invoicesCreated = 0

    for (const matterId in entriesByMatter) {
      const matterEntries = entriesByMatter[matterId]
      const matter = matters.find(m => m.id === matterId)
      if (!matter) continue

      let subtotal = 0
      matterEntries.forEach((entry: any) => {
        subtotal += entry.total_amount
      })

      const taxAmount = subtotal * 0.18
      const totalAmount = subtotal + taxAmount
      const invoiceNumber = `INV-TIME-${Date.now()}`

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          client_id: matter.client_id,
          matter_id: matterId,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'sent'
        }])
        .select()
        .single()

      if (invoiceError) continue

      for (const entry of matterEntries) {
        await supabase
          .from('time_entries')
          .update({ invoice_id: invoice.id })
          .eq('id', entry.id)
      }
      invoicesCreated++
    }

    alert(`${invoicesCreated} invoice(s) created!`)
    fetchTimeEntries(userId, userRole)
    router.push('/invoices')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canApprove = userRole === 'super_admin' || userRole === 'finance_head'
  const canBill = userRole === 'super_admin' || userRole === 'finance_head'

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time & Billing</h1>
            <p className="text-gray-500">Track billable hours</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg flex items-center gap-2">
            <PlusIcon className="h-5 w-5" /> Log Time
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Hours</p>
            <p className="text-2xl font-bold">{entries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{entries.filter(e => e.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-600">{entries.filter(e => e.status === 'approved' && !e.invoice_id).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Value</p>
            <p className="text-2xl font-bold">₹{entries.filter(e => e.status === 'approved').reduce((s, e) => s + (e.total_amount || 0), 0).toLocaleString()}</p>
          </div>
        </div>

        {canBill && entries.filter(e => e.status === 'approved' && !e.invoice_id).length > 0 && (
          <button onClick={handleBillToInvoice} className="bg-green-600 text-white px-4 py-2 rounded-lg">
            Generate Invoices ({entries.filter(e => e.status === 'approved' && !e.invoice_id).length} entries)
          </button>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs">Date</th>
                <th className="px-4 py-3 text-left text-xs">Matter</th>
                <th className="px-4 py-3 text-left text-xs">Description</th>
                <th className="px-4 py-3 text-left text-xs">Hours</th>
                <th className="px-4 py-3 text-left text-xs">Amount</th>
                <th className="px-4 py-3 text-left text-xs">Status</th>
                {canApprove && <th className="px-4 py-3 text-left text-xs">Action</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-3 text-sm">{new Date(entry.entry_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{entry.matters?.title || '-'}</td>
                  <td className="px-4 py-3 text-sm">{entry.description}</td>
                  <td className="px-4 py-3 text-sm">{entry.hours}h</td>
                  <td className="px-4 py-3 text-sm">₹{entry.total_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(entry.status)}`}>{entry.status}</span></td>
                  {canApprove && entry.status === 'pending' && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleApproveEntry(entry.id, true)} className="text-green-600 mr-2">✓</button>
                      <button onClick={() => handleApproveEntry(entry.id, false)} className="text-red-600">✗</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Log Time</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <select required value={formData.matter_id} onChange={e => setFormData({...formData, matter_id: e.target.value})} className="w-full p-2 border rounded">
                <option value="">Select Matter</option>
                {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <input type="date" value={formData.entry_date} onChange={e => setFormData({...formData, entry_date: e.target.value})} className="w-full p-2 border rounded" />
              <input type="number" step="0.5" placeholder="Hours" value={formData.hours} onChange={e => setFormData({...formData, hours: parseFloat(e.target.value)})} className="w-full p-2 border rounded" required />
              <textarea placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" required />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-[#c9a84c] text-black py-2 rounded">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
