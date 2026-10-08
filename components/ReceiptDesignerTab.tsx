'use client'

import React, { useState } from 'react'
import { Printer, CheckCircle2, FileDown, ChefHat, Wine, Layers } from 'lucide-react'
import type { ReceiptConfig, Order } from '../types/erp'
import {
  generateEscPosPlainText,
  generateEscPosKitchenTicketText,
  generateEscPosCheckerTicketText,
} from '../lib/hardware/escpos'
import {
  downloadThermalReceiptPdf,
  downloadThermalKitchenTicketPdf,
} from '../lib/export/receiptPdf'
import { printThermalReceiptViaIframe } from '../lib/hardware/printer'

interface ReceiptDesignerTabProps {
  config: ReceiptConfig
  onSaveConfig: (newConfig: ReceiptConfig) => void
}

export default function ReceiptDesignerTab({
  config,
  onSaveConfig,
}: ReceiptDesignerTabProps) {
  const [cfg, setCfg] = useState<ReceiptConfig>({ ...config })
  const [saved, setSaved] = useState(false)
  const [previewType, setPreviewType] = useState<'receipt' | 'kitchen' | 'bar' | 'checker'>('receipt')

  // SAMPLE DUMMY ORDER FOR REALTIME PREVIEW
  const sampleOrder: Order = {
    id: 'ord-preview',
    orgId: 'org-resto',
    outletId: 'out-senopati',
    orderNumber: 'NBR-202610-0042',
    channel: 'bar',
    tableName: 'Meja 03',
    customerName: 'Bapak Rian',
    items: [
      {
        id: '1',
        menuItemId: 'menu-caffe-latte',
        name: 'Caffe Latte (Iced)',
        price: 40000,
        qty: 2,
        subtotal: 80000,
        selectedModifiers: [{ id: 'm1', name: 'Oatly Oat Milk', priceAdd: 8000 }],
        notes: 'Less Sugar 50%',
      },
      {
        id: '2',
        menuItemId: 'menu-croissant',
        name: 'Almond Butter Croissant',
        price: 28000,
        qty: 1,
        subtotal: 28000,
      },
    ],
    subtotal: 108000,
    discountAmount: 10000,
    serviceChargeAmount: 4900,
    taxAmount: 10290,
    total: 113190,
    paymentMethod: 'qris',
    payments: [{ method: 'qris', amount: 113190 }],
    status: 'completed',
    staffName: 'Kasir Utama',
    createdAt: Date.now(),
  }

  function handleSave() {
    onSaveConfig(cfg)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Format Struk
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (previewType === 'receipt') {
                downloadThermalReceiptPdf(sampleOrder, cfg)
              } else if (previewType === 'kitchen') {
                downloadThermalKitchenTicketPdf(sampleOrder, cfg, 'kitchen')
              } else if (previewType === 'bar') {
                downloadThermalKitchenTicketPdf(sampleOrder, cfg, 'bar')
              } else {
                downloadThermalKitchenTicketPdf(sampleOrder, cfg, 'all')
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileDown size={14} className="text-neutral-700" />
            <span>Test PDF ({previewType === 'receipt' ? 'Struk' : previewType === 'kitchen' ? 'KOT' : previewType === 'bar' ? 'BOT' : 'Checker'})</span>
          </button>
          <button
            onClick={() => {
              const text =
                previewType === 'receipt'
                  ? generateEscPosPlainText(sampleOrder, cfg)
                  : previewType === 'kitchen'
                  ? generateEscPosKitchenTicketText(sampleOrder, cfg, 'kitchen')
                  : previewType === 'bar'
                  ? generateEscPosKitchenTicketText(sampleOrder, cfg, 'bar')
                  : generateEscPosCheckerTicketText(sampleOrder, cfg)
              printThermalReceiptViaIframe(text, cfg.paperWidth)
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            <Printer size={14} className="text-neutral-700" />
            <span>Test Print</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            {saved ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Printer size={14} />}
            <span>{saved ? 'Tersimpan ✓' : 'Simpan Format'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: FORM KUSTOMISASI (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 text-xs">
          <div className="font-bold text-sm text-black border-b border-neutral-100 pb-2">
            Parameter Identitas & Tata Letak
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700">Lebar Kertas Thermal</label>
              <select
                value={cfg.paperWidth}
                onChange={(e) => setCfg({ ...cfg, paperWidth: e.target.value as '58mm' | '80mm' })}
                className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black"
              >
                <option value="58mm">58mm (Standar Mini 32 Kolom)</option>
                <option value="80mm">80mm (Desktop Resto 48 Kolom)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-neutral-700">Nama Usaha / Brand</label>
              <input
                value={cfg.storeName}
                onChange={(e) => setCfg({ ...cfg, storeName: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700">Nama Cabang / Outlet</label>
              <input
                value={cfg.branchName}
                onChange={(e) => setCfg({ ...cfg, branchName: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700">No. Telepon / WhatsApp</label>
              <input
                value={cfg.phone}
                onChange={(e) => setCfg({ ...cfg, phone: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700">Alamat Lengkap</label>
            <input
              value={cfg.legalAddress}
              onChange={(e) => setCfg({ ...cfg, legalAddress: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700">Instagram Handle</label>
              <input
                value={cfg.instagram || ''}
                onChange={(e) => setCfg({ ...cfg, instagram: e.target.value })}
                placeholder="@nusantarabistro.id"
                className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700">Password WiFi Outlet</label>
              <input
                value={cfg.wifiPassword || ''}
                onChange={(e) => setCfg({ ...cfg, wifiPassword: e.target.value })}
                placeholder="makansampaikenyang"
                className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <span className="font-bold text-neutral-800 text-xs block">Pilihan Rincian Finansial & Elemen</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.showTax}
                  onChange={(e) => setCfg({ ...cfg, showTax: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-neutral-800">Cetak Pajak Resto (PB1)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.showServiceCharge}
                  onChange={(e) => setCfg({ ...cfg, showServiceCharge: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-neutral-800">Cetak Service Charge</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.showModifierDetails}
                  onChange={(e) => setCfg({ ...cfg, showModifierDetails: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-neutral-800">Cetak Rincian Modifier/Susu</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.showCashierName}
                  onChange={(e) => setCfg({ ...cfg, showCashierName: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-neutral-800">Cetak Nama Kasir</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700">Pesan Footer Kustom</label>
            <textarea
              rows={2}
              value={cfg.customFooterMessage}
              onChange={(e) => setCfg({ ...cfg, customFooterMessage: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* RIGHT: REALTIME THERMAL PREVIEW (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-sm text-black">Pratinjau Hasil Cetak Thermal</span>
            <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
              Roll {cfg.paperWidth}
            </span>
          </div>

          {/* PREVIEW TYPE SELECTOR TABS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#F8F7F4] rounded-xl border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPreviewType('receipt')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                previewType === 'receipt'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Struk Kasir
            </button>
            <button
              type="button"
              onClick={() => setPreviewType('kitchen')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                previewType === 'kitchen'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Tiket Dapur
            </button>
            <button
              type="button"
              onClick={() => setPreviewType('bar')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                previewType === 'bar'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Tiket Bar
            </button>
            <button
              type="button"
              onClick={() => setPreviewType('checker')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                previewType === 'checker'
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Checker
            </button>
          </div>

          {/* SIMULATED THERMAL PAPER */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 font-mono text-[11px] leading-tight text-neutral-900 whitespace-pre shadow-inner overflow-x-auto max-h-[500px]">
            {previewType === 'receipt'
              ? generateEscPosPlainText(sampleOrder, cfg)
              : previewType === 'kitchen'
              ? generateEscPosKitchenTicketText(sampleOrder, cfg, 'kitchen')
              : previewType === 'bar'
              ? generateEscPosKitchenTicketText(sampleOrder, cfg, 'bar')
              : generateEscPosCheckerTicketText(sampleOrder, cfg)}
          </div>
        </div>
      </div>
    </div>
  )
}
