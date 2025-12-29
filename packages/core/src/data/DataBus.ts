/**
 * DataBus
 *
 * A reactive pub/sub system for inter-module data sharing.
 * Providers publish data, consumers subscribe to updates.
 */

type Subscriber = (data: unknown) => void

interface Subscription {
  consumerWidgetId: string
  providerWidgetId: string
  contractId: string
  callback: Subscriber
}

interface CacheEntry {
  data: unknown
  timestamp: number
}

class DataBus {
  private subscriptions: Subscription[] = []
  private dataCache = new Map<string, CacheEntry>()

  /**
   * Generate a cache key from provider widget ID and contract.
   */
  private getCacheKey(providerWidgetId: string, contractId: string): string {
    return `${providerWidgetId}:${contractId}`
  }

  /**
   * Subscribe to data updates from a provider.
   * Returns an unsubscribe function.
   */
  subscribe(
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string,
    callback: Subscriber
  ): () => void {
    const subscription: Subscription = {
      consumerWidgetId,
      providerWidgetId,
      contractId,
      callback,
    }

    this.subscriptions.push(subscription)

    // Immediately call with cached data if available
    const cacheKey = this.getCacheKey(providerWidgetId, contractId)
    const cached = this.dataCache.get(cacheKey)
    if (cached) {
      try {
        callback(cached.data)
      } catch (error) {
        console.error(`[DataBus] Initial callback error:`, error)
      }
    }

    // Return unsubscribe function
    return () => {
      const index = this.subscriptions.indexOf(subscription)
      if (index >= 0) {
        this.subscriptions.splice(index, 1)
      }
    }
  }

  /**
   * Publish data from a provider.
   * Notifies all subscribed consumers.
   */
  publish(providerWidgetId: string, contractId: string, data: unknown): void {
    const cacheKey = this.getCacheKey(providerWidgetId, contractId)
    this.dataCache.set(cacheKey, { data, timestamp: Date.now() })

    // Notify all matching subscribers
    for (const sub of this.subscriptions) {
      if (sub.providerWidgetId === providerWidgetId && sub.contractId === contractId) {
        try {
          sub.callback(data)
        } catch (error) {
          console.error(`[DataBus] Subscriber error:`, error)
        }
      }
    }
  }

  /**
   * Get current cached data for a provider/contract.
   */
  getData(providerWidgetId: string, contractId: string): unknown | null {
    const cacheKey = this.getCacheKey(providerWidgetId, contractId)
    return this.dataCache.get(cacheKey)?.data ?? null
  }

  /**
   * Get the timestamp of cached data.
   */
  getDataTimestamp(providerWidgetId: string, contractId: string): number | null {
    const cacheKey = this.getCacheKey(providerWidgetId, contractId)
    return this.dataCache.get(cacheKey)?.timestamp ?? null
  }

  /**
   * Check if there are any subscribers for a provider.
   */
  hasSubscribers(providerWidgetId: string, contractId: string): boolean {
    return this.subscriptions.some(
      (s) => s.providerWidgetId === providerWidgetId && s.contractId === contractId
    )
  }

  /**
   * Get all subscriptions for a consumer widget.
   */
  getConsumerSubscriptions(consumerWidgetId: string): Subscription[] {
    return this.subscriptions.filter((s) => s.consumerWidgetId === consumerWidgetId)
  }

  /**
   * Remove all subscriptions for a widget (consumer or provider).
   * Called when a widget is deleted.
   */
  removeWidget(widgetId: string): void {
    // Remove subscriptions where this widget is consumer or provider
    this.subscriptions = this.subscriptions.filter(
      (s) => s.consumerWidgetId !== widgetId && s.providerWidgetId !== widgetId
    )

    // Clear cache for this provider
    for (const key of this.dataCache.keys()) {
      if (key.startsWith(`${widgetId}:`)) {
        this.dataCache.delete(key)
      }
    }
  }

  /**
   * Clear all subscriptions and cache (for testing).
   */
  clear(): void {
    this.subscriptions = []
    this.dataCache.clear()
  }
}

// Singleton instance
export const dataBus = new DataBus()
export { DataBus }
