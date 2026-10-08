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
  BarChart3,
  Flame,
  Check,
  Coffee,
  ExternalLink,
  ChevronDown,
  Printer,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  FileSpreadsheet,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react'

// Live Demo Store Link
const LIVE_DEMO_URL = 'https://fnb-erp.vercel.app'
const OPS_CONSOLE_URL = 'https://fnb-ops-delta.vercel.app'

export default function SaaSLandingPage() {
  // Interactive Product Showcase State
  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'bom' | 'finance'>('pos')
  
  // POS Simulator State
  const [selectedTable, setSelectedTable] = useState('Meja 04')
  const [posCart, setPosCart] = useState<Array<{ name: string; price: number; qty: number; note: string }>>([
    { name: 'Iced Palm Sugar Latte', price: 28000, qty: 2, note: 'Less Ice, Oat Milk' },
    { name: 'Truffle Parmesan Fries', price: 38000, qty: 1, note: 'Saus Terpisah' },
  ])
  const [paymentDone, setPaymentDone] = useState(false)

  // KDS Interactive State
  const [kdsOrders, setKdsOrders] = useState([
    { id: '1041', table: 'Meja 02', station: 'Bar', items: ['2x Espresso Double', '1x Butter Croissant'], status: 'ready', time: '2 mnt lalu' },
    { id: '1042', table: 'Meja 04', station: 'Dapur & Bar', items: ['2x Iced Palm Sugar Latte', '1x Truffle Fries'], status: 'cooking', time: '4 mnt lalu' },
    { id: '1043', table: 'Takeaway #12', station: 'Dapur', items: ['1x Wagyu Donburi (Pedas)'], status: 'new', time: '1 mnt lalu' },
  ])

  // Pricing State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Registration State
  const [regForm, setRegForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    city: '',
    tier: 'pro',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const cartSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.price * item.qty, 0)
  }, [posCart])

  const cartTax = Math.round(cartSubtotal * 0.1)
  const cartTotal = cartSubtotal + cartTax

  function handleAddToCart(name: string, price: number, note = 'Normal') {
    setPaymentDone(false)
    setPosCart((prev) => {
      const exist = prev.find((i) => i.name === name)
      if (exist) {
        return prev.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { name, price, qty: 1, note }]
    })
  }

  function handleMarkKdsDone(id: string) {
    setKdsOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'ready' } : o))
    )
  }

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!regForm.businessName || !regForm.phone) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION                                                    */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-950 text-white flex items-center justify-center font-display font-bold text-sm tracking-tight shadow-xs">
              N
            </div>
            <div>
              <span className="font-bold text-sm text-stone-950 block leading-tight font-display tracking-tight">
                Nusantara F&B OS
              </span>
              <span className="text-[10px] text-stone-500 block leading-tight font-mono">
                by Hallo Group HQ
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-stone-600">
            <a href="#ekosistem" className="hover:text-stone-950 transition-colors">
              Peta Ekosistem
            </a>
            <a href="#showcase" className="hover:text-stone-950 transition-colors">
              Aplikasi Kasir
            </a>
            <a href="#solusi" className="hover:text-stone-950 transition-colors">
              Alur Dapur & Meja
            </a>
            <a href="#resep" className="hover:text-stone-950 transition-colors">
              Stok & HPP
            </a>
            <a href="#harga" className="hover:text-stone-950 transition-colors">
              Paket Harga
            </a>
            <a href="#faq" className="hover:text-stone-950 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={LIVE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-950 transition-all shadow-2xs"
            >
              <span>Buka Demo Toko</span>
              <ExternalLink size={12} className="text-stone-400" />
            </a>

            <a
              href="#daftar"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Uji Coba 14 Hari</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION WITH BOLD EDITORIAL TYPOGRAPHY                */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-16 pb-12 px-4 sm:px-8 border-b border-stone-200/80 bg-white">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-stone-500">
              SISTEM OPERASI RESTORAN, CAFE & MULTI-CABANG
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-stone-950 tracking-tight leading-[1.08]">
              Semua urusan restoran, <span className="italic font-normal font-display text-stone-700">selesai</span> di satu sistem.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Hentikan kerepotan memakai 4 software terpisah. Nusantara F&B OS menyatukan kasir POS cepat, layar pesanan dapur (KDS), pemotongan stok bahan per gram, dan laporan laba rugi resmi standar SAK EMKM.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={LIVE_DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Store size={16} />
                <span>Buka Demo Toko Langsung</span>
                <ExternalLink size={13} className="text-stone-400" />
              </a>

              <a
                href="#daftar"
                className="w-full sm:w-auto px-5 py-3.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Daftar Uji Coba Gratis</span>
                <ArrowRight size={14} className="text-stone-500" />
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-stone-900" />
                Tetap jalan saat WiFi mati (Offline-First)
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-stone-900" />
                Cetak struk thermal 0.2 detik
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-stone-900" />
                0% potongan komisi omzet
              </span>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* VISUAL CENTERPIECE: ARCHITECTURAL RESTO COUNTER & HOTSPOTS  */}
          {/* ----------------------------------------------------------- */}
          <div id="ekosistem" className="pt-6">
            <div className="relative rounded-2xl overflow-hidden border border-stone-300/80 shadow-xl bg-stone-100 group">
              <img
                src="/images/hero-resto-counter.jpg"
                alt="Visual interior bar kopi dan kasir resto modern"
                className="w-full h-auto object-cover max-h-[520px] filter brightness-[0.98]"
              />

              {/* OVERLAY ANNOTATION CARDS (GROUNDED VISUAL CALLOUTS) */}
              <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-stone-200/90 shadow-md text-xs space-y-0.5">
                    <span className="font-bold text-stone-950 block font-display">
                      Stasiun Kasir & Barista
                    </span>
                    <span className="text-[11px] text-stone-600 block">
                      Tablet POS & Printer Thermal 58/80mm
                    </span>
                  </div>

                  <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 bg-stone-950/90 text-white px-3 py-1.5 rounded-lg text-xs font-mono backdrop-blur-md shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Sinkronisasi Otomatis Dapur & Bar</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-stone-200/90 shadow-md text-xs max-w-sm space-y-1">
                    <div className="font-semibold text-stone-950 flex items-center gap-1.5">
                      <Coffee size={14} className="text-amber-700" />
                      <span>Resep Master Terintegrasi</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      Setiap cup kopi memotong stok biji kopi (18g) dan susu (160ml) secara otomatis di gudang saat nota tercetak.
                    </p>
                  </div>

                  <div className="pointer-events-auto bg-stone-900/95 text-stone-200 backdrop-blur-md px-3.5 py-2 rounded-lg border border-stone-800 shadow-md text-xs flex items-center gap-2 font-mono">
                    <Flame size={14} className="text-amber-400" />
                    <span>Layar KDS Dapur: Tiket 0-Lag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. REAL APPLICATION SHOWCASE (TABBED WORKBENCH)               */}
      {/* ------------------------------------------------------------- */}
      <section id="showcase" className="py-16 px-4 sm:px-8 border-b border-stone-200/80 bg-[#faf8f5]">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block font-mono">
                INTERACTIVE APPLICATION FRAME
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Jelajahi bagaimana sistem bekerja di setiap bagian toko Anda.
              </h2>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-200/80 overflow-x-auto text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'pos'
                    ? 'bg-white text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                1. Kasir POS & Meja
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('kds')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'kds'
                    ? 'bg-white text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                2. Layar Dapur (KDS)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bom')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'bom'
                    ? 'bg-white text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                3. Resep & Stok Bahan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('finance')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'finance'
                    ? 'bg-white text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                4. Laba Rugi SAK EMKM
              </button>
            </div>
          </div>

          {/* SCREEN CONTAINER */}
          <div className="rounded-xl border border-stone-300 bg-white shadow-sm overflow-hidden">
            {/* WINDOW TOP BAR */}
            <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex items-center justify-between text-xs text-stone-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                <span className="text-stone-600 font-medium pl-2">
                  app.nusantara-os.com · Cabang Senopati
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-stone-600">Online & Siap Cetak</span>
              </div>
            </div>

            {/* TAB 1: POS VIEW */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                {/* MENU AREA */}
                <div className="lg:col-span-8 p-5 border-b lg:border-b-0 lg:border-r border-stone-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <span className="text-xs font-semibold text-stone-700">
                      Pilih Menu Kasir (Klik untuk Menambahkan ke Pesanan)
                    </span>
                    <span className="text-xs text-stone-400 font-mono">Kasir: Rian S.</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { name: 'Iced Palm Sugar Latte', price: 28000, cat: 'Coffee' },
                      { name: 'Americano Double Shot', price: 22000, cat: 'Coffee' },
                      { name: 'Matcha Oat Latte', price: 34000, cat: 'Non-Coffee' },
                      { name: 'Truffle Parmesan Fries', price: 38000, cat: 'Snack' },
                      { name: 'Wagyu Beef Donburi', price: 65000, cat: 'Main' },
                      { name: 'Butter Croissant Almond', price: 32000, cat: 'Bakery' },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleAddToCart(item.name, item.price)}
                        className="p-3 rounded-lg border border-stone-200 hover:border-stone-400 hover:bg-stone-50 text-left transition-colors cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">
                            {item.cat}
                          </span>
                          <span className="text-xs font-semibold text-stone-900 block mt-0.5 leading-snug">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-stone-800 font-mono mt-3 block">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>Shortcut: Split Bill, Gabung Meja, Pindah Meja</span>
                    <span className="text-emerald-700 font-medium font-mono">Auto-Sync IndexedDB</span>
                  </div>
                </div>

                {/* SIDEBAR BILL & CHECKOUT */}
                <div className="lg:col-span-4 p-5 bg-stone-50/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                        <Receipt size={14} className="text-stone-500" />
                        <span>Pesanan: {selectedTable}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        {['Meja 02', 'Meja 04', 'Takeaway'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTable(t)}
                            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                              selectedTable === t
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {posCart.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded border border-stone-200 bg-white text-xs flex justify-between items-start"
                        >
                          <div>
                            <span className="font-semibold text-stone-900 block">
                              {it.qty}x {it.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Catatan: {it.note}
                            </span>
                          </div>
                          <span className="font-mono text-stone-800 font-semibold shrink-0">
                            Rp {(it.price * it.qty).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-600 font-mono">
                      <span>Subtotal:</span>
                      <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 font-mono">
                      <span>PB1 Restoran (10%):</span>
                      <span>Rp {cartTax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-950 font-mono text-sm pt-1 border-t border-stone-200">
                      <span>Total Tagihan:</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>

                    {paymentDone ? (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Pembayaran Berhasil!</span>
                          <span className="text-[11px] text-emerald-700">
                            Struk tercetak ke printer thermal & tiket diteruskan ke KDS dapur.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPaymentDone(true)}
                        className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer size={13} />
                        <span>Selesaikan Transaksi & Cetak Struk</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KDS VIEW */}
            {activeTab === 'kds' && (
              <div className="p-5 bg-stone-900 text-stone-100 min-h-[460px] space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-amber-400" />
                    <span className="font-bold text-xs sm:text-sm text-white font-display">
                      Layar Display Dapur & Bar (KDS)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    Pembaruan Real-Time 0-Detik
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {kdsOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-3 ${
                        order.status === 'ready'
                          ? 'bg-stone-800/60 border-stone-700'
                          : 'bg-stone-800 border-stone-600'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs border-b border-stone-700 pb-1.5 font-mono">
                          <span className="font-bold text-white">
                            #{order.id} · {order.table}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {order.time}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-stone-200">
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-700 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            order.status === 'ready'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {order.status === 'ready' ? 'Siap Antar' : 'Sedang Dimasak'}
                        </span>

                        {order.status !== 'ready' && (
                          <button
                            type="button"
                            onClick={() => handleMarkKdsDone(order.id)}
                            className="px-2.5 py-1 rounded bg-white text-stone-900 font-semibold text-[11px] hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            Tandai Siap
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BOM RECIPE VIEW */}
            {activeTab === 'bom' && (
              <div className="p-5 min-h-[460px] space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block font-display">
                      Master Resep & Pemotongan Bahan Baku Otomatis (Bill of Materials)
                    </span>
                    <span className="text-xs text-stone-500">
                      Stok gudang terpotong per gram saat nota kasir tercetak.
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    Margin Kotor: 67.0%
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[500px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-[11px] uppercase">
                        <th className="py-2 px-3">Bahan Baku (Menu: Iced Palm Sugar Latte)</th>
                        <th className="py-2 px-3">Takaran Resep</th>
                        <th className="py-2 px-3 text-right">Biaya Bahan</th>
                        <th className="py-2 px-3 text-right">Sisa Stok Fisik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium">Biji Kopi Arabika House Blend</td>
                        <td className="py-2.5 px-3">18.0 gram</td>
                        <td className="py-2.5 px-3 text-right">Rp 3.960</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-stone-900">12.4 kg</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium">Fresh Milk Pasteurisasi</td>
                        <td className="py-2.5 px-3">160.0 ml</td>
                        <td className="py-2.5 px-3 text-right">Rp 3.520</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-stone-900">28.0 liter</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium">Gula Aren Cair Organik</td>
                        <td className="py-2.5 px-3">25.0 ml</td>
                        <td className="py-2.5 px-3 text-right">Rp 900</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-stone-900">4.5 liter</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium">Cup 12oz PET + Lid Strawless</td>
                        <td className="py-2.5 px-3">1 set</td>
                        <td className="py-2.5 px-3 text-right">Rp 850</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-stone-900">420 pcs</td>
                      </tr>
                      <tr className="bg-stone-50 font-bold text-stone-950">
                        <td colSpan={2} className="py-2.5 px-3 font-sans text-right">
                          Total HPP Bahan per Cup:
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-800">Rp 9.230</td>
                        <td className="py-2.5 px-3 text-right text-[11px] font-sans font-normal text-stone-500">
                          Harga Jual: Rp 28.000
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: SAK EMKM FINANCE VIEW */}
            {activeTab === 'finance' && (
              <div className="p-5 min-h-[460px] space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block font-display">
                      Laporan Laba Rugi Berjalan (Standar SAK EMKM)
                    </span>
                    <span className="text-xs text-stone-500">
                      Format resmi yang diakui bank dan kantor pajak, siap diunduh ke Excel.
                    </span>
                  </div>
                  <span className="text-xs font-mono text-stone-500">Periode: Bulan Berjalan</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-[10px] text-stone-400 block">PENDAPATAN KOTOR</span>
                    <span className="text-base font-bold text-stone-950 mt-1 block">
                      Rp 148.500.000
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">Bulan ini</span>
                  </div>

                  <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-[10px] text-stone-400 block">HPP BAHAN BAKU (COGS)</span>
                    <span className="text-base font-bold text-stone-950 mt-1 block">
                      Rp 49.005.000
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">33.0% dari omzet</span>
                  </div>

                  <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-[10px] text-stone-400 block">BIAYA OPERASIONAL</span>
                    <span className="text-base font-bold text-stone-950 mt-1 block">
                      Rp 38.200.000
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">Gaji, sewa & listrik</span>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
                    <span className="text-[10px] text-emerald-800 font-semibold block">LABA BERSIH BERJALAN</span>
                    <span className="text-base font-bold text-emerald-800 mt-1 block">
                      Rp 61.295.000
                    </span>
                    <span className="text-[10px] text-emerald-700 font-sans">Margin: 41.2%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. ALUR OPERASIONAL & KITCHEN PASS VISUAL                     */}
      {/* ------------------------------------------------------------- */}
      <section id="solusi" className="py-20 px-4 sm:px-8 border-b border-stone-200/80 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-stone-500">
              OPERASIONAL RESTO TANPA KENDALA
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-950 tracking-tight">
              Tiga hal penting yang membedakan kami dari software kasir biasa.
            </h2>
            <p className="text-sm text-stone-600">
              Dibangun dari pengalaman nyata pemilik restoran di lapangan, bukan sekadar teori ritel umum.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT: 3 GROUNDED OPERATIONAL PILLARS */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-xl border border-stone-200 bg-[#faf8f5] space-y-2.5">
                <span className="text-xs font-mono font-bold text-stone-500 block">
                  01 / MESIN KASIR OFFLINE-FIRST
                </span>
                <h3 className="font-display font-bold text-lg text-stone-950">
                  Kasir kebal internet mati di jam sibuk.
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Saat WiFi ruko drop di tengah jam makan siang ramai, kasir tetap mencetak struk thermal dalam 0.2 detik tanpa jeda. Seluruh antrean pesanan tersimpan di browser lokal dan tersinkron otomatis saat sinyal kembali online.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-stone-200 bg-[#faf8f5] space-y-2.5">
                <span className="text-xs font-mono font-bold text-stone-500 block">
                  02 / PEMOTONGAN GRAMATUR RESEP
                </span>
                <h3 className="font-display font-bold text-lg text-stone-950">
                  Stok bahan terpotong presisi per gram.
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Setiap 1 porsi menu terjual langsung memotong gramatur bahan baku dari gudang. Pemilik toko langsung mengetahui jika ada pemakaian sirup atau susu yang berlebih tanpa harus menunggu audit akhir bulan.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-stone-200 bg-[#faf8f5] space-y-2.5">
                <span className="text-xs font-mono font-bold text-stone-500 block">
                  03 / PEMBUKUAN STANDAR RESMI
                </span>
                <h3 className="font-display font-bold text-lg text-stone-950">
                  Laporan laba rugi siap diserahkan ke bank.
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Bukan cuma laporan omzet kasir. Dapatkan neraca dan laba rugi resmi standar SAK EMKM yang siap dipakai untuk keperluan pengajuan modal usaha bank atau pelaporan pajak, dapat diunduh ke Excel dalam satu klik.
                </p>
              </div>
            </div>

            {/* RIGHT: KITCHEN PASS VISUAL ILLUSTRATION */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-stone-300/80 shadow-lg relative bg-stone-100">
                <img
                  src="/images/resto-kitchen-pass.jpg"
                  alt="Dapur restoran dan pantry bahan baku segar"
                  className="w-full h-auto object-cover max-h-[500px]"
                />
                <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent text-white space-y-1">
                  <span className="font-display font-bold text-sm block">
                    KDS Dapur & Kontrol Bahan Baku
                  </span>
                  <span className="text-[11px] text-stone-300 block font-sans">
                    Tiket pesanan diteruskan ke koki secara digital tanpa kertas bon basah atau terselip.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. TRANSPARENT PRICING PLANS                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="harga" className="py-20 px-4 sm:px-8 border-b border-stone-200/80 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-stone-500">
              INVESTASI TRANSPARAN
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-950 tracking-tight">
              Biaya langganan tetap. 0% potongan transaksi.
            </h2>
            <p className="text-sm text-stone-600">
              Kami tidak memotong sepeser pun dari omzet restoran Anda. Murni biaya software bulanan.
            </p>

            <div className="inline-flex items-center p-1 rounded-lg bg-stone-200 border border-stone-300 mt-2 text-xs font-medium font-mono">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  billingCycle === 'annually'
                    ? 'bg-white text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Tahunan (Hemat 2 Bulan)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* TIER 1 */}
            <div className="p-6 rounded-xl border border-stone-200 bg-white space-y-4 flex flex-col justify-between shadow-2xs">
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase">
                  Kedai Starter
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-mono">
                  {billingCycle === 'annually' ? 'Rp 249.000' : 'Rp 299.000'}
                  <span className="text-xs font-normal text-stone-500 font-sans"> / bulan</span>
                </div>
                <p className="text-xs text-stone-500">
                  Untuk kedai kopi tunggal atau booth kuliner 1 cabang.
                </p>

                <div className="space-y-2 pt-3 border-t border-stone-100 text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>1 Cabang & 2 Terminal Kasir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Mesin Kasir Offline-First</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Cetak Struk Thermal Bluetooth/USB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Stok Bahan Dasar</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'starter' }))}
                className="w-full py-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-900 text-xs font-semibold text-center transition-colors block mt-4"
              >
                Pilih Starter
              </a>
            </div>

            {/* TIER 2 */}
            <div className="p-6 rounded-xl border-2 border-stone-950 bg-white space-y-4 flex flex-col justify-between shadow-md relative">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-semibold text-stone-950 uppercase">
                    Resto Professional
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                    Pilihan Utama
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-mono">
                  {billingCycle === 'annually' ? 'Rp 599.000' : 'Rp 699.000'}
                  <span className="text-xs font-normal text-stone-500 font-sans"> / bulan</span>
                </div>
                <p className="text-xs text-stone-500">
                  Untuk restoran dine-in dengan dapur, bar, dan resep bahan baku.
                </p>

                <div className="space-y-2 pt-3 border-t border-stone-100 text-xs text-stone-700">
                  <div className="flex items-center gap-2 font-semibold text-stone-950">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Hingga 3 Cabang & Kasir Tanpa Batas</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-stone-950">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Kitchen Display System (KDS) Dapur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Resep Bahan Baku per Gramatur (BOM)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Laporan Laba Rugi Resmi SAK EMKM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Transfer Stok Antar Gudang Cabang</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'pro' }))}
                className="w-full py-2.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold text-center transition-colors block mt-4 shadow-sm"
              >
                Mulai Uji Coba Pro
              </a>
            </div>

            {/* TIER 3 */}
            <div className="p-6 rounded-xl border border-stone-200 bg-white space-y-4 flex flex-col justify-between shadow-2xs">
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase">
                  Enterprise Chain
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-mono">
                  {billingCycle === 'annually' ? 'Rp 1.190.000' : 'Rp 1.390.000'}
                  <span className="text-xs font-normal text-stone-500 font-sans"> / bulan</span>
                </div>
                <p className="text-xs text-stone-500">
                  Untuk waralaba atau grup resto dengan central kitchen.
                </p>

                <div className="space-y-2 pt-3 border-t border-stone-100 text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Hingga 10 Cabang & Central Kitchen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Purchase Order (PO) & Gudang Sentral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Integrasi Fleet Ops Hub Remote</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-stone-900 shrink-0" />
                    <span>Dukungan Tim Teknis Dedicated</span>
                  </div>
                </div>
              </div>

              <a
                href="#daftar"
                onClick={() => setRegForm((p) => ({ ...p, tier: 'enterprise' }))}
                className="w-full py-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-900 text-xs font-semibold text-center transition-colors block mt-4"
              >
                Pilih Enterprise
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. PRAGMATIC FAQ                                              */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-20 px-4 sm:px-8 border-b border-stone-200/80 bg-white">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-stone-500">
              TANYA JAWAB PRAKTIS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-950">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Hal-hal praktis yang biasa ditanyakan pengelola cafe dan resto.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Apakah saya wajib membeli mesin kasir atau hardware tertentu dari Hallo Group?',
                a: 'Tidak. Anda bisa memakai tablet Android, iPad, laptop, atau HP yang sudah ada. Sistem kami kompatibel dengan hampir semua printer thermal 58mm dan 80mm di pasaran (USB, Bluetooth, atau LAN) serta laci uang standar RJ11.',
              },
              {
                q: 'Bagaimana jika koneksi internet ruko mendadak mati seharian?',
                a: 'Operasional kasir tetap berjalan lancar berkat arsitektur IndexedDB lokal. Struk tetap tercetak dan pesanan tetap tersimpan rapi. Saat internet kembali terhubung, data otomatis disinkronkan ke server pusat.',
              },
              {
                q: 'Bisakah resep menu disesuaikan jika pelanggan minta ganti susu oat?',
                a: 'Bisa. Sistem mendukung varian resep bertingkat. Saat barista memilih opsi ganti susu oat, stok susu oat otomatis berkurang di gudang dan HPP disesuaikan tanpa merusak takaran resep standar.',
              },
              {
                q: 'Apakah laporannya bisa diekspor untuk kebutuhan akuntansi atau pajak?',
                a: 'Bisa. Laporan Laba Rugi dan Neraca kami mengikuti standar SAK EMKM yang dapat diunduh langsung ke format file Excel rapi atau dokumen PDF resmi.',
              },
            ].map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={idx} className="rounded-lg border border-stone-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-stone-900 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={15}
                      className={`text-stone-400 transition-transform ${
                        isOpen ? 'rotate-180 text-stone-950' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
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
      {/* 6. TRIAL REGISTRATION FORM                                    */}
      {/* ------------------------------------------------------------- */}
      <section id="daftar" className="py-20 px-4 sm:px-8 border-b border-stone-200/80 bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-stone-500">
              UJI COBA 14 HARI
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-950">
              Mulai Uji Coba Gratis 14 Hari
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Tanpa kartu kredit. Tim kami siap membantu import daftar menu Anda dari file Excel.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-stone-200 bg-white shadow-xs">
            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Check size={22} />
                </div>
                <h3 className="font-display text-lg font-bold text-stone-950">
                  Pendaftaran Uji Coba Berhasil
                </h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  Akun toko <span className="font-semibold text-stone-900">{regForm.businessName}</span> telah disiapkan. Tim kami akan menghubungi WhatsApp Anda ({regForm.phone}) untuk mengirimkan akses masuk.
                </p>
                <div className="pt-2">
                  <a
                    href={LIVE_DEMO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-950 text-white text-xs font-semibold"
                  >
                    <span>Masuk ke Demo Kasir Sekarang</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Nama Usaha / Resto:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kopi Nusantara"
                      value={regForm.businessName}
                      onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Nama Pemilik / Manajer:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={regForm.ownerName}
                      onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Nomor WhatsApp:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Kota Gerai:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta Selatan"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 block">
                    Pilihan Paket:
                  </label>
                  <select
                    value={regForm.tier}
                    onChange={(e) => setRegForm({ ...regForm, tier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900 font-mono"
                  >
                    <option value="starter">Kedai Starter (1 Cabang - Rp 299k/bln)</option>
                    <option value="pro">Resto Professional + KDS (Paling Cocok - Rp 699k/bln)</option>
                    <option value="enterprise">Enterprise Multi-Cabang (Rp 1.390k/bln)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <span>Menyiapkan Akun...</span>
                  ) : (
                    <>
                      <span>Mulai Akses 14 Hari Sekarang</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-12 px-4 sm:px-8 bg-white text-stone-500 text-xs border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-stone-950 text-white flex items-center justify-center font-display font-bold text-xs">
                N
              </div>
              <span className="font-bold text-sm text-stone-950 font-display">
                Nusantara F&B OS
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Sistem Operasi F&B untuk Restoran dan Cafe di Indonesia. POS Kasir, Kitchen Display System (KDS), Resep BOM, dan Laporan SAK EMKM.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-[11px]">
            <div className="space-y-1.5">
              <span className="font-semibold text-stone-900 block font-mono">PRODUK</span>
              <ul className="space-y-1 text-stone-600">
                <li><a href="#showcase" className="hover:text-stone-950">Kasir POS</a></li>
                <li><a href="#showcase" className="hover:text-stone-950">Layar Dapur KDS</a></li>
                <li><a href="#resep" className="hover:text-stone-950">Stok Resep BOM</a></li>
                <li><a href={LIVE_DEMO_URL} target="_blank" rel="noreferrer" className="hover:text-stone-950">Live Demo Toko</a></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-stone-900 block font-mono">EKOSISTEM</span>
              <ul className="space-y-1 text-stone-600">
                <li><a href="#harga" className="hover:text-stone-950">Paket Harga</a></li>
                <li><a href={OPS_CONSOLE_URL} target="_blank" rel="noreferrer" className="hover:text-stone-950">Fleet Ops Hub</a></li>
                <li><a href="#faq" className="hover:text-stone-950">Tanya Jawab</a></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-stone-900 block font-mono">KONTAK</span>
              <ul className="space-y-1 text-stone-600 font-mono">
                <li>ops@hallogroup.id</li>
                <li>Jakarta Selatan, Indonesia</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400 font-mono">
          <div>© 2026 Hallo Group HQ. Seluruh hak cipta dilindungi.</div>
          <div>Standar Akuntansi SAK EMKM · Arsitektur Offline-First</div>
        </div>
      </footer>
    </div>
  )
}
