'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Coffee,
  Check,
  BellRing,
  Volume2,
  VolumeX,
  Printer,
  Building2,
} from 'lucide-react'
import type { Order, ReceiptConfig, Outlet } from '../types/erp'
import { generateEscPosKitchenTicketText } from '../lib/hardware/escpos'
import { printThermalReceiptViaIframe } from '../lib/hardware/printer'

interface KdsTabProps {
  orders: Order[]
  receiptConfig?: ReceiptConfig
  activeOutlet?: Outlet
  outlets?: Outlet[]
  onMarkItemDone: (orderId: string, lineItemId: string) => void
  onCompleteOrder: (orderId: string) => void
}

function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // AudioContext blocked by browser autoplay policy until user gesture
  }
}

export default function KdsTab({
  orders,
  receiptConfig,
  activeOutlet,
  outlets = [],
  onMarkItemDone,
  onCompleteOrder,
}: KdsTabProps) {
  const [stationFilter, setStationFilter] = useState<'all' | 'bar' | 'kitchen'>('all')
  const [selectedKdsOutlet, setSelectedKdsOutlet] = useState<string>(activeOutlet?.id || 'all')
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const previousOrderCount = useRef(orders.length)

  useEffect(() => {
    if (activeOutlet?.id) {
      setSelectedKdsOutlet(activeOutlet.id)
    }
  }, [activeOutlet?.id])

  // Real-time ticking interval every 15s to update ticket elapsed minutes
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  // Audio chime when new order arrives in kitchen
  useEffect(() => {
    if (orders.length > previousOrderCount.current) {
      if (soundEnabled) {
        playKitchenChime()
      }
    }
    previousOrderCount.current = orders.length
  }, [orders.length, soundEnabled])

  // Filter orders where items are still being prepared or completed within last hour
  const activeOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === 'cancelled') return false
      const matchOutlet = selectedKdsOutlet === 'all' || !o.outletId || o.outletId === selectedKdsOutlet
      if (!matchOutlet) return false
      const hasUnfinishedItems = o.items.some((it) => !it.isCompletedInKitchen)
      const isRecent = currentTime - o.createdAt < 7200000 // 2 hours
      return hasUnfinishedItems && isRecent
    })
  }, [orders, selectedKdsOutlet, currentTime])

  // Count active tickets per station
  const barCount = activeOrders.filter((o) =>
    o.items.some((it) => !it.isKitchenItem && !it.isCompletedInKitchen)
  ).length

  const kitchenCount = activeOrders.filter((o) =>
    o.items.some((it) => it.isKitchenItem && !it.isCompletedInKitchen)
  ).length

  function handlePrintKdsTicket(order: Order) {
    const cfg = receiptConfig || {
      storeName: 'NUSANTARA BISTRO & CAFE',
      branchName: 'Outlet Utama',
      legalAddress: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
      phone: '0812-8888-9999',
      paperWidth: '80mm' as const,
      showTax: true,
      showServiceCharge: true,
      showModifierDetails: true,
      showCashierName: true,
      customFooterMessage: '',
    }
    const txt = generateEscPosKitchenTicketText(order, cfg, stationFilter)
    printThermalReceiptViaIframe(txt, cfg.paperWidth)
  }

  return (
    <div className="space-y-6 select-none">
      {/* HEADER & HIGH-CONTRAST STATION TABS */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            KDS Dapur
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* OUTLET SELECTOR FOR KDS */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
            <Building2 size={13} className="text-neutral-500 shrink-0" />
            <select
              value={selectedKdsOutlet}
              onChange={(e) => setSelectedKdsOutlet(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="all">🏢 Semua Dapur (Pusat)</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  📍 {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* TACTILE 44px STATION TABS */}
          <div className="flex items-center gap-2 p-1 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex-1 sm:flex-none flex-wrap sm:flex-nowrap">
          {[
            { id: 'all', label: 'Semua', count: activeOrders.length, icon: BellRing },
            { id: 'bar', label: 'Bar', count: barCount, icon: Coffee },
            { id: 'kitchen', label: 'Dapur', count: kitchenCount, icon: UtensilsCrossed },
          ].map((st) => {
            const Icon = st.icon
            const isSelected = stationFilter === st.id
            return (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id as typeof stationFilter)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-200/60'
                }`}
              >
                <Icon size={14} />
                <span>{st.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-white text-black' : 'bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            )
          })}
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              if (!soundEnabled) playKitchenChime()
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[42px] flex items-center justify-center ${
              soundEnabled
                ? 'bg-white border-neutral-300 text-neutral-800 hover:border-black'
                : 'bg-neutral-100 border-neutral-200 text-neutral-400'
            }`}
            title={soundEnabled ? 'Suara Lonceng Aktif' : 'Suara Dibisukan'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* TICKETS GRID - HIGH CONTRAST & LEGIBLE FROM 2 METERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeOrders.map((order) => {
          // Filter items based on station filter
          const relevantItems = order.items.filter((it) => {
            if (stationFilter === 'all') return true
            if (stationFilter === 'kitchen') return it.isKitchenItem
            if (stationFilter === 'bar') return !it.isKitchenItem
            return true
          })

          if (relevantItems.length === 0) return null

          const elapsedMins = Math.floor((currentTime - order.createdAt) / 60000)
          const isLate = elapsedMins >= 15
          const isWarning = elapsedMins >= 10 && elapsedMins < 15
          const allRelevantDone = relevantItems.every((it) => it.isCompletedInKitchen)

          return (
            <div
              key={order.id}
              className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all bg-white shadow-xs ${
                isLate
                  ? 'border-rose-500 ring-4 ring-rose-100'
                  : isWarning
                  ? 'border-amber-400 ring-2 ring-amber-50'
                  : 'border-[#E5E7EB]'
              }`}
            >
              <div>
                {/* TICKET HEADER: BIG CALLOUT FOR MEJA / TAKEAWAY */}
                <div className="flex items-start justify-between pb-3.5 border-b border-neutral-200">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="text-xl font-black text-black tracking-tight truncate">
                        {order.tableName ? `MEJA ${order.tableName.toUpperCase()}` : 'BAR / TAKEAWAY'}
                      </div>
                      {order.outletId && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {outlets.find((o) => o.id === order.outletId)?.code || order.outletId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                      <span>#{order.orderNumber}</span>
                      <span>·</span>
                      <span className="font-sans font-medium text-neutral-700 truncate">
                        {order.customerName || 'Tamu Resto'}
                      </span>
                    </div>
                  </div>

                  {/* ELAPSED TIMER BADGE & PRINT BUTTON */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePrintKdsTicket(order)}
                      className="p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                      title="Cetak Tiket Kertas ke Printer Dapur/Bar"
                    >
                      <Printer size={14} />
                    </button>

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                        isLate
                          ? 'bg-rose-600 text-white'
                          : isWarning
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      <Clock size={13} />
                      <span>{elapsedMins} mnt</span>
                    </div>
                  </div>
                </div>

                {/* ITEMS CHECKLIST (READABLE FROM 2 METERS) */}
                <div className="space-y-2.5 py-4">
                  {relevantItems.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => onMarkItemDone(order.id, it.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        it.isCompletedInKitchen
                          ? 'bg-neutral-50 border-neutral-200 opacity-45 line-through'
                          : 'bg-white border-neutral-200 hover:border-black text-black shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* BIG QUANTITY TAG */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                            it.isCompletedInKitchen
                              ? 'bg-neutral-200 text-neutral-600'
                              : 'bg-black text-white'
                          }`}
                        >
                          {it.qty}x
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-neutral-950 leading-snug">
                            {it.name}
                          </div>

                          {/* MODIFIER PILLS */}
                          {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {it.selectedModifiers.map((m) => (
                                <span
                                  key={m.id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200"
                                >
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* SPECIAL NOTES */}
                          {it.notes && (
                            <div className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 mt-1.5 inline-block">
                              Catatan: {it.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CHECK CIRCLE */}
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          it.isCompletedInKitchen
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-neutral-300 text-transparent hover:border-black'
                        }`}
                      >
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TICKET FOOTER: BUMP BUTTON (52px MIN HEIGHT, EASY TO HIT WITH GLOVES) */}
              <button
                onClick={() => onCompleteOrder(order.id)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all active:scale-[0.98] cursor-pointer min-h-[50px] shadow-xs flex items-center justify-center gap-2 ${
                  allRelevantDone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                <CheckCircle2 size={18} />
                <span>{allRelevantDone ? 'TIKET SELESAI (BUMP)' : 'Tandai Siap Saji / Selesai'}</span>
              </button>
            </div>
          )
        })}

        {activeOrders.length === 0 && (
          <div className="col-span-full text-center py-24 bg-white rounded-2xl border border-neutral-200 text-neutral-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center mx-auto text-neutral-400">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <p className="font-bold text-sm text-neutral-800">Semua Pesanan Selesai Disajikan</p>
            <p className="text-xs text-neutral-500">Antrean stasiun bar dan dapur sedang kosong.</p>
          </div>
        )}
      </div>
    </div>
  )
}
