'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Package,
  Layers,
  Calculator,
  History,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  Search,
  Filter,
  Sliders,
  TrendingDown,
  ArrowRight,
  Coffee,
  X,
  FileSpreadsheet,
  Building2,
} from 'lucide-react'
import type { InventoryItem, Recipe, StockMovement, MenuItem, Outlet } from '../types/erp'
import ExcelJS from 'exceljs'

interface InventoryTabProps {
  inventory: InventoryItem[]
  recipes: Recipe[]
  menuItems: MenuItem[]
  movements: StockMovement[]
  activeOutlet?: Outlet
  outlets?: Outlet[]
  onSelectOutlet?: (outlet: Outlet) => void
  onAddInventoryItem: (item: InventoryItem) => void
  onUpdateInventoryItem?: (item: InventoryItem) => void
  onDeleteInventoryItem?: (itemId: string) => void
  onRecordStockMovement: (
    itemId: string,
    type: 'in' | 'out' | 'adjustment',
    qty: number,
    reason: string,
    unitCostOverride?: number
  ) => void
  onUpdateRecipe: (recipe: Recipe) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function InventoryTab({
  inventory,
  recipes,
  menuItems,
  movements,
  activeOutlet,
  outlets = [],
  onSelectOutlet,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  onRecordStockMovement,
  onUpdateRecipe,
}: InventoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'hpp_recipes' | 'movements'>('stock')

  // SEARCH & CATEGORY FOR MASTER STOK
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('all')

  // MODAL STOK MASUK / KELUAR
  const [showStockMoveModal, setShowStockMoveModal] = useState(false)
  const [selectedMoveItem, setSelectedMoveItem] = useState<InventoryItem | null>(null)
  const [moveType, setMoveType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [moveQty, setMoveQty] = useState('')
  const [moveCost, setMoveCost] = useState('')
  const [moveReason, setMoveReason] = useState('Pembelian stok tambahan')

  // MODAL ITEM BARU
  const [showNewItemModal, setShowNewItemModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCode, setNewItemCode] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<InventoryItem['category']>('beans_green')
  const [newItemUnit, setNewItemUnit] = useState('kg')
  const [newItemStock, setNewItemStock] = useState('')
  const [newItemMinStock, setNewItemMinStock] = useState('')
  const [newItemCost, setNewItemCost] = useState('')

  // MODAL EDIT ITEM
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemCode, setEditItemCode] = useState('')
  const [editItemCategory, setEditItemCategory] = useState<InventoryItem['category']>('beans_green')
  const [editItemUnit, setEditItemUnit] = useState('kg')
  const [editItemMinStock, setEditItemMinStock] = useState('')
  const [editItemCost, setEditItemCost] = useState('')

  // SELECTED MENU FOR HPP RECIPE
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menuItems[1]?.id || menuItems[0]?.id || '')

  // RECIPE EDITING STATE
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false)
  const [selectedIngredientInvId, setSelectedIngredientInvId] = useState<string>('')
  const [ingredientQtyInput, setIngredientQtyInput] = useState<string>('')
  const [isEditingCosts, setIsEditingCosts] = useState(false)
  const [editingLaborCost, setEditingLaborCost] = useState<string>('2500')
  const [editingOverheadCost, setEditingOverheadCost] = useState<string>('1500')

  // WHAT-IF MARGIN SIMULATOR (SLIDER 0% to 50% price rise)
  const [simulatedIngredientInflationPct, setSimulatedIngredientInflationPct] = useState(0)

  // SEARCH & FILTER FOR KARTU STOK
  const [movementSearchQuery, setMovementSearchQuery] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all')

  // OUTLET SCOPE SELECTOR
  const [selectedOutletScope, setSelectedOutletScope] = useState<string>(activeOutlet?.id || 'all')

  useEffect(() => {
    if (activeOutlet?.id) {
      setSelectedOutletScope(activeOutlet.id)
    }
  }, [activeOutlet?.id])

  const isAllOutlets = selectedOutletScope === 'all'

  // Helper untuk mendapatkan stok fisik item berdasarkan outlet yang dipilih
  function getItemStock(item: InventoryItem): number {
    if (isAllOutlets) {
      if (item.stockByOutlet) {
        return Object.values(item.stockByOutlet).reduce((s, v) => s + v, 0)
      }
      return item.currentStock
    }
    if (item.stockByOutlet && item.stockByOutlet[selectedOutletScope] !== undefined) {
      return item.stockByOutlet[selectedOutletScope]
    }
    return item.currentStock
  }

  // STATS
  const totalValuation = inventory.reduce((s, i) => s + getItemStock(i) * i.unitCost, 0)
  const lowStockItems = inventory.filter((i) => getItemStock(i) <= i.minStock)

  const currentRecipe = recipes.find((r) => r.menuItemId === selectedMenuId)
  const currentMenuItem = menuItems.find((m) => m.id === selectedMenuId)

  // CALCULATE BASE & SIMULATED RECIPE TOTAL COST
  const baseIngredientCost = currentRecipe?.ingredients.reduce((s, ing) => {
    const inv = inventory.find((i) => i.id === ing.invItemId)
    const costPerUnit = inv?.unitCost ?? 0
    return s + ing.qty * costPerUnit
  }, 0) ?? 0

  const inflationFactor = 1 + simulatedIngredientInflationPct / 100
  const simulatedIngredientCost = baseIngredientCost * inflationFactor

  const totalRecipeHpp = baseIngredientCost + (currentRecipe?.laborCostStd ?? 0) + (currentRecipe?.overheadCostStd ?? 0)
  const simulatedTotalRecipeHpp = simulatedIngredientCost + (currentRecipe?.laborCostStd ?? 0) + (currentRecipe?.overheadCostStd ?? 0)

  const sellingPrice = currentMenuItem?.price ?? 0
  const grossProfitPerCup = Math.max(0, sellingPrice - totalRecipeHpp)
  const marginPct = sellingPrice > 0 ? (grossProfitPerCup / sellingPrice) * 100 : 0

  const simulatedGrossProfit = Math.max(0, sellingPrice - simulatedTotalRecipeHpp)
  const simulatedMarginPct = sellingPrice > 0 ? (simulatedGrossProfit / sellingPrice) * 100 : 0

  // FILTERED INVENTORY
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = stockCategoryFilter === 'all' || item.category === stockCategoryFilter
      const query = stockSearchQuery.toLowerCase()
      const matchSearch =
        !stockSearchQuery ||
        item.name.toLowerCase().includes(query) ||
        (item.code ? item.code.toLowerCase().includes(query) : false)
      return matchCat && matchSearch
    })
  }, [inventory, stockCategoryFilter, stockSearchQuery])

  // FILTERED MOVEMENTS
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchOutlet = isAllOutlets || !m.outletId || m.outletId === selectedOutletScope
      const matchType = movementTypeFilter === 'all' || m.type === movementTypeFilter
      const item = inventory.find((i) => i.id === m.itemId)
      const query = movementSearchQuery.toLowerCase()
      const matchSearch =
        !movementSearchQuery ||
        m.reason.toLowerCase().includes(query) ||
        (item && item.name.toLowerCase().includes(query)) ||
        (item && item.code ? item.code.toLowerCase().includes(query) : false)
      return matchOutlet && matchType && matchSearch
    })
  }, [movements, inventory, isAllOutlets, selectedOutletScope, movementTypeFilter, movementSearchQuery])

  function handleSaveMove() {
    if (!selectedMoveItem) return
    const q = Number(moveQty)
    if (isNaN(q) || (moveType !== 'adjustment' && q <= 0) || (moveType === 'adjustment' && q < 0)) return

    onRecordStockMovement(
      selectedMoveItem.id,
      moveType,
      q,
      moveReason || (moveType === 'adjustment' ? 'Penyesuaian Stock Opname Fisik' : 'Mutasi stok'),
      moveType === 'in' && moveCost ? Number(moveCost) : undefined
    )
    setShowStockMoveModal(false)
    setMoveQty('')
    setMoveCost('')
  }

  function handleSaveNewItem() {
    if (!newItemName.trim() || !newItemCode.trim()) return

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      orgId: 'org-resto',
      code: newItemCode.trim(),
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit.trim(),
      currentStock: Number(newItemStock) || 0,
      minStock: Number(newItemMinStock) || 0,
      unitCost: Number(newItemCost) || 0,
      updatedAt: Date.now(),
    }

    onAddInventoryItem(item)
    setShowNewItemModal(false)
    setNewItemName('')
    setNewItemCode('')
    setNewItemStock('')
    setNewItemMinStock('')
    setNewItemCost('')
  }

  function handleOpenEditItem(item: InventoryItem) {
    setEditingItem(item)
    setEditItemName(item.name)
    setEditItemCode(item.code || '')
    setEditItemCategory(item.category)
    setEditItemUnit(item.unit)
    setEditItemMinStock(String(item.minStock))
    setEditItemCost(String(item.unitCost))
  }

  function handleSaveEditItem() {
    if (!editingItem || !editItemName.trim() || !editItemCode.trim()) return

    const updated: InventoryItem = {
      ...editingItem,
      name: editItemName.trim(),
      code: editItemCode.trim(),
      category: editItemCategory,
      unit: editItemUnit.trim() || 'pcs',
      minStock: Number(editItemMinStock) >= 0 ? Number(editItemMinStock) : editingItem.minStock,
      unitCost: Number(editItemCost) >= 0 ? Number(editItemCost) : editingItem.unitCost,
      updatedAt: Date.now(),
    }

    onUpdateInventoryItem?.(updated)
    setEditingItem(null)
  }

  function handleDeleteItem(item: InventoryItem) {
    if (window.confirm(`Hapus bahan baku "${item.name}" (${item.code})? Pastikan bahan ini tidak sedang digunakan pada resep aktif.`)) {
      onDeleteInventoryItem?.(item.id)
    }
  }

  function handleExportStockExcel() {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Nusantara Enterprise ERP'
    const ws = wb.addWorksheet('Master Stok Persediaan')

    ws.columns = [
      { width: 14, header: 'Kode Bahan' },
      { width: 32, header: 'Nama Bahan Baku' },
      { width: 18, header: 'Kategori' },
      { width: 12, header: 'Satuan' },
      { width: 16, header: 'Sisa Stok Fisik' },
      { width: 16, header: 'Batas Minimum' },
      { width: 20, header: 'Harga Pokok / Unit' },
      { width: 24, header: 'Total Nilai Aset (Rp)' },
    ]

    inventory.forEach((item, idx) => {
      const rowIdx = idx + 2
      ws.addRow([
        item.code,
        item.name,
        item.category.toUpperCase(),
        item.unit,
        item.currentStock,
        item.minStock,
        item.unitCost,
        { formula: `E${rowIdx}*G${rowIdx}`, result: item.currentStock * item.unitCost },
      ])
    })

    const lastRow = inventory.length + 1
    const totalRow = ws.addRow([
      'TOTAL VALUASI',
      '',
      '',
      '',
      '',
      '',
      '',
      { formula: `SUM(H2:H${lastRow})`, result: totalValuation },
    ])
    totalRow.font = { bold: true }

    wb.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Stok_Persediaan_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  function handleExportMovementsExcel() {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Nusantara Enterprise ERP'
    const ws = wb.addWorksheet('Kartu Mutasi Stok')

    ws.columns = [
      { width: 22, header: 'Waktu & Tanggal' },
      { width: 18, header: 'ID Mutasi' },
      { width: 30, header: 'Nama Bahan Baku' },
      { width: 16, header: 'Tipe Mutasi' },
      { width: 14, header: 'Kuantitas' },
      { width: 16, header: 'Saldo Akhir' },
      { width: 45, header: 'Alasan / Transaksi' },
    ]

    movements.forEach((m) => {
      const item = inventory.find((i) => i.id === m.itemId)
      ws.addRow([
        new Date(m.date).toLocaleString('id-ID'),
        m.id,
        item ? item.name : m.itemId,
        m.type.toUpperCase(),
        m.qty,
        m.balanceAfter,
        m.reason,
      ])
    })

    wb.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Kartu_Mutasi_Stok_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // RECIPE MANAGEMENT ACTION HANDLERS
  function handleAddIngredientToRecipe() {
    if (!selectedMenuId || !selectedIngredientInvId || !ingredientQtyInput) return
    const inv = inventory.find((i) => i.id === selectedIngredientInvId)
    if (!inv) return

    const qty = Number(ingredientQtyInput)
    if (isNaN(qty) || qty <= 0) return

    const existingRecipe = recipes.find((r) => r.menuItemId === selectedMenuId)
    let updatedRecipe: Recipe

    if (existingRecipe) {
      const ingExists = existingRecipe.ingredients.some((ing) => ing.invItemId === inv.id)
      const newIngredients = ingExists
        ? existingRecipe.ingredients.map((ing) =>
            ing.invItemId === inv.id ? { ...ing, qty: Number((ing.qty + qty).toFixed(4)) } : ing
          )
        : [
            ...existingRecipe.ingredients,
            {
              invItemId: inv.id,
              invItemName: inv.name,
              qty,
              unit: inv.unit,
            },
          ]
      updatedRecipe = {
        ...existingRecipe,
        ingredients: newIngredients,
        updatedAt: Date.now(),
      }
    } else {
      updatedRecipe = {
        id: `rec-${selectedMenuId}`,
        menuItemId: selectedMenuId,
        menuItemName: currentMenuItem?.name || 'Menu Baru',
        ingredients: [
          {
            invItemId: inv.id,
            invItemName: inv.name,
            qty,
            unit: inv.unit,
          },
        ],
        laborCostStd: 2500,
        overheadCostStd: 1500,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    }

    onUpdateRecipe(updatedRecipe)
    setShowAddIngredientModal(false)
    setSelectedIngredientInvId('')
    setIngredientQtyInput('')
  }

  function handleRemoveIngredientFromRecipe(invItemId: string) {
    const existingRecipe = recipes.find((r) => r.menuItemId === selectedMenuId)
    if (!existingRecipe) return
    const updatedRecipe: Recipe = {
      ...existingRecipe,
      ingredients: existingRecipe.ingredients.filter((ing) => ing.invItemId !== invItemId),
      updatedAt: Date.now(),
    }
    onUpdateRecipe(updatedRecipe)
  }

  function handleCreateEmptyRecipe() {
    if (!selectedMenuId || !currentMenuItem) return
    const newRecipe: Recipe = {
      id: `rec-${selectedMenuId}`,
      menuItemId: selectedMenuId,
      menuItemName: currentMenuItem.name,
      ingredients: [],
      laborCostStd: 2500,
      overheadCostStd: 1500,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    onUpdateRecipe(newRecipe)
  }

  function handleSaveRecipeCosts() {
    const existingRecipe = recipes.find((r) => r.menuItemId === selectedMenuId)
    if (!existingRecipe) return
    const labor = Number(editingLaborCost)
    const overhead = Number(editingOverheadCost)
    const updatedRecipe: Recipe = {
      ...existingRecipe,
      laborCostStd: isNaN(labor) ? existingRecipe.laborCostStd : labor,
      overheadCostStd: isNaN(overhead) ? existingRecipe.overheadCostStd : overhead,
      updatedAt: Date.now(),
    }
    onUpdateRecipe(updatedRecipe)
    setIsEditingCosts(false)
  }

  return (
    <div className="space-y-6 select-none">
      {/* HEADER & SUB-TABS */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Bahan Baku & HPP
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* SUB-TABS SELECTOR */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F4] rounded-xl border border-[#E7E5E4] flex-wrap">
            {[
              { id: 'stock', label: 'Master Stok', icon: Package },
              { id: 'hpp_recipes', label: 'Resep Menu (BOM)', icon: Calculator },
              { id: 'movements', label: 'Kartu Stok', icon: History },
            ].map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id as typeof activeSubTab)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeSubTab === t.id
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-stone-200/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* EXCEL EXPORT BUTTON */}
          <button
            onClick={() => {
              if (activeSubTab === 'movements') {
                handleExportMovementsExcel()
              } else {
                handleExportStockExcel()
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold tracking-tight transition-all cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* CAKUPAN STOK OUTLET / GUDANG */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-black shrink-0" />
          <span className="text-xs font-bold text-neutral-800">Cakupan Gudang & Cabang:</span>
          <select
            value={selectedOutletScope}
            onChange={(e) => {
              setSelectedOutletScope(e.target.value)
              if (onSelectOutlet && e.target.value !== 'all') {
                const found = outlets.find((o) => o.id === e.target.value)
                if (found) onSelectOutlet(found)
              }
            }}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Cabang & Gudang Pusat (Konsolidasi)</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          {isAllOutlets ? (
            <span className="inline-flex items-center gap-1.5 text-stone-900 font-semibold bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              Total Konsolidasi Seluruh Outlet ({outlets.length} Cabang)
            </span>
          ) : (
            <span>
              Menampilkan stok fisik khusus{' '}
              <strong className="text-black font-bold">
                {outlets.find((o) => o.id === selectedOutletScope)?.name || activeOutlet?.name}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Total Valuasi Nilai Persediaan</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums">
            {formatRupiah(totalValuation)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Aset Lancar Terikat di Gudang</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Total Bahan Terdaftar</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums">
            {inventory.length} Item
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Daging, Sayur, Bahan Pokok, Dairy & Kemasan</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <span className="text-xs text-neutral-500 font-medium">Status Stok Menipis</span>
          <div className="text-2xl font-bold tracking-tight text-black mt-1 tabular-nums flex items-center gap-2">
            <span className={lowStockItems.length > 0 ? 'text-amber-800' : 'text-emerald-700'}>
              {lowStockItems.length} Bahan
            </span>
            {lowStockItems.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                PERLU REORDER
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Di bawah batas minimum persediaan</span>
        </div>
      </div>

      {/* 1. SUB-TAB: MASTER STOK BAHAN BAKU */}
      {activeSubTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h2 className="font-bold text-sm text-black">Daftar Bahan Baku & Persediaan</h2>
              <span className="text-xs text-neutral-500">Harga Pokok Satuan menggunakan metode Moving Average</span>
            </div>

            <button
              onClick={() => setShowNewItemModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Bahan Baru</span>
            </button>
          </div>

          {/* SEARCH & CATEGORY FILTER */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Cari kode bahan, nama, susu, cup..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Filter size={13} className="text-neutral-500" />
              <select
                value={stockCategoryFilter}
                onChange={(e) => setStockCategoryFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#F7F7F7] border border-[#E5E7EB] text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="meat_poultry">Daging, Unggas & Seafood</option>
                <option value="produce">Beras, Telur & Sayuran</option>
                <option value="grocery_spices">Bumbu, Saus & Minyak</option>
                <option value="dairy">Dairy, Susu & Keju</option>
                <option value="beans_roasted">Kopi & Minuman Bar</option>
                <option value="syrup">Sirup & Flavour</option>
                <option value="packaging">Packaging & Kemasan</option>
              </select>
            </div>
          </div>

          {/* LOW STOCK BANNER */}
          {lowStockItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <AlertTriangle size={16} className="text-amber-700 shrink-0" />
                <span>
                  Stok menipis pada {lowStockItems.length} bahan:{' '}
                  <strong>{lowStockItems.map((i) => i.name).join(', ')}</strong>.
                </span>
              </div>
            </div>
          )}

          {/* TABLE BAHAN BAKU */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-neutral-500 font-semibold">
                  <th className="py-2.5 px-3">KODE</th>
                  <th className="py-2.5 px-3">NAMA BAHAN BAKU</th>
                  <th className="py-2.5 px-3">KATEGORI</th>
                  <th className="py-2.5 px-3 text-right">STOK FISIK</th>
                  <th className="py-2.5 px-3 text-right">BATAS MIN</th>
                  <th className="py-2.5 px-3 text-right">UNIT COST (HPP)</th>
                  <th className="py-2.5 px-3 text-right">TOTAL VALUASI</th>
                  <th className="py-2.5 px-3 text-right">AKSI & MUTASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInventory.map((item) => {
                  const itemStock = getItemStock(item)
                  const isLow = itemStock <= item.minStock
                  const itemValuation = itemStock * item.unitCost
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="py-3 px-3 font-mono font-medium text-black">{item.code}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900">{item.name}</div>
                        {isAllOutlets && item.stockByOutlet && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {Object.entries(item.stockByOutlet).map(([outId, qty]) => {
                              const outLabel = outlets.find((o) => o.id === outId)?.code || outId
                              return (
                                <span
                                  key={outId}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200"
                                  title={`${outId}: ${qty} ${item.unit}`}
                                >
                                  {outLabel}: {qty} {item.unit}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#F7F7F7] border border-[#E5E7EB] text-neutral-700 text-[10px] font-semibold capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className={`font-bold ${isLow ? 'text-amber-700' : 'text-neutral-900'}`}>
                          {itemStock.toLocaleString('id-ID')}
                        </span>{' '}
                        <span className="text-neutral-500">{item.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500 tabular-nums">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-neutral-900 tabular-nums">
                        {formatRupiah(item.unitCost)} / {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-black tabular-nums">
                        {formatRupiah(itemValuation)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMoveItem(item)
                              setMoveType('in')
                              setMoveReason('Pembelian stok tambahan')
                              setShowStockMoveModal(true)
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all cursor-pointer"
                            title="Stok Masuk (+)"
                          >
                            <ArrowDownCircle size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMoveItem(item)
                              setMoveType('out')
                              setMoveReason('Kerusakan / basi (Waste)')
                              setShowStockMoveModal(true)
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 transition-all cursor-pointer"
                            title="Stok Keluar / Waste (-)"
                          >
                            <ArrowUpCircle size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMoveItem(item)
                              setMoveType('adjustment')
                              setMoveReason('Penyesuaian Stock Opname Fisik')
                              setMoveQty(String(item.currentStock))
                              setShowStockMoveModal(true)
                            }}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 transition-all cursor-pointer"
                            title="Stock Opname Fisik (=)"
                          >
                            <Sliders size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all cursor-pointer"
                            title="Edit Bahan Baku"
                          >
                            <Pencil size={14} />
                          </button>
                          {onDeleteInventoryItem && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                              title="Hapus Bahan Baku"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-400">
                      Tidak ada bahan baku yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUB-TAB: RESEP & KALKULATOR HPP (BOM) */}
      {activeSubTab === 'hpp_recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* MENU SELECTOR SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
            <span className="font-bold text-xs text-black uppercase tracking-wider block">
              Pilih Menu untuk Breakdown Resep
            </span>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {menuItems.map((item) => {
                const isSelected = selectedMenuId === item.id
                const hasRecipe = recipes.some((r) => r.menuItemId === item.id)

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMenuId(item.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-black bg-[#F7F7F7] shadow-xs'
                        : 'border-[#E5E7EB] hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                        <Coffee size={15} />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-black">{item.name}</div>
                        <div className="text-[11px] text-neutral-500 tabular-nums">
                          {formatRupiah(item.price)}
                        </div>
                      </div>
                    </div>
                    {hasRecipe ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Ada BOM ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-neutral-400">Belum Ada</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* DETAIL RESEP & KALKULATOR HPP (8 COLS) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase">Formula Resep (BOM)</span>
                <h3 className="text-xl font-bold text-black mt-0.5">
                  {currentMenuItem?.name}
                </h3>
                <span className="text-xs text-neutral-500">
                  Harga Jual Menu:{' '}
                  <strong className="text-black font-semibold">{formatRupiah(sellingPrice)}</strong>
                </span>
              </div>

              {/* PROFIT & MARGIN BADGE */}
              <div className="text-right">
                <span className="text-[11px] text-neutral-500 block">Gross Profit per Porsi</span>
                <div className="text-lg font-bold text-emerald-800 tabular-nums">
                  {formatRupiah(grossProfitPerCup)} ({marginPct.toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* RINCIAN BAHAN BAKU */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                    Rincian Pemakaian Bahan Baku per Porsi (BOM)
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Bahan akan terpotong otomatis dari stok gudang saat kasir menyelesaikan transaksi POS.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentRecipe) handleCreateEmptyRecipe()
                      setShowAddIngredientModal(true)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                  >
                    <Plus size={13} />
                    <span>+ Tambah Bahan Baku</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentRecipe) {
                        setEditingLaborCost(String(currentRecipe.laborCostStd ?? 2500))
                        setEditingOverheadCost(String(currentRecipe.overheadCostStd ?? 1500))
                      }
                      setIsEditingCosts(!isEditingCosts)
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-neutral-800 hover:bg-stone-200 text-xs font-semibold cursor-pointer"
                  >
                    {isEditingCosts ? 'Batal Edit Biaya' : 'Edit Biaya Operasional'}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 border border-[#E5E7EB] rounded-xl overflow-hidden text-xs">
                <div className="bg-[#F7F7F7] p-2.5 font-semibold text-neutral-600 grid grid-cols-12 gap-2 text-[11px]">
                  <span className="col-span-5">NAMA BAHAN BAKU</span>
                  <span className="col-span-3 text-center">PEMAKAIAN / PORSI</span>
                  <span className="col-span-2 text-right">BIAYA SATUAN</span>
                  <span className="col-span-2 text-right">TOTAL & AKSI</span>
                </div>

                {currentRecipe?.ingredients.map((ing, idx) => {
                  const inv = inventory.find((i) => i.id === ing.invItemId)
                  const costPerUnit = inv?.unitCost ?? 0
                  const lineTotal = ing.qty * costPerUnit

                  return (
                    <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-neutral-50">
                      <div className="col-span-5">
                        <div className="font-semibold text-neutral-900">{ing.invItemName}</div>
                        <div className="text-[10px] text-neutral-400">
                          {inv ? `Stok: ${inv.currentStock} ${inv.unit}` : 'Bahan Terdaftar'}
                        </div>
                      </div>
                      <div className="col-span-3 text-center tabular-nums font-semibold text-neutral-800 bg-stone-100/60 py-1 rounded-md">
                        {ing.qty} {ing.unit}
                      </div>
                      <div className="col-span-2 text-right tabular-nums text-neutral-500">
                        {formatRupiah(costPerUnit)}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="tabular-nums font-bold text-neutral-900">
                          {formatRupiah(lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientFromRecipe(ing.invItemId)}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus bahan dari resep"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {(!currentRecipe || currentRecipe.ingredients.length === 0) && (
                  <div className="p-6 text-center space-y-3">
                    <div className="text-stone-400 text-xs">
                      Menu ini belum memiliki formula bahan baku (BOM). Saat terjual di POS, sistem hanya menggunakan estimasi COGS 30%.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleCreateEmptyRecipe()
                        setShowAddIngredientModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>+ Buat Formula Resep Baru untuk {currentMenuItem?.name}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BIAYA TENAGA KERJA & OVERHEAD */}
            {isEditingCosts ? (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3 text-xs">
                <span className="font-bold text-amber-950 uppercase text-[11px] block">
                  Edit Standar Biaya Tenaga Kerja & Overhead per Porsi
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Biaya Tenaga Kerja (Labor Cost Std) Rp:
                    </label>
                    <input
                      type="number"
                      value={editingLaborCost}
                      onChange={(e) => setEditingLaborCost(e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Biaya Overhead (Listrik/Air/Gas Std) Rp:
                    </label>
                    <input
                      type="number"
                      value={editingOverheadCost}
                      onChange={(e) => setEditingOverheadCost(e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingCosts(false)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecipeCosts}
                    className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Simpan Perubahan Biaya
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#F7F7F7] border border-[#E5E7EB] text-xs">
                <div>
                  <span className="text-neutral-500">Biaya Tenaga Kerja Standar:</span>
                  <div className="font-bold text-neutral-900 mt-0.5 tabular-nums">
                    {formatRupiah(currentRecipe?.laborCostStd ?? 0)} / porsi
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Alokasi Overhead (Listrik/Air):</span>
                  <div className="font-bold text-neutral-900 mt-0.5 tabular-nums">
                    {formatRupiah(currentRecipe?.overheadCostStd ?? 0)} / porsi
                  </div>
                </div>
              </div>
            )}

            {/* TOTAL PERHITUNGAN HPP */}
            <div className="p-4 rounded-2xl bg-black text-white flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-400 block text-[11px]">Total Harga Pokok Produksi (HPP):</span>
                <span className="text-lg font-bold text-white tabular-nums">{formatRupiah(totalRecipeHpp)}</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 block text-[11px]">Harga Jual:</span>
                <span className="text-lg font-bold text-white tabular-nums">{formatRupiah(sellingPrice)}</span>
              </div>
            </div>

            {/* WHAT-IF PROFIT SIMULATOR (SIMULASI KENAIKAN HARGA BAHAN) */}
            <div className="p-4 rounded-2xl bg-[#F7F7F7] border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black flex items-center gap-1.5">
                  <Sliders size={14} />
                  <span>Simulasi Dampak Inflasi / Kenaikan Bahan Baku</span>
                </span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-neutral-800">
                  +{simulatedIngredientInflationPct}% Kenaikan Biaya
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={simulatedIngredientInflationPct}
                onChange={(e) => setSimulatedIngredientInflationPct(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <span className="text-neutral-500 text-[11px]">HPP Tersimulasi:</span>
                  <div className="font-bold text-sm text-neutral-900 tabular-nums">
                    {formatRupiah(simulatedTotalRecipeHpp)}
                  </div>
                  <span className="text-[10px] text-rose-600">
                    +{formatRupiah(simulatedTotalRecipeHpp - totalRecipeHpp)} / porsi
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <span className="text-neutral-500 text-[11px]">Margin Tersisa:</span>
                  <div className="font-bold text-sm text-neutral-900 tabular-nums">
                    {simulatedMarginPct.toFixed(1)}% ({formatRupiah(simulatedGrossProfit)})
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    Turun -{(marginPct - simulatedMarginPct).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB: RIWAYAT KARTU STOK (AUDIT TRAIL) */}
      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h2 className="font-bold text-sm text-black">Riwayat Kartu Stok (Stock Movements)</h2>
              <span className="text-xs text-neutral-500">
                Audit trail lengkap mutasi bahan masuk, keluar kasir, susut roasting, dan waste
              </span>
            </div>
          </div>

          {/* SEARCH & FILTER FOR KARTU STOK */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={movementSearchQuery}
                onChange={(e) => setMovementSearchQuery(e.target.value)}
                placeholder="Cari alasan mutasi, nomor order, nama bahan..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Filter size={13} className="text-neutral-500" />
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#F7F7F7] border border-[#E5E7EB] text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Tipe Mutasi</option>
                <option value="in">Stok Masuk (In)</option>
                <option value="out">Stok Keluar Kasir (Out)</option>
                <option value="production_out">Pakai Roasting SPK</option>
                <option value="production_in">Hasil Sangrai Roasting</option>
                <option value="adjustment">Opname / Penyesuaian</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-neutral-500 font-semibold">
                  <th className="py-2.5 px-3">WAKTU</th>
                  <th className="py-2.5 px-3">BAHAN BAKU</th>
                  <th className="py-2.5 px-3">JENIS MUTASI</th>
                  <th className="py-2.5 px-3 text-right">JUMLAH</th>
                  <th className="py-2.5 px-3 text-right">BIAYA SATUAN</th>
                  <th className="py-2.5 px-3 text-right">SALDO AKHIR</th>
                  <th className="py-2.5 px-3">KETERANGAN / DOKUMEN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredMovements.map((m) => {
                  const item = inventory.find((i) => i.id === m.itemId)
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 text-neutral-600 tabular-nums">
                        {new Date(m.date).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">
                        {item ? item.name : m.itemId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                            m.type === 'in' || m.type === 'production_in'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : m.type === 'out' || m.type === 'production_out'
                              ? 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {m.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-neutral-900">
                        {m.qty.toLocaleString('id-ID')} {item?.unit || ''}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500 tabular-nums">
                        {formatRupiah(m.unitCostAtTime)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-black tabular-nums">
                        {m.balanceAfter.toLocaleString('id-ID')} {item?.unit || ''}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 max-w-xs truncate">
                        {m.reason}
                      </td>
                    </tr>
                  )
                })}

                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      Tidak ada pergerakan stok yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL INPUT MUTASI STOK & OPNAME FISIK */}
      {showStockMoveModal && selectedMoveItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-base text-black">
                  {moveType === 'in'
                    ? 'Catat Stok Masuk (+)'
                    : moveType === 'out'
                    ? 'Catat Stok Keluar / Waste (-)'
                    : 'Penyesuaian Stock Opname Fisik (=)'}
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                  {selectedMoveItem.name} ({selectedMoveItem.code})
                </span>
              </div>
              <button
                onClick={() => setShowStockMoveModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F7F7F7] border border-[#E5E7EB] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* SEGMENTED CONTROL: MASUK / KELUAR / OPNAME */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F7F7F7] rounded-xl border border-[#E5E7EB] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMoveType('in')
                  setMoveReason('Pembelian stok tambahan')
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  moveType === 'in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                + Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoveType('out')
                  setMoveReason('Kerusakan / basi (Waste)')
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  moveType === 'out'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                - Keluar (Waste)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoveType('adjustment')
                  setMoveReason('Penyesuaian Stock Opname Fisik')
                  setMoveQty(String(selectedMoveItem.currentStock))
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  moveType === 'adjustment'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                = Opname Fisik
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* CURRENT STOCK INFO */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Stok Sistem Saat Ini:</span>
                <span className="font-bold text-neutral-900 tabular-nums">
                  {selectedMoveItem.currentStock} {selectedMoveItem.unit} ({formatRupiah(selectedMoveItem.currentStock * selectedMoveItem.unitCost)})
                </span>
              </div>

              {moveType === 'adjustment' ? (
                <>
                  <div>
                    <label className="font-semibold text-neutral-700">
                      Stok Fisik Aktual Dihitung ({selectedMoveItem.unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={moveQty}
                      onChange={(e) => setMoveQty(e.target.value)}
                      placeholder="Masukkan hasil hitung fisik nyata..."
                      className="w-full mt-1 p-3 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black font-bold text-base tabular-nums"
                      autoFocus
                    />
                  </div>

                  {/* LIVE VARIANCE AUDIT BOX */}
                  {(() => {
                    const physical = Number(moveQty) || 0
                    const diff = Number((physical - selectedMoveItem.currentStock).toFixed(4))
                    const varianceVal = Math.abs(diff) * selectedMoveItem.unitCost
                    const isDeficit = diff < 0
                    const isSurplus = diff > 0

                    return (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isDeficit
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : isSurplus
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Selisih Stok (Varian):</span>
                          <span className="tabular-nums">
                            {diff > 0 ? `+${diff}` : diff} {selectedMoveItem.unit} (
                            {isDeficit ? 'Defisit / Susut' : isSurplus ? 'Surplus' : 'Sesuai'})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] opacity-80">
                          <span>Nilai Finansial Selisih:</span>
                          <span className="font-bold tabular-nums">{formatRupiah(varianceVal)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </>
              ) : (
                <>
                  <div>
                    <label className="font-semibold text-neutral-700">Jumlah / Kuantitas ({selectedMoveItem.unit})</label>
                    <input
                      type="number"
                      step="any"
                      value={moveQty}
                      onChange={(e) => setMoveQty(e.target.value)}
                      placeholder={`Masukkan jumlah dalam ${selectedMoveItem.unit}...`}
                      className="w-full mt-1 p-3 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black font-bold text-sm tabular-nums"
                    />
                  </div>

                  {moveType === 'in' && (
                    <div>
                      <label className="font-semibold text-neutral-700">Harga Beli Satuan Baru (Opsional)</label>
                      <input
                        type="number"
                        value={moveCost}
                        onChange={(e) => setMoveCost(e.target.value)}
                        placeholder={`Default: ${selectedMoveItem.unitCost}`}
                        className="w-full mt-1 p-3 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black text-sm tabular-nums"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="font-semibold text-neutral-700">Alasan Mutasi / Catatan</label>
                <input
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  placeholder="Contoh: Pembelian supplier, Susu tumpah (waste), Selisih opname..."
                  className="w-full mt-1 p-3 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  *Defisit opname atau kata kunci &quot;basi/rusak&quot; otomatis menerbitkan Jurnal Beban Waste ke Buku Besar SAK EMKM.
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStockMoveModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-neutral-700 hover:bg-[#F7F7F7] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMove}
                className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                {moveType === 'adjustment' ? 'Simpan Hasil Opname' : 'Simpan Mutasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BAHAN BARU */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-bold text-base text-black">Tambah Bahan Baku Baru</h3>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F7F7F7] border border-[#E5E7EB] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">Nama Bahan</label>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Contoh: Green Beans Aceh Gayo..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700">Kode Item</label>
                  <input
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="Contoh: GB-GAYO-01"
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Kategori</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as InventoryItem['category'])}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="meat_poultry">Daging, Unggas & Seafood</option>
                    <option value="produce">Beras, Telur & Sayuran</option>
                    <option value="grocery_spices">Bumbu, Saus & Minyak</option>
                    <option value="dairy">Dairy, Susu & Keju</option>
                    <option value="beans_roasted">Kopi & Minuman Bar</option>
                    <option value="syrup">Sirup</option>
                    <option value="packaging">Packaging & Kemasan</option>
                    <option value="other">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700">Satuan</label>
                  <input
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="kg / liter / pcs"
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Stok Awal</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Batas Min</label>
                  <input
                    type="number"
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Biaya Satuan / HPP (Rp)</label>
                <input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="Contoh: 85000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-neutral-700 hover:bg-[#F7F7F7] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewItem}
                className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Simpan Bahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT BAHAN BAKU */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-base text-black">Edit Bahan Baku</h3>
                <span className="text-[11px] text-neutral-500 font-mono">{editingItem.code}</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-lg bg-[#F7F7F7] border border-[#E5E7EB] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">Nama Bahan Baku</label>
                <input
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  placeholder="Contoh: Green Beans Aceh Gayo..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700">Kode Item</label>
                  <input
                    value={editItemCode}
                    onChange={(e) => setEditItemCode(e.target.value)}
                    placeholder="Contoh: GB-GAYO-01"
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Kategori</label>
                  <select
                    value={editItemCategory}
                    onChange={(e) => setEditItemCategory(e.target.value as InventoryItem['category'])}
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="meat_poultry">Daging, Unggas & Seafood</option>
                    <option value="produce">Beras, Telur & Sayuran</option>
                    <option value="grocery_spices">Bumbu, Saus & Minyak</option>
                    <option value="dairy">Dairy, Susu & Keju</option>
                    <option value="beans_roasted">Kopi & Minuman Bar</option>
                    <option value="syrup">Sirup</option>
                    <option value="packaging">Packaging & Kemasan</option>
                    <option value="other">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700">Satuan</label>
                  <input
                    value={editItemUnit}
                    onChange={(e) => setEditItemUnit(e.target.value)}
                    placeholder="kg / liter / pcs"
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700">Batas Min Stok</label>
                  <input
                    type="number"
                    value={editItemMinStock}
                    onChange={(e) => setEditItemMinStock(e.target.value)}
                    placeholder="Contoh: 5"
                    className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700">Biaya Satuan / HPP Standar (Rp)</label>
                <input
                  type="number"
                  value={editItemCost}
                  onChange={(e) => setEditItemCost(e.target.value)}
                  placeholder="Contoh: 85000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-neutral-700 hover:bg-[#F7F7F7] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditItem}
                className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BAHAN BAKU KE RESEP (BOM) */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-base text-black">Tambah Bahan ke Resep</h3>
                <span className="text-[11px] text-neutral-500">Menu: {currentMenuItem?.name}</span>
              </div>
              <button
                onClick={() => setShowAddIngredientModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F7F7F7] border border-[#E5E7EB] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Pilih Bahan Baku dari Gudang</label>
                <select
                  value={selectedIngredientInvId}
                  onChange={(e) => setSelectedIngredientInvId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black cursor-pointer font-medium"
                >
                  <option value="">-- Pilih Bahan Baku --</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Stok: {inv.currentStock} {inv.unit} · {formatRupiah(inv.unitCost)}/{inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedIngredientInvId && (() => {
                const selectedInv = inventory.find((i) => i.id === selectedIngredientInvId)
                if (!selectedInv) return null
                const qtyNum = Number(ingredientQtyInput) || 0
                const estimatedCost = qtyNum * selectedInv.unitCost

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        Takaran / Pemakaian per Porsi ({selectedInv.unit}):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={ingredientQtyInput}
                        onChange={(e) => setIngredientQtyInput(e.target.value)}
                        placeholder={`Contoh: ${selectedInv.unit === 'kg' ? '0.15' : selectedInv.unit === 'liter' ? '0.2' : '1'}`}
                        className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-black tabular-nums font-bold"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        Gunakan titik untuk desimal. Contoh: 0.15 untuk 150 gram, 0.2 untuk 200 ml.
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                      <span className="text-neutral-600">Estimasi Biaya Bahan:</span>
                      <span className="font-bold text-sm text-black tabular-nums">
                        {formatRupiah(estimatedCost)}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddIngredientModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-neutral-700 hover:bg-[#F7F7F7] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selectedIngredientInvId || !ingredientQtyInput || Number(ingredientQtyInput) <= 0}
                onClick={handleAddIngredientToRecipe}
                className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs font-semibold cursor-pointer"
              >
                Tambahkan ke Resep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
