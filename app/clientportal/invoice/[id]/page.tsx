'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function ClientInvoiceView() {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id as string

  useEffect(() => {
    if (invoiceId) fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(name, email, phone, address), matters(title, matter_number)')
      .eq('id', invoiceId)
      .single()
    if (data) setInvoice(data)
    setLoading(false)
  }

  const handlePrint = () => window.print()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!invoice) return <div className="min-h-screen flex items-center justify-center">Invoice not found</div>

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4 flex justify-between print:hidden">
          <button onClick={() => router.back()} className="bg-gray-600 text-white px-4 py-2 rounded-lg">← Back</button>
          <button onClick={handlePrint} className="bg-[#c9a84c] text-black px-4 py-2 rounded-lg">🖨️ Print</button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="invoice-print">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-8 py-6">
            <div className="flex justify-between"><div><h1 className="text-3xl font-bold">HLAPL LEGAL</h1><p className="text-gray-300">Hashmi Law Associates Pvt. Ltd.</p></div><div className="text-right"><p className="text-2xl font-bold">TAX INVOICE</p></div></div>
          </div>
          <div className="px-8 py-6 border-b"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Invoice #</p><p className="text-xl font-bold">{invoice.invoice_number}</p><p className="text-sm text-gray-600 mt-2">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p><p className="text-sm text-gray-600">Due: {new Date(invoice.due_date).toLocaleDateString()}</p></div><div><span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{invoice.status.toUpperCase()}</span></div></div></div>
          <div className="px-8 py-6 border-b bg-gray-50"><p className="text-sm font-semibold">BILL TO:</p><p className="font-bold">{invoice.clients?.name}</p><p>{invoice.clients?.address || 'Address not provided'}</p><p>Email: {invoice.clients?.email}</p><p>Phone: {invoice.clients?.phone}</p></div>
          {invoice.matters && <div className="px-8 py-4 border-b"><p className="text-sm font-semibold">MATTER:</p><p>{invoice.matters.title} ({invoice.matters.matter_number})</p></div>}
          <div className="px-8 py-6"><table className="w-full"><thead><tr className="border-b-2"><th className="text-left py-3">Description</th><th className="text-right py-3">Amount</th></tr></thead><tbody><tr><td className="py-3">Legal Services</td><td className="py-3 text-right">₹{invoice.total_amount?.toLocaleString()}</td></tr></tbody><tfoot><tr className="border-t-2"><td className="py-3 text-right font-bold">TOTAL:</td><td className="py-3 text-right font-bold text-xl">₹{invoice.total_amount?.toLocaleString()}</td></tr></tfoot></table></div>
          <div className="px-8 py-6 bg-gray-50"><p className="text-sm">Payment: HDFC Bank | Acct: HLAP Legal | IFSC: HDFC0001234</p><p className="text-sm mt-2">Questions? accounts@hlapl.com | +91 11 41040055</p></div>
        </div>
      </div>
    </div>
  )
}
