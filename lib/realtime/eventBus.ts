type Listener = (event: { id: string; topic: string; payload: any; createdAt: string }) => void

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map()

  subscribe(outletId: string, listener: Listener): () => void {
    if (!this.listeners.has(outletId)) {
      this.listeners.set(outletId, new Set())
    }
    this.listeners.get(outletId)!.add(listener)

    return () => {
      const set = this.listeners.get(outletId)
      if (set) {
        set.delete(listener)
        if (set.size === 0) {
          this.listeners.delete(outletId)
        }
      }
    }
  }

  broadcast(outletId: string, event: { id: string; topic: string; payload: any; createdAt: string }) {
    const set = this.listeners.get(outletId)
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event)
        } catch (err) {
          console.error('[EventBus] Listener error:', err)
        }
      })
    }
  }
}

// Global singleton to survive HMR in Next.js
const globalForBus = global as unknown as { eventBus?: EventBus }
export const eventBus = globalForBus.eventBus || new EventBus()
if (process.env.NODE_ENV !== 'production') globalForBus.eventBus = eventBus
