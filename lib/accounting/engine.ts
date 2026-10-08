import type {
  JournalEntry,
  JournalLine,
  Order,
  PurchaseBill,
  PurchasePayment,
  SalesInvoiceB2B,
  WorkOrderProduction,
  Shift,
  FixedAsset,
} from '../../types/erp'
import { STANDARD_FNB_COA } from './coa'

function getAccount(code: string) {
  const acc = STANDARD_FNB_COA.find((a) => a.code === code)
  if (!acc) throw new Error(`Akun COA ${code} tidak ditemukan dalam template standar`)
  return acc
}

let journalSequence = 1
export function nextJournalNumber(): string {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const seq = String(journalSequence++).padStart(4, '0')
  return `JV/${yearMonth}/${seq}`
}

/**
 * 1. Event: POS Sale Completed (Cash, QRIS, or Transfer)
 * Jurnal Penjualan:
 *   Debit: Kas di Kasir (1-1001) / Penampungan QRIS (1-1003) / Bank (1-1002)
 *   Debit: Potongan Penjualan / Diskon (4-2001) [jika ada diskon]
 *   Kredit: Pendapatan Penjualan Bar / Roastery (4-1001 / 4-1002)
 *   Kredit: Hutang Pajak Restoran PB1 (2-1100) [jika ada pajak]
 *   Kredit: Titipan Service Charge (2-1200) [jika ada service charge]
 * Jurnal HPP (Simultan):
 *   Debit: HPP Pemakaian Bahan (5-1001 / 5-1004)
 *   Kredit: Persediaan Bahan Baku (1-1201 / 1-1202)
 */
export function createJournalForPosSale(order: Order, totalCogs: number): JournalEntry {
  const lines: JournalLine[] = []
  const accCash = getAccount('1-1001')
  const accQris = getAccount('1-1003')
  const accBank = getAccount('1-1002')
  const accDiscount = getAccount('4-2001')
  const accSalesBar = getAccount('4-1001')
  const accSalesRoastery = getAccount('4-1002')
  const accTax = getAccount('2-1100')
  const accService = getAccount('2-1200')
  const accCogs = getAccount(order.channel === 'roastery' ? '5-1004' : '5-1001')
  const accInventory = getAccount(order.channel === 'roastery' ? '1-1202' : '1-1201')

  // DEBITS FOR PAYMENTS
  for (const p of order.payments) {
    if (p.amount <= 0) continue
    const targetAcc = p.method === 'qris' ? accQris : p.method === 'transfer' ? accBank : accCash
    lines.push({
      accountId: targetAcc.code,
      accountCode: targetAcc.code,
      accountName: targetAcc.name,
      debit: p.amount,
      credit: 0,
      memo: `Penerimaan order ${order.orderNumber} via ${p.method.toUpperCase()}`,
    })
  }

  // DEBIT FOR DISCOUNT
  if (order.discountAmount > 0) {
    lines.push({
      accountId: accDiscount.code,
      accountCode: accDiscount.code,
      accountName: accDiscount.name,
      debit: order.discountAmount,
      credit: 0,
      memo: `Diskon order ${order.orderNumber}`,
    })
  }

  // CREDITS FOR REVENUE
  const salesAcc = order.channel === 'roastery' ? accSalesRoastery : accSalesBar
  lines.push({
    accountId: salesAcc.code,
    accountCode: salesAcc.code,
    accountName: salesAcc.name,
    debit: 0,
    credit: order.subtotal,
    memo: `Pendapatan penjualan ${order.orderNumber}`,
  })

  // CREDITS FOR TAX
  if (order.taxAmount > 0) {
    lines.push({
      accountId: accTax.code,
      accountCode: accTax.code,
      accountName: accTax.name,
      debit: 0,
      credit: order.taxAmount,
      memo: `Pajak PB1 order ${order.orderNumber}`,
    })
  }

  // CREDITS FOR SERVICE CHARGE
  if (order.serviceChargeAmount > 0) {
    lines.push({
      accountId: accService.code,
      accountCode: accService.code,
      accountName: accService.name,
      debit: 0,
      credit: order.serviceChargeAmount,
      memo: `Service charge order ${order.orderNumber}`,
    })
  }

  // SIMULTANEOUS COGS OR COMPLIMENT MARKETING EXPENSE & INVENTORY
  const isComplimentOrder = order.total === 0 && order.discountAmount > 0 && order.subtotal > 0
  const accComplimentExpense = getAccount('6-3003')

  if (totalCogs > 0) {
    if (isComplimentOrder) {
      lines.push({
        accountId: accComplimentExpense.code,
        accountCode: accComplimentExpense.code,
        accountName: accComplimentExpense.name,
        debit: totalCogs,
        credit: 0,
        memo: `Biaya compliment/jamuan order #${order.orderNumber} (${order.discountNote || 'On The House'})`,
      })
    } else {
      lines.push({
        accountId: accCogs.code,
        accountCode: accCogs.code,
        accountName: accCogs.name,
        debit: totalCogs,
        credit: 0,
        memo: `HPP bahan baku order #${order.orderNumber}`,
      })
    }
    lines.push({
      accountId: accInventory.code,
      accountCode: accInventory.code,
      accountName: accInventory.name,
      debit: 0,
      credit: totalCogs,
      memo: `Pengurangan stok bahan untuk order #${order.orderNumber}`,
    })
  }

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId: order.orgId,
    outletId: order.outletId,
    journalNumber: nextJournalNumber(),
    date: order.createdAt,
    refType: 'pos_sale',
    refId: order.id,
    description: isComplimentOrder
      ? `Compliment / On The House #${order.orderNumber} - ${order.customerName || 'Tamu VIP'}`
      : `Penjualan POS #${order.orderNumber}${order.customerName ? ' - ' + order.customerName : ''}`,
    lines,
    totalAmount: totalDebit,
    createdAt: Date.now(),
  }
}

/**
 * 2. Event: Penerimaan Tagihan Pembelian (Purchase Bill / AP)
 * Debit: Persediaan Bahan Baku (1-1201)
 * Kredit: Hutang Usaha Supplier (2-1001)
 */
export function createJournalForPurchaseBill(bill: PurchaseBill): JournalEntry {
  const accInventory = getAccount('1-1201')
  const accAp = getAccount('2-1001')

  const lines: JournalLine[] = [
    {
      accountId: accInventory.code,
      accountCode: accInventory.code,
      accountName: accInventory.name,
      debit: bill.totalAmount,
      credit: 0,
      memo: `Pembelian stok dari ${bill.supplierName}`,
    },
    {
      accountId: accAp.code,
      accountCode: accAp.code,
      accountName: accAp.name,
      debit: 0,
      credit: bill.totalAmount,
      memo: `Tagihan hutang pembelian #${bill.billNumber} (${bill.vendorInvoiceNumber})`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId: bill.orgId,
    outletId: bill.outletId,
    journalNumber: nextJournalNumber(),
    date: bill.date,
    refType: 'purchase_bill',
    refId: bill.id,
    description: `Faktur Pembelian #${bill.billNumber} - ${bill.supplierName}`,
    lines,
    totalAmount: bill.totalAmount,
    createdAt: Date.now(),
  }
}

/**
 * 3. Event: Pelunasan Hutang Supplier (Purchase Payment)
 * Debit: Hutang Usaha Supplier (2-1001)
 * Kredit: Bank Operasional (1-1002) / Kas (1-1001)
 */
export function createJournalForPurchasePayment(payment: PurchasePayment, bill: PurchaseBill): JournalEntry {
  const accAp = getAccount('2-1001')
  const accBank = getAccount(payment.paymentMethod === 'cash' ? '1-1001' : '1-1002')

  const lines: JournalLine[] = [
    {
      accountId: accAp.code,
      accountCode: accAp.code,
      accountName: accAp.name,
      debit: payment.amount,
      credit: 0,
      memo: `Pelunasan hutang tagihan #${bill.billNumber}`,
    },
    {
      accountId: accBank.code,
      accountCode: accBank.code,
      accountName: accBank.name,
      debit: 0,
      credit: payment.amount,
      memo: `Pengeluaran dana untuk pembayaran ke ${bill.supplierName}`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId: bill.orgId,
    outletId: bill.outletId,
    journalNumber: nextJournalNumber(),
    date: payment.date,
    refType: 'purchase_pay',
    refId: payment.id,
    description: `Pembayaran Hutang #${payment.paymentNumber} ke ${bill.supplierName}`,
    lines,
    totalAmount: payment.amount,
    createdAt: Date.now(),
  }
}

/**
 * 4. Event: Faktur Penjualan B2B (Sales Invoice B2B / AR)
 * Debit: Piutang Usaha B2B (1-1100)
 * Kredit: Pendapatan Penjualan Roastery B2B (4-1002)
 */
export function createJournalForSalesInvoiceB2B(inv: SalesInvoiceB2B): JournalEntry {
  const accAr = getAccount('1-1100')
  const accSales = getAccount('4-1002')

  const lines: JournalLine[] = [
    {
      accountId: accAr.code,
      accountCode: accAr.code,
      accountName: accAr.name,
      debit: inv.totalAmount,
      credit: 0,
      memo: `Piutang invoice B2B #${inv.invoiceNumber} ke ${inv.customerName}`,
    },
    {
      accountId: accSales.code,
      accountCode: accSales.code,
      accountName: accSales.name,
      debit: 0,
      credit: inv.totalAmount,
      memo: `Pendapatan penjualan grosir beans #${inv.invoiceNumber}`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId: inv.orgId,
    outletId: inv.outletId,
    journalNumber: nextJournalNumber(),
    date: inv.date,
    refType: 'sales_inv',
    refId: inv.id,
    description: `Faktur Penjualan B2B #${inv.invoiceNumber} - ${inv.customerName}`,
    lines,
    totalAmount: inv.totalAmount,
    createdAt: Date.now(),
  }
}

/**
 * 5. Event: Pelunasan Piutang B2B (AR Receipt)
 * Debit: Bank Operasional (1-1002)
 * Kredit: Piutang Usaha B2B (1-1100)
 */
export function createJournalForSalesReceiptB2B(inv: SalesInvoiceB2B, amount: number, paymentDate: number): JournalEntry {
  const accBank = getAccount('1-1002')
  const accAr = getAccount('1-1100')

  const lines: JournalLine[] = [
    {
      accountId: accBank.code,
      accountCode: accBank.code,
      accountName: accBank.name,
      debit: amount,
      credit: 0,
      memo: `Penerimaan pelunasan invoice #${inv.invoiceNumber} dari ${inv.customerName}`,
    },
    {
      accountId: accAr.code,
      accountCode: accAr.code,
      accountName: accAr.name,
      debit: 0,
      credit: amount,
      memo: `Pengurangan piutang invoice #${inv.invoiceNumber}`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId: inv.orgId,
    outletId: inv.outletId,
    journalNumber: nextJournalNumber(),
    date: paymentDate,
    refType: 'sales_pay',
    refId: inv.id,
    description: `Pelunasan Piutang Invoice #${inv.invoiceNumber} - ${inv.customerName}`,
    lines,
    totalAmount: amount,
    createdAt: Date.now(),
  }
}

/**
 * 6. Event: Batch Roasting / Dapur Produksi (Work Order)
 * Mengonversi Green Beans mentah menjadi Roasted Beans matang
 * Debit: Persediaan Barang Jadi Roasted Beans (1-1202)
 * Kredit: Persediaan Bahan Baku Mentah (1-1201)
 */
export function createJournalForBatchRoasting(wo: WorkOrderProduction, orgId: string, outletId: string): JournalEntry {
  const totalCost = wo.inputQtyKg * wo.inputUnitCost + wo.conversionCostRp
  const accFinished = getAccount('1-1202')
  const accRaw = getAccount('1-1201')

  const lines: JournalLine[] = [
    {
      accountId: accFinished.code,
      accountCode: accFinished.code,
      accountName: accFinished.name,
      debit: totalCost,
      credit: 0,
      memo: `Penerimaan ${wo.outputActualQtyKg} kg ${wo.outputItemName} (Susut ${wo.yieldLossPct.toFixed(1)}%)`,
    },
    {
      accountId: accRaw.code,
      accountCode: accRaw.code,
      accountName: accRaw.name,
      debit: 0,
      credit: totalCost,
      memo: `Pemakaian ${wo.inputQtyKg} kg ${wo.inputItemName} + biaya konversi`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId,
    outletId,
    journalNumber: nextJournalNumber(),
    date: wo.date,
    refType: 'production',
    refId: wo.id,
    description: `Produksi Batch Roasting #${wo.spkNumber} - ${wo.outputItemName}`,
    lines,
    totalAmount: totalCost,
    createdAt: Date.now(),
  }
}

/**
 * 7. Event: Kerusakan / Basi / Susut Bahan Baku (Waste / Spillage)
 * Debit: Beban Kerusakan, Basi & Susut Bahan (6-3001)
 * Kredit: Persediaan Bahan Baku (1-1201)
 */
export function createJournalForWaste(
  orgId: string,
  outletId: string,
  itemName: string,
  totalCost: number,
  reason: string,
  date: number
): JournalEntry {
  const accExpense = getAccount('6-3001')
  const accInventory = getAccount('1-1201')

  const lines: JournalLine[] = [
    {
      accountId: accExpense.code,
      accountCode: accExpense.code,
      accountName: accExpense.name,
      debit: totalCost,
      credit: 0,
      memo: `Kerusakan bahan: ${itemName} (${reason})`,
    },
    {
      accountId: accInventory.code,
      accountCode: accInventory.code,
      accountName: accInventory.name,
      debit: 0,
      credit: totalCost,
      memo: `Penyesuaian stok terbuang: ${itemName}`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId,
    outletId,
    journalNumber: nextJournalNumber(),
    date,
    refType: 'waste',
    description: `Waste/Spillage Bahan Baku - ${itemName} (${reason})`,
    lines,
    totalAmount: totalCost,
    createdAt: Date.now(),
  }
}

/**
 * 8. Event: Tutup Shift & Selisih Kas Laci Kasir (Cash Discrepancy)
 */
export function createJournalForShiftDiscrepancy(shift: Shift, orgId: string): JournalEntry | null {
  if (!shift.discrepancy || shift.discrepancy === 0) return null

  const isShort = shift.discrepancy < 0
  const absAmount = Math.abs(shift.discrepancy)
  const accExpense = getAccount('6-3002')
  const accCash = getAccount('1-1001')
  const accRevenue = getAccount('4-3001')

  const lines: JournalLine[] = isShort
    ? [
        {
          accountId: accExpense.code,
          accountCode: accExpense.code,
          accountName: accExpense.name,
          debit: absAmount,
          credit: 0,
          memo: `Kas laci kurang saat tutup shift ${shift.staffName}`,
        },
        {
          accountId: accCash.code,
          accountCode: accCash.code,
          accountName: accCash.name,
          debit: 0,
          credit: absAmount,
          memo: `Penyesuaian fisik kas laci`,
        },
      ]
    : [
        {
          accountId: accCash.code,
          accountCode: accCash.code,
          accountName: accCash.name,
          debit: absAmount,
          credit: 0,
          memo: `Kas laci lebih saat tutup shift ${shift.staffName}`,
        },
        {
          accountId: accRevenue.code,
          accountCode: accRevenue.code,
          accountName: accRevenue.name,
          debit: 0,
          credit: absAmount,
          memo: `Pendapatan lain selisih lebih kas laci`,
        },
      ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId,
    outletId: shift.outletId,
    journalNumber: nextJournalNumber(),
    date: shift.closedAt ?? Date.now(),
    refType: 'shift_close',
    refId: shift.id,
    description: `Selisih Kas Tutup Shift (${shift.staffName}) - ${isShort ? 'Kurang' : 'Lebih'}`,
    lines,
    totalAmount: absAmount,
    createdAt: Date.now(),
  }
}

/**
 * 9. Event: Tutup Bulan Penyusutan Aset Tetap Otomatis (Monthly Depreciation)
 * Debit: Beban Penyusutan Peralatan (6-4001)
 * Kredit: Akumulasi Penyusutan Peralatan (1-1501)
 */
export function createJournalForAssetDepreciation(asset: FixedAsset, date: number): JournalEntry {
  const accExpense = getAccount(asset.coaExpenseId || '6-4001')
  const accContra = getAccount(asset.coaContraId || '1-1501')

  const lines: JournalLine[] = [
    {
      accountId: accExpense.code,
      accountCode: accExpense.code,
      accountName: accExpense.name,
      debit: asset.monthlyDepreciation,
      credit: 0,
      memo: `Penyusutan bulanan aset ${asset.name}`,
    },
    {
      accountId: accContra.code,
      accountCode: accContra.code,
      accountName: accContra.name,
      debit: 0,
      credit: asset.monthlyDepreciation,
      memo: `Akumulasi penyusutan aset ${asset.name}`,
    },
  ]

  return {
    id: `jnl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orgId: asset.orgId,
    journalNumber: nextJournalNumber(),
    date,
    refType: 'depreciation',
    refId: asset.id,
    description: `Penyusutan Aset Tetap - ${asset.name}`,
    lines,
    totalAmount: asset.monthlyDepreciation,
    createdAt: Date.now(),
  }
}

/**
 * 9. Event: Petty Cash / Kas Kecil Keluar-Masuk Laci Kasir
 * - Kas Keluar (Expense):
 *     Debit: Beban Kas Kecil & Pengeluaran Darurat (6-2004)
 *     Kredit: Kas di Laci Kasir (1-1001)
 * - Kas Masuk (Float replenishment):
 *     Debit: Kas di Laci Kasir (1-1001)
 *     Kredit: Bank Operasional (1-1002)
 */
export function createJournalForPettyCash(
  orgId: string,
  outletId: string,
  amount: number,
  type: 'in' | 'out',
  reason: string,
  staffName: string,
  date = Date.now()
): JournalEntry {
  const accCash = getAccount('1-1001')
  const accPettyExpense = getAccount('6-2004')
  const accBank = getAccount('1-1002')

  const lines: JournalLine[] = []

  if (type === 'out') {
    lines.push({
      accountId: accPettyExpense.code,
      accountCode: accPettyExpense.code,
      accountName: accPettyExpense.name,
      debit: amount,
      credit: 0,
      memo: `Kas kecil keluar: ${reason} (Kasir: ${staffName})`,
    })
    lines.push({
      accountId: accCash.code,
      accountCode: accCash.code,
      accountName: accCash.name,
      debit: 0,
      credit: amount,
      memo: `Pengambilan kas laci: ${reason}`,
    })
  } else {
    lines.push({
      accountId: accCash.code,
      accountCode: accCash.code,
      accountName: accCash.name,
      debit: amount,
      credit: 0,
      memo: `Tambahan modal kas laci: ${reason} (Kasir: ${staffName})`,
    })
    lines.push({
      accountId: accBank.code,
      accountCode: accBank.code,
      accountName: accBank.name,
      debit: 0,
      credit: amount,
      memo: `Penyetoran ke kas laci dari bank: ${reason}`,
    })
  }

  return {
    id: `jnl-petty-${date}-${Math.random().toString(36).slice(2, 6)}`,
    orgId,
    outletId,
    journalNumber: nextJournalNumber(),
    date,
    refType: 'manual',
    description: `Petty Cash ${type === 'out' ? 'Keluar' : 'Masuk'} - ${reason} (${staffName})`,
    lines,
    totalAmount: amount,
    createdAt: date,
  }
}
