/**
 * Document Validator
 *
 * Validates .boardkit document structure before loading.
 * Provides clear error messages for corrupted or invalid files.
 */

import type { BoardkitDocument } from '../types/document'

export class DocumentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentValidationError'
  }
}

/**
 * Validates that the parsed data has the expected structure of a BoardkitDocument.
 * Throws DocumentValidationError if validation fails.
 *
 * @param data - The parsed JSON data to validate
 * @returns The validated BoardkitDocument
 */
export function validateDocument(data: unknown): BoardkitDocument {
  if (!data || typeof data !== 'object') {
    throw new DocumentValidationError('Document invalide: objet attendu')
  }

  const doc = data as Record<string, unknown>

  // Version validation
  if (typeof doc.version !== 'number') {
    throw new DocumentValidationError('Document invalide: version manquante ou invalide')
  }

  if (doc.version < 0 || doc.version > 100) {
    throw new DocumentValidationError(`Document invalide: version ${doc.version} non supportée`)
  }

  // Meta validation
  if (!doc.meta || typeof doc.meta !== 'object') {
    throw new DocumentValidationError('Document invalide: meta manquant')
  }

  // Board validation
  if (!doc.board || typeof doc.board !== 'object') {
    throw new DocumentValidationError('Document invalide: board manquant')
  }

  const board = doc.board as Record<string, unknown>

  if (!Array.isArray(board.widgets)) {
    throw new DocumentValidationError('Document invalide: widgets doit être un tableau')
  }

  if (!Array.isArray(board.elements)) {
    throw new DocumentValidationError('Document invalide: elements doit être un tableau')
  }

  // Modules validation
  if (!doc.modules || typeof doc.modules !== 'object') {
    throw new DocumentValidationError('Document invalide: modules manquant')
  }

  // Viewport validation (optional but should be valid if present)
  if (board.viewport !== undefined) {
    if (typeof board.viewport !== 'object' || board.viewport === null) {
      throw new DocumentValidationError('Document invalide: viewport doit être un objet')
    }

    const viewport = board.viewport as Record<string, unknown>
    if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number') {
      throw new DocumentValidationError('Document invalide: viewport.x et viewport.y doivent être des nombres')
    }
  }

  // Widget structure validation (basic)
  for (let i = 0; i < board.widgets.length; i++) {
    const widget = board.widgets[i] as Record<string, unknown>
    if (!widget || typeof widget !== 'object') {
      throw new DocumentValidationError(`Document invalide: widget[${i}] doit être un objet`)
    }
    if (typeof widget.id !== 'string') {
      throw new DocumentValidationError(`Document invalide: widget[${i}].id manquant`)
    }
    if (typeof widget.moduleId !== 'string') {
      throw new DocumentValidationError(`Document invalide: widget[${i}].moduleId manquant`)
    }
  }

  // Element structure validation (basic)
  for (let i = 0; i < board.elements.length; i++) {
    const element = board.elements[i] as Record<string, unknown>
    if (!element || typeof element !== 'object') {
      throw new DocumentValidationError(`Document invalide: element[${i}] doit être un objet`)
    }
    if (typeof element.id !== 'string') {
      throw new DocumentValidationError(`Document invalide: element[${i}].id manquant`)
    }
    if (typeof element.type !== 'string') {
      throw new DocumentValidationError(`Document invalide: element[${i}].type manquant`)
    }
  }

  return data as BoardkitDocument
}

/**
 * Safely validates a document, returning a result object instead of throwing.
 */
export function safeValidateDocument(data: unknown): {
  success: true
  data: BoardkitDocument
} | {
  success: false
  error: string
} {
  try {
    const validated = validateDocument(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof DocumentValidationError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erreur de validation inconnue' }
  }
}
