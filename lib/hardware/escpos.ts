import type { Order, ReceiptConfig } from '../../types/erp'

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

/**
 * Menghasilkan representasi teks terformat presisi untuk printer thermal 58mm (32 kolom) / 80mm (48 kolom)
 */
export function generateEscPosPlainText(order: Order, config: ReceiptConfig): string {
  const width = config.paperWidth === '58mm' ? 32 : 48
  const lineChar = '-'
  const divider = lineChar.repeat(width)

  function center(text: string): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
  }

  function row(left: string, right: string): string {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaceCount) + right
  }

  const lines: string[] = []

  // 1. Header Toko
  lines.push(center(config.storeName))
  lines.push(center(config.branchName))
  lines.push(center(config.legalAddress))
  lines.push(center(`Telp: ${config.phone}`))
  if (config.instagram) lines.push(center(`IG: ${config.instagram}`))
  lines.push(divider)

  // 2. Info Order
  lines.push(row(`No: ${order.orderNumber}`, new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })))
  lines.push(row(`Tgl: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, order.channel.toUpperCase()))
  if (order.tableName) lines.push(row(`Meja: ${order.tableName}`, order.customerName ? `Tamu: ${order.customerName}` : ''))
  if (config.showCashierName && order.staffName) lines.push(`Kasir: ${order.staffName}`)
  lines.push(divider)

  // 3. Item Belanja
  for (const it of order.items) {
    lines.push(it.name)
    const linePrice = `${it.qty} x ${formatRupiah(it.price)}`
    lines.push(row(`  ${linePrice}`, formatRupiah(it.subtotal)))
    if (config.showModifierDetails && it.selectedModifiers && it.selectedModifiers.length > 0) {
      for (const m of it.selectedModifiers) {
        lines.push(`    + ${m.name} (${m.priceAdd > 0 ? formatRupiah(m.priceAdd) : 'Gratis'})`)
      }
    }
    if (it.notes) {
      lines.push(`    Catatan: ${it.notes}`)
    }
  }
  lines.push(divider)

  // 4. Perhitungan Finansial
  lines.push(row('Subtotal:', formatRupiah(order.subtotal)))
  if (order.isCompliment || order.payments.some((p) => p.method === 'compliment')) {
    lines.push(divider)
    lines.push(center('*** COMPLIMENT / ON THE HOUSE ***'))
    if (order.complimentReason) {
      lines.push(center(`Alasan: ${order.complimentReason}`))
    }
    lines.push(divider)
  }
  if (order.discountAmount > 0) {
    const discLabel = order.discountNote ? `Diskon (${order.discountNote}):` : 'Diskon:'
    lines.push(row(discLabel, `-${formatRupiah(order.discountAmount)}`))
  }
  if (config.showServiceCharge && order.serviceChargeAmount > 0) {
    lines.push(row(`Service Charge (${config.serviceChargeRatePct ?? 5}%):`, formatRupiah(order.serviceChargeAmount)))
  }
  if (config.showTax && order.taxAmount > 0) {
    lines.push(row(`PB1 (Pajak ${config.taxRatePct ?? 10}%):`, formatRupiah(order.taxAmount)))
  }
  lines.push(divider)

  // 5. Total & Bayar
  lines.push(row('TOTAL TAGIHAN:', formatRupiah(order.total)))
  const payLabel = order.payments.length > 0
    ? order.payments.map((p) => `${p.method.toUpperCase()} (${formatRupiah(p.amount)})`).join(' + ')
    : order.isCompliment ? 'COMPLIMENT (Rp 0)' : 'LUNAS (Rp 0)'
  lines.push(row('Bayar:', payLabel))
  if (order.cashReceived) {
    lines.push(row('Tunai Diterima:', formatRupiah(order.cashReceived)))
    lines.push(row('Kembalian:', formatRupiah(order.changeAmount ?? 0)))
  }
  lines.push(divider)

  // 6. Footer & Info WiFi
  if (config.wifiPassword) {
    lines.push(center(`WiFi: ${config.wifiPassword}`))
  }
  if (config.customFooterMessage) {
    lines.push(center(config.customFooterMessage))
  }
  if (config.qrCodeUrl) {
    lines.push(center(`Kunjungi ulasan: ${config.qrCodeUrl}`))
  }
  lines.push('\n\n')

  return lines.join('\n')
}

/**
 * Perintah ESC/POS binary buffer untuk print thermal langsung & tendang laci kasir (Drawer Kick)
 */
export function generateEscPosBinaryBuffer(text: string): Uint8Array {
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)

  // Perintah ESC/POS standar:
  // ESC @ = Init Printer (\x1b \x40)
  // ESC p 0 25 250 = Kick Cash Drawer Pin 2 (\x1b \x70 \x00 \x19 \xfa)
  // GS V 66 0 = Cut Paper (\x1d \x56 \x42 \x00)
  const initCmd = [0x1b, 0x40]
  const drawerKick = [0x1b, 0x70, 0x00, 0x19, 0xfa]
  const cutCmd = [0x1d, 0x56, 0x42, 0x00]

  const totalLength = initCmd.length + drawerKick.length + textBytes.length + cutCmd.length
  const buffer = new Uint8Array(totalLength)

  let offset = 0
  buffer.set(initCmd, offset); offset += initCmd.length
  buffer.set(drawerKick, offset); offset += drawerKick.length
  buffer.set(textBytes, offset); offset += textBytes.length
  buffer.set(cutCmd, offset)

  return buffer
}

export interface XReportParams {
  outletName: string
  branchName?: string
  staffName?: string
  openingCash: number
  totalCashRevenue: number
  totalQrisRevenue: number
  totalTransferDebitRevenue: number
  actualCashCount?: number
  cashDiscrepancy?: number
  completedOrderCount: number
  cancelledOrderCount: number
  paperWidth?: '58mm' | '80mm'
}

/**
 * Menghasilkan representasi teks struk thermal untuk Laporan Shift Kasir (X-Report / Z-Report)
 */
export function generateXReportPlainText(params: XReportParams): string {
  const width = params.paperWidth === '80mm' ? 48 : 32
  const divider = '-'.repeat(width)
  const doubleDivider = '='.repeat(width)

  function center(text: string): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
  }

  function row(left: string, right: string): string {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaceCount) + right
  }

  const lines: string[] = []
  lines.push(doubleDivider)
  lines.push(center('LAPORAN SHIFT KASIR (X-REPORT)'))
  lines.push(center(params.outletName.toUpperCase()))
  if (params.branchName) lines.push(center(params.branchName))
  lines.push(divider)

  const now = new Date()
  lines.push(row('Tanggal:', now.toLocaleDateString('id-ID')))
  lines.push(row('Waktu Cetak:', now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })))
  lines.push(row('Kasir Bertugas:', params.staffName || 'Kasir Resto'))
  lines.push(divider)

  lines.push(center('-- REKAPITULASI KAS LACI --'))
  lines.push(row('Modal Kas Awal:', formatRupiah(params.openingCash)))
  lines.push(row('Penjualan Tunai (+):', formatRupiah(params.totalCashRevenue)))

  const expectedCash = params.openingCash + params.totalCashRevenue
  lines.push(row('Target Kas di Laci:', formatRupiah(expectedCash)))

  if (params.actualCashCount !== undefined && params.actualCashCount > 0) {
    lines.push(row('Uang Fisik Dihitung:', formatRupiah(params.actualCashCount)))
    const disc = params.cashDiscrepancy ?? (params.actualCashCount - expectedCash)
    if (disc === 0) {
      lines.push(row('Status Selisih Kas:', 'PAS / SESUAI (0)'))
    } else if (disc > 0) {
      lines.push(row('Selisih (Lebih):', `+${formatRupiah(disc)}`))
    } else {
      lines.push(row('Selisih (Kurang):', `-${formatRupiah(Math.abs(disc))}`))
    }
  }

  lines.push(divider)
  lines.push(center('-- PENERIMAAN NON-TUNAI --'))
  lines.push(row('QRIS Dinamis:', formatRupiah(params.totalQrisRevenue)))
  lines.push(row('Debit EDC & Transfer:', formatRupiah(params.totalTransferDebitRevenue)))

  lines.push(divider)
  const totalOmset = params.totalCashRevenue + params.totalQrisRevenue + params.totalTransferDebitRevenue
  lines.push(row('TOTAL OMSET SHIFT:', formatRupiah(totalOmset)))
  lines.push(row('Transaksi Lunas:', `${params.completedOrderCount} struk`))
  if (params.cancelledOrderCount > 0) {
    lines.push(row('Transaksi Batal/Void:', `${params.cancelledOrderCount} struk`))
  }
  lines.push(doubleDivider)
  lines.push(center('Dicetak otomatis oleh POS'))
  lines.push(center('Simpan arsip bersama fisik kas'))
  lines.push('\n\n')

  return lines.join('\n')
}

/**
 * Menghasilkan representasi teks struk thermal untuk Pre-Print Check / Bill Sementara Meja
 * Digunakan sebelum pembayaran agar tamu dapat memeriksa pesanan mereka.
 */
export function generateEscPosPreBillText(order: Order, config: ReceiptConfig): string {
  const width = config.paperWidth === '58mm' ? 32 : 48
  const divider = '-'.repeat(width)
  const doubleDivider = '='.repeat(width)

  function center(text: string): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
  }

  function row(left: string, right: string): string {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaceCount) + right
  }

  const lines: string[] = []
  lines.push(doubleDivider)
  lines.push(center('*** BILL SEMENTARA ***'))
  lines.push(center('(BUKAN BUKTI PEMBAYARAN)'))
  lines.push(doubleDivider)
  lines.push(center(config.storeName))
  if (config.branchName) lines.push(center(config.branchName))
  lines.push(divider)

  lines.push(row(`Meja: ${order.tableName || '-'}`, `No: ${order.orderNumber}`))
  lines.push(row(`Tgl: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })))
  if (order.customerName) lines.push(`Tamu: ${order.customerName}`)
  if (order.staffName) lines.push(`Kasir/Pelayan: ${order.staffName}`)
  lines.push(divider)

  // Item List
  for (const it of order.items) {
    lines.push(it.name)
    const linePrice = `${it.qty} x ${formatRupiah(it.price)}`
    lines.push(row(`  ${linePrice}`, formatRupiah(it.subtotal)))
    if (it.notes) {
      lines.push(`    Catatan: ${it.notes}`)
    }
  }
  lines.push(divider)

  lines.push(row('Subtotal:', formatRupiah(order.subtotal)))
  if (order.discountAmount > 0) {
    lines.push(row('Diskon:', `-${formatRupiah(order.discountAmount)}`))
  }
  if (config.showServiceCharge && order.serviceChargeAmount > 0) {
    lines.push(row(`Service Charge (${config.serviceChargeRatePct ?? 5}%):`, formatRupiah(order.serviceChargeAmount)))
  }
  if (config.showTax && order.taxAmount > 0) {
    lines.push(row(`PB1 (${config.taxRatePct ?? 10}%):`, formatRupiah(order.taxAmount)))
  }
  lines.push(doubleDivider)
  lines.push(row('TOTAL ESTIMASI:', formatRupiah(order.total)))
  lines.push(doubleDivider)
  lines.push(center('Harap periksa pesanan Anda'))
  lines.push(center('Silakan lakukan pembayaran di kasir'))
  lines.push(center('atau panggil pramusaji kami'))
  lines.push('\n\n')

  return lines.join('\n')
}

/**
 * Menghasilkan representasi teks struk thermal untuk Split Bill (Bagi Rata Tagihan)
 */
export function generateEscPosSplitBillText(
  order: Order,
  config: ReceiptConfig,
  splitCount: number,
  personIndex: number
): string {
  const width = config.paperWidth === '58mm' ? 32 : 48
  const divider = '-'.repeat(width)
  const doubleDivider = '='.repeat(width)

  function center(text: string): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
  }

  function row(left: string, right: string): string {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaceCount) + right
  }

  const perPersonAmount = Math.ceil(order.total / splitCount)

  const lines: string[] = []
  lines.push(doubleDivider)
  lines.push(center(`*** SPLIT BILL (${personIndex} DARI ${splitCount}) ***`))
  lines.push(doubleDivider)
  lines.push(center(config.storeName))
  lines.push(divider)

  lines.push(row(`Meja: ${order.tableName || '-'}`, `Ref: ${order.orderNumber}`))
  lines.push(row('Bagi Rata:', `${splitCount} Orang`))
  lines.push(divider)

  lines.push(row('Total Keseluruhan:', formatRupiah(order.total)))
  lines.push(row(`Pembagian (${splitCount} Bagian):`, `1/${splitCount}`))
  lines.push(doubleDivider)
  lines.push(row('TAGIHAN PER ORANG:', formatRupiah(perPersonAmount)))
  lines.push(doubleDivider)
  lines.push(center('Metode Pembayaran:'))
  lines.push(center('QRIS / Tunai / Kartu Debit'))
  lines.push(center('Terima kasih telah berkunjung!'))
  lines.push('\n\n')

  return lines.join('\n')
}

/**
 * Mendeteksi apakah item adalah makanan (dapur) atau minuman (bar)
 */
export function isKitchenFoodItem(item: { isKitchenItem?: boolean; name: string }): boolean {
  if (item.isKitchenItem === true) return true
  if (item.isKitchenItem === false) return false
  const lower = item.name.toLowerCase()
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
  return !beverageKeywords.some((kw) => lower.includes(kw))
}

/**
 * Menghasilkan representasi teks struk thermal untuk Tiket Dapur (KOT) atau Tiket Bar (BOT)
 * Menampilkan nomor meja besar, daftar kuantitas, catatan masak, tanpa rincian harga.
 */
export function generateEscPosKitchenTicketText(
  order: Order,
  config: ReceiptConfig,
  station: 'kitchen' | 'bar' | 'all' = 'kitchen'
): string {
  const width = config.paperWidth === '58mm' ? 32 : 48
  const divider = '-'.repeat(width)
  const doubleDivider = '='.repeat(width)

  function center(text: string): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
  }

  function row(left: string, right: string): string {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaceCount) + right
  }

  // Filter items berdasarkan stasiun kerja
  const filteredItems = order.items.filter((it) => {
    const isFood = isKitchenFoodItem(it)
    if (station === 'kitchen') return isFood
    if (station === 'bar') return !isFood
    return true // 'all'
  })

  const stationTitle =
    station === 'kitchen'
      ? '*** TIKET DAPUR (KOT) ***'
      : station === 'bar'
      ? '*** TIKET BAR (BOT) ***'
      : '*** TIKET PRODUKSI ***'

  const lines: string[] = []
  lines.push(doubleDivider)
  lines.push(center(stationTitle))
  lines.push(doubleDivider)

  // Header Meja & Tipe Pesanan (Tampil Sangat Jelas untuk Chef / Barista)
  const tableDisplay = order.tableName ? `MEJA: ${order.tableName.toUpperCase()}` : `ORDER: ${order.channel.toUpperCase()}`
  lines.push(center(tableDisplay))
  lines.push(
    row(
      `No: ${order.orderNumber}`,
      new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    )
  )
  lines.push(row(`Tgl: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, `Tipe: ${order.channel.toUpperCase()}`))
  if (order.customerName) lines.push(`Tamu: ${order.customerName}`)
  if (order.staffName) lines.push(`Server/Kasir: ${order.staffName}`)
  lines.push(divider)

  // Daftar Pesanan Khusus Dapur / Bar
  if (filteredItems.length === 0) {
    lines.push(center(`(Tidak ada item untuk ${station === 'kitchen' ? 'Dapur' : 'Bar'})`))
  } else {
    lines.push(row('QTY', 'MENU PESANAN'))
    lines.push(divider)

    for (const it of filteredItems) {
      lines.push(`[ ${it.qty}x ] ${it.name.toUpperCase()}`)
      if (it.selectedModifiers && it.selectedModifiers.length > 0) {
        for (const m of it.selectedModifiers) {
          lines.push(`      + ${m.name}`)
        }
      }
      if (it.notes) {
        lines.push(`      ** NOTE: ${it.notes.toUpperCase()} **`)
      }
    }
  }

  lines.push(divider)
  const totalItemCount = filteredItems.reduce((s, it) => s + it.qty, 0)
  lines.push(row('TOTAL ITEM:', `${totalItemCount} Porsi`))

  if (order.notes) {
    lines.push(divider)
    lines.push('CATATAN MEJA:')
    lines.push(`${order.notes}`)
  }

  lines.push(doubleDivider)
  lines.push(
    center(
      station === 'kitchen'
        ? '-- HOT & COLD KITCHEN --'
        : station === 'bar'
        ? '-- COFFEE & BAR STATION --'
        : '-- EXPEDITION PASS --'
    )
  )
  lines.push('\n\n')

  return lines.join('\n')
}

/**
 * Menghasilkan representasi teks struk thermal untuk Tiket Checker / Runner (Ekspedisi Makanan)
 * Menampilkan kotak centang [ ] untuk seluruh item pesanan sebelum disajikan ke meja.
 */
export function generateEscPosCheckerTicketText(order: Order, config: ReceiptConfig): string {
  const width = config.paperWidth === '58mm' ? 32 : 48
  const divider = '-'.repeat(width)
  const doubleDivider = '='.repeat(width)

  function center(text: string): string {
    if (text.length >= width) return text.slice(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
  }

  function row(left: string, right: string): string {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + ' '.repeat(spaceCount) + right
  }

  const lines: string[] = []
  lines.push(doubleDivider)
  lines.push(center('*** TIKET CHECKER / RUNNER ***'))
  lines.push(doubleDivider)

  const tableDisplay = order.tableName ? `MEJA: ${order.tableName.toUpperCase()}` : `ORDER: ${order.channel.toUpperCase()}`
  lines.push(center(tableDisplay))
  lines.push(
    row(
      `No: ${order.orderNumber}`,
      new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    )
  )
  if (order.customerName) lines.push(`Tamu: ${order.customerName}`)
  lines.push(divider)

  lines.push(row('CHECK', 'ITEM PESANAN (QTY)'))
  lines.push(divider)

  for (const it of order.items) {
    const stationTag = isKitchenFoodItem(it) ? '[DPR]' : '[BAR]'
    lines.push(`[ ] ${it.qty}x ${it.name} ${stationTag}`)
    if (it.notes) {
      lines.push(`    Note: ${it.notes}`)
    }
  }

  lines.push(divider)
  const totalItemCount = order.items.reduce((s, it) => s + it.qty, 0)
  lines.push(row('TOTAL SELURUH ITEM:', `${totalItemCount} Item`))
  lines.push(doubleDivider)
  lines.push(center('Periksa sebelum disajikan ke tamu'))
  lines.push('\n\n')

  return lines.join('\n')
}



