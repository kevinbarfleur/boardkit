/**
 * Kanban Contract v1
 *
 * Provides read-only access to kanban board structure.
 */

import type { DataContract } from '../types/dataContract'

export interface PublicKanbanColumn {
  id: string
  title: string
  itemCount: number
  wipLimit: number | null
  isOverLimit: boolean
}

export interface PublicKanbanItem {
  id: string
  title: string
  columnId: string
}

export interface PublicKanbanBoard {
  widgetId: string
  title: string
  columns: PublicKanbanColumn[]
  items: PublicKanbanItem[]
  totalItems: number
}

export const kanbanContractV1: DataContract<PublicKanbanBoard> = {
  id: 'boardkit.kanban.v1',
  name: 'Kanban Board',
  description: 'Kanban board with columns and items',
  version: '1.0.0',
  providerId: 'kanban',
}
