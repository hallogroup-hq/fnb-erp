'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Percent,
  Layers,
  Save,
  CreditCard,
  FileText,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Users,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Key,
  Eye,
  EyeOff,
  X,
  Store,
  Image as ImageIcon,
  QrCode,
  MapPin,
  Phone,
} from 'lucide-react'
import type { Organization, ModuleFlags, User, Role, Outlet } from '../types/erp'
import {
  exportEntireDatabaseJson,
  importEntireDatabaseJson,
  clearAllStoredData,
} from '../lib/store/storage'

function getBrandInitials(name?: string): string {
  if (!name || !name.trim()) return 'NB'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface SettingsTabProps {
  org: Organization
  onUpdateOrg: (newOrg: Organization) => void
  users?: User[]
  onUpdateUsers?: (newUsers: User[]) => void
  currentUser?: User
  outlets?: Outlet[]
  onUpdateOutlets?: (newOutlets: Outlet[]) => void
  activeOutlet?: Outlet
  onSelectActiveOutlet?: (outlet: Outlet) => void
}

export default function SettingsTab({
  org,
  onUpdateOrg,
  users = [],
  onUpdateUsers,
  currentUser,
  outlets = [],
  onUpdateOutlets,
  activeOutlet,
  onSelectActiveOutlet,
}: SettingsTabProps) {
  const [currentOrg, setCurrentOrg] = useState<Organization>({
    ...org,
    legalName: org.legalName || 'PT Nusantara Boga Kuliner',
    taxId_NPWP: org.taxId_NPWP || '02.456.789.1-014.000',
    email: org.email || 'finance@nusantarabistro.id',
    bankName: org.bankName || 'BCA (Bank Central Asia)',
    bankAccount: org.bankAccount || '038-777-1922',
    bankHolder: org.bankHolder || 'PT NUSANTARA BOGA KULINER',
    defaultTaxRatePct: org.defaultTaxRatePct ?? 10,
    defaultServiceChargeRatePct: org.defaultServiceChargeRatePct ?? 5,
  })
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'staff' | 'outlets' | 'tax_service' | 'modules' | 'backup'>('profile')
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const [logoUrlInput, setLogoUrlInput] = useState('')
  const [logoFeedback, setLogoFeedback] = useState<string | null>(null)

  // QRIS STATE & REFS
  const qrisFileInputRef = useRef<HTMLInputElement>(null)
  const [qrisUrlInput, setQrisUrlInput] = useState('')
  const [qrisFeedback, setQrisFeedback] = useState<string | null>(null)

  // OUTLET STATE
  const [showAddOutletModal, setShowAddOutletModal] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [outletFormName, setOutletFormName] = useState('')
  const [outletFormCode, setOutletFormCode] = useState('')
  const [outletFormAddress, setOutletFormAddress] = useState('')
  const [outletFormPhone, setOutletFormPhone] = useState('')
  const [outletFormTax, setOutletFormTax] = useState(10)
  const [outletFormService, setOutletFormService] = useState(5)
  const [outletFormTableCount, setOutletFormTableCount] = useState(12)
  const [outletFormActive, setOutletFormActive] = useState(true)
  const [outletError, setOutletError] = useState('')

  useEffect(() => {
    if (org) {
      setCurrentOrg((prev) => ({
        ...prev,
        ...org,
      }))
    }
  }, [org])

  function handleLogoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar (maksimal 2MB). Silakan gunakan file gambar yang lebih kecil.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        const updated = { ...currentOrg, logoUrl: result }
        setCurrentOrg(updated)
        onUpdateOrg(updated)
        setLogoFeedback('Logo berhasil diunggah & diterapkan!')
        setTimeout(() => setLogoFeedback(null), 3500)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleApplyLogoUrl() {
    if (!logoUrlInput.trim()) return
    const updated = { ...currentOrg, logoUrl: logoUrlInput.trim() }
    setCurrentOrg(updated)
    onUpdateOrg(updated)
    setLogoFeedback('URL logo berhasil diterapkan!')
    setTimeout(() => setLogoFeedback(null), 3500)
    setLogoUrlInput('')
  }

  function handleRemoveLogo() {
    const updated = { ...currentOrg, logoUrl: '' }
    setCurrentOrg(updated)
    onUpdateOrg(updated)
    setLogoFeedback('Logo dihapus. Sistem kembali menampilkan inisial teks.')
    setTimeout(() => setLogoFeedback(null), 3500)
  }

  // QRIS UPLOAD & CONFIG HANDLERS
  function handleQrisFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file QRIS terlalu besar (maksimal 2MB). Silakan gunakan file gambar yang lebih kecil.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        const updated = { ...currentOrg, qrisImageUrl: result }
        setCurrentOrg(updated)
        onUpdateOrg(updated)
        setQrisFeedback('QRIS merchant berhasil diunggah!')
        setTimeout(() => setQrisFeedback(null), 3500)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleApplyQrisUrl() {
    if (!qrisUrlInput.trim()) return
    const updated = { ...currentOrg, qrisImageUrl: qrisUrlInput.trim() }
    setCurrentOrg(updated)
    onUpdateOrg(updated)
    setQrisFeedback('URL QRIS merchant berhasil diterapkan!')
    setTimeout(() => setQrisFeedback(null), 3500)
    setQrisUrlInput('')
  }

  function handleRemoveQris() {
    const updated = { ...currentOrg, qrisImageUrl: '' }
    setCurrentOrg(updated)
    onUpdateOrg(updated)
    setQrisFeedback('QRIS merchant dihapus.')
    setTimeout(() => setQrisFeedback(null), 3500)
  }

  // OUTLET CRUD HANDLERS
  function handleOpenAddOutlet() {
    setEditingOutlet(null)
    setOutletFormName('')
    setOutletFormCode(`out-${Date.now().toString().slice(-4)}`)
    setOutletFormAddress('')
    setOutletFormPhone('')
    setOutletFormTax(currentOrg.defaultTaxRatePct ?? 10)
    setOutletFormService(currentOrg.defaultServiceChargeRatePct ?? 5)
    setOutletFormTableCount(12)
    setOutletFormActive(true)
    setOutletError('')
    setShowAddOutletModal(true)
  }

  function handleOpenEditOutlet(outlet: Outlet) {
    setEditingOutlet(outlet)
    setOutletFormName(outlet.name)
    setOutletFormCode(outlet.id)
    setOutletFormAddress(outlet.address || '')
    setOutletFormPhone(outlet.phone || '')
    setOutletFormTax(outlet.receiptConfig?.taxRatePct ?? currentOrg.defaultTaxRatePct ?? 10)
    setOutletFormService(outlet.receiptConfig?.serviceChargeRatePct ?? currentOrg.defaultServiceChargeRatePct ?? 5)
    setOutletFormTableCount(outlet.tableCount || 12)
    setOutletFormActive(outlet.isActive ?? true)
    setOutletError('')
    setShowAddOutletModal(true)
  }

  function handleSaveOutlet(e: React.FormEvent) {
    e.preventDefault()
    if (!outletFormName.trim()) {
      setOutletError('Nama cabang / outlet wajib diisi')
      return
    }

    if (editingOutlet) {
      const updatedList = outlets.map((o) =>
        o.id === editingOutlet.id
          ? {
              ...o,
              name: outletFormName.trim(),
              address: outletFormAddress.trim(),
              phone: outletFormPhone.trim(),
              tableCount: Number(outletFormTableCount) || 12,
              isActive: outletFormActive,
              receiptConfig: {
                ...o.receiptConfig,
                storeName: outletFormName.trim(),
                address: outletFormAddress.trim(),
                phone: outletFormPhone.trim(),
                taxRatePct: Number(outletFormTax) || 0,
                serviceChargeRatePct: Number(outletFormService) || 0,
              },
            }
          : o
      )
      onUpdateOutlets?.(updatedList)
      if (activeOutlet && activeOutlet.id === editingOutlet.id) {
        const updatedActive = updatedList.find((o) => o.id === editingOutlet.id)
        if (updatedActive) onSelectActiveOutlet?.(updatedActive)
      }
    } else {
      const newOutlet: Outlet = {
        id: outletFormCode.trim().toLowerCase().replace(/\s+/g, '-') || `out-${Date.now()}`,
        orgId: currentOrg.id,
        name: outletFormName.trim(),
        code: outletFormCode.trim().toUpperCase() || `OUT-0${outlets.length + 1}`,
        address: outletFormAddress.trim(),
        phone: outletFormPhone.trim(),
        isCentralHub: false,
        tableCount: Number(outletFormTableCount) || 12,
        isActive: outletFormActive,
        receiptConfig: {
          storeName: outletFormName.trim(),
          branchName: outletFormName.trim(),
          legalAddress: outletFormAddress.trim(),
          phone: outletFormPhone.trim(),
          paperWidth: '80mm',
          showTax: true,
          taxRatePct: Number(outletFormTax) || 0,
          showServiceCharge: true,
          serviceChargeRatePct: Number(outletFormService) || 0,
          showModifierDetails: true,
          showCashierName: true,
          customFooterMessage: 'Terima Kasih atas Kunjungan Anda!',
        },
      }
      const updatedList = [...outlets, newOutlet]
      onUpdateOutlets?.(updatedList)
    }

    setShowAddOutletModal(false)
    setEditingOutlet(null)
  }

  function handleDeleteOutlet(outletId: string) {
    if (outlets.length <= 1) {
      alert('Sistem harus memiliki minimal 1 cabang utama dan tidak dapat dihapus.')
      return
    }
    if (!confirm('Apakah Anda yakin ingin menghapus cabang ini? Data transaksi yang terkait mungkin terpengaruh.')) {
      return
    }
    const updatedList = outlets.filter((o) => o.id !== outletId)
    onUpdateOutlets?.(updatedList)
    if (activeOutlet && activeOutlet.id === outletId) {
      onSelectActiveOutlet?.(updatedList[0])
    }
  }

  // STAFF MANAGEMENT STATE
  const [staffList, setStaffList] = useState<User[]>(users)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<User | null>(null)
  const [showPins, setShowPins] = useState<Record<string, boolean>>({})

  // Form states for add/edit modal
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<Role>('cashier')
  const [formPin, setFormPin] = useState('')
  const [formOutletId, setFormOutletId] = useState<string>('')
  const [formActive, setFormActive] = useState<boolean>(true)
  const [formError, setFormError] = useState<string>('')

  useEffect(() => {
    if (users && users.length > 0) {
      setStaffList(users)
    }
  }, [users])

  const roleBadges: Record<Role, { label: string; badge: string; desc: string }> = {
    owner: {
      label: 'Owner / Direktur',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Akses penuh ke semua outlet, pembukuan akuntansi, dan seluruh modul ERP.',
    },
    manager: {
      label: 'Outlet Manager',
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
      desc: 'Otorisasi diskon, pembatalan/void pesanan, pantau shift kasir, dan kelola operasional.',
    },
    cashier: {
      label: 'Kasir Utama',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      desc: 'Operasional POS kasir cepat, pesanan meja, buka/tutup shift laci, dan cetak struk.',
    },
    kitchen: {
      label: 'Koki Dapur',
      badge: 'bg-orange-100 text-orange-900 border-orange-300',
      desc: 'Tampilan Kitchen Display System (KDS), verifikasi resep & pesanan makanan siap saji.',
    },
    barista: {
      label: 'Barista & Bar',
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Tampilan Bar KDS, racik minuman kopi & mocktail, serta pemantauan batch roasting.',
    },
    accountant: {
      label: 'Finance & Akuntan',
      badge: 'bg-slate-100 text-slate-900 border-slate-300',
      desc: 'Buku besar, jurnal umum double-entry, neraca SAK EMKM, dan penagihan B2B.',
    },
  }

  function handleOpenAddStaff() {
    setFormName('')
    setFormRole('cashier')
    setFormPin('')
    setFormOutletId('')
    setFormActive(true)
    setFormError('')
    setShowAddStaffModal(true)
  }

  function handleOpenEditStaff(u: User) {
    setEditingStaff(u)
    setFormName(u.name)
    setFormRole(u.role)
    setFormPin(u.pin)
    setFormOutletId(u.outletId || '')
    setFormActive(u.active)
    setFormError('')
  }

  function handleSaveStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Nama lengkap karyawan wajib diisi')
      return
    }
    const cleanPin = formPin.replace(/\D/g, '')
    if (cleanPin.length < 4) {
      setFormError('PIN otorisasi minimal 4 digit angka')
      return
    }

    if (editingStaff) {
      const updated = staffList.map((u) =>
        u.id === editingStaff.id
          ? {
              ...u,
              name: formName.trim(),
              role: formRole,
              pin: cleanPin,
              outletId: formOutletId || undefined,
              active: formActive,
            }
          : u
      )
      setStaffList(updated)
      if (onUpdateUsers) onUpdateUsers(updated)
      setEditingStaff(null)
    } else {
      const newStaff: User = {
        id: `usr-${Date.now()}`,
        orgId: org.id,
        name: formName.trim(),
        role: formRole,
        pin: cleanPin,
        outletId: formOutletId || undefined,
        active: formActive,
      }
      const updated = [...staffList, newStaff]
      setStaffList(updated)
      if (onUpdateUsers) onUpdateUsers(updated)
      setShowAddStaffModal(false)
    }
  }

  function handleDeleteStaff(userId: string) {
    const target = staffList.find((u) => u.id === userId)
    if (!target) return

    const activeOwners = staffList.filter((u) => u.role === 'owner' && u.active)
    if (target.role === 'owner' && activeOwners.length <= 1) {
      alert('Tidak dapat menghapus Owner terakhir! Sistem membutuhkan setidaknya 1 akun Owner aktif.')
      return
    }

    if (confirm(`Apakah Anda yakin ingin menghapus staf "${target.name}" (${target.role.toUpperCase()})? Data ini akan dihapus permanen.`)) {
      const updated = staffList.filter((u) => u.id !== userId)
      setStaffList(updated)
      if (onUpdateUsers) onUpdateUsers(updated)
    }
  }

  function handleExportBackup() {
    const jsonStr = exportEntireDatabaseJson()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fnb_erp_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (!content) return
      const success = importEntireDatabaseJson(content)
      if (success) {
        alert('Data backup berhasil diimpor! Halaman akan dimuat ulang.')
        window.location.reload()
      } else {
        alert('Gagal membaca file JSON backup. Pastikan format valid.')
      }
    }
    reader.readAsText(file)
  }

  function handleResetAll() {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin menghapus semua data lokal dan mengembalikan ke demo awal?')) {
      clearAllStoredData()
      window.location.reload()
    }
  }

  const moduleLabels: { key: keyof ModuleFlags; label: string; desc: string; category: string }[] = [
    {
      key: 'pos_quick_service',
      label: 'POS Kasir Cepat (Counter / Bar)',
      desc: 'Transaksi kilat kasir sentuh, pembayaran tunai numpad, QRIS, dan cetak struk thermal.',
      category: 'Front of House',
    },
    {
      key: 'pos_dine_in_tables',
      label: 'Manajemen Meja & Dine-In (Table Floor Map)',
      desc: 'Denah meja visual, open tab, split bill per-item, dan penggabungan meja.',
      category: 'Front of House',
    },
    {
      key: 'kitchen_routing_kds',
      label: 'Kitchen Display System (KDS)',
      desc: 'Routing pesanan otomatis ke stasiun Dapur Makanan atau Bar Minuman.',
      category: 'Front of House',
    },
    {
      key: 'inventory_basic',
      label: 'Inventori Dasar & Kartu Stok',
      desc: 'Pencatatan stok masuk, stok keluar, dan batas minimum stok bahan.',
      category: 'Supply Chain',
    },
    {
      key: 'inventory_recipes_hpp',
      label: 'Formula Resep (BOM) & HPP Realtime',
      desc: 'Resep bertingkat, substitusi modifier bahan, dan HPP moving average.',
      category: 'Supply Chain',
    },
    {
      key: 'multi_warehouse_transfer',
      label: 'Multi-Gudang & Surat Jalan Transfer Stok',
      desc: 'Gudang pusat ke outlet dengan status in-transit dan validasi penerimaan.',
      category: 'Supply Chain',
    },
    {
      key: 'batch_production_roasting',
      label: 'Dapur Produksi & Batch Roasting (Work Order)',
      desc: 'Pencatatan SPK sangrai dengan susut bobot (yield loss %) dan HPP baru.',
      category: 'Supply Chain',
    },
    {
      key: 'b2b_wholesale_invoicing',
      label: 'Penjualan Grosir B2B, Catering & Piutang (AR)',
      desc: 'Faktur komersial B2B, surat jalan delivery order, termin tempo, dan laporan umur piutang.',
      category: 'Commercial',
    },
    {
      key: 'accurate_grade_accounting',
      label: 'Akuntansi Double-Entry (Accurate-Grade)',
      desc: 'Buku besar otomatis, SAK EMKM COA, Laba Rugi, Neraca, dan Tutup Buku.',
      category: 'Accounting',
    },
    {
      key: 'fixed_assets',
      label: 'Aset Tetap & Depresiasi Otomatis',
      desc: 'Katalog mesin espresso/peralatan dapur dan jurnal penyusutan bulanan otomatis.',
      category: 'Accounting',
    },
    {
      key: 'bank_reconciliation',
      label: 'Kas, Bank & Rekonsiliasi Bank',
      desc: 'Multi-rekening operasional dan pencocokan mutasi rekening koran.',
      category: 'Accounting',
    },
    {
      key: 'live_excel_export',
      label: 'Ekspor Excel Berformula Hidup (Live Formula)',
      desc: 'Download laporan spreadsheet dengan rumus Excel asli (=SUM, =IF, margin %).',
      category: 'Reporting',
    },
    {
      key: 'official_pdf_export',
      label: 'Dokumen PDF Resmi Berstandar Audit',
      desc: 'Pencetakan Faktur B2B, Surat Jalan, PO, dan Laporan Keuangan resmi.',
      category: 'Reporting',
    },
  ]

  function applyTier(tier: 'starter' | 'pro' | 'enterprise') {
    let mods: ModuleFlags
    if (tier === 'starter') {
      mods = {
        pos_quick_service: true,
        pos_dine_in_tables: false,
        kitchen_routing_kds: false,
        inventory_basic: true,
        inventory_recipes_hpp: false,
        multi_warehouse_transfer: false,
        batch_production_roasting: false,
        b2b_wholesale_invoicing: false,
        accurate_grade_accounting: false,
        fixed_assets: false,
        bank_reconciliation: false,
        live_excel_export: false,
        official_pdf_export: false,
      }
    } else if (tier === 'pro') {
      mods = {
        pos_quick_service: true,
        pos_dine_in_tables: true,
        kitchen_routing_kds: true,
        inventory_basic: true,
        inventory_recipes_hpp: true,
        multi_warehouse_transfer: false,
        batch_production_roasting: false,
        b2b_wholesale_invoicing: false,
        accurate_grade_accounting: true,
        fixed_assets: false,
        bank_reconciliation: true,
        live_excel_export: true,
        official_pdf_export: true,
      }
    } else {
      mods = {
        pos_quick_service: true,
        pos_dine_in_tables: true,
        kitchen_routing_kds: true,
        inventory_basic: true,
        inventory_recipes_hpp: true,
        multi_warehouse_transfer: true,
        batch_production_roasting: true,
        b2b_wholesale_invoicing: true,
        accurate_grade_accounting: true,
        fixed_assets: true,
        bank_reconciliation: true,
        live_excel_export: true,
        official_pdf_export: true,
      }
    }

    setCurrentOrg({
      ...currentOrg,
      subscriptionPlan: tier,
      modules: mods,
    })
  }

  function toggleModule(key: keyof ModuleFlags) {
    setCurrentOrg({
      ...currentOrg,
      modules: {
        ...currentOrg.modules,
        [key]: !currentOrg.modules[key],
      },
    })
  }

  function handleSave() {
    onUpdateOrg(currentOrg)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* HEADER & TOP SAVE BUTTON */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Pengaturan Sistem
          </h1>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
        >
          {saved ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Save size={14} />}
          <span>{saved ? 'Tersimpan ✓' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      {/* SUB-NAVIGATION PILLS */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Building2 size={14} />
          <span>Profil & Rekening</span>
        </button>

        <button
          onClick={() => setActiveSubTab('outlets')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'outlets'
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Store size={14} />
          <span>Cabang & Outlet ({outlets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('staff')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'staff'
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Users size={14} />
          <span>Kelola Karyawan & PIN ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tax_service')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'tax_service'
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Percent size={14} />
          <span>Pajak & Layanan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('modules')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'modules'
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Layers size={14} />
          <span>Paket Modul ERP</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'backup'
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <HardDrive size={14} />
          <span>Penyimpanan & Data</span>
        </button>
      </div>

      {/* TAB 1: PROFIL RESTORAN, PERBANKAN & QRIS */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BRANDING & LOGO SECTION (FULL WIDTH) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <Store size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-black">Branding & Logo Merek Usaha</h3>
                  <p className="text-[11px] text-neutral-500">
                    Kustomisasi identitas visual resto. Logo dan nama merek otomatis tampil pada Sidebar, Dokumen Resmi, dan Struk Kasir.
                  </p>
                </div>
              </div>
            </div>

            {logoFeedback && (
              <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 font-semibold text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={15} className="text-black shrink-0" />
                <span>{logoFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* PREVIEW KIRI: TAMPILAN DI SIDEBAR HEADER */}
              <div className="lg:col-span-5 bg-[#F8F7F4] rounded-xl p-4 border border-neutral-200 space-y-2.5">
                <div className="text-[11px] font-bold text-neutral-600">
                  <span>Pratinjau Sudut Kiri Atas (Sidebar)</span>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-3 flex items-center gap-3 shadow-2xs">
                  {currentOrg.logoUrl ? (
                    <div
                      className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs"
                      title={currentOrg.name || 'Brand Logo'}
                    >
                      <img
                        src={currentOrg.logoUrl}
                        alt="Logo Merek"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs tracking-tight shrink-0 shadow-2xs"
                      title={currentOrg.name || 'Inisial Merek'}
                    >
                      {getBrandInitials(currentOrg.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm tracking-tight text-black truncate">
                      {currentOrg.name || 'Nama Merek Usaha'}
                    </div>
                    <div className="text-[11px] text-[#6B7280] truncate font-medium">
                      {currentOrg.legalName || 'Sistem Operasional F&B'}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500">
                  Nama dan logo di atas tersinkronisasi langsung ke sistem.
                </p>
              </div>

              {/* CONTROLS KANAN: PILIH FILE ATAU URL */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1.5">
                    Unggah Logo Brand (PNG, JPG, WebP, SVG)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      <Upload size={14} />
                      <span>{currentOrg.logoUrl ? 'Ganti File Logo' : 'Pilih File Logo'}</span>
                    </button>

                    {currentOrg.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Hapus Logo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1.5">
                    Disarankan gambar rasio persegi 1:1, latar transparan (PNG/SVG), maksimal 2 MB.
                  </p>
                </div>

                {/* ATAU URL */}
                <div className="pt-3 border-t border-neutral-100 space-y-1.5">
                  <label className="font-semibold text-neutral-700 block">
                    Atau Masukkan Tautan (URL) Logo Gambar:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="https://contoh.com/assets/logo-brand.png"
                      className="flex-1 p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      disabled={!logoUrlInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-black disabled:opacity-40 text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
                    >
                      Terapkan URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QRIS PEMBAYARAN USAHA (MERCHANT QRIS) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-black">QRIS Pembayaran Usaha (Merchant QRIS)</h3>
                  <p className="text-[11px] text-neutral-500">
                    Masukkan gambar kode QRIS resmi bisnis Anda (BCA, Mandiri, GoPay, OVO, dll). Ditampilkan dalam modal kasir saat pelanggan memilih pembayaran QRIS.
                  </p>
                </div>
              </div>
            </div>

            {qrisFeedback && (
              <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 font-semibold text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={15} className="text-black shrink-0" />
                <span>{qrisFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* PREVIEW QRIS */}
              <div className="lg:col-span-4 bg-[#F8F7F4] rounded-xl p-4 border border-neutral-200 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[11px] font-bold text-neutral-600 block">
                  Pratinjau QRIS Usaha
                </span>

                <div className="w-36 h-36 bg-white rounded-xl border border-neutral-300 p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                  {currentOrg.qrisImageUrl ? (
                    <img
                      src={currentOrg.qrisImageUrl}
                      alt="Merchant QRIS"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-neutral-400 space-y-1">
                      <QrCode size={40} className="mx-auto text-neutral-300" />
                      <span className="text-[10px] block font-medium">Belum Ada QRIS</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-semibold text-neutral-800">
                  {currentOrg.name || 'Nama Merek'}
                </div>
              </div>

              {/* UPLOAD & URL CONTROLS */}
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1.5">
                    Unggah Gambar QRIS Resmi (PNG, JPG, WebP)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={qrisFileInputRef}
                      onChange={handleQrisFileUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => qrisFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      <Upload size={14} />
                      <span>{currentOrg.qrisImageUrl ? 'Ganti Gambar QRIS' : 'Pilih Gambar QRIS'}</span>
                    </button>

                    {currentOrg.qrisImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveQris}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Hapus QRIS</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1.5">
                    Unggah screenshot atau file QRIS dari m-Banking / penyedia merchant Anda (maksimal 2 MB).
                  </p>
                </div>

                {/* ATAU URL */}
                <div className="pt-3 border-t border-neutral-100 space-y-1.5">
                  <label className="font-semibold text-neutral-700 block">
                    Atau Masukkan Tautan (URL) Gambar QRIS:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={qrisUrlInput}
                      onChange={(e) => setQrisUrlInput(e.target.value)}
                      placeholder="https://contoh.com/assets/qris-bca.png"
                      className="flex-1 p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyQrisUrl}
                      disabled={!qrisUrlInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-black disabled:opacity-40 text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
                    >
                      Terapkan URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* IDENTITAS BADAN USAHA */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Building2 size={16} className="text-neutral-700" />
              <div>
                <h3 className="font-bold text-sm text-black">Identitas Resto & Badan Hukum</h3>
                <p className="text-[11px] text-neutral-500">
                  Data ini dicetak pada Kop Dokumen, Faktur Pajak B2B, PO Supplier, dan Struk.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-neutral-700 block">
                  Nama Merek / Brand Usaha
                </label>
                <input
                  value={currentOrg.name}
                  onChange={(e) => {
                    const val = e.target.value
                    const updated = { ...currentOrg, name: val }
                    setCurrentOrg(updated)
                    onUpdateOrg(updated)
                  }}
                  placeholder="Misal: Sukha Kopi"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Nama Entitas Legal (PT / CV)</label>
                <input
                  value={currentOrg.legalName || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    const updated = { ...currentOrg, legalName: val }
                    setCurrentOrg(updated)
                    onUpdateOrg(updated)
                  }}
                  placeholder="Misal: PT Nusantara Boga Kuliner"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Nomor Pokok Wajib Pajak (NPWP)</label>
                <input
                  value={currentOrg.taxId_NPWP || ''}
                  onChange={(e) => setCurrentOrg({ ...currentOrg, taxId_NPWP: e.target.value })}
                  placeholder="02.456.789.1-014.000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Alamat Kantor / Outlet Pusat</label>
                <textarea
                  rows={2}
                  value={currentOrg.address}
                  onChange={(e) => setCurrentOrg({ ...currentOrg, address: e.target.value })}
                  placeholder="Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700">No. Telepon / Hotline</label>
                  <input
                    value={currentOrg.phone}
                    onChange={(e) => setCurrentOrg({ ...currentOrg, phone: e.target.value })}
                    placeholder="+62 21-7234-8899"
                    className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Email Operasional</label>
                  <input
                    value={currentOrg.email || ''}
                    onChange={(e) => setCurrentOrg({ ...currentOrg, email: e.target.value })}
                    placeholder="finance@nusantarabistro.id"
                    className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* REKENING BANK RESMI UNTUK TAGIHAN */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <CreditCard size={16} className="text-neutral-700" />
              <div>
                <h3 className="font-bold text-sm text-black">Instruksi Pembayaran & Rekening Bank</h3>
                <p className="text-[11px] text-neutral-500">
                  Rekening transfer yang tertera pada Faktur B2B dan surat penagihan piutang.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-neutral-700">Nama Bank Rekening Utama</label>
                <input
                  value={currentOrg.bankName || ''}
                  onChange={(e) => setCurrentOrg({ ...currentOrg, bankName: e.target.value })}
                  placeholder="BCA (Bank Central Asia)"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Nomor Rekening Bank</label>
                <input
                  value={currentOrg.bankAccount || ''}
                  onChange={(e) => setCurrentOrg({ ...currentOrg, bankAccount: e.target.value })}
                  placeholder="038-777-1922"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black font-mono font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Atas Nama Rekening (Account Holder)</label>
                <input
                  value={currentOrg.bankHolder || ''}
                  onChange={(e) => setCurrentOrg({ ...currentOrg, bankHolder: e.target.value })}
                  placeholder="PT NUSANTARA BOGA KULINER"
                  className="w-full mt-1 p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black uppercase"
                />
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 mt-4">
                <span className="font-bold text-neutral-900 block">Preview Instruksi Pembayaran:</span>
                <div className="text-[11px] text-neutral-600 space-y-0.5">
                  <div>Bank: <strong className="text-neutral-900">{currentOrg.bankName || 'BCA'}</strong></div>
                  <div>No. Rek: <strong className="text-neutral-900 font-mono">{currentOrg.bankAccount || '-'}</strong></div>
                  <div>A.N.: <strong className="text-neutral-900">{currentOrg.bankHolder || '-'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: KELOLA CABANG & OUTLET */}
      {activeSubTab === 'outlets' && (
        <div className="space-y-6">
          {/* HEADER & ACTION */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Store size={18} className="text-neutral-900" />
                <h3 className="font-bold text-base text-black">Kelola Cabang & Outlet Multi-Store</h3>
              </div>
              <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
                Atur konfigurasi multi-cabang usaha Anda. Tentukan alamat, nomor kontak, jumlah meja dine-in, tarif pajak PB1, dan service charge untuk masing-masing cabang.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddOutlet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
            >
              <Plus size={15} />
              <span>+ Tambah Cabang Baru</span>
            </button>
          </div>

          {/* GRID OF OUTLETS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlets.map((outlet) => {
              const isCurrentActive = activeOutlet?.id === outlet.id
              return (
                <div
                  key={outlet.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                    isCurrentActive
                      ? 'border-black ring-1 ring-black shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-black truncate">{outlet.name}</h4>
                          {isCurrentActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black text-white shrink-0">
                              Cabang Aktif
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                          ID: {outlet.id}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          outlet.isActive !== false
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {outlet.isActive !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-neutral-400 shrink-0 mt-0.5" />
                        <span className="truncate">{outlet.address || 'Alamat belum diatur'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-neutral-400 shrink-0" />
                        <span>{outlet.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                        <span>Kapasitas Meja:</span>
                        <strong className="text-neutral-900">{outlet.tableCount || 12} Meja</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Pajak Resto (PB1):</span>
                        <strong className="text-neutral-900">{outlet.receiptConfig?.taxRatePct ?? 10}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Service Charge:</span>
                        <strong className="text-neutral-900">{outlet.receiptConfig?.serviceChargeRatePct ?? 5}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    {!isCurrentActive ? (
                      <button
                        type="button"
                        onClick={() => onSelectActiveOutlet?.(outlet)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer text-center"
                      >
                        Pilih Cabang Ini
                      </button>
                    ) : (
                      <div className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-50 text-neutral-400 font-semibold text-xs text-center border border-neutral-200">
                        Sedang Digunakan
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditOutlet(outlet)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Edit Cabang"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOutlet(outlet.id)}
                        disabled={outlets.length <= 1}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
                        title={outlets.length <= 1 ? 'Minimal 1 cabang wajib tersedia' : 'Hapus Cabang'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: KELOLA KARYAWAN & OTORISASI PIN */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          {/* HEADER & ACTION */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-neutral-900" />
                <h3 className="font-bold text-base text-black">Kelola Karyawan & Otorisasi PIN</h3>
              </div>
              <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
                Kelola profil seluruh staf operasional, tetapkan hak akses peran (Owner, Manager, Kasir, Dapur, Barista, Akuntan), penempatan outlet, serta 4-digit PIN otorisasi kasir.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddStaff}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
            >
              <Plus size={15} />
              <span>+ Tambah Karyawan</span>
            </button>
          </div>

          {/* FILTER ROLE PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: `Semua Karyawan (${staffList.length})` },
              { id: 'owner', label: `Owner (${staffList.filter((u) => u.role === 'owner').length})` },
              { id: 'manager', label: `Manager (${staffList.filter((u) => u.role === 'manager').length})` },
              { id: 'cashier', label: `Kasir (${staffList.filter((u) => u.role === 'cashier').length})` },
              { id: 'kitchen', label: `Dapur (${staffList.filter((u) => u.role === 'kitchen').length})` },
              { id: 'barista', label: `Barista (${staffList.filter((u) => u.role === 'barista').length})` },
              { id: 'accountant', label: `Finance (${staffList.filter((u) => u.role === 'accountant').length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedRoleFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedRoleFilter === f.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-black'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* STAFF LIST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList
              .filter((u) => selectedRoleFilter === 'all' || u.role === selectedRoleFilter)
              .map((u) => {
                const badgeInfo = roleBadges[u.role] || {
                  label: u.role.toUpperCase(),
                  badge: 'bg-neutral-100 text-neutral-800 border-neutral-300',
                  desc: '',
                }
                const isCurrent = currentUser?.id === u.id
                const outletAssigned = outlets.find((o) => o.id === u.outletId)
                const isPinVisible = Boolean(showPins[u.id])

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-xs ${
                      isCurrent
                        ? 'border-neutral-900 ring-1 ring-neutral-900'
                        : u.active
                        ? 'border-neutral-200'
                        : 'border-neutral-200 opacity-60 bg-neutral-50/50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* CARD TOP: AVATAR & NAME */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-300">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                              <Store size={11} className="text-neutral-400" />
                              <span>{outletAssigned ? outletAssigned.name : 'Semua Outlet (Pusat)'}</span>
                            </div>
                          </div>
                        </div>

                        {/* STATUS BADGE */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                          }`}
                        >
                          {u.active ? '● Aktif' : '○ Nonaktif'}
                        </span>
                      </div>

                      {/* ROLE BADGE & DESC */}
                      <div>
                        <span
                          className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${badgeInfo.badge}`}
                        >
                          {badgeInfo.label}
                        </span>
                        <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                          {badgeInfo.desc}
                        </p>
                      </div>

                      {/* PIN OTORISASI KASIR */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Key size={13} className="text-neutral-400" />
                          <span className="font-medium text-[11px]">PIN Otorisasi:</span>
                          <span className="font-mono font-bold tracking-widest text-black">
                            {isPinVisible ? u.pin : '••••'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPins((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                          }
                          className="p-1 rounded text-neutral-400 hover:text-black cursor-pointer transition-colors"
                          title={isPinVisible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                        >
                          {isPinVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* CARD FOOTER: ACTIONS */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStaff(u)}
                        className="py-1.5 px-3 rounded-lg border border-neutral-200 bg-white hover:border-black text-neutral-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(u.id)}
                        className="py-1.5 px-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Hapus Karyawan"
                      >
                        <Trash2 size={12} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>

          {staffList.filter((u) => selectedRoleFilter === 'all' || u.role === selectedRoleFilter).length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 space-y-2">
              <Users size={24} className="mx-auto text-neutral-400" />
              <p className="font-bold text-sm text-neutral-800">Tidak ada karyawan pada filter ini</p>
              <p className="text-xs text-neutral-400">Tambahkan karyawan baru dengan menekan tombol di atas.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT KARYAWAN */}
      {(showAddStaffModal || editingStaff) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-black" />
                <h3 className="font-bold text-base text-black">
                  {editingStaff ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddStaffModal(false)
                  setEditingStaff(null)
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Nama Lengkap Karyawan:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Rahmat Hidayat"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Peran / Jabatan & Hak Akses:
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Role)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black bg-white cursor-pointer"
                >
                  <option value="owner">Owner / Direktur (Akses Penuh Seluruh Modul & Outlet)</option>
                  <option value="manager">Outlet Manager (Operasional, Approval Void, Diskon, Laporan)</option>
                  <option value="cashier">Kasir Utama (POS Cepat, Shift Kasir, Cetak Struk)</option>
                  <option value="kitchen">Koki Dapur (Tampilan KDS & Resep Makanan)</option>
                  <option value="barista">Barista & Bar (Tampilan KDS Minuman & Roastery)</option>
                  <option value="accountant">Finance & Akuntan (Buku Besar, Jurnal, Neraca SAK EMKM)</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {roleBadges[formRole]?.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    PIN Kasir (4-6 Digit Angka):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 1234"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-mono font-bold tracking-widest text-center focus:outline-none focus:border-black"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Digunakan untuk login cepat & otorisasi kasir.</p>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Penempatan Outlet:
                  </label>
                  <select
                    value={formOutletId}
                    onChange={(e) => setFormOutletId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black bg-white cursor-pointer"
                  >
                    <option value="">Semua Outlet (Pusat / Global)</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <div>
                  <div className="font-bold text-neutral-900">Status Akun Karyawan</div>
                  <div className="text-[11px] text-neutral-500">
                    Karyawan nonaktif tidak dapat login ke sistem kasir.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(false)
                    setEditingStaff(null)
                  }}
                  className="py-2.5 px-4 rounded-xl border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {editingStaff ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PAJAK RESTORAN & SERVICE CHARGE */}
      {activeSubTab === 'tax_service' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6 text-xs max-w-3xl">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-sm text-black">Ketentuan Pajak Daerah Restoran (PB1) & Biaya Layanan</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Tarif Pajak Barang dan Jasa Tertentu (PBJT) Jasa Kesenian dan Hiburan / Makanan dan Minuman sesuai UU HKPD No. 1 Tahun 2022.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PAJAK PB1 */}
            <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900">Pajak Restoran (PB1 / PBJT)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Standar Pemda
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Pajak daerah restoran yang dipungut dari konsumen atas konsumsi makanan dan minuman di tempat.
              </p>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Persentase Tarif PB1 (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={currentOrg.defaultTaxRatePct ?? 10}
                    onChange={(e) => setCurrentOrg({ ...currentOrg, defaultTaxRatePct: Number(e.target.value) || 0 })}
                    className="w-24 p-2 rounded-xl border border-neutral-200 bg-white font-bold text-sm text-center focus:outline-none focus:border-black"
                  />
                  <span className="text-sm font-semibold text-neutral-600">%</span>
                </div>
              </div>
            </div>

            {/* SERVICE CHARGE */}
            <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900">Biaya Layanan (Service Charge)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-800">
                  Dine-in Service
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Biaya jasa pelayan resto untuk reservasi meja, waiter, banquet, atau floor service.
              </p>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Persentase Service Charge (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={currentOrg.defaultServiceChargeRatePct ?? 5}
                    onChange={(e) => setCurrentOrg({ ...currentOrg, defaultServiceChargeRatePct: Number(e.target.value) || 0 })}
                    className="w-24 p-2 rounded-xl border border-neutral-200 bg-white font-bold text-sm text-center focus:outline-none focus:border-black"
                  />
                  <span className="text-sm font-semibold text-neutral-600">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULASI KALKULASI BILL */}
          <div className="p-4 rounded-xl bg-neutral-100/70 border border-neutral-200 space-y-2">
            <span className="font-bold text-xs text-neutral-900 block">Simulasi Perhitungan Tagihan (Contoh Pesanan Rp 100.000):</span>
            <div className="grid grid-cols-4 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-neutral-500">Subtotal Makanan:</span>
                <div className="font-semibold text-neutral-900">Rp 100.000</div>
              </div>
              <div>
                <span className="text-neutral-500">Service ({currentOrg.defaultServiceChargeRatePct ?? 5}%):</span>
                <div className="font-semibold text-neutral-900">
                  Rp {(100000 * ((currentOrg.defaultServiceChargeRatePct ?? 5) / 100)).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <span className="text-neutral-500">PB1 ({currentOrg.defaultTaxRatePct ?? 10}%):</span>
                <div className="font-semibold text-neutral-900">
                  Rp {Math.round((100000 + 100000 * ((currentOrg.defaultServiceChargeRatePct ?? 5) / 100)) * ((currentOrg.defaultTaxRatePct ?? 10) / 100)).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <span className="text-neutral-500">Total Konsumen:</span>
                <div className="font-bold text-black">
                  Rp {Math.round(100000 + (100000 * ((currentOrg.defaultServiceChargeRatePct ?? 5) / 100)) + ((100000 + 100000 * ((currentOrg.defaultServiceChargeRatePct ?? 5) / 100)) * ((currentOrg.defaultTaxRatePct ?? 10) / 100))).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAKET LISENSI SAAS & GRANULAR FLAGS */}
      {activeSubTab === 'modules' && (
        <div className="space-y-6">
          {/* 3 PRESET TIERS SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'starter',
                name: 'Paket Starter (Kios / Booth)',
                desc: 'Untuk kedai kopi kecil atau booth grab-and-go yang hanya butuh kasir cepat.',
                highlight: 'POS Cepat + Stok Sederhana',
              },
              {
                id: 'pro',
                name: 'Paket Pro (Cafe / Resto 1 Cabang)',
                desc: 'Untuk cafe dine-in yang butuh meja, KDS dapur, resep HPP, dan laporan akuntansi.',
                highlight: '+ Meja, KDS, HPP & Akuntansi',
              },
              {
                id: 'enterprise',
                name: 'Paket Enterprise (Multi-Cabang & Roastery)',
                desc: 'Solusi lengkap multi-cabang, dapur produksi/sangrai, surat jalan, dan audit finansial penuh.',
                highlight: 'Full Integrated ERP Suite',
              },
            ].map((t) => {
              const isSelected = currentOrg.subscriptionPlan === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => applyTier(t.id as 'starter' | 'pro' | 'enterprise')}
                  className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-black ring-2 ring-black bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-black">{t.name}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-black" />}
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-neutral-100 text-[11px] font-bold text-neutral-800">
                    Fitur: {t.highlight}
                  </div>
                </button>
              )
            })}
          </div>

          {/* INDIVIDUAL FEATURE FLAGS TOGGLES */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-black">Aktivasi Modul Spesifik (Granular Flags)</h2>
                <span className="text-xs text-neutral-500">
                  Ubah aktivasi fitur secara individual sesuai kebutuhan kontrak klien B2B Anda.
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
                {Object.values(currentOrg.modules).filter(Boolean).length} / {moduleLabels.length} Modul Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {moduleLabels.map((m) => {
                const isEnabled = currentOrg.modules[m.key]
                return (
                  <div
                    key={m.key}
                    onClick={() => toggleModule(m.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'border-black/30 bg-neutral-50/80'
                        : 'border-neutral-200 bg-white opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{m.label}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">{m.desc}</p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {}} // handled by parent onClick
                      className="rounded mt-0.5"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PENYIMPANAN DATA & BACKUP JSON */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6">
          {/* STATUS PENYIMPANAN ENGINE */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <HardDrive size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-neutral-900">
                    Penyimpanan Lokal (LocalStorage)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Data menu, meja, transaksi, dan stok tersimpan otomatis di browser ini.
                </p>
              </div>
            </div>
          </div>

          {/* BACKUP & RESTORE ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* EXPORT BACKUP */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 mb-3">
                  <Download size={18} />
                </div>
                <h4 className="font-bold text-sm text-neutral-900">
                  Ekspor Database JSON
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Unduh cadangan data sistem dalam format JSON.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download size={14} />
                <span>Unduh Backup (.json)</span>
              </button>
            </div>

            {/* IMPORT RESTORE */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 mb-3">
                  <Upload size={18} />
                </div>
                <h4 className="font-bold text-sm text-neutral-900">
                  Impor Database JSON
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Pulihkan data dari file cadangan JSON yang tersimpan.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Pilih File Backup JSON</span>
                </button>
              </div>
            </div>

            {/* RESET DATABASE */}
            <div className="bg-white rounded-2xl border border-red-200 p-6 flex flex-col justify-between space-y-4 bg-red-50/20">
              <div>
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-3">
                  <AlertTriangle size={18} />
                </div>
                <h4 className="font-bold text-sm text-red-950">
                  Reset ke Data Default Demo
                </h4>
                <p className="text-xs text-red-800/80 mt-1.5 leading-relaxed">
                  Hapus seluruh data yang tersimpan di browser ini dan pulihkan kembali ke sampel data demo standar (Nusantara Bistro).
                </p>
              </div>

              <button
                onClick={handleResetAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Semua Data Lokal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT CABANG OUTLET */}
      {showAddOutletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-neutral-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-black" />
                <h3 className="font-bold text-base text-black">
                  {editingOutlet ? 'Edit Konfigurasi Cabang' : 'Tambah Cabang Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddOutletModal(false)
                  setEditingOutlet(null)
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {outletError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{outletError}</span>
              </div>
            )}

            <form onSubmit={handleSaveOutlet} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Nama Cabang / Outlet:
                  </label>
                  <input
                    type="text"
                    value={outletFormName}
                    onChange={(e) => setOutletFormName(e.target.value)}
                    placeholder="Contoh: Outlet Senopati"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Kode / ID Outlet:
                  </label>
                  <input
                    type="text"
                    value={outletFormCode}
                    onChange={(e) => setOutletFormCode(e.target.value)}
                    placeholder="Contoh: out-senopati"
                    disabled={!!editingOutlet}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-mono font-medium focus:outline-none focus:border-black disabled:bg-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Alamat Lengkap Cabang:
                </label>
                <textarea
                  rows={2}
                  value={outletFormAddress}
                  onChange={(e) => setOutletFormAddress(e.target.value)}
                  placeholder="Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    No. Telepon / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={outletFormPhone}
                    onChange={(e) => setOutletFormPhone(e.target.value)}
                    placeholder="+62 21-7234-8899"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Jumlah Meja Dine-in:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={outletFormTableCount}
                    onChange={(e) => setOutletFormTableCount(Number(e.target.value) || 12)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Tarif Pajak Resto PB1 (%):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={outletFormTax}
                    onChange={(e) => setOutletFormTax(Number(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Tarif Service Charge (%):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={outletFormService}
                    onChange={(e) => setOutletFormService(Number(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 font-semibold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <div>
                  <div className="font-bold text-neutral-900">Status Operasional Cabang</div>
                  <div className="text-[11px] text-neutral-500">
                    Cabang aktif dapat dipilih untuk operasional kasir & penjualan.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outletFormActive}
                    onChange={(e) => setOutletFormActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddOutletModal(false)
                    setEditingOutlet(null)
                  }}
                  className="py-2.5 px-4 rounded-xl border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {editingOutlet ? 'Simpan Perubahan' : 'Tambah Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
