import { pgSchema, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core'

export const fnbSchema = pgSchema('fnb')

// TENANTS (Multi-Tenant Organization Core)
export const tenants = fnbSchema.table('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  slug: text('slug').notNull().unique(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  subscriptionTier: text('subscription_tier').default('pro').notNull(),
  status: text('status').default('active').notNull(),
  modules: jsonb('modules'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// OUTLETS (Store Branches)
export const outlets = fnbSchema.table('outlets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  address: text('address'),
  phone: text('phone'),
  isCentralHub: boolean('is_central_hub').default(false).notNull(),
  tableCount: integer('table_count').default(10).notNull(),
  receiptConfig: jsonb('receipt_config'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// USERS & STAFF
export const users = fnbSchema.table('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  outletId: text('outlet_id').references(() => outlets.id),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('cashier'), // owner | manager | accountant | cashier | barista | kitchen
  pin: text('pin').notNull().default('1234'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// CATEGORIES
export const categories = fnbSchema.table('categories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
})

// PRODUCTS / MENU ITEMS
export const products = fnbSchema.table('products', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id),
  name: text('name').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0').notNull(),
  emoji: text('emoji'),
  description: text('description'),
  isKitchenItem: boolean('is_kitchen_item').default(false).notNull(), // true = food/kitchen, false = beverage/bar
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// INVENTORY ITEMS
export const inventoryItems = fnbSchema.table('inventory_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  outletId: text('outlet_id').references(() => outlets.id),
  code: text('code'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  unit: text('unit').notNull(), // 'kg', 'gram', 'ml', 'pcs'
  currentStock: numeric('current_stock', { precision: 12, scale: 3 }).default('0').notNull(),
  minStock: numeric('min_stock', { precision: 12, scale: 3 }).default('0').notNull(),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).default('0').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// RECIPES / BOM (BILL OF MATERIALS)
export const recipesBom = fnbSchema.table('recipes_bom', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  ingredientId: text('ingredient_id').notNull().references(() => inventoryItems.id),
  qtyUsed: numeric('qty_used', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
})

// TABLES
export const tables = fnbSchema.table('tables', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  outletId: text('outlet_id').notNull().references(() => outlets.id),
  name: text('name').notNull(),
  section: text('section').default('Indoor').notNull(),
  capacity: integer('capacity').default(4).notNull(),
  status: text('status').default('available').notNull(), // 'available', 'occupied', 'billing', 'reserved'
  currentOrderId: text('current_order_id'),
})

// ORDERS (SINGLE CLOUD SOURCE OF TRUTH)
export const orders = fnbSchema.table('orders', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  outletId: text('outlet_id').notNull().references(() => outlets.id),
  orderNumber: text('order_number').notNull(),
  channel: text('channel').default('dine_in').notNull(), // 'bar' | 'dine_in' | 'takeaway' | 'delivery'
  tableId: text('table_id'),
  tableName: text('table_name'),
  customerName: text('customer_name'),
  notes: text('notes'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  serviceChargeAmount: numeric('service_charge_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentMethod: text('payment_method').default('cash').notNull(),
  paymentStatus: text('payment_status').default('paid').notNull(), // 'paid', 'unpaid', 'refunded'
  orderStatus: text('order_status').default('open').notNull(), // 'open', 'preparing', 'ready', 'completed', 'cancelled'
  kitchenStatus: text('kitchen_status').default('pending').notNull(), // 'pending', 'cooking', 'ready', 'served'
  barStatus: text('bar_status').default('pending').notNull(), // 'pending', 'brewing', 'ready', 'served'
  staffName: text('staff_name'),
  shiftId: text('shift_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ORDER ITEMS
export const orderItems = fnbSchema.table('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id),
  name: text('name').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  qty: integer('qty').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  isKitchenItem: boolean('is_kitchen_item').default(false).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
})

// INVENTORY MOVEMENTS (AUDIT TRAIL)
export const inventoryMovements = fnbSchema.table('inventory_movements', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  outletId: text('outlet_id').notNull().references(() => outlets.id),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  type: text('type').notNull(), // 'in', 'out', 'adjustment', 'transfer_in', 'transfer_out'
  qty: numeric('qty', { precision: 12, scale: 3 }).notNull(),
  unitCostAtTime: numeric('unit_cost_at_time', { precision: 12, scale: 2 }).default('0').notNull(),
  balanceAfter: numeric('balance_after', { precision: 12, scale: 3 }).notNull(),
  reason: text('reason').notNull(),
  refType: text('ref_type'),
  refId: text('ref_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// CHART OF ACCOUNTS (SAK EMKM)
export const accounts = fnbSchema.table('accounts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  normalBalance: text('normal_balance').notNull(),
  balance: numeric('balance', { precision: 14, scale: 2 }).default('0').notNull(),
})

// JOURNAL ENTRIES (DOUBLE-ENTRY GENERAL LEDGER)
export const journals = fnbSchema.table('journals', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  outletId: text('outlet_id').references(() => outlets.id),
  journalNumber: text('journal_number').notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  refType: text('ref_type').notNull(),
  refId: text('ref_id'),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  lines: jsonb('lines').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// REALTIME EVENTS BUS & AUDIT DISPATCH
export const events = fnbSchema.table('events', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  outletId: text('outlet_id').notNull().references(() => outlets.id),
  topic: text('topic').notNull(), // 'order_created', 'order_status_updated', 'stock_deducted'
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
