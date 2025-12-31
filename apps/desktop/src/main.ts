import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setSecretsVault } from '@boardkit/core'
import { tauriSecretsVault } from '@boardkit/platform'
import App from './App.vue'
import 'virtual:uno.css'
import './styles/globals.css'

// Initialize secrets vault for desktop (filesystem storage)
setSecretsVault(tauriSecretsVault)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
