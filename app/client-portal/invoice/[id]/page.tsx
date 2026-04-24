'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'

export default function ClientInvoicePage() {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.id as string

  useEffect(() => {
    if (invoiceId) fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    const { data } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (name, email, phone, address),
        matters (title, matter_number)
      `)
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
        <div className="mb-4 flex justify-between items-center print:hidden">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-[#c9a84c] text-black px-4 py-2 rounded-lg">
            <PrinterIcon className="h-5 w-5" /> Print
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="invoice-print">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-8 py-6">
            <div className="flex justify-between">
              <div>
                <h1 className="text-3xl font-bold">HLAPL LEGAL</h1>
                <p className="text-gray-300">Hashmi Law Associates Pvt. Ltd.</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">TAX INVOICE</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-b">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-xl font-bold">{invoice.invoice_number}</p>
                <p className="text-sm text-gray-600 mt-2">Invoice Date</p>
                <p className="text-gray-900">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mt-2">Due Date</p>
                <p className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-b bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-2">BILL TO:</p>
            <p className="font-bold text-gray-900">{invoice.clients?.name}</p>
            <p className="text-gray-700">{invoice.clients?.address || 'Address not provided'}</p>
            <p className="text-gray-700 mt-1">Email: {invoice.clients?.email}</p>
            <p className="text-gray-700">Phone: {invoice.clients?.phone || 'N/A'}</p>
          </div>

          <div className="px-8 py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-700">Legal Services</td>
                  <td className="py-3 text-sm text-gray-700 text-right">₹{invoice.total_amount?.toLocaleString()}</td>
                 </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-3 text-right font-bold text-gray-900">TOTAL AMOUNT:</td>
                  <td className="py-3 text-right font-bold text-xl text-gray-900">₹{invoice.total_amount?.toLocaleString()}</td>
                 </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">PAYMENT INFORMATION:</p>
                <p className="text-sm text-gray-700">Bank: HDFC Bank</p>
                <p className="text-sm text-gray-700">Account Name: HLAP Legal Consultancy</p>
                <p className="text-sm text-gray-700">Account No: XXXXXXXXXX1234</p>
                <p className="text-sm text-gray-700">IFSC Code: HDFC0001234</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 mb-2">CONTACT:</p>
                <p className="text-sm text-gray-700">Email: accounts@hlapl.com</p>
                <p className="text-sm text-gray-700">Phone: +91 11 41040055</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
