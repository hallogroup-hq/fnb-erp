'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Sidebar, { ActiveTab } from '../components/Sidebar'
import { Menu, Store, ChefHat, Calendar, ReceiptText, ChevronDown, Building2 } from 'lucide-react'
import DashboardTab from '../components/DashboardTab'
import PosTab from '../components/PosTab'
import TransactionHistoryTab from '../components/TransactionHistoryTab'
import KdsTab from '../components/KdsTab'
import InventoryTab from '../components/InventoryTab'
import RoasteryTab from '../components/RoasteryTab'
import PurchasingTab from '../components/PurchasingTab'
import SalesB2bTab from '../components/SalesB2bTab'
import AccountingTab from '../components/AccountingTab'
import ReceiptDesignerTab from '../components/ReceiptDesignerTab'
import SettingsTab from '../components/SettingsTab'

import {
  INITIAL_ORG,
  INITIAL_OUTLETS,
  CENTRAL_HQ_OUTLET,
  INITIAL_USERS,
  INITIAL_INVENTORY,
  INITIAL_RECIPES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_MENU,
  INITIAL_MODIFIER_GROUPS,
  INITIAL_TABLES,
  INITIAL_BILLS,
  INITIAL_SALES_INVOICES,
  INITIAL_WORK_ORDERS,
  INITIAL_TRANSFERS,
  INITIAL_FIXED_ASSETS,
  INITIAL_ORDERS,
  INITIAL_SHIFT,
  seedInitialJournals,
} from '../lib/store/mockStore'

import {
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
  clearAllStoredData,
  exportEntireDatabaseJson,
  importEntireDatabaseJson,
} from '../lib/store/storage'

import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateTrialBalance,
  generateApAging,
  generateArAging,
} from '../lib/accounting/financialReports'

import {
  createJournalForPosSale,
  createJournalForPurchaseBill,
  createJournalForPurchasePayment,
  createJournalForSalesInvoiceB2B,
  createJournalForSalesReceiptB2B,
  createJournalForBatchRoasting,
  createJournalForWaste,
  createJournalForAssetDepreciation,
  createJournalForPettyCash,
  nextJournalNumber,
} from '../lib/accounting/engine'

import type {
  Organization,
  Outlet,
  User,
  Order,
  WorkOrderProduction,
  StockTransfer,
  PurchaseBill,
  SalesInvoiceB2B,
  JournalEntry,
  FixedAsset,
  ReceiptConfig,
  InventoryItem,
  Recipe,
  StockMovement,
  Shift,
  TableFloor,
  MenuItem,
  ModifierGroup,
} from '../types/erp'

import { ClientTelemetryAgent } from '../lib/telemetry/agent'

const TAB_META: Record<ActiveTab, { title: string }> = {
  dashboard: { title: 'Ringkasan Resto' },
  pos: { title: 'Kasir POS' },
  transactions: { title: 'Riwayat Struk' },
  kds: { title: 'KDS Dapur' },
  inventory: { title: 'Bahan Baku & HPP' },
  purchasing: { title: 'Pengadaan Supplier' },
  sales_b2b: { title: 'Catering & B2B' },
  roastery: { title: 'Produksi Roastery' },
  accounting: { title: 'Laporan Keuangan' },
  receipt_designer: { title: 'Format Struk' },
  settings: { title: 'Pengaturan' },
}

export default function AppRoot() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showHeaderOutletMenu, setShowHeaderOutletMenu] = useState(false)

  // CORE STATE
  const [org, setOrg] = useState<Organization>(INITIAL_ORG)
  const [outlets, setOutlets] = useState<Outlet[]>(INITIAL_OUTLETS)
  const [activeOutlet, setActiveOutlet] = useState<Outlet>(INITIAL_OUTLETS[0])
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0])

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES)
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS)

  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU)
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(INITIAL_MODIFIER_GROUPS)
  const [tables, setTables] = useState<TableFloor[]>(INITIAL_TABLES)

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [shift, setShift] = useState<Shift>(INITIAL_SHIFT)
  const [workOrders, setWorkOrders] = useState<WorkOrderProduction[]>(INITIAL_WORK_ORDERS)
  const [transfers, setTransfers] = useState<StockTransfer[]>(INITIAL_TRANSFERS)
  const [bills, setBills] = useState<PurchaseBill[]>(INITIAL_BILLS)
  const [invoices, setInvoices] = useState<SalesInvoiceB2B[]>(INITIAL_SALES_INVOICES)
  const [fixedAssets] = useState<FixedAsset[]>(INITIAL_FIXED_ASSETS)

  // DOUBLE-ENTRY JOURNALS
  const [journals, setJournals] = useState<JournalEntry[]>(() => seedInitialJournals())

  const [isHydrated, setIsHydrated] = useState(false)
  const [isShadowMode, setIsShadowMode] = useState(false)
  const [shadowStaff, setShadowStaff] = useState<string | null>(null)

  // INITIALIZE CLIENT TELEMETRY AGENT & DETECT SHADOW MODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('shadow_mode') === 'true') {
        setIsShadowMode(true)
        setShadowStaff(params.get('staff') || 'Staf Hallo Ops')
      }
    }

    const agent = new ClientTelemetryAgent({
      tenantId: org.id || 'org-resto',
      outletId: activeOutlet.id,
      outletName: activeOutlet.name,
    })
    agent.init()

    return () => {
      agent.destroy()
    }
  }, [org.id, activeOutlet.id, activeOutlet.name])

  // HYDRATE FROM LOCALSTORAGE ON FIRST MOUNT
  useEffect(() => {
    try {
      const storedOrg = loadStoredData<Organization | null>(STORAGE_KEYS.ORG, null)
      if (storedOrg) setOrg(storedOrg)

      const storedOutlets = loadStoredData<Outlet[] | null>(STORAGE_KEYS.OUTLETS, null)
      if (storedOutlets && storedOutlets.length > 0) {
        setOutlets(storedOutlets)
        setActiveOutlet(storedOutlets[0])
      }

      const storedMenu = loadStoredData<MenuItem[] | null>(STORAGE_KEYS.MENU, null)
      if (storedMenu && storedMenu.length > 0) setMenuItems(storedMenu)

      const storedModifiers = loadStoredData<ModifierGroup[] | null>(STORAGE_KEYS.MODIFIERS, null)
      if (storedModifiers && storedModifiers.length > 0) setModifierGroups(storedModifiers)

      const storedTables = loadStoredData<TableFloor[] | null>(STORAGE_KEYS.TABLES, null)
      if (storedTables && storedTables.length > 0) setTables(storedTables)

      const storedOrders = loadStoredData<Order[] | null>(STORAGE_KEYS.ORDERS, null)
      if (storedOrders && storedOrders.length > 0) setOrders(storedOrders)

      const storedShift = loadStoredData<Shift | null>(STORAGE_KEYS.SHIFT, null)
      if (storedShift) setShift(storedShift)

      const storedInv = loadStoredData<InventoryItem[] | null>(STORAGE_KEYS.INVENTORY, null)
      if (storedInv && storedInv.length > 0) setInventory(storedInv)

      const storedRecipes = loadStoredData<Recipe[] | null>(STORAGE_KEYS.RECIPES, null)
      if (storedRecipes && storedRecipes.length > 0) setRecipes(storedRecipes)

      const storedMovements = loadStoredData<StockMovement[] | null>(STORAGE_KEYS.MOVEMENTS, null)
      if (storedMovements && storedMovements.length > 0) setMovements(storedMovements)

      const storedBills = loadStoredData<PurchaseBill[] | null>(STORAGE_KEYS.BILLS, null)
      if (storedBills && storedBills.length > 0) setBills(storedBills)

      const storedInvoices = loadStoredData<SalesInvoiceB2B[] | null>(STORAGE_KEYS.INVOICES, null)
      if (storedInvoices && storedInvoices.length > 0) setInvoices(storedInvoices)

      const storedWorkOrders = loadStoredData<WorkOrderProduction[] | null>(STORAGE_KEYS.WORK_ORDERS, null)
      if (storedWorkOrders && storedWorkOrders.length > 0) setWorkOrders(storedWorkOrders)

      const storedTransfers = loadStoredData<StockTransfer[] | null>(STORAGE_KEYS.TRANSFERS, null)
      if (storedTransfers && storedTransfers.length > 0) setTransfers(storedTransfers)

      const storedJournals = loadStoredData<JournalEntry[] | null>(STORAGE_KEYS.JOURNALS, null)
      if (storedJournals && storedJournals.length > 0) setJournals(storedJournals)

      const storedUsers = loadStoredData<User[] | null>(STORAGE_KEYS.USERS, null)
      if (storedUsers && storedUsers.length > 0) setUsers(storedUsers)

      const storedCurrent = loadStoredData<User | null>(STORAGE_KEYS.CURRENT_USER, null)
      if (storedCurrent) {
        setCurrentUser(storedCurrent)
      } else if (storedUsers && storedUsers.length > 0) {
        setCurrentUser(storedUsers[0])
      }
    } catch (e) {
      console.warn('[Storage] Hydration error:', e)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // PERSIST STATE TO LOCALSTORAGE WHENEVER UPDATED
  useEffect(() => {
    if (!isHydrated) return
    saveStoredData(STORAGE_KEYS.ORG, org)
    saveStoredData(STORAGE_KEYS.OUTLETS, outlets)
    saveStoredData(STORAGE_KEYS.MENU, menuItems)
    saveStoredData(STORAGE_KEYS.TABLES, tables)
    saveStoredData(STORAGE_KEYS.ORDERS, orders)
    saveStoredData(STORAGE_KEYS.SHIFT, shift)
    saveStoredData(STORAGE_KEYS.INVENTORY, inventory)
    saveStoredData(STORAGE_KEYS.RECIPES, recipes)
    saveStoredData(STORAGE_KEYS.MOVEMENTS, movements)
    saveStoredData(STORAGE_KEYS.BILLS, bills)
    saveStoredData(STORAGE_KEYS.INVOICES, invoices)
    saveStoredData(STORAGE_KEYS.WORK_ORDERS, workOrders)
    saveStoredData(STORAGE_KEYS.TRANSFERS, transfers)
    saveStoredData(STORAGE_KEYS.JOURNALS, journals)
    saveStoredData(STORAGE_KEYS.USERS, users)
    saveStoredData(STORAGE_KEYS.CURRENT_USER, currentUser)
    saveStoredData(STORAGE_KEYS.MODIFIERS, modifierGroups)
  }, [
    isHydrated,
    org,
    outlets,
    menuItems,
    tables,
    orders,
    shift,
    inventory,
    recipes,
    movements,
    bills,
    invoices,
    workOrders,
    transfers,
    journals,
    users,
    currentUser,
    modifierGroups,
  ])

  // LIVE DERIVED ACCURATE-GRADE FINANCIAL REPORTS
  const pnl = useMemo(() => generateIncomeStatement(journals), [journals])
  const balanceSheet = useMemo(() => generateBalanceSheet(journals), [journals])
  const trialBalance = useMemo(() => generateTrialBalance(journals), [journals])
  const apAging = useMemo(() => generateApAging(bills), [bills])
  const arAging = useMemo(() => generateArAging(invoices), [invoices])

  // DYNAMIC DOCUMENT TITLE BASED ON BRAND IDENTITY
  useEffect(() => {
    if (org?.name) {
      document.title = `${org.name} · F&B Enterprise ERP`
    }
  }, [org?.name])

  const kdsPendingCount = useMemo(() => {
    return orders.filter(
      (o) =>
        (activeOutlet.id === 'all' || !o.outletId || o.outletId === activeOutlet.id) &&
        ((o.status === 'preparing' || o.status === 'open') || o.items.some((it) => !it.isCompletedInKitchen))
    ).length
  }, [orders, activeOutlet.id])

  // 1. HANDLER: POS SALE COMPLETED (CROSS-MODULE INTEGRATION)
  function handleOrderComplete(newOrder: Order, fallbackCogs: number) {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === newOrder.id)
      if (exists) {
        return prev.map((o) => (o.id === newOrder.id ? newOrder : o))
      }
      return [newOrder, ...prev]
    })

    const now = Date.now()
    let calculatedRealCogs = 0
    const inventoryDeductions: { itemId: string; qty: number; reason: string; cost: number }[] = []

    // Periksa setiap item yang dipesan terhadap resep BOM
    for (const item of newOrder.items) {
      const matchedRecipe = recipes.find((r) => r.menuItemId === item.menuItemId)
      if (matchedRecipe && matchedRecipe.ingredients.length > 0) {
        for (const ing of matchedRecipe.ingredients) {
          let targetItemId = ing.invItemId
          let targetQty = ing.qty * item.qty

          // Deteksi substitusi atau ekstra modifier (cth: susu oat menggantikan susu fresh, ekstra shot espresso)
          if (item.selectedModifiers && item.selectedModifiers.length > 0) {
            for (const mod of item.selectedModifiers) {
              if (mod.substituteInvItemId) {
                if (mod.id === 'opt-oat' && ing.invItemName.toLowerCase().includes('milk')) {
                  targetItemId = mod.substituteInvItemId
                  targetQty = (mod.invQtyUsed ? mod.invQtyUsed / 1000 : ing.qty) * item.qty
                } else if (mod.id === 'opt-shot-extra' && ing.invItemName.toLowerCase().includes('beans')) {
                  targetQty += (mod.invQtyUsed || 0.018) * item.qty
                }
              }
            }
          }

          const invItem = inventory.find((i) => i.id === targetItemId)
          const unitCost = invItem ? invItem.unitCost : 0
          const lineCost = targetQty * unitCost

          calculatedRealCogs += lineCost
          inventoryDeductions.push({
            itemId: targetItemId,
            qty: targetQty,
            reason: `Penjualan Kasir #${newOrder.orderNumber} (${item.qty}x ${item.name})`,
            cost: unitCost,
          })
        }
      } else {
        // Fallback jika menu belum didaftarkan resepnya (rasio 30% standar F&B)
        calculatedRealCogs += Math.round(item.subtotal * 0.3)
      }
    }

    // Eksekusi pemotongan stok bahan baku & catat riwayat kartu stok
    if (inventoryDeductions.length > 0) {
      const newMovements: StockMovement[] = []
      const targetBranchId = newOrder.outletId || (activeOutlet.id === 'all' ? (outlets.find((o) => o.id !== 'all')?.id || 'out-senopati') : activeOutlet.id)

      setInventory((prev) =>
        prev.map((inv) => {
          const matches = inventoryDeductions.filter((d) => d.itemId === inv.id)
          if (matches.length === 0) return inv

          const totalDeduct = matches.reduce((s, d) => s + d.qty, 0)
          const currentBranchStock = inv.stockByOutlet?.[targetBranchId] ?? inv.currentStock
          const newBranchStock = Math.max(0, Number((currentBranchStock - totalDeduct).toFixed(4)))

          const updatedStockByOutlet: Record<string, number> = {
            ...(inv.stockByOutlet || {}),
            [targetBranchId]: newBranchStock,
          }
          const consolidatedStock = Object.values(updatedStockByOutlet).reduce((a, b) => a + b, 0)

          matches.forEach((m, idx) => {
            newMovements.push({
              id: `sm-pos-${now}-${inv.id}-${idx}`,
              itemId: inv.id,
              outletId: targetBranchId,
              type: 'out',
              qty: m.qty,
              unitCostAtTime: inv.unitCost,
              balanceAfter: newBranchStock,
              reason: m.reason,
              date: now,
            })
          })

          return {
            ...inv,
            currentStock: consolidatedStock > 0 ? consolidatedStock : newBranchStock,
            stockByOutlet: updatedStockByOutlet,
          }
        })
      )

      if (newMovements.length > 0) {
        setMovements((prev) => [...newMovements, ...prev])
      }
    }

    const finalCogs = calculatedRealCogs > 0 ? calculatedRealCogs : fallbackCogs

    // Otomatis terbitkan jurnal penjualan & HPP berpasangan ke Buku Besar
    const jnl = createJournalForPosSale(newOrder, finalCogs)
    setJournals((prev) => [jnl, ...prev])

    // Update status meja jika dine-in
    if (newOrder.tableId) {
      setTables((prev) =>
        prev.map((t) => (t.id === newOrder.tableId ? { ...t, status: 'available', currentOrderId: undefined } : t))
      )
    }
  }

  // 1A. HANDLER: DINE-IN OPEN BILL (KIRIM KE DAPUR)
  function handleHoldOrder(openOrder: Order) {
    setOrders((prev) => [openOrder, ...prev])
    if (openOrder.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === openOrder.tableId
            ? { ...t, status: 'occupied', currentOrderId: openOrder.id }
            : t
        )
      )
    }
  }

  // 1B. HANDLER: UPDATE EXISTING TABLE ORDER (TAMBAH MENU KE MEJA)
  function handleUpdateOrder(updatedOrder: Order) {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    )
  }

  // 1B-2. HANDLER: UPDATE ORDER STATUS (ORDER TRACKING LIFECYCLE)
  function handleUpdateOrderStatus(orderId: string, newStatus: Order['status']) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              completedAt: newStatus === 'completed' ? Date.now() : o.completedAt,
              items:
                newStatus === 'ready' || newStatus === 'completed'
                  ? o.items.map((it) => ({ ...it, isCompletedInKitchen: true }))
                  : o.items,
            }
          : o
      )
    )
  }

  // 1C. HANDLER: UPDATE TABLE STATUS
  function handleUpdateTableStatus(tableId: string, status: TableFloor['status']) {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    )
  }

  // 1D. HANDLERS: MENU ITEM MANAGEMENT (CRUD)
  function handleAddMenuItem(item: MenuItem) {
    setMenuItems((prev) => [item, ...prev])
  }

  function handleUpdateMenuItem(updatedItem: MenuItem) {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === updatedItem.id ? updatedItem : m))
    )
  }

  function handleDeleteMenuItem(menuItemId: string) {
    setMenuItems((prev) => prev.filter((m) => m.id !== menuItemId))
  }

  // 1E. HANDLERS: TABLE FLOOR MANAGEMENT (CRUD)
  function handleAddTable(newTable: TableFloor) {
    setTables((prev) => [...prev, newTable])
  }

  function handleUpdateTable(updatedTable: TableFloor) {
    setTables((prev) =>
      prev.map((t) => (t.id === updatedTable.id ? updatedTable : t))
    )
  }

  function handleDeleteTable(tableId: string) {
    setTables((prev) => prev.filter((t) => t.id !== tableId))
  }

  // 1F. HANDLER: PINDAH MEJA (MOVE TABLE)
  function handleMoveTable(fromTableId: string, toTableId: string) {
    const fromT = tables.find((t) => t.id === fromTableId)
    const toT = tables.find((t) => t.id === toTableId)
    if (!fromT || !toT) return

    // Temukan order aktif di meja asal
    const activeOrder = orders.find(
      (o) =>
        (o.tableId === fromTableId || o.id === fromT.currentOrderId) &&
        o.status !== 'cancelled' &&
        o.status !== 'completed'
    )

    if (activeOrder) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? { ...o, tableId: toTableId, tableName: toT.name }
            : o
        )
      )
    }

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === fromTableId) {
          return { ...t, status: 'available' as const, currentOrderId: undefined }
        }
        if (t.id === toTableId) {
          return {
            ...t,
            status: 'occupied' as const,
            currentOrderId: activeOrder ? activeOrder.id : undefined,
          }
        }
        return t
      })
    )
  }

  // 1G. HANDLER: GABUNG MEJA (MERGE TABLES)
  function handleMergeTables(sourceTableId: string, targetTableId: string) {
    const sourceTable = tables.find((t) => t.id === sourceTableId)
    const targetTable = tables.find((t) => t.id === targetTableId)
    if (!sourceTable || !targetTable) return

    const sourceOrder = orders.find(
      (o) =>
        (o.tableId === sourceTableId || o.id === sourceTable.currentOrderId) &&
        o.status !== 'cancelled' &&
        o.status !== 'completed'
    )
    const targetOrder = orders.find(
      (o) =>
        (o.tableId === targetTableId || o.id === targetTable.currentOrderId) &&
        o.status !== 'cancelled' &&
        o.status !== 'completed'
    )

    if (sourceOrder && targetOrder) {
      // Gabungkan line items
      const mergedItems = [...targetOrder.items, ...sourceOrder.items]
      const newSubtotal = mergedItems.reduce((s, it) => s + it.subtotal, 0)
      const taxRate = activeOutlet.receiptConfig?.taxRatePct ?? 10
      const serviceRate = activeOutlet.receiptConfig?.serviceChargeRatePct ?? 5
      const newTax = Math.round(newSubtotal * (taxRate / 100))
      const newService = Math.round(newSubtotal * (serviceRate / 100))
      const newTotal = newSubtotal + newTax + newService - (targetOrder.discountAmount || 0)

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === targetOrder.id) {
            return {
              ...o,
              items: mergedItems,
              subtotal: newSubtotal,
              taxAmount: newTax,
              serviceChargeAmount: newService,
              total: newTotal,
              notes: `${o.notes || ''} [Digabung dari Meja ${sourceTable.name}]`.trim(),
            }
          }
          if (o.id === sourceOrder.id) {
            return {
              ...o,
              status: 'cancelled' as const,
              notes: `Digabungkan ke Meja ${targetTable.name} (Order #${targetOrder.orderNumber})`,
            }
          }
          return o
        })
      )

      setTables((prev) =>
        prev.map((t) => {
          if (t.id === sourceTableId) {
            return { ...t, status: 'available' as const, currentOrderId: undefined }
          }
          return t
        })
      )
    } else if (sourceOrder && !targetOrder) {
      handleMoveTable(sourceTableId, targetTableId)
    }
  }

  // 1B. HANDLER: VOID ORDER (PEMBATALAN TRANSAKSI & REVERSAL JURNAL)
  function handleVoidOrder(orderId: string, reason: string) {
    const targetOrder = orders.find((o) => o.id === orderId)
    if (!targetOrder || targetOrder.status === 'cancelled') return

    // Tandai status order menjadi cancelled
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const, notes: reason } : o))
    )

    const now = Date.now()

    // Kembalikan stok bahan baku yang terpotong jika ada resep BOM
    const inventoryReturns: { itemId: string; qty: number; cost: number }[] = []
    for (const item of targetOrder.items) {
      const matchedRecipe = recipes.find((r) => r.menuItemId === item.menuItemId)
      if (matchedRecipe && matchedRecipe.ingredients.length > 0) {
        for (const ing of matchedRecipe.ingredients) {
          const invItem = inventory.find((i) => i.id === ing.invItemId)
          const unitCost = invItem ? invItem.unitCost : 0
          inventoryReturns.push({
            itemId: ing.invItemId,
            qty: ing.qty * item.qty,
            cost: unitCost,
          })
        }
      }
    }

    if (inventoryReturns.length > 0) {
      const returnMovements: StockMovement[] = []
      setInventory((prev) =>
        prev.map((inv) => {
          const matches = inventoryReturns.filter((r) => r.itemId === inv.id)
          if (matches.length === 0) return inv
          const totalReturn = matches.reduce((s, r) => s + r.qty, 0)
          const newStock = Number((inv.currentStock + totalReturn).toFixed(4))

          returnMovements.push({
            id: `sm-void-${now}-${inv.id}`,
            itemId: inv.id,
            outletId: activeOutlet.id,
            type: 'in',
            qty: totalReturn,
            unitCostAtTime: inv.unitCost,
            balanceAfter: newStock,
            reason: `Pengembalian Stok Void #${targetOrder.orderNumber}: ${reason}`,
            date: now,
          })
          return { ...inv, currentStock: newStock }
        })
      )
      if (returnMovements.length > 0) {
        setMovements((prev) => [...returnMovements, ...prev])
      }
    }

    // Terbitkan Jurnal Reversal Pembatalan Transaksi SAK EMKM
    const reversalJournal: JournalEntry = {
      id: `jnl-void-${now}`,
      orgId: org.id,
      journalNumber: nextJournalNumber(),
      date: now,
      refType: 'manual',
      refId: targetOrder.id,
      description: `Pembatalan / Void Transaksi #${targetOrder.orderNumber} - Alasan: ${reason}`,
      lines: [
        {
          accountId: '4-4000',
          accountCode: '4-4000',
          accountName: 'Pendapatan Penjualan Resto & Bar',
          debit: targetOrder.subtotal,
          credit: 0,
        },
        {
          accountId: '2-2100',
          accountCode: '2-2100',
          accountName: 'Utang Pajak Restoran (PB1 10%)',
          debit: targetOrder.taxAmount,
          credit: 0,
        },
        {
          accountId: targetOrder.paymentMethod === 'cash' ? '1-1001' : '1-1002',
          accountCode: targetOrder.paymentMethod === 'cash' ? '1-1001' : '1-1002',
          accountName: targetOrder.paymentMethod === 'cash' ? 'Kas Kasir / Laci Kas' : 'Bank Mandiri Giro Ops',
          debit: 0,
          credit: targetOrder.total,
        },
      ],
      totalAmount: targetOrder.total,
      createdAt: now,
    }
    setJournals((prev) => [reversalJournal, ...prev])

    // Bebaskan meja jika pesanan yang di-void memiliki nomor meja
    if (targetOrder.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === targetOrder.tableId
            ? { ...t, status: 'available' as const, currentOrderId: undefined }
            : t
        )
      )
    }
  }

  // 1C. HANDLER: REKAP & TUTUP SHIFT KASIR (Z-REPORT)
  function handleCloseShift(actualCash: number, notes?: string) {
    setShift((prev) => {
      const completedCash = orders
        .filter((o) => o.status === 'completed' && o.paymentMethod === 'cash')
        .reduce((s, o) => s + o.total, 0)
      const expectedCash = prev.openingCash + completedCash
      return {
        ...prev,
        status: 'closed',
        closedAt: Date.now(),
        actualEndingCash: actualCash,
        expectedEndingCash: expectedCash,
        cashDiscrepancy: actualCash - expectedCash,
        notes: notes || prev.notes,
      }
    })
  }

  // 1D. HANDLER: BUKA SHIFT KASIR BARU
  function handleOpenShift(staffName: string, openingCash: number) {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      outletId: activeOutlet.id,
      staffId: currentUser.id,
      cashierId: currentUser.id,
      staffName,
      cashierName: staffName,
      openedAt: Date.now(),
      closedAt: null,
      openingCash,
      systemExpectedCash: openingCash,
      expectedEndingCash: openingCash,
      actualClosingCash: null,
      discrepancy: null,
      status: 'open',
      notes: `Shift kasir baru dibuka oleh ${staffName} dengan modal awal Rp ${openingCash.toLocaleString('id-ID')}`,
    }
    setShift(newShift)
  }

  // 1E. HANDLER: KAS KECIL LACI KASIR (PETTY CASH)
  function handleRecordPettyCash(
    amount: number,
    type: 'in' | 'out',
    reason: string,
    staffName: string
  ) {
    setShift((prev) => {
      const delta = type === 'in' ? amount : -amount
      const currentExpected = prev.systemExpectedCash ?? prev.openingCash
      return {
        ...prev,
        systemExpectedCash: currentExpected + delta,
        expectedEndingCash: currentExpected + delta,
      }
    })

    const jnl = createJournalForPettyCash(
      org.id,
      activeOutlet.id,
      amount,
      type,
      reason,
      staffName
    )
    setJournals((prev) => [jnl, ...prev])
  }

  // 2. HANDLER: INVENTORY ITEM BARU / UPDATE / DELETE
  function handleAddInventoryItem(item: InventoryItem) {
    setInventory((prev) => [item, ...prev])
  }

  function handleUpdateInventoryItem(updatedItem: InventoryItem) {
    setInventory((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)))
  }

  function handleDeleteInventoryItem(itemId: string) {
    setInventory((prev) => prev.filter((i) => i.id !== itemId))
  }

  // 3. HANDLER: MUTASI / OPNAME / PENYESUAIAN STOK & JURNAL WASTE
  function handleRecordStockMovement(
    itemId: string,
    type: 'in' | 'out' | 'adjustment',
    qty: number,
    reason: string,
    unitCostOverride?: number
  ) {
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return

    const effectiveCost = unitCostOverride ?? item.unitCost
    const now = Date.now()

    const targetBranchId = activeOutlet.id === 'all'
      ? (outlets.find((o) => o.id !== 'all')?.id || 'out-senopati')
      : activeOutlet.id

    const existingBranchStock = item.stockByOutlet?.[targetBranchId] ?? item.currentStock
    let newBranchStock = existingBranchStock
    if (type === 'in') {
      newBranchStock += qty
    } else if (type === 'out') {
      newBranchStock = Math.max(0, newBranchStock - qty)
    } else if (type === 'adjustment') {
      newBranchStock = qty
    }
    newBranchStock = Number(newBranchStock.toFixed(4))

    const updatedStockByOutlet: Record<string, number> = {
      ...(item.stockByOutlet || {}),
      [targetBranchId]: newBranchStock,
    }
    const consolidatedStock = Object.values(updatedStockByOutlet).reduce((a, b) => a + b, 0)

    setInventory((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              currentStock: consolidatedStock > 0 ? consolidatedStock : newBranchStock,
              stockByOutlet: updatedStockByOutlet,
              unitCost: effectiveCost,
              updatedAt: now,
            }
          : i
      )
    )

    const newMovement: StockMovement = {
      id: `sm-${now}-${Math.random().toString(36).slice(2, 6)}`,
      itemId,
      outletId: targetBranchId,
      type,
      qty,
      unitCostAtTime: effectiveCost,
      balanceAfter: newBranchStock,
      reason,
      date: now,
    }
    setMovements((prev) => [newMovement, ...prev])

    // Otomatis buat Jurnal Beban Kerusakan / Basi / Waste jika ada indikasi
    const isWaste = /basi|rusak|waste|spill|bocor|kadaluarsa|pecah/i.test(reason)
    if (isWaste && (type === 'out' || type === 'adjustment')) {
      const wastedQty = type === 'out' ? qty : Math.max(0, item.currentStock - qty)
      const wastedCost = wastedQty * effectiveCost
      if (wastedCost > 0) {
        const wasteJnl = createJournalForWaste(
          org.id,
          activeOutlet.id,
          item.name,
          wastedCost,
          reason,
          now
        )
        setJournals((prev) => [wasteJnl, ...prev])
      }
    }
  }

  // 4. HANDLER: UPDATE ATAU TAMBAH RESEP MENU (BOM)
  function handleUpdateRecipe(recipe: Recipe) {
    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === recipe.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = recipe
        return copy
      }
      return [recipe, ...prev]
    })
  }

  // 5. HANDLER: WORK ORDER ROASTING (CROSS-MODULE EVENT)
  function handleAddWorkOrder(wo: WorkOrderProduction) {
    setWorkOrders((prev) => [wo, ...prev])

    // Otomatis terbitkan jurnal konversi bahan baku ke barang jadi
    const jnl = createJournalForBatchRoasting(wo, org.id, activeOutlet.id)
    setJournals((prev) => [jnl, ...prev])

    const now = Date.now()

    // Kurangi green beans, tambahkan roasted beans, dan catat kartu stok
    setInventory((prev) =>
      prev.map((it) => {
        if (it.id === wo.inputItemId) {
          const nextStock = Math.max(0, it.currentStock - wo.inputQtyKg)
          setMovements((m) => [
            {
              id: `sm-wo-out-${now}`,
              itemId: it.id,
              outletId: activeOutlet.id,
              type: 'production_out',
              qty: wo.inputQtyKg,
              unitCostAtTime: it.unitCost,
              balanceAfter: nextStock,
              reason: `Pemakaian Produksi Roasting SPK #${wo.spkNumber}`,
              date: now,
            },
            ...m,
          ])
          return { ...it, currentStock: nextStock, updatedAt: now }
        }
        if (it.id === wo.outputItemId) {
          const nextStock = it.currentStock + wo.outputActualQtyKg
          setMovements((m) => [
            {
              id: `sm-wo-in-${now}`,
              itemId: it.id,
              outletId: activeOutlet.id,
              type: 'production_in',
              qty: wo.outputActualQtyKg,
              unitCostAtTime: wo.finalUnitCostPerKg,
              balanceAfter: nextStock,
              reason: `Hasil Sangrai Matang SPK #${wo.spkNumber} (Susut ${wo.yieldLossPct.toFixed(1)}%)`,
              date: now,
            },
            ...m,
          ])
          return {
            ...it,
            currentStock: nextStock,
            unitCost: wo.finalUnitCostPerKg,
            updatedAt: now,
          }
        }
        return it
      })
    )
  }

  // 6. HANDLER: MULTI-WAREHOUSE STOCK TRANSFER
  function handleAddTransfer(trf: StockTransfer) {
    setTransfers((prev) => [trf, ...prev])
  }

  function handleReceiveTransfer(trfId: string) {
    setTransfers((prev) =>
      prev.map((t) => (t.id === trfId ? { ...t, status: 'received', dateReceived: Date.now() } : t))
    )
  }

  // 4. HANDLER: PURCHASE BILL (AP) & PENERIMAAN BARANG GUDANG OTOMATIS
  function handleAddBill(newBill: PurchaseBill, autoReceiveStock = true) {
    setBills((prev) => [newBill, ...prev])
    const jnl = createJournalForPurchaseBill(newBill)
    setJournals((prev) => [jnl, ...prev])

    if (autoReceiveStock && newBill.items && newBill.items.length > 0) {
      const now = Date.now()
      const newMovements: StockMovement[] = []

      setInventory((prev) => {
        const updated = [...prev]
        for (const item of newBill.items || []) {
          const existingIdx = updated.findIndex(
            (i) => i.id === item.itemId || i.name.toLowerCase() === item.itemName.toLowerCase()
          )
          if (existingIdx >= 0) {
            const current = updated[existingIdx]
            const newStock = Number((current.currentStock + item.qty).toFixed(4))
            const effectiveUnitCost = item.unitCost > 0 ? item.unitCost : current.unitCost
            updated[existingIdx] = {
              ...current,
              currentStock: newStock,
              unitCost: effectiveUnitCost,
              updatedAt: now,
            }
            newMovements.push({
              id: `sm-bill-${now}-${item.itemId}`,
              itemId: current.id,
              outletId: activeOutlet.id,
              type: 'in',
              qty: item.qty,
              unitCostAtTime: effectiveUnitCost,
              balanceAfter: newStock,
              reason: `Penerimaan Barang Tagihan Supplier #${newBill.billNumber} (${newBill.supplierName})`,
              date: now,
            })
          } else {
            const newItemId = item.itemId || `inv-rec-${now}-${Math.random().toString(36).slice(2, 6)}`
            const newItem: InventoryItem = {
              id: newItemId,
              orgId: org.id,
              name: item.itemName,
              category: 'raw_material',
              currentStock: item.qty,
              unit: item.unit || 'pcs',
              minStock: 10,
              unitCost: item.unitCost,
              supplier: newBill.supplierName,
              updatedAt: now,
            }
            updated.push(newItem)
            newMovements.push({
              id: `sm-bill-${now}-${newItemId}`,
              itemId: newItemId,
              outletId: activeOutlet.id,
              type: 'in',
              qty: item.qty,
              unitCostAtTime: item.unitCost,
              balanceAfter: item.qty,
              reason: `Penerimaan Barang Baru Supplier #${newBill.billNumber} (${newBill.supplierName})`,
              date: now,
            })
          }
        }
        return updated
      })

      if (newMovements.length > 0) {
        setMovements((prev) => [...newMovements, ...prev])
      }
    }
  }

  function handlePayBill(billId: string, amount: number) {
    const targetBill = bills.find((b) => b.id === billId)
    if (!targetBill) return

    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? {
              ...b,
              paidAmount: b.paidAmount + amount,
              balanceDue: Math.max(0, b.balanceDue - amount),
              status: b.paidAmount + amount >= b.totalAmount ? 'paid' : 'partial',
            }
          : b
      )
    )

    const payment = {
      id: `pay-${Date.now()}`,
      billId,
      paymentNumber: `PAY/${Date.now().toString().slice(-4)}`,
      date: Date.now(),
      amount,
      bankAccountId: 'bank-bca',
      paymentMethod: 'bank_transfer' as const,
    }
    const jnl = createJournalForPurchasePayment(payment, targetBill)
    setJournals((prev) => [jnl, ...prev])
  }

  // 5. HANDLER: B2B SALES INVOICE (AR)
  function handleAddInvoice(newInv: SalesInvoiceB2B) {
    setInvoices((prev) => [newInv, ...prev])
    const jnl = createJournalForSalesInvoiceB2B(newInv)
    setJournals((prev) => [jnl, ...prev])
  }

  function handlePayInvoice(invoiceId: string, amount: number) {
    const targetInv = invoices.find((i) => i.id === invoiceId)
    if (!targetInv) return

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              paidAmount: inv.paidAmount + amount,
              balanceDue: Math.max(0, inv.balanceDue - amount),
              status: inv.paidAmount + amount >= inv.totalAmount ? 'paid' : 'partial',
            }
          : inv
      )
    )

    const jnl = createJournalForSalesReceiptB2B(targetInv, amount, Date.now())
    setJournals((prev) => [jnl, ...prev])
  }

  // 6. HANDLER: MANUAL JOURNAL ADJUSTMENT
  function handleAddManualJournal(
    desc: string,
    lines: { accountCode: string; debit: number; credit: number }[]
  ) {
    const totalAmount = lines.reduce((s, l) => s + l.debit, 0)
    const newJnl: JournalEntry = {
      id: `jnl-man-${Date.now()}`,
      orgId: org.id,
      journalNumber: nextJournalNumber(),
      date: Date.now(),
      refType: 'manual',
      description: desc,
      lines: lines.map((l) => ({
        accountId: l.accountCode,
        accountCode: l.accountCode,
        accountName: l.accountCode,
        debit: l.debit,
        credit: l.credit,
      })),
      totalAmount,
      createdAt: Date.now(),
    }
    setJournals((prev) => [newJnl, ...prev])
  }

  // 7. HANDLER: RUN MONTHLY ASSET DEPRECIATION
  function handleRunDepreciation(asset: FixedAsset) {
    const jnl = createJournalForAssetDepreciation(asset, Date.now())
    setJournals((prev) => [jnl, ...prev])
  }

  // 8. HANDLER: UPDATE RECEIPT CONFIG
  function handleSaveReceiptConfig(newConfig: ReceiptConfig) {
    setActiveOutlet((prev) => ({ ...prev, receiptConfig: newConfig }))
    setOutlets((prev) =>
      prev.map((o) => (o.id === activeOutlet.id ? { ...o, receiptConfig: newConfig } : o))
    )
  }

  // 9. HANDLER: UPDATE USERS / STAFF ROSTER
  function handleUpdateUsers(newUsers: User[]) {
    setUsers(newUsers)
    if (!newUsers.some((u) => u.id === currentUser.id) && newUsers.length > 0) {
      setCurrentUser(newUsers[0])
    }
  }

  // 10. HANDLER: UPDATE CURRENT USER PROFILE
  function handleUpdateCurrentUser(updatedUser: User) {
    setCurrentUser(updatedUser)
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
  }

  // 11. HANDLER: UPDATE ORG & SYNC RESTO SETTINGS
  function handleUpdateOrg(newOrg: Organization) {
    setOrg(newOrg)
    const updateRc = (rc: ReceiptConfig): ReceiptConfig => ({
      ...rc,
      storeName: newOrg.name || rc.storeName,
      taxRatePct: newOrg.defaultTaxRatePct ?? rc.taxRatePct,
      serviceChargeRatePct: newOrg.defaultServiceChargeRatePct ?? rc.serviceChargeRatePct,
    })
    setActiveOutlet((prev) => ({ ...prev, receiptConfig: updateRc(prev.receiptConfig) }))
    setOutlets((prev) =>
      prev.map((o) => ({
        ...o,
        receiptConfig: updateRc(o.receiptConfig),
      }))
    )
  }

  // 12. HANDLER: UPDATE MODIFIER GROUPS
  function handleUpdateModifierGroups(newGroups: ModifierGroup[]) {
    setModifierGroups(newGroups)
  }

  // 13. HANDLER: ADD OR UPDATE RECIPE FOR MENU ITEM
  function handleAddOrUpdateRecipe(newRecipe: Recipe) {
    setRecipes((prev) => [
      newRecipe,
      ...prev.filter((r) => r.menuItemId !== newRecipe.menuItemId),
    ])
  }

  // 14. HANDLER: UPDATE OUTLETS LIST
  function handleUpdateOutlets(newOutlets: Outlet[]) {
    setOutlets(newOutlets)
    if (!newOutlets.some((o) => o.id === activeOutlet.id) && newOutlets.length > 0) {
      setActiveOutlet(newOutlets[0])
    }
  }

  return (
    <div
      id="app-root-layout"
      className="min-h-screen bg-[#FAFAFA] text-black flex flex-col md:flex-row font-sans selection:bg-neutral-200"
    >
      {/* 1. VERTICAL LEFT SIDEBAR */}
      <Sidebar
        org={org}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        outlets={outlets}
        activeOutlet={activeOutlet}
        setActiveOutlet={setActiveOutlet}
        currentUser={currentUser}
        users={users}
        setCurrentUser={setCurrentUser}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        activeOrderCount={orders.length}
        kdsPendingCount={kdsPendingCount}
        modulesEnabled={org.modules}
      />

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* SHADOW SUPPORT INSPECTOR BANNER */}
        {isShadowMode && (
          <div className="bg-[#0F172A] text-white px-4 py-2 text-xs flex items-center justify-between z-30 border-b border-slate-700 no-print">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold tracking-tight">MODE INSPEKSI SHADOW HALLO OPS</span>
              <span className="text-slate-400">· Staf: {shadowStaff}</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                Toko: {org.name} ({activeOutlet.name})
              </span>
            </div>
            <button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.delete('shadow_mode')
                url.searchParams.delete('staff')
                window.location.href = url.toString()
              }}
              className="text-slate-300 hover:text-white font-bold underline cursor-pointer text-[11px]"
            >
              Keluar Sesi Shadow
            </button>
          </div>
        )}

        {/* TOP UTILITY HEADER */}
        <header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 select-none no-print">
          <div className="flex items-center justify-between gap-4">
            {/* LEFT: MOBILE HAMBURGER & CLEAN TITLE */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl border border-[#E5E7EB] text-neutral-700 hover:text-black hover:bg-neutral-100 cursor-pointer"
                aria-label="Buka Menu Navigasi"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base font-bold text-black tracking-tight truncate">
                  {TAB_META[activeTab]?.title}
                </h1>
                <span className="text-neutral-300">·</span>
                {/* INTERACTIVE OUTLET SWITCHER PILL */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowHeaderOutletMenu(!showHeaderOutletMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F7F4] hover:bg-stone-200 border border-[#E7E5E4] text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
                  >
                    <span>{activeOutlet.id === 'all' ? '🏢' : '📍'}</span>
                    <span className="truncate max-w-[130px] sm:max-w-none">{activeOutlet.name}</span>
                    <ChevronDown size={12} className="text-neutral-500" />
                  </button>

                  {showHeaderOutletMenu && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 z-50">
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Pusat / Holding
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveOutlet(CENTRAL_HQ_OUTLET)
                          setShowHeaderOutletMenu(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                          activeOutlet.id === 'all'
                            ? 'bg-black text-white'
                            : 'text-neutral-800 hover:bg-stone-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>🏢</span>
                          <span>Kantor Pusat (Konsolidasi)</span>
                        </span>
                        {activeOutlet.id === 'all' && <span>✓</span>}
                      </button>
                      <div className="my-1 border-t border-stone-100" />
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Cabang Operasional
                      </div>
                      {outlets
                        .filter((o) => o.id !== 'all')
                        .map((out) => (
                          <button
                            key={out.id}
                            type="button"
                            onClick={() => {
                              setActiveOutlet(out)
                              setShowHeaderOutletMenu(false)
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                              activeOutlet.id === out.id
                                ? 'bg-black text-white'
                                : 'text-neutral-800 hover:bg-stone-100'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span>📍</span>
                              <span className="truncate">{out.name}</span>
                            </span>
                            {activeOutlet.id === out.id && <span>✓</span>}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: QUICK ACCESS SHORTCUTS & CLOCK */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* CURRENT DATE CHIP */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E4] text-[11px] text-neutral-600 font-medium">
                <Calendar size={12} className="text-neutral-400" />
                <span>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>

              {/* QUICK POS BUTTON IF NOT CURRENTLY ON POS */}
              {activeTab !== 'pos' && (
                <button
                  onClick={() => setActiveTab('pos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-tight transition-all shadow-xs cursor-pointer min-h-[36px]"
                >
                  <Store size={13} />
                  <span className="hidden sm:inline">Kasir POS</span>
                </button>
              )}

              {/* QUICK TRANSACTIONS BUTTON IF ON POS */}
              {activeTab === 'pos' && (
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F7F4] text-neutral-800 hover:bg-stone-200 border border-[#E7E5E4] text-xs font-semibold tracking-tight transition-all cursor-pointer min-h-[36px]"
                >
                  <ReceiptText size={13} />
                  <span className="hidden sm:inline">Riwayat</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                    {orders.length}
                  </span>
                </button>
              )}

              {/* QUICK KDS BUTTON IF ON POS */}
              {activeTab === 'pos' && (
                <button
                  onClick={() => setActiveTab('kds')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F7F4] text-neutral-800 hover:bg-stone-200 border border-[#E7E5E4] text-xs font-semibold tracking-tight transition-all cursor-pointer min-h-[36px]"
                >
                  <ChefHat size={13} />
                  <span className="hidden sm:inline">KDS Dapur</span>
                  {kdsPendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                      {kdsPendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main
          className={`flex-1 w-full ${
            activeTab === 'pos' || activeTab === 'kds'
              ? 'max-w-none p-3 sm:p-5'
              : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              pnl={pnl}
              balanceSheet={balanceSheet}
              apAging={apAging}
              arAging={arAging}
              inventory={inventory}
              activeOutlet={activeOutlet}
              outlets={outlets}
              orders={orders}
              tables={tables}
              onSelectOutlet={setActiveOutlet}
              onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'pos' && (
            <PosTab
              org={org}
              menuItems={menuItems}
              modifierGroups={modifierGroups}
              onUpdateModifierGroups={handleUpdateModifierGroups}
              inventory={inventory}
              recipes={recipes}
              onAddOrUpdateRecipe={handleAddOrUpdateRecipe}
              tables={tables}
              activeOutlet={activeOutlet}
              outlets={outlets}
              onSelectOutlet={setActiveOutlet}
              currentUser={currentUser}
              orders={orders}
              onOrderComplete={handleOrderComplete}
              onHoldOrder={handleHoldOrder}
              onUpdateOrder={handleUpdateOrder}
              onUpdateTableStatus={handleUpdateTableStatus}
              onVoidOrder={handleVoidOrder}
              onViewTransactions={() => setActiveTab('transactions')}
              onAddMenuItem={handleAddMenuItem}
              onUpdateMenuItem={handleUpdateMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
              onAddTable={handleAddTable}
              onUpdateTable={handleUpdateTable}
              onDeleteTable={handleDeleteTable}
              onMoveTable={handleMoveTable}
              onMergeTables={handleMergeTables}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionHistoryTab
              orders={orders}
              activeOutlet={activeOutlet}
              outlets={outlets}
              shift={shift}
              currentUser={currentUser}
              onVoidOrder={handleVoidOrder}
              onCloseShift={handleCloseShift}
              onOpenShift={handleOpenShift}
              onRecordPettyCash={handleRecordPettyCash}
              onOpenPos={() => setActiveTab('pos')}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'kds' && (
            <KdsTab
              orders={orders}
              receiptConfig={activeOutlet.receiptConfig}
              activeOutlet={activeOutlet}
              outlets={outlets}
              onMarkItemDone={(ordId, lineId) => {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === ordId
                      ? {
                          ...o,
                          items: o.items.map((it) =>
                            it.id === lineId ? { ...it, isCompletedInKitchen: !it.isCompletedInKitchen } : it
                          ),
                        }
                      : o
                  )
                )
              }}
              onCompleteOrder={(ordId) => {
                setOrders((prev) =>
                  prev.map((o) => {
                    if (o.id !== ordId) return o
                    // Jika order sedang dimasak, bump di KDS mengubah status menjadi 'ready' (Siap Saji)
                    // Jika sudah 'ready', bump menandai 'completed' (Selesai & Disajikan)
                    const nextStatus: Order['status'] = o.status === 'preparing' ? 'ready' : 'completed'
                    return {
                      ...o,
                      status: nextStatus,
                      completedAt: nextStatus === 'completed' ? Date.now() : o.completedAt,
                      items: o.items.map((it) => ({ ...it, isCompletedInKitchen: true })),
                    }
                  })
                )
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              recipes={recipes}
              menuItems={menuItems}
              movements={movements}
              activeOutlet={activeOutlet}
              outlets={outlets}
              onSelectOutlet={setActiveOutlet}
              onAddInventoryItem={handleAddInventoryItem}
              onUpdateInventoryItem={handleUpdateInventoryItem}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              onRecordStockMovement={handleRecordStockMovement}
              onUpdateRecipe={handleUpdateRecipe}
            />
          )}

          {activeTab === 'roastery' && (
            <RoasteryTab
              workOrders={workOrders}
              transfers={transfers}
              inventory={inventory}
              onAddWorkOrder={handleAddWorkOrder}
              onAddTransfer={handleAddTransfer}
              onReceiveTransfer={handleReceiveTransfer}
            />
          )}

          {activeTab === 'purchasing' && (
            <PurchasingTab
              bills={bills}
              apAging={apAging}
              inventory={inventory}
              onAddBill={handleAddBill}
              onPayBill={handlePayBill}
            />
          )}

          {activeTab === 'sales_b2b' && (
            <SalesB2bTab
              invoices={invoices}
              arAging={arAging}
              onAddInvoice={handleAddInvoice}
              onPayInvoice={handlePayInvoice}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingTab
              pnl={pnl}
              balanceSheet={balanceSheet}
              trialBalance={trialBalance}
              journals={journals}
              fixedAssets={fixedAssets}
              activeOutlet={activeOutlet}
              outlets={outlets}
              onAddManualJournal={handleAddManualJournal}
              onRunDepreciation={handleRunDepreciation}
            />
          )}

          {activeTab === 'receipt_designer' && (
            <ReceiptDesignerTab
              config={activeOutlet.receiptConfig}
              onSaveConfig={handleSaveReceiptConfig}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              org={org}
              onUpdateOrg={handleUpdateOrg}
              users={users}
              onUpdateUsers={handleUpdateUsers}
              currentUser={currentUser}
              outlets={outlets}
              onUpdateOutlets={handleUpdateOutlets}
              activeOutlet={activeOutlet}
              onSelectActiveOutlet={setActiveOutlet}
            />
          )}
        </main>

        {/* MINIMAL EDITORIAL FOOTER (HIDDEN ON FAST POS & KDS INTERFACES) */}
        {activeTab !== 'pos' && activeTab !== 'kds' && (
          <footer className="border-t border-[#E5E7EB] bg-white py-6 mt-12 text-center text-xs text-neutral-500 no-print">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>{org.name} · {org.legalName || 'SAK EMKM Standard & F&B Suite'}</span>
              <span className="text-neutral-400">Design System: Studio Elio × The Outline</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
