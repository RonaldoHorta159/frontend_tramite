// src/composables/useBandejaEntrada.ts
import { ref, onMounted } from 'vue'
import apiClient from '@/services/api'
import { toast } from 'vue-sonner'
import { useVueTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/vue-table'

// Columnas tipadas
import {
  columns as mainColumns,
  type DocumentoRecibido,
} from '../components/ui/table/bandeja-entrada/columns'
import {
  columns as modalColumns,
  type DocumentoPendiente,
} from '../components/ui/table/recepcionar-modal/columns'
// --- Tipos ---
interface Area {
  id: number
  nombre: string
}
interface DocumentoConHistorial extends DocumentoRecibido {
  movimientos: any[]
}

export function useBandejaEntrada() {
  // --- Estado ---
  const todosLosDocumentos = ref<DocumentoRecibido[]>([])
  const documentosPendientes = ref<DocumentoPendiente[]>([])
  const isLoading = ref(true)
  const mainFilter = ref('')
  const modalFilter = ref('')
  const areas = ref<Area[]>([])

  // Estado de modales
  const isSeguimientoModalOpen = ref(false)
  const selectedDocHistory = ref<DocumentoConHistorial | null>(null)

  const isDerivarModalOpen = ref(false)
  const docToDerive = ref<DocumentoRecibido | null>(null)
  const derivarFormData = ref({ area_destino_id: '', proveido: '' })

  // --- Lógica de Acciones ---
  async function handleRecepcionar(docId: number) {
    try {
      const response = await apiClient.post(`/documentos/${docId}/recepcionar`)
      toast.success('Éxito', { description: response.data.message })
      fetchData()
    } catch (error) {
      console.error('Error al recepcionar el documento:', error)
      toast.error('Error', { description: 'No se pudo recepcionar el documento.' })
    }
  }

  async function handleSeguimiento(documento: DocumentoRecibido) {
    try {
      const response = await apiClient.get(`/documentos/${documento.id}`)
      selectedDocHistory.value = response.data
      isSeguimientoModalOpen.value = true
    } catch (error) {
      console.error('Error al cargar el historial:', error)
      toast.error('Error', { description: 'No se pudo cargar el historial del documento.' })
    }
  }

  function handleDerivar(documento: DocumentoRecibido) {
    docToDerive.value = documento
    derivarFormData.value = { area_destino_id: '', proveido: '' }
    isDerivarModalOpen.value = true
  }

  async function handleDerivarSubmit() {
    if (
      !docToDerive.value ||
      !derivarFormData.value.area_destino_id ||
      !derivarFormData.value.proveido
    ) {
      toast.warning('Campos incompletos', {
        description: 'Debe seleccionar un destino y escribir un proveído.',
      })
      return
    }
    try {
      await apiClient.post(`/documentos/${docToDerive.value.id}/derivar`, derivarFormData.value)
      toast.success('Éxito', { description: 'El documento ha sido derivado.' })
      isDerivarModalOpen.value = false
      fetchData()
    } catch (error) {
      console.error('Error al derivar:', error)
      toast.error('Error', { description: 'No se pudo derivar el documento.' })
    }
  }

  // --- Tablas ---
  const mainTable = useVueTable({
    get data() {
      return todosLosDocumentos.value
    },
    get columns() {
      return mainColumns
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get globalFilter() {
        return mainFilter.value
      },
    },
    meta: {
      handleDerivar,
      handleSeguimiento,
    },
  })

  const modalTable = useVueTable({
    get data() {
      return documentosPendientes.value
    },
    get columns() {
      return modalColumns
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get globalFilter() {
        return modalFilter.value
      },
    },
    meta: {
      handleRecepcionar,
    },
  })

  // --- Carga de Datos (optimizado con una sola llamada) ---
  async function fetchData() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/bandeja-entrada/data')
      todosLosDocumentos.value = response.data.todosLosDocumentos
      documentosPendientes.value = response.data.documentosPendientes
      areas.value = response.data.areas
    } catch (error) {
      console.error('Error al cargar datos de la bandeja:', error)
      toast.error('Error', { description: 'No se pudieron cargar los datos de la bandeja.' })
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchData)

  // --- Exponer ---
  return {
    // Estado
    isLoading,
    mainFilter,
    modalFilter,
    mainTable,
    modalTable,
    documentosPendientes,
    areas,

    // Modales
    isSeguimientoModalOpen,
    selectedDocHistory,
    isDerivarModalOpen,
    docToDerive,
    derivarFormData,

    // Métodos
    fetchData,
    handleRecepcionar,
    handleSeguimiento,
    handleDerivar,
    handleDerivarSubmit,
  }
}
