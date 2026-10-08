'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Filter,
  Printer,
  FileDown,
  X,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Coins,
  CreditCard,
  QrCode,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  User,
  Clock,
  Store,
  ChefHat,
  Wine,
  BellRing,
  Check,
  Building2,
} from 'lucide-react'
import type { Order, Outlet, Shift, PaymentMethod, User as UserType } from '../types/erp'
import {
  generateEscPosPlainText,
  generateXReportPlainText,
  generateEscPosKitchenTicketText,
} from '../lib/hardware/escpos'
import { printThermalReceiptViaIframe } from '../lib/hardware/printer'
import { downloadThermalReceiptPdf } from '../lib/export/receiptPdf'
import ExcelJS from 'exceljs'

interface TransactionHistoryTabProps {
  orders: Order[]
  activeOutlet: Outlet
  outlets?: Outlet[]
  shift?: Shift
  currentUser?: UserType
  onReprintReceipt?: (order: Order) => void
  onVoidOrder: (orderId: string, reason: string) => void
  onCloseShift?: (actualCash: number, notes: string) => void
  onOpenShift?: (staffName: string, openingCash: number) => void
  onRecordPettyCash?: (amount: number, type: 'in' | 'out', reason: string, staffName: string) => void
  onOpenPos?: () => void
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function TransactionHistoryTab({
  orders,
  activeOutlet,
  outlets = [],
  shift,
  currentUser,
  onVoidOrder,
  onCloseShift,
  onOpenShift,
  onRecordPettyCash,
  onOpenPos,
  onUpdateOrderStatus,
}: TransactionHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'preparing' | 'ready' | 'completed' | 'cancelled'>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all')
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>(activeOutlet.id || 'all')

  useEffect(() => {
    if (activeOutlet?.id) {
      setSelectedOutletFilter(activeOutlet.id)
    }
  }, [activeOutlet?.id])

  // SELECTED ORDER FOR DETAIL DRAWER
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // VOID MODAL STATE
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null)
  const [voidReason, setVoidReason] = useState('')

  // SHIFT RECAP MODAL STATE
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [actualCashCount, setActualCashCount] = useState('')
  const [shiftClosingNotes, setShiftClosingNotes] = useState('')
  const [shiftClosedSuccess, setShiftClosedSuccess] = useState(false)

  // OPEN SHIFT MODAL STATE
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false)
  const [openShiftStaff, setOpenShiftStaff] = useState(currentUser?.name || shift?.staffName || 'Kasir Utama')
  const [openShiftCash, setOpenShiftCash] = useState('500000')

  // PETTY CASH MODAL STATE
  const [showPettyCashModal, setShowPettyCashModal] = useState(false)
  const [pettyType, setPettyType] = useState<'out' | 'in'>('out')
  const [pettyAmount, setPettyAmount] = useState('')
  const [pettyReason, setPettyReason] = useState('')
  const [pettyStaff, setPettyStaff] = useState(currentUser?.name || shift?.staffName || 'Kasir Utama')

  // STATUS COUNTS FOR LIVE ORDER TRACKER
  const preparingCount = useMemo(() => orders.filter((o) => o.status === 'preparing').length, [orders])
  const readyCount = useMemo(() => orders.filter((o) => o.status === 'ready').length, [orders])
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'completed').length, [orders])
  const openCount = useMemo(() => orders.filter((o) => o.status === 'open').length, [orders])
  const cancelledCount = useMemo(() => orders.filter((o) => o.status === 'cancelled').length, [orders])

  // FILTERED ORDERS
  const filteredOrders = useMemo(() => {
    const now = Date.now()
    const oneDayMs = 86400000

    return orders.filter((o) => {
      const matchOutlet =
        selectedOutletFilter === 'all' ||
        !o.outletId ||
        o.outletId === selectedOutletFilter

      const matchSearch =
        !searchQuery ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.tableName && o.tableName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.staffName && o.staffName.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter
      const matchChannel = channelFilter === 'all' || o.channel === channelFilter

      const matchDate =
        dateFilter === 'all'
          ? true
          : dateFilter === 'today'
          ? now - o.createdAt <= oneDayMs
          : dateFilter === '7days'
          ? now - o.createdAt <= 7 * oneDayMs
          : now - o.createdAt <= 30 * oneDayMs

      return matchOutlet && matchSearch && matchStatus && matchPayment && matchChannel && matchDate
    })
  }, [orders, selectedOutletFilter, searchQuery, statusFilter, paymentFilter, channelFilter, dateFilter])

  // KPI STATS FOR TODAY
  const completedOrders = orders.filter((o) => {
    const matchOutlet = selectedOutletFilter === 'all' || !o.outletId || o.outletId === selectedOutletFilter
    return matchOutlet && (o.status === 'completed' || o.status === 'preparing')
  })
  const cancelledOrders = orders.filter((o) => {
    const matchOutlet = selectedOutletFilter === 'all' || !o.outletId || o.outletId === selectedOutletFilter
    return matchOutlet && o.status === 'cancelled'
  })

  const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const totalCashRevenue = completedOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0)
  const totalQrisRevenue = completedOrders
    .filter((o) => o.paymentMethod === 'qris')
    .reduce((sum, o) => sum + o.total, 0)
  const totalTransferDebitRevenue = completedOrders
    .filter((o) => o.paymentMethod === 'transfer' || o.paymentMethod === 'debit')
    .reduce((sum, o) => sum + o.total, 0)

  // SHIFT CALCULATIONS
  const openingCash = shift?.openingCash ?? 500000
  const expectedCashInDrawer = openingCash + totalCashRevenue
  const actualCashNum = Number(actualCashCount) || 0
  const cashDiscrepancy = actualCashCount ? actualCashNum - expectedCashInDrawer : 0

  function handleTriggerVoid(order: Order) {
    setOrderToVoid(order)
    setVoidReason('')
    setShowVoidModal(true)
  }

  function handleConfirmVoid() {
    if (!orderToVoid || !voidReason.trim()) return
    onVoidOrder(orderToVoid.id, voidReason.trim())
    setShowVoidModal(false)
    if (selectedOrder && selectedOrder.id === orderToVoid.id) {
      setSelectedOrder({ ...orderToVoid, status: 'cancelled', notes: voidReason.trim() })
    }
    setOrderToVoid(null)
  }

  function handleExportTransactionsExcel() {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Nusantara Bistro ERP'
    const ws = wb.addWorksheet('Riwayat Transaksi POS')

    ws.columns = [
      { width: 18, header: 'No. Struk' },
      { width: 20, header: 'Waktu' },
      { width: 14, header: 'Meja / Saluran' },
      { width: 22, header: 'Pelanggan' },
      { width: 35, header: 'Rincian Menu' },
      { width: 14, header: 'Metode Bayar' },
      { width: 16, header: 'Total (Rp)' },
      { width: 14, header: 'Status' },
      { width: 20, header: 'Kasir' },
    ]

    orders.forEach((o) => {
      const itemsSummary = o.items.map((it) => `${it.qty}x ${it.name}`).join(', ')
      ws.addRow([
        o.orderNumber,
        new Date(o.createdAt).toLocaleString('id-ID'),
        o.tableName || (o.channel === 'bar' ? 'Bar / Takeaway' : 'Dine-In'),
        o.customerName || 'Tamu Resto',
        itemsSummary,
        o.paymentMethod.toUpperCase(),
        o.total,
        o.status === 'completed' ? 'LUNAS' : 'BATAL (VOID)',
        o.staffName || 'Kasir',
      ])
    })

    wb.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="space-y-6">
      {/* HEADER & TOP CONTROLS */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Riwayat Transaksi
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenPos && (
            <button
              onClick={onOpenPos}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-800 hover:bg-neutral-100 border border-[#E5E7EB] text-xs font-semibold tracking-tight transition-all cursor-pointer min-h-[38px]"
            >
              <Store size={14} />
              <span>Buka POS</span>
            </button>
          )}

          {shift?.status === 'closed' ? (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-xs min-h-[38px]"
            >
              <Coins size={14} />
              <span>Buka Shift</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowPettyCashModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-semibold tracking-tight transition-all cursor-pointer min-h-[38px]"
              >
                <Coins size={14} className="text-amber-700" />
                <span>Kas Kecil</span>
              </button>

              <button
                onClick={() => setShowShiftModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-xs min-h-[38px]"
              >
                <Coins size={14} />
                <span>Rekap Shift</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportTransactionsExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet size={14} className="text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS (ANTISLOP RESTRAINED HIERARCHY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Total Omset Kasir Hari Ini</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums">
            {formatRupiah(totalGrossRevenue)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            Dari {completedOrders.length} transaksi lunas
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Uang Tunai di Laci Kasir</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums">
            {formatRupiah(totalCashRevenue)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            Modal Awal: {formatRupiah(openingCash)}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Penerimaan QRIS</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums">
            {formatRupiah(totalQrisRevenue)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            Langsung masuk rekening penampungan
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Transfer & Debit EDC</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums">
            {formatRupiah(totalTransferDebitRevenue)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            BCA Settlement & EDC EDC
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR WITH STATUS TRACKER */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5">
        {/* QUICK STATUS TRACKER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all' as const, label: 'Semua Pesanan', count: orders.length, icon: null },
            { id: 'preparing' as const, label: 'Sedang Dimasak', count: preparingCount, icon: ChefHat },
            { id: 'ready' as const, label: 'Siap Saji', count: readyCount, icon: BellRing },
            { id: 'completed' as const, label: 'Selesai & Lunas', count: completedCount, icon: CheckCircle2 },
            { id: 'open' as const, label: 'Open Bill', count: openCount, icon: Clock },
            { id: 'cancelled' as const, label: 'Void / Batal', count: cancelledCount, icon: RotateCcw },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 border-[#E5E7EB] hover:bg-neutral-100 hover:text-black'
                }`}
              >
                {Icon && <Icon size={12} className={isSelected ? 'text-white' : 'text-neutral-500'} />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* SEARCH */}
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. struk (NBR-...), nama meja, nama tamu, kasir..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-[#E5E7EB] text-xs focus:outline-none focus:border-black focus:bg-white transition-colors"
            />
          </div>

          {/* OUTLET & DATE FILTERS */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-50 border border-[#E5E7EB]">
              <Building2 size={13} className="text-neutral-500 shrink-0" />
              <select
                value={selectedOutletFilter}
                onChange={(e) => setSelectedOutletFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="all">🏢 Semua Cabang (Konsolidasi)</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    📍 {o.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-[#E5E7EB] text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
            </select>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-[#E5E7EB] text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status ({orders.length})</option>
              <option value="preparing">🍳 Sedang Dimasak ({preparingCount})</option>
              <option value="ready">🔔 Siap Saji ({readyCount})</option>
              <option value="completed">✓ Selesai & Lunas ({completedCount})</option>
              <option value="open">⚪ Open Bill ({openCount})</option>
              <option value="cancelled">✕ Dibatalkan / Void ({cancelledCount})</option>
            </select>

            {/* PAYMENT FILTER */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-[#E5E7EB] text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="qris">QRIS</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="transfer">Transfer Bank</option>
              <option value="debit">Kartu Debit</option>
            </select>

            {/* CHANNEL FILTER */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-[#E5E7EB] text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Saluran</option>
              <option value="dine_in">Meja Dine-In</option>
              <option value="bar">Bar Counter / Takeaway</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Struk & Jam</th>
                <th className="py-3 px-4">Meja / Saluran</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Rincian Menu</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => {
                const isCancelled = order.status === 'cancelled'
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-neutral-900">{order.orderNumber}</span>
                        {order.outletId && (
                          <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {outlets.find((o) => o.id === order.outletId)?.code || order.outletId}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-sans">
                        {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-neutral-800">
                        {order.tableName || (order.channel === 'bar' ? 'Bar Counter' : 'Dine-In')}
                      </span>
                      <div className="text-[11px] text-neutral-400 capitalize">{order.channel}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-900">
                        {order.customerName || 'Tamu Resto'}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Kasir: {order.staffName || 'Kasir'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate text-neutral-700">
                        {order.items.map((it) => `${it.qty}x ${it.name}`).join(', ')}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {order.items.reduce((s, it) => s + it.qty, 0)} item pesanan
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {order.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-neutral-900 tabular-nums">
                      {formatRupiah(order.total)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {order.status === 'preparing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <ChefHat size={11} className="text-amber-800" />
                          <span>Dimasak</span>
                        </span>
                      )}
                      {order.status === 'ready' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300 animate-pulse">
                          <BellRing size={11} className="text-blue-800" />
                          <span>Siap Saji</span>
                        </span>
                      )}
                      {order.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 size={11} className="text-emerald-800" />
                          <span>Lunas</span>
                        </span>
                      )}
                      {order.status === 'open' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-300">
                          <Clock size={11} className="text-stone-600" />
                          <span>Open Bill</span>
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                          <RotateCcw size={11} className="text-rose-700" />
                          <span>Batal</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const targetConfig = outlets.find((o) => o.id === order.outletId)?.receiptConfig || activeOutlet.receiptConfig
                            downloadThermalReceiptPdf(order, targetConfig)
                          }}
                          title="Simpan PDF Struk Roll"
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                        >
                          <FileDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const targetConfig = outlets.find((o) => o.id === order.outletId)?.receiptConfig || activeOutlet.receiptConfig
                            printThermalReceiptViaIframe(
                              generateEscPosPlainText(order, targetConfig),
                              targetConfig.paperWidth
                            )
                          }}
                          title="Cetak Ulang Struk Thermal (Roll)"
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada riwayat transaksi yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / RECEIPT INSPECTOR MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E5E7EB] animate-in slide-in-from-right duration-200">
            {/* DRAWER HEADER */}
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <div className="text-xs text-neutral-500 font-mono">
                  {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}
                </div>
                <h2 className="text-lg font-bold text-black">{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* DRAWER BODY (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* ORDER LIFECYCLE TRACKER & PROGRESS STEPPER */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-neutral-900">Alur Status Pesanan</span>
                  <span className="text-[11px] font-semibold text-neutral-500 font-sans">
                    {Math.max(1, Math.floor((Date.now() - selectedOrder.createdAt) / 60000))} mnt lalu
                  </span>
                </div>

                {/* 4-STEP VISUAL PROGRESS */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {/* STEP 1: DITERIMA */}
                  <div className={`p-2 rounded-xl text-[10px] font-bold border transition-colors ${
                    selectedOrder.status !== 'cancelled'
                      ? 'bg-black text-white border-black shadow-2xs'
                      : 'bg-neutral-200 text-neutral-500 border-neutral-300'
                  }`}>
                    <div className="flex justify-center mb-0.5"><Check size={12} /></div>
                    <span>1. Diterima</span>
                  </div>

                  {/* STEP 2: DIMASAK */}
                  <div className={`p-2 rounded-xl text-[10px] font-bold border transition-colors ${
                    selectedOrder.status === 'preparing'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs animate-pulse'
                      : selectedOrder.status === 'ready' || selectedOrder.status === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-neutral-400 border-neutral-200'
                  }`}>
                    <div className="flex justify-center mb-0.5"><ChefHat size={12} /></div>
                    <span>2. Dimasak</span>
                  </div>

                  {/* STEP 3: SIAP SAJI */}
                  <div className={`p-2 rounded-xl text-[10px] font-bold border transition-colors ${
                    selectedOrder.status === 'ready'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-2xs animate-pulse'
                      : selectedOrder.status === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-neutral-400 border-neutral-200'
                  }`}>
                    <div className="flex justify-center mb-0.5"><BellRing size={12} /></div>
                    <span>3. Siap Saji</span>
                  </div>

                  {/* STEP 4: SELESAI */}
                  <div className={`p-2 rounded-xl text-[10px] font-bold border transition-colors ${
                    selectedOrder.status === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-neutral-400 border-neutral-200'
                  }`}>
                    <div className="flex justify-center mb-0.5"><CheckCircle2 size={12} /></div>
                    <span>4. Selesai</span>
                  </div>
                </div>

                {/* QUICK STATUS TRANSITION BUTTONS */}
                {selectedOrder.status !== 'cancelled' && onUpdateOrderStatus && (
                  <div className="pt-1 flex gap-2">
                    {selectedOrder.status === 'preparing' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateOrderStatus(selectedOrder.id, 'ready')
                          setSelectedOrder({ ...selectedOrder, status: 'ready' })
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <BellRing size={13} />
                        <span>Tandai Siap Saji (Ready to Serve)</span>
                      </button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateOrderStatus(selectedOrder.id, 'completed')
                          setSelectedOrder({ ...selectedOrder, status: 'completed' })
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        <span>Tandai Selesai & Disajikan</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ORDER SUMMARY PILL */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Status Operasional:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                      selectedOrder.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedOrder.status === 'preparing'
                        ? 'bg-amber-100 text-amber-900'
                        : selectedOrder.status === 'ready'
                        ? 'bg-blue-100 text-blue-900'
                        : selectedOrder.status === 'open'
                        ? 'bg-stone-100 text-stone-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedOrder.status === 'cancelled'
                      ? 'Dibatalkan (Void)'
                      : selectedOrder.status === 'preparing'
                      ? 'Sedang Dimasak (Kitchen)'
                      : selectedOrder.status === 'ready'
                      ? 'Siap Saji (Ready to Serve)'
                      : selectedOrder.status === 'open'
                      ? 'Menunggu Bayar (Open Bill)'
                      : 'Selesai & Lunas'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Meja / Saluran:</span>
                  <span className="font-semibold text-neutral-900">
                    {selectedOrder.tableName || 'Takeaway'} ({selectedOrder.channel})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Nama Pelanggan:</span>
                  <span className="font-semibold text-neutral-900">
                    {selectedOrder.customerName || 'Tamu Resto'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Kasir Bertugas:</span>
                  <span className="font-semibold text-neutral-900">{selectedOrder.staffName || 'Kasir'}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="pt-1.5 border-t border-neutral-200 text-neutral-600">
                    <span className="font-semibold">Catatan:</span> {selectedOrder.notes}
                  </div>
                )}
              </div>

              {/* ITEM LIST */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-neutral-900 block">Item Belanjaan</span>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="p-3 flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-neutral-900">{it.name}</div>
                        <div className="text-[11px] text-neutral-500">
                          {it.qty}x @ {formatRupiah(it.price)}
                        </div>
                        {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {it.selectedModifiers.map((m) => `+ ${m.name}`).join(', ')}
                          </div>
                        )}
                        {it.notes && (
                          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                            Catatan: {it.notes}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatRupiah(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FINANCIAL BREAKDOWN */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal:</span>
                  <span className="tabular-nums font-medium text-neutral-900">
                    {formatRupiah(selectedOrder.subtotal)}
                  </span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon {selectedOrder.discountNote ? `(${selectedOrder.discountNote})` : ''}:</span>
                    <span className="tabular-nums font-medium">-{formatRupiah(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                {selectedOrder.serviceChargeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Service Charge (5%):</span>
                    <span className="tabular-nums font-medium text-neutral-900">
                      {formatRupiah(selectedOrder.serviceChargeAmount)}
                    </span>
                  </div>
                )}
                {selectedOrder.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Pajak Restoran PB1 (10%):</span>
                    <span className="tabular-nums font-medium text-neutral-900">
                      {formatRupiah(selectedOrder.taxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-black pt-2 border-t border-neutral-200">
                  <span>Total Tagihan:</span>
                  <span className="tabular-nums">{formatRupiah(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 pt-1">
                  <span>Metode Bayar:</span>
                  <span className="font-bold uppercase text-neutral-900">{selectedOrder.paymentMethod}</span>
                </div>
                {selectedOrder.cashReceived && (
                  <>
                    <div className="flex justify-between text-neutral-500">
                      <span>Tunai Diterima:</span>
                      <span className="tabular-nums">{formatRupiah(selectedOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500">
                      <span>Kembalian:</span>
                      <span className="tabular-nums font-semibold text-neutral-900">
                        {formatRupiah(selectedOrder.changeAmount ?? 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* THERMAL PREVIEW CODE BLOCK */}
              {(() => {
                const selectedOrderConfig = outlets.find((o) => o.id === selectedOrder.outletId)?.receiptConfig || activeOutlet.receiptConfig
                return (
                  <>
                    <div className="space-y-1.5">
                      <span className="font-bold text-xs text-neutral-900 block">
                        Format Struk Thermal Roll ({selectedOrderConfig.paperWidth})
                      </span>
                      <pre className="p-3 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-[10px] leading-tight overflow-x-auto whitespace-pre">
                        {generateEscPosPlainText(selectedOrder, selectedOrderConfig)}
                      </pre>
                    </div>

                    {/* DRAWER FOOTER ACTIONS */}
                    <div className="mt-4 pt-4 border-t border-[#E5E7EB] bg-white space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => downloadThermalReceiptPdf(selectedOrder, selectedOrderConfig)}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold text-neutral-900 cursor-pointer transition-colors"
                        >
                          <FileDown size={14} />
                          <span>PDF Roll</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            printThermalReceiptViaIframe(
                              generateEscPosPlainText(selectedOrder, selectedOrderConfig),
                              selectedOrderConfig.paperWidth
                            )
                          }}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        >
                          <Printer size={14} />
                          <span>Struk Kasir</span>
                        </button>
                      </div>

                      {/* RE-PRINT KITCHEN & BAR TICKETS */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            printThermalReceiptViaIframe(
                              generateEscPosKitchenTicketText(selectedOrder, selectedOrderConfig, 'kitchen'),
                              selectedOrderConfig.paperWidth
                            )
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <ChefHat size={14} className="text-amber-800" />
                          <span>Tiket Dapur (KOT)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            printThermalReceiptViaIframe(
                              generateEscPosKitchenTicketText(selectedOrder, selectedOrderConfig, 'bar'),
                              selectedOrderConfig.paperWidth
                            )
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <Wine size={14} className="text-emerald-800" />
                          <span>Tiket Bar (BOT)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )
              })()}

              {selectedOrder.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => handleTriggerVoid(selectedOrder)}
                  className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Batalkan / Void Transaksi Ini</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VOID CONFIRMATION MODAL */}
      {showVoidModal && orderToVoid && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert size={20} />
              <h3 className="font-bold text-base text-black">Batalkan Transaksi (Void)</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Transaksi <strong>{orderToVoid.orderNumber}</strong> senilai{' '}
              <strong>{formatRupiah(orderToVoid.total)}</strong> akan dibatalkan. Stok bahan baku
              akan dikembalikan dan jurnal pembalik akan dicatat ke buku besar.
            </p>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Alasan Pembatalan / Void:
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Contoh: Tamu salah pesan, salah meja, atau komplain..."
                className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black min-h-[70px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={!voidReason.trim()}
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT RECAP & CASH DRAWER CLOSING MODAL (X-REPORT / Z-REPORT) */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="font-bold text-base text-black">Rekap Shift & Laci Kasir</h3>
                <span className="text-[11px] text-neutral-500">Laporan Penjualan X-Report / Z-Report</span>
              </div>
              <button
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* CASH DRAWER RECONCILIATION */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Kasir Bertugas:</span>
                <span className="font-bold text-neutral-900">{shift?.staffName || currentUser?.name || 'Kasir Utama'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Modal Kas Awal di Laci:</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatRupiah(openingCash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Penjualan Tunai Shift Ini:</span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  +{formatRupiah(totalCashRevenue)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-black pt-1.5 border-t border-neutral-200">
                <span>Total Estimasi Uang Kas:</span>
                <span className="tabular-nums">{formatRupiah(expectedCashInDrawer)}</span>
              </div>
            </div>

            {/* PHYSICAL CASH COUNT INPUT */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-neutral-800 block">
                Uang Fisik Aktual Dihitung Kasir di Laci (Rp):
              </label>
              <input
                type="number"
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                placeholder={`Contoh: ${expectedCashInDrawer}`}
                className="w-full p-2.5 rounded-xl border border-neutral-200 font-bold text-sm focus:outline-none focus:border-black"
              />
              {actualCashCount && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    cashDiscrepancy === 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : cashDiscrepancy > 0
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span>Selisih Kas Laci:</span>
                  <span className="tabular-nums font-bold">
                    {cashDiscrepancy === 0
                      ? 'SESUAI (PAS) ✓'
                      : `${cashDiscrepancy > 0 ? '+' : ''}${formatRupiah(cashDiscrepancy)} (${
                          cashDiscrepancy > 0 ? 'Kelebihan' : 'Kekurangan'
                        })`}
                  </span>
                </div>
              )}
            </div>

            {/* NON-CASH BREAKDOWN */}
            <div className="space-y-1 text-[11px] text-neutral-500">
              <div className="flex justify-between">
                <span>Penerimaan QRIS:</span>
                <span className="font-semibold text-neutral-900 tabular-nums">{formatRupiah(totalQrisRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transfer & Debit EDC:</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  {formatRupiah(totalTransferDebitRevenue)}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const xReportText = generateXReportPlainText({
                    outletName: activeOutlet.name,
                    branchName: activeOutlet.receiptConfig.branchName,
                    staffName: shift?.staffName || currentUser?.name || 'Kasir Utama',
                    openingCash,
                    totalCashRevenue,
                    totalQrisRevenue,
                    totalTransferDebitRevenue,
                    actualCashCount: actualCashNum,
                    cashDiscrepancy,
                    completedOrderCount: completedOrders.length,
                    cancelledOrderCount: cancelledOrders.length,
                    paperWidth: activeOutlet.receiptConfig.paperWidth,
                  })
                  printThermalReceiptViaIframe(xReportText, activeOutlet.receiptConfig.paperWidth)
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak X-Report (Roll)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onCloseShift) onCloseShift(actualCashNum, shiftClosingNotes)
                  setShiftClosedSuccess(true)
                  setTimeout(() => {
                    setShiftClosedSuccess(false)
                    setShowShiftModal(false)
                  }, 1800)
                }}
                className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {shiftClosedSuccess ? 'Shift Ditutup ✓' : 'Tutup Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUKA SHIFT KASIR */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-emerald-600" />
                <h3 className="font-bold text-base text-black">Buka Shift Kasir</h3>
              </div>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nama Kasir Bertugas:</label>
                <input
                  value={openShiftStaff}
                  onChange={(e) => setOpenShiftStaff(e.target.value)}
                  placeholder="Contoh: Kasir Shift Pagi"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Modal Kas Awal di Laci (Rp):</label>
                <input
                  type="number"
                  value={openShiftCash}
                  onChange={(e) => setOpenShiftCash(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-sm tabular-nums focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!openShiftStaff.trim() || Number(openShiftCash) < 0}
                onClick={() => {
                  if (onOpenShift) {
                    onOpenShift(openShiftStaff.trim(), Number(openShiftCash) || 0)
                  }
                  setShowOpenShiftModal(false)
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Buka Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENCATATAN KAS KECIL (PETTY CASH) */}
      {showPettyCashModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-amber-600" />
                <h3 className="font-bold text-base text-black">Kas Kecil (Petty Cash)</h3>
              </div>
              <button
                onClick={() => setShowPettyCashModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* TYPE SWITCHER */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPettyType('out')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  pettyType === 'out'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-black'
                }`}
              >
                Kas Keluar
              </button>
              <button
                type="button"
                onClick={() => setPettyType('in')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  pettyType === 'in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-black'
                }`}
              >
                Kas Masuk
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nominal Uang Tunai (Rp):</label>
                <input
                  type="number"
                  value={pettyAmount}
                  onChange={(e) => setPettyAmount(e.target.value)}
                  placeholder="Contoh: 25000"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-sm tabular-nums focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Keterangan / Keperluan:</label>
                <input
                  value={pettyReason}
                  onChange={(e) => setPettyReason(e.target.value)}
                  placeholder={
                    pettyType === 'out'
                      ? 'Contoh: Beli es batu kristal tambahan, galon air, parkir supplier'
                      : 'Contoh: Penambahan uang receh modal kembalian dari brankas'
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Kasir / Penanggung Jawab:</label>
                <input
                  value={pettyStaff}
                  onChange={(e) => setPettyStaff(e.target.value)}
                  placeholder="Nama kasir..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPettyCashModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!pettyAmount || Number(pettyAmount) <= 0 || !pettyReason.trim()}
                onClick={() => {
                  if (onRecordPettyCash) {
                    onRecordPettyCash(
                      Number(pettyAmount),
                      pettyType,
                      pettyReason.trim(),
                      pettyStaff.trim() || 'Kasir'
                    )
                  }
                  setShowPettyCashModal(false)
                  setPettyAmount('')
                  setPettyReason('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                  pettyType === 'out' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-40`}
              >
                Simpan Kas Kecil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
