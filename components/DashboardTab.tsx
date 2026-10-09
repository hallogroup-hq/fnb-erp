'use client'

import React from 'react'
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ChefHat,
  FileSpreadsheet,
  FileText,
  Clock,
  ReceiptText,
  Building2,
  Store,
  Layers,
  ArrowRight,
} from 'lucide-react'
import type { IncomeStatementReport, BalanceSheetReport, AgingSummary } from '../lib/accounting/financialReports'
import type { InventoryItem, Outlet, Order, TableFloor } from '../types/erp'
import { CENTRAL_HQ_OUTLET } from '../lib/store/mockStore'
import { exportIncomeStatementExcel } from '../lib/export/excelFormulaReports'
import { exportOfficialFinancialStatementPdf } from '../lib/export/pdfDocumentGenerator'

interface DashboardTabProps {
  pnl: IncomeStatementReport
  balanceSheet: BalanceSheetReport
  apAging: AgingSummary
  arAging: AgingSummary
  inventory: InventoryItem[]
  activeOutlet?: Outlet
  outlets?: Outlet[]
  orders?: Order[]
  tables?: TableFloor[]
  onSelectOutlet?: (outlet: Outlet) => void
  onNavigate: (tab: string) => void
}

function formatRupiah(num: number): string {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID')
}

export default function DashboardTab({
  pnl,
  balanceSheet,
  apAging,
  arAging,
  inventory,
  activeOutlet = CENTRAL_HQ_OUTLET,
  outlets = [],
  orders = [],
  tables = [],
  onSelectOutlet,
  onNavigate,
}: DashboardTabProps) {
  const isHqMode = activeOutlet.id === 'all'

  // Hitung valuasi stok
  const totalInventoryValuation = inventory.reduce((s, i) => {
    const qty = isHqMode
      ? i.currentStock
      : (i.stockByOutlet?.[activeOutlet.id] ?? i.currentStock)
    return s + qty * i.unitCost
  }, 0)

  // Hitung peringatan stok menipis
  const lowStock = inventory.filter((i) => {
    const qty = isHqMode
      ? i.currentStock
      : (i.stockByOutlet?.[activeOutlet.id] ?? i.currentStock)
    return qty <= i.minStock
  })

  // Performa per cabang (Multi-Outlet Matrix)
  const branchMetrics = outlets.map((outlet) => {
    const branchOrders = orders.filter((o) => o.outletId === outlet.id && o.status === 'completed')
    const branchRevenue = branchOrders.reduce((s, o) => s + o.total, 0)
    const branchCount = branchOrders.length
    const branchAov = branchCount > 0 ? Math.round(branchRevenue / branchCount) : 0
    const branchTables = tables.filter((t) => t.outletId === outlet.id)
    const occupiedTables = branchTables.filter((t) => t.status === 'occupied').length
    const branchStockVal = inventory.reduce((s, it) => {
      const q = it.stockByOutlet?.[outlet.id] ?? 0
      return s + q * it.unitCost
    }, 0)

    return {
      outlet,
      revenue: branchRevenue,
      orderCount: branchCount,
      aov: branchAov,
      totalTables: branchTables.length,
      occupiedTables,
      stockValuation: branchStockVal,
    }
  })

  const totalGroupRevenue = branchMetrics.reduce((s, b) => s + b.revenue, 0)

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE CONTEXT BANNER */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-tight ${
                isHqMode
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-900 border border-stone-200'
              }`}
            >
              {isHqMode ? 'Konsolidasi Seluruh Cabang' : activeOutlet.name}
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs font-mono text-neutral-500">
              {isHqMode ? 'Semua Unit Terhubung' : `Kode: ${activeOutlet.code || 'OUT-01'}`}
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-black mt-1.5">
            {isHqMode
              ? 'Tinjauan Eksekutif Pemilik'
              : `Ringkasan Operasional Cabang · ${activeOutlet.name}`}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isHqMode
              ? 'Konsolidasi performa, omset harian, dan kesehatan finansial seluruh outlet grup resto'
              : `Data operasional kasir, meja, dan stok khusus ${activeOutlet.name}`}
          </p>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isHqMode && onSelectOutlet && (
            <button
              onClick={() => onSelectOutlet(CENTRAL_HQ_OUTLET)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 text-xs font-semibold tracking-tight transition-all cursor-pointer"
            >
              <Building2 size={13} className="text-stone-700" />
              <span>Konsolidasi Holding</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            <Store size={13} />
            <span>Kasir POS</span>
            <ArrowUpRight size={13} />
          </button>
          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200 text-xs font-medium tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            <ReceiptText size={13} className="text-neutral-600" />
            <span>Riwayat Struk</span>
          </button>
          <button
            onClick={() => exportIncomeStatementExcel(pnl)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200 text-xs font-medium tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileSpreadsheet size={13} className="text-emerald-700" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => exportOfficialFinancialStatementPdf('pnl', pnl)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200 text-xs font-medium tracking-tight transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileText size={13} className="text-rose-700" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* REVENUE */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>{isHqMode ? 'Omset Konsolidasi Grup' : 'Pendapatan Bersih Cabang'}</span>
            <TrendingUp size={14} className="text-neutral-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-black tabular-nums">
            {formatRupiah(pnl.netRevenue)}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            Laba Kotor: <span className="font-semibold text-neutral-900">{formatRupiah(pnl.grossProfit)}</span> ({pnl.grossProfitMarginPct.toFixed(1)}%)
          </div>
        </div>

        {/* NET PROFIT */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>{isHqMode ? 'Laba Bersih Konsolidasi' : 'Laba Bersih Cabang'}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {pnl.netProfitMarginPct.toFixed(1)}% MARGIN
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-800 tabular-nums">
            {formatRupiah(pnl.netProfit)}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            Beban Usaha: <span className="font-semibold text-neutral-900">{formatRupiah(pnl.totalOperatingExpenses)}</span>
          </div>
        </div>

        {/* INVENTORY VALUATION */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>{isHqMode ? 'Valuasi Stok Seluruh Cabang' : 'Valuasi Stok Cabang Ini'}</span>
            <Package size={14} className="text-neutral-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-black tabular-nums">
            {formatRupiah(totalInventoryValuation)}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {isHqMode ? `${outlets.length} Cabang & Gudang Pusat` : `Gudang ${activeOutlet.name}`}
          </div>
        </div>

        {/* AP / AR BALANCE */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>Hutang Supplier & Piutang B2B</span>
            <Clock size={14} className="text-neutral-400" />
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-600">Hutang ke Supplier (AP):</span>
              <span className="font-bold text-neutral-900 tabular-nums">{formatRupiah(apAging.total)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-600">Piutang Klien B2B (AR):</span>
              <span className="font-bold text-neutral-900 tabular-nums">{formatRupiah(arAging.total)}</span>
            </div>
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span>Neraca:</span>
            <span className={`font-semibold ${balanceSheet.isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
              {balanceSheet.isBalanced ? 'Seimbang (Balanced) ✓' : 'Selisih'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MULTI-BRANCH OWNER PERFORMANCE MATRIX (KHUSUS MODE PUSAT / OWNER) */}
      {isHqMode && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-black" />
                <h3 className="font-bold text-base text-black tracking-tight">
                  Matriks Performa Antar Cabang (Multi-Outlet Overview)
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Perbandingan omset, jumlah transaksi, rata-rata belanja, dan okupansi per outlet
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700">
              Total {outlets.length} Cabang Terdaftar
            </span>
          </div>

          {/* PROGRESS BARS KONTRIBUSI OMSET */}
          {totalGroupRevenue > 0 && (
            <div className="space-y-2 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span>Distribusi Kontribusi Omset Cabang</span>
                <span className="tabular-nums">Total: {formatRupiah(totalGroupRevenue)}</span>
              </div>
              <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden flex">
                {branchMetrics.map((b, idx) => {
                  const pct = totalGroupRevenue > 0 ? (b.revenue / totalGroupRevenue) * 100 : 0
                  const colors = ['bg-stone-900', 'bg-stone-700', 'bg-stone-500', 'bg-stone-400']
                  return (
                    <div
                      key={b.outlet.id}
                      style={{ width: `${pct}%` }}
                      className={`h-full ${colors[idx % colors.length]}`}
                      title={`${b.outlet.name}: ${pct.toFixed(1)}%`}
                    />
                  )
                })}
              </div>
              <div className="flex items-center gap-4 flex-wrap text-[11px] text-neutral-600 pt-1">
                {branchMetrics.map((b, idx) => {
                  const pct = totalGroupRevenue > 0 ? (b.revenue / totalGroupRevenue) * 100 : 0
                  const dotColors = ['bg-stone-900', 'bg-stone-700', 'bg-stone-500', 'bg-stone-400']
                  return (
                    <div key={b.outlet.id} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`}></span>
                      <span className="font-medium">{b.outlet.name}:</span>
                      <span className="font-bold">{pct.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* BRANCH CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchMetrics.map((b) => (
              <div
                key={b.outlet.id}
                className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {b.outlet.code || 'OUTLET'}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {b.occupiedTables} / {b.totalTables || 10} Meja Terisi
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-black mt-2">{b.outlet.name}</h4>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">{b.outlet.address}</p>

                  <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-neutral-400">Total Penjualan</div>
                      <div className="font-bold text-black tabular-nums">{formatRupiah(b.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Transaksi Selesai</div>
                      <div className="font-bold text-neutral-800">{b.orderCount} pesanan</div>
                    </div>
                    <div className="mt-1">
                      <div className="text-[10px] text-neutral-400">Rata-rata Order (AOV)</div>
                      <div className="font-semibold text-neutral-700 tabular-nums">{formatRupiah(b.aov)}</div>
                    </div>
                    <div className="mt-1">
                      <div className="text-[10px] text-neutral-400">Valuasi Stok Cabang</div>
                      <div className="font-semibold text-neutral-700 tabular-nums">{formatRupiah(b.stockValuation)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      if (onSelectOutlet) onSelectOutlet(b.outlet)
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Masuk & Kelola Cabang Ini</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS, UPCOMING BILLS & MENU STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LOW STOCK ALERTS */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="font-bold text-sm text-black">
                {isHqMode ? 'Peringatan Stok Menipis (Grup)' : `Stok Menipis · ${activeOutlet.name}`}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
              {lowStock.length} Item
            </span>
          </div>

          <div className="space-y-2.5">
            {lowStock.slice(0, 4).map((it) => {
              const itemStock = isHqMode
                ? it.currentStock
                : (it.stockByOutlet?.[activeOutlet.id] ?? it.currentStock)

              return (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs"
                >
                  <div>
                    <div className="font-semibold text-neutral-900">{it.name}</div>
                    <div className="text-[11px] text-neutral-500">
                      Batas Min: {it.minStock} {it.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-700">
                      Sisa {itemStock} {it.unit}
                    </span>
                    <div className="text-[10px] text-neutral-400">Segera PO / Transfer</div>
                  </div>
                </div>
              )
            })}
            {lowStock.length === 0 && (
              <div className="text-center py-6 text-xs text-neutral-400">
                Seluruh persediaan dalam ambang batas aman.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="w-full py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold hover:bg-neutral-50 transition-all text-neutral-800 cursor-pointer min-h-[38px]"
          >
            Buka Manajemen Inventori & Mutasi
          </button>
        </div>

        {/* UPCOMING & OVERDUE BILLS */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-rose-600" />
              <h3 className="font-bold text-sm text-black">Jatuh Tempo Hutang Supplier (AP)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              {apAging.items.length} Tagihan
            </span>
          </div>

          <div className="space-y-2.5">
            {apAging.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs"
              >
                <div>
                  <div className="font-semibold text-neutral-900">{item.entityName}</div>
                  <div className="text-[11px] text-neutral-500">
                    {item.refNumber} · JT: {new Date(item.dueDate).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-neutral-900">{formatRupiah(item.balanceDue)}</div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      item.daysPastDue > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.daysPastDue > 0 ? `Telat ${item.daysPastDue} Hari` : 'Belum Jatuh Tempo'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('purchasing')}
            className="w-full py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold hover:bg-neutral-50 transition-all text-neutral-800 cursor-pointer min-h-[38px]"
          >
            Lihat Laporan Umur Hutang
          </button>
        </div>

        {/* TOP PERFORMING MENU & LIVE KDS */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat size={16} className="text-neutral-900" />
              <h3 className="font-bold text-sm text-black">
                {isHqMode ? 'Menu Terlaris (Lintas Cabang)' : `Menu Terlaris · ${activeOutlet.name}`}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-neutral-500">Live KDS</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">Nasi Goreng Kampung Spesial</div>
                <div className="text-[11px] text-neutral-500">Food Cost: 21.8% · Margin Tinggi</div>
              </div>
              <span className="font-bold text-neutral-900">42 porsi</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">Wagyu Burger & Truffle Fries</div>
                <div className="text-[11px] text-neutral-500">Food Cost: 33.1% · Signature Dish</div>
              </div>
              <span className="font-bold text-neutral-900">28 porsi</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">Iced Cafe Latte (Oat / Fresh)</div>
                <div className="text-[11px] text-neutral-500">Beverage Cost: 18.5% · Best Seller</div>
              </div>
              <span className="font-bold text-neutral-900">56 cup</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('kds')}
            className="w-full py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            Buka KDS Dapur & Bar
          </button>
        </div>
      </div>
    </div>
  )
}
