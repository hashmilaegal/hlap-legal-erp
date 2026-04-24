'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  DocumentTextIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingInvoices: 0,
    totalClients: 0,
    activeMatters: 0,
    totalBillableHours: 0,
    avgHourlyRate: 0
  })
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([])
  const [topClients, setTopClients] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      fetchAllReports()
    }
  }

  async function fetchAllReports() {
    setLoading(true)
    await Promise.all([
      fetchFinancialSummary(),
      fetchRevenueByMonth(),
      fetchTopClients()
    ])
    setLoading(false)
  }

  async function fetchFinancialSummary() {
    const { data: invoices } = await supabase.from('invoices').select('total_amount, amount_paid, status')
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || inv.total_amount || 0), 0) || 0
    const outstandingInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'partial')
      .reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0) || 0

    const { data: expenses } = await supabase.from('expenses').select('total_amount, status')
    const totalExpenses = expenses?.filter(e => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.total_amount, 0) || 0

    const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true })
    const { count: matterCount } = await supabase.from('matters').select('*', { count: 'exact', head: true }).eq('status', 'active')
    const { data: timeEntries } = await supabase.from('time_entries').select('hours, hourly_rate').eq('billable', true).eq('status', 'approved')

    const totalBillableHours = timeEntries?.reduce((sum, t) => sum + t.hours, 0) || 0
    const totalBillableValue = timeEntries?.reduce((sum, t) => sum + (t.hours * t.hourly_rate), 0) || 0
    const avgHourlyRate = totalBillableHours > 0 ? totalBillableValue / totalBillableHours : 0

    setReportData({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      outstandingInvoices,
      totalClients: clientCount || 0,
      activeMatters: matterCount || 0,
      totalBillableHours,
      avgHourlyRate
    })
  }

  async function fetchRevenueByMonth() {
    const { data: invoices } = await supabase.from('invoices').select('total_amount, amount_paid, invoice_date').order('invoice_date', { ascending: true })
    if (!invoices) return

    const monthlyData: any = {}
    invoices.forEach((inv: any) => {
      const month = new Date(inv.invoice_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthlyData[month] = (monthlyData[month] || 0) + (inv.amount_paid || inv.total_amount || 0)
    })
    setRevenueByMonth(Object.entries(monthlyData).slice(-6).map(([month, revenue]) => ({ month, revenue })))
  }

  async function fetchTopClients() {
    const { data: invoices } = await supabase.from('invoices').select(`total_amount, amount_paid, clients (id, name)`)
    if (!invoices) return

    const clientMap: any = {}
    invoices.forEach((inv: any) => {
      if (inv.clients?.id) {
        if (!clientMap[inv.clients.id]) clientMap[inv.clients.id] = { name: inv.clients.name, revenue: 0 }
        clientMap[inv.clients.id].revenue += inv.amount_paid || inv.total_amount || 0
      }
    })
    setTopClients(Object.values(clientMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-500">Comprehensive financial analytics</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          {['overview', 'revenue', 'clients'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium capitalize transition ${activeTab === tab ? 'text-[#c9a84c] border-b-2 border-[#c9a84c]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'overview' ? 'Overview' : tab === 'revenue' ? 'Revenue Analysis' : 'Client Analytics'}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12 text-gray-500">Loading reports...</div> : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalRevenue)}</p></div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Net Profit</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.netProfit)}</p></div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Outstanding</p><p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.outstandingInvoices)}</p></div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Active Matters</p><p className="text-2xl font-bold text-purple-600">{reportData.activeMatters}</p></div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                  {revenueByMonth.map((item: any) => <div key={item.month} className="mb-3"><div className="flex justify-between text-sm mb-1"><span>{item.month}</span><span>{formatCurrency(item.revenue)}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-[#c9a84c] h-2 rounded-full" style={{ width: `${Math.min(100, (item.revenue / Math.max(...revenueByMonth.map((r: any) => r.revenue))) * 100)}%` }} /></div></div>)}
                </div>
              </div>
            )}

            {activeTab === 'revenue' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-xl p-6"><p className="text-sm text-gray-600">Total Revenue</p><p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.totalRevenue)}</p></div>
                <div className="bg-blue-50 rounded-xl p-6"><p className="text-sm text-gray-600">Avg per Client</p><p className="text-3xl font-bold text-blue-600">{reportData.totalClients > 0 ? formatCurrency(reportData.totalRevenue / reportData.totalClients) : formatCurrency(0)}</p></div>
                <div className="bg-purple-50 rounded-xl p-6"><p className="text-sm text-gray-600">Avg per Matter</p><p className="text-3xl font-bold text-purple-600">{reportData.activeMatters > 0 ? formatCurrency(reportData.totalRevenue / reportData.activeMatters) : formatCurrency(0)}</p></div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Top Clients by Revenue</h3></div>
                <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">#</th><th className="px-6 py-3 text-left text-xs">Client Name</th><th className="px-6 py-3 text-right text-xs">Revenue</th></tr></thead>
                <tbody>{topClients.map((client: any, idx: number) => <tr key={idx} className="border-t"><td className="px-6 py-4 text-sm">{idx + 1}</td><td className="px-6 py-4 text-sm font-medium">{client.name}</td><td className="px-6 py-4 text-sm text-right text-green-600">{formatCurrency(client.revenue)}</td></tr>)}</tbody></table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
