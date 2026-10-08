'use client'

import React, { useState, useMemo } from 'react'
import {
  Store,
  Tablet,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  WifiOff,
  Receipt,
  TrendingUp,
  BarChart3,
  Layers,
  Clock,
  Sliders,
  HelpCircle,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Flame,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  Users,
  Building2,
  Check,
  Star,
  RefreshCw,
  Phone,
  Mail,
  User,
  Coffee,
  DollarSign,
} from 'lucide-react'

// Live Demo Store Link
const LIVE_DEMO_URL = 'https://fnb-erp.vercel.app'
const OPS_CONSOLE_URL = 'https://fnb-ops-delta.vercel.app'

export default function SaaSLandingPage() {
  // Navigation & Interactive states
  const [activeDemoTab, setActiveDemoTab] = useState<'pos' | 'kds' | 'inventory' | 'finance'>('pos')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  
  // Interactive ROI Calculator State
  const [outletsCount, setOutletsCount] = useState<number>(2)
  const [dailyOrdersPerOutlet, setDailyOrdersPerOutlet] = useState<number>(180)
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(45000)

  // Registration Form State
  const [regForm, setRegForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    tier: 'pro',
    city: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Interactive Live POS Simulator State (inside Tab 1)
  const [demoCart, setDemoCart] = useState<Array<{ name: string; price: number; qty: number }>>([
    { name: 'Kopi Susu Gula Aren 250ml', price: 24000, qty: 2 },
    { name: 'Croissant Butter Almond', price: 32000, qty: 1 },
  ])
  const [demoPaymentDone, setDemoPaymentDone] = useState(false)

  // ROI Calculations
  const roiCalculations = useMemo(() => {
    const monthlyGrossRevenue = outletsCount * dailyOrdersPerOutlet * avgTicketPrice * 30
    // Food cost baseline ~38%
    const monthlyFoodCost = monthlyGrossRevenue * 0.38
    // Savings from strict gramatur recipe tracking & waste prevention ~4.5%
    const monthlyFoodCostSavings = monthlyFoodCost * 0.045
    // Labor & bookkeeping hours saved ~18 hours per branch x Rp 50.000/hr
    const monthlyAdminTimeSaved = outletsCount * 18 * 50000
    // Total monthly financial upside
    const totalMonthlyValue = monthlyFoodCostSavings + monthlyAdminTimeSaved

    return {
      monthlyGrossRevenue,
      monthlyFoodCostSavings,
      monthlyAdminTimeSaved,
      totalMonthlyValue,
      annualSavings: totalMonthlyValue * 12,
    }
  }, [outletsCount, dailyOrdersPerOutlet, avgTicketPrice])

  function handleDemoAddToCart(item: { name: string; price: number }) {
    setDemoPaymentDone(false)
    setDemoCart((prev) => {
      const existing = prev.find((i) => i.name === item.name)
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function handleDemoClearCart() {
    setDemoCart([])
    setDemoPaymentDone(false)
  }

  function handleDemoPay() {
    setDemoPaymentDone(true)
  }

  const demoCartTotal = useMemo(() => {
    return demoCart.reduce((sum, i) => sum + i.price * i.qty, 0)
  }, [demoCart])

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!regForm.businessName || !regForm.ownerName || !regForm.phone) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmittedSuccess(true)
    }, 900)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP ANNOUNCEMENT BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-zinc-950 text-zinc-300 text-[11px] py-2 px-4 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-white font-semibold">Rilis 2.5:</span>
            <span className="truncate text-zinc-400">
              Offline-First Engine, KDS Otomatis 0-Lag & Standar SAK EMKM Laba Rugi Resmi.
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0 text-zinc-400">
            <span>Uji Coba 14 Hari Tanpa Kartu Kredit</span>
            <span>·</span>
            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-white hover:underline flex items-center gap-1"
            >
              <span>Live Demo Kasir</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STICKY GLOBAL NAVIGATION                                   */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* BRAND LOGO */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm transition-transform group-hover:scale-95">
              HG
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-zinc-950 block">
                Nusantara F&B OS
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block">
                By Hallo Group HQ
              </span>
            </div>
          </a>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600">
            <a href="#fitur" className="hover:text-zinc-950 transition-colors">
              Pilar Fitur
            </a>
            <a href="#demo" className="hover:text-zinc-950 transition-colors">
              Live Showcase
            </a>
            <a href="#kalkulator" className="hover:text-zinc-950 transition-colors">
              Kalkulator HPP
            </a>
            <a href="#harga" className="hover:text-zinc-950 transition-colors">
              Paket Harga
            </a>
            <a href="#faq" className="hover:text-zinc-950 transition-colors">
              FAQ
            </a>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2.5">
            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
            >
              <span>Coba Demo Kasir</span>
              <ExternalLink size={12} className="text-zinc-400" />
            </a>

            <a
              href="#daftar"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Daftar Gratis</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-14 pb-16 px-4 sm:px-6 relative overflow-hidden border-b border-zinc-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* CATEGORY PILL */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium font-mono">
            <Sparkles size={12} className="text-amber-600" />
            <span>Satu Platform Terpadu untuk Restoran, Cafe, & Multi-Cabang</span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.15]">
            Satu Sistem Kendali untuk Kasir, Dapur, Stok Resep, dan Keuangan Resto.
          </h1>

          {/* SUBHEADLINE */}
          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Hentikan pemborosan 4 software terpisah. Nusantara F&B OS menyatukan kasir POS kilat, Kitchen Display System (KDS), pemotongan HPP otomatis per gram bahan, dan laporan laba rugi SAK EMKM siap bank.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#daftar"
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Mulai Uji Coba 14 Hari Gratis</span>
              <ArrowRight size={15} />
            </a>

            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Store size={15} className="text-zinc-500" />
              <span>Buka Live Demo Toko (Tanpa Daftar)</span>
              <ExternalLink size={13} className="text-zinc-400" />
            </a>
          </div>

          {/* REAL VALUE PILLARS (DATA STRIP) */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left font-mono">
            <div className="p-3 rounded-lg border border-zinc-200 bg-white">
              <span className="text-[10px] text-zinc-400 block">KECEPATAN CETAK</span>
              <span className="font-bold text-sm text-zinc-900 block mt-0.5">0.2 Detik</span>
              <span className="text-[10px] text-zinc-500 block font-sans">Printer thermal 58/80mm</span>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-white">
              <span className="text-[10px] text-zinc-400 block">OFFLINE-FIRST</span>
              <span className="font-bold text-sm text-emerald-700 block mt-0.5">100% Kebal RTO</span>
              <span className="text-[10px] text-zinc-500 block font-sans">Tetap jalan saat wifi mati</span>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-white">
              <span className="text-[10px] text-zinc-400 block">HPP RESEP AKURAT</span>
              <span className="font-bold text-sm text-zinc-900 block mt-0.5">Per Gramatur</span>
              <span className="text-[10px] text-zinc-500 block font-sans">Deteksi stok minus instan</span>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-white">
              <span className="text-[10px] text-zinc-400 block">STANDAR AKUNTANSI</span>
              <span className="font-bold text-sm text-zinc-900 block mt-0.5">SAK EMKM</span>
              <span className="text-[10px] text-zinc-500 block font-sans">Neraca & laba rugi resmi</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. REAL F&B PAIN POINTS SOLVED (NO MORE LOSSES)               */}
      {/* ------------------------------------------------------------- */}
      <section id="fitur" className="py-16 px-4 sm:px-6 bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Kenyataan di Lantai Bisnis Resto
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Selesaikan 4 Kebocoran Terbesar yang Menggerus Profit Cafe & Restoran Anda.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Dibangun dari pengalaman nyata pemilik F&B menghadapi meja hang, selisih bahan baku, dan kasir yang kewalahan saat jam makan siang ramai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: OFFLINE DROP */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <WifiOff size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">
                1. Wifi Ruko Mati? Kasir Tetap Mencetak Struk Tanpa Macet.
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Software cloud biasa langsung memunculkan loading spinner saat koneksi internet drop di jam sibuk. Mesin kami menyimpan data lokal via IndexedDB: pesanan masuk, struk tercetak, dan antrean otomatis tersinkronisasi saat sinyal kembali online.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} />
                <span>Zero Downtime · Offline Transaction Queue Built-In</span>
              </div>
            </div>

            {/* CARD 2: RAW MATERIAL THEFT / MISSING STOCK */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <UtensilsCrossed size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">
                2. Pemotongan Gramatur Resep Presisi & Deteksi Stok Minus.
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Tiap 1 porsi Cappuccino terjual langsung memotong 18g espresso beans dan 150ml fresh milk dari master stok. Sistem langsung menandai *Alert Stok Minus* jika barista menjual item tanpa ada pencatatan barang masuk dari supplier.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} />
                <span>HPP Dinamis Real-Time · Cegah Pembengkakan Food Cost</span>
              </div>
            </div>

            {/* CARD 3: KITCHEN COMMUNICATION CHAOS */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <Flame size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">
                3. Kitchen Display System (KDS): Tiket Pesanan Anti-Terselip.
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Gantikan kertas bon dapur yang mudah basah dan hilang. Layar dapur interaktif mengelompokkan pesanan per meja, menyortir urutan masak, dan memberi peringatan warna merah jika sajian melebihi batas target waktu saji 15 menit.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} />
                <span>SLA Waktu Saji Terpantau · Rute Masak Dapur & Bar Terpisah</span>
              </div>
            </div>

            {/* CARD 4: SAK EMKM ACCOUNTING */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <FileSpreadsheet size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-950">
                4. Pembukuan SAK EMKM Siap Bank: Laba Bersih Aktual Setiap Hari.
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Bukan cuma ringkasan omzet kasir (GMV). Dapatkan laporan Laba Rugi resmi yang memperhitungkan HPP aktual bahan baku, beban sewa, gaji staf, depresiasi alat kopi, hingga rekonsiliasi kas laci vs saldo rekening bank.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} />
                <span>Ekspor Excel & PDF 1-Klik · Standar Akuntansi Resmi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. LIVE INTERACTIVE PRODUCT SHOWCASE (TABBED WORKBENCH)       */}
      {/* ------------------------------------------------------------- */}
      <section id="demo" className="py-16 px-4 sm:px-6 bg-[#FAFAFA] border-b border-zinc-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Live Interactive Showcase
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Lihat dan Rasakan Sendiri Cara Kerja Sistemnya.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Uji coba simulasi live di bawah ini atau klik buka aplikasi asli untuk mencoba langsung di tablet atau laptop kamu.
            </p>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-2">
            {[
              { id: 'pos', label: '1. Kasir Kilat & Meja', icon: Tablet },
              { id: 'kds', label: '2. Kitchen Display (KDS)', icon: Flame },
              { id: 'inventory', label: '3. Resep & HPP Bahan', icon: UtensilsCrossed },
              { id: 'finance', label: '4. Laba Rugi SAK EMKM', icon: BarChart3 },
            ].map((t) => {
              const Icon = t.icon
              const isSel = activeDemoTab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveDemoTab(t.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isSel
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB 1: POS INTERACTIVE PREVIEW */}
          {activeDemoTab === 'pos' && (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-3">
              {/* MENU SELECTOR */}
              <div className="p-4 border-b lg:border-b-0 lg:border-r border-zinc-200 lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                    <Coffee size={14} className="text-zinc-600" />
                    <span>Pilih Menu Demo (Klik untuk Tambah ke Keranjang)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">CABANG UTAMA</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'Kopi Susu Gula Aren 250ml', price: 24000, cat: 'Coffee' },
                    { name: 'Americano Double Shot', price: 22000, cat: 'Coffee' },
                    { name: 'Matcha Latte Oatmilk', price: 32000, cat: 'Non-Coffee' },
                    { name: 'Croissant Butter Almond', price: 32000, cat: 'Bakery' },
                    { name: 'Nasi Goreng Wagyu', price: 58000, cat: 'Kitchen' },
                    { name: 'Spaghetti Aglio Olio', price: 48000, cat: 'Kitchen' },
                  ].map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleDemoAddToCart(m)}
                      className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/80 text-left transition-colors cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[9px] font-mono text-zinc-400 block uppercase">
                          {m.cat}
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 leading-tight block mt-0.5 group-hover:text-zinc-950">
                          {m.name}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold text-zinc-800">
                        Rp {m.price.toLocaleString('id-ID')}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-100">
                  <span>⚡️ Shortcut Meja Dine-in: M1 s/d M12</span>
                  <span className="text-emerald-700 font-semibold">Ready Thermal Printer 80mm</span>
                </div>
              </div>

              {/* LIVE BILLING & CHECKOUT BOX */}
              <div className="p-4 bg-zinc-50/70 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Receipt size={14} className="text-zinc-600" />
                      <span>Tagihan Meja 04</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleDemoClearCart}
                      className="text-[10px] font-mono text-zinc-400 hover:text-rose-600 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {demoCart.map((it) => (
                      <div
                        key={it.name}
                        className="flex items-center justify-between text-xs font-mono bg-white p-2 rounded border border-zinc-200"
                      >
                        <div className="truncate pr-2">
                          <span className="text-zinc-900 font-medium block truncate">
                            {it.name}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {it.qty}x @ Rp {it.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <span className="font-semibold text-zinc-900 shrink-0">
                          Rp {(it.price * it.qty).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}

                    {demoCart.length === 0 && (
                      <div className="p-6 text-center text-zinc-400 text-xs font-mono">
                        Pilih menu di sisi kiri untuk simulasi kasir.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">Subtotal:</span>
                    <span className="font-bold text-zinc-900">
                      Rp {demoCartTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">PB1 Resto (10%):</span>
                    <span className="text-zinc-700">
                      Rp {(demoCartTotal * 0.1).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono font-bold text-zinc-950 pt-1 border-t border-zinc-200">
                    <span>Total Pembayaran:</span>
                    <span>Rp {(demoCartTotal * 1.1).toLocaleString('id-ID')}</span>
                  </div>

                  {demoPaymentDone ? (
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Transaksi Lunas & Struk Tercetak!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDemoPay}
                      disabled={demoCart.length === 0}
                      className="w-full py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Simulasikan Bayar (QRIS / Tunai)</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KDS PREVIEW */}
          {activeDemoTab === 'kds' && (
            <div className="bg-zinc-900 text-white border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber-400" />
                  <span className="font-bold text-xs sm:text-sm">
                    Layar Dapur & Bar KDS (Kitchen Display System)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  3 TIKET AKTIF DALAM PROSES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                {/* TICKET 1 */}
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-zinc-700 pb-1.5">
                    <span className="font-bold text-amber-400">Meja #04 · Dine-In</span>
                    <span className="text-[10px] text-zinc-400">03:45 lalu</span>
                  </div>
                  <div className="space-y-1 text-zinc-200 text-[11px]">
                    <div className="flex justify-between">
                      <span>2x Nasi Goreng Wagyu</span>
                      <span className="text-zinc-400">Pedas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Spaghetti Aglio Olio</span>
                      <span className="text-zinc-400">No Chili</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[10px] mt-2 transition-colors cursor-pointer"
                  >
                    Tandai Selesai Masak
                  </button>
                </div>

                {/* TICKET 2 */}
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-zinc-700 pb-1.5">
                    <span className="font-bold text-amber-400">Meja #08 · Bar</span>
                    <span className="text-[10px] text-zinc-400">01:20 lalu</span>
                  </div>
                  <div className="space-y-1 text-zinc-200 text-[11px]">
                    <div className="flex justify-between">
                      <span>2x Kopi Susu Gula Aren</span>
                      <span className="text-zinc-400">Less Ice</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Matcha Latte Oatmilk</span>
                      <span className="text-zinc-400">Normal</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[10px] mt-2 transition-colors cursor-pointer"
                  >
                    Tandai Selesai Bar
                  </button>
                </div>

                {/* TICKET 3 (OVERDUE ALERT) */}
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-rose-800/60 pb-1.5">
                    <span className="font-bold text-rose-300">Meja #02 · Takeaway</span>
                    <span className="text-[10px] font-bold text-rose-400 animate-pulse">16:10 (LATE)</span>
                  </div>
                  <div className="space-y-1 text-rose-100 text-[11px]">
                    <div className="flex justify-between">
                      <span>1x Croissant Butter Almond</span>
                      <span className="text-rose-300">Warm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x Americano Double Shot</span>
                      <span className="text-rose-300">Hot</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-1 rounded bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] mt-2 transition-colors cursor-pointer"
                  >
                    Selesaikan Pesanan Terlambat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY RECIPE BOM */}
          {activeDemoTab === 'inventory' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-950">
                    Kalkulasi Bill of Materials (BOM) & HPP Resep Dinamis
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Stok bahan baku terpotong otomatis per takaran gramatur saat kasir membunyikan struk.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                  TARGET FOOD COST: &lt; 35%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono min-w-[500px]">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] text-zinc-500 uppercase">
                      <th className="py-2 px-3">Bahan Baku Resep</th>
                      <th className="py-2 px-3">Takaran / Porsi</th>
                      <th className="py-2 px-3 text-right">Biaya Bahan</th>
                      <th className="py-2 px-3 text-right">Sisa Stok Fisik</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900 font-sans">
                        House Blend Arabica Beans
                      </td>
                      <td className="py-2.5 px-3">18.0 gram</td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-900">Rp 4.500</td>
                      <td className="py-2.5 px-3 text-right text-zinc-700">14.2 kg</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold">
                          AMAN
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900 font-sans">
                        Fresh Milk Pasteurisasi
                      </td>
                      <td className="py-2.5 px-3">150.0 ml</td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-900">Rp 3.600</td>
                      <td className="py-2.5 px-3 text-right text-zinc-700">42.0 liter</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold">
                          AMAN
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900 font-sans">
                        Sirup Gula Aren Organik
                      </td>
                      <td className="py-2.5 px-3">25.0 ml</td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-900">Rp 1.100</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-bold">1.2 liter</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold">
                          RESTOCK
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-zinc-50 font-bold text-zinc-950">
                      <td colSpan={2} className="py-2 px-3 text-right">
                        Total HPP Resep per Cup:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">Rp 9.200</td>
                      <td colSpan={2} className="py-2 px-3 text-[10px] text-zinc-500 font-sans">
                        Harga Jual: Rp 24.000 · Margin Kotor: 61.6%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SAK EMKM FINANCE PREVIEW */}
          {activeDemoTab === 'finance' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm font-mono">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-950 font-sans">
                    Laporan Laba Rugi Komparatif Harian (Standar SAK EMKM)
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                    Rekonsiliasi otomatis kas laci kasir vs mutasi rekening bank secara real-time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                    PERIODE BERJALAN
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block">PENDAPATAN KOTOR (GMV)</span>
                  <span className="font-bold text-base text-zinc-900 block mt-0.5">
                    Rp 142.800.000
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans block">Bulan ini</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block">HPP BAHAN BAKU (COGS)</span>
                  <span className="font-bold text-base text-rose-700 block mt-0.5">
                    Rp 48.552.000
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans block">34.0% dari GMV</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block">BIAYA OPERASIONAL (OPEX)</span>
                  <span className="font-bold text-base text-zinc-800 block mt-0.5">
                    Rp 36.200.000
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans block">Gaji, sewa & listrik</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block">LABA BERSIH BERJALAN</span>
                  <span className="font-bold text-base text-emerald-700 block mt-0.5">
                    Rp 58.048.000
                  </span>
                  <span className="text-[10px] text-emerald-800 font-sans block font-medium">
                    Net Margin: 40.6%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DEMO CTA STRIP */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-zinc-700 font-medium font-sans">
                Ingin mencoba sendiri langsung di layar tablet kasir kamu?
              </span>
            </div>

            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white font-medium flex items-center justify-center gap-1.5 transition-colors shrink-0 font-sans"
            >
              <span>Buka Aplikasi Demo Live</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERACTIVE ROI & FOOD COST CALCULATOR                     */}
      {/* ------------------------------------------------------------- */}
      <section id="kalkulator" className="py-16 px-4 sm:px-6 bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Kalkulator Efisiensi Operasional
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Berapa Uang yang Bisa Anda Hemat Tiap Bulan?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
              Geser nilai di bawah ini sesuai estimasi operasional kedai atau resto Anda saat ini.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50/50 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* SLIDERS */}
            <div className="space-y-5">
              {/* SLIDER 1: OUTLETS */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-600 font-medium font-sans">Jumlah Gerai / Cabang:</span>
                  <span className="font-bold text-zinc-950">{outletsCount} Cabang</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={outletsCount}
                  onChange={(e) => setOutletsCount(Number(e.target.value))}
                  className="w-full accent-zinc-950 cursor-pointer"
                />
              </div>

              {/* SLIDER 2: ORDERS PER DAY */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-600 font-medium font-sans">Pesanan Harian / Cabang:</span>
                  <span className="font-bold text-zinc-950">{dailyOrdersPerOutlet} Transaksi</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="10"
                  value={dailyOrdersPerOutlet}
                  onChange={(e) => setDailyOrdersPerOutlet(Number(e.target.value))}
                  className="w-full accent-zinc-950 cursor-pointer"
                />
              </div>

              {/* SLIDER 3: AVG SPENT */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-600 font-medium font-sans">Rata-rata Nilai Struk:</span>
                  <span className="font-bold text-zinc-950">
                    Rp {avgTicketPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="150000"
                  step="5000"
                  value={avgTicketPrice}
                  onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                  className="w-full accent-zinc-950 cursor-pointer"
                />
              </div>
            </div>

            {/* VALUE RESULTS CARD */}
            <div className="p-5 rounded-lg border border-zinc-200 bg-white space-y-4 font-mono">
              <div className="border-b border-zinc-100 pb-2">
                <span className="text-[10px] text-zinc-400 block">ESTIMASI TOTAL NILAI PENGHEMATAN</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                  Rp {Math.round(roiCalculations.totalMonthlyValue).toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-zinc-500 font-sans"> / bulan</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-sans mt-0.5 block">
                  Setara Rp {Math.round(roiCalculations.annualSavings).toLocaleString('id-ID')} penghematan per tahun
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-700">
                  <span className="font-sans">Cegah Kebocoran Food Cost (4.5%):</span>
                  <span className="font-semibold text-zinc-900">
                    Rp {Math.round(roiCalculations.monthlyFoodCostSavings).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-700">
                  <span className="font-sans">Hemat Waktu Rekap Admin & Kasir:</span>
                  <span className="font-semibold text-zinc-900">
                    Rp {Math.round(roiCalculations.monthlyAdminTimeSaved).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <a
                href="#daftar"
                className="w-full py-2.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors font-sans"
              >
                <span>Daftar & Kunci Efisiensi Ini</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. TRANSPARENT PRICING TIERS                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="harga" className="py-16 px-4 sm:px-6 bg-[#FAFAFA] border-b border-zinc-200">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Biaya Langganan Transparan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Investasi Jelas. 0% Potongan Komisi Transaksi Kasir.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
              Kami tidak mengambil potongan sepeser pun dari omzet restoran Anda. Murni biaya langganan SaaS tetap per bulan.
            </p>

            {/* BILLING TOGGLE */}
            <div className="inline-flex items-center p-1 rounded-lg bg-zinc-200/80 border border-zinc-300 mt-4 text-xs font-mono">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annually'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <span>Tahunan</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  Hemat 2 Bulan
                </span>
              </button>
            </div>
          </div>

          {/* 3 TIERS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* TIER 1: STARTER */}
            <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                    UNTUK KEDAI TUNGGAL
                  </span>
                  <h3 className="text-lg font-bold text-zinc-950 mt-0.5">Starter</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Cocok untuk coffee shop atau booth kuliner 1 cabang yang butuh kasir cepat dan cetak struk thermal.
                  </p>
                </div>

                <div className="font-mono">
                  <div className="text-2xl font-extrabold text-zinc-950">
                    {billingCycle === 'annually' ? 'Rp 249.000' : 'Rp 299.000'}
                    <span className="text-xs font-normal text-zinc-500 font-sans"> / bulan</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {billingCycle === 'annually' ? 'Ditagihkan Rp 2.990.000 / tahun' : 'Bebas batalkan kapan saja'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs text-zinc-700">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>1 Cabang & 2 Terminal Kasir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>POS Cepat + Offline-First Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Cetak Struk Thermal Bluetooth/USB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Manajemen Stok Bahan Dasar</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="w-3.5 h-0.5 bg-zinc-300 shrink-0" />
                    <span>Tanpa KDS Dapur & SAK EMKM</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'starter' }))}
                className="w-full py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-xs font-semibold text-center transition-colors block"
              >
                Pilih Starter
              </a>
            </div>

            {/* TIER 2: PRO (RECOMMENDED) */}
            <div className="p-6 rounded-xl border-2 border-zinc-950 bg-white space-y-5 flex flex-col justify-between relative shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-zinc-950 text-white text-[10px] font-mono font-bold tracking-wider uppercase">
                PALING POPULER · RESTO PILIHAN
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                    MULTI-CABANG & RESTO LENGKAP
                  </span>
                  <h3 className="text-lg font-bold text-zinc-950 mt-0.5">Professional (Pro)</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Solusi lengkap cafe & resto berkembang: KDS dapur, HPP resep otomatis, hingga laporan SAK EMKM.
                  </p>
                </div>

                <div className="font-mono">
                  <div className="text-2xl font-extrabold text-zinc-950">
                    {billingCycle === 'annually' ? 'Rp 665.000' : 'Rp 799.000'}
                    <span className="text-xs font-normal text-zinc-500 font-sans"> / bulan</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {billingCycle === 'annually' ? 'Ditagihkan Rp 7.990.000 / tahun' : 'Bebas batalkan kapan saja'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs text-zinc-700">
                  <div className="flex items-center gap-2 font-semibold text-zinc-950">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Hingga 3 Cabang & Unlimited Kasir</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-zinc-950">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Kitchen Display System (KDS) Interaktif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>HPP Resep Gramatur & Alert Stok Minus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Laporan Laba Rugi SAK EMKM Resmi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Transfer Stok Antar Gudang Cabang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Dukungan Ekspor Excel & PDF Neraca</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'pro' }))}
                className="w-full py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold text-center transition-all shadow-sm active:scale-[0.98] block"
              >
                Mulai Uji Coba Pro 14 Hari
              </a>
            </div>

            {/* TIER 3: ENTERPRISE */}
            <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                    FRANCHISE & ROASTERY
                  </span>
                  <h3 className="text-lg font-bold text-zinc-950 mt-0.5">Enterprise</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Untuk jaringan franchise F&B, roastery kopi skala pabrik, dan katering dengan faktur piutang B2B.
                  </p>
                </div>

                <div className="font-mono">
                  <div className="text-2xl font-extrabold text-zinc-950">
                    {billingCycle === 'annually' ? 'Rp 1.665.000' : 'Rp 1.999.000'}
                    <span className="text-xs font-normal text-zinc-500 font-sans"> / bulan</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {billingCycle === 'annually' ? 'Ditagihkan Rp 19.990.000 / tahun' : 'Bebas batalkan kapan saja'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs text-zinc-700">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Unlimited Cabang & Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Modul Batch Roastery & Produksi Dapur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Faktur Grosir & Piutang B2B Catering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Dedicated Technical Account Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>SLA Uptime 99.9% Bergaransi</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'enterprise' }))}
                className="w-full py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-xs font-semibold text-center transition-colors block"
              >
                Pilih Enterprise
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. INSTANT ONBOARDING REGISTRATION FORM                       */}
      {/* ------------------------------------------------------------- */}
      <section id="daftar" className="py-16 px-4 sm:px-6 bg-white border-b border-zinc-200">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Mulai Dalam 3 Menit
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Daftarkan Restoran Anda untuk Uji Coba Gratis 14 Hari.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Tanpa kartu kredit. Akun Anda langsung aktif dan siap digunakan untuk input menu pertama.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-xl border border-zinc-200 bg-zinc-50/50 shadow-sm">
            {submittedSuccess ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-zinc-950">
                    Pendaftaran Resto Berhasil Diterima!
                  </h3>
                  <p className="text-xs text-zinc-600 max-w-md mx-auto">
                    Tim Hallo Group Ops telah menerbitkan akun untuk <b>{regForm.businessName}</b>. Kredensial aktivasi dan petunjuk instalasi printer telah dikirimkan ke WhatsApp Anda di <b>{regForm.phone}</b>.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <a
                    href={LIVE_DEMO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-zinc-950 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Masuk ke Web Kasir Toko</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedSuccess(false)
                      setRegForm({
                        businessName: '',
                        ownerName: '',
                        phone: '',
                        email: '',
                        tier: 'pro',
                        city: '',
                      })
                    }}
                    className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    Daftarkan Resto Lain
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                      <Store size={12} className="text-zinc-500" />
                      <span>Nama Resto / Kedai Kopi *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kopi Titik Temu"
                      value={regForm.businessName}
                      onChange={(e) =>
                        setRegForm({ ...regForm, businessName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                      <User size={12} className="text-zinc-500" />
                      <span>Nama Pemilik / PIC *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={regForm.ownerName}
                      onChange={(e) =>
                        setRegForm({ ...regForm, ownerName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                      <Phone size={12} className="text-zinc-500" />
                      <span>Nomor WhatsApp Aktif *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812-XXXX-XXXX"
                      value={regForm.phone}
                      onChange={(e) =>
                        setRegForm({ ...regForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                      <Mail size={12} className="text-zinc-500" />
                      <span>Email Bisnis</span>
                    </label>
                    <input
                      type="email"
                      placeholder="owner@titiktemu.id"
                      value={regForm.email}
                      onChange={(e) =>
                        setRegForm({ ...regForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700">
                      Pilihan Paket Lisensi:
                    </label>
                    <select
                      value={regForm.tier}
                      onChange={(e) =>
                        setRegForm({ ...regForm, tier: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-500 cursor-pointer font-sans"
                    >
                      <option value="starter">Starter (1 Cabang - Rp 299rb/bln)</option>
                      <option value="pro">Professional (Hingga 3 Cabang - Rp 799rb/bln)</option>
                      <option value="enterprise">Enterprise (Unlimited - Rp 1.999rb/bln)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700">
                      Kota Operasional:
                    </label>
                    <input
                      type="text"
                      placeholder="Jakarta Selatan, Bandung, Bali..."
                      value={regForm.city}
                      onChange={(e) =>
                        setRegForm({ ...regForm, city: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Menerbitkan Lisensi Uji Coba...</span>
                      </span>
                    ) : (
                      <>
                        <span>Aktifkan Uji Coba 14 Hari Gratis Sekarang</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center mt-2 font-mono">
                    Data Anda aman. Terhubung langsung dengan Hallo Group SaaS Operations Hub.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ)                           */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-16 px-4 sm:px-6 bg-[#FAFAFA] border-b border-zinc-200">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              FAQ Resto Owner
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Pertanyaan yang Sering Diajukan Pemilik Cafe & Resto.
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Apakah saya wajib membeli tablet atau mesin kasir khusus dari Nusantara F&B OS?',
                a: 'Tidak sama sekali. Sistem ini berjalan langsung di browser modern (Chrome, Safari, Edge). Anda bisa memakai tablet Android, iPad, smartphone kasir, hingga laptop PC yang sudah Anda miliki di resto.',
              },
              {
                q: 'Bagaimana jika wifi atau koneksi internet di resto saya mati total?',
                a: 'Kasir tetap bisa bertransaksi, mencetak struk thermal, dan melayani antrean pelanggan seperti biasa. Data tersimpan aman di penyimpanan lokal (IndexedDB) dan akan otomatis disinkronkan ke server saat internet kembali online.',
              },
              {
                q: 'Apakah printer struk thermal yang ada di toko saya saat ini bisa dipakai?',
                a: 'Bisa. Sistem mendukung hampir semua printer thermal 58mm dan 80mm standar pasar, baik koneksi Bluetooth, USB, maupun kabel LAN/Ethernet.',
              },
              {
                q: 'Apakah ada potongan komisi persentase dari setiap struk transaksi saya?',
                a: 'Sama sekali tidak (0% transaction cut). Anda hanya membayar biaya langganan software bulanan flat. Seluruh omzet dari pelanggan sepenuhnya adalah milik Anda.',
              },
              {
                q: 'Bagaimana cara memindahkan master menu dan resep dari sistem lama saya?',
                a: 'Sistem menyediakan fitur import data dari Excel/CSV. Tim technical support kami juga siap mendampingi proses setup awal resep dan input menu cabang Anda.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={faq.q}
                  className="rounded-lg border border-zinc-200 bg-white overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-zinc-900 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-zinc-400 transition-transform ${
                        isOpen ? 'rotate-180 text-zinc-950' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. CLEAN FOOTER                                              */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-12 px-4 sm:px-6 bg-white text-zinc-600 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 border-b border-zinc-100 pb-8">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-[10px]">
                HG
              </div>
              <span className="font-bold text-sm text-zinc-950 tracking-tight">
                Nusantara F&B OS
              </span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              Sistem Operasi F&B Enterprise untuk Resto & Cafe Modern di Indonesia. Terintegrasi POS, KDS Dapur, HPP Resep Dinamis, dan Standar Akuntansi SAK EMKM Resmi.
            </p>
            <div className="text-[10px] font-mono text-zinc-400">
              Bagian dari ekosistem teknologi Hallo Group HQ.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="font-bold text-zinc-900 text-xs font-mono block">
                PRODUK
              </span>
              <ul className="space-y-1.5 text-[11px] text-zinc-500">
                <li><a href="#demo" className="hover:text-zinc-950">Kasir POS Kilat</a></li>
                <li><a href="#demo" className="hover:text-zinc-950">Kitchen Display (KDS)</a></li>
                <li><a href="#demo" className="hover:text-zinc-950">Resep & BOM HPP</a></li>
                <li><a href="#demo" className="hover:text-zinc-950">Akuntansi SAK EMKM</a></li>
                <li><a href={LIVE_DEMO_URL} target="_blank" rel="noreferrer" className="hover:text-zinc-950 flex items-center gap-1">Live Store Demo <ExternalLink size={10} /></a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-zinc-900 text-xs font-mono block">
                OPERASIONAL
              </span>
              <ul className="space-y-1.5 text-[11px] text-zinc-500">
                <li><a href="#harga" className="hover:text-zinc-950">Paket Langganan</a></li>
                <li><a href="#kalkulator" className="hover:text-zinc-950">Kalkulator ROI</a></li>
                <li><a href={OPS_CONSOLE_URL} target="_blank" rel="noreferrer" className="hover:text-zinc-950 flex items-center gap-1">Fleet Ops Hub <ExternalLink size={10} /></a></li>
                <li><a href="#faq" className="hover:text-zinc-950">Pertanyaan Umum</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-zinc-900 text-xs font-mono block">
                KONTAK HQ
              </span>
              <ul className="space-y-1.5 text-[11px] text-zinc-500 font-mono">
                <li>WhatsApp: 0812-9900-8899</li>
                <li>Email: ops@hallogroup.id</li>
                <li>Jakarta Selatan, Indonesia</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400 font-mono">
          <div>© 2026 Hallo Group HQ. Seluruh hak cipta dilindungi.</div>
          <div className="flex items-center gap-4">
            <span>Kebijakan Privasi</span>
            <span>·</span>
            <span>Ketentuan Layanan</span>
            <span>·</span>
            <span>Status SLA Server 99.9%</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
