'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon,
  CurrencyRupeeIcon,
  BriefcaseIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [matters, setMatters] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({ subject: '', message: '', request_type: 'general' })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/clientportal/login')
    } else {
      setUser(user)
      await fetchClientData(user.email)
    }
    setLoading(false)
  }

  async function fetchClientData(email: string) {
    const { data } = await supabase.from('clients').select('id, name, email, phone, address').eq('email', email).single()
    if (data) {
      setClientData(data)
      await Promise.all([
        fetchMatters(data.id),
        fetchInvoices(data.id),
        fetchDocuments(data.id),
        fetchRequests(data.id)
      ])
    }
  }

  async function fetchMatters(clientId: string) {
    const { data } = await supabase
      .from('matters')
      .select('id, matter_number, title, status, created_at, description')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (data) setMatters(data)
  }

  async function fetchInvoices(clientId: string) {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, status, invoice_date, due_date')
      .eq('client_id', clientId)
      .order('invoice_date', { ascending: false })
    if (data) setInvoices(data)
  }

  async function fetchDocuments(clientId: string) {
    const { data } = await supabase
      .from('documents')
      .select('id, title, description, file_name, file_url, upload_date, document_categories(name, color)')
      .eq('client_id', clientId)
      .order('upload_date', { ascending: false })
    if (data) setDocuments(data)
  }

  async function fetchRequests(clientId: string) {
    const { data } = await supabase
      .from('client_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!clientData) return

    const { error } = await supabase.from('client_requests').insert([{
      client_id: clientData.id,
      subject: requestForm.subject,
      message: requestForm.message,
      request_type: requestForm.request_type,
      status: 'pending'
    }])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Request submitted successfully!')
      setShowRequestModal(false)
      setRequestForm({ subject: '', message: '', request_type: 'general' })
      fetchRequests(clientData.id)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/clientportal/login')
  }

  const downloadPDF = async (invoice: any) => {
    // Create a simple HTML invoice for download
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
      </style>
      </head>
      <body>
        <div class="header">
          <h1>HLAPL LEGAL</h1>
          <p>Hashmi Law Associates Pvt. Ltd.</p>
          <h2>TAX INVOICE</h2>
        </div>
        <div class="invoice-details">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody><tr><td>Legal Services</td><td>₹${invoice.total_amount.toLocaleString()}</td></tr></tbody>
        </table>
        <div class="total">Total Amount: ₹${invoice.total_amount.toLocaleString()}</div>
        <hr />
        <p><small>For any queries, contact: accounts@hlapl.com | +91 11 41040055</small></p>
      </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice_${invoice.invoice_number}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total_amount, 0)
  const activeMatters = matters.filter(m => m.status === 'active').length
  const recentDocuments = documents.slice(0, 5)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!clientData) return <div className="min-h-screen flex items-center justify-center">No client profile found</div>

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">HLAPL Client Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{clientData?.name}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {['dashboard', 'invoices', 'matters', 'documents', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-[#c9a84c] text-[#c9a84c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#c9a84c] to-[#d4a017] rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold">Welcome back, {clientData?.name}!</h2>
              <p className="mt-1 opacity-90">Your legal matters at a glance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active Matters</p><p className="text-2xl font-bold">{activeMatters}</p></div><BriefcaseIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
              <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Invoices</p><p className="text-2xl font-bold">{invoices.length}</p></div><DocumentTextIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
              <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Outstanding Amount</p><p className="text-2xl font-bold text-orange-600">₹{totalOutstanding.toLocaleString()}</p></div><CurrencyRupeeIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
              <div className="bg-white rounded-xl p-6 shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Documents</p><p className="text-2xl font-bold">{documents.length}</p></div><FolderIcon className="h-8 w-8 text-[#c9a84c]" /></div></div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="text-lg font-semibold">Recent Invoices</h3><button onClick={() => setActiveTab('invoices')} className="text-sm text-[#c9a84c]">View all →</button></div>
              <div className="overflow-x-auto">
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="px-6 py-3 border-b flex justify-between items-center">
                    <div><p className="font-medium">{inv.invoice_number}</p><p className="text-sm text-gray-500">{new Date(inv.invoice_date).toLocaleDateString()}</p></div>
                    <div className="text-right"><p className="font-bold">₹{inv.total_amount.toLocaleString()}</p><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inv.status)}`}>{inv.status}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Matters */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="text-lg font-semibold">Active Matters</h3><button onClick={() => setActiveTab('matters')} className="text-sm text-[#c9a84c]">View all →</button></div>
              <div className="divide-y">
                {matters.slice(0, 3).map(m => (
                  <div key={m.id} className="px-6 py-3"><p className="font-medium">{m.title}</p><p className="text-sm text-gray-500">Matter #: {m.matter_number}</p><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(m.status)}`}>{m.status}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">All Invoices</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Invoice #</th><th className="px-6 py-3 text-left text-xs">Date</th><th className="px-6 py-3 text-left text-xs">Due Date</th><th className="px-6 py-3 text-left text-xs">Amount</th><th className="px-6 py-3 text-left text-xs">Status</th><th className="px-6 py-3 text-left text-xs">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-[#c9a84c]">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-bold">₹{inv.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button onClick={() => window.open(`/clientportal/invoice/${inv.id}`, '_blank')} className="text-blue-600 hover:text-blue-800"><EyeIcon className="h-5 w-5" /></button>
                        <button onClick={() => downloadPDF(inv)} className="text-green-600 hover:text-green-800"><ArrowDownTrayIcon className="h-5 w-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Matters Tab */}
        {activeTab === 'matters' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Your Matters</h3></div>
            <div className="divide-y">
              {matters.map(m => (
                <div key={m.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div><p className="font-semibold text-gray-900">{m.title}</p><p className="text-sm text-gray-500">Matter #: {m.matter_number}</p><p className="text-sm text-gray-600 mt-1">{m.description}</p></div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(m.status)}`}>{m.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500"><ClockIcon className="h-4 w-4" /> Created: {new Date(m.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Shared Documents</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {documents.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3"><FolderIcon className="h-8 w-8 text-[#c9a84c]" /><div><p className="font-medium">{doc.title}</p><p className="text-sm text-gray-500">{doc.file_name}</p></div></div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.description}</p>
                  <div className="mt-3 flex justify-between items-center"><span className="text-xs text-gray-400">{new Date(doc.upload_date).toLocaleDateString()}</span><a href={doc.file_url} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm">Download →</a></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-end"><button onClick={() => setShowRequestModal(true)} className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-5 w-5" /> New Request</button></div>
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Support Requests</h3></div>
              <div className="divide-y">
                {requests.map(req => (
                  <div key={req.id} className="px-6 py-4">
                    <div className="flex justify-between items-start"><div><p className="font-semibold">{req.subject}</p><p className="text-sm text-gray-600 mt-1">{req.message}</p></div><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(req.status)}`}>{req.status}</span></div>
                    <div className="mt-2 text-xs text-gray-400">Submitted: {new Date(req.created_at).toLocaleDateString()} • Type: {req.request_type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Submit Request</h2>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <select value={requestForm.request_type} onChange={e => setRequestForm({...requestForm, request_type: e.target.value})} className="w-full p-2 border rounded">
                <option value="general">General Inquiry</option><option value="document">Document Request</option><option value="billing">Billing Question</option><option value="legal">Legal Question</option>
              </select>
              <input type="text" placeholder="Subject" value={requestForm.subject} onChange={e => setRequestForm({...requestForm, subject: e.target.value})} className="w-full p-2 border rounded" required />
              <textarea placeholder="Message" rows={4} value={requestForm.message} onChange={e => setRequestForm({...requestForm, message: e.target.value})} className="w-full p-2 border rounded" required />
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-[#c9a84c] text-black py-2 rounded">Submit</button><button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
