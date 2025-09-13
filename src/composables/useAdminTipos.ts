import { ref, onMounted, watch } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
} from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import apiClient from '@/services/api'
import { columns, type TipoDoc } from '../components/ui/table/admin-tipos/columns'
import axios from 'axios'

export function useAdminTipos() {
  const tipos = ref<TipoDoc[]>([])
  const isLoading = ref(true)
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const tipoToEdit = ref<TipoDoc | null>(null)

  // --- Paginación ---
  const pageCount = ref(0)
  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const formData = ref({
    nombre: '',
    estado: 'ACTIVO',
  })

  // --- Fetch con paginación ---
  async function fetchTipos() {
    try {
      isLoading.value = true
      const response = await apiClient.get(
        `/admin/tipos-documento?page=${pagination.value.pageIndex + 1}`,
      )
      tipos.value = response.data.data
      pageCount.value = response.data.last_page
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error)
      toast.error('Error', {
        description: 'No se pudieron cargar los tipos de documento.',
      })
    } finally {
      isLoading.value = false
    }
  }

  watch(pagination, fetchTipos, { deep: true })
  onMounted(fetchTipos)

  function openCreateModal() {
    isEditing.value = false
    formData.value = { nombre: '', estado: 'ACTIVO' }
    isModalOpen.value = true
  }

  function openEditModal(tipo: TipoDoc) {
    isEditing.value = true
    tipoToEdit.value = tipo
    formData.value = { ...tipo }
    isModalOpen.value = true
  }

  async function handleDeactivate(tipoId: number) {
    try {
      await apiClient.delete(`/admin/tipos-documento/${tipoId}`)
      toast.success('Éxito', {
        description: 'El tipo de documento ha sido desactivado.',
      })
      fetchTipos()
    } catch (error) {
      console.error('Error al desactivar tipo:', error)
      toast.error('Error', {
        description: 'No se pudo desactivar el tipo de documento.',
      })
    }
  }

  async function handleSubmit() {
    if (!formData.value.nombre) {
      toast.warning('El nombre es obligatorio.')
      return
    }

    try {
      if (isEditing.value && tipoToEdit.value) {
        // --- VOLVEMOS A USAR apiClient.put ---
        // Esta es la forma correcta y estándar para una API RESTful.
        await apiClient.put(`/admin/tipos-documento/${tipoToEdit.value.id}`, formData.value)
        // --- FIN DEL CAMBIO ---

        toast.success('Éxito', {
          description: 'Tipo de documento actualizado correctamente.',
        })
        await fetchTipos()
      } else {
        // La lógica de creación (POST) ya era correcta y no cambia.
        await apiClient.post('/admin/tipos-documento', formData.value)
        toast.success('Éxito', {
          description: 'Tipo de documento creado correctamente.',
        })
        await fetchTipos()
      }
      isModalOpen.value = false
    } catch (error) {
      console.error('Error al guardar tipo:', error)
      // El manejo de errores mejorado que implementamos seguirá funcionando.
      let errorMsg = 'No se pudo guardar el tipo de documento.'
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors).flat().join(' ')
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message
        }
      }
      toast.error('Error de Validación', { description: errorMsg })
    }
  }

  const table = useVueTable({
    get data() {
      return tipos.value
    },
    get columns() {
      return columns
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    manualPagination: true,
    get pageCount() {
      return pageCount.value
    },

    state: {
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

    meta: {
      openEditModal,
      handleDeactivate,
    },
  })

  return {
    table,
    isLoading,
    isModalOpen,
    isEditing,
    formData,
    openCreateModal,
    handleSubmit,
  }
}
