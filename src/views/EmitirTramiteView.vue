<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import apiClient from '@/services/api'
import axios from 'axios'
import { toast } from 'vue-sonner'
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

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-vue-next'

// Tables
import { type DocumentoEmitido, columns as mainColumns } from '@/components/ui/table/columns'
import { type Movimiento, columns as seguimientoColumns } from '@/components/ui/table/seguimiento-modal/Columns'
import DataTable from '@/components/ui/table/DataTable.vue'

// --- Tipos adicionales ---
interface TipoDocumento { id: number; nombre: string }
interface Area { id: number; nombre: string }
interface DocumentoConHistorial extends DocumentoEmitido { movimientos: Movimiento[] }

// --- Estado ---
const documentos = ref<DocumentoEmitido[]>([])
const isLoading = ref(true)
const pageCount = ref(0)

// 🔹 Estados de la tabla
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const globalFilter = ref('')
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 15 })

// 🔹 Estados UI
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const isNumeroLoading = ref(false)
const tiposDocumento = ref<TipoDocumento[]>([])
const areas = ref<Area[]>([])
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

// --- Tabla de seguimiento ---
const seguimientoTable = useVueTable({
  get data() { return selectedDocHistory.value?.movimientos || [] },
  get columns() { return seguimientoColumns },
  getCoreRowModel: getCoreRowModel(),
})

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
  if (!docToDerive.value || !derivarFormData.value.area_destino_id || !derivarFormData.value.proveido) {
    toast.warning('Campos incompletos', { description: 'Debe seleccionar un destino y escribir un proveído.' })
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

// --- Tabla principal ---
const mainTable = useVueTable({
  get data() { return documentos.value },
  get columns() { return mainColumns },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  manualPagination: true,
  get pageCount() { return pageCount.value },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get globalFilter() { return globalFilter.value },
    get pagination() { return pagination.value },
  },
  onSortingChange: updater =>
    (sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater),
  onColumnFiltersChange: updater =>
    (columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater),
  onPaginationChange: updater =>
    (pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater),
  meta: { handleSeguimiento, handleDerivar },
})

// --- Carga de datos ---
async function fetchDocumentos() {
  isLoading.value = true
  try {
    const response = await apiClient.get(`/documentos?page=${pagination.value.pageIndex + 1}`)
    documentos.value = response.data.data
    pageCount.value = response.data.last_page
  } catch (error) {
    console.error('Error al cargar documentos:', error)
    toast.error('Error', { description: 'No se pudieron cargar los documentos.' })
  } finally {
    isLoading.value = false
  }
}

watch(pagination, fetchDocumentos, { deep: true })

onMounted(() => {
  fetchDocumentos()
  apiClient.get('/catalogos/tipos-documento').then(res => (tiposDocumento.value = res.data))
  apiClient.get('/catalogos/areas').then(res => (areas.value = res.data))
})

// --- Formulario ---
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
  formData.append('tipo_documento_id', newDoc.value.tipo_documento_id)
  formData.append('nro_documento', newDoc.value.nro_documento)
  formData.append('asunto', newDoc.value.asunto)
  formData.append('nro_folios', newDoc.value.nro_folios.toString())
  formData.append('area_destino_id', newDoc.value.area_destino_id)
  if (newDoc.value.archivo_pdf) formData.append('archivo_pdf', newDoc.value.archivo_pdf)

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
    if (axios.isAxiosError(error) && error.response)
      errorMsg = error.response.data.message || 'Error del servidor.'
    toast.error('Error', { description: `No se pudo crear el documento: ${errorMsg}` })
  } finally {
    isSubmitting.value = false
  }
}

watch(isModalOpen, async (newValue) => {
  if (newValue === true) {
    isNumeroLoading.value = true
    try {
      const response = await apiClient.get('/documentos/siguiente-correlativo')
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
</script>

<template>
  <div class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Mis Trámites Emitidos</h1>
      <!-- Botón nuevo trámite -->
      <Dialog v-model:open="isModalOpen">
        <DialogTrigger as-child>
          <Button class="mr-30">Nuevo Trámite</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle class="text-lg font-semibold">EMITIR DOCUMENTO</DialogTitle>
            <DialogDescription>Rellene los campos para registrar un nuevo trámite.</DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleCreateDocument">
            <!-- Formulario -->
            <div class="grid gap-6 py-4">
              <!-- Tipo de doc / nro doc / folios -->
              <div class="grid grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                  <Label for="tipo-doc">Tipo de Documento</Label>
                  <Select v-model="newDoc.tipo_documento_id">
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
                <div class="flex flex-col gap-2">
                  <Label for="nro-doc">Nro de Documento</Label>
                  <Input id="nro-doc" v-model="newDoc.nro_documento" readonly class="bg-muted" />
                  <p class="text-xs text-muted-foreground">* Generado automáticamente</p>
                </div>
                <div class="flex flex-col gap-2">
                  <Label for="nro-folios">Nro de Folios</Label>
                  <Input id="nro-folios" v-model="newDoc.nro_folios" type="number" min="1" />
                </div>
              </div>
              <!-- Destino -->
              <div class="flex flex-col gap-2">
                <Label for="destino">Destino</Label>
                <Select v-model="newDoc.area_destino_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un área de destino" />
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
                <Label for="asunto">Asunto</Label>
                <Textarea id="asunto" v-model="newDoc.asunto" placeholder="Escriba el asunto del documento..." />
              </div>
              <!-- Archivo -->
              <div class="flex flex-col gap-2">
                <Label for="archivo">Adjuntar archivo en PDF</Label>
                <Input id="archivo" type="file" @change="handleFileChange" accept=".pdf" />
              </div>
            </div>
            <DialogFooter class="sm:justify-start gap-2">
              <Button type="submit" :disabled="isSubmitting || isNumeroLoading">
                <Send class="w-4 h-4 mr-2" />
                {{ isSubmitting ? "Enviando..." : "Enviar" }}
              </Button>
              <Button type="button" variant="secondary" @click="resetForm">Nuevo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>

    <!-- 🔎 Filtro global -->
    <div class="flex items-center py-4">
      <Input v-model="globalFilter" class="max-w-sm" placeholder="Buscar trámites..." />
    </div>

    <!-- 📊 Tabla -->
    <DataTable v-if="!isLoading" :table="mainTable" id="tour-step-3-tabla" />
    <div v-else class="text-center text-muted-foreground py-10">Cargando...</div>

    <!-- Seguimiento -->
    <Dialog v-model:open="isSeguimientoModalOpen">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Seguimiento del Trámite: {{ selectedDocHistory?.codigo_unico }}</DialogTitle>
          <DialogDescription>Asunto: {{ selectedDocHistory?.asunto }}</DialogDescription>
        </DialogHeader>
        <div class="py-4 max-h-[70vh] overflow-y-auto">
          <DataTable v-if="selectedDocHistory" :table="seguimientoTable" />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Derivar -->
    <Dialog v-model:open="isDerivarModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Derivar Documento: {{ docToDerive?.codigo_unico }}</DialogTitle>
          <DialogDescription>Seleccione un destino y añada un proveído.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleDerivarSubmit" class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="destino-derivar" class="text-right">Destino</Label>
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
            <Label for="proveido-derivar" class="text-right">Proveído</Label>
            <Textarea id="proveido-derivar" v-model="derivarFormData.proveido" class="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit">Derivar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
