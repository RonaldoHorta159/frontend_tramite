// src/composables/useEmitirTramite.ts
import { ref, onMounted, watch, computed } from 'vue'
import apiClient from '@/services/api'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/authStore'
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/vue-table'

// Tipos y columnas
import { type DocumentoEmitido, columns as mainColumns } from '@/components/ui/table/columns'
import {
  type Movimiento,
  columns as seguimientoColumns,
} from '@/components/ui/table/seguimiento-modal/Columns'

// --- Tipos auxiliares ---
interface TipoDocumento {
  id: number
  nombre: string
}
interface Area {
  id: number
  nombre: string
}
interface DocumentoConHistorial extends DocumentoEmitido {
  movimientos: Movimiento[]
}

export function useEmitirTramite() {
  const authStore = useAuthStore()
  const isAdmin = computed(() => authStore.user?.rol === 'Administrador')

  // --- Estado principal ---
  const documentos = ref<DocumentoEmitido[]>([])
  const isLoading = ref(true)
  const pageCount = ref(0)

  // Tabla
  const sorting = ref<SortingState>([])
  const columnFilters = ref<ColumnFiltersState>([])
  const globalFilter = ref('')
  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 15 })

  // --- Área seleccionada ---
  const selectedAreaId = ref<string | null>(null) // inicializa como null

  // --- Oficinas ---
  const areas = ref<Area[]>([])
  const oficinasPermitidas = computed(() => {
    if (isAdmin.value) return areas.value
    return authStore.user?.areas || []
  })

  // --- Estados UI ---
  const isModalOpen = ref(false)
  const isSubmitting = ref(false)
  const isNumeroLoading = ref(false)
  const tiposDocumento = ref<TipoDocumento[]>([])
  const newDoc = ref({
    tipo_documento_id: '',
    nro_documento: '',
    asunto: '',
    nro_folios: 1,
    area_destino_id: '',
    archivo_pdf: null as File | null,
  })

  const isSeguimientoModalOpen = ref(false)
  const selectedDocHistory = ref<DocumentoConHistorial | null>(null)
  const isDerivarModalOpen = ref(false)
  const docToDerive = ref<DocumentoEmitido | null>(null)
  const derivarFormData = ref({ area_destino_id: '', proveido: '' })

  // --- Fetch documentos ---
  async function fetchDocumentos() {
    if (!selectedAreaId.value) {
      documentos.value = []
      pageCount.value = 0
      return
    }

    isLoading.value = true
    try {
      // --- Construcción condicional de la URL ---
      let url = ''
      if (isAdmin.value) {
        // Si es administrador, puede traer todos
        url = `/documentos?page=${pagination.value.pageIndex + 1}`
      } else {
        // Si no, solo los de su área seleccionada
        url = `/documentos/por-area/${selectedAreaId.value}?page=${pagination.value.pageIndex + 1}`
      }

      const response = await apiClient.get(url, {
        headers: { 'Cache-Control': 'no-cache' }, // 🔒 anti-caché
      })

      documentos.value = response.data.data
      pageCount.value = response.data.last_page
    } catch (error) {
      console.error('Error al cargar documentos:', error)
      toast.error('Error', { description: 'No se pudieron cargar los documentos.' })
    } finally {
      isLoading.value = false
    }
  }

  // --- Acciones ---
  async function handleSeguimiento(documento: DocumentoEmitido) {
    try {
      const response = await apiClient.get(`/documentos/${documento.id}`)
      selectedDocHistory.value = response.data
      isSeguimientoModalOpen.value = true
    } catch (error) {
      console.error('Error al cargar historial:', error)
      toast.error('Error', { description: 'No se pudo cargar el historial del documento.' })
    }
  }

  function handleDerivar(documento: DocumentoEmitido) {
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
      fetchDocumentos()
    } catch (error) {
      console.error('Error al derivar:', error)
      toast.error('Error', { description: 'No se pudo derivar el documento.' })
    }
  }

  // --- Crear documento ---
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files) newDoc.value.archivo_pdf = target.files[0]
  }

  function resetForm() {
    newDoc.value = {
      tipo_documento_id: '',
      nro_documento: '',
      asunto: '',
      nro_folios: 1,
      area_destino_id: '',
      archivo_pdf: null,
    }
    const fileInput = document.getElementById('archivo') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  async function handleCreateDocument() {
    const formData = new FormData()

    if (selectedAreaId.value) {
      formData.append('area_origen_id', selectedAreaId.value)
    }

    formData.append('tipo_documento_id', newDoc.value.tipo_documento_id)
    formData.append('nro_documento', newDoc.value.nro_documento)
    formData.append('asunto', newDoc.value.asunto)
    formData.append('nro_folios', newDoc.value.nro_folios.toString())
    formData.append('area_destino_id', newDoc.value.area_destino_id)

    if (newDoc.value.archivo_pdf) {
      formData.append('archivo_pdf', newDoc.value.archivo_pdf)
    }

    try {
      isSubmitting.value = true
      await apiClient.post('/documentos', formData)
      toast.success('Éxito', { description: 'El documento ha sido creado y enviado.' })
      isModalOpen.value = false
      resetForm()
      await fetchDocumentos()
    } catch (error) {
      console.error('Error al crear el documento:', error)
      let errorMsg = 'Ocurrió un error desconocido.'
      if (axios.isAxiosError(error) && error.response) {
        errorMsg = error.response.data.message || 'Error del servidor.'
      }
      toast.error('Error', { description: `No se pudo crear el documento: ${errorMsg}` })
    } finally {
      isSubmitting.value = false
    }
  }

  // --- Tablas ---
  const seguimientoTable = useVueTable({
    get data() {
      return selectedDocHistory.value?.movimientos || []
    },
    get columns() {
      return seguimientoColumns
    },
    getCoreRowModel: getCoreRowModel(),
  })

  const mainTable = useVueTable({
    get data() {
      return documentos.value
    },
    get columns() {
      return mainColumns
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    get pageCount() {
      return pageCount.value
    },
    state: {
      get sorting() {
        return sorting.value
      },
      get columnFilters() {
        return columnFilters.value
      },
      get globalFilter() {
        return globalFilter.value
      },
      get pagination() {
        return pagination.value
      },
    },
    onSortingChange: (updater) =>
      (sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater),
    onColumnFiltersChange: (updater) =>
      (columnFilters.value =
        typeof updater === 'function' ? updater(columnFilters.value) : updater),
    onPaginationChange: (updater) =>
      (pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater),
    meta: { handleSeguimiento, handleDerivar },
  })

  // --- Watchers ---
  watch(selectedAreaId, (newValue, oldValue) => {
    if (newValue !== oldValue) {
      pagination.value.pageIndex = 0
      fetchDocumentos()
    }
  })

  watch(pagination, fetchDocumentos, { deep: true })

  watch(isModalOpen, async (newValue) => {
    if (newValue === true) {
      if (!selectedAreaId.value) {
        toast.error('Error', {
          description: 'Debe seleccionar una oficina antes de emitir un trámite.',
        })
        isModalOpen.value = false
        return
      }

      isNumeroLoading.value = true
      try {
        const response = await apiClient.get(
          `/documentos/siguiente-correlativo/${selectedAreaId.value}`,
        )
        newDoc.value.nro_documento = response.data.siguiente_numero
      } catch (error) {
        console.error('Error al obtener el correlativo:', error)
        toast.error('Error', { description: 'No se pudo obtener el número de documento.' })
        newDoc.value.nro_documento = 'Error'
      } finally {
        isNumeroLoading.value = false
      }
    }
  })

  // --- Inicialización (Watcher para área por defecto) ---
  watch(
    () => authStore.user,
    (newUser) => {
      if (newUser && !selectedAreaId.value) {
        selectedAreaId.value = String(newUser.primary_area_id)
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    fetchDocumentos()
    apiClient.get('/catalogos/tipos-documento').then((res) => (tiposDocumento.value = res.data))
    apiClient.get('/catalogos/areas').then((res) => (areas.value = res.data))
  })

  // --- Exponer ---
  return {
    mainTable,
    seguimientoTable,
    isLoading,
    globalFilter,
    isModalOpen,
    isSubmitting,
    isNumeroLoading,
    tiposDocumento,
    areas,
    newDoc,
    handleFileChange,
    resetForm,
    handleCreateDocument,
    isSeguimientoModalOpen,
    selectedDocHistory,
    isDerivarModalOpen,
    docToDerive,
    derivarFormData,
    handleDerivarSubmit,
    isAdmin,
    selectedAreaId,
    oficinasPermitidas,
  }
}
