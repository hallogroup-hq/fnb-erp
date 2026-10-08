import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { eventBus } from '@/lib/realtime/eventBus'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const outletId = searchParams.get('outletId') || 'outlet_tebet'
    const status = searchParams.get('status')

    let query = sql`
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi.product_id,
              'name', oi.name,
              'price', oi.price,
              'qty', oi.qty,
              'subtotal', oi.subtotal,
              'notes', oi.notes,
              'isKitchenItem', oi.is_kitchen_item,
              'isCompleted', oi.is_completed
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM fnb.orders o
      LEFT JOIN fnb.order_items oi ON oi.order_id = o.id
      WHERE o.outlet_id = ${outletId}
    `

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
      LIMIT 100;
    `

    return NextResponse.json({ success: true, orders })
  } catch (err: any) {
    console.error('[API Orders GET] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      tenantId = 'tenant_kopi_nusantara',
      outletId = 'outlet_tebet',
      orderNumber,
      channel = 'dine_in',
      tableId,
      tableName,
      customerName = 'Tamu',
      notes = '',
      items = [],
      subtotal = 0,
      discountAmount = 0,
      taxAmount = 0,
      serviceChargeAmount = 0,
      total = 0,
      paymentMethod = 'cash',
      paymentStatus = 'paid',
      staffName = 'Kasir 01',
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Order must contain items' }, { status: 400 })
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const finalOrderNumber = orderNumber || `ORD-${Date.now().toString().slice(-4)}`

    // 1. Insert Order into fnb.orders
    await sql`
      INSERT INTO fnb.orders (
        id, tenant_id, outlet_id, order_number, channel,
        table_id, table_name, customer_name, notes,
        subtotal, discount_amount, tax_amount, service_charge_amount, total,
        payment_method, payment_status, order_status, kitchen_status, bar_status,
        staff_name
      ) VALUES (
        ${orderId}, ${tenantId}, ${outletId}, ${finalOrderNumber}, ${channel},
        ${tableId || null}, ${tableName || null}, ${customerName}, ${notes},
        ${subtotal}, ${discountAmount}, ${taxAmount}, ${serviceChargeAmount}, ${total},
        ${paymentMethod}, ${paymentStatus}, 'open', 'pending', 'pending',
        ${staffName}
      );
    `

    // 2. Insert Order Items into fnb.order_items & calculate kitchen/bar flag
    const insertedItems: any[] = []
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const isKitchen = Boolean(item.isKitchenItem)
      await sql`
        INSERT INTO fnb.order_items (
          id, order_id, product_id, name, price, qty, subtotal, notes, is_kitchen_item, is_completed
        ) VALUES (
          ${itemId}, ${orderId}, ${item.productId || null}, ${item.name},
          ${item.price}, ${item.qty}, ${item.subtotal || item.price * item.qty},
          ${item.notes || ''}, ${isKitchen}, false
        );
      `
      insertedItems.push({
        id: itemId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.subtotal || item.price * item.qty,
        notes: item.notes || '',
        isKitchenItem: isKitchen,
        isCompleted: false,
      })

      // 3. BOM Inventory Deduction
      if (item.productId) {
        const boms = await sql`
          SELECT ingredient_id, qty_used, unit 
          FROM fnb.recipes_bom 
          WHERE product_id = ${item.productId};
        `

        for (const bom of boms) {
          const deductQty = Number(bom.qty_used) * Number(item.qty)
          
          // Deduct inventory
          await sql`
            UPDATE fnb.inventory_items
            SET current_stock = current_stock - ${deductQty},
                updated_at = NOW()
            WHERE id = ${bom.ingredient_id};
          `

          // Log movement
          await sql`
            INSERT INTO fnb.inventory_movements (
              id, tenant_id, outlet_id, item_id, type, qty, balance_after, reason, ref_type, ref_id
            )
            SELECT 
              ${'mvt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)},
              ${tenantId}, ${outletId}, ${bom.ingredient_id}, 'out',
              ${deductQty}, current_stock, ${'Penjualan Order ' + finalOrderNumber}, 'pos_sale', ${orderId}
            FROM fnb.inventory_items
            WHERE id = ${bom.ingredient_id};
          `
        }
      }
    }

    // 4. Update Table Status if Dine-in
    if (tableId) {
      await sql`
        UPDATE fnb.tables
        SET status = 'occupied', current_order_id = ${orderId}
        WHERE id = ${tableId};
      `
    }

    // 5. Construct full order payload
    const fullOrder = {
      id: orderId,
      tenantId,
      outletId,
      orderNumber: finalOrderNumber,
      channel,
      tableId,
      tableName,
      customerName,
      notes,
      subtotal,
      discountAmount,
      taxAmount,
      serviceChargeAmount,
      total,
      paymentMethod,
      paymentStatus,
      orderStatus: 'open',
      kitchenStatus: 'pending',
      barStatus: 'pending',
      staffName,
      items: insertedItems,
      createdAt: new Date().toISOString(),
    }

    // 6. Persist Real-Time Event in Postgres
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    await sql`
      INSERT INTO fnb.events (id, tenant_id, outlet_id, topic, payload)
      VALUES (${eventId}, ${tenantId}, ${outletId}, 'order_created', ${JSON.stringify(fullOrder)}::jsonb);
    `

    // 7. Instant Broadcast to all connected devices (Kasir, KDS Kitchen, KDS Barista)
    eventBus.broadcast(outletId, {
      id: eventId,
      topic: 'order_created',
      payload: fullOrder,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, order: fullOrder })
  } catch (err: any) {
    console.error('[API Orders POST] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
