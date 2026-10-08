export type Role = 'owner' | 'manager' | 'accountant' | 'cashier' | 'barista' | 'kitchen'

export type ModuleName =
  | 'pos_quick_service'
  | 'pos_dine_in_tables'
  | 'kitchen_routing_kds'
  | 'inventory_basic'
  | 'inventory_recipes_hpp'
  | 'multi_warehouse_transfer'
  | 'batch_production_roasting'
  | 'b2b_wholesale_invoicing'
  | 'accurate_grade_accounting'
  | 'fixed_assets'
  | 'bank_reconciliation'
  | 'live_excel_export'
  | 'official_pdf_export'

export interface ModuleFlags {
  pos_quick_service: boolean
  pos_dine_in_tables: boolean
  kitchen_routing_kds: boolean
  inventory_basic: boolean
  inventory_recipes_hpp: boolean
  multi_warehouse_transfer: boolean
  batch_production_roasting: boolean
  b2b_wholesale_invoicing: boolean
  accurate_grade_accounting: boolean
  fixed_assets: boolean
  bank_reconciliation: boolean
  live_excel_export: boolean
  official_pdf_export: boolean
}

export interface Organization {
  id: string
  name: string
  legalName?: string
  taxId_NPWP?: string
  logoUrl?: string
  qrisImageUrl?: string
  phone: string
  email?: string
  address: string
  bankName?: string
  bankAccount?: string
  bankHolder?: string
  defaultTaxRatePct?: number
  defaultServiceChargeRatePct?: number
  modules: ModuleFlags
  subscriptionPlan: 'starter' | 'pro' | 'enterprise'
  createdAt: number
}

export interface Outlet {
  id: string
  orgId: string
  name: string
  code: string
  address: string
  phone: string
  isCentralHub: boolean // Roastery / Central Kitchen
  receiptConfig: ReceiptConfig
  isActive?: boolean
  tableCount?: number
}

export interface ReceiptConfig {
  storeName: string
  branchName: string
  legalAddress: string
  phone: string
  instagram?: string
  wifiPassword?: string
  paperWidth: '58mm' | '80mm'
  showTax: boolean
  taxRatePct?: number
  showServiceCharge: boolean
  serviceChargeRatePct?: number
  showModifierDetails: boolean
  showCashierName: boolean
  customFooterMessage: string
  qrCodeUrl?: string
}

export interface User {
  id: string
  orgId: string
  outletId?: string
  name: string
  pin: string
  role: Role
  active: boolean
}

// -------------------------------------------------------------
// ACCOUNTING DOMAIN (ACCURATE-GRADE)
// -------------------------------------------------------------

export type AccountType =
  | 'asset_cash'
  | 'asset_bank'
  | 'asset_receivable'
  | 'asset_inventory'
  | 'asset_fixed'
  | 'asset_contra_depreciation'
  | 'liability_payable'
  | 'liability_tax'
  | 'liability_accrued'
  | 'equity_capital'
  | 'equity_retained_earnings'
  | 'equity_current_earnings'
  | 'revenue_sales'
  | 'revenue_contra_discount'
  | 'revenue_other'
  | 'cogs_food'
  | 'cogs_beverage'
  | 'cogs_packaging'
  | 'cogs_roastery'
  | 'expense_payroll'
  | 'expense_rent'
  | 'expense_utility'
  | 'expense_waste'
  | 'expense_cash_discrepancy'
  | 'expense_depreciation'
  | 'expense_other'

export interface AccountCOA {
  id: string
  code: string // e.g. "1-1001"
  name: string
  type: AccountType
  category: 'Aset' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'HPP' | 'Beban'
  normalBalance: 'debit' | 'credit'
  parentCode?: string
  balance: number
  isLocked?: boolean
}

export interface JournalLine {
  accountId: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  memo?: string
}

export interface JournalEntry {
  id: string
  orgId: string
  outletId?: string
  journalNumber: string // e.g. "JV/202610/0001"
  date: number
  refType: 'pos_sale' | 'purchase_bill' | 'purchase_pay' | 'sales_inv' | 'sales_pay' | 'production' | 'waste' | 'shift_close' | 'manual' | 'depreciation'
  refId?: string
  description: string
  lines: JournalLine[]
  totalAmount: number
  postedBy?: string
  createdAt: number
}

export interface BankAccount {
  id: string
  orgId: string
  outletId?: string
  name: string // "BCA Operasional Outlet 1"
  bankName: string
  accountNumber: string
  holderName: string
  coaAccountId: string // link to 1-1002
  currentBalance: number
}

export interface BankMutation {
  id: string
  bankAccountId: string
  date: number
  description: string
  amount: number
  type: 'debit' | 'credit' // debit = uang masuk, credit = uang keluar
  matchedJournalId?: string
  isReconciled: boolean
}

// -------------------------------------------------------------
// PROCUREMENT & ACCOUNTS PAYABLE (AP)
// -------------------------------------------------------------

export interface Supplier {
  id: string
  orgId: string
  name: string
  contactPerson?: string
  phone: string
  email?: string
  address?: string
  paymentTermDays: number // e.g. 0 (COD), 7, 14, 30
}

export interface PurchaseOrderItem {
  itemId: string
  itemName: string
  qty: number
  unit: string
  unitCost: number
  subtotal: number
}

export interface PurchaseOrder {
  id: string
  orgId: string
  outletId: string
  poNumber: string // e.g. "PO/CCR/202610/0001"
  supplierId: string
  supplierName: string
  date: number
  expectedDeliveryDate: number
  items: PurchaseOrderItem[]
  totalAmount: number
  status: 'draft' | 'ordered' | 'received_partial' | 'received_full' | 'cancelled'
  notes?: string
}

export interface GoodsReceiptItem {
  itemId: string
  qtyReceived: number
  unit: string
  conditionOk: boolean
  notes?: string
}

export interface GoodsReceipt {
  id: string
  poId: string
  grnNumber: string // e.g. "GRN/202610/0001"
  date: number
  receivedBy: string
  items: GoodsReceiptItem[]
}

export interface PurchaseBill {
  id: string
  orgId: string
  outletId: string
  billNumber: string // e.g. "BILL/202610/0001"
  vendorInvoiceNumber: string
  poId?: string
  supplierId: string
  supplierName: string
  date: number
  dueDate: number
  items?: PurchaseOrderItem[]
  notes?: string
  totalAmount: number
  paidAmount: number
  balanceDue: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue'
}

export interface PurchasePayment {
  id: string
  billId: string
  paymentNumber: string
  date: number
  amount: number
  bankAccountId: string
  paymentMethod: 'bank_transfer' | 'cash'
  memo?: string
}

// -------------------------------------------------------------
// B2B WHOLESALE & ACCOUNTS RECEIVABLE (AR)
// -------------------------------------------------------------

export interface CustomerB2B {
  id: string
  orgId: string
  name: string // e.g. "Kopi Senja Cafe"
  picName: string
  phone: string
  address: string
  paymentTermDays: number
}

export interface SalesInvoiceItem {
  itemId: string
  name: string
  qty: number
  unit: string
  unitPrice: number
  discountPct?: number
  subtotal: number
}

export interface SalesInvoiceB2B {
  id: string
  orgId: string
  outletId: string
  invoiceNumber: string // "INV/CCR/202610/0001"
  customerId: string
  customerName: string
  customerAddress: string
  date: number
  dueDate: number
  items: SalesInvoiceItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue'
}

// -------------------------------------------------------------
// INVENTORY, BOM & ROASTERY PRODUCTION
// -------------------------------------------------------------

export type InvCategory =
  | 'beans_green'
  | 'beans_roasted'
  | 'dairy'
  | 'syrup'
  | 'packaging'
  | 'food_raw'
  | 'merchandise'
  | 'other'
  | 'raw_material'
  | 'meat_poultry'
  | 'produce'
  | 'grocery_spices'

export interface InventoryItem {
  id: string
  orgId: string
  outletId?: string
  stockByOutlet?: Record<string, number>
  code?: string
  name: string
  category: InvCategory
  unit: string // "kg", "gram", "ml", "pcs"
  currentStock: number
  minStock: number
  unitCost: number // Moving average cost
  sellingPrice?: number
  supplier?: string
  updatedAt: number
}

export interface StockMovement {
  id: string
  itemId: string
  outletId: string
  type: 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'production_in' | 'production_out'
  qty: number
  unitCostAtTime: number
  balanceAfter: number
  reason: string
  refType?: string
  refId?: string
  date: number
}

export interface RecipeIngredient {
  invItemId: string
  invItemName: string
  qty: number
  unit: string
}

export interface Recipe {
  id: string
  menuItemId: string
  menuItemName?: string
  ingredients: RecipeIngredient[]
  laborCostStd: number
  overheadCostStd: number
  totalStdCost?: number
  notes?: string
  createdAt?: number
  updatedAt?: number
}

export interface WorkOrderProduction {
  id: string
  spkNumber: string // "WO/202610/0001"
  date: number
  inputItemId: string // e.g. Green Beans Ciengang
  inputItemName: string
  inputQtyKg: number
  inputUnitCost: number
  conversionCostRp: number // gas/listrik/tenaga
  outputItemId: string // e.g. Roasted Beans Ciengang
  outputItemName: string
  outputActualQtyKg: number
  yieldLossPct: number // calculated e.g. (1 - output/input)*100
  finalUnitCostPerKg: number // (inputCost + conversionCost) / outputQty
  operatorName: string
  notes?: string
}

export interface StockTransfer {
  id: string
  transferNumber: string // "TRF/202610/0001"
  sourceOutletId: string
  sourceOutletName: string
  targetOutletId: string
  targetOutletName: string
  dateSent: number
  dateReceived?: number
  driverName?: string
  vehiclePlate?: string
  status: 'sent' | 'in_transit' | 'received' | 'received_discrepancy'
  items: {
    itemId: string
    itemName: string
    qtySent: number
    qtyReceived?: number
    unit: string
    discrepancyNotes?: string
  }[]
}

// -------------------------------------------------------------
// POS, DINE-IN, KITCHEN & SHIFT
// -------------------------------------------------------------

export interface TableFloor {
  id: string
  outletId: string
  name: string // "Meja 01", "VIP 2"
  section: 'Indoor' | 'Outdoor' | 'Bar' | 'Lantai 2' | 'VIP'
  capacity: number
  status: 'available' | 'occupied' | 'billing' | 'dirty' | 'reserved'
  shape?: 'round' | 'square' | 'rect' | 'bar'
  currentOrderId?: string
}

export interface MenuItemModifier {
  id: string
  name: string // "Oat Milk Substitute", "Extra Espresso Shot"
  priceAdd: number
  substituteInvItemId?: string
  invQtyUsed?: number
}

export interface ModifierGroup {
  id: string
  name: string // "Pilihan Susu", "Level Es", "Level Gula"
  required: boolean
  maxSelection: number
  options: MenuItemModifier[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  price: number
  active: boolean
  emoji?: string
  description?: string
  modifierGroupIds?: string[]
  isKitchenItem?: boolean // true = dapur, false = bar
}

export interface OrderLineItem {
  id: string
  menuItemId: string
  name: string
  price: number
  qty: number
  subtotal: number
  selectedModifiers?: MenuItemModifier[]
  notes?: string
  isKitchenItem?: boolean
  isCompletedInKitchen?: boolean
  isCompliment?: boolean
}

export type PaymentMethod = 'cash' | 'qris' | 'debit' | 'transfer' | 'tempo_ar' | 'compliment'

export interface OrderPayment {
  method: PaymentMethod
  amount: number
}

export interface Order {
  id: string
  orgId: string
  outletId: string
  orderNumber: string
  channel: 'bar' | 'roastery' | 'dine_in' | 'takeaway' | 'delivery'
  tableId?: string
  tableName?: string
  customerName?: string
  notes?: string
  items: OrderLineItem[]
  subtotal: number
  discountAmount: number
  discountNote?: string
  discountType?: 'percentage' | 'nominal'
  discountRatePct?: number
  isCompliment?: boolean
  complimentReason?: string
  serviceChargeAmount: number
  taxAmount: number
  total: number
  paymentMethod: PaymentMethod
  payments: OrderPayment[]
  cashReceived?: number | null
  changeAmount?: number | null
  status: 'open' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  shiftId?: string
  staffId?: string
  staffName?: string
  createdAt: number
  completedAt?: number
}

export interface Shift {
  id: string
  outletId: string
  staffId: string
  staffName: string
  cashierId?: string
  cashierName?: string
  openingCash: number
  systemExpectedCash: number
  expectedEndingCash?: number
  actualClosingCash: number | null
  actualEndingCash?: number
  discrepancy: number | null
  cashDiscrepancy?: number
  status?: 'open' | 'closed'
  notes?: string
  openedAt: number
  closedAt: number | null
}

// -------------------------------------------------------------
// FIXED ASSETS
// -------------------------------------------------------------

export interface FixedAsset {
  id: string
  orgId: string
  code: string
  name: string // "Mesin Espresso La Marzocco Linea PB"
  purchaseDate: number
  purchaseCost: number
  usefulLifeMonths: number // e.g. 48 months (4 years)
  residualValue: number
  accumulatedDepreciation: number
  monthlyDepreciation: number // (cost - residual) / months
  lastDepreciationDate?: number
  coaAssetId: string // 1-1500
  coaContraId: string // 1-1501
  coaExpenseId: string // 6-4001
}

// -------------------------------------------------------------
// ACCURATE ACCOUNTING SYSTEM DOMAIN (OFFICIAL MULTI-PAGE REPORTS)
// -------------------------------------------------------------

export interface AccurateComparativeMonth {
  monthName: string // e.g. "Agustus", "Juli", "Juni"
  grossRevenue: number
  commissionFee: number
  restaurantTaxPb1: number
  complimentVoucher: number
  netRevenue: number
  cogsFood: number
  cogsBeverage: number
  cogsProductionSupport: number
  cogsStockDiscrepancy: number
  cogsWaste: number
  cogsQc: number
  cogsPackaging: number
  totalCogs: number
  grossProfit: number
  grossProfitMarginPct: number
  operatingExpenses: {
    name: string
    amount: number
    pctOfNet: number
    subItems?: { name: string; amount: number; pctOfNet: number }[]
  }[]
  totalExpenses: number
  totalExpensesPct: number
  operatingProfit: number
  operatingProfitPct: number
  otherIncome: number
  otherExpenses: number
  profitBeforeTax: number
  profitBeforeTaxPct: number
  incomeTax: number
  netProfit: number
  netProfitMarginPct: number
}

export interface AccuratePurchaseItemRow {
  id: string
  invoiceNumber: string // e.g. "PI.2026.08.00077"
  date: string // "03 Agt 2026"
  notes?: string
  itemName: string
  quantity: number
  unit: string
  totalAmount: number
}

export interface AccurateInventoryValuationRow {
  itemCode: string // "100433"
  itemName: string
  beginningQty: number
  beginningValuation: number
  inQty: number
  inValuation: number
  outQty: number
  outValuation: number
  endingQty: number
  endingValuation: number
}
