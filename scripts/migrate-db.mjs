import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!dbUrl) {
  console.error('DATABASE_URL or POSTGRES_URL is missing in .env.local')
  process.exit(1)
}

const sql = neon(dbUrl)

async function migrate() {
  console.log('🚀 Starting F&B Multi-Tenant Database Migration...')

  // 1. Create dedicated schema 'fnb' to isolate from other apps
  console.log('📦 Creating schema "fnb" if not exists...')
  await sql`CREATE SCHEMA IF NOT EXISTS fnb;`

  // 2. Create tables in 'fnb' schema
  console.log('📦 Creating table "fnb.tenants"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      legal_name TEXT,
      slug TEXT NOT NULL UNIQUE,
      phone TEXT,
      email TEXT,
      address TEXT,
      subscription_tier TEXT NOT NULL DEFAULT 'pro',
      status TEXT NOT NULL DEFAULT 'active',
      modules JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.outlets"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.outlets (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      is_central_hub BOOLEAN NOT NULL DEFAULT FALSE,
      table_count INT NOT NULL DEFAULT 10,
      receipt_config JSONB,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.users"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      outlet_id TEXT REFERENCES fnb.outlets(id),
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'cashier',
      pin TEXT NOT NULL DEFAULT '1234',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.categories"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.categories (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    );
  `

  console.log('📦 Creating table "fnb.products"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.products (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES fnb.categories(id),
      name TEXT NOT NULL,
      price NUMERIC(12, 2) NOT NULL,
      cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      emoji TEXT,
      description TEXT,
      is_kitchen_item BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.inventory_items"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.inventory_items (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      outlet_id TEXT REFERENCES fnb.outlets(id),
      code TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
      min_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
      unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.recipes_bom"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.recipes_bom (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES fnb.products(id) ON DELETE CASCADE,
      ingredient_id TEXT NOT NULL REFERENCES fnb.inventory_items(id),
      qty_used NUMERIC(12, 3) NOT NULL,
      unit TEXT NOT NULL
    );
  `

  console.log('📦 Creating table "fnb.tables"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.tables (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      outlet_id TEXT NOT NULL REFERENCES fnb.outlets(id),
      name TEXT NOT NULL,
      section TEXT NOT NULL DEFAULT 'Indoor',
      capacity INT NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'available',
      current_order_id TEXT
    );
  `

  console.log('📦 Creating table "fnb.orders"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id) ON DELETE CASCADE,
      outlet_id TEXT NOT NULL REFERENCES fnb.outlets(id),
      order_number TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'dine_in',
      table_id TEXT,
      table_name TEXT,
      customer_name TEXT,
      notes TEXT,
      subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
      discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      service_charge_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      payment_status TEXT NOT NULL DEFAULT 'paid',
      order_status TEXT NOT NULL DEFAULT 'open',
      kitchen_status TEXT NOT NULL DEFAULT 'pending',
      bar_status TEXT NOT NULL DEFAULT 'pending',
      staff_name TEXT,
      shift_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.order_items"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES fnb.orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES fnb.products(id),
      name TEXT NOT NULL,
      price NUMERIC(12, 2) NOT NULL,
      qty INT NOT NULL,
      subtotal NUMERIC(12, 2) NOT NULL,
      notes TEXT,
      is_kitchen_item BOOLEAN NOT NULL DEFAULT FALSE,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `

  console.log('📦 Creating table "fnb.inventory_movements"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.inventory_movements (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id),
      outlet_id TEXT NOT NULL REFERENCES fnb.outlets(id),
      item_id TEXT NOT NULL REFERENCES fnb.inventory_items(id),
      type TEXT NOT NULL,
      qty NUMERIC(12, 3) NOT NULL,
      unit_cost_at_time NUMERIC(12, 2) NOT NULL DEFAULT 0,
      balance_after NUMERIC(12, 3) NOT NULL,
      reason TEXT NOT NULL,
      ref_type TEXT,
      ref_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.accounts"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.accounts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      normal_balance TEXT NOT NULL,
      balance NUMERIC(14, 2) NOT NULL DEFAULT 0
    );
  `

  console.log('📦 Creating table "fnb.journals"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.journals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id),
      outlet_id TEXT REFERENCES fnb.outlets(id),
      journal_number TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ref_type TEXT NOT NULL,
      ref_id TEXT,
      description TEXT NOT NULL,
      total_amount NUMERIC(14, 2) NOT NULL,
      lines JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  console.log('📦 Creating table "fnb.events"...')
  await sql`
    CREATE TABLE IF NOT EXISTS fnb.events (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES fnb.tenants(id),
      outlet_id TEXT NOT NULL REFERENCES fnb.outlets(id),
      topic TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  // Indexes for high performance multi-tenant queries
  console.log('⚡ Creating multi-tenant query indexes...')
  await sql`CREATE INDEX IF NOT EXISTS idx_outlets_tenant ON fnb.outlets(tenant_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_products_tenant ON fnb.products(tenant_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_tenant_outlet ON fnb.orders(tenant_id, outlet_id, created_at DESC);`
  await sql`CREATE INDEX IF NOT EXISTS idx_events_outlet_created ON fnb.events(outlet_id, created_at DESC);`
  await sql`CREATE INDEX IF NOT EXISTS idx_inv_outlet ON fnb.inventory_items(tenant_id, outlet_id);`

  console.log('🌱 Seeding initial primary tenant & master data if empty...')
  
  // Seed initial tenant
  const existingTenants = await sql`SELECT id FROM fnb.tenants WHERE id = 'tenant_kopi_nusantara'`
  if (existingTenants.length === 0) {
    await sql`
      INSERT INTO fnb.tenants (id, name, legal_name, slug, phone, subscription_tier, status, modules)
      VALUES (
        'tenant_kopi_nusantara',
        'Kopi Nusantara Group',
        'PT Kopi Nusantara Bersaudara',
        'kopi-nusantara',
        '+6281299887766',
        'enterprise',
        'active',
        '{"pos_quick_service": true, "pos_dine_in_tables": true, "kitchen_routing_kds": true, "inventory_recipes_hpp": true, "accurate_grade_accounting": true}'::jsonb
      );
    `
    console.log('  ✓ Seeded Tenant: Kopi Nusantara Group')

    // Seed Outlets
    await sql`
      INSERT INTO fnb.outlets (id, tenant_id, name, code, address, phone, is_central_hub, table_count)
      VALUES 
        ('outlet_tebet', 'tenant_kopi_nusantara', 'Cabang Tebet Flagship', 'TBT-01', 'Jl. Tebet Raya No. 42, Jakarta Selatan', '081211112222', false, 16),
        ('outlet_senopati', 'tenant_kopi_nusantara', 'Cabang Senopati Reserve', 'SNP-02', 'Jl. Senopati No. 88, Jakarta Selatan', '081233334444', false, 20),
        ('outlet_roastery', 'tenant_kopi_nusantara', 'Central Roastery & Commissary', 'ROAST-00', 'Kawasan Industri Pulogadung Blok C3', '081255556666', true, 0);
    `
    console.log('  ✓ Seeded Outlets: Tebet, Senopati, Roastery Central')

    // Seed Categories
    await sql`
      INSERT INTO fnb.categories (id, tenant_id, name, sort_order)
      VALUES 
        ('cat_coffee', 'tenant_kopi_nusantara', 'Coffee & Espresso', 1),
        ('cat_non_coffee', 'tenant_kopi_nusantara', 'Non-Coffee & Tea', 2),
        ('cat_mains', 'tenant_kopi_nusantara', 'Main Kitchen', 3),
        ('cat_pastry', 'tenant_kopi_nusantara', 'Bakery & Pastry', 4);
    `
    console.log('  ✓ Seeded Categories')

    // Seed Products
    await sql`
      INSERT INTO fnb.products (id, tenant_id, category_id, name, price, cost_price, emoji, is_kitchen_item)
      VALUES
        ('prod_es_kopi_susu', 'tenant_kopi_nusantara', 'cat_coffee', 'Es Kopi Susu Aren', 24000, 6800, '☕', false),
        ('prod_americano', 'tenant_kopi_nusantara', 'cat_coffee', 'Americano / Long Black', 22000, 4200, '☕', false),
        ('prod_magic_latte', 'tenant_kopi_nusantara', 'cat_coffee', 'Melbourne Magic Latte', 32000, 8500, '☕', false),
        ('prod_matcha_latte', 'tenant_kopi_nusantara', 'cat_non_coffee', 'Kyoto Matcha Latte', 28000, 8000, '🍵', false),
        ('prod_nasi_goreng', 'tenant_kopi_nusantara', 'cat_mains', 'Nasi Goreng Sei Sapi', 45000, 16500, '🍛', true),
        ('prod_mie_godog', 'tenant_kopi_nusantara', 'cat_mains', 'Mie Godog Jawa Spesial', 38000, 13000, '🍜', true),
        ('prod_croissant', 'tenant_kopi_nusantara', 'cat_pastry', 'Butter Croissant Artisanal', 26000, 9500, '🥐', true);
    `
    console.log('  ✓ Seeded Products')

    // Seed Inventory Items
    await sql`
      INSERT INTO fnb.inventory_items (id, tenant_id, outlet_id, code, name, category, unit, current_stock, min_stock, unit_cost)
      VALUES
        ('inv_beans_house', 'tenant_kopi_nusantara', 'outlet_tebet', 'RAW-001', 'House Blend Espresso Beans', 'beans_roasted', 'gram', 24500, 5000, 220),
        ('inv_susu_fresh', 'tenant_kopi_nusantara', 'outlet_tebet', 'RAW-002', 'Fresh Milk Diamond Barista', 'dairy', 'ml', 48000, 10000, 19),
        ('inv_gula_aren', 'tenant_kopi_nusantara', 'outlet_tebet', 'RAW-003', 'Sirup Gula Aren Cair Organik', 'syrup', 'ml', 12500, 3000, 35),
        ('inv_cup_takeaway', 'tenant_kopi_nusantara', 'outlet_tebet', 'PKG-001', 'Cup 16oz PP Injection + Lid', 'packaging', 'pcs', 1450, 300, 750),
        ('inv_sei_sapi', 'tenant_kopi_nusantara', 'outlet_tebet', 'RAW-010', 'Sei Sapi Asap Kupang Portion', 'meat_poultry', 'gram', 8500, 2000, 140);
    `
    console.log('  ✓ Seeded Inventory Items')

    // Seed BOM Recipes
    await sql`
      INSERT INTO fnb.recipes_bom (id, tenant_id, product_id, ingredient_id, qty_used, unit)
      VALUES
        ('bom_kopsus_beans', 'tenant_kopi_nusantara', 'prod_es_kopi_susu', 'inv_beans_house', 18, 'gram'),
        ('bom_kopsus_milk', 'tenant_kopi_nusantara', 'prod_es_kopi_susu', 'inv_susu_fresh', 120, 'ml'),
        ('bom_kopsus_aren', 'tenant_kopi_nusantara', 'prod_es_kopi_susu', 'inv_gula_aren', 25, 'ml'),
        ('bom_kopsus_cup', 'tenant_kopi_nusantara', 'prod_es_kopi_susu', 'inv_cup_takeaway', 1, 'pcs');
    `
    console.log('  ✓ Seeded BOM Recipes')

    // Seed Tables
    await sql`
      INSERT INTO fnb.tables (id, tenant_id, outlet_id, name, section, capacity, status)
      VALUES
        ('tbl_01', 'tenant_kopi_nusantara', 'outlet_tebet', 'Meja 01', 'Indoor AC', 4, 'available'),
        ('tbl_02', 'tenant_kopi_nusantara', 'outlet_tebet', 'Meja 02', 'Indoor AC', 2, 'available'),
        ('tbl_03', 'tenant_kopi_nusantara', 'outlet_tebet', 'Meja 03', 'Indoor AC', 4, 'available'),
        ('tbl_04', 'tenant_kopi_nusantara', 'outlet_tebet', 'Meja 04', 'Outdoor Smoking', 4, 'available'),
        ('tbl_05', 'tenant_kopi_nusantara', 'outlet_tebet', 'Meja 05', 'Outdoor Smoking', 6, 'available'),
        ('tbl_vip', 'tenant_kopi_nusantara', 'outlet_tebet', 'VIP Room', 'VIP', 10, 'available');
    `
    console.log('  ✓ Seeded Dine-in Tables')
  } else {
    console.log('  ℹ Tenant data already exists, skipping initial seed.')
  }

  console.log('✅ F&B Multi-Tenant Database Migration COMPLETED SUCCESSFULLY!')
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
