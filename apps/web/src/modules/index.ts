import { moduleRegistry } from '@boardkit/core'
import { TextModule } from './text'
import { TodoModule } from './todo'

export function registerModules() {
  moduleRegistry.register(TextModule)
  moduleRegistry.register(TodoModule)
}

export { TextModule } from './text'
export { TodoModule } from './todo'
