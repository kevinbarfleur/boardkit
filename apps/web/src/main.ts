import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setSecretsVault, setupPluginRuntime } from '@boardkit/core'
import { webSecretsVault } from '@boardkit/platform'
import * as BoardkitUI from '@boardkit/ui'
import * as BoardkitPluginAPI from '@boardkit/plugin-api'
import App from './App.vue'
import router from './router'
import 'virtual:uno.css'
import './styles/globals.css'

// Initialize secrets vault for web (IndexedDB storage)
setSecretsVault(webSecretsVault)

// Initialize plugin runtime with required dependencies
setupPluginRuntime({
  ui: BoardkitUI,
  pluginApi: BoardkitPluginAPI,
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
