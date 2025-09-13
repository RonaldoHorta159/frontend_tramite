import { ref, onMounted, watch } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
} from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import apiClient from '@/services/api'
import axios from 'axios'
import { columns, type Usuario } from '../components/ui/table/admin-usuarios/Columns'

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

  // --- Estados para la paginación ---
  const pageCount = ref(0)
  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // --- CORREGIDO: usamos primary_area_id ---
  const formData = ref({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    dni: '',
    email: '',
    primary_area_id: '', // antes era area_id
    nombre_usuario: '',
    rol: 'Usuario',
    estado: 'ACTIVO',
    password: '',
    password_confirmation: '',
    areas_asignadas: [] as number[],
  })

  // --- Obtener usuarios y áreas ---
  async function fetchUsuarios() {
    try {
      isLoading.value = true
      const [resUsuarios, resAreas] = await Promise.all([
        apiClient.get(`/admin/usuarios?page=${pagination.value.pageIndex + 1}`, {
          headers: { 'Cache-Control': 'no-cache' },
        }),
        apiClient.get('/catalogos/areas'),
      ])

      usuarios.value = resUsuarios.data.data
      pageCount.value = resUsuarios.data.last_page
      areas.value = resAreas.data
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error', { description: 'No se pudieron cargar los datos.' })
    } finally {
      isLoading.value = false
    }
  }

  watch(pagination, fetchUsuarios, { deep: true })
  onMounted(fetchUsuarios)

  // --- Abrir modal para crear ---
  function openCreateModal() {
    isEditing.value = false
    formData.value = {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      dni: '',
      email: '',
      primary_area_id: '',
      nombre_usuario: '',
      rol: 'Usuario',
      estado: 'ACTIVO',
      password: '',
      password_confirmation: '',
      areas_asignadas: [],
    }
    isModalOpen.value = true
  }

  // --- Abrir modal para editar ---
  function openEditModal(user: Usuario) {
    isEditing.value = true
    userToEdit.value = user
    formData.value = {
      nombres: user.empleado.nombres,
      apellido_paterno: user.empleado.apellido_paterno,
      apellido_materno: user.empleado.apellido_materno,
      dni: user.empleado.dni,
      email: user.empleado.email,
      primary_area_id: String(user.primary_area_id), // corregido
      nombre_usuario: user.nombre_usuario,
      rol: user.rol,
      estado: user.estado,
      password: '',
      password_confirmation: '',
      areas_asignadas: user.areas.map((area) => area.id), // soporta múltiples áreas
    }
    isModalOpen.value = true
  }

  // --- Desactivar usuario ---
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

  // --- Crear o actualizar usuario ---
  async function handleSubmit() {
    console.log('Iniciando guardado. ¿Modo edición?', isEditing.value)

    try {
      const payload = { ...formData.value }

      if (isEditing.value && userToEdit.value) {
        if (!payload.password) {
          delete (payload as any).password
          delete (payload as any).password_confirmation
        }
        await apiClient.put(`/admin/usuarios/${userToEdit.value.id}`, payload)
        toast.success('Éxito', { description: 'Usuario actualizado correctamente.' })
      } else {
        await apiClient.post('/admin/usuarios', payload)
        toast.success('Éxito', { description: 'Usuario creado correctamente.' })
      }

      isModalOpen.value = false
      await fetchUsuarios()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      let errorMsg = 'No se pudo guardar el usuario.'
      if (axios.isAxiosError(error) && error.response && error.response.data.errors) {
        errorMsg = Object.values(error.response.data.errors).flat().join(' ')
      }
      toast.error('Error de Validación', { description: errorMsg })
    }
  }

  // --- Configuración de la tabla con paginación ---
  const table = useVueTable({
    get data() {
      return usuarios.value
    },
    get columns() {
      return columns
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    manualPagination: true,
    get pageCount() {
      return pageCount.value
    },

    state: {
      get globalFilter() {
        return globalFilter.value
      },
      get pagination() {
        return pagination.value
      },
    },

    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        pagination.value = updater(pagination.value)
      } else {
        pagination.value = updater
      }
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
