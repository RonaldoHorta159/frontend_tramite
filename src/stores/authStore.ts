// src/stores/authStore.ts
import { defineStore } from 'pinia'
import apiClient from '@/services/api' // 1. Importa nuestro nuevo cliente de API

// ... (la interfaz User no cambia)
interface User {
  id: number
  nombre_usuario: string
  rol: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    getUser: (state) => state.user,
  },
  actions: {
    async login(credentials: { nombre_usuario: string; password: string; remember?: boolean }) {
      try {
        // 2. Usa el apiClient en lugar de axios directamente
        const response = await apiClient.post('/auth/login', credentials)
        const { access_token, user } = response.data

        this.token = access_token
        this.user = user
        localStorage.setItem('token', access_token)

        if (credentials.remember) {
          localStorage.setItem('rememberedUser', credentials.nombre_usuario)
        } else {
          localStorage.removeItem('rememberedUser')
        }
        return true
      } catch (error) {
        console.error('Error en el login:', error)
        this.logout()
        return false
      }
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },

    // 3. NUEVA ACCIÓN para buscar el usuario si hay un token
    async fetchUser() {
      if (!this.token) return

      try {
        const response = await apiClient.get('/auth/me')
        this.user = response.data
      } catch (error) {
        console.error('Error al buscar el usuario:', error)
        // Si el token es inválido o expiró, cerramos la sesión
        this.logout()
      }
    },
  },
})
