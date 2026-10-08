'use client'

import React, { useState } from 'react'
import { Plus, FileSpreadsheet, FileText, CheckCircle2, Truck } from 'lucide-react'
import type { SalesInvoiceB2B } from '../types/erp'
import type { AgingSummary } from '../lib/accounting/financialReports'
import { exportAgingReportExcel, exportSalesInvoicesExcel } from '../lib/export/excelFormulaReports'
import { exportSalesInvoiceB2BPdf, exportSalesDeliveryOrderPdf } from '../lib/export/pdfDocumentGenerator'

interface SalesB2bTabProps {
  invoices: SalesInvoiceB2B[]
  arAging: AgingSummary
  onAddInvoice: (invoice: SalesInvoiceB2B) => void
  onPayInvoice: (invoiceId: string, amount: number) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function SalesB2bTab({
  invoices,
  arAging,
  onAddInvoice,
  onPayInvoice,
}: SalesB2bTabProps) {
  const [showAddInvModal, setShowAddInvModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [packageName, setPackageName] = useState('')
  const [qtyPorsi, setQtyPorsi] = useState('')
  const [pricePerPorsi, setPricePerPorsi] = useState('')
  const [termDays, setTermDays] = useState('14')

  function handleOpenAddInvModal() {
    setCustomerName('')
    setCustomerAddress('')
    setPackageName('')
    setQtyPorsi('')
    setPricePerPorsi('')
    setTermDays('14')
    setShowAddInvModal(true)
  }

  const parsedQty = Number(qtyPorsi) || 0
  const parsedPrice = Number(pricePerPorsi) || 0
  const subtotal = parsedQty * parsedPrice
  const taxPPN = Math.round(subtotal * 0.11)
  const grandTotal = subtotal + taxPPN

  function handleSaveInvoice() {
    const days = Number(termDays) || 14
    const invNumber = `INV/NBR/${new Date().toISOString().slice(0, 7).replace('-', '')}/${Math.floor(1000 + Math.random() * 9000)}`

    const newInv: SalesInvoiceB2B = {
      id: `sinv-${Date.now()}`,
      orgId: 'org-resto',
      outletId: 'out-senopati',
      invoiceNumber: invNumber,
      customerId: 'cust-b2b',
      customerName,
      customerAddress,
      date: Date.now(),
      dueDate: Date.now() + days * 86400000,
      items: [
        {
          itemId: 'inv-catering-box',
          name: packageName || 'Paket Catering Nasi Kotak Nusantara Special',
          qty: parsedQty,
          unit: 'porsi',
          unitPrice: parsedPrice,
          subtotal,
        },
      ],
      subtotal,
      taxAmount: taxPPN,
      totalAmount: grandTotal,
      paidAmount: 0,
      balanceDue: grandTotal,
      status: 'unpaid',
    }

    onAddInvoice(newInv)
    setShowAddInvModal(false)
  }

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Catering & B2B
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportSalesInvoicesExcel(invoices)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Excel Faktur</span>
          </button>
          <button
            onClick={() => exportAgingReportExcel(arAging, 'ar')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Excel Aging</span>
          </button>
          <button
            onClick={handleOpenAddInvModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <Plus size={14} />
            <span>+ Faktur B2B</span>
          </button>
        </div>
      </div>

      {/* AR AGING CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-neutral-500 font-medium">Belum Jatuh Tempo</span>
          <div className="text-lg font-bold text-neutral-900 mt-1 tabular-nums">
            {formatRupiah(arAging.current)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-amber-700 font-medium">Lewat 1 - 30 Hari</span>
          <div className="text-lg font-bold text-amber-800 mt-1 tabular-nums">
            {formatRupiah(arAging.days1_30)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-rose-700 font-medium">Lewat 31 - 60 Hari</span>
          <div className="text-lg font-bold text-rose-800 mt-1 tabular-nums">
            {formatRupiah(arAging.days31_60)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-neutral-500 font-medium">Total Seluruh Piutang (AR)</span>
          <div className="text-lg font-bold text-black mt-1 tabular-nums">
            {formatRupiah(arAging.total)}
          </div>
        </div>
      </div>

      {/* INVOICES LIST */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 className="font-bold text-sm text-black">Daftar Faktur Penjualan B2B (Sales Invoices)</h2>
          <span className="text-xs text-neutral-500 font-medium">{invoices.length} Faktur Terbit</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-2.5 px-3">NO. FAKTUR</th>
                <th className="py-2.5 px-3">KLIEN / KAFE</th>
                <th className="py-2.5 px-3">TGL TERBIT</th>
                <th className="py-2.5 px-3">JATUH TEMPO</th>
                <th className="py-2.5 px-3 text-right">TOTAL TAGIHAN</th>
                <th className="py-2.5 px-3 text-right">SISA PIUTANG</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
                <th className="py-2.5 px-3 text-right">DOKUMEN & AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-3 font-mono font-medium text-black">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3 font-semibold text-neutral-900">{inv.customerName}</td>
                  <td className="py-3 px-3 text-neutral-600">{new Date(inv.date).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-3 text-neutral-600">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-3 text-right font-medium tabular-nums">{formatRupiah(inv.totalAmount)}</td>
                  <td className="py-3 px-3 text-right font-bold text-neutral-900 tabular-nums">
                    {formatRupiah(inv.balanceDue)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => exportSalesInvoiceB2BPdf(inv)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-neutral-300"
                        title="Download Faktur Resmi PDF"
                      >
                        <FileText size={12} className="text-rose-700" />
                        <span>Faktur PDF</span>
                      </button>

                      <button
                        onClick={() => exportSalesDeliveryOrderPdf(inv)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-neutral-300"
                        title="Download Surat Jalan & Bukti Serah Terima Makanan PDF"
                      >
                        <Truck size={12} className="text-amber-700" />
                        <span>Surat Jalan (DO)</span>
                      </button>

                      {inv.balanceDue > 0 ? (
                        <button
                          onClick={() => onPayInvoice(inv.id, inv.balanceDue)}
                          className="px-3 py-1 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-[11px] transition-all cursor-pointer"
                        >
                          Catat Lunas
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 size={13} /> Lunas
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BUAT FAKTUR B2B BARU */}
      {showAddInvModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-black">Terbitkan Faktur Penjualan B2B (Invoice)</h3>
            <p className="text-xs text-neutral-500">
              Penerbitan faktur pesanan catering, buffet, atau event korporat dengan termin piutang.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">Nama Perusahaan / Klien</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: PT Sumber Makmur Sentosa, Bank Mandiri, dll"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Alamat Lengkap Pengiriman</label>
                <input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Contoh: Gedung Artha Graha Lt. 5, Jl. Jend. Sudirman, Jakarta"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Nama Menu / Paket Katering</label>
                <input
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Contoh: Paket Nasi Kotak Nusantara Special, Buffet VIP..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700">Jumlah Paket (Porsi)</label>
                  <input
                    type="number"
                    value={qtyPorsi}
                    onChange={(e) => setQtyPorsi(e.target.value)}
                    placeholder="Contoh: 50"
                    className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Harga / Porsi (Rp)</label>
                  <input
                    type="number"
                    value={pricePerPorsi}
                    onChange={(e) => setPricePerPorsi(e.target.value)}
                    placeholder="Contoh: 45000"
                    className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* LIVE TOTAL REVIEW */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal:</span>
                  <span className="font-bold text-neutral-900 tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">PPN (11%):</span>
                  <span className="font-bold text-neutral-900 tabular-nums">{formatRupiah(taxPPN)}</span>
                </div>
                <div className="flex justify-between font-bold text-black pt-1 border-t border-neutral-200">
                  <span>Total Tagihan:</span>
                  <span className="tabular-nums">{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddInvModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer min-h-[40px]"
              >
                Batal
              </button>
              <button
                onClick={handleSaveInvoice}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer min-h-[40px]"
              >
                Terbitkan & Posting Jurnal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
