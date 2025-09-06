import { ref, onMounted } from 'vue'
import { useVueTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import apiClient from '@/services/api'
import axios from 'axios'
import { columns, type Usuario } from '../components/ui/table/admin-usuarios/Columns'

// Definimos la interfaz aquí para no importarla desde una vista
interface Area {
  id: number
  nombre: string
  estado: 'ACTIVO' | 'INACTIVO'
}

export function useAdminUsuarios() {
  const usuarios = ref<Usuario[]>([])
  const areas = ref<Area[]>([])
  const isLoading = ref(true)
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const userToEdit = ref<Usuario | null>(null)
  const globalFilter = ref('')

  const formData = ref({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    dni: '',
    email: '',
    area_id: '',
    nombre_usuario: '',
    rol: 'Usuario',
    estado: 'ACTIVO',
    password: '',
    password_confirmation: '',
  })

  async function fetchUsuarios() {
    try {
      isLoading.value = true
      const [resUsuarios, resAreas] = await Promise.all([
        apiClient.get('/admin/usuarios'),
        apiClient.get('/catalogos/areas'),
      ])
      usuarios.value = resUsuarios.data
      areas.value = resAreas.data
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error', { description: 'No se pudieron cargar los datos.' })
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchUsuarios)

  function openCreateModal() {
    isEditing.value = false
    // Reseteamos el formulario a sus valores por defecto
    formData.value = {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      dni: '',
      email: '',
      area_id: '',
      nombre_usuario: '',
      rol: 'Usuario',
      estado: 'ACTIVO',
      password: '',
      password_confirmation: '',
    }
    isModalOpen.value = true
  }

  function openEditModal(user: Usuario) {
    isEditing.value = true
    userToEdit.value = user
    formData.value = {
      nombres: user.empleado.nombres,
      apellido_paterno: user.empleado.apellido_paterno,
      apellido_materno: user.empleado.apellido_materno,
      dni: user.empleado.dni,
      email: user.empleado.email,
      area_id: String(user.area.id),
      nombre_usuario: user.nombre_usuario,
      rol: user.rol,
      estado: user.estado,
      password: '',
      password_confirmation: '',
    }
    isModalOpen.value = true
  }

  async function handleDeactivate(userId: number) {
    try {
      await apiClient.delete(`/admin/usuarios/${userId}`)
      toast.success('Éxito', { description: 'El usuario ha sido desactivado.' })
      fetchUsuarios()
    } catch (error) {
      console.error('Error al desactivar usuario:', error)
      toast.error('Error', { description: 'No se pudo desactivar el usuario.' })
    }
  }

  async function handleSubmit() {
    try {
      const payload = { ...formData.value }
      if (isEditing.value && userToEdit.value) {
        if (!payload.password) {
          // --- CORRECCIÓN AQUÍ ---
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (payload as any).password
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (payload as any).password_confirmation
          // -----------------------
        }
        await apiClient.put(`/admin/usuarios/${userToEdit.value.id}`, payload)
        toast.success('Éxito', { description: 'Usuario actualizado.' })
      } else {
        await apiClient.post('/admin/usuarios', payload)
        toast.success('Éxito', { description: 'Usuario creado.' })
      }
      isModalOpen.value = false
      fetchUsuarios()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      let errorMsg = 'No se pudo guardar el usuario.'
      if (axios.isAxiosError(error) && error.response) {
        errorMsg = Object.values(error.response.data.errors).join(' \n')
      }
      toast.error('Error', { description: errorMsg })
    }
  }

  const table = useVueTable({
    get data() {
      return usuarios.value
    },
    get columns() {
      return columns
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get globalFilter() {
        return globalFilter.value
      },
    },
    meta: { openEditModal, handleDeactivate },
  })

  return {
    table,
    isLoading,
    isModalOpen,
    isEditing,
    formData,
    areas,
    globalFilter,
    openCreateModal,
    handleSubmit,
  }
}
