import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setSecretsVault } from '@boardkit/core'
import { webSecretsVault } from '@boardkit/platform'
import App from './App.vue'
import router from './router'
import 'virtual:uno.css'
import './styles/globals.css'

// Initialize secrets vault for web (IndexedDB storage)
setSecretsVault(webSecretsVault)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
