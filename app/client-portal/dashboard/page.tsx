'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { DocumentTextIcon, CurrencyRupeeIcon, BriefcaseIcon, ArrowRightOnRectangleIcon, EyeIcon } from '@heroicons/react/24/outline'

export default function ClientDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [matters, setMatters] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/client-portal/login')
    } else {
      setUser(user)
      await fetchClientData(user.email)
    }
    setLoading(false)
  }

  async function fetchClientData(email: string) {
    const { data } = await supabase.from('clients').select('id, name, email, phone').eq('email', email).single()
    if (data) {
      setClientData(data)
      await fetchMatters(data.id)
      await fetchInvoices(data.id)
    }
  }

  async function fetchMatters(clientId: string) {
    const { data } = await supabase.from('matters').select('id, matter_number, title, status, created_at').eq('client_id', clientId).order('created_at', { ascending: false })
    if (data) setMatters(data)
  }

  async function fetchInvoices(clientId: string) {
    const { data } = await supabase.from('invoices').select('id, invoice_number, total_amount, status, invoice_date, due_date').eq('client_id', clientId).order('invoice_date', { ascending: false })
    if (data) setInvoices(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/client-portal/login')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-2">No Client Profile Found</h2>
          <p className="text-gray-600 mb-4">Your email is not linked to any client record.</p>
          <button onClick={handleLogout} className="bg-[#c9a84c] text-black px-4 py-2 rounded">Logout</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center"><h1 className="text-xl font-bold text-gray-900">HLAPL Client Portal</h1></div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{clientData?.name}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"><ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#c9a84c] to-[#d4a017] rounded-xl p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold">Welcome back, {clientData?.name}!</h2>
          <p className="mt-1 opacity-90">View your legal matters, invoices, and case updates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Matters</p><p className="text-2xl font-bold">{matters.length}</p></div><BriefcaseIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
          <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Invoices</p><p className="text-2xl font-bold">{invoices.length}</p></div><DocumentTextIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
          <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Amount</p><p className="text-2xl font-bold text-green-600">₹{invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}</p></div><CurrencyRupeeIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Your Matters</h3></div>
          <div className="overflow-x-auto">
            {matters.length === 0 ? <div className="text-center py-8 text-gray-500">No matters found.</div> : (
              <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Matter #</th><th className="px-6 py-3 text-left text-xs">Title</th><th className="px-6 py-3 text-left text-xs">Status</th><th className="px-6 py-3 text-left text-xs">Created</th></tr></thead>
              <tbody>{matters.map(m => (<tr key={m.id} className="border-t"><td className="px-6 py-4 text-sm font-medium text-[#c9a84c]">{m.matter_number}</td><td className="px-6 py-4 text-sm">{m.title}</td><td className="px-6 py-4 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{m.status}</span></td><td className="px-6 py-4 text-sm">{new Date(m.created_at).toLocaleDateString()}</td></tr>))}</tbody></table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Your Invoices</h3></div>
          <div className="overflow-x-auto">
            {invoices.length === 0 ? <div className="text-center py-8 text-gray-500">No invoices found.</div> : (
              <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Invoice #</th><th className="px-6 py-3 text-left text-xs">Date</th><th className="px-6 py-3 text-left text-xs">Due Date</th><th className="px-6 py-3 text-left text-xs">Amount</th><th className="px-6 py-3 text-left text-xs">Status</th><th className="px-6 py-3 text-left text-xs">Action</th></tr></thead>
              <tbody>{invoices.map(inv => (<tr key={inv.id} className="border-t"><td className="px-6 py-4 text-sm font-medium text-[#c9a84c]">{inv.invoice_number}</td><td className="px-6 py-4 text-sm">{new Date(inv.invoice_date).toLocaleDateString()}</td><td className="px-6 py-4 text-sm">{new Date(inv.due_date).toLocaleDateString()}</td><td className="px-6 py-4 text-sm font-medium">₹{inv.total_amount.toLocaleString()}</td><td className="px-6 py-4 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(inv.status)}`}>{inv.status}</span></td><td className="px-6 py-4 text-sm"><a href={`/client-portal/invoice/${inv.id}`} className="text-blue-600 hover:text-blue-800"><EyeIcon className="h-5 w-5 inline" /></a></td></tr>))}</tbody></table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
