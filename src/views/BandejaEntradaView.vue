<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import apiClient from '@/services/api'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Send } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState
} from '@tanstack/vue-table'

// Components
import DataTable from '@/components/ui/table/DataTable.vue'
import { type DocumentoRecibido, columns as mainColumns } from '@/components/ui/table/bandeja-entrada/columns'
import { type DocumentoPendiente, columns as modalColumns } from '@/components/ui/table/recepcionar-modal/columns'
import { type MovimientoEnriquecido, columns as seguimientoColumns } from '@/components/ui/table/seguimiento-modal/Columns'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useBandejaEntrada } from '@/composables/useBandejaEntrada'

// --- Interfaces ---
interface Area { id: number; nombre: string }
interface TipoDocumento { id: number; nombre: string }
interface DocumentoConHistorial extends DocumentoRecibido { movimientos: MovimientoEnriquecido[] }

// --- State ---
const todosLosDocumentos = ref<DocumentoRecibido[]>([])
const documentosPendientes = ref<DocumentoPendiente[]>([])
const isLoading = ref(true)
const mainFilter = ref('')
const modalFilter = ref('')
const areas = ref<Area[]>([])
const pageCount = ref(0)
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 15 })

// Seguimiento
const isSeguimientoModalOpen = ref(false)
const selectedDocHistory = ref<DocumentoConHistorial | null>(null)

// Derivación
const isDerivarModalOpen = ref(false)
const docToDerive = ref<DocumentoRecibido | null>(null)
const derivarFormData = ref({ area_destino_id: '', proveido: '' })

// Responder / Finalizar (se traen del composable)
const {
  isResponderModalOpen,
  isSubmittingResponse,
  docToRespond,
  respuestaFormData,
  tiposDocumento,
  handleOpenResponderModal,
  handleFileChangeRespuesta,
  handleSubmitRespuesta,
  handleFinalizar,
  isNumeroLoading, // <- añadido desde tu primer snippet
} = useBandejaEntrada()

// --- Tabla Seguimiento ---
const seguimientoTable = useVueTable({
  get data() { return selectedDocHistory.value?.movimientos || [] },
  get columns() { return seguimientoColumns },
  getCoreRowModel: getCoreRowModel(),
})

// --- Acciones ---
async function handleRecepcionar(docId: number) {
  try {
    const response = await apiClient.post(`/documentos/${docId}/recepcionar`)
    toast.success('Éxito', { description: response.data.message })
    fetchData()
  } catch (error) {
    console.error('Error al recepcionar:', error)
    toast.error('Error', { description: 'No se pudo recepcionar el documento.' })
  }
}

async function handleSeguimiento(documento: DocumentoRecibido) {
  try {
    const response = await apiClient.get(`/documentos/${documento.id}`)
    selectedDocHistory.value = response.data
    isSeguimientoModalOpen.value = true
  } catch (error) {
    console.error('Error al cargar historial:', error)
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

// --- Tablas ---
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
    handleOpenResponderModal,
  },
})

const modalTable = useVueTable({
  get data() { return documentosPendientes.value },
  get columns() { return modalColumns },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: { get globalFilter() { return modalFilter.value } },
  meta: { handleRecepcionar },
})

// --- Fetch ---
async function fetchData() {
  isLoading.value = true
  try {
    const [resMain, resPendientes, resAreas, resTipos] = await Promise.all([
      apiClient.get(`/documentos/recibidos?page=${pagination.value.pageIndex + 1}`, {
        headers: { 'Cache-Control': 'no-cache' }
      }),
      apiClient.get('/documentos/pendientes'),
      apiClient.get('/catalogos/areas'),
      apiClient.get('/catalogos/tipos-documento'),
    ])

    todosLosDocumentos.value = resMain.data.data
    pageCount.value = resMain.data.last_page
    documentosPendientes.value = resPendientes.data
    areas.value = resAreas.data
    // 👇 ahora los tiposDocumento ya vienen del composable, no se sobreescriben
  } catch (error) {
    console.error('Error al cargar datos:', error)
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

    <!-- Modal Seguimiento -->
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

    <!-- Modal Derivar -->
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
            <Label class="text-right">Destino</Label>
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
            <Label class="text-right">Proveído</Label>
            <Textarea v-model="derivarFormData.proveido" class="col-span-3" placeholder="Escriba su proveído aquí..." />
          </div>
          <DialogFooter>
            <Button type="submit">Derivar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal Responder / Finalizar -->
    <Dialog v-model:open="isResponderModalOpen">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold">
            Responder Trámite: {{ docToRespond?.codigo_unico }}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para generar el documento de respuesta. Esta acción finalizará el trámite original.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleSubmitRespuesta">
          <div class="grid gap-6 py-4">
            <div class="grid grid-cols-3 gap-4">
              <!-- Tipo de documento -->
              <div class="flex flex-col gap-2">
                <Label>Tipo de Documento</Label>
                <Select v-model="respuestaFormData.tipo_documento_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="tipo in tiposDocumento" :key="tipo.id" :value="String(tipo.id)">
                      {{ tipo.nombre }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Nro de Documento (autogenerado) -->
              <div class="flex flex-col gap-2">
                <Label for="nro-doc-resp">Nro de Documento</Label>
                <Input id="nro-doc-resp" v-model="respuestaFormData.nro_documento" readonly class="bg-muted" />
                <p class="text-xs text-muted-foreground">
                  * Generado automáticamente
                </p>
              </div>

              <!-- Folios -->
              <div class="flex flex-col gap-2">
                <Label>Nro de Folios</Label>
                <Input v-model="respuestaFormData.nro_folios" type="number" min="1" />
              </div>
            </div>

            <!-- Destino -->
            <div class="flex flex-col gap-2">
              <Label>Destino</Label>
              <Select v-model="respuestaFormData.area_destino_id">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="area in areas" :key="area.id" :value="String(area.id)">
                    {{ area.nombre }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Asunto -->
            <div class="flex flex-col gap-2">
              <Label>Asunto</Label>
              <Textarea v-model="respuestaFormData.asunto" />
            </div>

            <!-- Archivo PDF -->
            <div class="flex flex-col gap-2">
              <Label>Adjuntar archivo de respuesta (PDF)</Label>
              <Input type="file" @change="handleFileChangeRespuesta" accept=".pdf" />
            </div>
          </div>

          <DialogFooter class="sm:justify-start gap-2">
            <Button type="submit" :disabled="isSubmittingResponse || isNumeroLoading">
              <Send class="w-4 h-4 mr-2" />
              {{ isSubmittingResponse ? "Enviando..." : "Enviar Respuesta y Finalizar" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

  </div>
</template>
