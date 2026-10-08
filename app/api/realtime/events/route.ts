import { NextRequest } from 'next/server'
import { eventBus } from '@/lib/realtime/eventBus'
import { sql } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const outletId = searchParams.get('outletId') || 'outlet_tebet'

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ outletId, time: Date.now() })}\n\n`)
      )

      // 2. Subscribe to instantaneous in-memory bus
      const unsubscribe = eventBus.subscribe(outletId, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.topic}\ndata: ${JSON.stringify(event)}\n\n`)
          )
        } catch (err) {
          console.error('[SSE] Failed to enqueue event:', err)
        }
      })

      // 3. Heartbeat & DB polling fallback every 5 seconds to ensure cross-serverless synchronization
      let lastCheckedTime = new Date(Date.now() - 5000).toISOString()
      const interval = setInterval(async () => {
        try {
          // Heartbeat ping
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`))

          // Check DB for any events from other serverless instances
          const dbEvents = await sql`
            SELECT id, topic, payload, created_at
            FROM fnb.events
            WHERE outlet_id = ${outletId} AND created_at > ${lastCheckedTime}
            ORDER BY created_at ASC
            LIMIT 20;
          `

          if (dbEvents.length > 0) {
            for (const ev of dbEvents) {
              controller.enqueue(
                encoder.encode(`event: ${ev.topic}\ndata: ${JSON.stringify({
                  id: ev.id,
                  topic: ev.topic,
                  payload: ev.payload,
                  createdAt: ev.created_at
                })}\n\n`)
              )
            }
            lastCheckedTime = new Date().toISOString()
          }
        } catch (err) {
          // If stream closed, clear interval
          clearInterval(interval)
          unsubscribe()
        }
      }, 5000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        unsubscribe()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
