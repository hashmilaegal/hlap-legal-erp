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

interface ReportData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  outstandingInvoices: number
  totalClients: number
  activeMatters: number
  totalBillableHours: number
  avgHourlyRate: number
}

interface RevenueByMonth {
  month: string
  revenue: number
}

interface TopClient {
  name: string
  revenue: number
  matters: number
}

interface MatterProfitability {
  title: string
  client_name: string
  billed_amount: number
  expenses: number
  profit: number
}

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingInvoices: 0,
    totalClients: 0,
    activeMatters: 0,
    totalBillableHours: 0,
    avgHourlyRate: 0
  })
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [matterProfitability, setMatterProfitability] = useState<MatterProfitability[]>([])
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
      fetchTopClients(),
      fetchMatterProfitability()
    ])
    setLoading(false)
  }

  async function fetchFinancialSummary() {
    // Get invoices total
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid, status')

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || inv.total_amount || 0), 0) || 0
    
    const outstandingInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'partial')
      .reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0) || 0

    // Get expenses total
    const { data: expenses } = await supabase
      .from('expenses')
      .select('total_amount, status')
    
    const totalExpenses = expenses?.filter(e => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.total_amount, 0) || 0

    // Get clients count
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    // Get active matters
    const { count: matterCount } = await supabase
      .from('matters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get billable hours
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('hours, hourly_rate')
      .eq('billable', true)
      .eq('status', 'approved')

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
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid, invoice_date')
      .order('invoice_date', { ascending: true })

    if (!invoices) return

    const monthlyData: { [key: string]: number } = {}
    invoices.forEach(inv => {
      const month = new Date(inv.invoice_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthlyData[month] = (monthlyData[month] || 0) + (inv.amount_paid || inv.total_amount || 0)
    })

    const last6Months = Object.entries(monthlyData).slice(-6).map(([month, revenue]) => ({
      month,
      revenue
    }))

    setRevenueByMonth(last6Months)
  }

  async function fetchTopClients() {
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        total_amount,
        amount_paid,
        clients (id, name)
      `)

    if (!invoices) return

    const clientMap: { [key: string]: { name: string; revenue: number; matters: Set<string> } } = {}
    
    invoices.forEach((inv: any) => {
      if (inv.clients?.id) {
        if (!clientMap[inv.clients.id]) {
          clientMap[inv.clients.id] = {
            name: inv.clients.name,
            revenue: 0,
            matters: new Set()
          }
        }
        clientMap[inv.clients.id].revenue += inv.amount_paid || inv.total_amount || 0
      }
    })

    const top5 = Object.values(clientMap)
      .map(c => ({ name: c.name, revenue: c.revenue, matters: c.matters.size }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    setTopClients(top5)
  }

  async function fetchMatterProfitability() {
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        total_amount,
        amount_paid,
        matters (id, title, clients (name))
      `)

    if (!invoices) return

    const matterMap: { [key: string]: { title: string; client_name: string; billed: number } } = {}
    
    invoices.forEach((inv: any) => {
      if (inv.matters?.id) {
        if (!matterMap[inv.matters.id]) {
          matterMap[inv.matters.id] = {
            title: inv.matters.title,
            client_name: inv.matters.clients?.name || 'Unknown',
            billed: 0
          }
        }
        matterMap[inv.matters.id].billed += inv.amount_paid || inv.total_amount || 0
      }
    })

    // Get expenses per matter
    const { data: expenses } = await supabase
      .from('expenses')
      .select('total_amount, matter_id')

    if (expenses) {
      expenses.forEach(exp => {
        if (exp.matter_id && matterMap[exp.matter_id]) {
          // We'll calculate profit later
        }
      })
    }

    const top10 = Object.values(matterMap)
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 10)
      .map(m => ({
        title: m.title,
        client_name: m.client_name,
        billed_amount: m.billed,
        expenses: 0,
        profit: m.billed
      }))

    setMatterProfitability(top10)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const downloadReport = () => {
    const reportContent = `
HLAPL Financial Report
Generated: ${new Date().toLocaleString()}
========================================

FINANCIAL SUMMARY
-----------------
Total Revenue: ${formatCurrency(reportData.totalRevenue)}
Total Expenses: ${formatCurrency(reportData.totalExpenses)}
Net Profit: ${formatCurrency(reportData.netProfit)}
Outstanding Invoices: ${formatCurrency(reportData.outstandingInvoices)}

OPERATIONAL METRICS
------------------
Total Clients: ${reportData.totalClients}
Active Matters: ${reportData.activeMatters}
Total Billable Hours: ${reportData.totalBillableHours.toFixed(1)} hrs
Average Hourly Rate: ${formatCurrency(reportData.avgHourlyRate)}

TOP 5 CLIENTS
-------------
${topClients.map((c, i) => `${i + 1}. ${c.name}: ${formatCurrency(c.revenue)}`).join('\n')}

TOP 10 MATTERS BY REVENUE
-------------------------
${matterProfitability.map((m, i) => `${i + 1}. ${m.title} (${m.client_name}): ${formatCurrency(m.billed_amount)}`).join('\n')}
    `

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hlap-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-500">Comprehensive financial analytics and insights</p>
          </div>
          <button
            onClick={downloadReport}
            className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#d4a017] transition"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export Report
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          {['overview', 'revenue', 'clients', 'matters'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'text-[#c9a84c] border-b-2 border-[#c9a84c]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'revenue' && 'Revenue Analysis'}
              {tab === 'clients' && 'Client Analytics'}
              {tab === 'matters' && 'Matter Profitability'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} icon={CurrencyRupeeIcon} color="green" />
                  <StatCard title="Net Profit" value={formatCurrency(reportData.netProfit)} icon={ChartBarIcon} color="blue" />
                  <StatCard title="Outstanding Invoices" value={formatCurrency(reportData.outstandingInvoices)} icon={DocumentTextIcon} color="orange" />
                  <StatCard title="Active Matters" value={reportData.activeMatters} icon={UserGroupIcon} color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue by Month Chart */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h3>
                    <div className="space-y-3">
                      {revenueByMonth.map((item) => (
                        <div key={item.month}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.month}</span>
                            <span className="font-medium">{formatCurrency(item.revenue)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#c9a84c] h-2 rounded-full"
                              style={{ width: `${Math.min(100, (item.revenue / Math.max(...revenueByMonth.map(r => r.revenue))) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {revenueByMonth.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No revenue data available</p>
                      )}
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Clients</span>
                        <span className="font-bold text-gray-900">{reportData.totalClients}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Billable Hours</span>
                        <span className="font-bold text-gray-900">{reportData.totalBillableHours.toFixed(1)} hrs</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Average Hourly Rate</span>
                        <span className="font-bold text-gray-900">{formatCurrency(reportData.avgHourlyRate)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-600">Profit Margin</span>
                        <span className={`font-bold ${reportData.totalRevenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {reportData.totalRevenue > 0 ? ((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Analysis Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 shadow-sm border border-green-100">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.totalRevenue)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <p className="text-sm text-gray-500">Average per Client</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {reportData.totalClients > 0 ? formatCurrency(reportData.totalRevenue / reportData.totalClients) : formatCurrency(0)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 shadow-sm border border-purple-100">
                    <p className="text-sm text-gray-500">Average per Matter</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {reportData.activeMatters > 0 ? formatCurrency(reportData.totalRevenue / reportData.activeMatters) : formatCurrency(0)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Billable Hours Revenue</span>
                        <span className="font-medium">{formatCurrency(reportData.totalBillableHours * reportData.avgHourlyRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Analytics Tab */}
            {activeTab === 'clients' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Top 5 Clients by Revenue</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Client Name</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topClients.map((client, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">{formatCurrency(client.revenue)}</td>
                          </tr>
                        ))}
                        {topClients.length === 0 && (
                          <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No client data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Matter Profitability Tab */}
            {activeTab === 'matters' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Top 10 Matters by Revenue</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Matter Title</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Client</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Billed Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {matterProfitability.map((matter, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{matter.title}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{matter.client_name}</td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">{formatCurrency(matter.billed_amount)}</td>
                          </tr>
                        ))}
                        {matterProfitability.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No matter data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
