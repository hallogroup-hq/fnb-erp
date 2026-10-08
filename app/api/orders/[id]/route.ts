import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { eventBus } from '@/lib/realtime/eventBus'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      orderStatus,
      kitchenStatus,
      barStatus,
      completedItemIds = [],
    } = body

    // 1. Fetch existing order
    const existingOrders = await sql`SELECT * FROM fnb.orders WHERE id = ${id} LIMIT 1;`
    if (existingOrders.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    const order = existingOrders[0]

    // 2. Update order status
    await sql`
      UPDATE fnb.orders
      SET 
        order_status = COALESCE(${orderStatus || null}, order_status),
        kitchen_status = COALESCE(${kitchenStatus || null}, kitchen_status),
        bar_status = COALESCE(${barStatus || null}, bar_status),
        updated_at = NOW()
      WHERE id = ${id};
    `

    // 3. Update completed items if provided
    if (completedItemIds.length > 0) {
      for (const itemId of completedItemIds) {
        await sql`
          UPDATE fnb.order_items
          SET is_completed = true
          WHERE id = ${itemId};
        `
      }
    }

    // 4. If order completed/cancelled, free table
    if ((orderStatus === 'completed' || orderStatus === 'cancelled') && order.table_id) {
      await sql`
        UPDATE fnb.tables
        SET status = 'available', current_order_id = NULL
        WHERE id = ${order.table_id};
      `
    }

    // 5. Construct payload & broadcast event
    const payload = {
      orderId: id,
      orderStatus: orderStatus || order.order_status,
      kitchenStatus: kitchenStatus || order.kitchen_status,
      barStatus: barStatus || order.bar_status,
      completedItemIds,
      updatedAt: new Date().toISOString(),
    }

    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    await sql`
      INSERT INTO fnb.events (id, tenant_id, outlet_id, topic, payload)
      VALUES (${eventId}, ${order.tenant_id}, ${order.outlet_id}, 'order_status_updated', ${JSON.stringify(payload)}::jsonb);
    `

    eventBus.broadcast(order.outlet_id, {
      id: eventId,
      topic: 'order_status_updated',
      payload,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, updated: payload })
  } catch (err: any) {
    console.error('[API Orders PATCH] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
