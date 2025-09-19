import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const apiClient = axios.create({
  //recuerda que aqui debes de poner tu ip actual si es que cambias de red
  // baseURL: 'http://192.168.8.60:8000/api',
  // baseURL: 'http://192.168.11.100:8000/api', // <-- para synology
  // baseURL: 'http://192.168.0.15:8000/api',
  baseURL: 'http://localhost:8000/api', //ejemplo de otra ip que no es la mia
  // baseURL: 'http://192.168.0.15:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

// Interceptor para añadir el token a cada petición
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiClient
