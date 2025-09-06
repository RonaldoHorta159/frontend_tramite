<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import apiClient from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import { useVueTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type PaginationState } from '@tanstack/vue-table'

// Imports para los DataTables
import DataTable from '@/components/ui/table/DataTable.vue'
import { type DocumentoRecibido, columns as mainColumns } from '@/components/ui/table/bandeja-entrada/columns'
import { type DocumentoPendiente, columns as modalColumns } from '@/components/ui/table/recepcionar-modal/columns'
import { type MovimientoEnriquecido, columns as seguimientoColumns } from '@/components/ui/table/seguimiento-modal/Columns'

// Imports adicionales
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// --- Interfaces y Estado ---
interface Area { id: number; nombre: string; }
interface DocumentoConHistorial extends DocumentoRecibido { movimientos: MovimientoEnriquecido[] }

const todosLosDocumentos = ref<DocumentoRecibido[]>([])
const documentosPendientes = ref<DocumentoPendiente[]>([])
const isLoading = ref(true)
const mainFilter = ref('')
const modalFilter = ref('')
const areas = ref<Area[]>([])
const pageCount = ref(0)
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 15 })

const isSeguimientoModalOpen = ref(false)
const selectedDocHistory = ref<DocumentoConHistorial | null>(null)

const isDerivarModalOpen = ref(false)
const docToDerive = ref<DocumentoRecibido | null>(null)
const derivarFormData = ref({ area_destino_id: '', proveido: '' })

// --- Tabla de Seguimiento ---
const seguimientoTable = useVueTable({
  get data() { return selectedDocHistory.value?.movimientos || [] },
  get columns() { return seguimientoColumns },
  getCoreRowModel: getCoreRowModel(),
})

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
  if (!docToDerive.value || !derivarFormData.value.area_destino_id || !derivarFormData.value.proveido) {
    toast.warning('Campos incompletos', { description: 'Debe seleccionar un destino y escribir un proveído.' })
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

// --- Tablas principales ---
const mainTable = useVueTable({
  get data() { return todosLosDocumentos.value },
  get columns() { return mainColumns },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  manualPagination: true,
  get pageCount() { return pageCount.value },
  state: {
    get globalFilter() { return mainFilter.value },
    get pagination() { return pagination.value },
  },
  onPaginationChange: (updater) => {
    if (typeof updater === 'function') pagination.value = updater(pagination.value)
    else pagination.value = updater
  },
  meta: {
    handleDerivar,
    handleSeguimiento,
  },
})

const modalTable = useVueTable({
  get data() { return documentosPendientes.value },
  get columns() { return modalColumns },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: { get globalFilter() { return modalFilter.value } },
  meta: {
    handleRecepcionar,
  },
})

// --- Carga de Datos ---
async function fetchData() {
  isLoading.value = true
  try {
    const [resMain, resPendientes, resAreas] = await Promise.all([
      apiClient.get(`/documentos/recibidos?page=${pagination.value.pageIndex + 1}`),
      apiClient.get('/documentos/pendientes'),
      apiClient.get('/catalogos/areas'),
    ])

    todosLosDocumentos.value = resMain.data.data
    pageCount.value = resMain.data.last_page

    documentosPendientes.value = resPendientes.data
    areas.value = resAreas.data
  } catch (error) {
    console.error('Error al cargar datos de la bandeja:', error)
    toast.error('Error', { description: 'No se pudieron cargar los datos de la bandeja.' })
  } finally {
    isLoading.value = false
  }
}

watch(pagination, fetchData, { deep: true })
onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-4 mt-15">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Bandeja de Entrada</h1>
      <Dialog>
        <DialogTrigger as-child>
          <Button>
            <Download class="w-4 h-4 mr-2" />Recepcionar Documentos ({{ documentosPendientes.length }})
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Documentos Pendientes de Recepción</DialogTitle>
            <DialogDescription>
              Selecciona los documentos para confirmar su recepción.
            </DialogDescription>
          </DialogHeader>
          <div class="flex flex-col gap-4 py-4">
            <Input v-model="modalFilter" placeholder="Buscar en pendientes..." class="max-w-sm" />
            <DataTable :table="modalTable" />
          </div>
        </DialogContent>
      </Dialog>
    </header>

    <Input v-model="mainFilter" placeholder="Buscar en toda la bandeja..." class="max-w-sm" />
    <template v-if="isLoading">
      <div class="text-center text-muted-foreground py-10">Cargando...</div>
    </template>
    <template v-else>
      <DataTable :table="mainTable" />
    </template>

    <!-- Modal de Seguimiento con DataTable -->
    <Dialog v-model:open="isSeguimientoModalOpen">
      <DialogContent class="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Seguimiento del Trámite: {{ selectedDocHistory?.codigo_unico }}</DialogTitle>
          <DialogDescription>
            Historial completo de movimientos del documento.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 max-h-[70vh] overflow-y-auto">
          <DataTable v-if="selectedDocHistory" :table="seguimientoTable" />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal de Derivación -->
    <Dialog v-model:open="isDerivarModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Derivar Documento: {{ docToDerive?.codigo_unico }}</DialogTitle>
          <DialogDescription>
            Seleccione un destino y añada un proveído para continuar el trámite.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleDerivarSubmit" class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="destino" class="text-right">Destino</Label>
            <Select v-model="derivarFormData.area_destino_id">
              <SelectTrigger class="col-span-3">
                <SelectValue placeholder="Seleccione un área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="area in areas" :key="area.id" :value="String(area.id)">
                  {{ area.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="proveido" class="text-right">Proveído</Label>
            <Textarea id="proveido" v-model="derivarFormData.proveido" class="col-span-3"
              placeholder="Escriba su proveído aquí..." />
          </div>
          <DialogFooter>
            <Button type="submit">Derivar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
