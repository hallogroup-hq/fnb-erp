import jsPDF from 'jspdf'
import type { Order, ReceiptConfig } from '../../types/erp'

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

/**
 * Download a real, dedicated thermal receipt PDF sized exactly to 58mm or 80mm roll width.
 * This ensures the receipt looks like a genuine POS ticket, NOT a distorted A4 page!
 */
export function downloadThermalReceiptPdf(order: Order, config: ReceiptConfig) {
  const is80mm = config.paperWidth === '80mm'
  const widthMm = is80mm ? 80 : 58
  const marginMm = is80mm ? 4 : 3
  const printableWidth = widthMm - marginMm * 2

  // Calculate exact line count for precise roll height without wasteful trailing whitespace
  let linesCount = 0
  linesCount += 1 // Store name
  if (config.branchName) linesCount += 1
  if (config.legalAddress) linesCount += 1
  if (config.phone) linesCount += 1
  if (config.instagram) linesCount += 1
  linesCount += 1 // Dashed line

  linesCount += 2 // No, Tgl
  if (order.tableName) linesCount += 1
  if (config.showCashierName && order.staffName) linesCount += 1
  linesCount += 1 // Dashed line

  for (const it of order.items) {
    linesCount += 2 // Name + qty & subtotal
    if (config.showModifierDetails && it.selectedModifiers) {
      linesCount += it.selectedModifiers.length
    }
    if (it.notes) linesCount += 1
  }
  linesCount += 1 // Dashed line

  linesCount += 1 // Subtotal
  if (order.discountAmount > 0) linesCount += 1
  if (config.showServiceCharge && order.serviceChargeAmount > 0) linesCount += 1
  if (config.showTax && order.taxAmount > 0) linesCount += 1
  linesCount += 1 // Dashed line

  linesCount += 2 // Grand total + payment method
  if (order.cashReceived) linesCount += 2
  linesCount += 1 // Dashed line

  if (config.wifiPassword) linesCount += 1
  if (config.customFooterMessage) linesCount += 1
  linesCount += 1 // Legal footer notice

  const lineHeight = 3.6
  const totalHeightMm = Math.max(65, Math.ceil(linesCount * lineHeight + 14))

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, totalHeightMm],
  })

  doc.setFont('courier', 'normal')
  let y = 6

  function centerText(text: string, fontSize = 8.5, isBold = false) {
    doc.setFont('courier', isBold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.text(text, widthMm / 2, y, { align: 'center' })
    y += lineHeight
  }

  function leftRightRow(left: string, right: string, fontSize = 7.5, isBold = false) {
    doc.setFont('courier', isBold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.text(left, marginMm, y)
    doc.text(right, widthMm - marginMm, y, { align: 'right' })
    y += lineHeight
  }

  function dashedLine() {
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    const dashes = is80mm ? '------------------------------------------------' : '--------------------------------'
    doc.text(dashes, widthMm / 2, y, { align: 'center' })
    y += lineHeight
  }

  // 1. STORE HEADER
  centerText(config.storeName.toUpperCase(), is80mm ? 10.5 : 9.5, true)
  if (config.branchName) centerText(config.branchName, 8, false)
  if (config.legalAddress) centerText(config.legalAddress, 7, false)
  if (config.phone) centerText(`Telp: ${config.phone}`, 7, false)
  if (config.instagram) centerText(`IG: ${config.instagram}`, 7, false)

  dashedLine()

  // 2. ORDER METADATA
  leftRightRow(`No: ${order.orderNumber}`, new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), 7.5)
  leftRightRow(`Tgl: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, order.channel.toUpperCase(), 7.5)
  if (order.tableName) {
    leftRightRow(`Meja: ${order.tableName}`, order.customerName ? `Tamu: ${order.customerName}` : '', 7.5, true)
  }
  if (config.showCashierName && order.staffName) {
    leftRightRow(`Kasir: ${order.staffName}`, '', 7)
  }

  dashedLine()

  // 3. ITEMS LIST
  for (const it of order.items) {
    doc.setFont('courier', 'bold')
    doc.setFontSize(7.5)
    doc.text(it.name, marginMm, y)
    y += lineHeight

    const qtyPrice = `  ${it.qty} x ${formatRupiah(it.price)}`
    leftRightRow(qtyPrice, formatRupiah(it.subtotal), 7.5, false)

    if (config.showModifierDetails && it.selectedModifiers && it.selectedModifiers.length > 0) {
      for (const m of it.selectedModifiers) {
        const modText = `   + ${m.name}`
        const modPrice = m.priceAdd > 0 ? formatRupiah(m.priceAdd) : ''
        leftRightRow(modText, modPrice, 6.8, false)
      }
    }

    if (it.notes) {
      doc.setFont('courier', 'italic')
      doc.setFontSize(6.8)
      doc.text(`   Catatan: ${it.notes}`, marginMm, y)
      y += lineHeight
    }
  }

  dashedLine()

  // 4. SUMMARY
  leftRightRow('Subtotal:', formatRupiah(order.subtotal), 7.5)
  if (order.discountAmount > 0) {
    leftRightRow('Diskon Promosi:', `-${formatRupiah(order.discountAmount)}`, 7.5)
  }
  if (config.showServiceCharge && order.serviceChargeAmount > 0) {
    leftRightRow(`Service Charge (${config.serviceChargeRatePct ?? 5}%):`, formatRupiah(order.serviceChargeAmount), 7.5)
  }
  if (config.showTax && order.taxAmount > 0) {
    leftRightRow(`PB1 (Pajak Resto ${config.taxRatePct ?? 10}%):`, formatRupiah(order.taxAmount), 7.5)
  }

  dashedLine()

  // 5. GRAND TOTAL
  leftRightRow('TOTAL TAGIHAN:', formatRupiah(order.total), is80mm ? 9.5 : 8.5, true)

  const paymentSummary = order.payments.map((p) => `${p.method.toUpperCase()} ${formatRupiah(p.amount)}`).join(', ')
  leftRightRow('Bayar:', paymentSummary, 7.5)

  if (order.cashReceived) {
    leftRightRow('Tunai Diterima:', formatRupiah(order.cashReceived), 7.5)
    leftRightRow('Kembalian:', formatRupiah(order.changeAmount ?? 0), 7.5, true)
  }

  dashedLine()

  // 6. FOOTER
  if (config.wifiPassword) {
    centerText(`WiFi: ${config.wifiPassword}`, 7)
  }
  if (config.customFooterMessage) {
    centerText(config.customFooterMessage, 7)
  }
  centerText('Simpan struk sebagai bukti pembayaran yang sah', 6.5)

  const filename = `Struk_${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
  doc.save(filename)
}

/**
 * Download a real, dedicated thermal Kitchen / Bar Order Ticket PDF (KOT/BOT)
 * sized exactly to 58mm or 80mm roll width.
 */
export function downloadThermalKitchenTicketPdf(
  order: Order,
  config: ReceiptConfig,
  station: 'kitchen' | 'bar' | 'all' = 'kitchen'
) {
  const is80mm = config.paperWidth === '80mm'
  const widthMm = is80mm ? 80 : 58
  const marginMm = is80mm ? 4 : 3

  const beverageKeywords = [
    'kopi',
    'coffee',
    'latte',
    'espresso',
    'cappuccino',
    'tea',
    'teh',
    'matcha',
    'juice',
    'jus',
    'mocktail',
    'cocktail',
    'soda',
    'cola',
    'mineral',
    'air',
    'beer',
    'boba',
    'sirup',
    'shake',
  ]

  const filteredItems = order.items.filter((it) => {
    let isFood = true
    if (it.isKitchenItem === true) isFood = true
    else if (it.isKitchenItem === false) isFood = false
    else {
      const lower = it.name.toLowerCase()
      isFood = !beverageKeywords.some((kw) => lower.includes(kw))
    }

    if (station === 'kitchen') return isFood
    if (station === 'bar') return !isFood
    return true
  })

  let linesCount = 8
  for (const it of filteredItems) {
    linesCount += 1
    if (it.selectedModifiers) linesCount += it.selectedModifiers.length
    if (it.notes) linesCount += 1
  }

  const lineHeight = 3.8
  const totalHeightMm = Math.max(55, Math.ceil(linesCount * lineHeight + 14))

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, totalHeightMm],
  })

  doc.setFont('courier', 'normal')
  let y = 6

  function centerText(text: string, fontSize = 8.5, isBold = false) {
    doc.setFont('courier', isBold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.text(text, widthMm / 2, y, { align: 'center' })
    y += lineHeight
  }

  function leftRightRow(left: string, right: string, fontSize = 7.5, isBold = false) {
    doc.setFont('courier', isBold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.text(left, marginMm, y)
    doc.text(right, widthMm - marginMm, y, { align: 'right' })
    y += lineHeight
  }

  function dashedLine() {
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    const dashes = is80mm ? '================================================' : '================================'
    doc.text(dashes, widthMm / 2, y, { align: 'center' })
    y += lineHeight
  }

  const title =
    station === 'kitchen'
      ? '*** TIKET DAPUR (KOT) ***'
      : station === 'bar'
      ? '*** TIKET BAR (BOT) ***'
      : '*** TIKET PRODUKSI ***'
  centerText(title, is80mm ? 10.5 : 9.5, true)
  dashedLine()

  const tableStr = order.tableName ? `MEJA: ${order.tableName.toUpperCase()}` : `ORDER: ${order.channel.toUpperCase()}`
  centerText(tableStr, is80mm ? 11 : 10, true)
  leftRightRow(
    `No: ${order.orderNumber}`,
    new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    8,
    true
  )
  leftRightRow(`Tgl: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, `Tipe: ${order.channel.toUpperCase()}`, 7.5)
  if (order.customerName) leftRightRow(`Tamu: ${order.customerName}`, '', 7.5)
  if (order.staffName) leftRightRow(`Server: ${order.staffName}`, '', 7.5)
  dashedLine()

  if (filteredItems.length === 0) {
    centerText(`(Tidak ada item untuk ${station === 'kitchen' ? 'Dapur' : 'Bar'})`, 7.5)
  } else {
    for (const it of filteredItems) {
      doc.setFont('courier', 'bold')
      doc.setFontSize(8.5)
      doc.text(`[ ${it.qty}x ] ${it.name.toUpperCase()}`, marginMm, y)
      y += lineHeight

      if (it.selectedModifiers) {
        doc.setFont('courier', 'normal')
        doc.setFontSize(7.5)
        for (const m of it.selectedModifiers) {
          doc.text(`      + ${m.name}`, marginMm, y)
          y += lineHeight
        }
      }
      if (it.notes) {
        doc.setFont('courier', 'bold')
        doc.setFontSize(7.5)
        doc.text(`      ** NOTE: ${it.notes.toUpperCase()} **`, marginMm, y)
        y += lineHeight
      }
    }
  }

  dashedLine()
  const totalItemCount = filteredItems.reduce((s, it) => s + it.qty, 0)
  leftRightRow('TOTAL ITEM:', `${totalItemCount} Porsi`, 8, true)
  if (order.notes) {
    leftRightRow(`Catatan: ${order.notes}`, '', 7.5)
  }
  dashedLine()
  centerText(
    station === 'kitchen' ? '-- HOT & COLD KITCHEN --' : station === 'bar' ? '-- COFFEE & BAR --' : '-- EXPEDITION --',
    7
  )

  const prefix = station === 'kitchen' ? 'KOT' : station === 'bar' ? 'BOT' : 'TIKET'
  const filename = `${prefix}_${order.tableName ? order.tableName.replace(/\s+/g, '_') : 'Order'}_${order.orderNumber}.pdf`
  doc.save(filename)
}

