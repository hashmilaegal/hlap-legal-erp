'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  PlusIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface Expense {
  id: string
  expense_number: string
  category_id: string
  matter_id: string
  expense_date: string
  amount: number
  gst_amount: number
  total_amount: number
  description: string
  receipt_url: string
  billable: boolean
  status: string
  expense_categories?: { name: string }
  matters?: { title: string }
}

interface Category {
  id: string
  name: string
}

interface Matter {
  id: string
  title: string
  matter_number: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    category_id: '',
    matter_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    amount: 0,
    gst_rate: 18,
    description: '',
    payment_method: 'cash',
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
      fetchExpenses()
      fetchCategories()
      fetchMatters()
    }
  }

  async function fetchExpenses() {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        expense_categories (name),
        matters (title)
      `)
      .order('expense_date', { ascending: false })

    const { data } = await query
    if (data) setExpenses(data)
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
    if (data) setCategories(data)
  }

  async function fetchMatters() {
    const { data } = await supabase
      .from('matters')
      .select('id, title, matter_number')
      .eq('status', 'active')
      .limit(100)
    if (data) setMatters(data)
  }

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault()
    
    const gstAmount = formData.amount * (formData.gst_rate / 100)
    const totalAmount = formData.amount + gstAmount
    const expenseNumber = `EXP-${Date.now()}`

    const { error } = await supabase.from('expenses').insert([{
      expense_number: expenseNumber,
      category_id: formData.category_id,
      matter_id: formData.matter_id || null,
      employee_id: userId,
      expense_date: formData.expense_date,
      amount: formData.amount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      description: formData.description,
      payment_method: formData.payment_method,
      billable: formData.billable,
      status: 'pending'
    }])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Expense claim submitted!')
      setShowModal(false)
      setFormData({
        category_id: '',
        matter_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: 0,
        gst_rate: 18,
        description: '',
        payment_method: 'cash',
        billable: true
      })
      fetchExpenses()
    }
  }

  async function handleApproveExpense(id: string, approve: boolean) {
    const status = approve ? 'approved' : 'rejected'
    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: status,
        approved_by: userId,
        approved_date: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Expense ${approve ? 'approved' : 'rejected'}!`)
      fetchExpenses()
    }
  }

  async function handleReimburse(id: string) {
    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'reimbursed',
        reimbursed_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Expense marked as reimbursed!')
      fetchExpenses()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'reimbursed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canApprove = userRole === 'super_admin' || userRole === 'finance_head'
  const canReimburse = userRole === 'super_admin' || userRole === 'finance_head'

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.total_amount, 0)
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.total_amount, 0)
  const totalReimbursed = expenses.filter(e => e.status === 'reimbursed').reduce((s, e) => s + e.total_amount, 0)

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
            <p className="text-gray-500">Track and manage firm expenses</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg flex items-center gap-2">
            <PlusIcon className="h-5 w-5" /> New Expense
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₹{expenses.reduce((s, e) => s + e.total_amount, 0).toLocaleString()}</p>
              </div>
              <CurrencyRupeeIcon className="h-8 w-8 text-[#c9a84c]" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">₹{totalApproved.toLocaleString()}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reimbursed</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalReimbursed.toLocaleString()}</p>
              </div>
              <CurrencyRupeeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Expense #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Matter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  {(canApprove || canReimburse) && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">No expenses yet. Click "New Expense" to add.</td></tr>
                ) : (
                  expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.expense_number}</td>
                      <td className="px-4 py-3 text-sm">{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{expense.expense_categories?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{expense.matters?.title || 'General'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{expense.description}</td>
                      <td className="px-4 py-3 text-sm font-medium">₹{expense.total_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      {(canApprove || canReimburse) && (
                        <td className="px-4 py-3">
                          {expense.status === 'pending' && canApprove && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApproveExpense(expense.id, true)} className="text-green-600 hover:text-green-800" title="Approve">✓</button>
                              <button onClick={() => handleApproveExpense(expense.id, false)} className="text-red-600 hover:text-red-800" title="Reject">✗</button>
                            </div>
                          )}
                          {expense.status === 'approved' && canReimburse && (
                            <button onClick={() => handleReimburse(expense.id)} className="text-blue-600 hover:text-blue-800 text-sm">Reimburse</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Expense</h2>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Matter (Optional)</label>
                <select value={formData.matter_id} onChange={e => setFormData({...formData, matter_id: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">General Expense (No Matter)</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
                <select value={formData.gst_rate} onChange={e => setFormData({...formData, gst_rate: parseFloat(e.target.value)})} className="w-full p-2 border rounded">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">GST Amount: ₹{(formData.amount * formData.gst_rate / 100).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})} className="w-full p-2 border rounded">
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-[#c9a84c] text-black py-2 rounded hover:bg-[#d4a017]">Submit Expense</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
