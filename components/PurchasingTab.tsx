'use client'

import React, { useState } from 'react'
import { Plus, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react'
import type { PurchaseBill, PurchaseOrder, InventoryItem } from '../types/erp'
import type { AgingSummary } from '../lib/accounting/financialReports'
import { exportAgingReportExcel, exportPurchasingBillsExcel } from '../lib/export/excelFormulaReports'
import { exportPurchaseOrderPdf, exportBillAsPoPdf } from '../lib/export/pdfDocumentGenerator'

interface PurchasingTabProps {
  bills: PurchaseBill[]
  apAging: AgingSummary
  inventory?: InventoryItem[]
  onAddBill: (bill: PurchaseBill, autoReceiveStock?: boolean) => void
  onPayBill: (billId: string, amount: number) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function PurchasingTab({
  bills,
  apAging,
  inventory = [],
  onAddBill,
  onPayBill,
}: PurchasingTabProps) {
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [selectedInvId, setSelectedInvId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [vendorInvNo, setVendorInvNo] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('')
  const [itemUnit, setItemUnit] = useState('kg')
  const [billAmount, setBillAmount] = useState('')
  const [termDays, setTermDays] = useState('14')
  const [autoReceiveStock, setAutoReceiveStock] = useState(true)

  function handleOpenAddBill() {
    setSelectedInvId('')
    setSupplierName('')
    setVendorInvNo('')
    setItemDesc('')
    setItemQty('')
    setItemUnit('kg')
    setBillAmount('')
    setTermDays('14')
    setAutoReceiveStock(true)
    setShowAddBillModal(true)
  }

  function handleSelectInventoryItem(invId: string) {
    setSelectedInvId(invId)
    const matched = inventory.find((i) => i.id === invId)
    if (matched) {
      setItemDesc(matched.name)
      setItemUnit(matched.unit)
      const qty = Number(itemQty) || 1
      setBillAmount(String(matched.unitCost * qty))
    }
  }

  function handleSaveBill() {
    const amt = Number(billAmount) || 0
    const days = Number(termDays) || 14
    const parsedQty = Number(itemQty) || 1
    const unitPrice = amt / (parsedQty > 0 ? parsedQty : 1)
    const billNumber = `BILL/${new Date().toISOString().slice(0, 7).replace('-', '')}/${Math.floor(1000 + Math.random() * 9000)}`

    const targetItemId = selectedInvId || `raw-${Date.now()}`

    const newBill: PurchaseBill = {
      id: `bill-${Date.now()}`,
      orgId: 'org-resto',
      outletId: 'out-senopati',
      billNumber,
      vendorInvoiceNumber: vendorInvNo,
      supplierId: 'sup-new',
      supplierName,
      date: Date.now(),
      dueDate: Date.now() + days * 86400000,
      totalAmount: amt,
      paidAmount: 0,
      balanceDue: amt,
      status: 'unpaid',
      items: [
        {
          itemId: targetItemId,
          itemName: itemDesc || `Pengadaan Bahan (${vendorInvNo})`,
          qty: parsedQty,
          unit: itemUnit || 'unit',
          unitCost: Math.round(unitPrice),
          subtotal: amt,
        },
      ],
    }

    onAddBill(newBill, autoReceiveStock)
    setShowAddBillModal(false)
  }

  function handleSampleDownloadPo() {
    const samplePo: PurchaseOrder = {
      id: 'po-sample',
      orgId: 'org-resto',
      outletId: 'out-senopati',
      poNumber: 'PO/NBR/202610/0014',
      supplierId: 'sup-1',
      supplierName: 'PT Diamond Cold Storage & Dairy',
      date: Date.now(),
      expectedDeliveryDate: Date.now() + 2 * 86400000,
      status: 'ordered',
      totalAmount: 1850000,
      items: [
        { itemId: 'inv-milk-fresh', itemName: 'Fresh Milk Greenfields Pasteurized', qty: 100, unit: 'liter', unitCost: 18500, subtotal: 1850000 },
      ],
    }
    exportPurchaseOrderPdf(samplePo)
  }

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Pengadaan Supplier & Hutang
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportPurchasingBillsExcel(bills)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Excel Tagihan</span>
          </button>
          <button
            onClick={() => exportAgingReportExcel(apAging, 'ap')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Excel Aging</span>
          </button>
          <button
            onClick={handleSampleDownloadPo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <FileText size={15} className="text-rose-700" />
            <span>PO PDF</span>
          </button>
          <button
            onClick={handleOpenAddBill}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <Plus size={14} />
            <span>+ Tagihan Baru</span>
          </button>
        </div>
      </div>

      {/* AGING SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-neutral-500 font-medium">Belum Jatuh Tempo</span>
          <div className="text-lg font-bold text-neutral-900 mt-1 tabular-nums">
            {formatRupiah(apAging.current)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-amber-700 font-medium">Lewat 1 - 30 Hari</span>
          <div className="text-lg font-bold text-amber-800 mt-1 tabular-nums">
            {formatRupiah(apAging.days1_30)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-rose-700 font-medium">Lewat 31 - 60 Hari</span>
          <div className="text-lg font-bold text-rose-800 mt-1 tabular-nums">
            {formatRupiah(apAging.days31_60)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <span className="text-[11px] text-neutral-500 font-medium">Total Seluruh Hutang (AP)</span>
          <div className="text-lg font-bold text-black mt-1 tabular-nums">
            {formatRupiah(apAging.total)}
          </div>
        </div>
      </div>

      {/* BILLS LIST */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 className="font-bold text-sm text-black">Daftar Tagihan Hutang Pembelian (AP Bills)</h2>
          <span className="text-xs text-neutral-500 font-medium">{bills.length} Tagihan Terdaftar</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-2.5 px-3">NO. BILL</th>
                <th className="py-2.5 px-3">NAMA SUPPLIER</th>
                <th className="py-2.5 px-3">TGL TAGIHAN</th>
                <th className="py-2.5 px-3">JATUH TEMPO</th>
                <th className="py-2.5 px-3 text-right">TOTAL</th>
                <th className="py-2.5 px-3 text-right">SISA HUTANG</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
                <th className="py-2.5 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-3 font-mono font-medium text-black">
                    {b.billNumber}
                    <div className="text-[10px] text-neutral-400 font-sans">{b.vendorInvoiceNumber}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-neutral-900">{b.supplierName}</td>
                  <td className="py-3 px-3 text-neutral-600">{new Date(b.date).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-3 text-neutral-600">{new Date(b.dueDate).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-3 text-right font-medium tabular-nums">{formatRupiah(b.totalAmount)}</td>
                  <td className="py-3 px-3 text-right font-bold text-neutral-900 tabular-nums">
                    {formatRupiah(b.balanceDue)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        b.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => exportBillAsPoPdf(b)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-neutral-300"
                        title="Download Dokumen PO / Tagihan Supplier PDF"
                      >
                        <FileText size={12} className="text-rose-700" />
                        <span>PO PDF</span>
                      </button>

                      {b.balanceDue > 0 ? (
                        <button
                          onClick={() => onPayBill(b.id, b.balanceDue)}
                          className="px-3 py-1 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-[11px] transition-all cursor-pointer"
                        >
                          Lunasi
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

      {/* MODAL INPUT BILL BARU */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-black">Catat Tagihan Pembelian (Bill AP)</h3>
            <p className="text-xs text-neutral-500">
              Sistem akan otomatis menjurnal penambahan stok bahan baku dan hutang usaha (AP).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">Nama Supplier / Vendor</label>
                <input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Contoh: PT Sumber Pangan Nusantara..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">No. Faktur dari Supplier</label>
                <input
                  value={vendorInvNo}
                  onChange={(e) => setVendorInvNo(e.target.value)}
                  placeholder="Contoh: INV-SUP-2026/089"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              {inventory && inventory.length > 0 && (
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Pilih Item Bahan Baku Gudang (Opsional):
                  </label>
                  <select
                    value={selectedInvId}
                    onChange={(e) => handleSelectInventoryItem(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black cursor-pointer bg-white"
                  >
                    <option value="">-- Input Manual / Non-Inventory --</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Stok Saat Ini: {inv.currentStock} {inv.unit} · {formatRupiah(inv.unitCost)}/{inv.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-neutral-700">Deskripsi Item / Nama Bahan Baku</label>
                <input
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Misal: Fresh Milk Greenfields, Daging Sirloin, dll"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700">Jumlah (Qty)</label>
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => {
                      setItemQty(e.target.value)
                      if (selectedInvId) {
                        const matched = inventory.find((i) => i.id === selectedInvId)
                        if (matched) {
                          setBillAmount(String(matched.unitCost * (Number(e.target.value) || 1)))
                        }
                      }
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Satuan (Unit)</label>
                  <input
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="liter, kg, pcs, pack"
                    className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Total Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Termin Jatuh Tempo (Hari)</label>
                <input
                  type="number"
                  value={termDays}
                  onChange={(e) => setTermDays(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              {/* AUTO GOODS RECEIPT CHECKBOX */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReceiveStock}
                  onChange={(e) => setAutoReceiveStock(e.target.checked)}
                  className="mt-0.5 accent-black rounded cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">
                    Konfirmasi Penerimaan Barang (Goods Receipt)
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Otomatis tambahkan kuantitas ke stok fisik gudang dan catat riwayat kartu stok masuk.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddBillModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer min-h-[40px]"
              >
                Batal
              </button>
              <button
                onClick={handleSaveBill}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer min-h-[40px]"
              >
                Simpan & Posting Jurnal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
