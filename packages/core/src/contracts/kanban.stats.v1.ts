/**
 * Kanban Stats Contract v1
 *
 * Provides kanban board statistics.
 */

import type { DataContract } from '../types/dataContract'

export interface KanbanColumnStat {
  columnId: string
  title: string
  count: number
  percentage: number
}

export interface PublicKanbanStats {
  widgetId: string
  totalItems: number
  completedItems: number
  completionRate: number
  columnStats: KanbanColumnStat[]
}

export const kanbanStatsContractV1: DataContract<PublicKanbanStats> = {
  id: 'boardkit.kanban.stats.v1',
  name: 'Kanban Stats',
  description: 'Kanban board statistics and completion rates',
  version: '1.0.0',
  providerId: 'kanban',
}
