'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  Receipt,
  ReceiptText,
  Tag,
  MessageSquare,
  Coffee,
  UtensilsCrossed,
  FileDown,
  X,
  QrCode,
  CreditCard,
  Coins,
  Smartphone,
  Check,
  Percent,
  Store,
  RotateCcw,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
  Users,
  ChefHat,
  Send,
  FileCheck,
  Split,
  Utensils,
  Info,
  Gift,
  SlidersHorizontal,
  Edit3,
  Flame,
  LayoutGrid,
  Armchair,
  Wine,
  Layers,
  BellRing,
} from 'lucide-react'
import type {
  MenuItem,
  ModifierGroup,
  MenuItemModifier,
  TableFloor,
  Order,
  OrderLineItem,
  PaymentMethod,
  Outlet,
  User as UserType,
  Organization,
  InventoryItem,
  Recipe,
  RecipeIngredient,
} from '../types/erp'
import {
  generateEscPosPlainText,
  generateEscPosPreBillText,
  generateEscPosSplitBillText,
  generateEscPosKitchenTicketText,
  generateEscPosCheckerTicketText,
} from '../lib/hardware/escpos'
import { printThermalReceiptViaIframe } from '../lib/hardware/printer'
import {
  downloadThermalReceiptPdf,
  downloadThermalKitchenTicketPdf,
} from '../lib/export/receiptPdf'

interface PosTabProps {
  org?: Organization
  menuItems: MenuItem[]
  modifierGroups?: ModifierGroup[]
  onUpdateModifierGroups?: (newGroups: ModifierGroup[]) => void
  inventory?: InventoryItem[]
  recipes?: Recipe[]
  onAddOrUpdateRecipe?: (recipe: Recipe) => void
  tables: TableFloor[]
  activeOutlet: Outlet
  outlets?: Outlet[]
  onSelectOutlet?: (outlet: Outlet) => void
  currentUser?: UserType
  orders?: Order[]
  onOrderComplete: (order: Order, cogsAmount: number) => void
  onHoldOrder?: (order: Order) => void
  onUpdateOrder?: (order: Order) => void
  onUpdateTableStatus?: (tableId: string, status: TableFloor['status']) => void
  onVoidOrder?: (orderId: string, reason: string) => void
  onViewTransactions?: () => void
  onAddMenuItem?: (item: MenuItem) => void
  onUpdateMenuItem?: (item: MenuItem) => void
  onDeleteMenuItem?: (menuItemId: string) => void
  onAddTable?: (table: TableFloor) => void
  onUpdateTable?: (table: TableFloor) => void
  onDeleteTable?: (tableId: string) => void
  onMoveTable?: (fromTableId: string, toTableId: string) => void
  onMergeTables?: (sourceTableId: string, targetTableId: string) => void
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void
}

function formatRupiah(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export default function PosTab({
  org,
  menuItems,
  modifierGroups = [],
  onUpdateModifierGroups,
  inventory = [],
  recipes = [],
  onAddOrUpdateRecipe,
  tables,
  activeOutlet,
  outlets = [],
  onSelectOutlet,
  currentUser,
  orders = [],
  onOrderComplete,
  onHoldOrder,
  onUpdateOrder,
  onUpdateTableStatus,
  onVoidOrder,
  onViewTransactions,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onAddTable,
  onUpdateTable,
  onDeleteTable,
  onMoveTable,
  onMergeTables,
  onUpdateOrderStatus,
}: PosTabProps) {
  const isHqMode = activeOutlet.id === 'all'
  const targetBranchOutlet = useMemo(() => {
    if (!isHqMode) return activeOutlet
    return outlets.find((o) => o.id !== 'all') || activeOutlet
  }, [isHqMode, activeOutlet, outlets])

  const targetBranchOutletId = targetBranchOutlet.id

  // BRANCH DATA ISOLATION (TABLES & ORDERS)
  const branchTables = useMemo(() => {
    return tables.filter((t) => !t.outletId || t.outletId === targetBranchOutletId)
  }, [tables, targetBranchOutletId])

  const branchOrders = useMemo(() => {
    return orders.filter((o) => !o.outletId || o.outletId === targetBranchOutletId)
  }, [orders, targetBranchOutletId])

  // POS VIEW MODE: CATALOG vs EMBEDDED HISTORY vs TABLE MAP
  const [posView, setPosView] = useState<'catalog' | 'history' | 'tables'>('catalog')

  // ORDER CHANNEL / SERVICE MODE
  const [orderChannel, setOrderChannel] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  const [selectedTable, setSelectedTable] = useState<TableFloor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Reset table selection if selected table does not belong to target branch
  useEffect(() => {
    if (selectedTable && selectedTable.outletId && selectedTable.outletId !== targetBranchOutletId) {
      setSelectedTable(null)
    }
  }, [targetBranchOutletId, selectedTable])

  // CART STATE (ADD-ONS OR NEW ORDER)
  const [cart, setCart] = useState<OrderLineItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountNote, setDiscountNote] = useState('')
  const [isCompliment, setIsCompliment] = useState(false)
  const [complimentReason, setComplimentReason] = useState('Tamu VIP Rekanan Owner')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris')
  const [cashTender, setCashTender] = useState('')
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni'>('bca')
  const [editingNoteLineId, setEditingNoteLineId] = useState<string | null>(null)

  // MENU MANAGEMENT (CRUD) STATE
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [menuModalTab, setMenuModalTab] = useState<'form' | 'list'>('form')
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [menuForm, setMenuForm] = useState<{
    name: string
    categoryId: string
    price: string
    isKitchenItem: boolean
    emoji: string
    description: string
    active: boolean
  }>({
    name: '',
    categoryId: 'cat-food',
    price: '',
    isKitchenItem: true,
    emoji: '🍚',
    description: '',
    active: true,
  })
  const [menuSearchFilter, setMenuSearchFilter] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')

  // QRIS CHECKOUT MODAL STATE
  const [showQrisPaymentModal, setShowQrisPaymentModal] = useState(false)
  const [isPendingActiveTableCheckout, setIsPendingActiveTableCheckout] = useState(false)

  // MENU FORM MODIFIERS & RECIPE STATE
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([])
  const [menuRecipeIngredients, setMenuRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [showCreateModifierGroupModal, setShowCreateModifierGroupModal] = useState(false)
  const [newModGroupName, setNewModGroupName] = useState('')
  const [newModGroupRequired, setNewModGroupRequired] = useState(false)
  const [newModGroupOptions, setNewModGroupOptions] = useState<{ name: string; priceAdd: string }[]>([
    { name: '', priceAdd: '0' },
  ])

  // TABLE MANAGEMENT (CRUD) STATE
  const [showTableModal, setShowTableModal] = useState(false)
  const [tableModalTab, setTableModalTab] = useState<'form' | 'list'>('form')
  const [editingTable, setEditingTable] = useState<TableFloor | null>(null)
  const [tableForm, setTableForm] = useState<{
    name: string
    section: TableFloor['section']
    capacity: number
    shape: 'round' | 'square' | 'rect' | 'bar'
  }>({
    name: '',
    section: 'Indoor',
    capacity: 4,
    shape: 'square',
  })

  // DINER DASH VISUAL FLOORPLAN STATE
  const [floorplanMode, setFloorplanMode] = useState<'diner_dash' | 'grid'>('diner_dash')
  const [selectedFloorSection, setSelectedFloorSection] = useState<'all' | 'Indoor' | 'Outdoor' | 'VIP' | 'Bar'>('all')
  const [tableActionModal, setTableActionModal] = useState<TableFloor | null>(null)

  // MOVE TABLE (PINDAH MEJA) STATE
  const [showMoveTableModal, setShowMoveTableModal] = useState(false)
  const [tableToMove, setTableToMove] = useState<TableFloor | null>(null)
  const [targetMoveTableId, setTargetMoveTableId] = useState<string>('')

  // DISCOUNT & COMPLIMENT MODAL STATE
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountModeTab, setDiscountModeTab] = useState<'preset' | 'manual_rp' | 'manual_pct' | 'compliment'>('preset')
  const [manualDiscountRp, setManualDiscountRp] = useState('')
  const [manualDiscountPct, setManualDiscountPct] = useState('')

  // MOBILE CART DRAWER
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false)

  // MODIFIERS MODAL STATE
  const [selectedMenuForMod, setSelectedMenuForMod] = useState<MenuItem | null>(null)
  const [activeModifiers, setActiveModifiers] = useState<MenuItemModifier[]>([])

  // RECEIPT MODAL STATE
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [drawerKicked, setDrawerKicked] = useState(false)

  // SPLIT BILL MODAL STATE
  const [showSplitBillModal, setShowSplitBillModal] = useState(false)
  const [orderForSplit, setOrderForSplit] = useState<Order | null>(null)
  const [splitCount, setSplitCount] = useState<number>(2)

  // TOAST / FEEDBACK NOTIFICATION
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  // VOID MODAL STATE (INSIDE EMBEDDED HISTORY)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'open' | 'preparing' | 'ready' | 'completed' | 'cancelled'>('all')
  const livePreparingOrders = useMemo(() => branchOrders.filter((o) => o.status === 'preparing'), [branchOrders])
  const liveReadyOrders = useMemo(() => branchOrders.filter((o) => o.status === 'ready'), [branchOrders])

  // ACTIVE TABLE ORDER DETECTION (FOR DINE-IN WORKFLOW)
  const activeTableOrder = useMemo(() => {
    if (orderChannel !== 'dine_in' || !selectedTable) return null
    return (
      branchOrders.find(
        (o) =>
          o.tableId === selectedTable.id &&
          (o.status === 'preparing' || o.status === 'ready' || o.status === 'open')
      ) || null
    )
  }, [orderChannel, selectedTable, branchOrders])

  const isViewingActiveTable = Boolean(activeTableOrder && orderChannel === 'dine_in')

  // EFFECTIVE CALCULATIONS
  const cartSubtotal = cart.reduce((s, it) => s + it.subtotal, 0)
  const effectiveSubtotal = isViewingActiveTable
    ? activeTableOrder!.subtotal + cartSubtotal
    : cartSubtotal

  const baseDiscount = isViewingActiveTable
    ? activeTableOrder!.discountAmount + discountAmount
    : discountAmount

  // COMPLIMENT: 100% DISCOUNT (RP 0 TAGIHAN)
  const effectiveDiscount = isCompliment ? effectiveSubtotal : baseDiscount
  const effectiveAfterDiscount = Math.max(0, effectiveSubtotal - effectiveDiscount)

  const effectiveServiceCharge = isCompliment
    ? 0
    : targetBranchOutlet.receiptConfig?.showServiceCharge
    ? Math.round(
        effectiveAfterDiscount *
          ((targetBranchOutlet.receiptConfig?.serviceChargeRatePct ?? 5) / 100)
      )
    : 0

  const effectiveTaxPB1 = isCompliment
    ? 0
    : targetBranchOutlet.receiptConfig?.showTax
    ? Math.round(
        (effectiveAfterDiscount + effectiveServiceCharge) *
          ((targetBranchOutlet.receiptConfig?.taxRatePct ?? 10) / 100)
      )
    : 0

  const effectiveGrandTotal = isCompliment
    ? 0
    : effectiveAfterDiscount + effectiveServiceCharge + effectiveTaxPB1

  const cashReceivedNum = Number(cashTender) || 0
  const effectiveChangeAmount =
    paymentMethod === 'cash' ? Math.max(0, cashReceivedNum - effectiveGrandTotal) : 0
  const isEffectiveCashInsufficient =
    paymentMethod === 'cash' &&
    !isCompliment &&
    cashReceivedNum < effectiveGrandTotal &&
    effectiveGrandTotal > 0

  // Quick Aliases
  const subtotal = effectiveSubtotal
  const grandTotal = effectiveGrandTotal
  const serviceCharge = effectiveServiceCharge
  const taxPB1 = effectiveTaxPB1
  const changeAmount = effectiveChangeAmount
  const isCashInsufficient = isEffectiveCashInsufficient

  // SMART CASH TENDER SUGGESTIONS RELATIVE TO GRAND TOTAL
  const cashSuggestions = useMemo(() => {
    if (grandTotal <= 0) return []
    const presets = new Set<number>()
    // 1. Exact amount
    presets.add(grandTotal)
    // 2. Next 10,000 round up
    const next10k = Math.ceil(grandTotal / 10000) * 10000
    if (next10k > grandTotal) presets.add(next10k)
    // 3. Next 50,000 round up
    const next50k = Math.ceil(grandTotal / 50000) * 50000
    if (next50k > grandTotal) presets.add(next50k)
    // 4. Next 100,000 round up
    const next100k = Math.ceil(grandTotal / 100000) * 100000
    if (next100k > grandTotal) presets.add(next100k)
    // 5. High denominations if relevant
    if (grandTotal < 500000 && grandTotal > 150000) {
      const next200k = Math.ceil(grandTotal / 200000) * 200000
      presets.add(next200k)
    }
    return Array.from(presets).sort((a, b) => a - b).slice(0, 4)
  }, [grandTotal])

  // DYNAMIC CATEGORIES FROM MENU ITEMS + SYSTEM DEFAULTS
  const availableCategories = useMemo(() => {
    const baseCats: { id: string; label: string }[] = [
      { id: 'cat-food', label: 'Makanan Utama' },
      { id: 'cat-snack', label: 'Snack & Bites' },
      { id: 'cat-coffee', label: 'Kopi & Espresso' },
      { id: 'cat-beverage', label: 'Minuman Bar' },
      { id: 'cat-dessert', label: 'Dessert & Pastry' },
    ]
    const baseMap = new Map(baseCats.map((c) => [c.id, c.label]))
    menuItems.forEach((m) => {
      if (!baseMap.has(m.categoryId)) {
        const label = m.categoryId
          .replace(/^cat-/, '')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        baseMap.set(m.categoryId, label)
      }
    })
    return Array.from(baseMap.entries()).map(([id, label]) => ({ id, label }))
  }, [menuItems])

  // FILTERED MENU ITEMS
  const filteredMenu = menuItems.filter((m) => {
    const matchCat = activeCategory === 'all' || m.categoryId === activeCategory
    const matchQuery = m.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchQuery
  })

  // FILTERED ORDERS FOR EMBEDDED HISTORY
  const filteredHistoryOrders = useMemo(() => {
    return branchOrders.filter((o) => {
      const matchStatus = historyStatusFilter === 'all' || o.status === historyStatusFilter
      if (!historySearch.trim()) return matchStatus
      const q = historySearch.toLowerCase()
      const matchQuery =
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.tableName && o.tableName.toLowerCase().includes(q))
      return matchStatus && matchQuery
    })
  }, [branchOrders, historySearch, historyStatusFilter])

  function handleItemClick(item: MenuItem) {
    if (item.active === false) {
      setFeedbackMsg({ type: 'info', text: `Menu "${item.name}" saat ini sedang habis.` })
      return
    }
    if (item.modifierGroupIds && item.modifierGroupIds.length > 0) {
      setSelectedMenuForMod(item)
      setActiveModifiers([])
    } else {
      addToCartDirect(item, [])
    }
  }

  function handleToggleMenuItemActive(item: MenuItem, e?: React.MouseEvent) {
    e?.stopPropagation()
    const updated: MenuItem = {
      ...item,
      active: !item.active,
    }
    onUpdateMenuItem?.(updated)
    setFeedbackMsg({
      type: 'info',
      text: `Status "${item.name}" diubah ke ${!item.active ? 'Tersedia' : 'Stok Habis'}.`,
    })
  }

  function addToCartDirect(item: MenuItem, modifiers: MenuItemModifier[]) {
    const modifierExtra = modifiers.reduce((s, m) => s + m.priceAdd, 0)
    const unitPrice = item.price + modifierExtra
    const lineId = `${item.id}-${modifiers.map((m) => m.id).sort().join('_')}`

    setCart((prev) => {
      const existing = prev.find((l) => l.id === lineId)
      if (existing) {
        return prev.map((l) =>
          l.id === lineId
            ? { ...l, qty: l.qty + 1, subtotal: (l.qty + 1) * unitPrice }
            : l
        )
      }
      return [
        ...prev,
        {
          id: lineId,
          menuItemId: item.id,
          name: item.name,
          price: unitPrice,
          qty: 1,
          subtotal: unitPrice,
          selectedModifiers: modifiers,
          isKitchenItem: item.isKitchenItem,
        },
      ]
    })
  }

  function changeLineQty(lineId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.id !== lineId) return l
          const newQty = l.qty + delta
          return { ...l, qty: newQty, subtotal: newQty * l.price }
        })
        .filter((l) => l.qty > 0)
    )
  }

  function updateLineNotes(lineId: string, notes: string) {
    setCart((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, notes } : l))
    )
  }

  // ACTION 1: SEND TO KITCHEN (DINE-IN OPEN BILL)
  function handleSendToKitchen() {
    if (cart.length === 0) return
    if (orderChannel === 'dine_in' && !selectedTable) {
      alert('Pilih nomor meja terlebih dahulu untuk membuka pesanan Dine-In')
      return
    }

    const now = Date.now()
    const orderNumber = `NBR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`

    const openOrder: Order = {
      id: `ord-${now}`,
      orgId: targetBranchOutlet.orgId,
      outletId: targetBranchOutletId,
      orderNumber,
      channel: orderChannel,
      tableId: orderChannel === 'dine_in' ? selectedTable?.id : undefined,
      tableName: orderChannel === 'dine_in' ? selectedTable?.name : undefined,
      customerName:
        customerName.trim() ||
        (orderChannel === 'dine_in' && selectedTable
          ? `Tamu ${selectedTable.name}`
          : orderChannel === 'takeaway'
          ? 'Takeaway'
          : orderChannel === 'delivery'
          ? 'Delivery Online'
          : 'Tamu Resto'),
      notes: orderNotes.trim() || undefined,
      items: cart.map((it) => ({ ...it, isCompletedInKitchen: false })),
      subtotal: cartSubtotal,
      discountAmount,
      serviceChargeAmount: effectiveServiceCharge,
      taxAmount: effectiveTaxPB1,
      total: effectiveGrandTotal,
      paymentMethod: 'qris',
      payments: [],
      status: 'preparing',
      createdAt: now,
      staffName: currentUser?.name || 'Kasir Utama',
    }

    if (onHoldOrder) {
      onHoldOrder(openOrder)
    }

    // OTOMATIS CETAK TIKET DAPUR & BAR (KOT/BOT)
    try {
      const kitchenTicketText = generateEscPosKitchenTicketText(openOrder, activeOutlet.receiptConfig, 'all')
      printThermalReceiptViaIframe(kitchenTicketText, activeOutlet.receiptConfig.paperWidth)
    } catch (err) {
      console.warn('[Thermal Printer] Gagal cetak tiket dapur:', err)
    }

    setFeedbackMsg({
      type: 'success',
      text: `Pesanan #${orderNumber} (${selectedTable?.name || 'Takeaway'}) dikirim ke KDS & Tiket Dapur (KOT) dicetak!`,
    })
    setTimeout(() => setFeedbackMsg(null), 4500)

    // Reset Form
    setCart([])
    setOrderNotes('')
    setDiscountAmount(0)
  }

  // ACTION 2: SEND ADD-ONS TO ACTIVE TABLE
  function handleSendAddonsToKitchen() {
    if (!activeTableOrder || cart.length === 0) return

    const now = Date.now()
    const newAddonItems: OrderLineItem[] = cart.map((it, idx) => ({
      ...it,
      id: `addon-${now}-${idx}`,
      isCompletedInKitchen: false,
    }))

    const updatedItems = [...activeTableOrder.items, ...newAddonItems]
    const updatedSubtotal = updatedItems.reduce((s, it) => s + it.subtotal, 0)
    const afterDisc = Math.max(0, updatedSubtotal - activeTableOrder.discountAmount)
    const updatedService = activeOutlet.receiptConfig.showServiceCharge
      ? Math.round(afterDisc * ((activeOutlet.receiptConfig.serviceChargeRatePct ?? 5) / 100))
      : 0
    const updatedTax = activeOutlet.receiptConfig.showTax
      ? Math.round((afterDisc + updatedService) * ((activeOutlet.receiptConfig.taxRatePct ?? 10) / 100))
      : 0
    const updatedTotal = afterDisc + updatedService + updatedTax

    const updatedOrder: Order = {
      ...activeTableOrder,
      items: updatedItems,
      subtotal: updatedSubtotal,
      serviceChargeAmount: updatedService,
      taxAmount: updatedTax,
      total: updatedTotal,
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder)
    }

    // CETAK TIKET TAMBAHAN KHUSUS ITEM BARU KE DAPUR
    try {
      const addonDummyOrder: Order = {
        ...updatedOrder,
        items: newAddonItems,
        notes: `TAMBAHAN PESANAN (ADD-ON) - ${selectedTable?.name || 'Meja'}`,
      }
      const addonTicketText = generateEscPosKitchenTicketText(addonDummyOrder, activeOutlet.receiptConfig, 'all')
      printThermalReceiptViaIframe(addonTicketText, activeOutlet.receiptConfig.paperWidth)
    } catch (err) {
      console.warn('[Thermal Printer] Gagal cetak tiket tambahan dapur:', err)
    }

    setFeedbackMsg({
      type: 'success',
      text: `Tambahan ${cart.reduce((s, it) => s + it.qty, 0)} item dikirim ke KDS & Tiket Tambahan Dapur dicetak!`,
    })
    setTimeout(() => setFeedbackMsg(null), 4500)

    setCart([])
  }

  // ACTION 2B: CETAK TIKET DAPUR / BAR SECARA MANUAL
  function handlePrintKitchenTicket(orderToPrint: Order, station: 'kitchen' | 'bar' | 'all' = 'kitchen') {
    try {
      const text = generateEscPosKitchenTicketText(orderToPrint, activeOutlet.receiptConfig, station)
      printThermalReceiptViaIframe(text, activeOutlet.receiptConfig.paperWidth)
      setFeedbackMsg({
        type: 'info',
        text: `Tiket ${station === 'kitchen' ? 'Dapur (KOT)' : station === 'bar' ? 'Bar (BOT)' : 'Checker'} dicetak untuk ${orderToPrint.tableName || 'Pesanan'}.`,
      })
      setTimeout(() => setFeedbackMsg(null), 3500)
    } catch (err) {
      console.warn('[Thermal Printer] Error:', err)
    }
  }

  // ACTION 2C: CETAK SEMUA TIKET (KASIR + DAPUR + BAR) DALAM 1 KLIK
  function handlePrintAllTickets(orderToPrint: Order) {
    try {
      setDrawerKicked(true)
      const receiptText = generateEscPosPlainText(orderToPrint, activeOutlet.receiptConfig)
      const kitchenText = generateEscPosKitchenTicketText(orderToPrint, activeOutlet.receiptConfig, 'kitchen')
      const barText = generateEscPosKitchenTicketText(orderToPrint, activeOutlet.receiptConfig, 'bar')

      const combined = [receiptText, kitchenText, barText].filter(Boolean).join('\n\n--- POTONG KERTAS ---\n\n')
      printThermalReceiptViaIframe(combined, activeOutlet.receiptConfig.paperWidth)

      setFeedbackMsg({
        type: 'success',
        text: 'Seluruh tiket (Struk Kasir + Tiket Dapur + Tiket Bar) berhasil dicetak!',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err) {
      console.warn('[Thermal Printer] Error:', err)
    }
  }

  // ACTION 3: PRE-PRINT CHECK (CETAK BILL SEMENTARA)
  function handlePrePrintCheck(orderToPrint: Order) {
    const text = generateEscPosPreBillText(orderToPrint, activeOutlet.receiptConfig)
    printThermalReceiptViaIframe(text, activeOutlet.receiptConfig.paperWidth)

    if (orderToPrint.tableId && onUpdateTableStatus) {
      onUpdateTableStatus(orderToPrint.tableId, 'billing')
    }

    setFeedbackMsg({
      type: 'info',
      text: `Bill sementara dicetak untuk ${orderToPrint.tableName || 'Pesanan'}. Status: Menunggu Bayar.`,
    })
    setTimeout(() => setFeedbackMsg(null), 4500)
  }

  // ACTION 4: SPLIT BILL TRIGGER
  function handleOpenSplitBill(order: Order) {
    setOrderForSplit(order)
    setSplitCount(2)
    setShowSplitBillModal(true)
  }

  // ACTION 4B: MENU MANAGEMENT (CRUD)
  function handleOpenNewMenuModal() {
    setEditingMenuItem(null)
    setIsCustomCategory(false)
    setCustomCategoryName('')
    setSelectedModifierGroupIds([])
    setMenuRecipeIngredients([])
    setMenuForm({
      name: '',
      categoryId: activeCategory === 'all' ? 'cat-food' : activeCategory,
      price: '',
      isKitchenItem: true,
      emoji: '🍽️',
      description: '',
      active: true,
    })
    setMenuModalTab('form')
    setShowMenuModal(true)
  }

  function handleOpenEditMenuModal(item: MenuItem) {
    setEditingMenuItem(item)
    const isKnown = availableCategories.some((c) => c.id === item.categoryId)
    setIsCustomCategory(!isKnown)
    setCustomCategoryName(!isKnown ? item.categoryId.replace(/^cat-/, '').replace(/[_-]/g, ' ') : '')
    setSelectedModifierGroupIds(item.modifierGroupIds || [])
    const existingRecipe = recipes?.find((r) => r.menuItemId === item.id)
    setMenuRecipeIngredients(existingRecipe ? [...existingRecipe.ingredients] : [])
    setMenuForm({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      isKitchenItem: item.isKitchenItem ?? true,
      emoji: item.emoji ?? '🍽️',
      description: item.description ?? '',
      active: item.active,
    })
    setMenuModalTab('form')
    setShowMenuModal(true)
  }

  function handleSaveMenuItem() {
    if (!menuForm.name.trim() || !menuForm.price) return
    const p = Number(menuForm.price)
    if (isNaN(p) || p <= 0) return

    let finalCategoryId = menuForm.categoryId
    if (isCustomCategory && customCategoryName.trim()) {
      finalCategoryId = `cat-${customCategoryName.trim().toLowerCase().replace(/\s+/g, '-')}`
    }

    const targetItemId = editingMenuItem ? editingMenuItem.id : `menu-custom-${Date.now()}`

    if (editingMenuItem) {
      const updated: MenuItem = {
        ...editingMenuItem,
        name: menuForm.name.trim(),
        categoryId: finalCategoryId,
        price: p,
        isKitchenItem: menuForm.isKitchenItem,
        emoji: menuForm.emoji,
        description: menuForm.description.trim() || undefined,
        active: menuForm.active,
        modifierGroupIds: selectedModifierGroupIds,
      }
      onUpdateMenuItem?.(updated)
      setFeedbackMsg({ type: 'success', text: `Menu "${updated.name}" berhasil diperbarui!` })
    } else {
      const newItem: MenuItem = {
        id: targetItemId,
        name: menuForm.name.trim(),
        categoryId: finalCategoryId,
        price: p,
        isKitchenItem: menuForm.isKitchenItem,
        emoji: menuForm.emoji,
        description: menuForm.description.trim() || undefined,
        active: menuForm.active,
        modifierGroupIds: selectedModifierGroupIds,
      }
      onAddMenuItem?.(newItem)
      setFeedbackMsg({ type: 'success', text: `Menu "${newItem.name}" berhasil ditambahkan ke kasir!` })
    }

    // SIMPAN RESEP BOM OTOMATIS JIKA ADA BAHAN BAKU TERPILIH
    if (menuRecipeIngredients.length > 0 && onAddOrUpdateRecipe) {
      let calcCost = 0
      menuRecipeIngredients.forEach((ing) => {
        const inv = inventory?.find((i) => i.id === ing.invItemId)
        if (inv) calcCost += inv.unitCost * ing.qty
      })
      onAddOrUpdateRecipe({
        id: `rec-${targetItemId}`,
        menuItemId: targetItemId,
        menuItemName: menuForm.name.trim(),
        ingredients: menuRecipeIngredients,
        laborCostStd: 0,
        overheadCostStd: 0,
        totalStdCost: Math.round(calcCost),
      })
    }

    setShowMenuModal(false)
  }

  function handleSaveNewModifierGroup() {
    if (!newModGroupName.trim()) {
      alert('Nama grup kustomisasi wajib diisi.')
      return
    }
    const cleanOptions = newModGroupOptions
      .filter((opt) => opt.name.trim().length > 0)
      .map((opt, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        name: opt.name.trim(),
        priceAdd: Number(opt.priceAdd) || 0,
      }))

    if (cleanOptions.length === 0) {
      alert('Tambahkan minimal 1 opsi kustomisasi.')
      return
    }

    const newGroup: ModifierGroup = {
      id: `grp-${Date.now()}`,
      name: newModGroupName.trim(),
      required: newModGroupRequired,
      maxSelection: 1,
      options: cleanOptions,
    }

    const updated = [...(modifierGroups || []), newGroup]
    onUpdateModifierGroups?.(updated)
    setSelectedModifierGroupIds((prev) => [...prev, newGroup.id])
    setShowCreateModifierGroupModal(false)
    setNewModGroupName('')
    setNewModGroupOptions([{ name: '', priceAdd: '0' }])
  }

  function handleDeleteMenuItemClick(itemId: string) {
    onDeleteMenuItem?.(itemId)
    setFeedbackMsg({ type: 'info', text: 'Menu berhasil dihapus dari sistem.' })
  }

  // ACTION 4C: TABLE MANAGEMENT (CRUD)
  function handleInitDefaultTablesForBranch(branchId: string) {
    const defaultTables: TableFloor[] = [
      { id: `tbl-${branchId}-1`, outletId: branchId, name: 'Meja 01', section: 'Indoor', capacity: 2, shape: 'square', status: 'available' },
      { id: `tbl-${branchId}-2`, outletId: branchId, name: 'Meja 02', section: 'Indoor', capacity: 4, shape: 'rect', status: 'available' },
      { id: `tbl-${branchId}-3`, outletId: branchId, name: 'Meja 03', section: 'Indoor', capacity: 4, shape: 'rect', status: 'available' },
      { id: `tbl-${branchId}-4`, outletId: branchId, name: 'Meja 04', section: 'Indoor', capacity: 6, shape: 'rect', status: 'available' },
      { id: `tbl-${branchId}-5`, outletId: branchId, name: 'Meja 05 (Outdoor)', section: 'Outdoor', capacity: 4, shape: 'round', status: 'available' },
      { id: `tbl-${branchId}-6`, outletId: branchId, name: 'Meja 06 (VIP)', section: 'VIP', capacity: 8, shape: 'rect', status: 'available' },
    ]
    defaultTables.forEach((tb) => onAddTable?.(tb))
    setFeedbackMsg({ type: 'success', text: `6 Meja standar berhasil diinisialisasi untuk ${targetBranchOutlet.name}!` })
  }

  function handleOpenNewTableModal() {
    setEditingTable(null)
    setTableForm({
      name: `Meja ${(branchTables.length + 1).toString().padStart(2, '0')}`,
      section: 'Indoor',
      capacity: 4,
      shape: 'square',
    })
    setTableModalTab('form')
    setShowTableModal(true)
  }

  function handleOpenEditTableModal(table: TableFloor) {
    setEditingTable(table)
    setTableForm({
      name: table.name,
      section: table.section,
      capacity: table.capacity,
      shape: table.shape || 'square',
    })
    setTableModalTab('form')
    setShowTableModal(true)
  }

  function handleSaveTable() {
    if (!tableForm.name.trim()) return

    if (editingTable) {
      const updated: TableFloor = {
        ...editingTable,
        name: tableForm.name.trim(),
        section: tableForm.section,
        capacity: tableForm.capacity,
        shape: tableForm.shape,
      }
      onUpdateTable?.(updated)
      setFeedbackMsg({ type: 'success', text: `Meja "${updated.name}" berhasil diperbarui!` })
    } else {
      const newTbl: TableFloor = {
        id: `tbl-${Date.now()}`,
        outletId: targetBranchOutletId,
        name: tableForm.name.trim(),
        section: tableForm.section,
        capacity: tableForm.capacity,
        shape: tableForm.shape,
        status: 'available',
      }
      onAddTable?.(newTbl)
      setFeedbackMsg({ type: 'success', text: `Meja "${newTbl.name}" berhasil ditambahkan ke denah resto!` })
    }
    setShowTableModal(false)
  }

  function handleDeleteTableClick(tableId: string) {
    onDeleteTable?.(tableId)
    setTableActionModal(null)
    setFeedbackMsg({ type: 'info', text: 'Meja berhasil dihapus dari sistem.' })
  }

  // ACTION 5: CHECKOUT ACTIVE TABLE (LUNAS & TUTUP MEJA)
  function handleCheckoutActiveTable() {
    if (!activeTableOrder || isEffectiveCashInsufficient) return

    let finalItems = activeTableOrder.items
    if (cart.length > 0) {
      finalItems = [
        ...activeTableOrder.items,
        ...cart.map((it, idx) => ({ ...it, id: `addon-${Date.now()}-${idx}`, isCompletedInKitchen: true })),
      ]
    }

    const finalSubtotal = effectiveSubtotal
    const finalGrandTotal = effectiveGrandTotal
    const now = Date.now()
    const estimatedCogs = Math.round(finalSubtotal * 0.3)
    const finalDiscountAmount = isCompliment ? finalSubtotal : effectiveDiscount
    const finalPaymentMethod: PaymentMethod = isCompliment ? 'compliment' : paymentMethod
    const finalPayments = isCompliment
      ? [{ method: 'compliment' as PaymentMethod, amount: 0 }]
      : [{ method: paymentMethod, amount: finalGrandTotal }]

    const completed: Order = {
      ...activeTableOrder,
      items: finalItems,
      subtotal: finalSubtotal,
      discountAmount: finalDiscountAmount,
      discountNote: isCompliment ? `COMPLIMENT: ${complimentReason}` : (discountNote || undefined),
      isCompliment,
      complimentReason: isCompliment ? complimentReason : undefined,
      serviceChargeAmount: isCompliment ? 0 : effectiveServiceCharge,
      taxAmount: isCompliment ? 0 : effectiveTaxPB1,
      total: finalGrandTotal,
      paymentMethod: finalPaymentMethod,
      payments: finalPayments,
      cashReceived: paymentMethod === 'cash' && !isCompliment ? cashReceivedNum : null,
      changeAmount: paymentMethod === 'cash' && !isCompliment ? effectiveChangeAmount : null,
      status: 'completed',
      completedAt: now,
      staffName: currentUser?.name || 'Kasir Utama',
    }

    onOrderComplete(completed, estimatedCogs)
    setCompletedOrder(completed)
    setShowReceiptModal(true)

    // Reset Form
    setCart([])
    setCustomerName('')
    setOrderNotes('')
    setDiscountAmount(0)
    setDiscountNote('')
    setIsCompliment(false)
    setCashTender('')
    setSelectedTable(null)
    setMobileCartDrawerOpen(false)
  }

  // ACTION 6: STANDARD DIRECT CHECKOUT (FAST SERVICE / COUNTER)
  function handleCheckout() {
    if (isViewingActiveTable) {
      handleCheckoutActiveTable()
      return
    }

    if (cart.length === 0 || isCashInsufficient) return

    const now = Date.now()
    const orderNumber = `NBR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`

    // Fallback HPP 30% jika resep belum terdaftar
    const estimatedCogs = Math.round(subtotal * 0.3)
    const finalDiscountAmount = isCompliment ? subtotal : discountAmount
    const finalPaymentMethod: PaymentMethod = isCompliment ? 'compliment' : paymentMethod
    const finalPayments = isCompliment
      ? [{ method: 'compliment' as PaymentMethod, amount: 0 }]
      : [{ method: paymentMethod, amount: grandTotal }]

    const order: Order = {
      id: `ord-${now}`,
      orgId: targetBranchOutlet.orgId,
      outletId: targetBranchOutletId,
      orderNumber,
      channel: orderChannel,
      tableId: orderChannel === 'dine_in' ? selectedTable?.id : undefined,
      tableName: orderChannel === 'dine_in' ? selectedTable?.name : undefined,
      customerName:
        customerName.trim() ||
        (orderChannel === 'dine_in' && selectedTable
          ? `Tamu ${selectedTable.name}`
          : orderChannel === 'takeaway'
          ? 'Takeaway'
          : orderChannel === 'delivery'
          ? 'Delivery Online'
          : 'Tamu Resto'),
      notes: orderNotes.trim() || undefined,
      items: cart,
      subtotal,
      discountAmount: finalDiscountAmount,
      discountNote: isCompliment ? `COMPLIMENT: ${complimentReason}` : (discountNote || undefined),
      isCompliment,
      complimentReason: isCompliment ? complimentReason : undefined,
      serviceChargeAmount: isCompliment ? 0 : serviceCharge,
      taxAmount: isCompliment ? 0 : taxPB1,
      total: grandTotal,
      paymentMethod: finalPaymentMethod,
      payments: finalPayments,
      cashReceived: paymentMethod === 'cash' && !isCompliment ? cashReceivedNum : null,
      changeAmount: paymentMethod === 'cash' && !isCompliment ? changeAmount : null,
      status: 'completed',
      createdAt: now,
      completedAt: now,
      staffName: currentUser?.name || 'Kasir Utama',
    }

    onOrderComplete(order, estimatedCogs)
    setCompletedOrder(order)
    setShowReceiptModal(true)

    // Reset Form
    setCart([])
    setCustomerName('')
    setOrderNotes('')
    setDiscountAmount(0)
    setDiscountNote('')
    setIsCompliment(false)
    setCashTender('')
    setSelectedTable(null)
    setMobileCartDrawerOpen(false)
  }

  function handleTriggerVoid(order: Order) {
    setOrderToVoid(order)
    setVoidReason('')
    setShowVoidModal(true)
  }

  function handleConfirmVoid() {
    if (!orderToVoid || !voidReason.trim() || !onVoidOrder) return
    onVoidOrder(orderToVoid.id, voidReason.trim())
    setShowVoidModal(false)
    setOrderToVoid(null)
  }

  return (
    <div className="space-y-4 select-none">
      {/* HQ OPERATIONAL BRANCH SELECTOR BANNER */}
      {isHqMode && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-amber-800" />
            <div>
              <span className="text-xs font-bold text-amber-950">Mode Kasir Cabang Fisik:</span>
              <span className="text-[11px] text-amber-900 ml-1.5 hidden sm:inline">
                Saat ini melayani kasir & denah meja: <strong>{targetBranchOutlet.name}</strong>.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {outlets
              .filter((o) => o.id !== 'all')
              .map((out) => (
                <button
                  key={out.id}
                  type="button"
                  onClick={() => onSelectOutlet?.(out)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    targetBranchOutletId === out.id
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-neutral-800 border border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  📍 {out.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 1. TOP POS CONTROL BAR: VIEW SWITCHER & TABLE INDICATOR */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {/* VIEW TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F4] rounded-xl border border-[#E7E5E4]">
          <button
            type="button"
            onClick={() => setPosView('catalog')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              posView === 'catalog'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-stone-200/50'
            }`}
          >
            <UtensilsCrossed size={14} />
            <span>Katalog Menu & Kasir</span>
          </button>

          <button
            type="button"
            onClick={() => setPosView('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              posView === 'history'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-stone-200/50'
            }`}
          >
            <ReceiptText size={14} />
            <span>Riwayat Struk Kasir</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                posView === 'history' ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              {branchOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPosView('tables')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              posView === 'tables'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-stone-200/50'
            }`}
          >
            <Store size={14} />
            <span className="hidden md:inline">Denah Meja</span>
            <span className="text-[10px] font-semibold text-neutral-500">
              ({branchTables.filter((t) => t.status === 'occupied').length} Terisi)
            </span>
          </button>
        </div>

        {/* LIVE ORDER STATUS TRACKER CHIPS */}
        <div className="flex items-center gap-2">
          {liveReadyOrders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setHistoryStatusFilter('ready')
                setPosView('history')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs animate-pulse cursor-pointer transition-colors"
              title="Pesanan telah siap disajikan ke meja!"
            >
              <BellRing size={13} />
              <span>{liveReadyOrders.length} Siap Saji</span>
            </button>
          )}

          {livePreparingOrders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setHistoryStatusFilter('preparing')
                setPosView('history')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs cursor-pointer transition-colors"
              title="Pesanan sedang dimasak di dapur"
            >
              <ChefHat size={13} className="text-amber-700" />
              <span>{livePreparingOrders.length} Dimasak</span>
            </button>
          )}

          {/* ACTIVE TABLE / CHANNEL STATUS BADGE */}
          {orderChannel === 'dine_in' ? (
            selectedTable ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  activeTableOrder
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <Store size={14} className={activeTableOrder ? 'text-blue-700' : 'text-emerald-700'} />
                <span>
                  Meja Terpilih: <strong>{selectedTable.name}</strong> ({selectedTable.section})
                  {activeTableOrder && ` · Aktif (${formatRupiah(activeTableOrder.total)})`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="text-neutral-500 hover:text-black ml-1 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                <span>Dine-In: Belum pilih meja</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-800">
              <span>{orderChannel === 'takeaway' ? 'Pesanan Bungkus (Takeaway)' : 'Pesanan Delivery'}</span>
            </div>
          )}

          {onViewTransactions && (
            <button
              type="button"
              onClick={onViewTransactions}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7E5E4] bg-white hover:bg-stone-100 text-xs font-semibold text-neutral-700 cursor-pointer transition-colors"
              title="Buka laporan transaksi lengkap & rekap shift"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Pembukuan Struk</span>
            </button>
          )}
        </div>
      </div>

      {/* 1B. RESTAURANT TOAST NOTIFICATION */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-1 duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={16}
              className={feedbackMsg.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}
            />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-neutral-400 hover:text-black cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. MAIN VIEW SWITCHER BODY */}

      {/* 2A. VIEW: EMBEDDED TRANSACTIONS HISTORY (DIRECT ACCESS FROM POS) */}
      {posView === 'history' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col gap-3 pb-3 border-b border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
                  <ReceiptText size={18} />
                  <span>Riwayat Transaksi & Pelacakan Pesanan Kasir</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Pantau alur pesanan (Dimasak ➔ Siap Saji ➔ Selesai), cetak ulang struk roll, atau batalkan pesanan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Cari no. struk, meja, tamu..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPosView('catalog')}
                  className="px-3 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                >
                  + Transaksi Baru
                </button>
              </div>
            </div>

            {/* QUICK STATUS TRACKER TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
              {[
                { id: 'all' as const, label: 'Semua Pesanan', count: orders.length, icon: null },
                { id: 'preparing' as const, label: 'Sedang Dimasak', count: livePreparingOrders.length, icon: ChefHat },
                { id: 'ready' as const, label: 'Siap Saji', count: liveReadyOrders.length, icon: BellRing },
                { id: 'completed' as const, label: 'Lunas Selesai', count: orders.filter((o) => o.status === 'completed').length, icon: CheckCircle2 },
                { id: 'open' as const, label: 'Open Bill', count: orders.filter((o) => o.status === 'open').length, icon: Clock },
                { id: 'cancelled' as const, label: 'Void / Batal', count: orders.filter((o) => o.status === 'cancelled').length, icon: RotateCcw },
              ].map((tab) => {
                const isSelected = historyStatusFilter === tab.id
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-[#F8F7F4] text-neutral-600 border-stone-200 hover:bg-stone-200/60 hover:text-black'
                    }`}
                  >
                    {Icon && <Icon size={12} className={isSelected ? 'text-white' : 'text-neutral-500'} />}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-neutral-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* TABLE OF ORDERS */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] border-b border-stone-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">No. Struk</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Meja / Saluran</th>
                  <th className="py-2.5 px-3">Tamu</th>
                  <th className="py-2.5 px-3">Item Menu</th>
                  <th className="py-2.5 px-3">Metode Bayar</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status Pesanan</th>
                  <th className="py-2.5 px-3 text-right">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHistoryOrders.map((ord) => {
                  const isVoid = ord.status === 'cancelled'
                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-stone-50/80 transition-colors ${isVoid ? 'opacity-50 bg-rose-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-black">{ord.orderNumber}</td>
                      <td className="py-2.5 px-3 text-neutral-500 tabular-nums">
                        {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">
                        {ord.tableName || (ord.channel === 'takeaway' ? 'Takeaway' : 'Counter')}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">{ord.customerName || 'Tamu Resto'}</td>
                      <td className="py-2.5 px-3 text-neutral-600 max-w-xs truncate">
                        {ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold uppercase text-[11px] text-neutral-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-black tabular-nums">
                        {formatRupiah(ord.total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isVoid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <RotateCcw size={10} />
                            <span>VOID</span>
                          </span>
                        ) : ord.status === 'preparing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <ChefHat size={10} className="text-amber-700" />
                            <span>DIMASAK</span>
                          </span>
                        ) : ord.status === 'ready' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 animate-pulse">
                            <BellRing size={10} className="text-blue-700" />
                            <span>SIAP SAJI</span>
                          </span>
                        ) : ord.status === 'open' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-300">
                            <Clock size={10} className="text-stone-600" />
                            <span>OPEN BILL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={10} className="text-emerald-700" />
                            <span>LUNAS</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* QUICK STATUS TRANSITION BUTTONS */}
                          {ord.status === 'preparing' && onUpdateOrderStatus && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateOrderStatus(ord.id, 'ready')
                                setFeedbackMsg({ type: 'success', text: `Pesanan #${ord.orderNumber} ditandai Siap Saji!` })
                              }}
                              title="Tandai Siap Saji (Ready to Serve)"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition-colors"
                            >
                              <BellRing size={14} />
                            </button>
                          )}
                          {ord.status === 'ready' && onUpdateOrderStatus && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateOrderStatus(ord.id, 'completed')
                                setFeedbackMsg({ type: 'success', text: `Pesanan #${ord.orderNumber} selesai & disajikan!` })
                              }}
                              title="Tandai Selesai & Disajikan"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}

                          {/* 1-CLICK THERMAL REPRINT */}
                          <button
                            type="button"
                            onClick={() => {
                              printThermalReceiptViaIframe(
                                generateEscPosPlainText(ord, activeOutlet.receiptConfig),
                                activeOutlet.receiptConfig.paperWidth
                              )
                            }}
                            title="Cetak Struk Thermal (ESC/POS)"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-neutral-800 cursor-pointer transition-colors border border-stone-200"
                          >
                            <Printer size={14} />
                          </button>

                          {/* 1-CLICK PDF ROLL */}
                          <button
                            type="button"
                            onClick={() => downloadThermalReceiptPdf(ord, activeOutlet.receiptConfig)}
                            title="Unduh PDF Struk Roll"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-neutral-800 cursor-pointer transition-colors border border-stone-200"
                          >
                            <FileDown size={14} />
                          </button>

                          {/* VOID BUTTON */}
                          {!isVoid && onVoidOrder && (
                            <button
                              type="button"
                              onClick={() => handleTriggerVoid(ord)}
                              title="Batalkan / Void Transaksi"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors border border-rose-200"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredHistoryOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-neutral-400 text-xs">
                      Belum ada transaksi struk kasir yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2B. VIEW: TABLE FLOOR MAP & LIVE BILL MONITOR */}
      {/* 2B. VIEW: TABLE FLOOR MAP & LIVE FLOOR MONITOR (DINER DASH STYLE) */}
      {posView === 'tables' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 space-y-5 shadow-2xs">
          {/* HEADER & TOP CONTROLS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <Store size={18} className="text-black" />
                <h2 className="text-base font-bold text-black tracking-tight">
                  Denah Meja Dine-In
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* STATUS INDICATORS */}
              <div className="flex items-center gap-3 text-xs text-neutral-600 font-medium px-3 py-1.5 bg-[#F8F7F4] rounded-xl border border-stone-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  <span className="font-bold text-neutral-800">{branchTables.filter((t) => t.status === 'available').length}</span> Kosong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                  <span className="font-bold text-neutral-800">{branchTables.filter((t) => t.status === 'occupied').length}</span> Terisi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 animate-pulse" />
                  <span className="font-bold text-neutral-800">{branchTables.filter((t) => t.status === 'billing').length}</span> Billing
                </span>
              </div>

              {/* TABLE MANAGEMENT BUTTONS */}
              <button
                type="button"
                onClick={handleOpenNewTableModal}
                className="py-2 px-3.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>+ Tambah Meja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTableModalTab('list')
                  setShowTableModal(true)
                }}
                className="py-2 px-3 rounded-xl bg-white border border-stone-300 hover:border-black text-xs font-bold text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>Kelola Meja ({branchTables.length})</span>
              </button>
            </div>
          </div>

          {/* SUB-BAR: SECTION TABS & VIEW MODE SWITCHER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8F7F4] p-2 rounded-xl border border-stone-200">
            {/* SECTION FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: `Semua (${branchTables.length})` },
                { id: 'Indoor' as const, label: `Indoor (${branchTables.filter((t) => t.section === 'Indoor').length})` },
                { id: 'Outdoor' as const, label: `Outdoor (${branchTables.filter((t) => t.section === 'Outdoor').length})` },
                { id: 'VIP' as const, label: `VIP (${branchTables.filter((t) => t.section === 'VIP').length})` },
                { id: 'Bar' as const, label: `Bar (${branchTables.filter((t) => t.section === 'Bar').length})` },
              ].map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedFloorSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedFloorSection === sec.id
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-neutral-700 border border-stone-200 hover:border-black'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg border border-stone-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFloorplanMode('diner_dash')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  floorplanMode === 'diner_dash'
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Store size={13} />
                <span>Denah Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setFloorplanMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  floorplanMode === 'grid'
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Daftar Grid</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* OPTION A: DINER DASH INTERACTIVE TOP-DOWN FLOORPLAN CANVAS */}
          {/* ============================================================ */}
          {floorplanMode === 'diner_dash' && (
            <div className="space-y-6">
              {branchTables.length === 0 ? (
                <div className="bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-700 mx-auto flex items-center justify-center">
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black">Belum Ada Meja di {targetBranchOutlet.name}</h3>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                      Cabang ini belum memiliki denah meja untuk transaksi Dine-In. Anda dapat menginisialisasi denah default atau menambahkan meja manual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInitDefaultTablesForBranch(targetBranchOutletId)}
                    className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                  >
                    + Inisialisasi 6 Meja Standar Cabang Ini
                  </button>
                </div>
              ) : (
                <div className="bg-[#FAF9F5] border-2 border-stone-300 rounded-2xl p-6 sm:p-8 relative min-h-[540px] shadow-inner overflow-x-auto">
                  {/* FLOOR ZONES BY SECTION */}
                  {(['Indoor', 'Outdoor', 'VIP', 'Bar'] as const)
                    .filter((sec) => selectedFloorSection === 'all' || selectedFloorSection === sec)
                    .map((sectionName) => {
                      const sectionTables = branchTables.filter((t) => t.section === sectionName)
                      if (sectionTables.length === 0) return null

                      const sectionTitle = `Area ${sectionName}`

                      return (
                        <div key={sectionName} className="mb-8 last:mb-0">
                          {/* ZONE DIVIDER / BANNER */}
                          <div className="flex items-center justify-between pb-2 mb-4 border-b border-stone-200 text-xs">
                            <span className="font-bold text-stone-800 tracking-tight">
                              {sectionTitle}
                            </span>
                            <span className="text-stone-400 font-medium">
                              {sectionTables.length} Meja
                            </span>
                          </div>

                          {/* TABLES IN THIS SECTION */}
                          <div className="flex flex-wrap items-center gap-8 justify-start py-2">
                            {sectionTables.map((t) => {
                              const isSelected = selectedTable?.id === t.id
                              const activeOrder = branchOrders.find(
                                (o) =>
                                  o.tableId === t.id &&
                                  (o.status === 'preparing' || o.status === 'ready' || o.status === 'open')
                              )
                            const elapsedMin = activeOrder
                              ? Math.round((Date.now() - activeOrder.createdAt) / 60000)
                              : 0
                            const tableShape = t.shape || 'square'

                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  setSelectedTable(t)
                                  setOrderChannel('dine_in')
                                  setPosView('catalog')
                                }}
                                className="group relative flex flex-col items-center cursor-pointer select-none transition-transform duration-150 hover:scale-105 active:scale-95"
                              >
                                {/* QUICK TABLE SETTINGS ICON BUTTON (EDIT / MOVE / DELETE) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTableActionModal(t)
                                  }}
                                  title="Opsi & Tindakan Meja (Edit/Pindah/Hapus)"
                                  className="absolute -top-1.5 -right-1.5 z-20 w-6 h-6 rounded-full bg-white border border-stone-300 hover:border-black flex items-center justify-center text-stone-500 hover:text-black shadow-xs cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                                >
                                  <SlidersHorizontal size={11} />
                                </button>
                                {/* ---------------- DINER DASH TABLE SHAPE RENDERING ---------------- */}
                                
                                {/* 1. ROUND TABLE */}
                                {tableShape === 'round' && (
                                  <div className="relative w-32 h-32 flex items-center justify-center">
                                    {/* CHAIR CUSHIONS (4 SEATS RADIAL) */}
                                    <div
                                      className={`absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-5 rounded-t-lg border transition-colors ${
                                        activeOrder
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder ? '👤' : ''}
                                    </div>
                                    <div
                                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-5 rounded-b-lg border transition-colors ${
                                        activeOrder && activeOrder.items.length > 1
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder && activeOrder.items.length > 1 ? '👤' : ''}
                                    </div>
                                    <div
                                      className={`absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-7 rounded-l-lg border transition-colors ${
                                        activeOrder && activeOrder.items.length > 2
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder && activeOrder.items.length > 2 ? '👤' : ''}
                                    </div>
                                    <div
                                      className={`absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-7 rounded-r-lg border transition-colors ${
                                        activeOrder && activeOrder.items.length > 3
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder && activeOrder.items.length > 3 ? '👤' : ''}
                                    </div>

                                    {/* CENTRAL CIRCULAR TABLE TOP */}
                                    <div
                                      className={`w-24 h-24 rounded-full border-3 flex flex-col items-center justify-center p-2 text-center transition-all shadow-md ${
                                        isSelected
                                          ? 'ring-4 ring-black border-black bg-stone-100'
                                          : t.status === 'available'
                                          ? 'bg-[#EFECE6] border-stone-400 text-stone-700 hover:border-emerald-600'
                                          : t.status === 'occupied'
                                          ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-300'
                                          : 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                                      }`}
                                    >
                                      {/* TABLE CENTER ICON */}
                                      <div className="text-sm leading-none">
                                        {t.status === 'available'
                                          ? '🍽️'
                                          : t.status === 'occupied'
                                          ? '🍜'
                                          : '🧾'}
                                      </div>
                                      <div className="font-extrabold text-xs text-black mt-1 leading-tight">
                                        {t.name}
                                      </div>
                                      <div className="text-[10px] text-stone-500 font-medium">
                                        {t.capacity} Kursi
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 2. SQUARE TABLE */}
                                {tableShape === 'square' && (
                                  <div className="relative w-32 h-32 flex items-center justify-center">
                                    {/* CHAIR CUSHIONS (4 SIDES) */}
                                    <div
                                      className={`absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-5 rounded-t-lg border transition-colors ${
                                        activeOrder
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder ? '👤' : ''}
                                    </div>
                                    <div
                                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-5 rounded-b-lg border transition-colors ${
                                        activeOrder && activeOrder.items.length > 1
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder && activeOrder.items.length > 1 ? '👤' : ''}
                                    </div>
                                    <div
                                      className={`absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-7 rounded-l-lg border transition-colors ${
                                        activeOrder && activeOrder.items.length > 2
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder && activeOrder.items.length > 2 ? '👤' : ''}
                                    </div>
                                    <div
                                      className={`absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-7 rounded-r-lg border transition-colors ${
                                        activeOrder && activeOrder.items.length > 3
                                          ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                          : 'bg-stone-300 border-stone-400'
                                      }`}
                                    >
                                      {activeOrder && activeOrder.items.length > 3 ? '👤' : ''}
                                    </div>

                                    {/* CENTRAL SQUARE TABLE TOP */}
                                    <div
                                      className={`w-24 h-24 rounded-2xl border-3 flex flex-col items-center justify-center p-2 text-center transition-all shadow-md ${
                                        isSelected
                                          ? 'ring-4 ring-black border-black bg-stone-100'
                                          : t.status === 'available'
                                          ? 'bg-[#EFECE6] border-stone-400 text-stone-700 hover:border-emerald-600'
                                          : t.status === 'occupied'
                                          ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-300'
                                          : 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                                      }`}
                                    >
                                      <div className="text-sm leading-none">
                                        {t.status === 'available'
                                          ? '🍽️'
                                          : t.status === 'occupied'
                                          ? '🥘'
                                          : '🧾'}
                                      </div>
                                      <div className="font-extrabold text-xs text-black mt-1 leading-tight">
                                        {t.name}
                                      </div>
                                      <div className="text-[10px] text-stone-500 font-medium">
                                        {t.capacity} Kursi
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 3. RECTANGULAR TABLE (VIP / LARGE 6-8 SEATER) */}
                                {tableShape === 'rect' && (
                                  <div className="relative w-48 h-28 flex items-center justify-center">
                                    {/* 3 CHAIRS ON TOP */}
                                    <div className="absolute -top-2 inset-x-4 flex justify-between">
                                      {[1, 2, 3].map((seat) => (
                                        <div
                                          key={seat}
                                          className={`w-7 h-5 rounded-t-lg border transition-colors ${
                                            activeOrder
                                              ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                              : 'bg-stone-300 border-stone-400'
                                          }`}
                                        >
                                          {activeOrder ? '👤' : ''}
                                        </div>
                                      ))}
                                    </div>
                                    {/* 3 CHAIRS ON BOTTOM */}
                                    <div className="absolute -bottom-2 inset-x-4 flex justify-between">
                                      {[1, 2, 3].map((seat) => (
                                        <div
                                          key={seat}
                                          className={`w-7 h-5 rounded-b-lg border transition-colors ${
                                            activeOrder
                                              ? 'bg-blue-600 border-blue-800 text-[10px] flex items-center justify-center text-white'
                                              : 'bg-stone-300 border-stone-400'
                                          }`}
                                        >
                                          {activeOrder ? '👤' : ''}
                                        </div>
                                      ))}
                                    </div>

                                    {/* RECTANGULAR TABLE TOP */}
                                    <div
                                      className={`w-40 h-20 rounded-2xl border-3 flex flex-row items-center justify-around px-3 text-center transition-all shadow-md ${
                                        isSelected
                                          ? 'ring-4 ring-black border-black bg-stone-100'
                                          : t.status === 'available'
                                          ? 'bg-[#EFECE6] border-stone-400 text-stone-700 hover:border-emerald-600'
                                          : t.status === 'occupied'
                                          ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-300'
                                          : 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                                      }`}
                                    >
                                      <div className="text-xl">
                                        {t.status === 'available' ? '🍽️' : t.status === 'occupied' ? '🥩 🍷' : '🧾'}
                                      </div>
                                      <div>
                                        <div className="font-extrabold text-xs text-black leading-tight">
                                          {t.name}
                                        </div>
                                        <div className="text-[10px] text-stone-500 font-medium">
                                          VIP · {t.capacity} Kursi
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 4. BAR COUNTER */}
                                {tableShape === 'bar' && (
                                  <div className="relative w-52 h-24 flex flex-col items-center justify-center">
                                    {/* LONG WOODEN BAR TOP */}
                                    <div
                                      className={`w-48 h-12 rounded-xl border-3 flex items-center justify-between px-3 transition-all shadow-md ${
                                        isSelected
                                          ? 'ring-4 ring-black border-black bg-stone-900 text-white'
                                          : t.status === 'available'
                                          ? 'bg-stone-800 border-stone-600 text-stone-100 hover:border-amber-500'
                                          : t.status === 'occupied'
                                          ? 'bg-stone-900 border-blue-500 text-white ring-2 ring-blue-300'
                                          : 'bg-stone-900 border-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🍸</span>
                                        <div className="text-left">
                                          <div className="font-extrabold text-xs leading-tight">{t.name}</div>
                                          <div className="text-[9px] text-stone-300">Bar Counter</div>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-mono text-stone-300">{t.capacity} Stools</span>
                                    </div>

                                    {/* ROW OF 4 ROUND BARSTOOLS IN FRONT */}
                                    <div className="flex items-center justify-between w-40 mt-1">
                                      {[1, 2, 3, 4].map((stool) => (
                                        <div
                                          key={stool}
                                          className={`w-5 h-5 rounded-full border transition-colors ${
                                            activeOrder
                                              ? 'bg-amber-600 border-amber-800 text-[8px] flex items-center justify-center text-white'
                                              : 'bg-stone-400 border-stone-500'
                                          }`}
                                        >
                                          {activeOrder ? '👤' : ''}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* ---------------- FLOATING STATUS BADGE BELOW TABLE ---------------- */}
                                <div className="mt-1.5 flex flex-col items-center gap-0.5">
                                  {activeOrder ? (
                                    <div className="flex flex-col items-center">
                                      <span
                                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                                          t.status === 'billing'
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                                        }`}
                                      >
                                        <Clock size={10} />
                                        <span>{elapsedMin}m</span>
                                        <span>·</span>
                                        <span className="tabular-nums font-bold">
                                          {formatRupiah(activeOrder.total)}
                                        </span>
                                      </span>
                                      <span className="text-[9px] text-stone-500 mt-0.5 font-medium">
                                        {activeOrder.customerName || 'Tamu'} ({activeOrder.items.reduce((s, it) => s + it.qty, 0)} item)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Siap Tamu
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* OPTION B: GRID CARD VIEW (ALTERNATIVE TRADITIONAL VIEW)       */}
          {/* ============================================================ */}
          {floorplanMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {branchTables
                .filter((t) => selectedFloorSection === 'all' || t.section === selectedFloorSection)
                .map((t) => {
                  const isSelected = selectedTable?.id === t.id
                  const activeOrder = branchOrders.find(
                    (o) =>
                      o.tableId === t.id &&
                      (o.status === 'preparing' || o.status === 'ready' || o.status === 'open')
                  )
                  const elapsedMin = activeOrder
                    ? Math.round((Date.now() - activeOrder.createdAt) / 60000)
                    : 0

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-black ring-2 ring-black bg-[#F8F7F4]'
                          : t.status === 'available'
                          ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400'
                          : t.status === 'occupied'
                          ? 'border-blue-200 bg-blue-50/30 hover:border-blue-400'
                          : 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-black flex items-center gap-1.5">
                              <span>{t.name}</span>
                              <span className="text-[11px] font-normal text-neutral-500">
                                ({t.section})
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                              <span>Kapasitas: {t.capacity} Kursi</span>
                              <span>·</span>
                              <span className="capitalize text-neutral-600 font-medium">Bentuk: {t.shape || 'Kotak'}</span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              t.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : t.status === 'occupied'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {t.status === 'available'
                              ? 'KOSONG'
                              : t.status === 'occupied'
                              ? 'TERISI'
                              : 'BILLING'}
                          </span>
                        </div>

                        {/* ACTIVE ORDER SUMMARY IF OCCUPIED / BILLING */}
                        {activeOrder ? (
                          <div className="p-2.5 rounded-lg bg-white border border-stone-200 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-neutral-600">
                              <span className="font-medium truncate max-w-[150px]">
                                {activeOrder.customerName || 'Tamu Resto'}
                              </span>
                              <span className="tabular-nums text-neutral-400 font-mono text-[11px]">
                                {elapsedMin}m lalu
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-stone-100">
                              <span className="text-[11px] text-neutral-500">
                                {activeOrder.items.reduce((s, it) => s + it.qty, 0)} item pesanan
                              </span>
                              <span className="font-extrabold text-black tabular-nums">
                                {formatRupiah(activeOrder.total)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-white/60 border border-dashed border-stone-200 text-xs text-neutral-400 text-center">
                            Meja siap untuk tamu baru
                          </div>
                        )}
                      </div>

                      {/* QUICK ACTIONS ON TABLE CARD */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {activeOrder ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTable(t)
                                setOrderChannel('dine_in')
                                setPosView('catalog')
                              }}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all text-center cursor-pointer shadow-2xs"
                            >
                              Kelola Tagihan
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrePrintCheck(activeOrder)}
                              title="Cetak Bill Sementara (Pre-Print Check)"
                              className="p-1.5 rounded-lg bg-white border border-stone-300 hover:border-black text-neutral-700 cursor-pointer transition-colors"
                            >
                              <Printer size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSplitBill(activeOrder)}
                              title="Split Bill / Bagi Rata Tagihan"
                              className="p-1.5 rounded-lg bg-white border border-stone-300 hover:border-black text-neutral-700 cursor-pointer transition-colors"
                            >
                              <Users size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTable(t)
                              setOrderChannel('dine_in')
                              setPosView('catalog')
                            }}
                            className="w-full py-1.5 px-2 rounded-lg bg-stone-900 text-white hover:bg-black text-xs font-bold transition-all text-center cursor-pointer shadow-2xs"
                          >
                            + Buka Pesanan Baru
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setTableActionModal(t)}
                          title="Menu Tindakan Lengkap Meja"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-neutral-700 cursor-pointer transition-colors border border-stone-200"
                        >
                          <SlidersHorizontal size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* 2C. VIEW: CATALOG & CASHIER WORKSPACE (DEFAULT) */}
      {posView === 'catalog' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT: MENU CATALOG & SEARCH */}
          <div className="flex-1 w-full space-y-4">
            {/* ORDER CHANNEL SELECTOR */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-3 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
              <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F4] rounded-xl border border-[#E7E5E4]">
                {[
                  { id: 'dine_in', label: 'Dine-In (Meja)' },
                  { id: 'takeaway', label: 'Takeaway (Bungkus)' },
                  { id: 'delivery', label: 'Delivery' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      const channel = ch.id as typeof orderChannel
                      setOrderChannel(channel)
                      if (channel !== 'dine_in') {
                        setSelectedTable(null)
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderChannel === ch.id
                        ? 'bg-black text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black hover:bg-stone-200/50'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {orderChannel === 'dine_in' && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTable?.id || ''}
                    onChange={(e) => {
                      const t = branchTables.find((tb) => tb.id === e.target.value)
                      setSelectedTable(t || null)
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs font-semibold text-neutral-900 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Pilih Meja --</option>
                    {branchTables.map((tb) => (
                      <option key={tb.id} value={tb.id}>
                        {tb.name} ({tb.section} - {tb.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {orderChannel === 'takeaway' && (
                <div className="text-xs text-neutral-600 font-semibold px-2.5 py-1 bg-[#F8F7F4] rounded-lg border border-[#E7E5E4]">
                  🥡 Pesanan Dibungkus / Counter
                </div>
              )}

              {orderChannel === 'delivery' && (
                <div className="text-xs text-emerald-800 font-semibold px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                  🛵 Pengiriman Online / Kurir
                </div>
              )}
            </div>

            {/* SEARCH, MENU ACTIONS & CATEGORY PILLS */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kopi, hidangan utama, snack, atau minuman..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-xs focus:outline-none focus:border-black transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* MENU CRUD BUTTONS */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenNewMenuModal}
                    className="py-2.5 px-3.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs flex items-center gap-1.5"
                    title="Tambah Resep / Menu Baru ke Kasir"
                  >
                    <Plus size={14} />
                    <span>+ Tambah Menu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuModalTab('list')
                      setShowMenuModal(true)
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 hover:border-black text-xs font-bold text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Kelola Daftar Harga & Menu"
                  >
                    <SlidersHorizontal size={14} />
                    <span>Kelola Menu ({menuItems.length})</span>
                  </button>
                </div>
              </div>

              {/* CATEGORIES */}
              <div className="flex flex-wrap gap-2 py-0.5">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                    activeCategory === 'all'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-neutral-700 border border-[#E7E5E4] hover:border-black hover:text-black'
                  }`}
                >
                  Semua Menu ({menuItems.length})
                </button>
                {availableCategories.map((c) => {
                  const count = menuItems.filter((m) => m.categoryId === c.id).length
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                        activeCategory === c.id
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-white text-neutral-700 border border-[#E7E5E4] hover:border-black hover:text-black'
                      }`}
                    >
                      {c.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* MENU CARDS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredMenu.map((item) => {
                const isSoldOut = item.active === false
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`rounded-2xl border p-3.5 text-left transition-all group flex flex-col justify-between min-h-[150px] shadow-2xs relative ${
                      isSoldOut
                        ? 'bg-stone-100/90 border-stone-300 opacity-65 cursor-not-allowed'
                        : 'bg-white border-[#E7E5E4] hover:border-black active:scale-[0.98] cursor-pointer hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-700">
                            {item.emoji ? (
                              <span className="text-base">{item.emoji}</span>
                            ) : item.isKitchenItem ? (
                              <UtensilsCrossed size={15} />
                            ) : (
                              <Coffee size={15} />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            {item.isKitchenItem ? 'Dapur' : 'Bar'}
                          </span>
                        </div>

                        {/* QUICK ACTIONS: KETERSEDIAAN STOK & EDIT */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenuItemActive(item, e)}
                            title={isSoldOut ? 'Tandai Tersedia' : 'Tandai Stok Habis'}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              isSoldOut
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {isSoldOut ? 'Habis' : 'Stok?'}
                          </button>
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditMenuModal(item)
                            }}
                            title="Edit Menu & Harga Ini"
                            className="p-1 rounded-md text-stone-300 hover:text-black hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            <Edit3 size={13} />
                          </span>
                        </div>
                      </div>

                      <div className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-black line-clamp-2 leading-snug">
                        {item.name}
                      </div>

                      {item.description && (
                        <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      )}

                      {item.modifierGroupIds && item.modifierGroupIds.length > 0 && (
                        <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
                          + Pilihan Resep
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="font-extrabold text-xs sm:text-sm text-black tabular-nums">
                        {formatRupiah(item.price)}
                      </span>
                      {isSoldOut ? (
                        <span className="text-[11px] font-bold text-rose-600 uppercase">
                          Stok Habis
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-neutral-400 group-hover:text-black transition-colors">
                          + Tambah
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT: CART & ACTIVE TABLE BILL PANEL */}
          <div className="w-full lg:w-[440px] bg-white rounded-2xl border border-[#E7E5E4] p-5 space-y-4 shrink-0 shadow-2xs flex flex-col justify-between">
            {/* PANEL HEADER */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="font-bold text-sm text-black flex items-center gap-2">
                <Receipt size={16} />
                <span>
                  {isViewingActiveTable
                    ? `Tagihan Aktif: ${selectedTable?.name}`
                    : 'Keranjang Pesanan Kasir'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isViewingActiveTable ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                    Meja Terisi
                  </span>
                ) : (
                  <span className="text-xs font-bold text-black bg-[#F8F7F4] px-2.5 py-1 rounded-lg border border-[#E7E5E4] tabular-nums">
                    {cart.reduce((s, it) => s + it.qty, 0)} item
                  </span>
                )}
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs font-semibold text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Kosongkan Keranjang"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* CASE 1: ACTIVE TABLE ORDER (ALREADY HAS ITEMS SENT TO KITCHEN) */}
            {isViewingActiveTable && activeTableOrder && (
              <div className="space-y-3">
                {/* ACTIVE ORDER INFO CARD */}
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <User size={13} className="text-blue-700" />
                      <span>{activeTableOrder.customerName || 'Tamu Resto'}</span>
                    </span>
                    <span className="text-[11px] font-mono text-blue-800 tabular-nums">
                      #{activeTableOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-blue-700 pt-1 border-t border-blue-200/50">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>
                        Dipesan {Math.round((Date.now() - activeTableOrder.createdAt) / 60000)} menit lalu
                      </span>
                    </span>
                    <span className="font-semibold">
                      {activeTableOrder.items.length} macam hidangan
                    </span>
                  </div>
                </div>

                {/* ITEMS ALREADY ORDERED / COOKING IN KITCHEN */}
                <div className="space-y-1.5 flex-1">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Pesanan Sedang Diproses Dapur</span>
                    <span className="text-[10px] font-normal text-neutral-400">Live KDS</span>
                  </div>

                  <div className="space-y-1.5 flex-1 min-h-[220px] max-h-[460px] overflow-y-auto pr-1">
                    {activeTableOrder.items.map((line) => (
                      <div
                        key={line.id}
                        className="p-2 rounded-xl bg-[#F8F7F4] border border-stone-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-black tabular-nums">{line.qty}x</span>
                            <span className="font-bold text-neutral-900 truncate">{line.name}</span>
                          </div>
                          {line.notes && (
                            <div className="text-[10px] text-neutral-500 italic truncate ml-4">
                              "{line.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              line.isCompletedInKitchen
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {line.isCompletedInKitchen ? 'Siap ✓' : 'Masak ⏳'}
                          </span>
                          <span className="font-bold text-neutral-800 tabular-nums">
                            {formatRupiah(line.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNCOMMITTED ADD-ONS CART SECTION */}
                {cart.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        <Plus size={13} className="text-amber-700" />
                        <span>Menu Tambahan Baru ({cart.reduce((s, it) => s + it.qty, 0)} item)</span>
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        Belum dikirim ke dapur
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {cart.map((line) => (
                        <div
                          key={line.id}
                          className="p-2 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-neutral-900 truncate">{line.name}</div>
                            <div className="font-extrabold text-xs text-black mt-0.5 tabular-nums">
                              {formatRupiah(line.subtotal)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => changeLineQty(line.id, -1)}
                              className="w-6 h-6 rounded-md bg-white border border-stone-300 flex items-center justify-center text-neutral-800 hover:border-black cursor-pointer shadow-2xs"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-4 text-center font-bold text-xs tabular-nums text-black">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeLineQty(line.id, 1)}
                              className="w-6 h-6 rounded-md bg-white border border-stone-300 flex items-center justify-center text-neutral-800 hover:border-black cursor-pointer shadow-2xs"
                            >
                              <Plus size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => changeLineQty(line.id, -line.qty)}
                              className="w-6 h-6 rounded-md text-neutral-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleSendAddonsToKitchen}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Kirim Tambahan ke Dapur / KDS</span>
                    </button>
                  </div>
                )}

                {/* TABLE OPERATION ACTION BUTTONS */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrePrintCheck(activeTableOrder)}
                      className="py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Cetak Bill Sementara sebelum pembayaran untuk tamu"
                    >
                      <Printer size={14} className="text-neutral-600" />
                      <span>Bill Sementara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSplitBill(activeTableOrder)}
                      className="py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Hitung bagi rata tagihan per orang"
                    >
                      <Users size={14} className="text-neutral-600" />
                      <span>Split Bill</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintKitchenTicket(activeTableOrder, 'kitchen')}
                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Cetak ulang tiket pesanan khusus koki dapur"
                    >
                      <ChefHat size={14} className="text-amber-800" />
                      <span>Tiket Dapur (KOT)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintKitchenTicket(activeTableOrder, 'bar')}
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Cetak ulang tiket pesanan khusus barista bar"
                    >
                      <Wine size={14} className="text-emerald-800" />
                      <span>Tiket Bar (BOT)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: NEW ORDER CART (DINE-IN BARU ATAU TAKEAWAY) */}
            {!isViewingActiveTable && (
              <div className="space-y-2.5 flex-1 flex flex-col">
                <div className="space-y-2.5 flex-1 min-h-[320px] max-h-[540px] overflow-y-auto pr-1">
                  {cart.map((line) => (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl bg-[#F8F7F4] border border-stone-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-neutral-900 truncate">{line.name}</div>
                          {line.selectedModifiers && line.selectedModifiers.length > 0 && (
                            <div className="text-[10px] text-neutral-500 truncate">
                              {line.selectedModifiers.map((m) => m.name).join(', ')}
                            </div>
                          )}
                          <div className="font-extrabold text-xs text-black mt-0.5 tabular-nums">
                            {formatRupiah(line.subtotal)}
                          </div>
                        </div>

                        {/* TACTILE QTY BUTTONS */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => changeLineQty(line.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-[#E7E5E4] flex items-center justify-center text-neutral-800 hover:border-black active:scale-95 transition-all cursor-pointer shadow-2xs"
                            aria-label="Kurangi"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center font-extrabold text-xs tabular-nums text-black">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeLineQty(line.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-[#E7E5E4] flex items-center justify-center text-neutral-800 hover:border-black active:scale-95 transition-all cursor-pointer shadow-2xs"
                            aria-label="Tambah"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => changeLineQty(line.id, -line.qty)}
                            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="Hapus item"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* INLINE PER-ITEM NOTES */}
                      <div className="pt-1 border-t border-stone-200/60 flex items-center gap-2">
                        {editingNoteLineId === line.id ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              autoFocus
                              value={line.notes || ''}
                              onChange={(e) => updateLineNotes(line.id, e.target.value)}
                              onBlur={() => setEditingNoteLineId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingNoteLineId(null)}
                              placeholder="Catatan porsi (cth: pedas, less ice)..."
                              className="w-full px-2 py-1 rounded-md bg-white border border-stone-300 text-[11px] focus:outline-none focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingNoteLineId(null)}
                              className="text-[11px] font-bold text-neutral-600 px-1.5 py-0.5 rounded bg-stone-200 cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingNoteLineId(line.id)}
                            className="text-[11px] text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <MessageSquare size={11} />
                            <span>{line.notes ? `Catatan: ${line.notes}` : '+ Tambah catatan item'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="text-center py-10 text-xs text-neutral-400 space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center mx-auto text-neutral-400">
                        <Coffee size={18} />
                      </div>
                      <p className="font-semibold text-neutral-700">Keranjang masih kosong</p>
                      <p className="text-[11px] text-neutral-400">
                        Pilih menu dari katalog untuk memulai pesanan
                      </p>
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={
                        orderChannel === 'delivery'
                          ? 'Nama & No. HP Penerima...'
                          : orderChannel === 'takeaway'
                          ? 'Nama Pemesan (Bungkus)...'
                          : 'Nama Tamu (opsional)...'
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs focus:outline-none focus:border-black font-medium"
                    />
                    <input
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder={
                        orderChannel === 'delivery'
                          ? 'Alamat & Kurir (Gojek/Grab)...'
                          : orderChannel === 'takeaway'
                          ? 'Catatan bungkus...'
                          : 'Catatan meja/pesanan...'
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-xs focus:outline-none focus:border-black font-medium"
                    />
                  </div>
                )}
              </div>
            )}

            {/* FINANCIAL SETTLEMENT & CHECKOUT SECTION (FOR BOTH ACTIVE TABLE & NEW ORDERS) */}
            {(isViewingActiveTable || cart.length > 0) && (
              <div className="space-y-3 pt-3 border-t border-stone-200">
                {/* DISKON DAN COMPLIMENT SECTION */}
                <div className="p-3 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E4] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <Tag size={13} className="text-neutral-600" />
                      <span>Diskon Promosi & Compliment</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDiscountModal(true)}
                      className="text-[11px] font-bold text-blue-700 hover:text-black cursor-pointer underline flex items-center gap-1"
                    >
                      <SlidersHorizontal size={11} />
                      <span>Atur Diskon</span>
                    </button>
                  </div>

                  {/* CASE A: COMPLIMENT ACTIVE */}
                  {isCompliment ? (
                    <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Gift size={15} className="text-amber-700" />
                          <span className="font-black text-xs uppercase tracking-wide">
                            COMPLIMENT (ON THE HOUSE)
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                          TOTAL RP 0
                        </span>
                      </div>
                      <div className="text-xs text-amber-900">
                        Alasan: <strong>{complimentReason}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 text-[10px]">
                        <span className="text-amber-800 italic">
                          Beban HPP dialihkan ke Promosi/Entertainment Resto
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompliment(false)
                            setDiscountAmount(0)
                          }}
                          className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                        >
                          Batalkan Compliment
                        </button>
                      </div>
                    </div>
                  ) : effectiveDiscount > 0 ? (
                    /* CASE B: CUSTOM / REGULAR DISCOUNT ACTIVE */
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <Percent size={13} />
                          <span>Diskon Aktif: -{formatRupiah(effectiveDiscount)}</span>
                        </div>
                        {discountNote && (
                          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                            "{discountNote}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDiscountModal(true)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-black cursor-pointer underline"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountAmount(0)
                            setDiscountNote('')
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CASE C: NO DISCOUNT - QUICK BUTTONS & COMPLIMENT TRIGGER */
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: '0%', val: 0 },
                          { label: '10%', val: Math.round(effectiveSubtotal * 0.1) },
                          { label: '20%', val: Math.round(effectiveSubtotal * 0.2) },
                          { label: '10rb', val: 10000 },
                        ].map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => setDiscountAmount(d.val)}
                            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              discountAmount === d.val
                                ? 'bg-black text-white shadow-xs'
                                : 'bg-white text-neutral-700 border border-[#E7E5E4] hover:border-black'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountModeTab('manual_rp')
                            setShowDiscountModal(true)
                          }}
                          className="py-1.5 px-2 rounded-lg bg-white border border-stone-300 hover:border-black text-[11px] font-semibold text-neutral-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Tag size={11} />
                          <span>+ Diskon Manual</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDiscountModeTab('compliment')
                            setShowDiscountModal(true)
                          }}
                          className="py-1.5 px-2 rounded-lg bg-amber-50 border border-amber-300 hover:border-amber-500 text-[11px] font-bold text-amber-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Gift size={11} className="text-amber-700" />
                          <span>Compliment (Rp 0)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* METODE PEMBAYARAN TABS (HANYA DITAMPILKAN JIKA BUKAN COMPLIMENT) */}
                {!isCompliment && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      Metode Pembayaran
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'qris' as PaymentMethod, label: 'QRIS', icon: QrCode },
                        { id: 'cash' as PaymentMethod, label: 'Tunai', icon: Coins },
                        { id: 'debit' as PaymentMethod, label: 'Debit', icon: CreditCard },
                        { id: 'transfer' as PaymentMethod, label: 'Transfer', icon: Smartphone },
                      ].map((tab) => {
                        const Icon = tab.icon
                        const isSelected = paymentMethod === tab.id
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPaymentMethod(tab.id)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'bg-black text-white shadow-xs'
                                : 'bg-[#F8F7F4] text-neutral-700 border border-[#E7E5E4] hover:border-black hover:text-black'
                            }`}
                          >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* CASH TENDER SCREEN WITH SMART PRESETS */}
                {!isCompliment && paymentMethod === 'cash' && (
                  <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E4] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-600">Nominal Diterima:</span>
                      <span className="text-base font-extrabold text-black tabular-nums">
                        {cashTender ? formatRupiah(Number(cashTender)) : 'Rp 0'}
                      </span>
                    </div>

                    {/* SMART DYNAMIC PRESETS */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {cashSuggestions.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCashTender(String(preset))}
                          className="py-1.5 px-1 rounded-xl bg-white border border-[#E7E5E4] hover:border-black font-bold text-xs text-neutral-900 transition-all cursor-pointer shadow-2xs"
                        >
                          {preset === effectiveGrandTotal ? 'Uang Pas' : formatRupiah(preset).replace('Rp ', '')}
                        </button>
                      ))}
                    </div>

                    {/* ON-SCREEN NUMPAD */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (key === 'del') {
                              setCashTender((prev) => prev.slice(0, -1))
                            } else if (key === '000') {
                              if (cashTender) setCashTender((prev) => prev + '000')
                            } else {
                              setCashTender((prev) => prev + key)
                            }
                          }}
                          className="h-9 rounded-xl bg-white border border-[#E7E5E4] hover:border-black font-bold text-sm text-neutral-800 flex items-center justify-center transition-all active:bg-neutral-100 cursor-pointer shadow-2xs"
                        >
                          {key === 'del' ? '⌫' : key}
                        </button>
                      ))}
                    </div>

                    {/* KEMBALIAN */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E4] text-xs">
                      <span className="font-semibold text-neutral-700">Uang Kembalian:</span>
                      <span
                        className={`text-sm font-extrabold tabular-nums ${
                          isEffectiveCashInsufficient ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isEffectiveCashInsufficient ? 'Nominal Kurang' : formatRupiah(effectiveChangeAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* DEBIT / TRANSFER EDC SELECTOR */}
                {!isCompliment && (paymentMethod === 'debit' || paymentMethod === 'transfer') && (
                  <div className="p-3 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E4] space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-600">
                      Pilih Bank Rekening Penampungan:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['bca', 'mandiri', 'bri', 'bni'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                            selectedBank === b
                              ? 'bg-black text-white'
                              : 'bg-white text-neutral-700 border border-[#E7E5E4] hover:border-black'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUMMARY BREAKDOWN */}
                <div className="space-y-1 text-xs pt-2 border-t border-stone-100">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-semibold text-neutral-800">
                      {formatRupiah(effectiveSubtotal)}
                    </span>
                  </div>
                  {effectiveDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{isCompliment ? 'Compliment (100% On the House)' : 'Diskon Promo'}</span>
                      <span className="tabular-nums font-semibold">-{formatRupiah(effectiveDiscount)}</span>
                    </div>
                  )}
                  {effectiveServiceCharge > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Service Charge ({activeOutlet.receiptConfig.serviceChargeRatePct ?? 5}%)</span>
                      <span className="tabular-nums font-semibold text-neutral-800">
                        {formatRupiah(effectiveServiceCharge)}
                      </span>
                    </div>
                  )}
                  {effectiveTaxPB1 > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Pajak Restoran PB1 ({activeOutlet.receiptConfig.taxRatePct ?? 10}%)</span>
                      <span className="tabular-nums font-semibold text-neutral-800">
                        {formatRupiah(effectiveTaxPB1)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-black pt-2 border-t border-[#E7E5E4]">
                    <span>Total Tagihan</span>
                    <span className={`tabular-nums text-lg ${isCompliment ? 'text-amber-700 font-black' : ''}`}>
                      {formatRupiah(effectiveGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* PRIMARY ACTION BUTTONS */}
                {isCompliment ? (
                  /* ACTION BUTTON FOR COMPLIMENT TRANSACTION (RP 0) */
                  <button
                    type="button"
                    onClick={isViewingActiveTable ? handleCheckoutActiveTable : handleCheckout}
                    className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold tracking-tight transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <Gift size={18} />
                    <span>Selesaikan Transaksi Compliment (Rp 0 - On the House)</span>
                  </button>
                ) : isViewingActiveTable ? (
                  /* ACTION BUTTON FOR ACTIVE TABLE: SETTLE & CLOSE TABLE */
                  <button
                    type="button"
                    onClick={() => {
                      if (paymentMethod === 'qris') {
                        setIsPendingActiveTableCheckout(true)
                        setShowQrisPaymentModal(true)
                      } else {
                        handleCheckoutActiveTable()
                      }
                    }}
                    disabled={isEffectiveCashInsufficient}
                    className="w-full py-3.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-sm font-bold tracking-tight transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    {paymentMethod === 'qris' ? <QrCode size={17} /> : <CheckCircle2 size={17} />}
                    <span>{paymentMethod === 'qris' ? 'Tampilkan QRIS Pembayaran' : 'Bayar & Tutup Meja'} ({formatRupiah(effectiveGrandTotal)})</span>
                  </button>
                ) : (
                  /* ACTIONS FOR NEW ORDER: DINE-IN OPEN BILL vs FAST PAY */
                  <div className="space-y-2 pt-1">
                    {orderChannel === 'dine_in' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSendToKitchen}
                          disabled={cart.length === 0 || !selectedTable}
                          className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-sm font-bold tracking-tight transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                        >
                          <ChefHat size={18} />
                          <span>Kirim ke Dapur (Open Bill Meja)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (paymentMethod === 'qris') {
                              setIsPendingActiveTableCheckout(false)
                              setShowQrisPaymentModal(true)
                            } else {
                              handleCheckout()
                            }
                          }}
                          disabled={cart.length === 0 || isCashInsufficient}
                          className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 disabled:opacity-40 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
                        >
                          {paymentMethod === 'qris' ? <QrCode size={15} /> : <CheckCircle2 size={15} />}
                          <span>{paymentMethod === 'qris' ? 'Tampilkan QRIS Kasir' : 'Bayar Langsung di Kasir'} ({formatRupiah(grandTotal)})</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (paymentMethod === 'qris') {
                              setIsPendingActiveTableCheckout(false)
                              setShowQrisPaymentModal(true)
                            } else {
                              handleCheckout()
                            }
                          }}
                          disabled={cart.length === 0 || isCashInsufficient}
                          className="w-full py-3.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-sm font-bold tracking-tight transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                        >
                          {paymentMethod === 'qris' ? <QrCode size={17} /> : <CheckCircle2 size={17} />}
                          <span>{paymentMethod === 'qris' ? 'Tampilkan QRIS Pembayaran' : 'Selesaikan & Cetak Struk'} ({formatRupiah(grandTotal)})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSendToKitchen}
                          disabled={cart.length === 0}
                          className="w-full py-2 rounded-xl text-neutral-600 hover:text-black text-xs font-semibold cursor-pointer"
                        >
                          Kirim ke KDS Dapur (Bungkus)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MOBILE FLOATING CART BAR (FOR PHONES & TABLETS: lg:hidden) */}
          {cart.length > 0 && !mobileCartDrawerOpen && (
            <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
              <div className="bg-neutral-900 text-white rounded-2xl p-3.5 shadow-2xl border border-neutral-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
                <div>
                  <div className="text-xs text-neutral-300 font-medium">
                    {cart.reduce((s, it) => s + it.qty, 0)} Item Dipilih {selectedTable ? `· ${selectedTable.name}` : ''}
                  </div>
                  <div className="text-base font-extrabold tabular-nums">
                    {isCompliment ? 'Rp 0 (Compliment)' : formatRupiah(effectiveGrandTotal)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileCartDrawerOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-100 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[44px]"
                >
                  Lihat Keranjang & Bayar
                </button>
              </div>
            </div>
          )}

          {/* MOBILE CART SLIDE-UP DRAWER */}
          {mobileCartDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 lg:hidden">
              <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col p-5 space-y-4 border-t border-stone-200 shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} />
                    <span className="font-bold text-base text-black">
                      Keranjang Pesanan ({cart.reduce((s, it) => s + it.qty, 0)} item)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileCartDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ITEMS LIST */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {cart.map((line) => (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl bg-[#F8F7F4] border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-neutral-900 truncate">{line.name}</div>
                        <div className="font-extrabold text-black mt-0.5 tabular-nums">
                          {formatRupiah(line.subtotal)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => changeLineQty(line.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-black active:scale-90"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center tabular-nums">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => changeLineQty(line.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-black active:scale-90"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TOTAL & QUICK ACTIONS */}
                <div className="pt-2 border-t border-stone-200 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-neutral-600 font-semibold">Total Tagihan:</span>
                    <span className="text-lg font-black text-black tabular-nums">
                      {isCompliment ? 'Rp 0 (Compliment)' : formatRupiah(effectiveGrandTotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDiscountModal(true)}
                      className="py-2.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-bold text-neutral-800"
                    >
                      🏷️ Diskon / Compliment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileCartDrawerOpen(false)
                        if (isCompliment) {
                          handleCheckout()
                        } else if (orderChannel === 'dine_in') {
                          handleSendToKitchen()
                        } else {
                          handleCheckout()
                        }
                      }}
                      className="py-2.5 rounded-xl bg-black text-white text-xs font-bold"
                    >
                      {isCompliment ? 'Selesai Compliment' : orderChannel === 'dine_in' ? 'Kirim Dapur' : 'Bayar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PILIH MODIFIER / VARIASI RESEP */}
      {selectedMenuForMod && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#E7E5E4] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-base text-black">{selectedMenuForMod.name}</h3>
                <span className="text-xs text-neutral-500">Kustomisasi Porsi & Resep</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenuForMod(null)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {modifierGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <span className="text-xs font-bold text-neutral-800">{group.name}</span>
                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = activeModifiers.some((m) => m.id === opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setActiveModifiers((prev) => prev.filter((m) => m.id !== opt.id))
                            } else {
                              setActiveModifiers((prev) => [...prev, opt])
                            }
                          }}
                          className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-black bg-stone-100 font-semibold text-black'
                              : 'border-[#E7E5E4] text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="tabular-nums font-semibold">
                            {opt.priceAdd > 0 ? `+${formatRupiah(opt.priceAdd)}` : 'Gratis'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedMenuForMod(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E7E5E4] text-xs font-semibold text-neutral-700 hover:bg-[#F8F7F4] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCartDirect(selectedMenuForMod, activeModifiers)
                  setSelectedMenuForMod(null)
                  setActiveModifiers([])
                }}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STRUK THERMAL SETELAH CHECKOUT */}
      {showReceiptModal && completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-black">Transaksi Berhasil Disimpan</h3>
                <span className="text-[11px] text-neutral-500">Stok otomatis terpotong & jurnal SAK EMKM dicatat</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* PREVIEW STRUK THERMAL */}
            <div className="bg-[#F8F7F4] border border-stone-200 rounded-xl p-3 font-mono text-[11px] text-neutral-800 leading-relaxed max-h-64 overflow-y-auto whitespace-pre">
              {generateEscPosPlainText(completedOrder, activeOutlet.receiptConfig)}
            </div>

            {/* CASH DRAWER NOTICE */}
            {completedOrder.paymentMethod === 'cash' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span>Laci Kasir (Cash Drawer):</span>
                <span className="font-bold">{drawerKicked ? 'TERBUKA ✓' : 'STANDBY'}</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-1">
              {/* CETAK STRUK PELANGGAN */}
              <button
                type="button"
                onClick={() => {
                  setDrawerKicked(true)
                  printThermalReceiptViaIframe(
                    generateEscPosPlainText(completedOrder, activeOutlet.receiptConfig),
                    activeOutlet.receiptConfig.paperWidth
                  )
                }}
                className="w-full py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
              >
                <Printer size={15} />
                <span>Cetak Struk Kasir (Pelanggan)</span>
              </button>

              {/* TIKET DAPUR & BAR (STATION CHITS) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePrintKitchenTicket(completedOrder, 'kitchen')
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChefHat size={14} className="text-amber-800" />
                  <span>Tiket Dapur (KOT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePrintKitchenTicket(completedOrder, 'bar')
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Wine size={14} className="text-emerald-800" />
                  <span>Tiket Bar (BOT)</span>
                </button>
              </div>

              {/* CETAK SEMUA TIKET (KASIR + DAPUR + BAR) */}
              <button
                type="button"
                onClick={() => handlePrintAllTickets(completedOrder)}
                className="w-full py-2.5 rounded-xl border border-stone-300 bg-[#F8F7F4] hover:bg-stone-200 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-[40px]"
                title="Cetak struk kasir, tiket dapur, dan tiket bar sekaligus"
              >
                <Layers size={14} />
                <span>Cetak Semua (Kasir + Dapur + Bar)</span>
              </button>

              {/* DEDICATED ROLL PDF DOWNLOADS */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadThermalReceiptPdf(completedOrder, activeOutlet.receiptConfig)
                  }}
                  className="py-2 rounded-xl bg-stone-100 text-black hover:bg-stone-200 border border-stone-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown size={13} className="text-neutral-700" />
                  <span>PDF Struk Kasir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadThermalKitchenTicketPdf(completedOrder, activeOutlet.receiptConfig, 'kitchen')
                  }}
                  className="py-2 rounded-xl bg-stone-100 text-black hover:bg-stone-200 border border-stone-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown size={13} className="text-amber-800" />
                  <span>PDF Tiket Dapur</span>
                </button>
              </div>

              {/* DIRECT JUMP TO TRANSACTIONS */}
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false)
                  setPosView('history')
                }}
                className="w-full py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-neutral-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ReceiptText size={14} />
                <span>Lihat di Riwayat Transaksi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false)
                  setPosView('catalog')
                  setCompletedOrder(null)
                }}
                className="w-full py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <CheckCircle2 size={15} />
                <span>Selesai & Buka Pesanan Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID CONFIRMATION MODAL */}
      {showVoidModal && orderToVoid && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert size={20} />
              <h3 className="font-bold text-base text-black">Batalkan Transaksi (Void)</h3>
            </div>

            <p className="text-xs text-neutral-600">
              Pesanan <strong>#{orderToVoid.orderNumber}</strong> ({formatRupiah(orderToVoid.total)}) akan dibatalkan.
              Stok bahan baku akan dikembalikan otomatis dan jurnal pembalik akan diterbitkan ke Buku Besar.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">Alasan Pembatalan / Void:</label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Contoh: Tamu salah pesan / salah input kasir / ganti pesanan..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={!voidReason.trim()}
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Konfirmasi Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL SPLIT BILL (BAGI RATA TAGIHAN) */}
      {showSplitBillModal && orderForSplit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-base text-black flex items-center gap-2">
                  <Users size={18} />
                  <span>Split Bill (Bagi Rata Tagihan)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {orderForSplit.tableName || 'Meja'} · Total:{' '}
                  <strong className="text-black tabular-nums">{formatRupiah(orderForSplit.total)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitBillModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* SPLIT PERSON SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">Jumlah Orang / Pembagian:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitCount(num)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      splitCount === num
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-[#F8F7F4] text-neutral-700 border border-[#E7E5E4] hover:border-black'
                    }`}
                  >
                    {num} Orang
                  </button>
                ))}
              </div>
            </div>

            {/* BREAKDOWN CARD */}
            <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] space-y-2">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Total Tagihan Meja</span>
                <span className="font-bold text-neutral-900 tabular-nums">{formatRupiah(orderForSplit.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Dibagi Rata</span>
                <span className="font-bold text-neutral-900">{splitCount} Orang</span>
              </div>
              <div className="pt-2 border-t border-[#E7E5E4] flex justify-between items-baseline">
                <span className="text-xs font-bold text-neutral-800">Tagihan Per Orang:</span>
                <span className="text-lg font-extrabold text-black tabular-nums">
                  {formatRupiah(Math.ceil(orderForSplit.total / splitCount))}
                </span>
              </div>
            </div>

            {/* INDIVIDUAL SLIP PRINT BUTTONS */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Cetak Struk Split per Orang:</span>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {Array.from({ length: splitCount }, (_, i) => i + 1).map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const text = generateEscPosSplitBillText(
                        orderForSplit,
                        activeOutlet.receiptConfig,
                        splitCount,
                        idx
                      )
                      printThermalReceiptViaIframe(text, activeOutlet.receiptConfig.paperWidth)
                    }}
                    className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-left text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-neutral-900">Orang ke-{idx}</div>
                      <div className="text-[11px] text-neutral-500 tabular-nums">
                        {formatRupiah(Math.ceil(orderForSplit.total / splitCount))}
                      </div>
                    </div>
                    <Printer size={13} className="text-neutral-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  for (let i = 1; i <= splitCount; i++) {
                    const text = generateEscPosSplitBillText(
                      orderForSplit,
                      activeOutlet.receiptConfig,
                      splitCount,
                      i
                    )
                    printThermalReceiptViaIframe(text, activeOutlet.receiptConfig.paperWidth)
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[42px]"
              >
                <Printer size={14} />
                <span>Cetak Semua ({splitCount} Struk)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSplitBillModal(false)}
                className="py-2.5 px-4 rounded-xl border border-[#E7E5E4] text-xs font-semibold text-neutral-700 hover:bg-[#F8F7F4] cursor-pointer min-h-[42px]"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TOAST FEEDBACK NOTIFICATION */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`py-3 px-4 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 max-w-md ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-stone-900 text-white border-stone-700'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <Info size={16} className="text-blue-400 shrink-0" />
            )}
            <span className="leading-snug">{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="ml-auto text-stone-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL TINDAKAN CEPAT MEJA (TABLE QUICK ACTION MODAL) */}
      {tableActionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-black tracking-tight">
                    {tableActionModal.name}
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      tableActionModal.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : tableActionModal.status === 'occupied'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {tableActionModal.status === 'available'
                      ? 'KOSONG'
                      : tableActionModal.status === 'occupied'
                      ? 'TERISI'
                      : 'BILLING'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Area: <strong>{tableActionModal.section}</strong> · Kapasitas: <strong>{tableActionModal.capacity} Kursi</strong> · Bentuk: <strong className="capitalize">{tableActionModal.shape || 'Kotak'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTableActionModal(null)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* IF OCCUPIED / BILLING: ACTIVE ORDER SUMMARY */}
            {(() => {
              const activeOrder = orders.find(
                (o) =>
                  o.tableId === tableActionModal.id &&
                  (o.status === 'preparing' || o.status === 'ready' || o.status === 'open')
              )
              const elapsedMin = activeOrder
                ? Math.round((Date.now() - activeOrder.createdAt) / 60000)
                : 0

              if (activeOrder) {
                return (
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-950 flex items-center gap-1.5">
                        <User size={14} className="text-blue-700" />
                        <span>{activeOrder.customerName || 'Tamu Resto'}</span>
                      </span>
                      <span className="font-mono text-blue-800 tabular-nums font-semibold">
                        #{activeOrder.orderNumber} · {elapsedMin}m lalu
                      </span>
                    </div>

                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {activeOrder.items.map((line) => (
                        <div key={line.id} className="flex justify-between text-xs text-neutral-700">
                          <span className="truncate max-w-[240px]">
                            {line.qty}x {line.name}
                          </span>
                          <span className="tabular-nums font-semibold text-black">
                            {formatRupiah(line.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-blue-200/80 flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-blue-900">Total Tagihan Sementara:</span>
                      <span className="text-base font-extrabold text-black tabular-nums">
                        {formatRupiah(activeOrder.total)}
                      </span>
                    </div>

                    {/* OPERATIONAL BUTTONS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTable(tableActionModal)
                          setOrderChannel('dine_in')
                          setPosView('catalog')
                          setTableActionModal(null)
                        }}
                        className="py-2 px-1 rounded-lg bg-black text-white hover:bg-neutral-800 text-[11px] font-bold text-center cursor-pointer shadow-xs"
                      >
                        Kelola Kasir
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTableToMove(tableActionModal)
                          setTargetMoveTableId('')
                          setShowMoveTableModal(true)
                          setTableActionModal(null)
                        }}
                        className="py-2 px-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[11px] font-bold text-blue-900 text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowRight size={12} />
                        <span>Pindah Meja</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handlePrePrintCheck(activeOrder)
                          setTableActionModal(null)
                        }}
                        className="py-2 px-1 rounded-lg bg-white border border-stone-300 hover:border-black text-[11px] font-semibold text-neutral-800 text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer size={12} />
                        <span>Cetak Bill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenSplitBill(activeOrder)
                          setTableActionModal(null)
                        }}
                        className="py-2 px-1 rounded-lg bg-white border border-stone-300 hover:border-black text-[11px] font-semibold text-neutral-800 text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Users size={12} />
                        <span>Split Bill</span>
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center space-y-2">
                  <div className="text-2xl">🍽️</div>
                  <div className="text-xs font-bold text-emerald-950">Meja Ini Sedang Kosong</div>
                  <p className="text-[11px] text-emerald-800">
                    Siap untuk menerima pesanan dine-in tamu baru.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTable(tableActionModal)
                      setOrderChannel('dine_in')
                      setPosView('catalog')
                      setTableActionModal(null)
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-900 text-white hover:bg-black text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    + Buka Pesanan Baru di {tableActionModal.name}
                  </button>
                </div>
              )
            })()}

            {/* STATUS TOGGLE & EDIT / DELETE */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditTableModal(tableActionModal)
                    setTableActionModal(null)
                  }}
                  className="py-1.5 px-2.5 rounded-lg border border-stone-300 bg-white hover:border-black text-xs font-semibold text-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Edit Meja</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTableClick(tableActionModal.id)}
                  className="py-1.5 px-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Hapus</span>
                </button>
              </div>

              {tableActionModal.status !== 'available' && onUpdateTableStatus && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTableStatus(tableActionModal.id, 'available')
                    setTableActionModal(null)
                    setFeedbackMsg({ type: 'info', text: `${tableActionModal.name} berhasil dikosongkan.` })
                  }}
                  className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
                >
                  Set Meja Kosong
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL KELOLA MENU (MENU MANAGEMENT CRUD) */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* HEADER & TABS */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-base text-black tracking-tight">
                  {editingMenuItem ? 'Edit Resep & Menu Restoran' : 'Kelola Menu & Katalog Restoran'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tambahkan menu baru, ubah harga jual, atau perbarui kategori menu kasir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* TAB SELECTOR: FORM vs LIST */}
            <div className="flex items-center gap-2 p-1 bg-[#F8F7F4] rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setMenuModalTab('form')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  menuModalTab === 'form' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                {editingMenuItem ? 'Form Edit Menu' : '+ Tambah Menu Baru'}
              </button>
              <button
                type="button"
                onClick={() => setMenuModalTab('list')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  menuModalTab === 'list' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Daftar Menu Tersedia ({menuItems.length})
              </button>
            </div>

            {/* TAB 1: FORM INPUT / EDIT MENU */}
            {menuModalTab === 'form' && (
              <div className="space-y-3.5">
                {/* NAMA MENU */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Nama Menu / Hidangan:</label>
                  <input
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    placeholder="Contoh: Nasi Goreng Spesial Resto, Ice Caramel Macchiato..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black font-semibold"
                  />
                </div>

                {/* KATEGORI & HARGA */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800">Kategori Menu:</label>
                    <select
                      value={isCustomCategory ? '__custom__' : menuForm.categoryId}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true)
                        } else {
                          setIsCustomCategory(false)
                          setMenuForm({ ...menuForm, categoryId: e.target.value })
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black font-semibold cursor-pointer"
                    >
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                      <option value="__custom__">+ Kategori Baru...</option>
                    </select>
                    {isCustomCategory && (
                      <input
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="Ketik nama kategori baru..."
                        className="w-full mt-1.5 px-3 py-1.5 rounded-xl bg-[#F8F7F4] border border-stone-300 text-xs focus:outline-none focus:border-black font-semibold"
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800">Harga Jual (Rp):</label>
                    <input
                      type="number"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                      placeholder="35000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* STASIUN PRODUKSI: DAPUR vs BAR */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800">Stasiun Produksi (KDS / Printer Order):</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMenuForm({ ...menuForm, isKitchenItem: true })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        menuForm.isKitchenItem
                          ? 'border-black bg-stone-100 text-black shadow-xs'
                          : 'border-stone-200 text-neutral-600 hover:border-stone-400'
                      }`}
                    >
                      <UtensilsCrossed size={14} />
                      <span>Dapur Panas (Kitchen)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuForm({ ...menuForm, isKitchenItem: false })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        !menuForm.isKitchenItem
                          ? 'border-black bg-stone-100 text-black shadow-xs'
                          : 'border-stone-200 text-neutral-600 hover:border-stone-400'
                      }`}
                    >
                      <Coffee size={14} />
                      <span>Bar Minuman (Beverage)</span>
                    </button>
                  </div>
                </div>

                {/* PILIHAN KUSTOMISASI / MODIFIER GROUPS */}
                <div className="space-y-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <SlidersHorizontal size={13} className="text-neutral-700" />
                        <span>Kustomisasi Menu & Opsi Modifiers</span>
                      </span>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        Pilih grup modifikasi yang dapat dipilih pelanggan untuk menu ini.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewModGroupName('')
                        setNewModGroupRequired(false)
                        setNewModGroupOptions([{ name: '', priceAdd: '0' }])
                        setShowCreateModifierGroupModal(true)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-black text-white hover:bg-neutral-800 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                    >
                      + Buat Kustomisasi Baru
                    </button>
                  </div>

                  {modifierGroups && modifierGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {modifierGroups.map((grp) => {
                        const isChecked = selectedModifierGroupIds.includes(grp.id)
                        return (
                          <label
                            key={grp.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-black ring-1 ring-black shadow-2xs'
                                : 'bg-white border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedModifierGroupIds((prev) => [...prev, grp.id])
                                } else {
                                  setSelectedModifierGroupIds((prev) => prev.filter((id) => id !== grp.id))
                                }
                              }}
                              className="mt-0.5 rounded text-black focus:ring-black cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-neutral-900 truncate">{grp.name}</div>
                              <div className="text-[10px] text-neutral-500 mt-0.5 truncate">
                                {grp.options.map((o) => `${o.name} (${o.priceAdd > 0 ? `+${formatRupiah(o.priceAdd)}` : 'Rp 0'})`).join(', ')}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 italic pt-1">
                      Belum ada grup kustomisasi terdaftar. Klik tombol "+ Buat Kustomisasi Baru" di atas untuk menambahkan.
                    </p>
                  )}
                </div>

                {/* RESEP BAHAN BAKU (BOM / PEMOTONGAN STOK INVENTORI) */}
                <div className="space-y-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <Layers size={13} className="text-neutral-700" />
                        <span>Resep Bahan Baku (Pengurangan Stok Otomatis)</span>
                      </span>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        Hubungkan dengan stok inventori agar bahan baku otomatis terpotong saat menu terjual.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (inventory.length === 0) {
                          alert('Belum ada item inventori terdaftar.')
                          return
                        }
                        const firstInv = inventory[0]
                        setMenuRecipeIngredients((prev) => [
                          ...prev,
                          {
                            invItemId: firstInv.id,
                            invItemName: firstInv.name,
                            qty: 0.1,
                            unit: firstInv.unit || 'kg',
                          },
                        ])
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white hover:bg-black text-[11px] font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                    >
                      + Tambah Bahan Baku
                    </button>
                  </div>

                  {menuRecipeIngredients.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {menuRecipeIngredients.map((ing, idx) => {
                        const invItem = inventory.find((i) => i.id === ing.invItemId)
                        const lineCost = invItem ? invItem.unitCost * ing.qty : 0

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex-1">
                              <select
                                value={ing.invItemId}
                                onChange={(e) => {
                                  const selectedId = e.target.value
                                  const matched = inventory.find((i) => i.id === selectedId)
                                  setMenuRecipeIngredients((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            invItemId: selectedId,
                                            invItemName: matched ? matched.name : item.invItemName,
                                            unit: matched ? matched.unit : item.unit,
                                          }
                                        : item
                                    )
                                  )
                                }}
                                className="w-full p-1.5 rounded-lg border border-stone-300 text-xs font-semibold focus:outline-none focus:border-black bg-white"
                              >
                                {inventory.map((inv) => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.name} ({inv.unit}) - Stok: {inv.currentStock} {inv.unit}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={ing.qty}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0
                                    setMenuRecipeIngredients((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, qty: val } : item))
                                    )
                                  }}
                                  placeholder="0.1"
                                  className="w-20 p-1.5 rounded-lg border border-stone-300 text-xs font-bold text-center tabular-nums focus:outline-none focus:border-black"
                                />
                                <span className="text-[11px] font-semibold text-neutral-500 w-10 truncate">
                                  {ing.unit}
                                </span>
                              </div>

                              <span className="text-[11px] font-bold text-neutral-700 min-w-[70px] text-right tabular-nums">
                                {formatRupiah(lineCost)}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuRecipeIngredients((prev) => prev.filter((_, i) => i !== idx))
                                }}
                                className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus bahan baku"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="flex items-center justify-between text-xs pt-1 px-1">
                        <span className="text-neutral-500 font-medium">Estimasi HPP Bahan Baku:</span>
                        <strong className="text-neutral-900 tabular-nums">
                          {formatRupiah(
                            menuRecipeIngredients.reduce((s, it) => {
                              const inv = inventory.find((i) => i.id === it.invItemId)
                              return s + (inv ? inv.unitCost * it.qty : 0)
                            }, 0)
                          )}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 italic pt-1">
                      Belum ada bahan baku terhubung. Klik "+ Tambah Bahan Baku" untuk menghubungkan stok otomatis.
                    </p>
                  )}
                </div>

                {/* DESKRIPSI RESEP */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Deskripsi / Komposisi Singkat:</label>
                  <input
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    placeholder="Contoh: Disajikan dengan telur mata sapi dan acar segar"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                {/* STATUS KETERSEDIAAN */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Status Ketersediaan Menu:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMenuForm({ ...menuForm, active: true })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        menuForm.active
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white border-stone-200 text-neutral-600 hover:border-black'
                      }`}
                    >
                      ✓ Tersedia (Ready)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuForm({ ...menuForm, active: false })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        !menuForm.active
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white border-stone-200 text-neutral-600 hover:border-rose-400'
                      }`}
                    >
                      ✕ Stok Habis
                    </button>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMenuModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-neutral-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!menuForm.name.trim() || !menuForm.price}
                    onClick={handleSaveMenuItem}
                    className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    {editingMenuItem ? 'Simpan Perubahan Menu' : '+ Simpan Menu ke Kasir'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DAFTAR SEMUA MENU */}
            {menuModalTab === 'list' && (
              <div className="space-y-3">
                <input
                  value={menuSearchFilter}
                  onChange={(e) => setMenuSearchFilter(e.target.value)}
                  placeholder="Cari menu dalam daftar..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-stone-300 text-xs focus:outline-none focus:border-black"
                />

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {menuItems
                    .filter((m) =>
                      m.name.toLowerCase().includes(menuSearchFilter.toLowerCase())
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-xs hover:border-stone-400 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">{item.emoji || (item.isKitchenItem ? '🍚' : '☕')}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-neutral-900 truncate">{item.name}</div>
                            <div className="text-[11px] text-neutral-500 font-semibold tabular-nums">
                              {formatRupiah(item.price)} · {item.isKitchenItem ? 'Dapur' : 'Bar'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMenuModal(item)}
                            className="p-1.5 rounded-lg border border-stone-300 hover:border-black text-neutral-700 cursor-pointer"
                            title="Edit Menu"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMenuItemClick(item.id)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                            title="Hapus Menu"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. MODAL KELOLA MEJA (TABLE MANAGEMENT CRUD) */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-base text-black tracking-tight">
                  {editingTable ? 'Edit Meja' : 'Kelola Meja'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* TAB SELECTOR: FORM vs LIST */}
            <div className="flex items-center gap-2 p-1 bg-[#F8F7F4] rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setTableModalTab('form')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tableModalTab === 'form' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                {editingTable ? 'Form Edit Meja' : '+ Tambah Meja Baru'}
              </button>
              <button
                type="button"
                onClick={() => setTableModalTab('list')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tableModalTab === 'list' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Daftar Meja ({branchTables.length})
              </button>
            </div>

            {/* TAB 1: FORM INPUT MEJA */}
            {tableModalTab === 'form' && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Nama / Nomor Meja:</label>
                  <input
                    value={tableForm.name}
                    onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                    placeholder="Contoh: Meja 05, VIP 01, Bar 02..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800">Area / Section:</label>
                    <select
                      value={tableForm.section}
                      onChange={(e) => setTableForm({ ...tableForm, section: e.target.value as TableFloor['section'] })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black font-semibold cursor-pointer"
                    >
                      <option value="Indoor">Indoor (Utama)</option>
                      <option value="Outdoor">Outdoor (Teras)</option>
                      <option value="VIP">VIP Room</option>
                      <option value="Bar">Bar Counter</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800">Kapasitas Kursi:</label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={tableForm.capacity}
                      onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) || 2 })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* BENTUK MEJA UNTUK DENAH DINER DASH */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800">Bentuk Fisik di Denah (Diner Dash Visual):</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'square', label: 'Kotak (4p)' },
                      { id: 'round', label: 'Bundar' },
                      { id: 'rect', label: 'Panjang (6p)' },
                      { id: 'bar', label: 'Bar' },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setTableForm({ ...tableForm, shape: sh.id as typeof tableForm.shape })}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          tableForm.shape === sh.id
                            ? 'border-black bg-stone-100 text-black shadow-xs'
                            : 'border-stone-200 text-neutral-600 hover:border-stone-400'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-neutral-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!tableForm.name.trim()}
                    onClick={handleSaveTable}
                    className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    {editingTable ? 'Simpan Perubahan Meja' : '+ Simpan Meja ke Denah'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DAFTAR SEMUA MEJA */}
            {tableModalTab === 'list' && (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {branchTables.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-xs hover:border-stone-400 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-neutral-900">{t.name}</div>
                      <div className="text-[11px] text-neutral-500 font-medium">
                        {t.section} · {t.capacity} Kursi · <span className="capitalize">{t.shape || 'Kotak'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTableModal(t)}
                        className="p-1.5 rounded-lg border border-stone-300 hover:border-black text-neutral-700 cursor-pointer"
                        title="Edit Meja"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTableClick(t.id)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                        title="Hapus Meja"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. MODAL DISKON MANUAL & COMPLIMENT (ON THE HOUSE) */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E7E5E4] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-black tracking-tight flex items-center gap-2">
                  <Tag size={17} />
                  <span>Pengaturan Diskon & Compliment</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Subtotal Tagihan:{' '}
                  <strong className="text-black tabular-nums">{formatRupiah(effectiveSubtotal)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* TAB SELECTOR (4 TABS) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F8F7F4] rounded-xl border border-stone-200 text-center">
              {[
                { id: 'preset' as const, label: 'Preset %' },
                { id: 'manual_rp' as const, label: 'Nominal Rp' },
                { id: 'manual_pct' as const, label: 'Persen %' },
                { id: 'compliment' as const, label: 'Compliment' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDiscountModeTab(tab.id)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    discountModeTab === tab.id
                      ? tab.id === 'compliment'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-black text-white shadow-xs'
                      : tab.id === 'compliment'
                      ? 'text-amber-800 font-black hover:bg-amber-100'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: PRESET DISKON */}
            {discountModeTab === 'preset' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-800 block">Pilih Persentase Diskon Resto:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '5%', pct: 0.05 },
                    { label: '10%', pct: 0.1 },
                    { label: '15%', pct: 0.15 },
                    { label: '20%', pct: 0.2 },
                    { label: '25%', pct: 0.25 },
                    { label: '50%', pct: 0.5 },
                  ].map((p) => {
                    const nominal = Math.round(effectiveSubtotal * p.pct)
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setIsCompliment(false)
                          setDiscountAmount(nominal)
                          setDiscountNote(`Promo ${p.label}`)
                          setShowDiscountModal(false)
                        }}
                        className="p-2.5 rounded-xl border border-stone-200 hover:border-black text-left transition-all cursor-pointer bg-[#F8F7F4] hover:bg-white"
                      >
                        <div className="font-extrabold text-sm text-black">{p.label}</div>
                        <div className="text-[11px] text-neutral-500 tabular-nums">
                          -{formatRupiah(nominal)}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <span className="text-xs font-bold text-neutral-800 block pt-1">Atau Potongan Nominal Pas:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[10000, 25000, 50000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => {
                        setIsCompliment(false)
                        setDiscountAmount(nom)
                        setDiscountNote(`Potongan ${formatRupiah(nom)}`)
                        setShowDiscountModal(false)
                      }}
                      className="p-2.5 rounded-xl border border-stone-200 hover:border-black text-center transition-all cursor-pointer bg-[#F8F7F4] hover:bg-white"
                    >
                      <div className="font-extrabold text-xs text-black">{formatRupiah(nom)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL NOMINAL RUPIAH */}
            {discountModeTab === 'manual_rp' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Nominal Potongan Diskon (Rp):</label>
                  <input
                    type="number"
                    value={manualDiscountRp}
                    onChange={(e) => setManualDiscountRp(e.target.value)}
                    placeholder="Contoh: 15000"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-sm focus:outline-none focus:border-black font-extrabold tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Catatan / Alasan Diskon (opsional):</label>
                  <input
                    value={discountNote}
                    onChange={(e) => setDiscountNote(e.target.value)}
                    placeholder="Contoh: Voucher Grand Opening, Rekanan..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <button
                  type="button"
                  disabled={!manualDiscountRp || Number(manualDiscountRp) <= 0}
                  onClick={() => {
                    setIsCompliment(false)
                    setDiscountAmount(Number(manualDiscountRp) || 0)
                    setShowDiscountModal(false)
                  }}
                  className="w-full py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Terapkan Diskon Nominal ({formatRupiah(Number(manualDiscountRp) || 0)})
                </button>
              </div>
            )}

            {/* TAB 3: MANUAL PERSENTASE % */}
            {discountModeTab === 'manual_pct' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Persentase Diskon (%):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={manualDiscountPct}
                    onChange={(e) => setManualDiscountPct(e.target.value)}
                    placeholder="Contoh: 15"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-sm focus:outline-none focus:border-black font-extrabold tabular-nums"
                  />
                  {manualDiscountPct && (
                    <div className="text-[11px] text-neutral-500">
                      Nilai potongan:{' '}
                      <strong className="text-black tabular-nums">
                        {formatRupiah(Math.round(effectiveSubtotal * (Number(manualDiscountPct) / 100)))}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Catatan / Alasan Diskon (opsional):</label>
                  <input
                    value={discountNote}
                    onChange={(e) => setDiscountNote(e.target.value)}
                    placeholder="Contoh: Diskon Kartu Member VIP..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <button
                  type="button"
                  disabled={!manualDiscountPct || Number(manualDiscountPct) <= 0}
                  onClick={() => {
                    const pct = Math.min(100, Math.max(0, Number(manualDiscountPct) || 0))
                    const nom = Math.round(effectiveSubtotal * (pct / 100))
                    setIsCompliment(false)
                    setDiscountAmount(nom)
                    setDiscountNote(discountNote || `Diskon ${pct}%`)
                    setShowDiscountModal(false)
                  }}
                  className="w-full py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Terapkan Diskon {manualDiscountPct}%
                </button>
              </div>
            )}

            {/* TAB 4: COMPLIMENT (ON THE HOUSE / RP 0) */}
            {discountModeTab === 'compliment' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                  <div className="font-extrabold text-xs flex items-center gap-1.5">
                    <Gift size={14} className="text-amber-800" />
                    <span>Compliment (Tagihan Rp 0)</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Tagihan meja menjadi Rp 0. HPP bahan baku dibukukan otomatis ke Beban Promosi & Entertainment.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800">Pilih Preset Alasan Compliment:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      'Tamu VIP Rekanan Owner',
                      'Tasting Menu Food Blogger',
                      'Kompensasi Keterlambatan Dapur',
                      'Bonus Ulang Tahun Tamu',
                      'Staff / Karyawan Resto',
                      'Sampling Menu Baru',
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setComplimentReason(reason)}
                        className={`p-2 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          complimentReason === reason
                            ? 'border-amber-600 bg-amber-100 text-amber-950 font-bold'
                            : 'border-stone-200 text-neutral-700 hover:border-amber-400'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Keterangan Tambahan:</label>
                  <input
                    value={complimentReason}
                    onChange={(e) => setComplimentReason(e.target.value)}
                    placeholder="Tulis alasan compliment jika di luar pilihan di atas..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCompliment(true)
                    setShowDiscountModal(false)
                    setFeedbackMsg({
                      type: 'success',
                      text: `Compliment diterapkan: ${complimentReason}. Tagihan menjadi Rp 0.`,
                    })
                  }}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gift size={15} />
                  <span>Terapkan Compliment (Rp 0)</span>
                </button>
              </div>
            )}

            {/* RESET / CLEAR DISCOUNT */}
            {(effectiveDiscount > 0 || isCompliment) && (
              <div className="pt-2 border-t border-stone-200 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompliment(false)
                    setDiscountAmount(0)
                    setDiscountNote('')
                    setManualDiscountRp('')
                    setManualDiscountPct('')
                    setShowDiscountModal(false)
                    setFeedbackMsg({ type: 'info', text: 'Diskon & Compliment telah dibatalkan.' })
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Hapus Diskon / Batalkan Compliment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PINDAH MEJA (MOVE TABLE) */}
      {showMoveTableModal && tableToMove && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <ArrowRight size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-black">Pindah Meja Dine-In</h3>
              </div>
              <button
                onClick={() => setShowMoveTableModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-neutral-800 flex items-center justify-between">
              <span className="text-neutral-500">Meja Asal</span>
              <span className="font-bold text-neutral-900">{tableToMove.name} · {tableToMove.section}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-neutral-800 block">Pindah ke Meja Tujuan:</label>
              <select
                value={targetMoveTableId}
                onChange={(e) => setTargetMoveTableId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-semibold text-neutral-900 cursor-pointer focus:outline-none focus:border-black"
              >
                <option value="">-- Pilih Meja Kosong --</option>
                {branchTables
                  .filter((t) => t.id !== tableToMove.id && t.status === 'available')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · Area {t.section} ({t.capacity} Kursi)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMoveTableModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-neutral-700 hover:bg-stone-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!targetMoveTableId}
                onClick={() => {
                  if (onMoveTable && targetMoveTableId) {
                    const targetT = branchTables.find((t) => t.id === targetMoveTableId)
                    onMoveTable(tableToMove.id, targetMoveTableId)
                    setFeedbackMsg({
                      type: 'success',
                      text: `Pesanan dipindahkan ke ${targetT?.name || 'meja baru'}.`,
                    })
                  }
                  setShowMoveTableModal(false)
                  setTableToMove(null)
                  setTargetMoveTableId('')
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Pindah Meja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN QRIS RESMI USAHA */}
      {showQrisPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-black">Pembayaran QRIS Usaha</h3>
                  <p className="text-[11px] text-stone-500">Scan melalui aplikasi m-Banking atau e-Wallet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisPaymentModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* ORDER INFO BAR */}
            <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E4] flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">Penerima & Meja:</span>
                <span className="font-bold text-black truncate block">
                  {isPendingActiveTableCheckout
                    ? activeTableOrder?.customerName || selectedTable?.name || 'Tamu Resto'
                    : customerName || (orderChannel === 'dine_in' && selectedTable ? selectedTable.name : 'Takeaway')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[10px]">Total Tagihan:</span>
                <span className="font-extrabold text-base text-black tabular-nums">
                  {formatRupiah(isPendingActiveTableCheckout ? effectiveGrandTotal : grandTotal)}
                </span>
              </div>
            </div>

            {/* QR CODE BOX */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 flex flex-col items-center justify-center text-center space-y-2.5">
              {org?.qrisImageUrl || activeOutlet?.receiptConfig?.qrCodeUrl ? (
                <div className="w-56 h-56 p-2 bg-white rounded-2xl border border-stone-300 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src={org?.qrisImageUrl || activeOutlet?.receiptConfig?.qrCodeUrl}
                    alt="QRIS Usaha"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 p-4 rounded-2xl border-2 border-dashed border-stone-300 bg-[#F8F7F4] flex flex-col items-center justify-center text-center space-y-2">
                  <QrCode size={48} className="text-neutral-400" />
                  <div className="text-xs font-bold text-neutral-800">QRIS Usaha Belum Diunggah</div>
                  <p className="text-[10px] text-neutral-500 leading-tight">
                    Unggah gambar QRIS bisnis Anda di menu <strong>Pengaturan &gt; Profil &amp; Rekening</strong> agar tampil otomatis di sini.
                  </p>
                </div>
              )}

              <div className="space-y-0.5">
                <div className="font-bold text-xs text-black">
                  {org?.name || activeOutlet.name}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  STANDAR PEMBAYARAN QRIS NASIONAL (ASPI / BI)
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 text-center">
              Arahkan layar ini ke pelanggan atau verifikasi notifikasi m-Banking kasir sebelum konfirmasi.
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQrisPaymentModal(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 text-xs font-bold text-neutral-700 hover:bg-stone-50 cursor-pointer"
              >
                Batal / Ubah Metode
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQrisPaymentModal(false)
                  if (isPendingActiveTableCheckout) {
                    handleCheckoutActiveTable()
                  } else {
                    handleCheckout()
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>Konfirmasi Lunas ✓</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT GRUP KUSTOMISASI BARU */}
      {showCreateModifierGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                  <SlidersHorizontal size={16} />
                </div>
                <h3 className="font-bold text-sm text-black">Buat Grup Kustomisasi Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModifierGroupModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Nama Grup Kustomisasi:
                </label>
                <input
                  type="text"
                  value={newModGroupName}
                  onChange={(e) => setNewModGroupName(e.target.value)}
                  placeholder="Contoh: Topping Tambahan, Pilihan Susu, Level Pedas..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="font-bold text-neutral-800 block">Wajib Dipilih Tamu?</span>
                  <span className="text-[10px] text-neutral-500">
                    Jika ya, kasir wajib memilih minimal 1 opsi saat menambahkan menu ke keranjang.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newModGroupRequired}
                  onChange={(e) => setNewModGroupRequired(e.target.checked)}
                  className="rounded text-black focus:ring-black cursor-pointer w-4 h-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Daftar Pilihan Opsi:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewModGroupOptions((prev) => [...prev, { name: '', priceAdd: '0' }])
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-black cursor-pointer"
                  >
                    + Tambah Opsi
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {newModGroupOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const val = e.target.value
                          setNewModGroupOptions((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, name: val } : o))
                          )
                        }}
                        placeholder="Nama Opsi (cth: Keju Mozzarella)"
                        className="flex-1 p-2 rounded-xl border border-stone-300 font-medium focus:outline-none focus:border-black text-xs"
                      />
                      <div className="w-28 relative">
                        <input
                          type="number"
                          value={opt.priceAdd}
                          onChange={(e) => {
                            const val = e.target.value
                            setNewModGroupOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, priceAdd: val } : o))
                            )
                          }}
                          placeholder="0"
                          className="w-full p-2 rounded-xl border border-stone-300 font-bold tabular-nums focus:outline-none focus:border-black text-xs"
                        />
                      </div>
                      {newModGroupOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewModGroupOptions((prev) => prev.filter((_, i) => i !== idx))
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowCreateModifierGroupModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 font-semibold text-neutral-700 hover:bg-stone-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewModifierGroup}
                disabled={!newModGroupName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-40 font-bold transition-all shadow-xs cursor-pointer"
              >
                Simpan Kustomisasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
