import { ref, onMounted } from 'vue'
import { useVueTable, getCoreRowModel } from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import apiClient from '@/services/api'
// Ruta de importación corregida para usar el alias @
import { columns, type TipoDoc } from '../components/ui/table/admin-tipos/columns'

export function useAdminTipos() {
  const tipos = ref<TipoDoc[]>([])
  const isLoading = ref(true)
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const tipoToEdit = ref<TipoDoc | null>(null)

  const formData = ref({
    nombre: '',
    estado: 'ACTIVO',
  })

  async function fetchTipos() {
    try {
      isLoading.value = true
      const response = await apiClient.get('/admin/tipos-documento')
      tipos.value = response.data
    } catch (error) {
      // Se usa la variable 'error'
      console.error('Error al cargar tipos de documento:', error)
      toast.error('Error', { description: 'No se pudieron cargar los tipos de documento.' })
    } finally {
      isLoading.value = false
    }
  }

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
      toast.success('Éxito', { description: 'El tipo de documento ha sido desactivado.' })
      fetchTipos()
    } catch (error) {
      // Se usa la variable 'error'
      console.error('Error al desactivar tipo:', error)
      toast.error('Error', { description: 'No se pudo desactivar el tipo de documento.' })
    }
  }

  async function handleSubmit() {
    if (!formData.value.nombre) {
      toast.warning('El nombre es obligatorio.')
      return
    }

    try {
      if (isEditing.value && tipoToEdit.value) {
        await apiClient.put(`/admin/tipos-documento/${tipoToEdit.value.id}`, formData.value)
        toast.success('Éxito', { description: 'Tipo de documento actualizado correctamente.' })
      } else {
        await apiClient.post('/admin/tipos-documento', formData.value)
        toast.success('Éxito', { description: 'Tipo de documento creado correctamente.' })
      }
      isModalOpen.value = false
      fetchTipos()
    } catch (error) {
      // Se usa la variable 'error'
      console.error('Error al guardar tipo:', error)
      toast.error('Error', { description: 'No se pudo guardar el tipo de documento.' })
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
    // getFilteredRowModel: getFilteredRowModel(), // <-- No estamos usando filtro en esta tabla aún
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
