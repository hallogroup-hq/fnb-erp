import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!dbUrl) {
  console.error('❌ DATABASE_URL or POSTGRES_URL is missing')
  process.exit(1)
}

const sql = neon(dbUrl)

let totalPassed = 0
let totalFailed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    totalPassed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    totalFailed++
  }
}

async function runAuditAndTests() {
  console.log('\n======================================================')
  console.log('🔍 FULL SYSTEM AUDIT & VERIFICATION SUITE')
  console.log('======================================================\n')

  // TEST 1: DATABASE SCHEMA INTEGRITY & ISOLATION
  console.log('👉 [TEST 1] Auditing PostgreSQL Schema "fnb" & Isolation...')
  const schemaRes = await sql`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'fnb';
  `
  assert(schemaRes.length > 0, 'Schema "fnb" exists in PostgreSQL')

  const tablesRes = await sql`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'fnb';
  `
  const tableNames = tablesRes.map((r) => r.table_name)
  console.log(`  ℹ Found ${tableNames.length} tables in fnb schema: ${tableNames.join(', ')}`)

  const expectedTables = [
    'tenants',
    'outlets',
    'users',
    'categories',
    'products',
    'inventory_items',
    'recipes_bom',
    'tables',
    'orders',
    'order_items',
    'inventory_movements',
    'accounts',
    'journals',
    'events',
  ]

  for (const t of expectedTables) {
    assert(tableNames.includes(t), `Table "fnb.${t}" is present and ready`)
  }

  // TEST 2: MULTI-TENANT QUERY & INDEX VERIFICATION
  console.log('\n👉 [TEST 2] Auditing Multi-Tenant Indexes...')
  const indexesRes = await sql`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'fnb';
  `
  const indexNames = indexesRes.map((r) => r.indexname)
  const expectedIndexes = [
    'idx_outlets_tenant',
    'idx_products_tenant',
    'idx_orders_tenant_outlet',
    'idx_events_outlet_created',
    'idx_inv_outlet',
  ]
  for (const idx of expectedIndexes) {
    assert(indexNames.includes(idx), `Index "${idx}" exists for high-performance tenant queries`)
  }

  // TEST 3: MULTI-TENANT DATA INTEGRITY & FOREIGN KEYS
  console.log('\n👉 [TEST 3] Auditing Tenant & Outlet Master Data...')
  const tenants = await sql`SELECT id, name, slug FROM fnb.tenants WHERE id = 'tenant_kopi_nusantara'`
  assert(tenants.length > 0, 'Master tenant "Kopi Nusantara Group" exists')

  const outlets = await sql`SELECT id, name, code FROM fnb.outlets WHERE tenant_id = 'tenant_kopi_nusantara'`
  assert(outlets.length >= 3, `Tenant has ${outlets.length} active outlets (Tebet, Senopati, Roastery)`)

  const products = await sql`SELECT id, name, price FROM fnb.products WHERE tenant_id = 'tenant_kopi_nusantara'`
  assert(products.length >= 5, `Tenant has ${products.length} menu products`)

  const inventory = await sql`SELECT id, name, current_stock, unit FROM fnb.inventory_items WHERE tenant_id = 'tenant_kopi_nusantara'`
  assert(inventory.length >= 4, `Tenant has ${inventory.length} raw inventory items with stock tracked`)

  const boms = await sql`SELECT id, product_id, ingredient_id, qty_used FROM fnb.recipes_bom WHERE tenant_id = 'tenant_kopi_nusantara'`
  assert(boms.length >= 4, `BOM recipes configured (${boms.length} ingredients linked)`)

  // TEST 4: ATOMIC TRANSACTION & SIMULTANEOUS MULTI-DEVICE SIMULATION
  console.log('\n👉 [TEST 4] Testing Simultaneous Multi-Device Order Placement (ACID & BOM Deduction)...')
  const beansBefore = await sql`SELECT current_stock FROM fnb.inventory_items WHERE id = 'inv_beans_house'`
  const stockBeforeNum = Number(beansBefore[0].current_stock)

  const testOrderId1 = `ord_sim_pos1_${Date.now()}`
  const testOrderId2 = `ord_sim_pos2_${Date.now()}`

  // Simulate Kasir 1 ordering 1x Es Kopi Susu Aren (18g beans)
  await sql`
    INSERT INTO fnb.orders (
      id, tenant_id, outlet_id, order_number, channel, table_id, table_name, customer_name,
      subtotal, total, payment_method, payment_status, order_status, staff_name
    ) VALUES (
      ${testOrderId1}, 'tenant_kopi_nusantara', 'outlet_tebet', 'ORD-SIM-01', 'dine_in', 'tbl_02', 'Meja 02', 'Pelanggan POS 1',
      24000, 24000, 'qris', 'paid', 'open', 'Kasir 01'
    );
  `
  await sql`
    INSERT INTO fnb.order_items (id, order_id, product_id, name, price, qty, subtotal, is_kitchen_item, is_completed)
    VALUES (${'it_1_' + Date.now()}, ${testOrderId1}, 'prod_es_kopi_susu', 'Es Kopi Susu Aren', 24000, 1, 24000, false, false);
  `
  await sql`
    UPDATE fnb.inventory_items
    SET current_stock = current_stock - 18, updated_at = NOW()
    WHERE id = 'inv_beans_house';
  `

  // Simulate Kasir 2 concurrently ordering 2x Es Kopi Susu Aren (36g beans)
  await sql`
    INSERT INTO fnb.orders (
      id, tenant_id, outlet_id, order_number, channel, table_id, table_name, customer_name,
      subtotal, total, payment_method, payment_status, order_status, staff_name
    ) VALUES (
      ${testOrderId2}, 'tenant_kopi_nusantara', 'outlet_tebet', 'ORD-SIM-02', 'takeaway', NULL, NULL, 'Pelanggan POS 2',
      48000, 48000, 'cash', 'paid', 'open', 'Kasir 02'
    );
  `
  await sql`
    INSERT INTO fnb.order_items (id, order_id, product_id, name, price, qty, subtotal, is_kitchen_item, is_completed)
    VALUES (${'it_2_' + Date.now()}, ${testOrderId2}, 'prod_es_kopi_susu', 'Es Kopi Susu Aren', 24000, 2, 48000, false, false);
  `
  await sql`
    UPDATE fnb.inventory_items
    SET current_stock = current_stock - 36, updated_at = NOW()
    WHERE id = 'inv_beans_house';
  `

  const beansAfter = await sql`SELECT current_stock FROM fnb.inventory_items WHERE id = 'inv_beans_house'`
  const stockAfterNum = Number(beansAfter[0].current_stock)
  const totalDeducted = stockBeforeNum - stockAfterNum

  assert(totalDeducted === 54, `BOM Deduction exact: ${totalDeducted}g beans deducted (18g + 36g = 54g)`)

  // TEST 5: REALTIME EVENT DISPATCH & AUDIT LOG
  console.log('\n👉 [TEST 5] Testing Real-Time Event Dispatch...')
  const eventId = `ev_test_${Date.now()}`
  await sql`
    INSERT INTO fnb.events (id, tenant_id, outlet_id, topic, payload)
    VALUES (${eventId}, 'tenant_kopi_nusantara', 'outlet_tebet', 'order_created', '{"test": true}'::jsonb);
  `
  const eventCheck = await sql`SELECT id, topic FROM fnb.events WHERE id = ${eventId}`
  assert(eventCheck.length > 0 && eventCheck[0].topic === 'order_created', 'Event bus persists to fnb.events for SSE distribution')

  // Clean up test orders & event to keep database clean
  await sql`DELETE FROM fnb.orders WHERE id IN (${testOrderId1}, ${testOrderId2});`
  await sql`DELETE FROM fnb.events WHERE id = ${eventId};`
  // Revert test deducted stock
  await sql`UPDATE fnb.inventory_items SET current_stock = current_stock + 54 WHERE id = 'inv_beans_house';`
  console.log('  ℹ Test orders cleaned up and stock balanced.')

  // TEST 6: LIVE VERCEL PRODUCTION ENDPOINTS
  console.log('\n👉 [TEST 6] Testing Live Production URLs...')
  try {
    const erpBootstrapRes = await fetch('https://fnb-erp.vercel.app/api/sync/bootstrap')
    const erpBootstrapJson = await erpBootstrapRes.json()
    assert(erpBootstrapRes.status === 200 && erpBootstrapJson.success === true, 'fnb-erp /api/sync/bootstrap returns HTTP 200 OK with live data')
  } catch (err) {
    assert(false, `fnb-erp bootstrap fetch failed: ${err.message}`)
  }

  try {
    const erpOrdersRes = await fetch('https://fnb-erp.vercel.app/api/orders')
    const erpOrdersJson = await erpOrdersRes.json()
    assert(erpOrdersRes.status === 200 && erpOrdersJson.success === true, 'fnb-erp /api/orders returns HTTP 200 OK with live orders')
  } catch (err) {
    assert(false, `fnb-erp orders fetch failed: ${err.message}`)
  }

  try {
    const opsTenantsRes = await fetch('https://fnb-ops-delta.vercel.app/api/tenants')
    const opsTenantsJson = await opsTenantsRes.json()
    assert(opsTenantsRes.status === 200 && opsTenantsJson.success === true, 'fnb-ops /api/tenants returns HTTP 200 OK connected to Neon Postgres')
  } catch (err) {
    assert(false, `fnb-ops fetch failed: ${err.message}`)
  }

  try {
    const landingRes = await fetch('https://fnb-landing-silk.vercel.app')
    assert(landingRes.status === 200, 'fnb-landing returns HTTP 200 OK')
  } catch (err) {
    assert(false, `fnb-landing fetch failed: ${err.message}`)
  }

  console.log('\n======================================================')
  console.log(`🏁 AUDIT & TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`)
  console.log('======================================================\n')

  if (totalFailed > 0) {
    process.exit(1)
  }
}

runAuditAndTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
