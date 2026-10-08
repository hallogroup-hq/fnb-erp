import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'tenant_kopi_nusantara'
    const outletId = searchParams.get('outletId') || 'outlet_tebet'

    // Fetch tenant
    const tenants = await sql`SELECT * FROM fnb.tenants WHERE id = ${tenantId} LIMIT 1;`
    const tenant = tenants[0] || null

    // Fetch outlets
    const outlets = await sql`
      SELECT 
        id, tenant_id as "tenantId", name, code, address, phone,
        is_central_hub as "isCentralHub", table_count as "tableCount",
        is_active as "isActive", receipt_config as "receiptConfig"
      FROM fnb.outlets
      WHERE tenant_id = ${tenantId};
    `

    // Fetch categories
    const categories = await sql`
      SELECT id, tenant_id as "tenantId", name, sort_order as "sortOrder"
      FROM fnb.categories
      WHERE tenant_id = ${tenantId}
      ORDER BY sort_order ASC;
    `

    // Fetch products
    const products = await sql`
      SELECT 
        id, tenant_id as "tenantId", category_id as "categoryId",
        name, price::float, cost_price::float as "costPrice",
        emoji, description, is_kitchen_item as "isKitchenItem", active
      FROM fnb.products
      WHERE tenant_id = ${tenantId} AND active = true;
    `

    // Fetch inventory
    const inventory = await sql`
      SELECT 
        id, tenant_id as "tenantId", outlet_id as "outletId",
        code, name, category, unit,
        current_stock::float as "currentStock",
        min_stock::float as "minStock",
        unit_cost::float as "unitCost"
      FROM fnb.inventory_items
      WHERE tenant_id = ${tenantId} AND (outlet_id = ${outletId} OR outlet_id IS NULL);
    `

    // Fetch tables
    const tables = await sql`
      SELECT 
        id, tenant_id as "tenantId", outlet_id as "outletId",
        name, section, capacity, status, current_order_id as "currentOrderId"
      FROM fnb.tables
      WHERE outlet_id = ${outletId};
    `

    // Fetch recent active orders
    const orders = await sql`
      SELECT 
        o.id,
        o.tenant_id as "tenantId",
        o.outlet_id as "outletId",
        o.order_number as "orderNumber",
        o.channel,
        o.table_id as "tableId",
        o.table_name as "tableName",
        o.customer_name as "customerName",
        o.notes,
        o.subtotal::float as subtotal,
        o.discount_amount::float as "discountAmount",
        o.tax_amount::float as "taxAmount",
        o.service_charge_amount::float as "serviceChargeAmount",
        o.total::float as total,
        o.payment_method as "paymentMethod",
        o.payment_status as "paymentStatus",
        o.order_status as "orderStatus",
        o.kitchen_status as "kitchenStatus",
        o.bar_status as "barStatus",
        o.staff_name as "staffName",
        o.created_at as "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi.product_id,
              'name', oi.name,
              'price', oi.price::float,
              'qty', oi.qty,
              'subtotal', oi.subtotal::float,
              'notes', oi.notes,
              'isKitchenItem', oi.is_kitchen_item,
              'isCompleted', oi.is_completed
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM fnb.orders o
      LEFT JOIN fnb.order_items oi ON oi.order_id = o.id
      WHERE o.outlet_id = ${outletId}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50;
    `

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        outlets,
        categories,
        products,
        inventory,
        tables,
        orders,
      },
    })
  } catch (err: any) {
    console.error('[API Bootstrap GET] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
