'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  async function fetchInvoice() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (id, name, email, phone, address, gst_number),
        matters (id, title, matter_number, matter_type)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error:', error)
      alert('Invoice not found')
      router.push('/invoices')
    } else {
      setInvoice(data)
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.draft
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Invoice not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Invoice Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="invoice-print">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">HLAP LEGAL</h1>
                <p className="text-gray-300 mt-1">Legal Consultancy & Advisory</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">TAX INVOICE</p>
                <p className="text-gray-300 text-sm">Original for Recipient</p>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="px-8 py-6 border-b">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-xl font-bold text-gray-900">{invoice.invoice_number}</p>
                <p className="text-sm text-gray-600 mt-2">Invoice Date</p>
                <p className="text-gray-900">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mt-2">Due Date</p>
                <p className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusBadge(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Matter Info */}
          <div className="px-8 py-6 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">BILL TO:</p>
                <p className="font-bold text-gray-900">{invoice.clients?.name || 'N/A'}</p>
                <p className="text-gray-700">{invoice.clients?.address || 'Address not provided'}</p>
                <p className="text-gray-700 mt-1">Email: {invoice.clients?.email || 'N/A'}</p>
                <p className="text-gray-700">Phone: {invoice.clients?.phone || 'N/A'}</p>
                {invoice.clients?.gst_number && (
                  <p className="text-gray-700">GST: {invoice.clients.gst_number}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">MATTER DETAILS:</p>
                {invoice.matters ? (
                  <>
                    <p className="font-bold text-gray-900">{invoice.matters.title}</p>
                    <p className="text-gray-700">Matter No: {invoice.matters.matter_number}</p>
                    <p className="text-gray-700">Type: {invoice.matters.matter_type || 'General'}</p>
                  </>
                ) : (
                  <p className="text-gray-500">No matter associated (General Invoice)</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="px-8 py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Qty/Hrs</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Rate (₹)</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Tax</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-700">1</td>
                  <td className="py-3 text-sm text-gray-700">Legal Services</td>
                  <td className="py-3 text-sm text-gray-700 text-right">1</td>
                  <td className="py-3 text-sm text-gray-700 text-right">{invoice.total_amount?.toLocaleString()}</td>
                  <td className="py-3 text-sm text-gray-700 text-right">18%</td>
                  <td className="py-3 text-sm text-gray-700 text-right font-medium">{invoice.total_amount?.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={5} className="py-3 text-right font-semibold text-gray-700">Subtotal:</td>
                  <td className="py-3 text-right font-semibold text-gray-900">₹{invoice.subtotal?.toLocaleString() || invoice.total_amount?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-2 text-right text-sm text-gray-700">GST (18%):</td>
                  <td className="py-2 text-right text-sm text-gray-900">₹{invoice.tax_amount?.toLocaleString() || 0}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="py-3 text-right font-bold text-gray-900">TOTAL AMOUNT:</td>
                  <td className="py-3 text-right font-bold text-xl text-gray-900">₹{invoice.total_amount?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Info */}
          <div className="px-8 py-6 bg-gray-50 border-t">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">PAYMENT INFORMATION:</p>
                <p className="text-sm text-gray-700">Bank: HDFC Bank</p>
                <p className="text-sm text-gray-700">Account Name: HLAP Legal Consultancy</p>
                <p className="text-sm text-gray-700">Account No: XXXXXXXXXX1234</p>
                <p className="text-sm text-gray-700">IFSC Code: HDFC0001234</p>
                <p className="text-sm text-gray-700 mt-2">UPI ID: hlpl@hdfcbank</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 mb-2">TERMS & CONDITIONS:</p>
                <p className="text-sm text-gray-700">Payment due within 30 days</p>
                <p className="text-sm text-gray-700">Late payment interest @18% p.a.</p>
                <p className="text-sm text-gray-700">GST No: 27AAACH1234E1Z</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 text-center text-sm text-gray-500 border-t">
            <p>This is a computer generated invoice and does not require a physical signature.</p>
            <p className="mt-1">For any queries, contact: accounts@hlapl.com | +91-XXXXXXXXXX</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            🖨️ Print Invoice
          </button>
          <button
            onClick={() => router.push('/invoices')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            ← Back to Invoices
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          #invoice-print {
            box-shadow: none;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
