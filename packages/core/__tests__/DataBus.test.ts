import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataBus } from '../src/data/DataBus'

describe('DataBus', () => {
  let bus: DataBus

  beforeEach(() => {
    bus = new DataBus()
  })

  describe('subscribe()', () => {
    it('should add a subscription', () => {
      const callback = vi.fn()
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback)

      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(true)
    })

    it('should return an unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback)

      expect(typeof unsubscribe).toBe('function')
      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(true)

      unsubscribe()
      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(false)
    })

    it('should immediately call callback with cached data if available', () => {
      const callback = vi.fn()

      // First publish data
      bus.publish('provider-1', 'contract-1', { value: 42 })

      // Then subscribe - should receive cached data immediately
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback)

      expect(callback).toHaveBeenCalledWith({ value: 42 })
    })

    it('should not call callback if no cached data', () => {
      const callback = vi.fn()

      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should catch errors in initial callback', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const callback = vi.fn(() => {
        throw new Error('Callback error')
      })

      bus.publish('provider-1', 'contract-1', { value: 42 })
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback)

      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('publish()', () => {
    it('should notify subscribed consumers', () => {
      const callback = vi.fn()
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback)

      bus.publish('provider-1', 'contract-1', { value: 100 })

      expect(callback).toHaveBeenCalledWith({ value: 100 })
    })

    it('should notify multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback1)
      bus.subscribe('consumer-2', 'provider-1', 'contract-1', callback2)

      bus.publish('provider-1', 'contract-1', { data: 'test' })

      expect(callback1).toHaveBeenCalledWith({ data: 'test' })
      expect(callback2).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should not notify subscribers of different contracts', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback1)
      bus.subscribe('consumer-2', 'provider-1', 'contract-2', callback2)

      bus.publish('provider-1', 'contract-1', { data: 'test' })

      expect(callback1).toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should not notify subscribers of different providers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      bus.subscribe('consumer-1', 'provider-1', 'contract-1', callback1)
      bus.subscribe('consumer-2', 'provider-2', 'contract-1', callback2)

      bus.publish('provider-1', 'contract-1', { data: 'test' })

      expect(callback1).toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should cache published data', () => {
      bus.publish('provider-1', 'contract-1', { cached: true })

      expect(bus.getData('provider-1', 'contract-1')).toEqual({ cached: true })
    })

    it('should catch errors in subscriber callbacks', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const goodCallback = vi.fn()
      const badCallback = vi.fn(() => {
        throw new Error('Subscriber error')
      })

      bus.subscribe('consumer-1', 'provider-1', 'contract-1', badCallback)
      bus.subscribe('consumer-2', 'provider-1', 'contract-1', goodCallback)

      bus.publish('provider-1', 'contract-1', { data: 'test' })

      // Both should be called, error should be caught
      expect(badCallback).toHaveBeenCalled()
      expect(goodCallback).toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalled()

      errorSpy.mockRestore()
    })
  })

  describe('getData()', () => {
    it('should return cached data', () => {
      bus.publish('provider-1', 'contract-1', { test: 'data' })

      expect(bus.getData('provider-1', 'contract-1')).toEqual({ test: 'data' })
    })

    it('should return null for non-existent cache', () => {
      expect(bus.getData('non-existent', 'contract')).toBeNull()
    })
  })

  describe('getDataTimestamp()', () => {
    it('should return timestamp of cached data', () => {
      const before = Date.now()
      bus.publish('provider-1', 'contract-1', { data: 'test' })
      const after = Date.now()

      const timestamp = bus.getDataTimestamp('provider-1', 'contract-1')

      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should return null for non-existent cache', () => {
      expect(bus.getDataTimestamp('non-existent', 'contract')).toBeNull()
    })
  })

  describe('hasSubscribers()', () => {
    it('should return true when subscribers exist', () => {
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', vi.fn())

      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(true)
    })

    it('should return false when no subscribers', () => {
      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(false)
    })

    it('should return false after all unsubscribe', () => {
      const unsubscribe = bus.subscribe('consumer-1', 'provider-1', 'contract-1', vi.fn())

      unsubscribe()

      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(false)
    })
  })

  describe('getConsumerSubscriptions()', () => {
    it('should return all subscriptions for a consumer', () => {
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', vi.fn())
      bus.subscribe('consumer-1', 'provider-2', 'contract-2', vi.fn())
      bus.subscribe('consumer-2', 'provider-1', 'contract-1', vi.fn())

      const subs = bus.getConsumerSubscriptions('consumer-1')

      expect(subs.length).toBe(2)
      expect(subs.every((s) => s.consumerWidgetId === 'consumer-1')).toBe(true)
    })

    it('should return empty array for consumer with no subscriptions', () => {
      const subs = bus.getConsumerSubscriptions('non-existent')

      expect(subs).toEqual([])
    })
  })

  describe('removeWidget()', () => {
    it('should remove subscriptions where widget is consumer', () => {
      bus.subscribe('widget-1', 'provider-1', 'contract-1', vi.fn())
      bus.subscribe('widget-2', 'provider-1', 'contract-1', vi.fn())

      bus.removeWidget('widget-1')

      expect(bus.getConsumerSubscriptions('widget-1').length).toBe(0)
      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(true) // widget-2 still subscribed
    })

    it('should remove subscriptions where widget is provider', () => {
      bus.subscribe('consumer-1', 'widget-1', 'contract-1', vi.fn())
      bus.subscribe('consumer-2', 'provider-2', 'contract-1', vi.fn())

      bus.removeWidget('widget-1')

      expect(bus.hasSubscribers('widget-1', 'contract-1')).toBe(false)
      expect(bus.hasSubscribers('provider-2', 'contract-1')).toBe(true)
    })

    it('should clear cache for widget as provider', () => {
      bus.publish('widget-1', 'contract-1', { data: 'test' })
      bus.publish('widget-1', 'contract-2', { data: 'test2' })
      bus.publish('widget-2', 'contract-1', { data: 'other' })

      bus.removeWidget('widget-1')

      expect(bus.getData('widget-1', 'contract-1')).toBeNull()
      expect(bus.getData('widget-1', 'contract-2')).toBeNull()
      expect(bus.getData('widget-2', 'contract-1')).toEqual({ data: 'other' })
    })
  })

  describe('clear()', () => {
    it('should remove all subscriptions', () => {
      bus.subscribe('consumer-1', 'provider-1', 'contract-1', vi.fn())
      bus.subscribe('consumer-2', 'provider-2', 'contract-2', vi.fn())

      bus.clear()

      expect(bus.hasSubscribers('provider-1', 'contract-1')).toBe(false)
      expect(bus.hasSubscribers('provider-2', 'contract-2')).toBe(false)
    })

    it('should clear all cached data', () => {
      bus.publish('provider-1', 'contract-1', { data: 1 })
      bus.publish('provider-2', 'contract-2', { data: 2 })

      bus.clear()

      expect(bus.getData('provider-1', 'contract-1')).toBeNull()
      expect(bus.getData('provider-2', 'contract-2')).toBeNull()
    })
  })
})
