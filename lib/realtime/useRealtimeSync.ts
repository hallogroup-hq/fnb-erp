'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export type CloudSyncStatus = 'connected' | 'connecting' | 'disconnected'

interface UseRealtimeSyncProps {
  outletId: string
  onOrderCreated?: (order: any) => void
  onOrderStatusUpdated?: (update: { orderId: string; orderStatus?: string; kitchenStatus?: string; barStatus?: string }) => void
}

export function useRealtimeSync({
  outletId,
  onOrderCreated,
  onOrderStatusUpdated,
}: UseRealtimeSyncProps) {
  const [status, setStatus] = useState<CloudSyncStatus>('connecting')
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    if (esRef.current) {
      esRef.current.close()
    }

    setStatus('connecting')

    try {
      const targetOutlet = outletId || 'outlet_tebet'
      const es = new EventSource(`/api/realtime/events?outletId=${encodeURIComponent(targetOutlet)}`)
      esRef.current = es

      es.onopen = () => {
        setStatus('connected')
        setLastSyncTime(Date.now())
      }

      es.addEventListener('connected', () => {
        setStatus('connected')
        setLastSyncTime(Date.now())
      })

      es.addEventListener('order_created', (e) => {
        try {
          const data = JSON.parse(e.data)
          const order = data.payload || data
          if (onOrderCreated) {
            onOrderCreated(order)
          }
          setLastSyncTime(Date.now())
        } catch (err) {
          console.error('[RealtimeSync] Failed to parse order_created:', err)
        }
      })

      es.addEventListener('order_status_updated', (e) => {
        try {
          const data = JSON.parse(e.data)
          const update = data.payload || data
          if (onOrderStatusUpdated) {
            onOrderStatusUpdated(update)
          }
          setLastSyncTime(Date.now())
        } catch (err) {
          console.error('[RealtimeSync] Failed to parse order_status_updated:', err)
        }
      })

      es.onerror = () => {
        setStatus('disconnected')
        es.close()
        // Retry connection after 3 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }
    } catch (err) {
      console.error('[RealtimeSync] Connection failed:', err)
      setStatus('disconnected')
    }
  }, [outletId, onOrderCreated, onOrderStatusUpdated])

  useEffect(() => {
    connect()

    return () => {
      if (esRef.current) esRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connect])

  // Helper to send order directly to Neon Postgres
  const createOrderCloud = async (orderPayload: any) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      const json = await res.json()
      if (json.success) {
        setLastSyncTime(Date.now())
        return json.order
      } else {
        throw new Error(json.error || 'Failed to save order to cloud')
      }
    } catch (err) {
      console.error('[RealtimeSync] createOrderCloud error:', err)
      throw err
    }
  }

  // Helper to patch order status directly in Neon Postgres
  const updateOrderCloud = async (orderId: string, patchPayload: any) => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      })
      const json = await res.json()
      if (json.success) {
        setLastSyncTime(Date.now())
        return json.updated
      }
    } catch (err) {
      console.error('[RealtimeSync] updateOrderCloud error:', err)
    }
  }

  return {
    status,
    lastSyncTime,
    createOrderCloud,
    updateOrderCloud,
    reconnect: connect,
  }
}
