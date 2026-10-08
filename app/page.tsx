'use client'

import React, { useState, useMemo } from 'react'
import {
  Store,
  Tablet,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  WifiOff,
  Receipt,
  TrendingUp,
  BarChart3,
  Clock,
  HelpCircle,
  CreditCard,
  ChevronDown,
  ExternalLink,
  Flame,
  FileSpreadsheet,
  Printer,
  Check,
  Coffee,
  AlertCircle,
  Package,
  RefreshCw,
  Smartphone,
  Laptop,
  Building2,
  Server,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react'

// Live Demo Store Link
const LIVE_DEMO_URL = 'https://fnb-erp.vercel.app'
const OPS_CONSOLE_URL = 'https://fnb-ops-delta.vercel.app'

interface MenuItem {
  id: string
  name: string
  category: 'Coffee' | 'Food' | 'Bakery'
  price: number
  prepTime: string
  bom: {
    beansGrams?: number
    milkMl?: number
    syrupMl?: number
    meatGrams?: number
    cogs: number
  }
}

const DEMO_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Iced Palm Sugar Latte',
    category: 'Coffee',
    price: 28000,
    prepTime: '2 min',
    bom: { beansGrams: 18, milkMl: 160, syrupMl: 25, cogs: 9230 },
  },
  {
    id: 'm2',
    name: 'Espresso Double Shot',
    category: 'Coffee',
    price: 22000,
    prepTime: '1 min',
    bom: { beansGrams: 20, cogs: 4400 },
  },
  {
    id: 'm3',
    name: 'Truffle Parmesan Fries',
    category: 'Food',
    price: 38000,
    prepTime: '8 min',
    bom: { cogs: 13500 },
  },
  {
    id: 'm4',
    name: 'Wagyu Beef Donburi',
    category: 'Food',
    price: 65000,
    prepTime: '10 min',
    bom: { meatGrams: 120, cogs: 26000 },
  },
  {
    id: 'm5',
    name: 'Butter Croissant Almond',
    category: 'Bakery',
    price: 32000,
    prepTime: '3 min',
    bom: { cogs: 11200 },
  },
]

export default function SaaSLandingPage() {
  // -----------------------------------------------------------------
  // 1. HERO INTERACTIVE COUNTER TERMINAL STATE
  // -----------------------------------------------------------------
  const [selectedTable, setSelectedTable] = useState<string>('Meja 04')
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number; note: string }>>([
    { item: DEMO_MENU[0], qty: 2, note: 'Less Ice, Oat Milk' },
    { item: DEMO_MENU[2], qty: 1, note: 'Extra Truffle Sauce' },
  ])
  const [isReceiptPrinting, setIsReceiptPrinting] = useState<boolean>(true)
  const [lastPrintedAt, setLastPrintedAt] = useState<string>('12:42:18 WIB')
  const [orderNumber, setOrderNumber] = useState<number>(1042)
  const [kdsOrders, setKdsOrders] = useState<Array<{ id: number; table: string; items: string[]; status: 'cooking' | 'ready'; elapsed: string }>>([
    { id: 1041, table: 'Meja 02', items: ['2x Espresso Double', '1x Butter Croissant'], status: 'ready', elapsed: '01:40' },
    { id: 1042, table: 'Meja 04', items: ['2x Iced Palm Sugar Latte', '1x Truffle Parmesan Fries'], status: 'cooking', elapsed: '00:15' },
  ])

  // Inventory deductions tracker
  const inventoryDeductions = useMemo(() => {
    let beans = 0
    let milk = 0
    let syrup = 0
    let cogs = 0

    cart.forEach((c) => {
      if (c.item.bom.beansGrams) beans += c.item.bom.beansGrams * c.qty
      if (c.item.bom.milkMl) milk += c.item.bom.milkMl * c.qty
      if (c.item.bom.syrupMl) syrup += c.item.bom.syrupMl * c.qty
      cogs += c.item.bom.cogs * c.qty
    })

    return { beans, milk, syrup, cogs }
  }, [cart])

  const subtotal = useMemo(() => {
    return cart.reduce((sum, c) => sum + c.item.price * c.qty, 0)
  }, [cart])

  const taxPb1 = useMemo(() => Math.round(subtotal * 0.1), [subtotal])
  const grandTotal = useMemo(() => subtotal + taxPb1, [subtotal, taxPb1])

  function handleAddToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id)
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { item, qty: 1, note: 'SOP Normal' }]
    })
  }

  function handleRemoveItem(itemId: string) {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId))
  }

  function handleSimulatePrintReceipt() {
    setIsReceiptPrinting(false)
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`
    setLastPrintedAt(timeStr)
    const nextOrderNum = orderNumber + 1
    setOrderNumber(nextOrderNum)

    // Add to KDS
    const itemNames = cart.map((c) => `${c.qty}x ${c.item.name}`)
    setKdsOrders((prev) => [
      { id: nextOrderNum, table: selectedTable, items: itemNames, status: 'cooking', elapsed: '00:01' },
      ...prev.slice(0, 2),
    ])

    setTimeout(() => {
      setIsReceiptPrinting(true)
    }, 50)
  }

  // -----------------------------------------------------------------
  // 2. INTERACTIVE ROI & FOOD COST CALCULATOR STATE
  // -----------------------------------------------------------------
  const [outletsCount, setOutletsCount] = useState<number>(2)
  const [dailyOrdersPerOutlet, setDailyOrdersPerOutlet] = useState<number>(180)
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(45000)

  const roiCalculations = useMemo(() => {
    const monthlyGrossRevenue = outletsCount * dailyOrdersPerOutlet * avgTicketPrice * 30
    const monthlyFoodCost = monthlyGrossRevenue * 0.38
    // Average 4.8% savings from precision recipe gramatur tracking and anti-shrinkage
    const monthlyFoodCostSavings = monthlyFoodCost * 0.048
    // 20 hours staff reconciliation saved per branch per month x Rp 45.000/hr
    const monthlyAdminTimeSaved = outletsCount * 20 * 45000
    const totalMonthlyValue = monthlyFoodCostSavings + monthlyAdminTimeSaved

    return {
      monthlyGrossRevenue,
      monthlyFoodCostSavings,
      monthlyAdminTimeSaved,
      totalMonthlyValue,
      annualSavings: totalMonthlyValue * 12,
    }
  }, [outletsCount, dailyOrdersPerOutlet, avgTicketPrice])

  // -----------------------------------------------------------------
  // 3. PRICING & REGISTRATION FORM STATE
  // -----------------------------------------------------------------
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  const [regForm, setRegForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    city: '',
    tier: 'pro',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  // -----------------------------------------------------------------
  // 4. FAQ STATE
  // -----------------------------------------------------------------
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const faqItems = [
    {
      q: 'Bagaimana jika koneksi internet ruko mendadak mati di jam sibuk?',
      a: 'Nusantara F&B OS dibangun dengan arsitektur Offline-First (IndexedDB lokal di browser). Transaksi kasir tetap berjalan lancar, printer thermal tetap mencetak struk dalam 0.2 detik, dan semua data otomatis tersinkronisasi ke server pusat saat koneksi internet kembali menyala. Tidak ada transaksi yang tertunda atau hilang.',
    },
    {
      q: 'Apakah saya wajib membeli mesin kasir atau hardware khusus dari Hallo Group?',
      a: 'Sama sekali tidak. Anda bebas menggunakan perangkat yang sudah Anda miliki: tablet Android, iPad, laptop Windows, atau smartphone. Sistem kami juga kompatibel langsung dengan hampir semua printer thermal 58mm dan 80mm di pasaran (USB, Bluetooth, atau LAN ethernet) serta laci uang standar RJ11.',
    },
    {
      q: 'Bagaimana sistem mencegah kecurangan kasir seperti void atau pembatalan transaksi?',
      a: 'Setiap aksi pembatalan nota, diskon manual, atau void transaksi memerlukan otorisasi PIN manajer atau supervisor. Seluruh riwayat perubahan tercatat ke dalam Audit Trail log dengan stempel waktu detik yang tidak dapat diubah atau dihapus oleh kasir.',
    },
    {
      q: 'Bisakah resep menu disesuaikan dengan opsi tambahan seperti ganti susu oat?',
      a: 'Bisa. Sistem mendukung Master Bill of Materials (BOM) bertingkat dengan varian ad-hoc. Ketika barista memilih opsi Oat Milk, sistem secara otomatis mengurangi stok susu oat di gudang dan menyesuaikan HPP serta harga jual seketika tanpa merusak takaran resep dasar.',
    },
    {
      q: 'Apakah laporan keuangannya sudah sesuai standar akuntansi untuk pengajuan pinjaman bank?',
      a: 'Ya. Laporan Laba Rugi dan Neraca kami mengikuti standar SAK EMKM resmi yang diakui perbankan dan kantor pajak di Indonesia. Anda dapat mengunduh laporan bulanan dalam format Excel rapi atau PDF siap cetak dalam satu klik.',
    },
  ]

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!regForm.businessName || !regForm.ownerName || !regForm.phone) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmittedSuccess(true)
    }, 700)
  }

  return (
    <div className="min-h-screen bg-[#0e0d0c] text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP SYSTEM TELEMETRY TICKER (AUTHENTIC F&B OPS BAR)        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#171513] border-b border-stone-800/80 px-4 py-2 text-[11px] text-stone-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-stone-200">SISTEM AKTIF:</span>
              <span>Latency 18ms · Offline Storage Ready</span>
            </div>
            <span className="hidden md:inline text-stone-700">|</span>
            <span className="hidden md:inline text-stone-400">
              Sinkronisasi Kasir ke KDS Dapur & BOM Stok Terintegrasi
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Uji Coba Toko Kasir Langsung</span>
              <ExternalLink size={11} />
            </a>
            <span className="text-stone-700">·</span>
            <a
              href={OPS_CONSOLE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors"
            >
              <span>Fleet Ops Hub</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN HEADER NAVIGATION                                     */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#0e0d0c]/90 backdrop-blur-md border-b border-stone-800/90 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* BRAND */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center font-mono font-bold text-sm text-amber-400 shadow-inner group-hover:border-amber-500/50 transition-colors">
              N
            </div>
            <div>
              <div className="font-bold text-stone-100 text-sm tracking-tight flex items-center gap-1.5">
                <span>Nusantara F&B OS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300">
                  v2.5
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono block">
                Hallo Group Enterprise
              </span>
            </div>
          </a>

          {/* NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-stone-300">
            <a href="#simulator" className="hover:text-amber-400 transition-colors">
              Mesin Kasir & Struk
            </a>
            <a href="#masalah" className="hover:text-amber-400 transition-colors">
              3 Ancaman Resto
            </a>
            <a href="#resep" className="hover:text-amber-400 transition-colors">
              Gramatur Resep BOM
            </a>
            <a href="#kalkulator" className="hover:text-amber-400 transition-colors">
              Kalkulator Profit
            </a>
            <a href="#harga" className="hover:text-amber-400 transition-colors">
              Paket Investasi
            </a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-700 hover:border-stone-500 bg-stone-900/60 text-xs font-semibold text-stone-200 hover:text-white transition-all"
            >
              <Store size={13} className="text-amber-400" />
              <span>Buka Demo Kasir</span>
            </a>

            <a
              href="#daftar"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Uji Coba 14 Hari</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO SECTION (BOLD EDITORIAL + HARDWARE TERMINAL MOCKUP)   */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-12 pb-16 px-4 sm:px-8 overflow-hidden border-b border-stone-800">
        {/* Ambient warm gradient background (pure CSS) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-amber-500/10 via-amber-700/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-12">
          {/* HERO HEADINGS (STRICT NO-PILL BADGE) */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-amber-400/90">
              SISTEM OPERASI RESTORAN, CAFE & MULTI-CABANG
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-100 tracking-tight leading-[1.12]">
              Kendalikan Meja, Dapur, Stok Bahan Baku, dan Laporan Keuangan dalam Satu Ketukan.
            </h1>

            <p className="text-sm sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
              Bukan software kasir pencatat biasa. Nusantara F&B OS menyatukan kasir POS kilat, Kitchen Display System (KDS), pemotongan HPP otomatis per gram bahan, dan laporan laba rugi SAK EMKM tanpa akuntan manual.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#daftar"
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.98]"
              >
                <span>Mulai Uji Coba Gratis 14 Hari</span>
                <ArrowRight size={16} />
              </a>

              <a
                href={LIVE_DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-3.5 rounded-lg border border-stone-700 hover:border-stone-500 bg-stone-900/80 text-stone-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Store size={16} className="text-amber-400" />
                <span>Buka Aplikasi Demo (Tanpa Daftar)</span>
                <ExternalLink size={13} className="text-stone-400" />
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-stone-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-amber-400" />
                <span>100% Kebal WiFi Mati (Offline-First)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-amber-400" />
                <span>Cetak Struk 0.2 Detik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-amber-400" />
                <span>0% Biaya Potongan Komisi Omzet</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* THE TACTILE RESTO ENGINE: HARDWARE POS & THERMAL RECEIPT    */}
          {/* ----------------------------------------------------------- */}
          <div id="simulator" className="pt-4">
            <div className="rounded-2xl border border-stone-800 bg-[#141210] p-4 sm:p-7 shadow-2xl space-y-6">
              {/* TOP HARDWARE CONTROLS BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <div>
                    <span className="font-bold text-sm text-stone-100 block">
                      Simulasi Meja Kasir & Kitchen Display Langsung
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Klik menu di bawah untuk melihat struk tercetak & stok bahan berkurang seketika
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-stone-400">Pilih Meja:</span>
                  {['Meja 02', 'Meja 04', 'Meja 08', 'Takeaway'].map((tbl) => (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => setSelectedTable(tbl)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedTable === tbl
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {tbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* THREE-COLUMN HARDWARE WORKBENCH */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. POS TOUCH SCREEN TERMINAL (COL 5) */}
                <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-[#1b1916] p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Tablet size={15} className="text-amber-400" />
                      <span className="text-xs font-bold text-stone-200 uppercase tracking-wide font-mono">
                        Layar Sentuh Kasir POS
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      KATALOG MENU CEPAT
                    </span>
                  </div>

                  {/* MENU GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_MENU.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="p-3 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800/90 hover:border-stone-700 text-left transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase">
                            <span>{item.category}</span>
                            <span className="text-amber-400/90">{item.prepTime}</span>
                          </div>
                          <div className="text-xs font-bold text-stone-100 group-hover:text-amber-400 mt-1 leading-snug">
                            {item.name}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-stone-200">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                          <span className="w-5 h-5 rounded bg-stone-800 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center text-xs transition-colors">
                            <Plus size={12} />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* ACTIVE CART DRAWER */}
                  <div className="pt-2 border-t border-stone-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-300 font-bold">Keranjang Pesanan ({selectedTable}):</span>
                      <span className="text-stone-400">{cart.length} Jenis Item</span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {cart.map((c) => (
                        <div
                          key={c.item.id}
                          className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800/80 text-xs font-mono"
                        >
                          <div className="truncate pr-2">
                            <span className="text-stone-200 font-medium block truncate">
                              {c.qty}x {c.item.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Catatan: {c.note}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-stone-200 font-bold">
                              Rp {(c.item.price * c.qty).toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(c.item.id)}
                              className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {cart.length === 0 && (
                        <div className="p-4 text-center text-stone-500 text-xs font-mono">
                          Keranjang kosong. Klik menu di atas untuk menambah pesanan.
                        </div>
                      )}
                    </div>

                    {/* PRINT ACTION BUTTON */}
                    <button
                      type="button"
                      onClick={handleSimulatePrintReceipt}
                      disabled={cart.length === 0}
                      className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10 active:scale-[0.98]"
                    >
                      <Printer size={15} />
                      <span>Cetak Struk & Kirim Tiket Dapur (KDS)</span>
                    </button>
                  </div>
                </div>

                {/* 2. REALISTIC PHYSICAL THERMAL RECEIPT (COL 4) */}
                <div className="lg:col-span-4 flex flex-col items-center">
                  <div className="w-full max-w-[320px]">
                    {/* Thermal Printer Hardware Slot */}
                    <div className="h-4 bg-stone-900 rounded-t-lg border-t border-x border-stone-700 relative flex items-center justify-center">
                      <div className="w-36 h-1 bg-stone-950 rounded-full" />
                    </div>

                    {/* THE PAPER RECEIPT WITH SERRATED EDGES */}
                    <div
                      key={lastPrintedAt}
                      className={`receipt-paper receipt-tear-bottom p-5 text-stone-900 space-y-3 font-mono text-xs shadow-2xl transition-all ${
                        isReceiptPrinting ? 'animate-receipt-feed' : ''
                      }`}
                    >
                      {/* HEADER */}
                      <div className="text-center border-b border-dashed border-stone-400 pb-3 space-y-0.5">
                        <div className="font-extrabold text-sm tracking-wider uppercase">
                          NUSANTARA COFFEE & EATERY
                        </div>
                        <div className="text-[10px] text-stone-600">
                          Jl. Senopati Raya No. 42, Jakarta Selatan
                        </div>
                        <div className="text-[10px] text-stone-600">
                          NPWP / PB1: 01.345.678.9-012.000
                        </div>
                      </div>

                      {/* META */}
                      <div className="text-[10px] space-y-0.5 border-b border-dashed border-stone-400 pb-2">
                        <div className="flex justify-between">
                          <span>No. Nota: #{orderNumber}</span>
                          <span className="font-bold">{selectedTable}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Waktu: {lastPrintedAt}</span>
                          <span>Kasir: Rian S.</span>
                        </div>
                      </div>

                      {/* ITEMS */}
                      <div className="space-y-1.5 border-b border-dashed border-stone-400 pb-3 text-[11px]">
                        {cart.map((c) => (
                          <div key={c.item.id}>
                            <div className="flex justify-between font-bold">
                              <span>{c.qty}x {c.item.name}</span>
                              <span>Rp {(c.item.price * c.qty).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-[9px] text-stone-600 pl-2">
                              - {c.note}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* TOTALS */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between text-stone-700">
                          <span>Subtotal:</span>
                          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-stone-700">
                          <span>PB1 Resto (10%):</span>
                          <span>Rp {taxPb1.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-stone-800">
                          <span>TOTAL:</span>
                          <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-600 pt-0.5">
                          <span>Metode Pembayaran:</span>
                          <span className="font-bold">QRIS DINAMIS (LUNAS)</span>
                        </div>
                      </div>

                      {/* FOOTER & BARCODE */}
                      <div className="text-center pt-2 space-y-1 border-t border-dashed border-stone-400">
                        <div className="text-[9px] text-stone-600">
                          Terima kasih atas kunjungan Anda!
                        </div>
                        <div className="text-[8px] text-stone-500 font-mono tracking-widest">
                          ||||| |||||| |||| | ||||||| ||||
                        </div>
                        <div className="text-[8px] text-stone-400 font-mono">
                          POWERED BY NUSANTARA F&B OS
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. LIVE KDS & BOM STOK COUNTER (COL 3) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* KDS MINI TICKETS */}
                  <div className="p-4 rounded-xl border border-stone-800 bg-[#191714] space-y-3 font-mono">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <Flame size={14} />
                        <span>Layar KDS Dapur</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">LIVE DING</span>
                    </div>

                    <div className="space-y-2">
                      {kdsOrders.map((kds) => (
                        <div
                          key={kds.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            kds.status === 'cooking'
                              ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                              : 'bg-stone-900 border-stone-800 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold border-b border-stone-800 pb-1">
                            <span>#{kds.id} · {kds.table}</span>
                            <span className="text-amber-400 font-mono">{kds.elapsed} lalu</span>
                          </div>
                          <div className="text-[11px] text-stone-300 space-y-0.5 pt-0.5">
                            {kds.items.map((it, idx) => (
                              <div key={idx} className="truncate">• {it}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LIVE INVENTORY GRAMS DEDUCTED */}
                  <div className="p-4 rounded-xl border border-stone-800 bg-[#191714] space-y-3 font-mono">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
                        <Package size={14} className="text-amber-400" />
                        <span>Potong Stok Resep (BOM)</span>
                      </div>
                      <span className="text-[10px] text-stone-400">OTOMATIS</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-stone-300">
                        <span>Biji Kopi Arabika:</span>
                        <span className="font-bold text-rose-400">-{inventoryDeductions.beans} gram</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-300">
                        <span>Susu UHT Fresh:</span>
                        <span className="font-bold text-rose-400">-{inventoryDeductions.milk} ml</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-300">
                        <span>Gula Aren Cair:</span>
                        <span className="font-bold text-rose-400">-{inventoryDeductions.syrup} ml</span>
                      </div>
                      <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-xs">
                        <span className="text-stone-400">HPP Bahan Terkunci:</span>
                        <span className="font-bold text-emerald-400">
                          Rp {inventoryDeductions.cogs.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. REAL F&B STRESS TESTS (3 ANCAMAN NYATA DI LANTAI RESTORAN)  */}
      {/* ------------------------------------------------------------- */}
      <section id="masalah" className="py-20 px-4 sm:px-8 bg-[#12100e] border-b border-stone-800">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              KENYATAAN DI LANTAI BISNIS KULINER
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
              3 Penyebab Utama Cafe & Restoran Ramai Tapi Pemilik Tidak Tahu Untungnya Kemana.
            </h2>
            <p className="text-xs sm:text-base text-stone-400 leading-relaxed">
              Software kasir cloud biasa dibuat untuk toko ritel umum, bukan untuk kecepatan dan kekacauan jam makan siang di restoran.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ANCAMAN 1: OFFLINE CRASH */}
            <div className="p-6 rounded-xl border border-stone-800 bg-[#181614] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center">
                  <WifiOff size={20} />
                </div>
                <h3 className="font-bold text-base text-stone-100 leading-snug">
                  1. WiFi Ruko Mati di Jam Sibuk (Jam 12:45)
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Software cloud murni langsung memunculkan loading spinner berputar tiada akhir saat koneksi internet drop. Antrean kasir mengular, pelanggan marah, dan pesanan terpaksa dicatat di kertas manual yang rawan hilang.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-800/80 font-mono text-[11px] text-amber-300 space-y-1">
                <div className="font-bold text-stone-200">Solusi Nusantara OS:</div>
                <div className="text-stone-400">
                  Arsitektur Offline-First (IndexedDB). Transaksi tetap tercetak 0.2 detik tanpa jeda dan otomatis tersinkron saat internet pulih.
                </div>
              </div>
            </div>

            {/* ANCAMAN 2: SUSUT BAHAN BAKU TANPA JEJAK */}
            <div className="p-6 rounded-xl border border-stone-800 bg-[#181614] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center">
                  <UtensilsCrossed size={20} />
                </div>
                <h3 className="font-bold text-base text-stone-100 leading-snug">
                  2. Bahan Baku Bocor & Resep Tidak Konsisten
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Kasir biasa hanya mencatat menu jadi, bukan bahan bakunya. Barista menuang 35ml sirup bukan 20ml, susu terbuang basi, dan daging susut tanpa ada yang tahu sampai akhir bulan saat modal kerja habis.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-800/80 font-mono text-[11px] text-amber-300 space-y-1">
                <div className="font-bold text-stone-200">Solusi Nusantara OS:</div>
                <div className="text-stone-400">
                  Bill of Materials (BOM) presisi per gram. Deteksi selisih fisik vs sistem dalam 1 kali Stock Opname, selamatkan jutaan rupiah per bulan.
                </div>
              </div>
            </div>

            {/* ANCAMAN 3: KERTAS DAPUR KUSUT & PESANAN TERSELIP */}
            <div className="p-6 rounded-xl border border-stone-800 bg-[#181614] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <Flame size={20} />
                </div>
                <h3 className="font-bold text-base text-stone-100 leading-snug">
                  3. Kertas Bon Dapur Basah & Salah Meja
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Kertas printer dapur terselip di bawah wajan, terciprat kuah, atau hilang tertiup angin. Pelanggan menunggu 40 menit untuk menu yang belum dimasak, reputasi bintang 5 Google Maps Anda langsung hancur.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-800/80 font-mono text-[11px] text-amber-300 space-y-1">
                <div className="font-bold text-stone-200">Solusi Nusantara OS:</div>
                <div className="text-stone-400">
                  Kitchen Display System (KDS) digital interaktif dengan SLA timer warna (Hijau, Kuning, Merah) tanpa kertas kusut.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. DEEP DIVE: RECIPE BILL OF MATERIALS (BOM) & HPP PRESISI     */}
      {/* ------------------------------------------------------------- */}
      <section id="resep" className="py-20 px-4 sm:px-8 bg-[#0e0d0c] border-b border-stone-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              PRESISI BILL OF MATERIALS (BOM)
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
              Ketahui Biaya Modal Setiap Cup dan Porsi Hingga Satuan Rupiah Terkecil.
            </h2>
            <p className="text-xs sm:text-base text-stone-400">
              Contoh riil kalkulasi bahan baku pada 1 cup Iced Palm Sugar Latte di outlet Anda:
            </p>
          </div>

          <div className="rounded-xl border border-stone-800 bg-[#161412] p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <h3 className="font-bold text-lg text-stone-100 flex items-center gap-2">
                  <Coffee size={18} className="text-amber-400" />
                  <span>Resep Master: Iced Palm Sugar Latte (12oz)</span>
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  Kategori: Signature Coffee · Target Margin Kotor: &gt; 65%
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">HARGA JUAL MENU</span>
                  <span className="font-bold text-stone-100 text-sm">Rp 28.000</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">TOTAL HPP BAHAN</span>
                  <span className="font-bold text-amber-400 text-sm">Rp 9.230</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800">
                  <span className="text-emerald-400 block text-[10px]">MARGIN KOTOR</span>
                  <span className="font-bold text-emerald-300 text-sm">67.0%</span>
                </div>
              </div>
            </div>

            {/* RECIPE TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[550px]">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Komponen Bahan Baku</th>
                    <th className="py-2.5 px-3">Takaran Standar (SOP)</th>
                    <th className="py-2.5 px-3">Harga Beli Supplier</th>
                    <th className="py-2.5 px-3 text-right">Biaya per Porsi</th>
                    <th className="py-2.5 px-3 text-center">Status Pemotongan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300 text-xs">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-stone-100 font-sans">
                      Biji Kopi Arabika House Blend (Gayo + Kintamani)
                    </td>
                    <td className="py-3 px-3">18.0 gram</td>
                    <td className="py-3 px-3">Rp 220.000 / kg</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-100">Rp 3.960</td>
                    <td className="py-3 px-3 text-center text-emerald-400">Auto Deduk</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-stone-100 font-sans">
                      Fresh Milk Pasteurisasi (Diamond)
                    </td>
                    <td className="py-3 px-3">160.0 ml</td>
                    <td className="py-3 px-3">Rp 22.000 / liter</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-100">Rp 3.520</td>
                    <td className="py-3 px-3 text-center text-emerald-400">Auto Deduk</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-stone-100 font-sans">
                      Gula Aren Cair Organik Premium
                    </td>
                    <td className="py-3 px-3">25.0 ml</td>
                    <td className="py-3 px-3">Rp 36.000 / liter</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-100">Rp 900</td>
                    <td className="py-3 px-3 text-center text-emerald-400">Auto Deduk</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-stone-100 font-sans">
                      Packaging: Cup 12oz PET + Lid Strawless
                    </td>
                    <td className="py-3 px-3">1.0 set</td>
                    <td className="py-3 px-3">Rp 850 / pcs</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-100">Rp 850</td>
                    <td className="py-3 px-3 text-center text-emerald-400">Auto Deduk</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-400 leading-relaxed font-mono flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-200">Fakta Pengendalian Food Cost:</span> Jika seorang barista tanpa sengaja menuang 35ml sirup dan 190ml susu per cup, dalam 200 cup per hari Anda kehilangan profit sebesar <span className="text-amber-300 font-bold">Rp 6.300.000 per bulan</span> tanpa ada catatan sama sekali di sistem kasir biasa. Nusantara OS menutup celah kebocoran ini secara tuntas.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERACTIVE ROI & PROFIT PRESERVATION CALCULATOR           */}
      {/* ------------------------------------------------------------- */}
      <section id="kalkulator" className="py-20 px-4 sm:px-8 bg-[#12100e] border-b border-stone-800">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              SIMULASI NILAI FINANSIAL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
              Hitung Potensi Kebocoran yang Berhasil Diselamatkan Setiap Bulan.
            </h2>
            <p className="text-xs sm:text-base text-stone-400 max-w-xl mx-auto">
              Geser nilai parameter di bawah sesuai skala operasional bisnis kedai atau restoran Anda saat ini.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#181614] grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xl">
            {/* SLIDERS INPUT */}
            <div className="space-y-6">
              {/* SLIDER 1: OUTLETS */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300 font-medium">Jumlah Outlet / Cabang:</span>
                  <span className="font-bold text-amber-400 text-sm">{outletsCount} Cabang</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={outletsCount}
                  onChange={(e) => setOutletsCount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* SLIDER 2: ORDERS PER DAY */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300 font-medium">Rata-rata Transaksi per Hari / Cabang:</span>
                  <span className="font-bold text-amber-400 text-sm">{dailyOrdersPerOutlet} Nota</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="10"
                  value={dailyOrdersPerOutlet}
                  onChange={(e) => setDailyOrdersPerOutlet(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* SLIDER 3: AVG SPENT */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300 font-medium">Rata-rata Nilai per Nota (Average Ticket):</span>
                  <span className="font-bold text-amber-400 text-sm">
                    Rp {avgTicketPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="150000"
                  step="5000"
                  value={avgTicketPrice}
                  onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 text-[11px] text-stone-500 font-mono">
                *Estimasi konservatif berdasarkan data rata-rata audit F&B: 4.8% penghematan food cost & 20 jam kerja rekap staff per cabang.
              </div>
            </div>

            {/* RESULTS CARD */}
            <div className="p-6 rounded-xl border border-stone-800 bg-[#13110f] space-y-5 font-mono shadow-inner">
              <div className="border-b border-stone-800 pb-3">
                <span className="text-[11px] text-stone-400 uppercase tracking-wide block">
                  POTENSI UANG YANG DISELAMATKAN
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1">
                  Rp {Math.round(roiCalculations.totalMonthlyValue).toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-stone-400 font-sans"> / bulan</span>
                </div>
                <span className="text-xs text-stone-400 mt-1 block">
                  Setara Rp {Math.round(roiCalculations.annualSavings).toLocaleString('id-ID')} per tahun
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Pencegahan Susut Bahan Baku:</span>
                  <span className="font-bold text-stone-100">
                    Rp {Math.round(roiCalculations.monthlyFoodCostSavings).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between text-stone-300">
                  <span>Efisiensi Jam Kerja Rekon Staf:</span>
                  <span className="font-bold text-stone-100">
                    Rp {Math.round(roiCalculations.monthlyAdminTimeSaved).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between text-stone-400 pt-1 border-t border-stone-800/80 text-[11px]">
                  <span>Estimasi Omzet Kotor Bulanan:</span>
                  <span>Rp {Math.round(roiCalculations.monthlyGrossRevenue).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <a
                href="#daftar"
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10 active:scale-[0.98] font-sans"
              >
                <span>Kunci Penghematan Ini Sekarang</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. TRANSPARENT PRICING PLANS (STRICT NO-PILL BADGE)           */}
      {/* ------------------------------------------------------------- */}
      <section id="harga" className="py-20 px-4 sm:px-8 bg-[#0e0d0c] border-b border-stone-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              PAKET INVESTASI SAAS TRANSPARAN
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
              Biaya Tetap Bulanan. 0% Potongan Komisi Transaksi Kasir.
            </h2>
            <p className="text-xs sm:text-base text-stone-400 max-w-xl mx-auto">
              Tidak ada bagi hasil persentase omzet. Anda pegang 100% laba resto Anda sendiri.
            </p>

            {/* BILLING CYCLE SELECTOR */}
            <div className="inline-flex items-center p-1 rounded-lg bg-stone-900 border border-stone-800 mt-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annually'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Tahunan</span>
                <span className="text-[10px] bg-stone-950 text-amber-300 font-bold px-1.5 py-0.2 rounded">
                  Hemat 2 Bulan
                </span>
              </button>
            </div>
          </div>

          {/* 3 TIERS (CLEAN, NO AI CAPSULES) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* TIER 1: KEDAI STARTER */}
            <div className="p-6 rounded-xl border border-stone-800 bg-[#161412] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-stone-400 uppercase font-semibold">
                    UNTUK COFFEE SHOP 1 OUTLET
                  </span>
                  <h3 className="text-xl font-bold text-stone-100 mt-1">Kedai Starter</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Solusi kasir kilat dan cetak thermal untuk kedai kopi tunggal atau cloud kitchen.
                  </p>
                </div>

                <div className="font-mono pt-2">
                  <div className="text-2xl sm:text-3xl font-extrabold text-stone-100">
                    {billingCycle === 'annually' ? 'Rp 249.000' : 'Rp 299.000'}
                    <span className="text-xs font-normal text-stone-400 font-sans"> / bulan</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-sans block mt-0.5">
                    {billingCycle === 'annually' ? 'Ditagihkan Rp 2.990.000 / tahun' : 'Bebas batalkan kapan saja'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-stone-800 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>1 Cabang & Hingga 2 Terminal Kasir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Mesin Kasir Offline-First (Anti WiFi Mati)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Cetak Struk Thermal Bluetooth/USB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Manajemen Stok Bahan Dasar</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <span className="w-3.5 h-0.5 bg-stone-700 shrink-0" />
                    <span>Belum termasuk KDS Layar Dapur</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'starter' }))}
                className="w-full py-2.5 rounded-lg border border-stone-700 hover:border-stone-500 bg-stone-900 text-stone-200 hover:text-white text-xs font-semibold text-center transition-colors block"
              >
                Pilih Starter
              </a>
            </div>

            {/* TIER 2: RESTO PRO (FEATURED) */}
            <div className="p-6 rounded-xl border-2 border-amber-500 bg-[#1a1714] space-y-6 flex flex-col justify-between shadow-2xl relative">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase font-semibold">
                    SOLUSI RESTORAN & MULTI-DIVISI
                  </span>
                  <h3 className="text-xl font-bold text-stone-100 mt-1">Resto Professional</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Untuk restoran dine-in dengan meja, dapur masak, dan resep bahan baku gramatur.
                  </p>
                </div>

                <div className="font-mono pt-2">
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                    {billingCycle === 'annually' ? 'Rp 599.000' : 'Rp 699.000'}
                    <span className="text-xs font-normal text-stone-400 font-sans"> / bulan</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-sans block mt-0.5">
                    {billingCycle === 'annually' ? 'Ditagihkan Rp 7.188.000 / tahun' : 'Bebas batalkan kapan saja'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-stone-800 text-xs text-stone-200">
                  <div className="flex items-center gap-2 font-bold text-stone-100">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Hingga 3 Cabang & Kasir Tanpa Batas</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-stone-100">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Kitchen Display System (KDS) Interaktif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Resep Bill of Materials (BOM) Gramatur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Laporan Laba Rugi Resmi SAK EMKM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Transfer Stok Antar Gudang Cabang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Ekspor Excel & PDF 1-Klik Siap Bank</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'pro' }))}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs text-center transition-all shadow-md active:scale-[0.98] block"
              >
                Mulai Uji Coba Pro 14 Hari
              </a>
            </div>

            {/* TIER 3: MULTI-CABANG ENTERPRISE */}
            <div className="p-6 rounded-xl border border-stone-800 bg-[#161412] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-stone-400 uppercase font-semibold">
                    FRANCHISE & CHAIN HQ
                  </span>
                  <h3 className="text-xl font-bold text-stone-100 mt-1">Enterprise HQ</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Untuk jaringan gerai F&B dengan dapur sentral (central kitchen) dan manajemen fleet.
                  </p>
                </div>

                <div className="font-mono pt-2">
                  <div className="text-2xl sm:text-3xl font-extrabold text-stone-100">
                    {billingCycle === 'annually' ? 'Rp 1.190.000' : 'Rp 1.390.000'}
                    <span className="text-xs font-normal text-stone-400 font-sans"> / bulan</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-sans block mt-0.5">
                    Mencakup 10 cabang (tambah cabang +Rp 99k/cabang)
                  </span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-stone-800 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Seluruh Fitur Paket Pro Tanpa Batas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Central Kitchen & Purchasing Order PO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Fleet Ops Hub Remote Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Integrasi API Jurnal / ERP Kustom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" />
                    <span>Dukungan Tim Teknis Prioritas 24/7</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'enterprise' }))}
                className="w-full py-2.5 rounded-lg border border-stone-700 hover:border-stone-500 bg-stone-900 text-stone-200 hover:text-white text-xs font-semibold text-center transition-colors block"
              >
                Pilih Enterprise
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. REAL OPERATIONAL FAQ (AUTHENTIC QUESTIONS)                  */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-20 px-4 sm:px-8 bg-[#12100e] border-b border-stone-800">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              JAWABAN OPERASIONAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              Pertanyaan yang Sering Diajukan Pemilik Cafe & Restoran.
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-stone-800 bg-[#161412] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-stone-100 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-stone-400 transition-transform ${
                        isOpen ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-stone-400 leading-relaxed border-t border-stone-800/80 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. ONBOARDING REGISTRATION MODAL / SECTION                     */}
      {/* ------------------------------------------------------------- */}
      <section id="daftar" className="py-20 px-4 sm:px-8 bg-[#0e0d0c] border-b border-stone-800">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              MULAI SEKARANG
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
              Buktikan Sendiri di Toko Anda Selama 14 Hari Bebas Risiko.
            </h2>
            <p className="text-xs sm:text-base text-stone-400">
              Tanpa kartu kredit. Tim kami siap membantu import menu lama Anda langsung dari Excel.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#161412] shadow-2xl">
            {submittedSuccess ? (
              <div className="py-10 text-center space-y-4 font-mono">
                <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h3 className="text-xl font-bold text-stone-100 font-sans">
                  Pendaftaran Uji Coba Berhasil!
                </h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                  Akun toko <span className="text-stone-200 font-bold">{regForm.businessName}</span> telah disiapkan. Tim operasional kami akan segera menghubungi WhatsApp Anda ({regForm.phone}) untuk mengirimkan kredensial masuk dan panduan setup printer.
                </p>
                <div className="pt-3">
                  <a
                    href={LIVE_DEMO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors font-sans"
                  >
                    <span>Masuk ke Demo Kasir Sekarang</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-stone-300 font-semibold block">
                      Nama Brand / Resto:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kopi Nusantara"
                      value={regForm.businessName}
                      onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-stone-300 font-semibold block">
                      Nama Pemilik / Manajer:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={regForm.ownerName}
                      onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-stone-300 font-semibold block">
                      Nomor WhatsApp Aktif:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-stone-300 font-semibold block">
                      Kota Lokasi Gerai:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta Selatan, Surabaya, Bali"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-mono text-stone-300 font-semibold block">
                    Pilihan Paket Uji Coba:
                  </label>
                  <select
                    value={regForm.tier}
                    onChange={(e) => setRegForm({ ...regForm, tier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="starter">Kedai Starter (1 Cabang - Rp 299k/bln)</option>
                    <option value="pro">Resto Pro + KDS + Resep BOM (Paling Populer - Rp 699k/bln)</option>
                    <option value="enterprise">Enterprise Multi-Cabang + Central Kitchen (Rp 1.390k/bln)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-[0.98] mt-3"
                >
                  {isSubmitting ? (
                    <span>Menyiapkan Akun Uji Coba...</span>
                  ) : (
                    <>
                      <span>Mulai Akses 14 Hari Sekarang</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. AUTHENTIC OPERATIONAL FOOTER                              */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-14 px-4 sm:px-8 bg-[#090807] text-stone-400 text-xs font-mono border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10 border-b border-stone-800 pb-10">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-stone-900 border border-stone-700 text-amber-400 flex items-center justify-center font-bold text-xs">
                N
              </div>
              <span className="font-bold text-sm text-stone-100 font-sans tracking-tight">
                Nusantara F&B OS
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px] font-sans">
              Sistem Operasi F&B Enterprise untuk Resto & Cafe Modern di Indonesia. Terintegrasi POS, KDS Dapur, HPP Resep Dinamis, dan Standar Akuntansi SAK EMKM Resmi.
            </p>
            <div className="text-[10px] text-stone-500">
              Bagian dari ekosistem teknologi Hallo Group HQ.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-[11px]">
            <div className="space-y-2">
              <span className="font-bold text-stone-200 block uppercase">
                PRODUK
              </span>
              <ul className="space-y-1.5 text-stone-400 font-sans">
                <li><a href="#simulator" className="hover:text-stone-100">Mesin Kasir & Struk</a></li>
                <li><a href="#simulator" className="hover:text-stone-100">Kitchen Display KDS</a></li>
                <li><a href="#resep" className="hover:text-stone-100">Resep & BOM Gramatur</a></li>
                <li><a href="#kalkulator" className="hover:text-stone-100">Kalkulator Penghematan</a></li>
                <li>
                  <a
                    href={LIVE_DEMO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-amber-400 flex items-center gap-1 font-mono text-[10px]"
                  >
                    <span>Live Demo Kasir</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-stone-200 block uppercase">
                OPERASIONAL
              </span>
              <ul className="space-y-1.5 text-stone-400 font-sans">
                <li><a href="#harga" className="hover:text-stone-100">Paket Langganan</a></li>
                <li><a href="#masalah" className="hover:text-stone-100">3 Ancaman Resto</a></li>
                <li><a href="#faq" className="hover:text-stone-100">Tanya Jawab (FAQ)</a></li>
                <li>
                  <a
                    href={OPS_CONSOLE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-amber-400 flex items-center gap-1 font-mono text-[10px]"
                  >
                    <span>Fleet Ops Hub</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-stone-200 block uppercase">
                KONTAK OPERASI
              </span>
              <ul className="space-y-1.5 text-stone-400">
                <li>WhatsApp: 0812-9900-8899</li>
                <li>Email: ops@hallogroup.id</li>
                <li>Senopati, Jakarta Selatan</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>© 2026 Hallo Group HQ. Seluruh hak cipta dilindungi.</div>
          <div className="flex items-center gap-4">
            <span>SLA Uptime 99.98%</span>
            <span>·</span>
            <span>Privasi Data Resto Terenkripsi</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
