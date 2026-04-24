'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserType = {
  id: string
  email: string
}

export default function InvoicesPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [matters, setMatters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    client_id: '',
    matter_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    items: [{ description: 'Legal Services', quantity: 1, unit_price: 0, tax_rate: 18 }]
  })

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    } else {
      setUser({ id: user.id, email: user.email || '' })
      fetchInvoices()
      fetchClients()
    }
  }

  async function fetchInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (name),
        matters (title, matter_type)
      `)
      .order('created_at', { ascending: false })
    if (data) {
      console.log('Fetched invoices:', data)
      setInvoices(data)
    }
    setLoading(false)
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name')
    if (data) setClients(data)
  }

  async function fetchMatters(clientId: string) {
    if (!clientId) {
      setMatters([])
      return
    }
    const { data } = await supabase
      .from('matters')
      .select('id, title, matter_type, matter_number')
      .eq('client_id', clientId)
      .eq('status', 'active')
    if (data) setMatters(data)
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.client_id) {
      alert('Please select a client')
      return
    }
    
    let subtotal = 0
    let taxAmount = 0
    
    formData.items.forEach(item => {
      const itemAmount = item.quantity * item.unit_price
      subtotal += itemAmount
      taxAmount += itemAmount * (item.tax_rate / 100)
    })
    
    const totalAmount = subtotal + taxAmount
    const invoiceNumber = `INV-${Date.now()}`
    
    let matterIdValue = null
    if (formData.matter_id && formData.matter_id !== '') {
      matterIdValue = formData.matter_id
    }
    
    const invoiceData = {
      invoice_number: invoiceNumber,
      client_id: formData.client_id,
      matter_id: matterIdValue,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'sent'
    }
    
    const { error } = await supabase.from('invoices').insert([invoiceData])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Invoice created successfully!')
      setShowModal(false)
      setFormData({
        client_id: '',
        matter_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        items: [{ description: 'Legal Services', quantity: 1, unit_price: 0, tax_rate: 18 }]
      })
      fetchInvoices()
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, tax_rate: 18 }]
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">HLAP Legal ERP</h1>
              <div className="hidden md:flex space-x-4">
                <a href="/dashboard" className="px-3 py-2 text-sm text-gray-700">Dashboard</a>
                <a href="/clients" className="px-3 py-2 text-sm text-gray-700">Clients</a>
                <a href="/matters" className="px-3 py-2 text-sm text-gray-700">Matters</a>
                <a href="/invoices" className="px-3 py-2 text-sm text-blue-600 border-b-2 border-blue-600">Invoices</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Invoices</h2>
            <p className="text-gray-600">Click on any invoice number to view details and print</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            + Create Invoice
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No invoices yet. Click "Create Invoice" to start.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-purple-600">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline cursor-pointer">
                          {inv.invoice_number}
                        </Link>
                       </td>
                      <td className="px-6 py-4 text-sm">{inv.clients?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {inv.matters?.title || '-'}
                        {inv.matters?.matter_type && (
                          <span className="ml-2 text-xs text-gray-500">({inv.matters.matter_type})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-medium">₹{inv.total_amount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl m-4 p-6">
            <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Client *</label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => {
                      setFormData({...formData, client_id: e.target.value, matter_id: ''})
                      fetchMatters(e.target.value)
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Select Matter (Optional)</label>
                  <select
                    value={formData.matter_id}
                    onChange={(e) => setFormData({...formData, matter_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!formData.client_id}
                  >
                    <option value="">-- No Matter (General Invoice) --</option>
                    {matters.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        [{m.matter_type || 'General'}] {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Date</label>
                  <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Invoice Items</label>
                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input type="text" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="col-span-5 px-3 py-2 border rounded-lg text-sm" />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))} className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                      <input type="number" placeholder="Rate (₹)" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value))} className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                      <select value={item.tax_rate} onChange={(e) => updateItem(idx, 'tax_rate', parseFloat(e.target.value))} className="col-span-2 px-3 py-2 border rounded-lg text-sm">
                        <option value="0">0% GST</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18">18% GST</option>
                      </select>
                      <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-600 hover:text-red-800">✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 hover:text-blue-800">+ Add Item</button>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Create Invoice</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
