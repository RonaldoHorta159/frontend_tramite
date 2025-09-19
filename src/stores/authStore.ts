// src/stores/authStore.ts
import { defineStore } from 'pinia'
import apiClient from '@/services/api'

// --- Definición del tipo Area ---
interface Area {
  id: number
  nombre: string
  codigo?: string
}

// --- Interfaz User unificada ---
interface User {
  id: number
  nombre_usuario: string
  rol: string
  primary_area_id: number
  primary_area: Area // <-- Aceptamos el objeto completo del área principal
  areas: Area[] // Lista de otras áreas permitidas
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
        const response = await apiClient.post('/auth/login', credentials)
        const { access_token } = response.data

        this.token = access_token
        localStorage.setItem('token', access_token)

        // ¡CAMBIO CLAVE!
        // Inmediatamente después de guardar el token, llama a fetchUser
        // para obtener los datos completos del usuario.
        await this.fetchUser() // [!code ++]

        // ... lógica de 'remember' ...
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

    async fetchUser() {
      if (!this.token) return

      try {
        const response = await apiClient.get('/auth/me')
        this.user = response.data
      } catch (error) {
        console.error('Error al buscar el usuario:', error)
        this.logout()
      }
    },
  },
})
