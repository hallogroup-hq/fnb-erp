import type { JournalEntry, PurchaseBill, SalesInvoiceB2B } from '../../types/erp'
import { STANDARD_FNB_COA } from './coa'

export interface IncomeStatementReport {
  periodLabel: string
  grossRevenue: number
  discounts: number
  netRevenue: number
  cogsItems: { code: string; name: string; amount: number }[]
  totalCogs: number
  grossProfit: number
  grossProfitMarginPct: number
  operatingExpenses: { code: string; name: string; amount: number }[]
  totalOperatingExpenses: number
  operatingIncome: number
  otherIncome: number
  netProfit: number
  netProfitMarginPct: number
}

export interface BalanceSheetReport {
  asOfDateLabel: string
  currentAssets: { code: string; name: string; balance: number }[]
  totalCurrentAssets: number
  fixedAssets: { code: string; name: string; balance: number }[]
  contraDepreciation: { code: string; name: string; balance: number }[]
  netFixedAssets: number
  totalAssets: number
  currentLiabilities: { code: string; name: string; balance: number }[]
  totalLiabilities: number
  equityItems: { code: string; name: string; balance: number }[]
  totalEquity: number
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
  discrepancy: number
}

export interface CashFlowReport {
  periodLabel: string
  cashFromOperations: { label: string; amount: number }[]
  netCashOperations: number
  cashFromInvesting: { label: string; amount: number }[]
  netCashInvesting: number
  cashFromFinancing: { label: string; amount: number }[]
  netCashFinancing: number
  beginningCash: number
  endingCash: number
  netChangeInCash: number
}

export interface TrialBalanceItem {
  code: string
  name: string
  debit: number
  credit: number
}

export interface TrialBalanceReport {
  asOfDateLabel: string
  items: TrialBalanceItem[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}

export interface AgingBucket {
  id: string
  refNumber: string
  entityName: string
  date: number
  dueDate: number
  totalAmount: number
  balanceDue: number
  daysPastDue: number
  bucket: 'current' | '1_30' | '31_60' | 'over_60'
}

export interface AgingSummary {
  current: number
  days1_30: number
  days31_60: number
  over60: number
  total: number
  items: AgingBucket[]
}

/**
 * Menghitung saldo buku besar untuk seluruh akun COA dari sekumpulan jurnal
 */
export function calculateAccountBalances(journals: JournalEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const acc of STANDARD_FNB_COA) {
    map.set(acc.code, 0)
  }

  for (const j of journals) {
    for (const l of j.lines) {
      const cur = map.get(l.accountCode) ?? 0
      const acc = STANDARD_FNB_COA.find((a) => a.code === l.accountCode)
      const normal = acc?.normalBalance ?? 'debit'

      if (normal === 'debit') {
        map.set(l.accountCode, cur + l.debit - l.credit)
      } else {
        map.set(l.accountCode, cur + l.credit - l.debit)
      }
    }
  }

  return map
}

/**
 * Menghasilkan Laporan Laba Rugi (Income Statement) Standar SAK EMKM
 */
export function generateIncomeStatement(
  journals: JournalEntry[],
  periodLabel = 'Bulan Berjalan'
): IncomeStatementReport {
  const balances = calculateAccountBalances(journals)

  const revBar = balances.get('4-1001') ?? 0
  const revRoastery = balances.get('4-1002') ?? 0
  const revRetail = balances.get('4-1003') ?? 0
  const discounts = balances.get('4-2001') ?? 0
  const otherIncome = balances.get('4-3001') ?? 0

  const grossRevenue = revBar + revRoastery + revRetail
  const netRevenue = grossRevenue - discounts

  const cogsItems = [
    { code: '5-1001', name: 'HPP Pemakaian Bahan Minuman', amount: balances.get('5-1001') ?? 0 },
    { code: '5-1002', name: 'HPP Pemakaian Bahan Makanan', amount: balances.get('5-1002') ?? 0 },
    { code: '5-1003', name: 'HPP Pemakaian Kemasan & Packaging', amount: balances.get('5-1003') ?? 0 },
    { code: '5-1004', name: 'HPP Biji Kopi Roastery B2B', amount: balances.get('5-1004') ?? 0 },
  ].filter((c) => c.amount > 0)

  const totalCogs = cogsItems.reduce((s, c) => s + c.amount, 0)
  const grossProfit = netRevenue - totalCogs
  const grossProfitMarginPct = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

  const operatingExpenses = [
    { code: '6-1001', name: 'Beban Gaji & Upah Barista/Kitchen', amount: balances.get('6-1001') ?? 0 },
    { code: '6-2001', name: 'Beban Sewa Tempat Outlet', amount: balances.get('6-2001') ?? 0 },
    { code: '6-2002', name: 'Beban Listrik, Air & Gas', amount: balances.get('6-2002') ?? 0 },
    { code: '6-2003', name: 'Beban Internet & Komunikasi', amount: balances.get('6-2003') ?? 0 },
    { code: '6-3001', name: 'Beban Kerusakan & Basi (Waste)', amount: balances.get('6-3001') ?? 0 },
    { code: '6-3002', name: 'Beban Selisih Kas Laci', amount: balances.get('6-3002') ?? 0 },
    { code: '6-4001', name: 'Beban Penyusutan Mesin & Alat', amount: balances.get('6-4001') ?? 0 },
    { code: '6-5001', name: 'Beban Administrasi Bank & MDR', amount: balances.get('6-5001') ?? 0 },
  ].filter((e) => e.amount > 0)

  const totalOperatingExpenses = operatingExpenses.reduce((s, e) => s + e.amount, 0)
  const operatingIncome = grossProfit - totalOperatingExpenses
  const netProfit = operatingIncome + otherIncome
  const netProfitMarginPct = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

  return {
    periodLabel,
    grossRevenue,
    discounts,
    netRevenue,
    cogsItems,
    totalCogs,
    grossProfit,
    grossProfitMarginPct,
    operatingExpenses,
    totalOperatingExpenses,
    operatingIncome,
    otherIncome,
    netProfit,
    netProfitMarginPct,
  }
}

/**
 * Menghasilkan Laporan Neraca (Balance Sheet)
 */
export function generateBalanceSheet(
  journals: JournalEntry[],
  asOfDateLabel = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
): BalanceSheetReport {
  const balances = calculateAccountBalances(journals)
  const pnl = generateIncomeStatement(journals)

  const currentAssets = [
    { code: '1-1001', name: 'Kas di Laci Kasir', balance: balances.get('1-1001') ?? 0 },
    { code: '1-1002', name: 'Bank Operasional', balance: balances.get('1-1002') ?? 0 },
    { code: '1-1003', name: 'Penampungan QRIS & Gateway', balance: balances.get('1-1003') ?? 0 },
    { code: '1-1100', name: 'Piutang Usaha B2B', balance: balances.get('1-1100') ?? 0 },
    { code: '1-1201', name: 'Persediaan Bahan Baku', balance: balances.get('1-1201') ?? 0 },
    { code: '1-1202', name: 'Persediaan Barang Jadi', balance: balances.get('1-1202') ?? 0 },
    { code: '1-1203', name: 'Persediaan Packaging', balance: balances.get('1-1203') ?? 0 },
    { code: '1-1204', name: 'Persediaan WIP Roasting', balance: balances.get('1-1204') ?? 0 },
  ]
  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.balance, 0)

  const fixedAssets = [
    { code: '1-1500', name: 'Mesin Espresso, Grinder & Alat', balance: balances.get('1-1500') ?? 0 },
  ]
  const contraDepreciation = [
    { code: '1-1501', name: 'Akumulasi Penyusutan Alat', balance: balances.get('1-1501') ?? 0 },
  ]
  const netFixedAssets = (balances.get('1-1500') ?? 0) - (balances.get('1-1501') ?? 0)
  const totalAssets = totalCurrentAssets + netFixedAssets

  const currentLiabilities = [
    { code: '2-1001', name: 'Hutang Usaha Supplier', balance: balances.get('2-1001') ?? 0 },
    { code: '2-1002', name: 'Hutang Barang Belum Ditagih', balance: balances.get('2-1002') ?? 0 },
    { code: '2-1100', name: 'Hutang Pajak PB1 Resto', balance: balances.get('2-1100') ?? 0 },
    { code: '2-1101', name: 'Hutang PPN', balance: balances.get('2-1101') ?? 0 },
    { code: '2-1102', name: 'Hutang PPh 21 Karyawan', balance: balances.get('2-1102') ?? 0 },
    { code: '2-1200', name: 'Titipan Service Charge', balance: balances.get('2-1200') ?? 0 },
  ]
  const totalLiabilities = currentLiabilities.reduce((s, l) => s + l.balance, 0)

  const equityItems = [
    { code: '3-1001', name: 'Modal Disetor Pemilik', balance: balances.get('3-1001') ?? 0 },
    { code: '3-2001', name: 'Laba Ditahan (Retained)', balance: balances.get('3-2001') ?? 0 },
    { code: '3-2002', name: 'Laba Tahun Berjalan', balance: pnl.netProfit },
  ]
  const totalEquity = equityItems.reduce((s, e) => s + e.balance, 0)
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  const discrepancy = Math.abs(totalAssets - totalLiabilitiesAndEquity)
  const isBalanced = discrepancy < 1 // toleransi pembulatan

  return {
    asOfDateLabel,
    currentAssets,
    totalCurrentAssets,
    fixedAssets,
    contraDepreciation,
    netFixedAssets,
    totalAssets,
    currentLiabilities,
    totalLiabilities,
    equityItems,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced,
    discrepancy,
  }
}

/**
 * Menghasilkan Neraca Saldo (Trial Balance)
 */
export function generateTrialBalance(
  journals: JournalEntry[],
  asOfDateLabel = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
): TrialBalanceReport {
  const debitMap = new Map<string, number>()
  const creditMap = new Map<string, number>()

  for (const j of journals) {
    for (const l of j.lines) {
      debitMap.set(l.accountCode, (debitMap.get(l.accountCode) ?? 0) + l.debit)
      creditMap.set(l.accountCode, (creditMap.get(l.accountCode) ?? 0) + l.credit)
    }
  }

  const items: TrialBalanceItem[] = []
  let totalDebit = 0
  let totalCredit = 0

  for (const acc of STANDARD_FNB_COA) {
    const d = debitMap.get(acc.code) ?? 0
    const c = creditMap.get(acc.code) ?? 0
    if (d === 0 && c === 0) continue

    if (acc.normalBalance === 'debit') {
      const net = d - c
      if (net >= 0) {
        items.push({ code: acc.code, name: acc.name, debit: net, credit: 0 })
        totalDebit += net
      } else {
        items.push({ code: acc.code, name: acc.name, debit: 0, credit: Math.abs(net) })
        totalCredit += Math.abs(net)
      }
    } else {
      const net = c - d
      if (net >= 0) {
        items.push({ code: acc.code, name: acc.name, debit: 0, credit: net })
        totalCredit += net
      } else {
        items.push({ code: acc.code, name: acc.name, debit: Math.abs(net), credit: 0 })
        totalDebit += Math.abs(net)
      }
    }
  }

  const isBalanced = Math.abs(totalDebit - totalCredit) < 1

  return {
    asOfDateLabel,
    items,
    totalDebit,
    totalCredit,
    isBalanced,
  }
}

/**
 * Menghasilkan Laporan Umur Hutang (AP Aging)
 */
export function generateApAging(bills: PurchaseBill[]): AgingSummary {
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  let current = 0
  let days1_30 = 0
  let days31_60 = 0
  let over60 = 0
  let total = 0

  const items: AgingBucket[] = []

  for (const b of bills) {
    if (b.status === 'paid' || b.balanceDue <= 0) continue

    const daysPastDue = Math.floor((now - b.dueDate) / DAY_MS)
    let bucket: 'current' | '1_30' | '31_60' | 'over_60' = 'current'

    if (daysPastDue <= 0) {
      bucket = 'current'
      current += b.balanceDue
    } else if (daysPastDue <= 30) {
      bucket = '1_30'
      days1_30 += b.balanceDue
    } else if (daysPastDue <= 60) {
      bucket = '31_60'
      days31_60 += b.balanceDue
    } else {
      bucket = 'over_60'
      over60 += b.balanceDue
    }

    total += b.balanceDue
    items.push({
      id: b.id,
      refNumber: b.billNumber,
      entityName: b.supplierName,
      date: b.date,
      dueDate: b.dueDate,
      totalAmount: b.totalAmount,
      balanceDue: b.balanceDue,
      daysPastDue: Math.max(0, daysPastDue),
      bucket,
    })
  }

  return { current, days1_30, days31_60, over60, total, items }
}

/**
 * Menghasilkan Laporan Umur Piutang (AR Aging)
 */
export function generateArAging(invoices: SalesInvoiceB2B[]): AgingSummary {
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  let current = 0
  let days1_30 = 0
  let days31_60 = 0
  let over60 = 0
  let total = 0

  const items: AgingBucket[] = []

  for (const inv of invoices) {
    if (inv.status === 'paid' || inv.balanceDue <= 0) continue

    const daysPastDue = Math.floor((now - inv.dueDate) / DAY_MS)
    let bucket: 'current' | '1_30' | '31_60' | 'over_60' = 'current'

    if (daysPastDue <= 0) {
      bucket = 'current'
      current += inv.balanceDue
    } else if (daysPastDue <= 30) {
      bucket = '1_30'
      days1_30 += inv.balanceDue
    } else if (daysPastDue <= 60) {
      bucket = '31_60'
      days31_60 += inv.balanceDue
    } else {
      bucket = 'over_60'
      over60 += inv.balanceDue
    }

    total += inv.balanceDue
    items.push({
      id: inv.id,
      refNumber: inv.invoiceNumber,
      entityName: inv.customerName,
      date: inv.date,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      balanceDue: inv.balanceDue,
      daysPastDue: Math.max(0, daysPastDue),
      bucket,
    })
  }

  return { current, days1_30, days31_60, over60, total, items }
}
