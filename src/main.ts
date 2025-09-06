// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/main.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
app.use(createPinia()) // 2. Usa Pinia primero

// 3. Lógica de inicialización
async function initializeApp() {
  const authStore = useAuthStore()

  if (authStore.token) {
    await authStore.fetchUser()
  }

  app.use(router)
  app.mount('#app')
}

initializeApp()
