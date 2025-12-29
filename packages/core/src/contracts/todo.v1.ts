/**
 * Todo Contract v1
 *
 * Defines the public data contract for Todo module.
 * This is what consumers receive, NOT the internal state.
 */

import type { DataContract } from '../types/dataContract'

/**
 * Public projection of a todo list.
 * This is the read-only view exposed to consumers.
 */
export interface PublicTodoList {
  /** Widget ID of the provider */
  widgetId: string
  /** List title */
  title: string
  /** Optional description */
  description?: string
  /** Progress summary */
  progress: {
    done: number
    total: number
  }
  /** All items (read-only) */
  items: Array<{
    id: string
    label: string
    completed: boolean
  }>
}

/**
 * Todo contract v1 definition.
 */
export const todoContractV1: DataContract<PublicTodoList> = {
  id: 'boardkit.todo.v1',
  name: 'Todo List',
  description: 'Provides read-only access to a todo list with items and progress',
  version: '1.0.0',
  providerId: 'todo',
}
