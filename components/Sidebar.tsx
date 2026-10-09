'use client'

import React, { useState } from 'react'
import {
  LayoutDashboard,
  Store,
  ReceiptText,
  ChefHat,
  Package,
  Truck,
  FileText,
  Calculator,
  Printer,
  Settings,
  CircleDot,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Flame,
  Menu,
  X,
  ShieldCheck,
  UserCog,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import type { Outlet, User as UserType, ModuleFlags, Organization, Role } from '../types/erp'
import { CENTRAL_HQ_OUTLET } from '../lib/store/mockStore'

function getBrandInitials(name?: string): string {
  if (!name || !name.trim()) return 'NB'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getRoleLabel(role: Role): string {
  switch (role) {
    case 'owner':
      return 'Owner / Direktur'
    case 'manager':
      return 'Manager Operasional'
    case 'cashier':
      return 'Kasir'
    case 'kitchen':
      return 'Dapur / Kitchen'
    case 'barista':
      return 'Barista'
    case 'accountant':
      return 'Finance & Akuntan'
    default:
      return role
  }
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'transactions'
  | 'kds'
  | 'inventory'
  | 'roastery'
  | 'purchasing'
  | 'sales_b2b'
  | 'accounting'
  | 'receipt_designer'
  | 'settings'

interface SidebarProps {
  org?: Organization
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  outlets: Outlet[]
  activeOutlet: Outlet
  setActiveOutlet: (outlet: Outlet) => void
  currentUser: UserType
  users: UserType[]
  setCurrentUser: (user: UserType) => void
  onUpdateCurrentUser?: (user: UserType) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  activeOrderCount?: number
  kdsPendingCount?: number
  modulesEnabled?: ModuleFlags
}

interface NavItem {
  id: ActiveTab
  label: string
  shortLabel?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: string | number
  isOptional?: boolean
}

interface NavGroup {
  category: string
  items: NavItem[]
}

export default function Sidebar({
  org,
  activeTab,
  setActiveTab,
  outlets,
  activeOutlet,
  setActiveOutlet,
  currentUser,
  users,
  setCurrentUser,
  onUpdateCurrentUser,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  activeOrderCount = 0,
  kdsPendingCount = 0,
  modulesEnabled,
}: SidebarProps) {
  // USER PROFILE MODAL STATE
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editProfileName, setEditProfileName] = useState(currentUser.name)
  const [editProfilePin, setEditProfilePin] = useState(currentUser.pin)
  const [profileSaved, setProfileSaved] = useState(false)

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!editProfileName.trim()) return
    const updated: UserType = {
      ...currentUser,
      name: editProfileName.trim(),
      pin: editProfilePin.trim() || currentUser.pin,
    }
    setCurrentUser(updated)
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser(updated)
    }
    setProfileSaved(true)
    setTimeout(() => {
      setProfileSaved(false)
      setShowProfileModal(false)
    }, 1200)
  }

  const navGroups: NavGroup[] = [
    {
      category: 'Operasional',
      items: [
        {
          id: 'dashboard',
          label: 'Ringkasan',
          shortLabel: 'Ringkasan',
          icon: LayoutDashboard,
        },
        {
          id: 'pos',
          label: 'Kasir POS',
          shortLabel: 'Kasir',
          icon: Store,
          badge: activeOrderCount > 0 ? activeOrderCount : undefined,
        },
        {
          id: 'transactions',
          label: 'Riwayat Struk',
          shortLabel: 'Riwayat',
          icon: ReceiptText,
        },
        {
          id: 'kds',
          label: 'KDS Dapur',
          shortLabel: 'KDS',
          icon: ChefHat,
          badge: kdsPendingCount > 0 ? kdsPendingCount : undefined,
        },
      ],
    },
    {
      category: 'Inventaris',
      items: [
        {
          id: 'inventory',
          label: 'Bahan Baku & HPP',
          shortLabel: 'Bahan',
          icon: Package,
        },
        {
          id: 'purchasing',
          label: 'Pengadaan Supplier',
          shortLabel: 'Supplier',
          icon: Truck,
        },
        {
          id: 'sales_b2b',
          label: 'Catering & B2B',
          shortLabel: 'Catering',
          icon: FileText,
        },
        ...(modulesEnabled?.batch_production_roasting
          ? [
              {
                id: 'roastery' as ActiveTab,
                label: 'Produksi Roastery',
                shortLabel: 'Roastery',
                icon: Flame,
                isOptional: true,
              },
            ]
          : []),
      ],
    },
    {
      category: 'Keuangan & Sistem',
      items: [
        {
          id: 'accounting',
          label: 'Laporan Keuangan',
          shortLabel: 'Keuangan',
          icon: Calculator,
        },
        {
          id: 'receipt_designer',
          label: 'Format Struk',
          shortLabel: 'Struk',
          icon: Printer,
        },
        {
          id: 'settings',
          label: 'Pengaturan',
          shortLabel: 'Pengaturan',
          icon: Settings,
        },
      ],
    },
  ]

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      {/* TOP BRAND & OUTLET SWITCHER */}
      <div className="p-4 border-b border-[#E5E7EB] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* BRAND LOGO / MONOGRAM BADGE */}
            {org?.logoUrl ? (
              <div
                className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs"
                title={org?.name || 'Brand Logo'}
              >
                <img
                  src={org.logoUrl}
                  alt={org?.name || 'Brand Logo'}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs tracking-tight shrink-0 shadow-2xs"
                title={org?.name || 'Inisial Merek'}
              >
                {getBrandInitials(org?.name)}
              </div>
            )}

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-bold text-sm tracking-tight text-black truncate"
                    title={org?.name || 'NUSANTARA ERP'}
                  >
                    {org?.name || 'NUSANTARA ERP'}
                  </span>
                </div>
                <div
                  className="text-[11px] text-[#6B7280] truncate font-medium"
                  title={org?.legalName || 'Sistem Operasional F&B'}
                >
                  {org?.legalName || 'Sistem Operasional F&B'}
                </div>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* OUTLET SELECTOR */}
        <div className="pt-0.5">
          {isCollapsed ? (
            <div
              title={activeOutlet.id === 'all' ? 'Kantor Pusat (Semua Cabang)' : activeOutlet.name}
              className="w-10 h-10 mx-auto rounded-xl bg-[#F7F7F7] border border-[#E5E7EB] flex items-center justify-center text-neutral-700 cursor-pointer"
            >
              <Building2 size={16} />
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F7F7F7] border border-[#E5E7EB] hover:border-black transition-colors">
                <Building2 size={14} className="text-neutral-500 shrink-0" />
                <select
                  value={activeOutlet.id}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'all') {
                      setActiveOutlet(CENTRAL_HQ_OUTLET)
                    } else {
                      const found = outlets.find((o) => o.id === val)
                      if (found) setActiveOutlet(found)
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none cursor-pointer w-full truncate"
                >
                  <option value="all">Kantor Pusat (Konsolidasi)</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              {activeOutlet.id === 'all' && (
                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900"></span>
                  <span className="truncate">Konsolidasi Multi-Cabang</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COMPLIANCE CHIP */}
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-[10px] font-semibold text-neutral-700">
            <ShieldCheck size={12} className="text-black shrink-0" />
            <span className="truncate">Standar Akuntansi SAK EMKM</span>
          </div>
        )}
      </div>

      {/* NAVIGATION LINKS (GROUPED VERTICALLY - ZERO HORIZONTAL OVERFLOW) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 pb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {group.category}
              </div>
            ) : (
              <div className="h-2" />
            )}

            {group.items.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  title={isCollapsed ? tab.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer min-h-[40px] text-left ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-black text-white font-semibold shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{tab.label}</span>
                      {tab.isOptional && (
                        <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded ml-1 shrink-0">
                          Opsional
                        </span>
                      )}
                      {tab.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1 shrink-0 ${
                            isActive
                              ? 'bg-white text-black'
                              : 'bg-neutral-900 text-white'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* BOTTOM USER ROLE & COLLAPSE TOGGLE */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFAFA] space-y-2">
        {/* LIVE SYNC STATUS */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-neutral-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CircleDot size={10} className="text-emerald-600" />
              <span>Database Terhubung</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">v2.4</span>
          </div>
        )}

        {/* AUTHENTIC USER PROFILE CARD (REPLACES DUMMY PERSONA DROPDOWN) */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => {
              setEditProfileName(currentUser.name)
              setEditProfilePin(currentUser.pin)
              setShowProfileModal(true)
            }}
            title={`${currentUser.name} (${getRoleLabel(currentUser.role)}) · Klik untuk atur profil`}
            className="w-10 h-10 mx-auto rounded-xl bg-white border border-[#E5E7EB] hover:border-black flex items-center justify-center text-neutral-800 transition-colors relative cursor-pointer group shadow-2xs"
          >
            <span className="font-bold text-xs">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
        ) : (
          <div
            onClick={() => {
              setEditProfileName(currentUser.name)
              setEditProfilePin(currentUser.pin)
              setShowProfileModal(true)
            }}
            className="group flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-black transition-all cursor-pointer shadow-2xs"
            title="Klik untuk melihat atau mengedit profil akun Anda"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs relative">
                {currentUser.name.slice(0, 2).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-neutral-900 truncate group-hover:text-black">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-neutral-500 truncate font-medium flex items-center gap-1">
                  <span>{getRoleLabel(currentUser.role)}</span>
                </div>
              </div>
            </div>
            <div className="p-1 rounded-md text-neutral-400 group-hover:text-black transition-colors shrink-0">
              <UserCog size={15} />
            </div>
          </div>
        )}

        {/* DESKTOP COLLAPSE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center gap-2 py-2 rounded-xl text-neutral-500 hover:text-black hover:bg-neutral-200/60 text-xs font-medium transition-colors cursor-pointer"
          title={isCollapsed ? 'Perlebar Sidebar' : 'Perkecil Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Kecilkan Menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. DESKTOP STICKY SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-white border-r border-[#E5E7EB] z-30 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. MOBILE SLIDE-OVER DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. USER PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-black">Profil Akun Saya</h3>
                  <p className="text-[11px] text-neutral-500">
                    Identitas akun Anda yang aktif di sistem saat ini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Nama Akun / Nama Kasir:
                </label>
                <input
                  type="text"
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="Contoh: Akmal Irsyad / Kasir 1"
                  required
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none focus:border-black"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Nama ini akan tercetak pada struk kasir, shift harian, dan riwayat transaksi.
                </p>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Peran & Hak Akses:
                </label>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                  <div className="font-bold text-neutral-800">
                    {getRoleLabel(currentUser.role)}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ● Aktif
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  PIN Otorisasi Kasir & Void (4-6 Digit):
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="password"
                    maxLength={6}
                    value={editProfilePin}
                    onChange={(e) => setEditProfilePin(e.target.value)}
                    placeholder="Contoh: 1234"
                    className="w-full pl-9 p-2.5 rounded-xl border border-neutral-300 text-xs font-mono tracking-widest focus:outline-none focus:border-black"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Digunakan untuk membuka laci kasir, otorisasi void, dan persetujuan diskon.
                </p>
              </div>

              {/* QUICK LINK TO STAFF MANAGEMENT */}
              <div className="pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false)
                    setActiveTab('settings')
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Kelola Seluruh Karyawan & PIN Kasir</span>
                  <ExternalLink size={13} className="text-neutral-500" />
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={!editProfileName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  {profileSaved ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Tersimpan ✓</span>
                    </>
                  ) : (
                    <span>Simpan Profil</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
