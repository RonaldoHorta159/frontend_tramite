// src/composables/useBandejaEntrada.ts
import { ref, watch } from 'vue'
import apiClient from '@/services/api'
import { toast } from 'vue-sonner'
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
} from '@tanstack/vue-table'
import { useAuthStore } from '@/stores/authStore'

// Columnas tipadas
import {
  columns as mainColumns,
  type DocumentoRecibido,
} from '../components/ui/table/bandeja-entrada/columns'
import {
  columns as modalColumns,
  type DocumentoPendiente,
} from '../components/ui/table/recepcionar-modal/columns'
import { type Movimiento } from '../components/ui/table/seguimiento-modal/Columns'

// --- Tipos ---
interface Area {
  id: number
  nombre: string
}
interface DocumentoConHistorial extends DocumentoRecibido {
  movimientos: Movimiento[]
}
interface TipoDocumento {
  id: number
  nombre: string
}

export function useBandejaEntrada() {
  const authStore = useAuthStore()

  // --- Estado ---
  const todosLosDocumentos = ref<DocumentoRecibido[]>([])
  const documentosPendientes = ref<DocumentoPendiente[]>([])
  const isLoading = ref(true)
  const mainFilter = ref('')
  const modalFilter = ref('')
  const areas = ref<Area[]>([])
  const tiposDocumento = ref<TipoDocumento[]>([])

  // --- Paginación ---
  const pageCount = ref(0)
  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 15 })

  // --- Estado de modales ---
  const isSeguimientoModalOpen = ref(false)
  const selectedDocHistory = ref<DocumentoConHistorial | null>(null)

  const isDerivarModalOpen = ref(false)
  const docToDerive = ref<DocumentoRecibido | null>(null)
  const derivarFormData = ref({ area_destino_id: '', proveido: '' })
  const isNumeroLoading = ref(false)

  // --- Modal Respuesta ---
  const isResponderModalOpen = ref(false)
  const isSubmittingResponse = ref(false)
  const docToRespond = ref<DocumentoRecibido | null>(null)

  // Formulario con nro_documento incluido
  const respuestaFormData = ref({
    tipo_documento_id: '',
    nro_documento: '', // <-- añadido
    asunto: '',
    nro_folios: 1,
    area_destino_id: '',
    archivo_pdf: null as File | null,
  })

  // --- Watcher para cargar el número correlativo al abrir el modal ---
  watch(isResponderModalOpen, async (newValue) => {
    if (newValue === true && docToRespond.value) {
      isNumeroLoading.value = true
      try {
        const response = await apiClient.get(
          `/documentos/siguiente-correlativo/${docToRespond.value.area_actual_id}`,
        )
        respuestaFormData.value.nro_documento = response.data.siguiente_numero
      } catch (error) {
        console.error('Error al obtener el correlativo para la respuesta:', error)
        toast.error('Error', { description: 'No se pudo obtener el número de documento.' })
        respuestaFormData.value.nro_documento = 'Error'
      } finally {
        isNumeroLoading.value = false
      }
    }
  })

  // --- Acciones ---
  async function handleRecepcionar(docId: number) {
    try {
      const response = await apiClient.post(`/documentos/${docId}/recepcionar`)
      toast.success('Éxito', { description: response.data.message })
      await fetchData()
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
      await fetchData()
    } catch (error) {
      console.error('Error al derivar:', error)
      toast.error('Error', { description: 'No se pudo derivar el documento.' })
    }
  }

  // --- Funciones de Respuesta ---
  function handleOpenResponderModal(documento: DocumentoRecibido) {
    docToRespond.value = documento
    respuestaFormData.value = {
      tipo_documento_id: '',
      nro_documento: '', // se llena por watcher
      asunto: `RESPUESTA A ${documento.codigo_unico}`,
      nro_folios: 1,
      area_destino_id: String(documento.area_origen.id),
      archivo_pdf: null,
    }
    isResponderModalOpen.value = true
  }

  function handleFileChangeRespuesta(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files) respuestaFormData.value.archivo_pdf = target.files[0]
  }

  async function handleSubmitRespuesta() {
    if (!docToRespond.value) return
    isSubmittingResponse.value = true

    const formData = new FormData()
    formData.append('tipo_documento_id', respuestaFormData.value.tipo_documento_id)
    formData.append('asunto', respuestaFormData.value.asunto)
    formData.append('nro_folios', respuestaFormData.value.nro_folios.toString())
    formData.append('area_destino_id', respuestaFormData.value.area_destino_id)
    formData.append('area_origen_id', String(docToRespond.value.area_actual_id))
    if (respuestaFormData.value.archivo_pdf) {
      formData.append('archivo_pdf', respuestaFormData.value.archivo_pdf)
    }

    try {
      const response = await apiClient.post(
        `/documentos/${docToRespond.value.id}/responder`,
        formData,
      )
      toast.success('Éxito', { description: response.data.message })
      isResponderModalOpen.value = false
      await fetchData()
    } catch (error) {
      console.error('Error al responder:', error)
      toast.error('Error', { description: 'No se pudo enviar la respuesta.' })
    } finally {
      isSubmittingResponse.value = false
    }
  }

  // --- Finalizar ---
  async function handleFinalizar(documento: DocumentoRecibido) {
    if (
      confirm(
        `¿Estás seguro de que deseas finalizar el trámite ${documento.codigo_unico}? Esta acción no se puede deshacer.`,
      )
    ) {
      try {
        const response = await apiClient.post(`/documentos/${documento.id}/finalizar`)
        toast.success('Éxito', { description: response.data.message })
        await fetchData()
      } catch (error) {
        console.error('Error al finalizar:', error)
        toast.error('Error', { description: 'No se pudo finalizar el trámite.' })
      }
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
    getPaginationRowModel: getPaginationRowModel(),

    manualPagination: true,
    get pageCount() {
      return pageCount.value
    },

    state: {
      get globalFilter() {
        return mainFilter.value
      },
      get pagination() {
        return pagination.value
      },
    },

    onPaginationChange: (updater) => {
      pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
    },

    meta: {
      handleDerivar,
      handleSeguimiento,
      handleOpenResponderModal,
      handleFinalizar,
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

  // --- Carga de Datos ---
  async function fetchData() {
    isLoading.value = true
    try {
      const [resMain, resPendientes, resAreas, resTipos] = await Promise.all([
        apiClient.get(`/documentos/recibidos?page=${pagination.value.pageIndex + 1}`, {
          headers: { 'Cache-Control': 'no-cache' },
        }),
        apiClient.get('/documentos/pendientes', {
          headers: { 'Cache-Control': 'no-cache' },
        }),
        apiClient.get('/catalogos/areas'),
        apiClient.get('/catalogos/tipos-documento'),
      ])

      todosLosDocumentos.value = resMain.data.data
      pageCount.value = resMain.data.last_page

      documentosPendientes.value = resPendientes.data
      areas.value = resAreas.data
      tiposDocumento.value = resTipos.data
    } catch (error) {
      console.error('Error al cargar datos de la bandeja:', error)
      toast.error('Error', { description: 'No se pudieron cargar los datos de la bandeja.' })
    } finally {
      isLoading.value = false
    }
  }

  // --- Nueva lógica de carga inicial ---
  watch(
    () => authStore.user,
    (newUser) => {
      if (newUser) {
        fetchData()
      }
    },
    { immediate: true },
  )

  watch(
    pagination,
    (newPagination, oldPagination) => {
      if (authStore.user && newPagination.pageIndex !== oldPagination.pageIndex) {
        fetchData()
      }
    },
    { deep: true },
  )

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
    tiposDocumento,

    // Modales
    isSeguimientoModalOpen,
    selectedDocHistory,
    isDerivarModalOpen,
    docToDerive,
    derivarFormData,
    isResponderModalOpen,
    isSubmittingResponse,
    isNumeroLoading,
    docToRespond,
    respuestaFormData,

    // Métodos
    fetchData,
    handleRecepcionar,
    handleSeguimiento,
    handleDerivar,
    handleDerivarSubmit,
    handleOpenResponderModal,
    handleFileChangeRespuesta,
    handleSubmitRespuesta,
    handleFinalizar,
  }
}
