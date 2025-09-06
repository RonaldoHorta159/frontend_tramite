// src/composables/useAdminAreas.ts

import { ref, onMounted } from 'vue'
import { useVueTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import apiClient from '../services/api'
import { columns, type Area } from '../components/ui/table/admin-areas/columns'

export function useAdminAreas() {
  const areas = ref<Area[]>([])
  const isLoading = ref(true)
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const areaToEdit = ref<Area | null>(null)

  const formData = ref({
    nombre: '',
    estado: 'ACTIVO',
  })

  async function fetchAreas() {
    try {
      isLoading.value = true
      const response = await apiClient.get('/admin/areas')
      areas.value = response.data
    } catch (error) {
      toast.error('Error', { description: 'No se pudieron cargar las áreas.' })
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchAreas)

  function openCreateModal() {
    isEditing.value = false
    formData.value = { nombre: '', estado: 'ACTIVO' }
    isModalOpen.value = true
  }

  function openEditModal(area: Area) {
    isEditing.value = true
    areaToEdit.value = area
    formData.value = { ...area }
    isModalOpen.value = true
  }

  async function handleDeactivate(areaId: number) {
    try {
      await apiClient.delete(`/admin/areas/${areaId}`)
      toast.success('Éxito', { description: 'El área ha sido desactivada.' })
      fetchAreas()
    } catch (error) {
      toast.error('Error', { description: 'No se pudo desactivar el área.' })
    }
  }

  async function handleSubmit() {
    if (!formData.value.nombre) {
      toast.warning('El nombre es obligatorio.')
      return
    }

    try {
      if (isEditing.value && areaToEdit.value) {
        // Actualizar
        await apiClient.put(`/admin/areas/${areaToEdit.value.id}`, formData.value)
        toast.success('Éxito', { description: 'Área actualizada correctamente.' })
      } else {
        // Crear
        await apiClient.post('/admin/areas', formData.value)
        toast.success('Éxito', { description: 'Área creada correctamente.' })
      }
      isModalOpen.value = false
      fetchAreas()
    } catch (error) {
      toast.error('Error', { description: 'No se pudo guardar el área.' })
    }
  }

  const table = useVueTable({
    get data() {
      return areas.value
    },
    get columns() {
      return columns
    },
    getCoreRowModel: getCoreRowModel(),
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
