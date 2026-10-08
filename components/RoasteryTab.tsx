'use client'

import React, { useState } from 'react'
import { Flame, Truck, Plus, FileText, CheckCircle2 } from 'lucide-react'
import type { WorkOrderProduction, StockTransfer, InventoryItem } from '../types/erp'
import { exportDeliveryOrderPdf } from '../lib/export/pdfDocumentGenerator'

interface RoasteryTabProps {
  workOrders: WorkOrderProduction[]
  transfers: StockTransfer[]
  inventory: InventoryItem[]
  onAddWorkOrder: (wo: WorkOrderProduction) => void
  onAddTransfer: (transfer: StockTransfer) => void
  onReceiveTransfer: (transferId: string) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function RoasteryTab({
  workOrders,
  transfers,
  inventory,
  onAddWorkOrder,
  onAddTransfer,
  onReceiveTransfer,
}: RoasteryTabProps) {
  const [activeSection, setActiveSection] = useState<'roasting' | 'transfers'>('roasting')

  // NEW ROASTING MODAL
  const [showRoastModal, setShowRoastModal] = useState(false)
  const [inputQtyKg, setInputQtyKg] = useState('20')
  const [conversionCost, setConversionCost] = useState('150000')
  const [outputActualKg, setOutputActualKg] = useState('16.6')
  const [operator, setOperator] = useState('Operator Roasting')

  // NEW TRANSFER MODAL
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferQty, setTransferQty] = useState('10')
  const [driver, setDriver] = useState('Kurir Logistik Outlet')
  const [plate, setPlate] = useState('B 1234 SNT')

  // CALCULATE YIELD ON THE FLY
  const inQty = Number(inputQtyKg) || 1
  const outQty = Number(outputActualKg) || 1
  const convCost = Number(conversionCost) || 0
  const greenBeanCostPerKg = 85000
  const totalInputCost = inQty * greenBeanCostPerKg + convCost
  const yieldLoss = ((inQty - outQty) / inQty) * 100
  const finalCostPerKg = totalInputCost / outQty

  function handleSaveRoasting() {
    const spkNumber = `SPK/ROAST/${new Date().toISOString().slice(0, 7).replace('-', '')}/${Math.floor(100 + Math.random() * 900)}`
    const wo: WorkOrderProduction = {
      id: `wo-${Date.now()}`,
      spkNumber,
      date: Date.now(),
      inputItemId: 'inv-gb-ciengang',
      inputItemName: 'Green Beans Ciengang Natural Anaerob',
      inputQtyKg: inQty,
      inputUnitCost: greenBeanCostPerKg,
      conversionCostRp: convCost,
      outputItemId: 'inv-rb-ciengang',
      outputItemName: 'Roasted Beans Ciengang (Filter/Espresso)',
      outputActualQtyKg: outQty,
      yieldLossPct: yieldLoss,
      finalUnitCostPerKg: Math.round(finalCostPerKg),
      operatorName: operator,
      notes: `Batch roasting selesai. Susut bobot: ${yieldLoss.toFixed(1)}%. HPP baru: ${formatRupiah(finalCostPerKg)}/kg.`,
    }

    onAddWorkOrder(wo)
    setShowRoastModal(false)
  }

  function handleSaveTransfer() {
    const transferNumber = `SJ/TRF/${new Date().toISOString().slice(0, 7).replace('-', '')}/${Math.floor(1000 + Math.random() * 9000)}`
    const trf: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber,
      sourceOutletId: 'out-roastery',
      sourceOutletName: 'Central Roastery Ciengang',
      targetOutletId: 'out-utama',
      targetOutletName: 'Cabang Utama Sukabumi',
      dateSent: Date.now(),
      driverName: driver,
      vehiclePlate: plate,
      status: 'in_transit',
      items: [
        {
          itemId: 'inv-rb-ciengang',
          itemName: 'Roasted Beans Ciengang 1kg',
          qtySent: Number(transferQty) || 5,
          unit: 'kg',
        },
      ],
    }

    onAddTransfer(trf)
    setShowTransferModal(false)
  }

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Produksi Roastery
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => setActiveSection('roasting')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'roasting' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Flame size={13} className="inline mr-1" />
              Roasting
            </button>
            <button
              onClick={() => setActiveSection('transfers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'transfers' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Truck size={13} className="inline mr-1" />
              Transfer Stok
            </button>
          </div>

          {activeSection === 'roasting' ? (
            <button
              onClick={() => setShowRoastModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>SPK Sangrai Baru</span>
            </button>
          ) : (
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>Buat Surat Jalan</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. ROASTING PRODUCTION BATCHES */}
      {activeSection === 'roasting' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workOrders.map((wo) => (
              <div key={wo.id} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-500">{wo.spkNumber}</span>
                    <h3 className="font-bold text-sm text-black">{wo.outputItemName}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Selesai & Terjurnal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500">Bahan Mentah:</span>
                    <div className="font-bold text-neutral-900 mt-0.5">
                      {wo.inputQtyKg} kg {wo.inputItemName}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500">Hasil Sangrai Nyata:</span>
                    <div className="font-bold text-neutral-900 mt-0.5">
                      {wo.outputActualQtyKg} kg Matang
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500">Susut Bobot (Loss):</span>
                    <div className="font-bold text-amber-700 mt-0.5">
                      {wo.yieldLossPct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500">HPP Baru / Kg:</span>
                    <div className="font-bold text-emerald-700 mt-0.5 tabular-nums">
                      {formatRupiah(wo.finalUnitCostPerKg)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center justify-between">
                  <span>Operator: <strong>{wo.operatorName}</strong></span>
                  <span>{new Date(wo.date).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. MULTI-WAREHOUSE STOCK TRANSFERS */}
      {activeSection === 'transfers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transfers.map((trf) => (
              <div key={trf.id} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-500">{trf.transferNumber}</span>
                    <h3 className="font-bold text-sm text-black">
                      {trf.sourceOutletName} → {trf.targetOutletName}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                      trf.status === 'received'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {trf.status === 'received' ? 'Diterima Lengkap ✓' : 'Dalam Perjalanan (In-Transit)'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-neutral-500 font-medium">Daftar Barang yang Dikirim:</span>
                  {trf.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-neutral-50">
                      <span>{it.itemName}</span>
                      <span className="font-bold text-neutral-900">{it.qtySent} {it.unit}</span>
                    </div>
                  ))}
                  <div className="text-[11px] text-neutral-500 pt-1">
                    Driver: {trf.driverName} ({trf.vehiclePlate})
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => exportDeliveryOrderPdf(trf)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-black transition-all"
                  >
                    <FileText size={13} className="text-rose-700" />
                    <span>Download Surat Jalan PDF</span>
                  </button>

                  {trf.status !== 'received' && (
                    <button
                      onClick={() => onReceiveTransfer(trf.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-xs font-semibold text-white transition-all"
                    >
                      <CheckCircle2 size={13} />
                      <span>Validasi Terima Barang</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SPK ROASTING BARU */}
      {showRoastModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-black">Perintah Kerja Sangrai (SPK Roasting)</h3>
            <p className="text-xs text-neutral-500">
              Sistem akan menghitung susut bobot secara presisi dan menjurnal perpindahan persediaan.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">Kuantitas Green Beans Mentah (Kg)</label>
                <input
                  type="number"
                  value={inputQtyKg}
                  onChange={(e) => setInputQtyKg(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Biaya Konversi (Gas, Listrik & Tenaga)</label>
                <input
                  type="number"
                  value={conversionCost}
                  onChange={(e) => setConversionCost(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Hasil Timbang Biji Matang Aktual (Kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={outputActualKg}
                  onChange={(e) => setOutputActualKg(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              {/* LIVE PREVIEW HASIL HITUNG */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Estimasi Susut Bobot:</span>
                  <span className="font-bold text-amber-700">{yieldLoss.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">HPP Biji Matang Baru:</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(finalCostPerKg)} / kg</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRoastModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRoasting}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Simpan & Posting Jurnal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SURAT JALAN TRANSFER BARU */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-black">Buat Surat Jalan Transfer Stok</h3>
            <p className="text-xs text-neutral-500">
              Pengiriman dari Central Roastery Ciengang ke Cabang Utama Sukabumi.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">Jumlah Biji Kopi Sangrai (Kg)</label>
                <input
                  type="number"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Nama Driver / Ekspedisi</label>
                <input
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Nomor Plat Kendaraan</label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTransfer}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Kirim & Cetak Surat Jalan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
