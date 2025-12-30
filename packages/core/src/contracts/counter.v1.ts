/**
 * Counter Contract v1
 *
 * Provides read-only access to a counter's value and progress.
 */

import type { DataContract } from '../types/dataContract'

export interface PublicCounter {
  widgetId: string
  label: string
  value: number
  target: number | null
  unit: string
  progressPercent: number | null
  isComplete: boolean
}

export const counterContractV1: DataContract<PublicCounter> = {
  id: 'boardkit.counter.v1',
  name: 'Counter',
  description: 'Provides read-only access to counter value and progress',
  version: '1.0.0',
  providerId: 'counter',
}
