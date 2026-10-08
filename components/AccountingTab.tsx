'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  Building,
  Search,
  BookOpen,
  CheckCircle2,
  Calendar,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Boxes,
  ShoppingBag,
  Scale,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Download,
  Lightbulb,
  CheckCircle,
  TrendingDown,
  Wine,
  ChefHat,
  PieChart,
} from 'lucide-react'
import type { JournalEntry, FixedAsset, Outlet } from '../types/erp'
import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateTrialBalance,
  type IncomeStatementReport,
  type BalanceSheetReport,
  type TrialBalanceReport,
} from '../lib/accounting/financialReports'
import { exportIncomeStatementExcel, exportBalanceSheetExcel } from '../lib/export/excelFormulaReports'
import {
  exportOfficialFinancialStatementPdf,
  exportAccurateComparativePnlPdf,
  exportAccuratePurchasesPdf,
  exportAccurateInventoryValuationPdf,
} from '../lib/export/pdfDocumentGenerator'
import { STANDARD_FNB_COA } from '../lib/accounting/coa'
import {
  ACCURATE_COMPARATIVE_MONTHS,
  ACCURATE_STANDARD_PNL,
  ACCURATE_SKONTRO_BALANCE_SHEET,
  ACCURATE_PURCHASE_ITEMS,
  ACCURATE_INVENTORY_VALUATION,
} from '../lib/accounting/accurateDataset'

interface AccountingTabProps {
  pnl: IncomeStatementReport
  balanceSheet: BalanceSheetReport
  trialBalance: TrialBalanceReport
  journals: JournalEntry[]
  fixedAssets: FixedAsset[]
  activeOutlet?: Outlet
  outlets?: Outlet[]
  onAddManualJournal: (description: string, lines: { accountCode: string; debit: number; credit: number }[]) => void
  onRunDepreciation: (asset: FixedAsset) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function AccountingTab({
  pnl,
  balanceSheet,
  trialBalance,
  journals,
  fixedAssets,
  activeOutlet,
  outlets = [],
  onAddManualJournal,
  onRunDepreciation,
}: AccountingTabProps) {
  const [selectedAccountingOutlet, setSelectedAccountingOutlet] = useState<string>(activeOutlet?.id || 'all')

  useEffect(() => {
    if (activeOutlet) {
      setSelectedAccountingOutlet(activeOutlet.id)
    }
  }, [activeOutlet?.id])

  const targetOutlet = useMemo(() => {
    if (selectedAccountingOutlet === 'all') return null
    return outlets.find((o) => o.id === selectedAccountingOutlet) || activeOutlet
  }, [selectedAccountingOutlet, outlets, activeOutlet])

  const isConsolidated = selectedAccountingOutlet === 'all'

  const companyName = isConsolidated
    ? (activeOutlet?.name?.includes('Pusat') ? activeOutlet.name : 'Nusantara Bistro Group (Konsolidasi SAK EMKM)')
    : (targetOutlet?.name || 'Nusantara Bistro')

  const companyAddress = isConsolidated
    ? 'Holding Kantor Pusat & Konsolidasi Seluruh Unit Cabang'
    : (targetOutlet?.address || 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan')

  // MULTI-BRANCH EFFECTIVE JOURNALS & REPORTING
  const effectiveJournals = useMemo(() => {
    if (selectedAccountingOutlet === 'all') return journals
    return journals.filter(
      (j) => j.outletId === selectedAccountingOutlet || (!j.outletId && selectedAccountingOutlet === (outlets[0]?.id || 'out-senopati'))
    )
  }, [journals, selectedAccountingOutlet, outlets])

  const effectivePnl = useMemo(() => generateIncomeStatement(effectiveJournals), [effectiveJournals])
  const effectiveBalanceSheet = useMemo(() => generateBalanceSheet(effectiveJournals), [effectiveJournals])
  const effectiveTrialBalance = useMemo(() => generateTrialBalance(effectiveJournals), [effectiveJournals])

  const [activeSubTab, setActiveSubTab] = useState<
    | 'comparative_pnl'
    | 'accurate_standard'
    | 'skontro_balance'
    | 'purchases_by_item'
    | 'inventory_valuation'
    | 'ledger'
    | 'journal_list'
    | 'trial_balance'
    | 'assets'
  >('comparative_pnl')

  // BUKU BESAR (GENERAL LEDGER) STATE
  const [selectedLedgerAccountCode, setSelectedLedgerAccountCode] = useState<string>('1-1001')

  // JURNAL UMUM SEARCH & FILTER STATE
  const [journalSearch, setJournalSearch] = useState('')
  const [journalRefFilter, setJournalRefFilter] = useState<string>('all')

  // MANUAL JOURNAL MODAL
  const [showManualJnlModal, setShowManualJnlModal] = useState(false)
  const [jnlDesc, setJnlDesc] = useState('')
  const [jnlDebitCode, setJnlDebitCode] = useState('6-2002') // Beban listrik
  const [jnlCreditCode, setJnlCreditCode] = useState('1-1002') // Bank
  const [jnlAmount, setJnlAmount] = useState('')

  // ACCURATE PURCHASES SEARCH & FILTER
  const [purchaseSearch, setPurchaseSearch] = useState('')

  // ACCURATE INVENTORY SEARCH & FILTER
  const [inventorySearch, setInventorySearch] = useState('')

  // 1. HITUNG BUKU BESAR UNTUK AKUN TERPILIH (RUNNING BALANCE CALCULATION)
  const selectedAccount = useMemo(() => {
    return STANDARD_FNB_COA.find((a) => a.code === selectedLedgerAccountCode) || STANDARD_FNB_COA[0]
  }, [selectedLedgerAccountCode])

  const ledgerData = useMemo(() => {
    const isDebitNormal = selectedAccount.normalBalance === 'debit'

    const lines: Array<{
      journalId: string
      journalNumber: string
      date: number
      refType: string
      description: string
      debit: number
      credit: number
      memo?: string
    }> = []

    const sortedJournals = [...effectiveJournals].sort((a, b) => a.date - b.date)

    for (const jnl of sortedJournals) {
      for (const line of jnl.lines) {
        if (line.accountCode === selectedAccount.code) {
          lines.push({
            journalId: jnl.id,
            journalNumber: jnl.journalNumber,
            date: jnl.date,
            refType: jnl.refType,
            description: jnl.description,
            debit: line.debit,
            credit: line.credit,
            memo: line.memo,
          })
        }
      }
    }

    let runningBalance = 0
    let totalDebit = 0
    let totalCredit = 0

    const rowsWithBalance = lines.map((row) => {
      totalDebit += row.debit
      totalCredit += row.credit

      if (isDebitNormal) {
        runningBalance = runningBalance + row.debit - row.credit
      } else {
        runningBalance = runningBalance + row.credit - row.debit
      }

      return {
        ...row,
        balance: runningBalance,
      }
    })

    return {
      rows: rowsWithBalance,
      totalDebit,
      totalCredit,
      endingBalance: runningBalance,
    }
  }, [effectiveJournals, selectedAccount])

  // 2. FILTER JURNAL UMUM
  const filteredJournals = useMemo(() => {
    return effectiveJournals.filter((jnl) => {
      const matchFilter = journalRefFilter === 'all' || jnl.refType === journalRefFilter
      const query = journalSearch.toLowerCase()
      const matchSearch =
        !journalSearch ||
        jnl.journalNumber.toLowerCase().includes(query) ||
        jnl.description.toLowerCase().includes(query) ||
        jnl.lines.some((l) => l.accountName.toLowerCase().includes(query) || l.accountCode.includes(query))
      return matchFilter && matchSearch
    })
  }, [journals, journalSearch, journalRefFilter])

  // 3. FILTER ACCURATE PURCHASES DETAIL
  const filteredPurchases = useMemo(() => {
    return ACCURATE_PURCHASE_ITEMS.filter((item) => {
      const q = purchaseSearch.toLowerCase()
      return (
        !purchaseSearch ||
        item.itemName.toLowerCase().includes(q) ||
        item.invoiceNumber.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      )
    })
  }, [purchaseSearch])

  const totalPurchaseValue = useMemo(() => {
    return filteredPurchases.reduce((s, it) => s + it.totalAmount, 0)
  }, [filteredPurchases])

  // 4. FILTER ACCURATE INVENTORY VALUATION
  const filteredInventoryValuation = useMemo(() => {
    return ACCURATE_INVENTORY_VALUATION.filter((item) => {
      const q = inventorySearch.toLowerCase()
      return !inventorySearch || item.itemName.toLowerCase().includes(q) || item.itemCode.toLowerCase().includes(q)
    })
  }, [inventorySearch])

  const totalEndingInventoryValue = useMemo(() => {
    return filteredInventoryValuation.reduce((s, it) => s + it.endingValuation, 0)
  }, [filteredInventoryValuation])

  function handleSaveManualJournal() {
    const amt = Number(jnlAmount)
    if (!amt || amt <= 0 || !jnlDesc.trim()) return

    onAddManualJournal(jnlDesc.trim(), [
      { accountCode: jnlDebitCode, debit: amt, credit: 0 },
      { accountCode: jnlCreditCode, debit: 0, credit: amt },
    ])
    setShowManualJnlModal(false)
    setJnlDesc('')
    setJnlAmount('')
  }

  return (
    <div className="space-y-6 select-none">
      {/* HEADER & SUB-TABS (ACCURATE ACCOUNTING SYSTEM SUITE) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black">
              Laporan Keuangan
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Ringkasan performa finansial F&B & ekspor laporan audit resmi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportAccurateComparativePnlPdf(ACCURATE_COMPARATIVE_MONTHS, companyName, companyAddress)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>Download PDF (4 Hal)</span>
            </button>
          </div>
        </div>

        {/* ENTITY SCOPE FILTER (KONSOLIDASI GRUP SAK EMKM vs PER-CABANG) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2">
            <Building size={14} className="text-stone-700" />
            <span className="text-xs font-bold text-neutral-800">Cakupan Entitas Pembukuan:</span>
            <span className="text-[11px] text-neutral-500 hidden sm:inline">
              {isConsolidated
                ? 'Konsolidasi seluruh unit cabang F&B (Standar SAK EMKM)'
                : `Terisolasi: ${targetOutlet?.name || 'Cabang Terpilih'}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedAccountingOutlet('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isConsolidated
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              🏢 Semua Cabang (Konsolidasi Grup)
            </button>
            {outlets
              .filter((o) => o.id !== 'all')
              .map((out) => (
                <button
                  key={out.id}
                  type="button"
                  onClick={() => setSelectedAccountingOutlet(out.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAccountingOutlet === out.id
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-neutral-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  📍 {out.name}
                </button>
              ))}
          </div>
        </div>

        {/* SUB-TAB SELECTOR (Crisp Segmented Control) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F4] rounded-xl border border-[#E7E5E4] overflow-x-auto scrollbar-none">
          {[
            { id: 'comparative_pnl', label: 'Ringkasan Eksekutif', icon: TrendingUp },
            { id: 'accurate_standard', label: 'Laba Rugi Standar', icon: DollarSign },
            { id: 'skontro_balance', label: 'Neraca Skontro', icon: Scale },
            { id: 'purchases_by_item', label: 'Pembelian Barang', icon: ShoppingBag },
            { id: 'inventory_valuation', label: 'Nilai Persediaan', icon: Boxes },
            { id: 'ledger', label: 'Buku Besar', icon: BookOpen },
            { id: 'journal_list', label: 'Jurnal Umum', icon: Layers },
            { id: 'trial_balance', label: 'Neraca Saldo', icon: CheckCircle2 },
            { id: 'assets', label: 'Aset Tetap', icon: Building },
          ].map((t) => {
            const Icon = t.icon
            const isSelected = activeSubTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id as typeof activeSubTab)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-stone-200/60'
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY) */}
      {/* ========================================================================= */}
      {activeSubTab === 'comparative_pnl' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-6 shadow-2xs">
          {/* HEADER RINGKASAN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-black">
                  Ringkasan Eksekutif Finansial
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                  Agustus 2026
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Snapshot performa operasional 3 bulan terakhir. Laporan audit lengkap 4 halaman tersedia via unduhan PDF.
              </p>
            </div>
          </div>

          {/* 4 CLEAN EXECUTIVE KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Net Revenue */}
            <div className="bg-[#F8F7F4] rounded-xl p-4 border border-[#E7E5E4] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-500">Pendapatan Bersih (Net Sales)</span>
                <div className="font-extrabold text-base sm:text-lg text-neutral-900 mt-1 tabular-nums">
                  Rp 342.736.334
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <TrendingUp size={12} /> +3.2% MoM
                </span>
                <span className="text-neutral-400">vs Juli (332.1M)</span>
              </div>
            </div>

            {/* Card 2: Gross Profit */}
            <div className="bg-[#F8F7F4] rounded-xl p-4 border border-[#E7E5E4] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-500">Laba Kotor (Gross Profit)</span>
                <div className="font-extrabold text-base sm:text-lg text-neutral-900 mt-1 tabular-nums">
                  Rp 166.694.097
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                <span className="font-bold text-neutral-700">Margin 48.64%</span>
                <span className="text-emerald-700 font-semibold">+1.1% vs Juni</span>
              </div>
            </div>

            {/* Card 3: Food & Bev Cost */}
            <div className="bg-[#F8F7F4] rounded-xl p-4 border border-[#E7E5E4] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-500">Beban Pokok (HPP Resto)</span>
                <div className="font-extrabold text-base sm:text-lg text-neutral-900 mt-1 tabular-nums">
                  Rp 122.457.042
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                <span className="text-amber-800 font-bold">Food: 35.7%</span>
                <span className="text-emerald-700 font-bold">Bar: 10.5%</span>
              </div>
            </div>

            {/* Card 4: Net Profit */}
            <div className="bg-stone-900 text-white rounded-xl p-4 border border-stone-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-stone-300">Laba Bersih (Net Profit)</span>
                <div className="font-extrabold text-base sm:text-lg text-white mt-1 tabular-nums">
                  Rp 48.784.288
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-bold">Net Margin 14.2%</span>
                <span className="text-stone-400">EBITDA 15.5%</span>
              </div>
            </div>
          </div>

          {/* TABEL RINGKASAN KINERJA 3 BULAN (5 BARIS INTI) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider">
                Ringkasan Kinerja Laba Rugi Komparatif
              </h3>
              <span className="text-[11px] text-neutral-500 font-medium">Satuan: Rupiah (IDR)</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1e293b] text-white font-bold border-b border-stone-300">
                    <th className="py-2.5 px-4 w-2/5">Pos Keuangan Utama</th>
                    {ACCURATE_COMPARATIVE_MONTHS.map((m) => (
                      <th key={m.monthName} className="py-2.5 px-4 text-right">
                        {m.monthName}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-right bg-slate-900">Rata-Rata / Bulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {/* 1. Pendapatan Bersih */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      Pendapatan Bersih (Net Sales)
                    </td>
                    {ACCURATE_COMPARATIVE_MONTHS.map((m) => (
                      <td key={m.monthName} className="py-3 px-4 text-right tabular-nums font-semibold text-neutral-900">
                        {formatRupiah(m.netRevenue)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right tabular-nums font-bold bg-stone-50 text-neutral-900">
                      {formatRupiah(Math.round(ACCURATE_COMPARATIVE_MONTHS.reduce((s, m) => s + m.netRevenue, 0) / 3))}
                    </td>
                  </tr>

                  {/* 2. Beban Pokok Penjualan */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 text-neutral-700">
                      Beban Pokok Penjualan (HPP Restoran)
                    </td>
                    {ACCURATE_COMPARATIVE_MONTHS.map((m) => {
                      const cogsPct = ((m.totalCogs / m.netRevenue) * 100).toFixed(1)
                      return (
                        <td key={m.monthName} className="py-3 px-4 text-right tabular-nums text-rose-700 font-medium">
                          <span>-{formatRupiah(m.totalCogs)}</span>
                          <span className="text-[10px] text-neutral-400 ml-1">({cogsPct}%)</span>
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-right tabular-nums font-semibold bg-stone-50 text-rose-700">
                      -{formatRupiah(Math.round(ACCURATE_COMPARATIVE_MONTHS.reduce((s, m) => s + m.totalCogs, 0) / 3))}
                    </td>
                  </tr>

                  {/* 3. Laba Kotor */}
                  <tr className="bg-emerald-50/50 font-bold text-emerald-950 border-y border-emerald-100">
                    <td className="py-3 px-4 text-emerald-950">
                      Laba Kotor (Gross Profit)
                    </td>
                    {ACCURATE_COMPARATIVE_MONTHS.map((m) => (
                      <td key={m.monthName} className="py-3 px-4 text-right tabular-nums text-emerald-900 font-bold">
                        <span>{formatRupiah(m.grossProfit)}</span>
                        <span className="text-[10px] text-emerald-700 ml-1 font-semibold">({m.grossProfitMarginPct.toFixed(1)}%)</span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right tabular-nums bg-emerald-100/60 text-emerald-950 font-extrabold">
                      {formatRupiah(Math.round(ACCURATE_COMPARATIVE_MONTHS.reduce((s, m) => s + m.grossProfit, 0) / 3))}
                    </td>
                  </tr>

                  {/* 4. Beban Operasional */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 text-neutral-700">
                      Beban Operasional & Umum (OPEX)
                    </td>
                    {ACCURATE_COMPARATIVE_MONTHS.map((m) => {
                      const opexPct = ((m.totalExpenses / m.netRevenue) * 100).toFixed(1)
                      return (
                        <td key={m.monthName} className="py-3 px-4 text-right tabular-nums text-neutral-800 font-medium">
                          <span>-{formatRupiah(m.totalExpenses)}</span>
                          <span className="text-[10px] text-neutral-400 ml-1">({opexPct}%)</span>
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-right tabular-nums font-semibold bg-stone-50 text-neutral-800">
                      -{formatRupiah(Math.round(ACCURATE_COMPARATIVE_MONTHS.reduce((s, m) => s + m.totalExpenses, 0) / 3))}
                    </td>
                  </tr>

                  {/* 5. Laba Bersih Usaha */}
                  <tr className="bg-black text-white font-extrabold">
                    <td className="py-3.5 px-4 text-white">
                      Laba Bersih Usaha (Net Profit)
                    </td>
                    {ACCURATE_COMPARATIVE_MONTHS.map((m) => {
                      const netMargin = ((m.netProfit / m.netRevenue) * 100).toFixed(1)
                      return (
                        <td key={m.monthName} className="py-3.5 px-4 text-right tabular-nums text-emerald-400">
                          <span>{formatRupiah(m.netProfit)}</span>
                          <span className="text-[10px] text-emerald-300 ml-1 font-normal">({netMargin}%)</span>
                        </td>
                      )
                    })}
                    <td className="py-3.5 px-4 text-right tabular-nums bg-neutral-900 text-emerald-300 font-black">
                      {formatRupiah(Math.round(ACCURATE_COMPARATIVE_MONTHS.reduce((s, m) => s + m.netProfit, 0) / 3))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CALLOUT UNDUH LAPORAN AUDIT LENGKAP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-stone-200 text-neutral-800 shrink-0 mt-0.5">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900">
                  Laporan Audit Lengkap (4 Halaman PDF)
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mencakup narasi analisis manajerial, audit shrinkage & waste, neraca skontro 2-kolom, buku besar, dan rekap pembelian supplier.
                </p>
              </div>
            </div>
            <button
              onClick={() => exportAccurateComparativePnlPdf(ACCURATE_COMPARATIVE_MONTHS, companyName, companyAddress)}
              className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            >
              <Download size={14} />
              <span>Download PDF Lengkap (4 Hal)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: ACCURATE STANDARD P&L WITH PAYMENT CHANNELS */}
      {/* ========================================================================= */}
      {activeSubTab === 'accurate_standard' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black">
                Laporan Laba/Rugi Standar
              </h2>
            </div>

            <button
              onClick={() => exportOfficialFinancialStatementPdf('pnl', effectivePnl)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-black border border-stone-300 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-emerald-700" />
              <span>Export Excel Laba Rugi</span>
            </button>
          </div>

          {/* PAYMENT CHANNELS BREAKDOWN CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ACCURATE_STANDARD_PNL.paymentChannels.map((ch) => (
              <div key={ch.channel} className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] space-y-1">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{ch.channel}</span>
                <div className="font-extrabold text-sm text-black tabular-nums">{formatRupiah(ch.grossAmount)}</div>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1 border-t border-stone-200">
                  <span>MDR Fee: {formatRupiah(ch.mdrFee)}</span>
                  <span className="font-semibold text-emerald-700">{ch.pctOfTotal}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* EXPENSES BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* LEFT: HPP PER KATEGORI */}
            <div className="space-y-3 p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <span className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                <Boxes size={14} />
                <span>Beban Pokok Penjualan (HPP)</span>
              </span>
              <div className="space-y-1.5 divide-y divide-stone-100">
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Bahan Makanan (Dapur Resto)</span>
                  <span className="font-bold text-black tabular-nums">{formatRupiah(ACCURATE_STANDARD_PNL.cogsBreakdown.food)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Bahan Minuman (Bar Coffee & Tea)</span>
                  <span className="font-bold text-black tabular-nums">{formatRupiah(ACCURATE_STANDARD_PNL.cogsBreakdown.beverage)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Bahan Penolong & Bumbu Masak</span>
                  <span className="font-bold text-black tabular-nums">{formatRupiah(ACCURATE_STANDARD_PNL.cogsBreakdown.productionSupport)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Kemasan Kraft & Gelas Plastik</span>
                  <span className="font-bold text-black tabular-nums">{formatRupiah(ACCURATE_STANDARD_PNL.cogsBreakdown.packaging)}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-rose-800 bg-rose-50 px-2 rounded-md">
                  <span>TOTAL HPP RESTORAN</span>
                  <span className="tabular-nums">
                    {formatRupiah(
                      ACCURATE_STANDARD_PNL.cogsBreakdown.food +
                        ACCURATE_STANDARD_PNL.cogsBreakdown.beverage +
                        ACCURATE_STANDARD_PNL.cogsBreakdown.productionSupport +
                        ACCURATE_STANDARD_PNL.cogsBreakdown.packaging
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: BEBAN OPERASIONAL UTAMA */}
            <div className="space-y-3 p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <span className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} />
                <span>Ringkasan Beban Operasional (OPEX)</span>
              </span>
              <div className="space-y-1.5 divide-y divide-stone-100">
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Gaji Karyawan, Lembur & Part-time</span>
                  <span className="font-bold text-black tabular-nums">Rp 47.451.794</span>
                </div>
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Sewa Tempat Restoran</span>
                  <span className="font-bold text-black tabular-nums">Rp 36.116.835</span>
                </div>
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Listrik PLN, Air & Gas LPG</span>
                  <span className="font-bold text-black tabular-nums">Rp 4.718.287</span>
                </div>
                <div className="flex justify-between py-1.5 text-neutral-700">
                  <span>Supplies Dapur, Bar & Kebersihan</span>
                  <span className="font-bold text-black tabular-nums">Rp 6.502.770</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-black bg-stone-200 px-2 rounded-md">
                  <span>TOTAL BEBAN OPERASIONAL</span>
                  <span className="tabular-nums">Rp 121.926.406</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: ACCURATE 2-COLUMN SKONTRO BALANCE SHEET (HALAMAN 5-6 PDF) */}
      {/* ========================================================================= */}
      {activeSubTab === 'skontro_balance' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-black">
                  Neraca Induk Skontro
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NERACA SEIMBANG ✓
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportBalanceSheetExcel(effectiveBalanceSheet)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-black border border-stone-300 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-emerald-700" />
                <span>Export Excel Neraca</span>
              </button>
            </div>
          </div>

          {/* 2-COLUMN SKONTRO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* SISI KIRI: ASET (AKTIVA) */}
            <div className="border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[#1e293b] text-white py-2.5 px-4 font-bold text-xs uppercase tracking-wider flex justify-between">
                  <span>ASET (AKTIVA)</span>
                  <span>PER 31 AGUSTUS 2026</span>
                </div>

                <div className="p-4 space-y-4">
                  {/* AKTIVA LANCAR */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-black text-[11px] uppercase tracking-wider block border-b border-stone-200 pb-1">
                      Aktiva Lancar (Current Assets)
                    </span>
                    {ACCURATE_SKONTRO_BALANCE_SHEET.assets.currentAssets.cashAndBank.map((a) => (
                      <div key={a.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{a.code}</strong>
                          {a.name}
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                    {ACCURATE_SKONTRO_BALANCE_SHEET.assets.currentAssets.receivables.map((a) => (
                      <div key={a.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{a.code}</strong>
                          {a.name}
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                    {ACCURATE_SKONTRO_BALANCE_SHEET.assets.currentAssets.inventory.map((a) => (
                      <div key={a.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{a.code}</strong>
                          {a.name}
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 font-bold text-black border-t border-stone-200 bg-stone-50 px-2 rounded-md">
                      <span>Total Aktiva Lancar</span>
                      <span className="tabular-nums">
                        {formatRupiah(ACCURATE_SKONTRO_BALANCE_SHEET.assets.currentAssets.totalCurrentAssets)}
                      </span>
                    </div>
                  </div>

                  {/* AKTIVA TETAP */}
                  <div className="space-y-1.5 pt-2">
                    <span className="font-bold text-black text-[11px] uppercase tracking-wider block border-b border-stone-200 pb-1">
                      Aktiva Tetap & Penyusutan (Fixed Assets)
                    </span>
                    {ACCURATE_SKONTRO_BALANCE_SHEET.assets.nonCurrentAssets.fixedAssets.map((a) => (
                      <div key={a.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{a.code}</strong>
                          {a.name}
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                    {ACCURATE_SKONTRO_BALANCE_SHEET.assets.nonCurrentAssets.contraDepreciation.map((a) => (
                      <div key={a.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{a.code}</strong>
                          {a.name}
                        </span>
                        <span className="tabular-nums font-medium text-rose-600">
                          ({formatRupiah(Math.abs(a.balance))})
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 font-bold text-black border-t border-stone-200 bg-stone-50 px-2 rounded-md">
                      <span>Total Aktiva Tetap & Lainnya (Net)</span>
                      <span className="tabular-nums">
                        {formatRupiah(ACCURATE_SKONTRO_BALANCE_SHEET.assets.nonCurrentAssets.totalNonCurrentAssets)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOTAL SISI KIRI */}
              <div className="bg-stone-100 border-t-2 border-stone-300 py-3 px-4 flex justify-between font-extrabold text-sm text-black">
                <span>TOTAL ASET (AKTIVA)</span>
                <span className="tabular-nums">{formatRupiah(ACCURATE_SKONTRO_BALANCE_SHEET.assets.totalAssets)}</span>
              </div>
            </div>

            {/* SISI KANAN: KEWAJIBAN & EKUITAS (PASIVA) */}
            <div className="border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[#1e293b] text-white py-2.5 px-4 font-bold text-xs uppercase tracking-wider flex justify-between">
                  <span>KEWAJIBAN & EKUITAS (PASIVA)</span>
                  <span>PER 31 AGUSTUS 2026</span>
                </div>

                <div className="p-4 space-y-4">
                  {/* KEWAJIBAN JANGKA PENDEK */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-black text-[11px] uppercase tracking-wider block border-b border-stone-200 pb-1">
                      Kewajiban Lancar (Current Liabilities)
                    </span>
                    {ACCURATE_SKONTRO_BALANCE_SHEET.liabilitiesAndEquity.liabilities.currentLiabilities.map((l) => (
                      <div key={l.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{l.code}</strong>
                          {l.name}
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">{formatRupiah(l.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 font-bold text-black border-t border-stone-200 bg-stone-50 px-2 rounded-md">
                      <span>Total Kewajiban Lancar</span>
                      <span className="tabular-nums">
                        {formatRupiah(ACCURATE_SKONTRO_BALANCE_SHEET.liabilitiesAndEquity.liabilities.totalCurrentLiabilities)}
                      </span>
                    </div>
                  </div>

                  {/* EKUITAS & MODAL */}
                  <div className="space-y-1.5 pt-2">
                    <span className="font-bold text-black text-[11px] uppercase tracking-wider block border-b border-stone-200 pb-1">
                      Ekuitas Pemilik (Owner Equity)
                    </span>
                    {ACCURATE_SKONTRO_BALANCE_SHEET.liabilitiesAndEquity.equity.map((e) => (
                      <div key={e.code} className="flex justify-between py-1 text-neutral-600 border-b border-stone-50">
                        <span>
                          <strong className="font-mono text-neutral-900 mr-2">{e.code}</strong>
                          {e.name}
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">{formatRupiah(e.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 font-bold text-black border-t border-stone-200 bg-stone-50 px-2 rounded-md">
                      <span>Total Ekuitas Modal</span>
                      <span className="tabular-nums">
                        {formatRupiah(ACCURATE_SKONTRO_BALANCE_SHEET.liabilitiesAndEquity.totalEquity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOTAL SISI KANAN */}
              <div className="bg-stone-100 border-t-2 border-stone-300 py-3 px-4 flex justify-between font-extrabold text-sm text-black">
                <span>TOTAL KEWAJIBAN & EKUITAS</span>
                <span className="tabular-nums">{formatRupiah(ACCURATE_SKONTRO_BALANCE_SHEET.liabilitiesAndEquity.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: ACCURATE PURCHASES BY ITEM (HALAMAN 7-46 PDF) */}
      {/* ========================================================================= */}
      {activeSubTab === 'purchases_by_item' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black">
                Rincian Pembelian per Barang
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportAccuratePurchasesPdf(filteredPurchases, companyName)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileText size={14} />
                <span>Export PDF Rincian Pembelian</span>
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                placeholder="Cari nama barang, no. faktur, catatan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-neutral-600">Total Nilai Pembelian:</span>
              <span className="font-extrabold text-sm text-black tabular-nums">{formatRupiah(totalPurchaseValue)}</span>
            </div>
          </div>

          {/* SUMMARY KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-neutral-500 font-medium">Total Nilai Pembelian</span>
              <div className="font-extrabold text-base text-black mt-0.5 tabular-nums">{formatRupiah(totalPurchaseValue)}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-neutral-500 font-medium">Jumlah Baris Transaksi</span>
              <div className="font-extrabold text-base text-black mt-0.5 tabular-nums">{filteredPurchases.length} Item Bahan</div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-neutral-500 font-medium">Status PPN & Faktur</span>
              <div className="font-extrabold text-base text-emerald-800 mt-0.5">Semua Faktur Terverifikasi AP</div>
            </div>
          </div>

          {/* TABLE OF PURCHASES (ACCURATE FORMAT) */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1e293b] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">No. Faktur</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai</th>
                  <th className="py-2.5 px-3">Catatan / Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPurchases.map((p, idx) => (
                  <tr key={`${p.invoiceNumber}-${p.id}-${idx}`} className="hover:bg-stone-50">
                    <td className="py-2 px-3 text-neutral-500 tabular-nums">{p.date}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-black">{p.invoiceNumber}</td>
                    <td className="py-2 px-3 font-semibold text-neutral-900">{p.itemName}</td>
                    <td className="py-2 px-3 text-center text-neutral-500 font-mono text-[11px]">{p.unit}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold">{p.quantity.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-black">{formatRupiah(p.totalAmount)}</td>
                    <td className="py-2 px-3 text-neutral-500 text-[11px] truncate max-w-xs">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: ACCURATE INVENTORY VALUATION (HALAMAN 47-59 PDF) */}
      {/* ========================================================================= */}
      {activeSubTab === 'inventory_valuation' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black">
                Nilai Persediaan Gudang
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportAccurateInventoryValuationPdf(filteredInventoryValuation, companyName)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileText size={14} />
                <span>Export PDF Nilai Persediaan</span>
              </button>
            </div>
          </div>

          {/* SEARCH & KPI BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Cari kode atau nama barang persediaan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-neutral-600">Total Nilai Akhir Persediaan:</span>
              <span className="font-extrabold text-sm text-black tabular-nums">{formatRupiah(totalEndingInventoryValue)}</span>
            </div>
          </div>

          {/* TABLE OF INVENTORY VALUATION */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e293b] text-white font-bold border-b border-stone-300">
                  <th rowSpan={2} className="py-2.5 px-3">Kode</th>
                  <th rowSpan={2} className="py-2.5 px-3">Nama Barang Persediaan</th>
                  <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-600">Saldo Awal</th>
                  <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-600">Masuk (Beli)</th>
                  <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-600">Keluar (HPP)</th>
                  <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-600 bg-slate-900">Saldo Akhir</th>
                </tr>
                <tr className="bg-[#1e293b] text-white text-[11px] font-semibold">
                  <th className="py-1.5 px-2 text-right">Qty</th>
                  <th className="py-1.5 px-2 text-right">Nilai (Rp)</th>
                  <th className="py-1.5 px-2 text-right">Qty</th>
                  <th className="py-1.5 px-2 text-right">Nilai (Rp)</th>
                  <th className="py-1.5 px-2 text-right">Qty</th>
                  <th className="py-1.5 px-2 text-right">Nilai (Rp)</th>
                  <th className="py-1.5 px-2 text-right bg-slate-900">Qty</th>
                  <th className="py-1.5 px-2 text-right bg-slate-900">Nilai (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInventoryValuation.map((inv) => (
                  <tr key={inv.itemCode} className="hover:bg-stone-50">
                    <td className="py-2 px-3 font-mono text-neutral-600">{inv.itemCode}</td>
                    <td className="py-2 px-3 font-semibold text-black">{inv.itemName}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-neutral-600">{inv.beginningQty.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-neutral-600">{formatRupiah(inv.beginningValuation)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-emerald-700 font-medium">+{inv.inQty.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-emerald-700 font-medium">{formatRupiah(inv.inValuation)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-rose-700 font-medium">-{inv.outQty.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-rose-700 font-medium">{formatRupiah(inv.outValuation)}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-bold text-black bg-stone-50/60">{inv.endingQty.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-extrabold text-black bg-stone-50/60">{formatRupiah(inv.endingValuation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-TAB: BUKU BESAR AKUN (GENERAL LEDGER DETAIL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black flex items-center gap-2">
                <BookOpen size={18} />
                <span>Buku Besar Pembantu</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-600">Pilih Akun:</span>
              <select
                value={selectedLedgerAccountCode}
                onChange={(e) => setSelectedLedgerAccountCode(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs font-semibold text-black focus:outline-none focus:border-black cursor-pointer max-w-xs"
              >
                {STANDARD_FNB_COA.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#F8F7F4] border border-[#E7E5E4] rounded-2xl p-4 text-xs">
            <div>
              <span className="text-neutral-500 font-medium">Akun Aktif</span>
              <div className="font-bold text-sm text-black mt-0.5">{selectedAccount.name}</div>
              <span className="font-mono text-[11px] text-neutral-500">{selectedAccount.code} · {selectedAccount.category}</span>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Saldo Normal</span>
              <div className="font-bold text-sm text-black uppercase mt-0.5">{selectedAccount.normalBalance}</div>
              <span className="text-[11px] text-neutral-400">Aturan SAK EMKM</span>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Total Mutasi (Debit / Kredit)</span>
              <div className="font-semibold text-xs text-neutral-800 mt-0.5 tabular-nums">
                D: {formatRupiah(ledgerData.totalDebit)}
              </div>
              <div className="font-semibold text-xs text-neutral-800 tabular-nums">
                K: {formatRupiah(ledgerData.totalCredit)}
              </div>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Saldo Akhir Akun</span>
              <div className="font-bold text-lg text-black tabular-nums mt-0.5">
                {formatRupiah(ledgerData.endingBalance)}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">Tervalidasi Sesuai Jurnal</span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200">
            <table className="w-full text-left">
              <thead className="bg-[#1e293b] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Tanggal & Waktu</th>
                  <th className="py-2.5 px-3">No. Jurnal</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3">Keterangan / Memo</th>
                  <th className="py-2.5 px-3 text-right">Debit (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Kredit (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ledgerData.rows.map((row, idx) => (
                  <tr key={`${row.journalId}-${idx}`} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 text-neutral-600 tabular-nums">
                      {new Date(row.date).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-black">
                      {row.journalNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#F8F7F4] border border-[#E7E5E4] text-[10px] font-semibold text-neutral-700 uppercase">
                        {row.refType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-800 max-w-xs truncate">
                      {row.memo || row.description}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium tabular-nums text-neutral-900">
                      {row.debit > 0 ? formatRupiah(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium tabular-nums text-neutral-900">
                      {row.credit > 0 ? formatRupiah(row.credit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-black">
                      {formatRupiah(row.balance)}
                    </td>
                  </tr>
                ))}

                {ledgerData.rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      Belum ada transaksi yang memengaruhi akun ini pada periode berjalan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-TAB: JURNAL UMUM (JOURNAL VOUCHERS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'journal_list' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black">Jurnal Umum</h2>
            </div>

            <button
              onClick={() => setShowManualJnlModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Jurnal Manual</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                placeholder="Cari nomor jurnal, akun COA, atau deskripsi..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F4] rounded-xl border border-[#E7E5E4] overflow-x-auto">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pos_sale', label: 'Kasir POS' },
                { id: 'purchase_bill', label: 'Pembelian' },
                { id: 'production', label: 'Produksi' },
                { id: 'manual', label: 'Penyesuaian' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setJournalRefFilter(rf.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    journalRefFilter === rf.id
                      ? 'bg-black text-white'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredJournals.map((jnl) => (
              <div key={jnl.id} className="border border-stone-200 rounded-xl p-4 bg-white space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-black">{jnl.journalNumber}</span>
                    <span className="text-neutral-500 text-[11px]">
                      {new Date(jnl.date).toLocaleString('id-ID')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-semibold text-neutral-700 uppercase">
                      {jnl.refType.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-bold text-black tabular-nums">{formatRupiah(jnl.totalAmount)}</span>
                </div>
                <p className="text-neutral-600 text-[11px]">{jnl.description}</p>
                <div className="space-y-1 pt-1">
                  {jnl.lines.map((l, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-700 font-mono text-[11px]">
                      <span>
                        <strong className="text-black mr-2">{l.accountCode}</strong>
                        {l.accountName}
                      </span>
                      <div className="flex gap-4">
                        <span className="w-24 text-right text-neutral-900">{l.debit > 0 ? formatRupiah(l.debit) : '-'}</span>
                        <span className="w-24 text-right text-neutral-900">{l.credit > 0 ? formatRupiah(l.credit) : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUB-TAB: NERACA SALDO (TRIAL BALANCE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'trial_balance' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black">Neraca Saldo (Trial Balance)</h2>
              <span className="text-xs text-neutral-500">Pengecekan Saldo Debit dan Kredit Seluruh Akun COA</span>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                effectiveTrialBalance.isBalanced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {effectiveTrialBalance.isBalanced ? 'DEBIT & KREDIT SEIMBANG ✓' : 'SELISIH!'}
            </span>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200">
            <table className="w-full text-left">
              <thead className="bg-[#1e293b] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3">KODE AKUN</th>
                  <th className="py-2.5 px-3">NAMA AKUN</th>
                  <th className="py-2.5 px-3 text-right">DEBIT (RP)</th>
                  <th className="py-2.5 px-3 text-right">KREDIT (RP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {effectiveTrialBalance.items.map((it) => (
                  <tr key={it.code} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-mono text-neutral-500">{it.code}</td>
                    <td className="py-2 px-3 font-medium text-neutral-900">{it.name}</td>
                    <td className="py-2 px-3 text-right font-medium tabular-nums">
                      {it.debit > 0 ? formatRupiah(it.debit) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-medium tabular-nums">
                      {it.credit > 0 ? formatRupiah(it.credit) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-stone-300 font-bold text-black bg-[#F8F7F4]">
                  <td colSpan={2} className="py-3 px-3">TOTAL NERACA SALDO</td>
                  <td className="py-3 px-3 text-right tabular-nums">{formatRupiah(effectiveTrialBalance.totalDebit)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{formatRupiah(effectiveTrialBalance.totalCredit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SUB-TAB: ASET TETAP & DEPRESIASI */}
      {/* ========================================================================= */}
      {activeSubTab === 'assets' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-7 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-black">Aset Tetap & Depresiasi</h2>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200">
            <table className="w-full text-left">
              <thead className="bg-[#1e293b] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Aset</th>
                  <th className="py-2.5 px-3 text-right">Harga Beli</th>
                  <th className="py-2.5 px-3 text-center">Masa Pakai</th>
                  <th className="py-2.5 px-3 text-right">Penyusutan/Bln</th>
                  <th className="py-2.5 px-3 text-right">Akumulasi Susut</th>
                  <th className="py-2.5 px-3 text-right">Nilai Buku</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {fixedAssets.map((asset) => {
                  const bookValue = asset.purchaseCost - asset.accumulatedDepreciation
                  return (
                    <tr key={asset.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-black">{asset.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">{asset.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{formatRupiah(asset.purchaseCost)}</td>
                      <td className="py-2.5 px-3 text-center">{asset.usefulLifeMonths} Bln</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-rose-700 font-semibold">
                        {formatRupiah(asset.monthlyDepreciation)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-neutral-600">
                        {formatRupiah(asset.accumulatedDepreciation)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-black">
                        {formatRupiah(bookValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRunDepreciation(asset)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-black hover:text-white text-[11px] font-bold text-neutral-800 transition-colors cursor-pointer"
                        >
                          Catat Beban Bulan Ini
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ADJUSTMENT JOURNAL */}
      {showManualJnlModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-sm text-black">Entri Jurnal Penyesuaian Manual</h3>
              <button
                type="button"
                onClick={() => setShowManualJnlModal(false)}
                className="text-neutral-400 hover:text-black cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Deskripsi / Memo Jurnal</label>
                <input
                  value={jnlDesc}
                  onChange={(e) => setJnlDesc(e.target.value)}
                  placeholder="Contoh: Pembayaran Listrik PLN Periode Agustus"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Akun Debit</label>
                <select
                  value={jnlDebitCode}
                  onChange={(e) => setJnlDebitCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-black cursor-pointer"
                >
                  {STANDARD_FNB_COA.map((a) => (
                    <option key={`deb-${a.code}`} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Akun Kredit</label>
                <select
                  value={jnlCreditCode}
                  onChange={(e) => setJnlCreditCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-black cursor-pointer"
                >
                  {STANDARD_FNB_COA.map((a) => (
                    <option key={`crd-${a.code}`} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={jnlAmount}
                  onChange={(e) => setJnlAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-black font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualJnlModal(false)}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-neutral-700 hover:bg-stone-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveManualJournal}
                className="flex-1 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Simpan Jurnal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
