export interface StorageAdapter {
  /**
   * Save a document to storage.
   */
  save(id: string, data: unknown): Promise<void>

  /**
   * Load a document from storage.
   */
  load(id: string): Promise<unknown | null>

  /**
   * Delete a document from storage.
   */
  delete(id: string): Promise<void>

  /**
   * List all document IDs.
   */
  list(): Promise<string[]>

  /**
   * Check if a document exists.
   */
  exists(id: string): Promise<boolean>
}

export interface DocumentInfo {
  id: string
  title: string
  updatedAt: number
}
